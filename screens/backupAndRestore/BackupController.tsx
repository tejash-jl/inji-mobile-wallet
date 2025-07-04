import { useSafeSelector } from '../../shared/hooks/useSafeSelector';
import {useContext} from 'react';
import {
  BackupEvents,
  selectIsBackingUpSuccess,
  selectIsBackingUpFailure,
  selectIsBackupInprogress,
  selectBackupErrorReason,
  lastBackupDetails,
  selectIsLoadingBackupDetails,
  selectShowBackupInProgress,
} from '../../machines/backupAndRestore/backup';
import {GlobalContext} from '../../shared/GlobalContext';

export function useBackupScreen() {
  const {appService} = useContext(GlobalContext);
  const backupService = appService.children.get('backup')!!;

  return {
    lastBackupDetails: useSafeSelector(backupService, lastBackupDetails),
    isLoadingBackupDetails: useSafeSelector(
      backupService,
      selectIsLoadingBackupDetails,
    ),
    backupErrorReason: useSafeSelector(backupService, selectBackupErrorReason),
    isBackingUpSuccess: useSafeSelector(backupService, selectIsBackingUpSuccess),
    isBackingUpFailure: useSafeSelector(backupService, selectIsBackingUpFailure),
    isBackupInProgress: useSafeSelector(backupService, selectIsBackupInprogress),
    showBackupInProgress: useSafeSelector(
      backupService!,
      selectShowBackupInProgress,
    ),
    DATA_BACKUP: (isAutoBackup: boolean) => {
      backupService.send(BackupEvents.DATA_BACKUP(isAutoBackup));
    },

    LAST_BACKUP_DETAILS: () => {
      backupService.send(BackupEvents.LAST_BACKUP_DETAILS());
    },
    DISMISS: () => {
      backupService.send(BackupEvents.DISMISS());
    },
    DISMISS_SHOW_BACKUP_IN_PROGRESS: () => {
      backupService.send(BackupEvents.DISMISS_SHOW_BACKUP_IN_PROGRESS());
    },
  };
}
