import { useSafeSelector } from '../../shared/hooks/useSafeSelector';
import {useContext} from 'react';
import {ActorRefFrom} from 'xstate';
import {
  selectAreAllVcsDownloaded,
  selectDownloadingFailedVcs,
  selectInProgressVcDownloads,
  selectIsRefreshingMyVcs,
  selectIsTampered,
  selectMyVcs,
  selectMyVcsMetadata,
  selectVerificationErrorMessage,
  selectWalletBindingSuccess,
} from '../../machines/VerifiableCredential/VCMetaMachine/VCMetaSelectors';
import {
  selectWalletBindingError,
  selectShowWalletBindingError,
} from '../../machines/VerifiableCredential/VCItemMachine/VCItemSelectors';
import {GlobalContext} from '../../shared/GlobalContext';
import {HomeScreenTabProps} from './HomeScreen';
import {
  MyVcsTabEvents,
  MyVcsTabMachine,
  selectAddVcModal,
  selectGetVcModal,
  selectIsNetworkOff,
  selectIsRequestSuccessful,
} from './MyVcsTabMachine';
import {
  selectShowHardwareKeystoreNotExistsAlert,
  SettingsEvents,
} from '../../machines/settings';
import {VCItemMachine} from '../../machines/VerifiableCredential/VCItemMachine/VCItemMachine';
import {VcMetaEvents} from '../../machines/VerifiableCredential/VCMetaMachine/VCMetaMachine';
import {
  AuthEvents,
  selectIsInitialDownload,
  selectIsOnboarding,
} from '../../machines/auth';

export function useMyVcsTab(props: HomeScreenTabProps) {
  const service = props.service as ActorRefFrom<typeof MyVcsTabMachine>;
  const {appService} = useContext(GlobalContext);
  const vcMetaService = appService.children.get('vcMeta')!!;
  const settingsService = appService.children.get('settings')!!;
  const authService = appService.children.get('auth');

  return {
    service,
    AddVcModalService: useSafeSelector(service, selectAddVcModal),
    GetVcModalService: useSafeSelector(service, selectGetVcModal),
    vcMetadatas: useSafeSelector(vcMetaService, selectMyVcsMetadata),
    isRefreshingVcs: useSafeSelector(vcMetaService, selectIsRefreshingMyVcs),
    isRequestSuccessful: useSafeSelector(service, selectIsRequestSuccessful),
    walletBindingError: useSafeSelector(service, selectWalletBindingError),
    isBindingError: useSafeSelector(service, selectShowWalletBindingError),
    isBindingSuccess: useSafeSelector(vcMetaService, selectWalletBindingSuccess),
    isNetworkOff: useSafeSelector(service, selectIsNetworkOff),
    inProgressVcDownloads: useSafeSelector(
      vcMetaService,
      selectInProgressVcDownloads,
    ),
    areAllVcsLoaded: useSafeSelector(vcMetaService, selectAreAllVcsDownloaded),
    isTampered: useSafeSelector(vcMetaService, selectIsTampered),
    downloadFailedVcs: useSafeSelector(vcMetaService, selectDownloadingFailedVcs),
    vcData: useSafeSelector(vcMetaService, selectMyVcs),
    showHardwareKeystoreNotExistsAlert: useSafeSelector(
      settingsService,
      selectShowHardwareKeystoreNotExistsAlert,
    ),
    verificationErrorMessage: useSafeSelector(
      vcMetaService,
      selectVerificationErrorMessage,
    ),

    SET_STORE_VC_ITEM_STATUS: () =>
      service.send(MyVcsTabEvents.SET_STORE_VC_ITEM_STATUS()),

    RESET_STORE_VC_ITEM_STATUS: () =>
      service.send(MyVcsTabEvents.RESET_STORE_VC_ITEM_STATUS()),

    RESET_IN_PROGRESS_VCS_DOWNLOADED: () =>
      vcMetaService.send(VcMetaEvents.RESET_IN_PROGRESS_VCS_DOWNLOADED()),

    DISMISS: () => service.send(MyVcsTabEvents.DISMISS()),

    TRY_AGAIN: () => service.send(MyVcsTabEvents.TRY_AGAIN()),

    DOWNLOAD_ID: () => service.send(MyVcsTabEvents.ADD_VC()),

    GET_VC: () => service.send(MyVcsTabEvents.GET_VC()),

    REFRESH: () => vcMetaService.send(VcMetaEvents.REFRESH_MY_VCS()),

    VIEW_VC: (vcRef: ActorRefFrom<typeof VCItemMachine>) => {
      return service.send(MyVcsTabEvents.VIEW_VC(vcRef));
    },

    DISMISS_WALLET_BINDING_NOTIFICATION_BANNER: () =>
      vcMetaService?.send(VcMetaEvents.RESET_WALLET_BINDING_SUCCESS()),

    ACCEPT_HARDWARE_SUPPORT_NOT_EXISTS: () =>
      settingsService.send(SettingsEvents.ACCEPT_HARDWARE_SUPPORT_NOT_EXISTS()),

    REMOVE_TAMPERED_VCS: () =>
      vcMetaService?.send(VcMetaEvents.REMOVE_TAMPERED_VCS()),

    DELETE_VC: () => vcMetaService?.send(VcMetaEvents.DELETE_VC()),

    RESET_VERIFY_ERROR: () => {
      vcMetaService?.send(VcMetaEvents.RESET_VERIFY_ERROR());
    },
    SET_TOUR_GUIDE: set => {
      authService?.send(AuthEvents.SET_TOUR_GUIDE(set));
    },
    isOnboarding: authService && useSafeSelector(authService, selectIsOnboarding),
    isInitialDownloading:
      authService && useSafeSelector(authService, selectIsInitialDownload),
  };
}
