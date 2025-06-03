import {useMachine} from '@xstate/react';
import { useSafeSelector } from '../../shared/hooks/useSafeSelector';
import {useContext, useEffect, useState} from 'react';
import {ActorRefFrom} from 'xstate';
import NetInfo from '@react-native-community/netinfo';
import {ModalProps} from '../../components/ui/Modal';
import {GlobalContext} from '../../shared/GlobalContext';
import {
  selectAcceptingBindingOtp,
  selectBindingAuthFailedError,
  selectBindingWarning,
  selectIsCommunicationDetails,
  selectOtpError,
  selectShowWalletBindingError,
  selectVc,
  selectVerifiableCredentialData,
  selectWalletBindingError,
  selectWalletBindingInProgress,
  selectWalletBindingResponse,
  selectWalletBindingSuccess,
  selectVerificationStatus,
  selectIsVerificationInProgress,
  selectShowVerificationStatusBanner,
  selectIsVerificationCompleted,
  selectCredential,
} from '../../machines/VerifiableCredential/VCItemMachine/VCItemSelectors';
import {selectPasscode} from '../../machines/auth';
import {biometricsMachine, selectIsSuccess} from '../../machines/biometrics';
import {
  VCItemEvents,
  VCItemMachine,
} from '../../machines/VerifiableCredential/VCItemMachine/VCItemMachine';
import {selectIsAcceptingOtpInput} from './MyVcs/AddVcModalMachine';
import {BannerStatusType} from '../../components/BannerNotification';

export function useViewVcModal({vcItemActor, isVisible}: ViewVcModalProps) {
  const [toastVisible, setToastVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [reAuthenticating, setReAuthenticating] = useState('');
  const [error, setError] = useState('');
  const {appService} = useContext(GlobalContext);
  const authService = appService.children.get('auth');
  const [, bioSend, bioService] = useMachine(biometricsMachine);

  const isSuccessBio = useSafeSelector(bioService, selectIsSuccess);
  const vc = useSafeSelector(vcItemActor, selectVc);
  const otError = useSafeSelector(vcItemActor, selectOtpError);
  const onSuccess = () => {
    bioSend({type: 'SET_IS_AVAILABLE', data: true});
    setError('');
    setReAuthenticating('');
  };

  const onError = (value: string) => {
    setError(value);
  };

  const showToast = (message: string) => {
    setToastVisible(true);
    setMessage(message);
    setTimeout(() => {
      setToastVisible(false);
      setMessage('');
    }, 3000);
  };

  const netInfoFetch = (otp: string) => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        vcItemActor.send(VCItemEvents.INPUT_OTP(otp));
      } else {
        vcItemActor.send(VCItemEvents.DISMISS());
        showToast('Request network failed');
      }
    });
  };

  useEffect(() => {
    if (isSuccessBio && reAuthenticating != '') {
      onSuccess();
    }
  }, [reAuthenticating, isSuccessBio, otError, vc]);

  useEffect(() => {
    vcItemActor.send(VCItemEvents.REFRESH());
  }, [isVisible]);
  return {
    error,
    message,
    toastVisible,
    credential: useSafeSelector(vcItemActor, selectCredential),
    verifiableCredentialData: useSafeSelector(
      vcItemActor,
      selectVerifiableCredentialData,
    ),
    otpError: useSafeSelector(vcItemActor, selectOtpError),
    bindingAuthFailedError: useSafeSelector(
      vcItemActor,
      selectBindingAuthFailedError,
    ),
    reAuthenticating,
    isAcceptingOtpInput: useSafeSelector(vcItemActor, selectIsAcceptingOtpInput),
    storedPasscode: useSafeSelector(authService, selectPasscode),
    isAcceptingBindingOtp: useSafeSelector(vcItemActor, selectAcceptingBindingOtp),
    walletBindingResponse: useSafeSelector(
      vcItemActor,
      selectWalletBindingResponse,
    ),
    walletBindingError: useSafeSelector(vcItemActor, selectWalletBindingError),
    isWalletBindingInProgress: useSafeSelector(
      vcItemActor,
      selectWalletBindingInProgress,
    ),
    isBindingError: useSafeSelector(vcItemActor, selectShowWalletBindingError),
    isBindingSuccess: useSafeSelector(vcItemActor, selectWalletBindingSuccess),
    isBindingWarning: useSafeSelector(vcItemActor, selectBindingWarning),
    isCommunicationDetails: useSafeSelector(
      vcItemActor,
      selectIsCommunicationDetails,
    ),
    setReAuthenticating,
    onError,
    addtoWallet: () => {
      vcItemActor.send(VCItemEvents.ADD_WALLET_BINDING_ID());
    },
    inputOtp: (otp: string) => {
      netInfoFetch(otp);
    },
    verificationStatus: useSafeSelector(vcItemActor, selectVerificationStatus),
    isVerificationInProgress: useSafeSelector(
      vcItemActor,
      selectIsVerificationInProgress,
    ),
    isVerificationCompleted: useSafeSelector(
      vcItemActor,
      selectIsVerificationCompleted,
    ),
    showVerificationStatusBanner: useSafeSelector(
      vcItemActor,
      selectShowVerificationStatusBanner,
    ),
    RESET_VERIFICATION_STATUS: () =>
      vcItemActor.send(VCItemEvents.RESET_VERIFICATION_STATUS()),
    SHOW_VERIFICATION_STATUS_BANNER: () =>
      vcItemActor.send({
        type: 'SHOW_VERIFICATION_STATUS_BANNER',
        response: {statusType: BannerStatusType.IN_PROGRESS},
      }),
    onSuccess,
    DISMISS: () => vcItemActor.send(VCItemEvents.DISMISS()),
    INPUT_OTP: (otp: string) => vcItemActor.send(VCItemEvents.INPUT_OTP(otp)),
    RESEND_OTP: () => vcItemActor.send(VCItemEvents.RESEND_OTP()),
    CANCEL: () => vcItemActor.send(VCItemEvents.CANCEL()),
    CONFIRM: () => vcItemActor.send(VCItemEvents.CONFIRM()),
  };
}

export interface ViewVcModalProps extends ModalProps {
  vcItemActor: ActorRefFrom<typeof VCItemMachine>;
  onDismiss: () => void;
  activeTab: Number;
  flow: string;
  navigation?: any;
  vcStatus?: string;
}
