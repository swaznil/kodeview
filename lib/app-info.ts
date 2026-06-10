import Constants from 'expo-constants';

export const APP_NAME = 'KodeView';

/** Replace with your hosted privacy policy URL before Play Store submission. */
export const PRIVACY_POLICY_URL = 'https://swaznil.github.io/KodeView/privacy-policy.html';

export const SUPPORT_EMAIL = 'swaznilxd@gmail.com';
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
export const APP_BUILD =
  Constants.expoConfig?.android?.versionCode?.toString() ??
  Constants.expoConfig?.ios?.buildNumber?.toString() ??
  '1';
