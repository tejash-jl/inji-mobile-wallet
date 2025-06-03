import { useSafeSelector } from '../../shared/hooks/useSafeSelector';
import {useContext, useState} from 'react';
import {ActorRefFrom} from 'xstate';
import {QrLoginEvents} from '../../machines/QrLogin/QrLoginMachine';
import {
  selectClientName,
  selectErrorMessage,
  selectEssentialClaims,
  selectIsFaceVerificationConsent,
  selectIsInvalidIdentity,
  selectIsisVerifyingIdentity,
  selectIsLinkTransaction,
  selectIsloadMyVcs,
  selectIsRequestConsent,
  selectIsSendingAuthenticate,
  selectIsSendingConsent,
  selectIsSharing,
  selectIsShowError,
  selectIsShowingVcList,
  selectIsVerifyingSuccesful,
  selectIsWaitingForData,
  selectLinkTransactionResponse,
  selectLogoUrl,
  selectDomainName,
  selectVoluntaryClaims,
  selectCredential,
  selectVerifiableCredentialData,
  selectIsQrLoginViaDeepLink,
} from '../../machines/QrLogin/QrLoginSelectors';
import {selectBindedVcsMetadata} from '../../machines/VerifiableCredential/VCMetaMachine/VCMetaSelectors';
import {GlobalContext} from '../../shared/GlobalContext';
import {QrLoginProps} from './QrLogin';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {RootRouteProps} from '../../routes';
import {BOTTOM_TAB_ROUTES} from '../../routes/routesConstants';
import {VCItemMachine} from '../../machines/VerifiableCredential/VCItemMachine/VCItemMachine';

type MyVcsTabNavigation = NavigationProp<RootRouteProps>;

export function useQrLogin({service}: QrLoginProps) {
  const {appService} = useContext(GlobalContext);
  const navigation = useNavigation<MyVcsTabNavigation>();

  const vcMetaService = appService.children.get('vcMeta')!!;
  const [selectedIndex, setSelectedIndex] = useState<number>(null);
  return {
    isFaceVerificationConsent: useSafeSelector(
      service,
      selectIsFaceVerificationConsent,
    ),
    linkTransactionResponse: useSafeSelector(
      service,
      selectLinkTransactionResponse,
    ),
    shareableVcsMetadata: useSafeSelector(vcMetaService, selectBindedVcsMetadata),
    verifiableCredentialData: useSafeSelector(
      service,
      selectVerifiableCredentialData,
    ),
    isQrLoginViaDeepLink: useSafeSelector(service, selectIsQrLoginViaDeepLink),
    domainName: useSafeSelector(service, selectDomainName),
    logoUrl: useSafeSelector(service, selectLogoUrl),
    essentialClaims: useSafeSelector(service, selectEssentialClaims),
    voluntaryClaims: useSafeSelector(service, selectVoluntaryClaims),
    clientName: useSafeSelector(service, selectClientName),
    error: useSafeSelector(service, selectErrorMessage),
    selectCredential: useSafeSelector(service, selectCredential),
    isWaitingForData: useSafeSelector(service, selectIsWaitingForData),
    isShowingVcList: useSafeSelector(service, selectIsShowingVcList),
    isLinkTransaction: useSafeSelector(service, selectIsLinkTransaction),
    isLoadingMyVcs: useSafeSelector(service, selectIsloadMyVcs),
    isRequestConsent: useSafeSelector(service, selectIsRequestConsent),
    isShowingError: useSafeSelector(service, selectIsShowError),
    isSendingAuthenticate: useSafeSelector(service, selectIsSendingAuthenticate),
    isSendingConsent: useSafeSelector(service, selectIsSendingConsent),
    isVerifyingIdentity: useSafeSelector(service, selectIsisVerifyingIdentity),
    isInvalidIdentity: useSafeSelector(service, selectIsInvalidIdentity),
    isVerifyingSuccesful: useSafeSelector(service, selectIsVerifyingSuccesful),
    isShare: useSafeSelector(service, selectIsSharing),
    selectedIndex,
    SELECT_CONSENT: (value: boolean, claim: string) => {
      service.send(QrLoginEvents.TOGGLE_CONSENT_CLAIM(value, claim));
    },
    SELECT_VC_ITEM:
      (index: number) => (vcRef: ActorRefFrom<typeof VCItemMachine>) => {
        setSelectedIndex(index);
        const vcData = vcRef.getSnapshot().context;
        service.send(QrLoginEvents.SELECT_VC(vcData));
      },
    FACE_VERIFICATION_CONSENT: (isDoNotAskAgainChecked: boolean) =>
      service.send(
        QrLoginEvents.FACE_VERIFICATION_CONSENT(isDoNotAskAgainChecked),
      ),
    DISMISS: () => service.send(QrLoginEvents.DISMISS()),
    SCANNING_DONE: (qrCode: string) =>
      service.send(QrLoginEvents.SCANNING_DONE(qrCode)),
    CONFIRM: () => service.send(QrLoginEvents.CONFIRM()),
    VERIFY: () => service.send(QrLoginEvents.VERIFY()),
    CANCEL: () => service.send(QrLoginEvents.CANCEL()),
    FACE_VALID: () => service.send(QrLoginEvents.FACE_VALID()),
    FACE_INVALID: () => service.send(QrLoginEvents.FACE_INVALID()),
    RETRY_VERIFICATION: () => service.send(QrLoginEvents.RETRY_VERIFICATION()),
    GO_TO_HOME: () => {
      navigation.navigate(BOTTOM_TAB_ROUTES.home, {screen: 'HomeScreen'});
    },
  };
}
