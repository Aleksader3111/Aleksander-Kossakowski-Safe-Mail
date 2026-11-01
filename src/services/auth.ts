import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Provider setup with required Gmail scope
export const GMAIL_MODIFY_SCOPE = 'https://www.googleapis.com/auth/gmail.modify';
const provider = new GoogleAuthProvider();
provider.addScope(GMAIL_MODIFY_SCOPE);
provider.setCustomParameters({
  prompt: 'select_account',
});

// IN-MEMORY TOKEN CACHING ONLY (NEVER localStorage or sessionStorage!)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Default target email specified in product requirements
export const DEFAULT_TARGET_EMAIL = 'akossakowski18@gmail.com';

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If user is logged into Firebase but token was lost from memory on refresh,
        // let the UI know that re-authentication or token acquisition is needed.
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (
  enforceTargetEmail = false,
  allowedEmail = DEFAULT_TARGET_EMAIL
): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Nie udało się uzyskać tokenu dostępu Google OAuth.');
    }

    const userEmail = result.user.email?.toLowerCase().trim();

    if (enforceTargetEmail && userEmail && userEmail !== allowedEmail.toLowerCase().trim()) {
      await signOut(auth);
      cachedAccessToken = null;
      throw new Error(
        `ODMOWA POŁĄCZENIA: Zalogowano się na konto "${userEmail}". Aplikacja jest skonfigurowana dla konta docelowego "${allowedEmail}". Zaloguj się właściwym adresem Gmail.`
      );
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Błąd logowania Google Auth:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } finally {
    cachedAccessToken = null;
  }
};
