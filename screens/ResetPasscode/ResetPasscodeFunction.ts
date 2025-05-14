import React from 'react';
import {decryptJson, encryptJson} from '../../shared/cryptoutil/cryptoUtil';
import {GlobalContext} from '../../shared/GlobalContext';
import {MMKV} from '../../shared/storage';

export function useResetAuthToDefault() {
  const {appService} = React.useContext(GlobalContext);
  const storeService = appService.children.get('store');
  const encryptionKey =
    storeService?.getSnapshot()?.context?.encryptionKey || '';

  const resetAuthToDefault = async () => {
    try {
      const authValue = await MMKV.getItem('auth');
      if (authValue && typeof authValue === 'string') {
        const decryptedAuth = await decryptJson(encryptionKey, authValue);
        let authObj: {[key: string]: any} = {};
        try {
          authObj = JSON.parse(decryptedAuth);
        } catch (e) {
          console.error('Error parsing decrypted auth JSON:', e);
        }
        authObj.biometrics = '';
        authObj.canUseBiometrics = false;
        authObj.isInitialDownload = true;
        authObj.isOnboarding = true;
        authObj.isTourGuide = false;
        authObj.passcode = '';
        authObj.passcodeSalt = '';
        authObj.selectLanguage = false;
        const jsonString = JSON.stringify(authObj);
        const encrypted = await encryptJson(encryptionKey, jsonString);
        await MMKV.setItem('auth', encrypted);
        console.log(
          'Auth store updated with default reset values successfully',
        );
      } else {
        console.log('auth key value is empty or not a string');
      }
    } catch (error) {
      console.error('Error updating auth store:', error);
    }
  };

  return resetAuthToDefault;
}

export function useResetAuthStore() {
  const {appService} = React.useContext(GlobalContext);
  const storeService = appService.children.get('store');
  const encryptionKey =
    storeService?.getSnapshot()?.context?.encryptionKey || '';

  const resetAuthStore = async () => {
    try {
      const authValue = await MMKV.getItem('auth');
      if (authValue && typeof authValue === 'string') {
        const decryptedAuth = await decryptJson(encryptionKey, authValue);
        let authObj: {[key: string]: any} = {};
        try {
          authObj = JSON.parse(decryptedAuth);
        } catch (e) {
          console.error('Error parsing decrypted auth JSON:', e);
        }
        authObj.actValue = 'Pintu Kumar';
        const jsonString = JSON.stringify(authObj);
        const encrypted = await encryptJson(encryptionKey, jsonString);
        await MMKV.setItem('auth', encrypted);
        console.log('Auth store updated with actValue successfully');
      } else {
        console.log('auth key value is empty or not a string');
      }
    } catch (error) {
      console.error('Error updating auth store:', error);
    }
  };

  return resetAuthStore;
}

export function useConsoleAuthData() {
  const {appService} = React.useContext(GlobalContext);
  const storeService = appService.children.get('store');
  const encryptionKey =
    storeService?.getSnapshot()?.context?.encryptionKey || '';

  const logAllKeysData = async () => {
    try {
      const keys = await MMKV.indexer.strings.getKeys();
      console.log('MMKV Stored Keys:', keys);
      for (const key of keys) {
        const value = await MMKV.getItem(key);
        if (value && typeof value === 'string') {
          try {
            const decryptedValue = await decryptJson(encryptionKey, value);
            console.log(`Decrypted value for key '${key}':`, decryptedValue);
          } catch (e) {
            console.log(`Raw value for key '${key}':`, value);
          }
        } else {
          console.log(`Value for key '${key}' is empty or not a string`);
        }
      }
    } catch (error) {
      console.error('Error fetching MMKV keys or values:', error);
    }
  };

  return logAllKeysData;
}
