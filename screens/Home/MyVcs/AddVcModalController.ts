import { useSafeSelector } from '../../../shared/hooks/useSafeSelector';
import {ActorRefFrom} from 'xstate';
import {
  AddVcModalEvents,
  AddVcModalMachine,
  selectIsAcceptingOtpInput,
  selectIsRequestingCredential,
  selectOtpError,
  selectIsAcceptingIdInput,
  selectIsCancellingDownload,
  selectIsPhoneNumber,
  selectIsEmail,
} from './AddVcModalMachine';

export function useAddVcModal({service}: AddVcModalProps) {
  return {
    isRequestingCredential: useSafeSelector(service, selectIsRequestingCredential),

    otpError: useSafeSelector(service, selectOtpError),

    isAcceptingUinInput: useSafeSelector(service, selectIsAcceptingIdInput),
    isAcceptingOtpInput: useSafeSelector(service, selectIsAcceptingOtpInput),
    isDownloadCancelled: useSafeSelector(service, selectIsCancellingDownload),
    isPhoneNumber: useSafeSelector(service, selectIsPhoneNumber),
    isEmail: useSafeSelector(service, selectIsEmail),

    INPUT_OTP: (otp: string) => service.send(AddVcModalEvents.INPUT_OTP(otp)),

    RESEND_OTP: () => service.send(AddVcModalEvents.RESEND_OTP()),

    DISMISS: () => service.send(AddVcModalEvents.DISMISS()),
  };
}

export interface AddVcModalProps {
  service: ActorRefFrom<typeof AddVcModalMachine>;
  onPress?: () => void;
}
