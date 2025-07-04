import { useSafeSelector } from '../../shared/hooks/useSafeSelector';
import {useContext} from 'react';
import {useTranslation} from 'react-i18next';
import {selectShareableVcsMetadata} from '../../machines/VerifiableCredential/VCMetaMachine/VCMetaSelectors';
import {GlobalContext} from '../../shared/GlobalContext';
import {
  selectIsLocationDenied,
  selectIsLocationDisabled,
  selectIsQrLoginStoring,
  selectIsScanning,
  selectIsInvalid,
  selectIsShowQrLogin,
  selectQrLoginRef,
  selectIsQuickShareDone,
  selectShowQuickShareSuccessBanner,
} from '../../machines/bleShare/scan/scanSelectors';
import {
  selectIsBluetoothDenied,
  selectIsNearByDevicesPermissionDenied,
  selectReadyForBluetoothStateCheck,
  selectIsBluetoothPermissionDenied,
  selectIsStartPermissionCheck,
  selectIsLocationPermissionRationale,
} from '../../machines/bleShare/commonSelectors';
import {ScanEvents} from '../../machines/bleShare/scan/scanMachine';
import {selectIsMinimumStorageRequiredForAuditEntryLimitReached} from '../../machines/bleShare/scan/scanSelectors';
import {BOTTOM_TAB_ROUTES} from '../../routes/routesConstants';
import {MainBottomTabParamList} from '../../routes/routeTypes';
import {useNavigation, NavigationProp} from '@react-navigation/native';

export function useScanScreen() {
  const {t} = useTranslation('ScanScreen');
  const {appService} = useContext(GlobalContext);
  const scanService = appService.children.get('scan')!!;
  const vcMetaService = appService.children.get('vcMeta')!!;

  const shareableVcsMetadata = useSafeSelector(
    vcMetaService,
    selectShareableVcsMetadata,
  );

  const isLocationDisabled = useSafeSelector(scanService, selectIsLocationDisabled);
  const isLocationDenied = useSafeSelector(scanService, selectIsLocationDenied);
  const isReadyForBluetoothStateCheck = useSafeSelector(
    scanService,
    selectReadyForBluetoothStateCheck,
  );
  const isStartPermissionCheck = useSafeSelector(
    scanService,
    selectIsStartPermissionCheck,
  );
  const isNearByDevicesPermissionDenied = useSafeSelector(
    scanService,
    selectIsNearByDevicesPermissionDenied,
  );
  const isBluetoothPermissionDenied = useSafeSelector(
    scanService,
    selectIsBluetoothPermissionDenied,
  );
  const isBluetoothDenied = useSafeSelector(scanService, selectIsBluetoothDenied);
  const locationError = {message: '', button: ''};
  const isMinimumStorageRequiredForAuditEntryLimitReached = useSafeSelector(
    scanService,
    selectIsMinimumStorageRequiredForAuditEntryLimitReached,
  );

  if (isLocationDisabled) {
    locationError.message = t('errors.locationDisabled.message');
    locationError.button = t('errors.locationDisabled.button');
  } else if (isLocationDenied) {
    locationError.message = t('errors.locationDenied.message');
    locationError.button = t('errors.locationDenied.button');
  }
  type ScanScreenNavigation = NavigationProp<MainBottomTabParamList>;
  const navigation = useNavigation<ScanScreenNavigation>();
  const GOTO_HOME = () => navigation.navigate(BOTTOM_TAB_ROUTES.home);
  const ALLOWED = () => scanService.send(ScanEvents.ALLOWED());
  const DENIED = () => scanService.send(ScanEvents.DENIED());
  const isLocalPermissionRational = useSafeSelector(
    scanService,
    selectIsLocationPermissionRationale,
  );
  return {
    locationError,
    isEmpty: !shareableVcsMetadata.length,
    isBluetoothPermissionDenied,
    isNearByDevicesPermissionDenied,
    isLocationDisabled,
    isLocationDenied,
    isBluetoothDenied,
    isStartPermissionCheck,
    isReadyForBluetoothStateCheck,
    isMinimumStorageRequiredForAuditEntryLimitReached,
    isScanning: useSafeSelector(scanService, selectIsScanning),
    isQuickShareDone: useSafeSelector(scanService, selectIsQuickShareDone),
    showQuickShareSuccessBanner: useSafeSelector(
      scanService,
      selectShowQuickShareSuccessBanner,
    ),
    selectIsInvalid: useSafeSelector(scanService, selectIsInvalid),
    isQrLogin: useSafeSelector(scanService, selectIsShowQrLogin),
    isQrLoginstoring: useSafeSelector(scanService, selectIsQrLoginStoring),
    isQrRef: useSafeSelector(scanService, selectQrLoginRef),
    LOCATION_REQUEST: () => scanService.send(ScanEvents.LOCATION_REQUEST()),
    GOTO_SETTINGS: () => scanService.send(ScanEvents.GOTO_SETTINGS()),
    DISMISS: () => scanService.send(ScanEvents.DISMISS()),
    DISMISS_QUICK_SHARE_BANNER: () =>
      scanService.send(ScanEvents.DISMISS_QUICK_SHARE_BANNER()),
    START_PERMISSION_CHECK: () =>
      scanService.send(ScanEvents.START_PERMISSION_CHECK()),
    SCAN: (qrCode: string) => scanService.send(ScanEvents.SCAN(qrCode)),
    GOTO_HOME,
    ALLOWED,
    DENIED,
    isLocalPermissionRational,
  };
}
