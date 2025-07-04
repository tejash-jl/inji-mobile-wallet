import {useInterpret} from '@xstate/react';
import { useSafeSelector } from '../../shared/hooks/useSafeSelector';
import {useContext, useEffect, useRef} from 'react';
import {HomeRouteProps} from '../../routes/routeTypes';
import {GlobalContext} from '../../shared/GlobalContext';
import {
  HomeScreenEvents,
  HomeScreenMachine,
  selectActiveTab,
  selectSelectedVc,
  selectTabRefs,
  selectTabsLoaded,
  selectViewingVc,
  selectIssuersMachine,
  selectIsMinimumStorageLimitReached,
  selectBackupRestoreMachine,
} from './HomeScreenMachine';
import {selectVc} from '../../machines/VerifiableCredential/VCItemMachine/VCItemSelectors';

let homeMachineService;
function useCreateHomeMachineService() {
  const {appService} = useContext(GlobalContext);
  const machine = useRef(
    HomeScreenMachine.withContext({
      ...HomeScreenMachine.context,
      serviceRefs: appService.getSnapshot().context.serviceRefs,
    }),
  );
  return (homeMachineService = useInterpret(machine.current));
}

export function getHomeMachineService() {
  return homeMachineService;
}

export function useHomeScreen(props: HomeRouteProps) {
  const service = useCreateHomeMachineService();

  useEffect(() => {
    if (props.route.params?.activeTab != null) {
      SELECT_TAB(props.route.params.activeTab);
    }
  }, [props.route.params, props.route.params?.activeTab]);

  return {
    service,
    activeTab: useSafeSelector(service, selectActiveTab),
    selectedVc: useSafeSelector(service, selectSelectedVc),
    vc: useSafeSelector(service, selectVc),
    tabRefs: useSafeSelector(service, selectTabRefs),
    isViewingVc: useSafeSelector(service, selectViewingVc),
    haveTabsLoaded: useSafeSelector(service, selectTabsLoaded),
    IssuersService: useSafeSelector(service, selectIssuersMachine),
    backupRestoreService: useSafeSelector(service, selectBackupRestoreMachine),
    isMinimumStorageLimitReached: useSafeSelector(
      service,
      selectIsMinimumStorageLimitReached,
    ),
    DISMISS: () => service.send(HomeScreenEvents.DISMISS()),
    GOTO_ISSUERS: () => service.send(HomeScreenEvents.GOTO_ISSUERS()),
    DISMISS_MODAL: () => service.send(HomeScreenEvents.DISMISS_MODAL()),
  };

  function SELECT_TAB(index: number) {
    const tabs = [
      HomeScreenEvents.SELECT_MY_VCS,
      HomeScreenEvents.SELECT_RECEIVED_VCS,
      HomeScreenEvents.SELECT_HISTORY,
    ];
    service.send(tabs[index]());
  }
}
