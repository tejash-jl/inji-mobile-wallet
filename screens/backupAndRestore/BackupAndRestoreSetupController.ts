import {useInterpret} from '@xstate/react';
import { useSafeSelector } from '../../shared/hooks/useSafeSelector';
import {useContext, useRef} from 'react';

import {
  BackupAndRestoreSetupEvents,
  backupAndRestoreSetupMachine,
  selectIsCloudSignedInFailed,
  selectIsLoading,
  selectIsNetworkError as selectIsNetworkErrorDuringSetup,
  selectIsSigningIn,
  selectIsSigningFailure as selectIsSigningInFailure,
  selectIsSigningInSuccessful,
  selectProfileInfo,
  selectShouldTriggerAutoBackup,
  selectShowAccountSelectionConfirmation,
} from '../../machines/backupAndRestore/backupAndRestoreSetup';
import {GlobalContext} from '../../shared/GlobalContext';
import {selectIsBackUpAndRestoreExplored} from '../../machines/settings';
import {SettingsEvents} from '../../machines/settings';
import {
  BackupEvents,
  selectIsNetworkError as selectIsNetworkErrorWhileFetchingLastBackupDetails,
} from '../../machines/backupAndRestore/backup';

export function useBackupAndRestoreSetup() {
  const {appService} = useContext(GlobalContext);
  const settingsService = appService.children.get('settings')!!;
  const backupService = appService.children.get('backup')!!;
  const storeService = appService.children.get('store');
  const machine = useRef(
    backupAndRestoreSetupMachine.withContext({
      ...backupAndRestoreSetupMachine.context,
      serviceRefs: {settings: settingsService, store: storeService},
    }),
  );
  const backupAndRestoreSetupService = useInterpret(machine.current);
  const isBackupAndRestoreExplored = useSafeSelector(
    settingsService,
    selectIsBackUpAndRestoreExplored,
  );

  const isNetworkErrorDuringAccountSetup = useSafeSelector(
    backupAndRestoreSetupService,
    selectIsNetworkErrorDuringSetup,
  );
  const isNetworkErrorWhileFetchingLastBackupDetails = useSafeSelector(
    backupService,
    selectIsNetworkErrorWhileFetchingLastBackupDetails,
  );

  const tryAgain = () => {
    if (isNetworkErrorDuringAccountSetup)
      return backupAndRestoreSetupService.send(
        BackupAndRestoreSetupEvents.TRY_AGAIN(),
      );
    return backupService.send(BackupEvents.TRY_AGAIN());
  };

  return {
    isLoading: useSafeSelector(backupAndRestoreSetupService, selectIsLoading),
    profileInfo: useSafeSelector(backupAndRestoreSetupService, selectProfileInfo),
    isNetworkError:
      isNetworkErrorDuringAccountSetup ||
      isNetworkErrorWhileFetchingLastBackupDetails,

    showAccountSelectionConfirmation: useSafeSelector(
      backupAndRestoreSetupService,
      selectShowAccountSelectionConfirmation,
    ),
    isSigningIn: useSafeSelector(backupAndRestoreSetupService, selectIsSigningIn),
    isSigningInFailed: useSafeSelector(
      backupAndRestoreSetupService,
      selectIsSigningInFailure,
    ),
    isCloudSignInFailed: useSafeSelector(
      backupAndRestoreSetupService,
      selectIsCloudSignedInFailed,
    ),
    isSigningInSuccessful: useSafeSelector(
      backupAndRestoreSetupService,
      selectIsSigningInSuccessful,
    ),
    isBackupAndRestoreExplored,
    BACKUP_AND_RESTORE: () => {
      backupAndRestoreSetupService.send(
        BackupAndRestoreSetupEvents.HANDLE_BACKUP_AND_RESTORE(),
      );
      if (!isBackupAndRestoreExplored) {
        settingsService.send(
          SettingsEvents.SET_IS_BACKUP_AND_RESTORE_EXPLORED(),
        );
      }
    },
    shouldTriggerAutoBackup: useSafeSelector(
      backupAndRestoreSetupService,
      selectShouldTriggerAutoBackup,
    ),
    PROCEED_ACCOUNT_SELECTION: () =>
      backupAndRestoreSetupService.send(BackupAndRestoreSetupEvents.PROCEED()),
    GO_BACK: () =>
      backupAndRestoreSetupService.send(BackupAndRestoreSetupEvents.GO_BACK()),
    RECONFIGURE_ACCOUNT: () =>
      backupAndRestoreSetupService.send(
        BackupAndRestoreSetupEvents.RECONFIGURE_ACCOUNT(),
      ),
    TRY_AGAIN: tryAgain,
    OPEN_SETTINGS: () =>
      backupAndRestoreSetupService.send(
        BackupAndRestoreSetupEvents.OPEN_SETTINGS(),
      ),
    DISMISS: () => {
      if (isNetworkErrorWhileFetchingLastBackupDetails)
        backupService.send(BackupEvents.DISMISS());
      return backupAndRestoreSetupService.send(
        BackupAndRestoreSetupEvents.DISMISS(),
      );
    },
  };
}
