import React from 'react';
import {decryptJson, encryptJson} from '../../shared/cryptoutil/cryptoUtil';
import {GlobalContext} from '../../shared/GlobalContext';
import {MMKV} from '../../shared/storage';
import {interpret} from 'xstate';

import {appMachine} from '../../machines/app';
import {authMachine} from '../../machines/auth';
import {settingsMachine} from '../../machines/settings';
import {storeMachine} from '../../machines/store';
import {activityLogMachine} from '../../machines/activityLog';
import {backupMachine} from '../../machines/backupAndRestore/backup';
import {backupRestoreMachine} from '../../machines/backupAndRestore/backupRestore';
import {scanMachine} from '../../machines/bleShare/scan/scanMachine';
import {requestMachine} from '../../machines/bleShare/request/requestMachine';
import {vcMetaMachine} from '../../machines/VerifiableCredential/VCMetaMachine/VCMetaMachine';
import {FaceScannerEvents} from '../../machines/faceScanner';
import {biometricsMachine} from '../../machines/biometrics';
import {pinInputMachine} from '../../machines/pinInput';

export function useResetAppStorageToDefault() {
  const {appService, setAppService} = React.useContext(GlobalContext);
  const storeService = appService.children.get('store');
  const encryptionKey =
    storeService?.getSnapshot()?.context?.encryptionKey || '';

  const resetAppStorageToDefault = async () => {
    try {
      const allKeys = await MMKV.indexer.strings.getKeys();

      for (const key of allKeys) {
        if (key === 'auth') {
          const obj = {
            passcode: '',
            passcodeSalt: '',
            biometrics: '',
            canUseBiometrics: false,
            selectLanguage: false,
            isOnboarding: true,
            isInitialDownload: true,
            isTourGuide: false,
          };
          const jsonString = JSON.stringify(obj);
          const encrypted = await encryptJson(encryptionKey, jsonString);
          await MMKV.setItem(key, encrypted);
          console.log(`Storage key '${key}' reset to default successfully.`);
        } else if (key === 'settings') {
          console.log(`Storage key '${key}' kept as is.`);
        } else {
          await MMKV.removeItem(key);
          console.log(`Storage key '${key}' removed.`);
        }
      }
    } catch (error) {
      console.error('Error resetting app storage to default:', error);
    }
  };

   const resetMachinesToInitialState = () => {
    if (appService && setAppService) {
      appService.stop();
      const newAppService = interpret(appMachine).start();
      setAppService(newAppService);
      console.log('appMachine has been reset to its initial state.');
    } else {
      console.warn('appService or setAppService is not available to reset.');
    }
  };

  return {resetAppStorageToDefault, resetMachinesToInitialState};
}
