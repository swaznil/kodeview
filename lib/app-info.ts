import Constants from 'expo-constants';

export const APP_NAME = 'KodeView';
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
export const APP_BUILD =
  Constants.expoConfig?.android?.versionCode?.toString() ??
  Constants.expoConfig?.ios?.buildNumber?.toString() ??
  '1';
