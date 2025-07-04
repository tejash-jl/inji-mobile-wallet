import { useSafeSelector } from '../../shared/hooks/useSafeSelector';
import {
  selectSupportedCredentialTypes,
  selectErrorMessageType,
  selectIsBiometricCancelled,
  selectIsDone,
  selectIsDownloadCredentials,
  selectIsIdle,
  selectIssuers,
  selectIsError,
  selectLoadingReason,
  selectSelectedIssuer,
  selectSelectingCredentialType,
  selectStoring,
  selectVerificationErrorMessage,
  selectIsNonGenericError,
} from '../../machines/Issuers/IssuersSelectors';
import {ActorRefFrom} from 'xstate';
import {BOTTOM_TAB_ROUTES} from '../../routes/routesConstants';
import {logState} from '../../shared/commonUtil';
import {isAndroid} from '../../shared/constants';
import {
  IssuerScreenTabEvents,
  IssuersMachine,
} from '../../machines/Issuers/IssuersMachine';
import {CredentialTypes} from '../../machines/VerifiableCredential/VCMetaMachine/vc';

export function useIssuerScreenController({route, navigation}) {
  const service = route.params.service;
  service.subscribe(logState);

  return {
    issuers: useSafeSelector(service, selectIssuers),
    selectedIssuer: useSafeSelector(service, selectSelectedIssuer),
    errorMessageType: useSafeSelector(service, selectErrorMessageType),
    isDownloadingCredentials: useSafeSelector(service, selectIsDownloadCredentials),
    isBiometricsCancelled: useSafeSelector(service, selectIsBiometricCancelled),
    isDone: useSafeSelector(service, selectIsDone),
    isIdle: useSafeSelector(service, selectIsIdle),
    isNonGenericError: useSafeSelector(service, selectIsNonGenericError),
    loadingReason: useSafeSelector(service, selectLoadingReason),
    isStoring: useSafeSelector(service, selectStoring),
    isSelectingCredentialType: useSafeSelector(
      service,
      selectSelectingCredentialType,
    ),
    supportedCredentialTypes: useSafeSelector(
      service,
      selectSupportedCredentialTypes,
    ),
    verificationErrorMessage: useSafeSelector(
      service,
      selectVerificationErrorMessage,
    ),
    isError: useSafeSelector(service, selectIsError),

    CANCEL: () => service.send(IssuerScreenTabEvents.CANCEL()),
    SELECTED_ISSUER: id =>
      service.send(IssuerScreenTabEvents.SELECTED_ISSUER(id)),
    TRY_AGAIN: () => service.send(IssuerScreenTabEvents.TRY_AGAIN()),
    RESET_ERROR: () => service.send(IssuerScreenTabEvents.RESET_ERROR()),
    DOWNLOAD_ID: () => {
      service.send(IssuerScreenTabEvents.DOWNLOAD_ID());
      navigation.navigate(BOTTOM_TAB_ROUTES.home, {screen: 'HomeScreen'});
    },
    SELECTED_CREDENTIAL_TYPE: (credType: CredentialTypes) =>
      service.send(IssuerScreenTabEvents.SELECTED_CREDENTIAL_TYPE(credType)),
    RESET_VERIFY_ERROR: () => {
      service.send(IssuerScreenTabEvents.RESET_VERIFY_ERROR());
      if (isAndroid()) {
        navigation.navigate(BOTTOM_TAB_ROUTES.home, {screen: 'HomeScreen'});
      } else {
        setTimeout(
          () =>
            navigation.navigate(BOTTOM_TAB_ROUTES.home, {screen: 'HomeScreen'}),
          0,
        );
      }
    },
  };
}

export interface IssuerModalProps {
  service?: ActorRefFrom<typeof IssuersMachine>;
  onPress?: () => void;
  isVisible?: boolean;
}
