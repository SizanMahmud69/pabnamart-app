
"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import app from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import type { User as AppUser } from '@/types';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const DEFAULT_AVATAR_URL = "https://pix1.wapkizfile.info/download/3090f1dc137678b1189db8cd9174efe6/sizan+wapkiz+click/1puser-(sizan.wapkiz.click).gif";

interface AuthContextType {
  user: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, displayName: string) => Promise<any>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUserDisplayName: (displayName: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateUserProfilePicture: (photoURL: string) => Promise<void>;
  signInWithGoogle: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!app) {
      setLoading(false);
      return;
    }
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const unsub = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                  setAppUser({ ...docSnap.data(), uid: docSnap.id } as AppUser);
              }
              setLoading(false);
          });
          return () => unsub();
      } else {
          setAppUser(null);
          setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!app) throw new Error("Firebase not initialized");
    const auth = getAuth(app);
    const db = getFirestore(app);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as AppUser;
        if (userData.status === 'banned') {
            await signOut(auth);
            throw new Error('Your account has been banned. Please contact support.');
        }
    } else {
        await signOut(auth);
        throw new Error('User data not found. Please contact support.');
    }

    return userCredential;
  };

  const signup = async (email: string, password: string, displayName: string) => {
    if (!app) throw new Error("Firebase not initialized");
    const auth = getAuth(app);
    const db = getFirestore(app);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    await updateProfile(firebaseUser, { displayName, photoURL: DEFAULT_AVATAR_URL });
    
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const newAppUser: Omit<AppUser, 'uid'> = {
        email: firebaseUser.email,
        displayName: displayName,
        photoURL: DEFAULT_AVATAR_URL,
        status: 'active',
        joined: new Date().toISOString(),
        shippingAddresses: [],
        usedVoucherCodes: [],
    };

    await setDoc(userDocRef, newAppUser);

    if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName, photoURL: DEFAULT_AVATAR_URL });
        setUser({ ...auth.currentUser });
    }
    return userCredential;
  };

  const signInWithGoogle = async () => {
    if (!app) throw new Error("Firebase not initialized");
    const auth = getAuth(app);
    const db = getFirestore(app);
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      const newAppUser: Omit<AppUser, 'uid'> = {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL || DEFAULT_AVATAR_URL,
        status: 'active',
        joined: new Date().toISOString(),
        shippingAddresses: [],
        usedVoucherCodes: [],
      };
      await setDoc(userDocRef, newAppUser);
    } else {
        const userData = userDocSnap.data() as AppUser;
        if (userData.status === 'banned') {
            await signOut(auth);
            throw new Error('Your account has been banned. Please contact support.');
        }
    }
    return result;
  };


  const logout = () => {
    if (!app) return Promise.resolve();
    const auth = getAuth(app);
    return signOut(auth);
  };

  const sendPasswordReset = (email: string) => {
    if (!app) throw new Error("Firebase not initialized");
    const auth = getAuth(app);
    return sendPasswordResetEmail(auth, email);
  };
  
  const updateUserDisplayName = async (displayName: string) => {
    if (!app) throw new Error("Firebase not initialized");
    const auth = getAuth(app);
    const db = getFirestore(app);
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName });
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userDocRef, { displayName }, { merge: true });
        setUser({ ...auth.currentUser });
    } else {
        throw new Error("No user is signed in.");
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!app) throw new Error("Firebase not initialized");
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (user && user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        try {
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
        } catch (error: any) {
            if (error.code === 'auth/wrong-password') {
                throw new Error("Incorrect current password.");
            }
            if (error.code === 'auth/too-many-requests') {
                 throw new Error("Too many attempts. Please try again later.");
            }
            throw new Error("Failed to re-authenticate. You may need to log out and log in again.");
        }
    } else {
        throw new Error("No user is signed in or user has no email.");
    }
  };

  const updateUserProfilePicture = async (photoURL: string) => {
    if (!app) throw new Error("Firebase not initialized");
    const auth = getAuth(app);
    const db = getFirestore(app);
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error("No user is signed in.");
    }

    await updateProfile(currentUser, { photoURL });
    
    const userDocRef = doc(db, 'users', currentUser.uid);
    await setDoc(userDocRef, { photoURL }, { merge: true });

    setUser(prevUser => {
      if (!prevUser) return null;
      const newUser = { ...prevUser, photoURL: photoURL };
      Object.assign(newUser, {
        ...currentUser,
        photoURL: photoURL
      });
      return newUser as FirebaseUser;
    });
  };

  const value = {
    user,
    appUser,
    loading,
    login,
    signup,
    logout,
    sendPasswordReset,
    updateUserDisplayName,
    updateUserPassword,
    updateUserProfilePicture,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  const AuthComponent = (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login');
      }
    }, [user, loading, router]);

    if (loading || !user) {
      return <LoadingSpinner />;
    }

    return <Component {...props} />;
  };
  AuthComponent.displayName = `WithAuth(${Component.displayName || Component.name || 'Component'})`;
  return AuthComponent;
};
