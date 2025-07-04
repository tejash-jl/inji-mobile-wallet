import { useSafeSelector } from '../shared/hooks/useSafeSelector';
import {
  selectIsPasscodeUnlock,
  selectIsBiometricUnlock,
  SettingsEvents,
} from '../machines/settings';
import {useContext} from 'react';
import {GlobalContext} from '../shared/GlobalContext';
import {VcMetaEvents} from '../machines/VerifiableCredential/VCMetaMachine/VCMetaMachine';
import {
  selectIsDownloadingFailed,
  selectIsDownloadingSuccess,
  selectWalletBindingSuccess,
} from '../machines/VerifiableCredential/VCMetaMachine/VCMetaSelectors';
import {selectVerificationStatus} from '../machines/VerifiableCredential/VCItemMachine/VCItemSelectors';

export const UseBannerNotification = () => {
  const {appService} = useContext(GlobalContext);
  const settingsService = appService.children.get('settings')!!;
  const vcMetaService = appService.children.get('vcMeta')!!;

  return {
    isBindingSuccess: useSafeSelector(vcMetaService, selectWalletBindingSuccess),
    verificationStatus: useSafeSelector(vcMetaService, selectVerificationStatus),
    isPasscodeUnlock: useSafeSelector(settingsService, selectIsPasscodeUnlock),

    isBiometricUnlock: useSafeSelector(settingsService, selectIsBiometricUnlock),
    isDownloadingSuccess: useSafeSelector(vcMetaService, selectIsDownloadingSuccess),
    isDownloadingFailed: useSafeSelector(vcMetaService, selectIsDownloadingFailed),
    DISMISS: () => {
      settingsService.send(SettingsEvents.DISMISS());
    },
    RESET_WALLET_BINDING_SUCCESS: () =>
      vcMetaService.send(VcMetaEvents.RESET_WALLET_BINDING_SUCCESS()),
    RESET_VERIFICATION_STATUS: () =>
      vcMetaService.send(VcMetaEvents.RESET_VERIFICATION_STATUS(null)),
    RESET_DOWNLOADING_FAILED: () => {
      vcMetaService.send(VcMetaEvents.RESET_DOWNLOADING_FAILED());
    },
    RESET_DOWNLOADING_SUCCESS: () => {
      vcMetaService.send(VcMetaEvents.RESET_DOWNLOADING_SUCCESS());
    },
  };
};
