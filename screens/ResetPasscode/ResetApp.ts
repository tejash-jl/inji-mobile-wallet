import React from 'react';
import {decryptJson, encryptJson} from '../../shared/cryptoutil/cryptoUtil';
import {GlobalContext} from '../../shared/GlobalContext';
import {MMKV} from '../../shared/storage';

export function useResetAppStorageToDefault() {
  const {appService} = React.useContext(GlobalContext);
  const storeService = appService.children.get('store');
  const encryptionKey =
    storeService?.getSnapshot()?.context?.encryptionKey || '';

  const resetAppStorageToDefault = async () => {
    try {
      // List of keys to reset
      const keysToReset = [
        'language',
        'auth',
        'myVCs',
        'settings',
        'activityLog',
      ];

      for (const key of keysToReset) {
        const value = await MMKV.getItem(key);
        if (value && typeof value === 'string') {
          // Decrypt the stored value if possible
          let decryptedValue = value;
          try {
            decryptedValue = await decryptJson(encryptionKey, value);
          } catch (e) {
            console.warn(`Could not decrypt key ${key}, using raw value.`);
          }

          let obj: {[key: string]: any} = {};
          try {
            obj = JSON.parse(decryptedValue);
          } catch (e) {
            console.warn(
              `Could not parse JSON for key ${key}, resetting to empty object.`,
            );
            obj = {};
          }

          // Reset object to default empty or initial values depending on key
          switch (key) {
            case 'auth':
              obj = {
                biometrics: '',
                canUseBiometrics: false,
                isInitialDownload: true,
                isOnboarding: true,
                isTourGuide: false,
                passcode: '',
                passcodeSalt: '',
                selectLanguage: false,
              };
              break;
            case 'language':
              obj = {}; // or set to default language if known
              break;
            case 'myVCs':
            case 'settings':
            case 'activityLog':
              obj = {};
              break;
            default:
              obj = {};
          }

          const jsonString = JSON.stringify(obj);
          const encrypted = await encryptJson(encryptionKey, jsonString);
          await MMKV.setItem(key, encrypted);
          console.log(`Storage key '${key}' reset to default successfully.`);
        } else {
          // If no value or not string, just remove the key
          await MMKV.removeItem(key);
          console.log(`Storage key '${key}' was empty or not string, removed.`);
        }
      }
    } catch (error) {
      console.error('Error resetting app storage to default:', error);
    }
  };

  return resetAppStorageToDefault;
}
