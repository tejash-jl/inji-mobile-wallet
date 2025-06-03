import { useSafeSelector } from '../../../shared/hooks/useSafeSelector';
import {ActorRefFrom} from 'xstate';
import {
  GetVcModalEvents,
  GetVcModalMachine,
  selectIsAcceptingOtpInput,
  selectIsRequestingCredential,
  selectOtpError,
  selectIsAcceptingIdInput,
  selectIsPhoneNumber,
  selectIsEmail,
} from './GetVcModalMachine';

export function useGetVcModal({service}: GetVcModalProps) {
  return {
    isRequestingCredential: useSafeSelector(service, selectIsRequestingCredential),

    otpError: useSafeSelector(service, selectOtpError),
    phoneNumber: useSafeSelector(service, selectIsPhoneNumber),
    email: useSafeSelector(service, selectIsEmail),
    isAcceptingUinInput: useSafeSelector(service, selectIsAcceptingIdInput),
    isAcceptingOtpInput: useSafeSelector(service, selectIsAcceptingOtpInput),

    INPUT_OTP: (otp: string) => service.send(GetVcModalEvents.INPUT_OTP(otp)),

    RESEND_OTP: () => service.send(GetVcModalEvents.RESEND_OTP()),

    DISMISS: () => service.send(GetVcModalEvents.DISMISS()),
  };
}

export interface GetVcModalProps {
  service: ActorRefFrom<typeof GetVcModalMachine>;
  onPress?: () => void;
}
