import { useSafeSelector } from '../../shared/hooks/useSafeSelector';
import {useContext, useEffect} from 'react';
import {selectIsActive, selectIsFocused} from '../../machines/app';
import {GlobalContext} from '../../shared/GlobalContext';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import {useTranslation} from 'react-i18next';
import {
  selectIsCheckingBluetoothService,
  selectIsWaitingForConnection,
  selectIsWaitingForVc,
  selectIsWaitingForVcTimeout,
  selectOpenId4VpUri,
  selectSenderInfo,
} from '../../machines/bleShare/request/selectors';
import {
  selectIsBluetoothDenied,
  selectIsCancelling,
  selectIsNearByDevicesPermissionDenied,
  selectIsReviewing,
  selectReadyForBluetoothStateCheck,
} from '../../machines/bleShare/commonSelectors';
import {
  RequestEvents,
  selectIsMinimumStorageLimitReached,
} from '../../machines/bleShare/request/requestMachine';

export function useRequestScreen() {
  const {t} = useTranslation('RequestScreen');
  const {appService} = useContext(GlobalContext);

  const requestService = appService.children.get('request');
  const isActive = useSafeSelector(appService, selectIsActive);
  const isFocused = useSafeSelector(appService, selectIsFocused);
  const isReadyForBluetoothStateCheck = useSafeSelector(
    requestService,
    selectReadyForBluetoothStateCheck,
  );
  const isBluetoothDenied = useSafeSelector(
    requestService,
    selectIsBluetoothDenied,
  );
  const isNearByDevicesPermissionDenied = useSafeSelector(
    requestService,
    selectIsNearByDevicesPermissionDenied,
  );
  const isWaitingForConnection = useSafeSelector(
    requestService,
    selectIsWaitingForConnection,
  );

  const isWaitingForVc = useSafeSelector(requestService, selectIsWaitingForVc);
  const isWaitingForVcTimeout = useSafeSelector(
    requestService,
    selectIsWaitingForVcTimeout,
  );

  let statusTitle = '';
  let statusMessage = '';
  let statusHint = '';
  if (isWaitingForConnection) {
    statusMessage = t('status.waitingConnection');
  } else if (isWaitingForVc) {
    statusTitle = t('status.sharing.title');
    statusMessage = t('status.connected.message');
  } else if (isWaitingForVcTimeout) {
    statusTitle = t('status.sharing.title');
    statusMessage = t('status.connected.message');
    statusHint = t('status.connected.timeoutHint');
  }

  useEffect(() => {
    BluetoothStateManager.getState().then(bluetoothState => {
      if (bluetoothState === 'PoweredOn' && isBluetoothDenied) {
        requestService.send(RequestEvents.SCREEN_FOCUS());
      }
    });
  }, [isFocused, isActive]);

  return {
    statusTitle,
    statusMessage,
    statusHint,
    isWaitingForConnection,
    isWaitingForVc,
    isWaitingForVcTimeout,
    isBluetoothDenied,
    isNearByDevicesPermissionDenied,
    isReadyForBluetoothStateCheck,
    isCheckingBluetoothService: useSafeSelector(
      requestService,
      selectIsCheckingBluetoothService,
    ),
    isMinimumStorageLimitReached: useSafeSelector(
      requestService,
      selectIsMinimumStorageLimitReached,
    ),
    openId4VpUri: useSafeSelector(requestService, selectOpenId4VpUri),
    senderInfo: useSafeSelector(requestService, selectSenderInfo),
    isReviewing: useSafeSelector(requestService, selectIsReviewing),
    isCancelling: useSafeSelector(requestService, selectIsCancelling),

    CANCEL: () => requestService.send(RequestEvents.CANCEL()),
    DISMISS: () => requestService.send(RequestEvents.DISMISS()),
    ACCEPT: () => requestService.send(RequestEvents.ACCEPT()),
    REJECT: () => requestService.send(RequestEvents.REJECT()),
    REQUEST: () => requestService.send(RequestEvents.SCREEN_FOCUS()),
    GOTO_SETTINGS: () => requestService.send(RequestEvents.GOTO_SETTINGS()),
  };
}
