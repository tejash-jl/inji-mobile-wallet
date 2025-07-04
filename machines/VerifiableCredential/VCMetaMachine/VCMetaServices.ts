import Cloud from '../../../shared/CloudBackupAndRestoreUtils';
import {
verifyCredential,
} from '../../../shared/vcjs/verifyCredential';

export const VCMetaServices = () => {
  return {
    isUserSignedAlready: () => async () => {
      return await Cloud.isSignedInAlready();
    },

    verifyCredential: async (context: any) => {
      const myVcs = context.myVcs || {};
      const vcKeys = Object.keys(myVcs);

      if (vcKeys.length === 0) {
        throw new Error('No VCs available in context');
      }

      const verificationResults = await Promise.all(
        vcKeys.map(async (vcKey) => {
          const vcEntry = myVcs[vcKey];
          const credential = vcEntry?.verifiableCredential?.credential;
          const format = vcEntry?.format;

          if (!credential || !format) {
            console.warn(`Skipping VC with key ${vcKey}: missing credential or format`);
            return null;
          }

          try {
            const result = await verifyCredential(credential, format);
            return {
              vcKey,
              ...result,
            };
          } catch (err) {
            console.error(`Verification failed for VC ${vcKey}:`, err);
            return {
              vcKey,
              isVerified: false,
              verificationErrorCode: 'VERIFICATION_FAILED',
            };
          }
        })
      );

      return verificationResults.filter(Boolean);
    },
  };
};
