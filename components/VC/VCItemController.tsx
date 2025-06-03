import {useContext, useRef} from 'react';
import {GlobalContext} from '../../shared/GlobalContext';
import {
  selectContext,
  selectGeneratedOn,
  selectKebabPopUp,
  selectWalletBindingResponse,
  selectVerifiableCredentialData,
  selectCredential,
} from '../../machines/VerifiableCredential/VCItemMachine/VCItemSelectors';
import {useInterpret} from '@xstate/react';
import { useSafeSelector } from '../../shared/hooks/useSafeSelector';
import {VCItemProps} from './Views/VCCardView';
import {
  createVCItemMachine,
  VCItemEvents,
} from '../../machines/VerifiableCredential/VCItemMachine/VCItemMachine';
import {selectIsSavingFailedInIdle} from '../../screens/Home/MyVcsTabMachine';
import {selectIsTourGuide} from '../../machines/auth';

export function useVcItemController(props: VCItemProps) {
  const {appService} = useContext(GlobalContext);
  const machine = useRef(
    createVCItemMachine(
      appService.getSnapshot().context.serviceRefs,
      props.vcMetadata,
    ),
  );
  const VCItemService = useInterpret(machine.current, {devTools: __DEV__});
  const authService = appService.children.get('auth');

  return {
    VCItemService,
    context: useSafeSelector(VCItemService, selectContext),
    credential: useSafeSelector(VCItemService, selectCredential),
    verifiableCredentialData: useSafeSelector(
      VCItemService,
      selectVerifiableCredentialData,
    ),
    walletBindingResponse: useSafeSelector(
      VCItemService,
      selectWalletBindingResponse,
    ),
    isKebabPopUp: useSafeSelector(VCItemService, selectKebabPopUp),
    DISMISS: () => VCItemService.send(VCItemEvents.DISMISS()),
    KEBAB_POPUP: () => VCItemService.send(VCItemEvents.KEBAB_POPUP()),
    UPDATE_VC_METADATA: vcMetadata =>
      VCItemService.send(VCItemEvents.UPDATE_VC_METADATA(vcMetadata)),
    isSavingFailedInIdle: useSafeSelector(
      VCItemService,
      selectIsSavingFailedInIdle,
    ),
    storeErrorTranslationPath: 'errors.savingFailed',
    generatedOn: useSafeSelector(VCItemService, selectGeneratedOn),
    isTourGuide: useSafeSelector(authService, selectIsTourGuide),
  };
}
