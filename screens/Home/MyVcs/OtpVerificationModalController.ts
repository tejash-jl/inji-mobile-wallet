import {
  AddVcModalEvents,
  AddVcModalMachine,
  selectIsCancellingDownload,
} from './AddVcModalMachine';
import {ActorRefFrom} from 'xstate';
import {ModalProps} from '../../../components/ui/Modal';
import { useSafeSelector } from '../../../shared/hooks/useSafeSelector';
import {VCItemMachine} from '../../../machines/VerifiableCredential/VCItemMachine/VCItemMachine';

export function useOtpVerificationModal({service}: OtpVerificationModalProps) {
  return {
    isDownloadCancelled: useSafeSelector(service, selectIsCancellingDownload),

    WAIT: () => service.send(AddVcModalEvents.WAIT()),

    CANCEL: () => service.send(AddVcModalEvents.CANCEL()),
  };
}

export interface OtpVerificationModalProps extends ModalProps {
  service: ActorRefFrom<typeof AddVcModalMachine | typeof VCItemMachine>;
  onInputDone: (otp: string) => void;
  error?: string;
  resend: () => void;
  flow: string;
  phone: string;
  email: string;
}
