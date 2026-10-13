import { Share } from 'react-native';

// Update once the app is published under a different listing
export const APP_URL = 'https://play.google.com/store/apps/details?id=com.frogups.frogups';

export const SHARE_MESSAGE = `GET FROGGED WITH ME! 🐸🪷💦\n${APP_URL}`;

export async function shareApp(): Promise<boolean> {
  try {
    const result = await Share.share({ message: SHARE_MESSAGE });

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('Failed to share app:', error);
    return false;
  }
}
