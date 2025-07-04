import {Dimensions} from 'react-native';
import {RootRouteProps} from '../routes';
import {Image} from 'react-native-elements';
import React, {useEffect, useContext} from 'react';
import {APPLICATION_THEME} from 'react-native-dotenv';
import {Column} from '../components/ui';
import {useAppLayout} from './AppLayoutController';
import {useConsoleAuthData} from './ResetPasscode/ResetPasscodeFunction';

export const SplashScreen: React.FC<RootRouteProps> = props => {
  const imageResource =
    APPLICATION_THEME?.toLowerCase() === 'purple'
      ? require('../assets/purpleSplashScreen.png')
      : require('../assets/SplashScreen1.png');
  const controller = useAppLayout();
  const logAuthData = useConsoleAuthData();

  // React.useEffect(() => {
  //   const logKeysAndAuth = async () => {
  //     await logAuthData();
  //   };
  //   logKeysAndAuth();
  // }, []);

  //console.log('SplashScreen -------------------------------------------------', controller);

  React.useEffect(() => {
    setTimeout(() => {
      if (controller.isLanguagesetup) {
        props.navigation.navigate('Language');
      } else if (controller.isUnAuthorized || (controller as any).isSettingUp) {
        props.navigation.navigate('Welcome');
      }
    }, 3000);
  }, [
    controller.isAuthorized ||
      controller.isLanguagesetup ||
      (controller as any).isSettingUp,
  ]);

  return (
    <Column
      crossAlign="center"
      style={{
        flex: 1,
        justifyContent: 'center',
        height: Dimensions.get('screen').height,
        width: Dimensions.get('screen').width,
        backgroundColor: '#FFFFFF',
      }}>
      <Image
        resizeMode="stretch"
        style={{width: 400, height: 450}}
        source={imageResource}
      />
    </Column>
  );
};
