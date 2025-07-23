import React, {useEffect, useState, useContext} from 'react';
import {useTranslation} from 'react-i18next';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import {MAX_PIN, PasscodeVerify} from '../components/PasscodeVerify';
import {PinInput} from '../components/PinInput';
import {Column, Row, Text} from '../components/ui';
import {Theme} from '../components/ui/styleUtils';
import {PasscodeRouteProps} from '../routes';
import {usePasscodeScreen} from './PasscodeScreenController';
import {hashData} from '../shared/commonUtil';
import {argon2iConfig, isIOS} from '../shared/constants';
import Modal from 'react-native-modal';
import {
  getEndEventData,
  getEventType,
  getImpressionEventData,
  resetRetryCount,
  sendEndEvent,
  sendImpressionEvent,
} from '../shared/telemetry/TelemetryUtils';
import {TelemetryConstants} from '../shared/telemetry/TelemetryConstants';

import {BackHandler} from 'react-native';
import {incrementRetryCount} from '../shared/telemetry/TelemetryUtils';
import {SvgImage} from '../components/ui/svg';
import {useResetAuthToDefault} from './ResetPasscode/ResetPasscodeFunction';
import {useResetAppStorageToDefault} from './ResetPasscode/ResetApp';
import {GlobalContext} from '../shared/GlobalContext';

export const PasscodeScreen: React.FC<PasscodeRouteProps> = props => {
  const {t} = useTranslation('PasscodeScreen');
  const controller = usePasscodeScreen(props);
  const isSettingUp = props.route.params?.setup;
  const [resetPinModalVisible, setResetPinModalVisible] = useState(false);

  const resetAuthToDefault = useResetAuthToDefault();
  const {resetAppStorageToDefault, resetMachinesToInitialState} =
    useResetAppStorageToDefault();

  const {appService} = useContext(GlobalContext);

  console.log(
    'Whole Object-----------------------------',
    controller,
  );

  console.log(
    'Stored Passcode & Stored Salt-----------------------------',
    controller.storedPasscode,
    '\t',
    controller.storedSalt,
  );

  useEffect(() => {
    sendImpressionEvent(
      getImpressionEventData(
        getEventType(isSettingUp),
        TelemetryConstants.Screens.passcode,
      ),
    );
  }, [isSettingUp]);

  const handleBackButtonPress = () => {
    sendEndEvent(
      getEndEventData(
        getEventType(isSettingUp),
        TelemetryConstants.EndEventStatus.failure,
        {
          errorId: TelemetryConstants.ErrorId.userCancel,
          errorMessage: TelemetryConstants.ErrorMessage.authenticationCancelled,
        },
      ),
    );
    return false;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackButtonPress,
    );

    return () => {
      backHandler.remove();
    };
  }, []);

  const setPasscode = async (passcode: string) => {
    const data = await hashData(passcode, controller.storedSalt, argon2iConfig);
    controller.setPasscode(data);
  };

  const handlePasscodeMismatch = (error: string) => {
    incrementRetryCount(
      getEventType(isSettingUp),
      TelemetryConstants.Screens.passcode,
    );
    controller.setError(error);
  };

  const passcodeSetup =
    controller.passcode === '' ? (
      <Column align="space-between">
        <Text
          testID="setPasscodeHeader"
          align="center"
          style={{...Theme.TextStyles.header, paddingTop: 27}}>
          {t('header')}
        </Text>
        <Text
          testID="setPasscodeDescription"
          align="center"
          style={{
            paddingTop: 3,
            marginTop: 6,
            marginBottom: Dimensions.get('screen').height * 0.1,
          }}
          weight="semibold"
          color={Theme.Colors.GrayText}>
          {controller.toggleUnlock
            ? t('enterAlternateNewPassword')
            : t('enterNewPassword')}
        </Text>
        <PinInput
          testID="setPasscodePin"
          length={MAX_PIN}
          onDone={setPasscode}
        />
      </Column>
    ) : (
      <Column align="space-between">
        <Text
          testID="confirmPasscodeHeader"
          align="center"
          style={{...Theme.TextStyles.header, paddingTop: 27}}>
          {t('confirmPasscode')}
        </Text>
        <Text
          testID="confirmPasscodeDescription"
          align="center"
          style={{
            paddingTop: 3,
            marginTop: 6,
            marginBottom: Dimensions.get('screen').height * 0.1,
          }}
          weight="semibold"
          color={Theme.Colors.GrayText}>
          {controller.toggleUnlock
            ? t('reEnterAlternatePassword')
            : t('reEnterPassword')}
        </Text>
        <PasscodeVerify
          testID="confirmPasscodePin"
          onSuccess={() => {
            resetRetryCount();
            controller.SETUP_PASSCODE();
          }}
          onError={handlePasscodeMismatch}
          passcode={controller.passcode}
          salt={controller.storedSalt}
        />
      </Column>
    );

  const unlockPasscode = (
    <Column align="space-between">
      <Text
        testID="enterPasscode"
        style={{
          paddingTop: 3,
          marginTop: 6,
          marginBottom: Dimensions.get('screen').height * 0.1,
        }}
        align="center"
        weight="semibold"
        color={Theme.Colors.GrayText}>
        {t('enterPasscode')}
      </Text>
      <PasscodeVerify
        testID="enterPasscodePin"
        onSuccess={() => {
          resetRetryCount();
          controller.LOGIN();
        }}
        onError={handlePasscodeMismatch}
        passcode={controller.storedPasscode}
        salt={controller.storedSalt}
      />
    </Column>
  );

  return (
    <KeyboardAvoidingView
      style={Theme.Styles.passwordKeyboardAvoidStyle}
      behavior={isIOS() ? 'padding' : 'height'}>
      {SvgImage.LockIcon()}
      <Column>
        {isSettingUp ? passcodeSetup : unlockPasscode}
        <Text
          testID="PasscodeError"
          align="center"
          color={Theme.Colors.errorMessage}>
          {controller.error}
        </Text>
        {!isSettingUp && (
          <TouchableOpacity
            onPress={() => {
              setResetPinModalVisible(true);
            }}>
            <Text
              testID="ForgotPasscode"
              style={{
                marginTop: 30,
              }}
              align="center"
              color={Theme.Colors.forgotPin}
              weight="semibold">
              {t('forgotPassword')}
            </Text>
          </TouchableOpacity>
        )}
      </Column>
      <Modal
        isVisible={resetPinModalVisible}
        onBackdropPress={() => {
          setResetPinModalVisible(false);
        }}
        onBackButtonPress={() => {
          setResetPinModalVisible(false);
        }}>
        <SafeAreaView
          style={{
            height: Platform.OS === 'android' ? '35%' : 'auto',
            backgroundColor: 'white',
            width: '100%',
            borderRadius: 10,
          }}>
          <Text
            testID="ResetPinConfirm"
            style={{
              marginTop: 30,
            }}
            align="center"
            color={Theme.Colors.blackIcon}
            weight="semibold"
            size="large">
            {t('resetPinConfirmation')}
          </Text>
          <Text
            testID="ResetPinConfirmText"
            style={{
              marginTop: 20,
              paddingHorizontal: 30,
            }}
            align="left"
            color={Theme.Colors.blackIcon}
            weight="regular"
            size="mediumSmall">
            {t('resetPinConfirmationText')}
          </Text>
          <View
            style={{
              width: '100%',
              height: 0.5,
              backgroundColor: '#A7A7A7',
              marginTop: 20,
            }}
          />
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
            }}>
            <TouchableOpacity
              onPress={() => {
                setResetPinModalVisible(false);
              }}
              style={{
                width: '49.5%',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text
                testID="ResetPinCancel"
                align="center"
                color={Theme.Colors.forgotPin}
                weight="semibold"
                size="large">
                {t('resetPinCancel')}
              </Text>
            </TouchableOpacity>
            <View
              style={{width: 1, height: '100%', backgroundColor: '#A7A7A7'}}
            />
            <TouchableOpacity
              onPress={async () => {
                //const storeService = appService.children.get('store');
                //storeService?.send('CLEAR');

                //controller.RESET_AUTH();
                //await resetAuthToDefault();
                await resetAppStorageToDefault(); // Resetting app storage to default
                resetMachinesToInitialState(); // Resetting machines to initial state

                setResetPinModalVisible(false);

                props.navigation.reset({
                  index: 0,
                  routes: [{name: 'SplashScreen'}], //params: { setup: true }
                });

                // setTimeout(() => {
                //   props.navigation.reset({
                //     index: 0,
                //     routes: [{ name: 'SplashScreen' }],
                //   });
                // }, 2000);
              }}
              style={{
                width: '49.5%',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text
                testID="ResetPinReset"
                align="center"
                color={Theme.Colors.errorMessage}
                weight="semibold"
                size="large">
                {t('resetPinReset')}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </KeyboardAvoidingView>
  );
};
