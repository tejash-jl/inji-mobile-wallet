import Cloud from '../../shared/CloudBackupAndRestoreUtils';
import {CACHED_API} from '../../shared/api';
import NetInfo from '@react-native-community/netinfo';
import {
  constructAuthorizationConfiguration,
  constructIssuerMetaData,
  constructProofJWT,
  hasKeyPair,
  OIDCErrors,
  updateCredentialInformation,
  vcDownloadTimeout,
} from '../../shared/openId4VCI/Utils';
import {authorize} from 'react-native-app-auth';
import {
  decryptJson,
  decryptJson2,
  fetchKeyPair,
  generateKeyPair,
} from '../../shared/cryptoutil/cryptoUtil';
import {NativeModules} from 'react-native';
import {
  VerificationErrorMessage,
  VerificationErrorType,
  verifyCredential,
} from '../../shared/vcjs/verifyCredential';
import {
  getImpressionEventData,
  sendImpressionEvent,
} from '../../shared/telemetry/TelemetryUtils';
import {TelemetryConstants} from '../../shared/telemetry/TelemetryConstants';
import {VciClient} from '../../shared/vciClient/VciClient';
import {isMockVC} from '../../shared/Utils';
import {VCFormat} from '../../shared/VCFormat';
import Storage, {MMKV} from '../../shared/storage';
import React from 'react';
import {GlobalContext} from '../../shared/GlobalContext';

export const IssuersService = () => {
  return {
    isUserSignedAlready: () => async () => {
      return await Cloud.isSignedInAlready();
    },
    downloadIssuersList: async () => {
      return await CACHED_API.fetchIssuers();
    },
    checkInternet: async () => await NetInfo.fetch(),
    downloadIssuerWellknown: async (context: any) => {
      const wellknownResponse = await CACHED_API.fetchIssuerWellknownConfig(
        context.selectedIssuerId,
      );
      return wellknownResponse;
    },
    downloadCredentialTypes: async (context: any) => {
      const credentialTypes = [];
      for (const key in context.selectedIssuer
        .credential_configurations_supported) {
        credentialTypes.push({
          id: key,
          ...context.selectedIssuer.credential_configurations_supported[key],
        });
      }
      if (credentialTypes.length == 0)
        throw new Error(
          `No credential type found for issuer ${context.selectedIssuer.credential_issuer}`,
        );

      return credentialTypes;
    },
    fetchAuthorizationEndpoint: async (context: any) => {
      /**
       * Incase of multiple entries of authorization_servers, each element is iterated and metadata check is made for support with wallet.
       * For now, its been kept as getting first entry and checking for matching grant_types_supported
       */
      const authorizationServer =
        context.selectedIssuerWellknownResponse['authorization_servers'][0];
      const authorizationServerMetadata =
        await CACHED_API.fetchIssuerAuthorizationServerMetadata(
          authorizationServer,
        );
      const SUPPORTED_GRANT_TYPES = ['authorization_code'];
      if (
        (
          authorizationServerMetadata['grant_types_supported'] as Array<string>
        ).filter(grantType => SUPPORTED_GRANT_TYPES.includes(grantType))
          .length === 0
      ) {
        throw new Error(
          OIDCErrors.AUTHORIZATION_ENDPOINT_DISCOVERY.GRANT_TYPE_NOT_SUPPORTED,
        );
      }

      return authorizationServerMetadata['authorization_endpoint'];
    },
    downloadCredential: async (context: any) => {
      const downloadTimeout = await vcDownloadTimeout();
      const accessToken: string = context.tokenResponse?.accessToken;
      const proofJWT = await constructProofJWT(
        context.publicKey,
        context.privateKey,
        accessToken,
        context.selectedIssuer,
        context.keyType,
      );
      let credential = await VciClient.downloadCredential(
        constructIssuerMetaData(
          context.selectedIssuer,
          context.selectedCredentialType,
          downloadTimeout,
        ),
        proofJWT,
        accessToken,
      );

      console.info(`VC download via ${context.selectedIssuerId} is successful`);
      console.log('VC: context.encryptionKey:', context.encryptionKey);
      return await updateCredentialInformation(context, credential);
    },
    invokeAuthorization: async (context: any) => {
      sendImpressionEvent(
        getImpressionEventData(
          TelemetryConstants.FlowType.vcDownload,
          context.selectedIssuer.credential_issuer +
            TelemetryConstants.Screens.webViewPage,
        ),
      );
      return await authorize(
        constructAuthorizationConfiguration(
          context.selectedIssuer,
          context.selectedCredentialType.scope,
        ),
      );
    },

    getKeyOrderList: async () => {
      const {RNSecureKeystoreModule} = NativeModules;
      const keyOrder = JSON.parse(
        (await RNSecureKeystoreModule.getData('keyPreference'))[1],
      );
      return keyOrder;
    },

    generateKeyPair: async (context: any) => {
      const keypair = await generateKeyPair(context.keyType);
      return keypair;
    },

    getKeyPair: async (context: any) => {
      if (context.keyType === '') {
        throw new Error('key type not found');
      } else if (!!(await hasKeyPair(context.keyType))) {
        return await fetchKeyPair(context.keyType);
      }
    },

    getSelectedKey: async (context: any) => {
      return context.keyType;
    },

    verifyCredential: async (context: any) => {
      console.log('Pintu Kumar Verifying credential:', context);
      //TODO: Remove bypassing verification of mock VCs once mock VCs are verifiable
      if (
        context.selectedCredentialType.format === VCFormat.mso_mdoc ||
        !isMockVC(context.selectedIssuerId)
      ) {
        const verificationResult = await verifyCredential(
          context.verifiableCredential?.credential,
          context.selectedCredentialType.format,
        );
        if (!verificationResult.isVerified) {
          throw new Error(verificationResult.verificationErrorCode);
        }
        return verificationResult;
      } else {
        return {
          isVerified: true,
          verificationMessage: VerificationErrorMessage.NO_ERROR,
          verificationErrorCode: VerificationErrorType.NO_ERROR,
        };
      }
    },

    checkForDuplicateCredential: async (context: any) => {
      console.log('Pintu Kumar Checking for duplicate credential:', context);

      const newCredential = context.verifiableCredential;
      console.log('New Credential:', newCredential);

      const encryptionKey = context.encryptionKey;
      console.log('Encryption Key:Pintu Kumar :', encryptionKey);

      const areCredentialSubjectsEqual = (
        subject1: any,
        subject2: any,
      ): boolean => {
        console.log('Comparing Credential Subjects:', subject1, subject2);
        console.log('>>>>>>.sub1', subject1);
        console.log('>>>>>>.sub2', subject2);

        // Separate the 'type' property as in the original function
        const {type: type1, ...rest1} = subject1;
        const {type: type2, ...rest2} = subject2;

        // Check if the number of keys in both objects is the same
        const keys1 = Object.keys(rest1);
        const keys2 = Object.keys(rest2);

        if (keys1.length !== keys2.length) {
          console.log(">>>>>>>>>>>>> false: Key counts don't match");
          return false;
        }

        // Iterate through the keys and compare their values
        for (const key of keys1) {
          // Check if the other object has the key and if the values are identical
          if (!rest2.hasOwnProperty(key) || rest1[key] !== rest2[key]) {
            console.log(`>>>>>>>>>>>>> false: Mismatch at key '${key}'`);
            return false;
          }
        }

        // If all checks pass, the objects are a match
        console.log('>>>>>>>>>>>>> true: All keys and values match');
        return true;
      };

      try {
        const keys = await MMKV.indexer.strings.getKeys();
        const vcKeys = keys.filter(key => key.startsWith('VC_'));

        const newCredentialSubject =
          newCredential?.credential?.credentialSubject;
        console.log('New Credential Subject:', newCredentialSubject);
        if (!newCredentialSubject) return false;

        for (const key of vcKeys) {
          const storedVcData = await Storage.getItem(key, encryptionKey);
          console.log('Stored VC Data for key:', key, storedVcData);
          if (storedVcData) {
            const decryptedValue = await decryptJson(
              encryptionKey,
              storedVcData,
            );
            console.log('Decrypted Value:', decryptedValue);
            const storedCredential = JSONSerialization(decryptedValue);
            console.log('Stored Credential:', storedCredential);
            const storedCredentialSubject =
              storedCredential.verifiableCredential.credential
                .credentialSubject;
            console.log('Credential Subject:', storedCredentialSubject);
            console.log(
              'verifiableCredential:',
              storedCredential.verifiableCredential,
            );

            console.log('Checking for duplicates...');

            console.log('Stored Credential Subject:', storedCredentialSubject);
            console.log('New Credential Subject:', newCredentialSubject);

            if (storedCredentialSubject) {
              console.log('Stored Credential Subject exists.');
            } else {
              console.log(
                'Stored Credential Subject is falsy (null or undefined).',
              );
            }

            const areEqual = areCredentialSubjectsEqual(
              newCredentialSubject,
              storedCredentialSubject,
            );
            console.log('Result of areCredentialSubjectsEqual:', areEqual);

            if (storedCredentialSubject && areEqual) {
              console.log('Duplicate found!');
              return true; // Duplicate found
            }

            console.log('No duplicate found in this iteration.');
          }
        }
        return false; // No duplicate found
      } catch (error) {
        console.error('Error checking for duplicate credential:', error);
        return false;
      }
    },
  };
};

function JSONSerialization(decryptedValue: string) {
  try {
    if (typeof decryptedValue === 'string') {
      return JSON.parse(decryptedValue);
    }
    return decryptedValue;
  } catch (e) {
    console.error('Failed to parse decrypted value:', e);
    return decryptedValue;
  }
}
