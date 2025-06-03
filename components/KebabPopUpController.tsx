import { useSafeSelector } from '../shared/hooks/useSafeSelector';
import {ActorRefFrom} from 'xstate';
import {
  selectAcceptingBindingOtp,
  selectBindingAuthFailedError,
  selectBindingWarning,
  selectIsCommunicationDetails,
  selectIsPinned,
  selectKebabPopUp,
  selectRemoveWalletWarning,
  selectShowActivities,
  selectWalletBindingResponse,
  selectShowWalletBindingError,
  selectWalletBindingInProgress,
  selectOtpError,
  selectWalletBindingError,
} from '../machines/VerifiableCredential/VCItemMachine/VCItemSelectors';
import {selectActivities} from '../machines/activityLog';
import {GlobalContext} from '../shared/GlobalContext';
import {useContext} from 'react';
import {VCMetadata} from '../shared/VCMetadata';
import {ScanEvents} from '../machines/bleShare/scan/scanMachine';
import {BOTTOM_TAB_ROUTES, ScanStackParamList} from '../routes/routesConstants';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {MainBottomTabParamList} from '../routes/routeTypes';
import {selectIsScanning} from '../machines/bleShare/scan/scanSelectors';
import {
  VCItemEvents,
  VCItemMachine,
} from '../machines/VerifiableCredential/VCItemMachine/VCItemMachine';

type ScanLayoutNavigation = NavigationProp<
  ScanStackParamList & MainBottomTabParamList
>;

export function useKebabPopUp(props) {
  const service = props.service as ActorRefFrom<typeof VCItemMachine>;
  const navigation = useNavigation<ScanLayoutNavigation>();
  const {appService} = useContext(GlobalContext);
  const activityLogService = appService.children.get('activityLog')!!;
  const scanService = appService.children.get('scan')!!;

  return {
    service: props.service as ActorRefFrom<typeof VCItemMachine>,
    navigation: useNavigation<ScanLayoutNavigation>(),
    isScanning: useSafeSelector(scanService, selectIsScanning),
    activities: useSafeSelector(activityLogService, selectActivities),
    isPinned: useSafeSelector(service, selectIsPinned),
    isBindingWarning: useSafeSelector(service, selectBindingWarning),
    isRemoveWalletWarning: useSafeSelector(service, selectRemoveWalletWarning),
    isAcceptingOtpInput: useSafeSelector(service, selectAcceptingBindingOtp),
    isWalletBindingError: useSafeSelector(service, selectShowWalletBindingError),
    walletBindingResponse: useSafeSelector(service, selectWalletBindingResponse),
    otpError: useSafeSelector(service, selectOtpError),
    walletBindingError: useSafeSelector(service, selectWalletBindingError),
    bindingAuthFailedError: useSafeSelector(service, selectBindingAuthFailedError),
    isKebabPopUp: useSafeSelector(service, selectKebabPopUp),
    isShowActivities: useSafeSelector(service, selectShowActivities),
    communicationDetails: useSafeSelector(service, selectIsCommunicationDetails),
    walletBindingInProgress: useSafeSelector(
      service,
      selectWalletBindingInProgress,
    ),
    PIN_CARD: () => service.send(VCItemEvents.PIN_CARD()),
    KEBAB_POPUP: () => service.send(VCItemEvents.KEBAB_POPUP()),
    ADD_WALLET_BINDING_ID: () =>
      service.send(VCItemEvents.ADD_WALLET_BINDING_ID()),
    CONFIRM: () => service.send(VCItemEvents.CONFIRM()),
    REMOVE: (vcMetadata: VCMetadata) =>
      service.send(VCItemEvents.REMOVE(vcMetadata)),
    DISMISS: () => service.send(VCItemEvents.DISMISS()),
    CANCEL: () => service.send(VCItemEvents.CANCEL()),
    SHOW_ACTIVITY: () => service.send(VCItemEvents.SHOW_ACTIVITY()),
    INPUT_OTP: (otp: string) => service.send(VCItemEvents.INPUT_OTP(otp)),
    RESEND_OTP: () => service.send(VCItemEvents.RESEND_OTP()),
    GOTO_SCANSCREEN: () => {
      navigation.navigate(BOTTOM_TAB_ROUTES.share);
    },
    SELECT_VC_ITEM: (
      vcRef: ActorRefFrom<typeof VCItemMachine>,
      flowType: string,
    ) => {
      const {serviceRefs, ...vcData} = vcRef.getSnapshot().context;
      scanService.send(ScanEvents.SELECT_VC(vcData, flowType));
    },
  };
}
