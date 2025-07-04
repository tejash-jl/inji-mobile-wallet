import { useSafeSelector } from '../../shared/hooks/useSafeSelector';
import {useContext} from 'react';
import {GlobalContext} from '../../shared/GlobalContext';
import {
  selectCredential,
  selectIsAccepting,
  selectIsDisplayingIncomingVC,
  selectIsReviewingInIdle,
  selectIsSavingFailedInIdle,
  selectSenderInfo,
  selectVerifiableCredentialData,
} from '../../machines/bleShare/request/selectors';
import {
  selectIsInvalidIdentity,
  selectIsVerifyingIdentity,
} from '../../machines/bleShare/commonSelectors';
import {RequestEvents} from '../../machines/bleShare/request/requestMachine';
import {ActivityLogEvents} from '../../machines/activityLog';

export function useReceiveVcScreen() {
  const {appService} = useContext(GlobalContext);
  const requestService = appService.children.get('request')!!;
  const activityService = appService.children.get('activityLog')!!;

  return {
    senderInfo: useSafeSelector(requestService, selectSenderInfo),
    credential: useSafeSelector(requestService, selectCredential),
    verifiableCredentialData: useSafeSelector(
      requestService,
      selectVerifiableCredentialData,
    ),
    isReviewingInIdle: useSafeSelector(requestService, selectIsReviewingInIdle),
    isAccepting: useSafeSelector(requestService, selectIsAccepting),
    isDisplayingIncomingVC: useSafeSelector(
      requestService,
      selectIsDisplayingIncomingVC,
    ),
    isSavingFailedInIdle: useSafeSelector(
      requestService,
      selectIsSavingFailedInIdle,
    ),
    isVerifyingIdentity: useSafeSelector(requestService, selectIsVerifyingIdentity),
    isInvalidIdentity: useSafeSelector(requestService, selectIsInvalidIdentity),

    ACCEPT: () => requestService.send(RequestEvents.ACCEPT()),
    ACCEPT_AND_VERIFY: () =>
      requestService.send(RequestEvents.ACCEPT_AND_VERIFY()),
    REJECT: () => requestService.send(RequestEvents.REJECT()),
    GO_TO_RECEIVED_VC_TAB: () =>
      requestService.send(RequestEvents.GO_TO_RECEIVED_VC_TAB()),
    RETRY_VERIFICATION: () =>
      requestService.send(RequestEvents.RETRY_VERIFICATION()),
    CANCEL: () => requestService.send(RequestEvents.CANCEL()),
    DISMISS: () => requestService.send(RequestEvents.DISMISS()),
    FACE_VALID: () => requestService.send(RequestEvents.FACE_VALID()),
    FACE_INVALID: () => requestService.send(RequestEvents.FACE_INVALID()),
    RESET: () => requestService.send(RequestEvents.RESET()),
    STORE_INCOMING_VC_WELLKNOWN_CONFIG: (issuer, wellknown) =>
      activityService.send(
        ActivityLogEvents.STORE_INCOMING_VC_WELLKNOWN_CONFIG(issuer, wellknown),
      ),
  };
}
