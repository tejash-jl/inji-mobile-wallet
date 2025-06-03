import {APPLICATION_THEME} from 'react-native-dotenv';

const adaptiveImage =
  APPLICATION_THEME?.toLowerCase() === 'purple'
    ? '../assets/purpleSplashScreen.png'
    : './assets/orangeSplashScreen.png';

export default {
  name: 'VerifyTT',
  slug: 'VerifyTT',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  splash: {
    image: adaptiveImage,
    resizeMode: 'cover',
    backgroundColor: '#ffffff',
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: 'tt.gov.verifytt',
    buildNumber: '1.0.0',
    supportsTablet: true,
  },
  android: {
    package: 'tt.gov.verifytt',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: adaptiveImage,
      backgroundColor: '#FFFFFF',
    },
  },
  platforms: ['android', 'ios'],
  privacy: 'hidden',
  plugins: ['expo-localization'],
};
