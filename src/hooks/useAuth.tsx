
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
} from 'firebase/auth';
import app from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import type { User as AppUser } from '@/types';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';


const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

interface AuthContextType {
  user: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, displayName: string) => Promise<any>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUserDisplayName: (displayName: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  updateUserProfilePicture: (file: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Check user status in Firestore before allowing login
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
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    await updateProfile(firebaseUser, { displayName });
    
    // Create user document in Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const newAppUser: Omit<AppUser, 'uid'> = {
        email: firebaseUser.email,
        displayName: displayName,
        photoURL: null,
        status: 'active',
        joined: new Date().toISOString(),
        shippingAddresses: [],
        usedVoucherCodes: [],
    };

    await setDoc(userDocRef, newAppUser);

    const authInstance = getAuth(app);
    if (authInstance.currentUser) {
        await updateProfile(authInstance.currentUser, { displayName });
        setUser({ ...authInstance.currentUser });
    }
    return userCredential;
  };

  const logout = () => {
    return signOut(auth);
  };

  const sendPasswordReset = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };
  
  const updateUserDisplayName = async (displayName: string) => {
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName });
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userDocRef, { displayName }, { merge: true });
        setUser({ ...auth.currentUser });
    } else {
        throw new Error("No user is signed in.");
    }
  };

  const updateUserPassword = async (newPassword: string) => {
    if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
    } else {
        throw new Error("No user is signed in.");
    }
  };

  const updateUserProfilePicture = async (file: File) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error("No user is signed in.");
    }
    
    const storageRef = ref(storage, `profilePictures/${currentUser.uid}`);
    await uploadBytes(storageRef, file);
    const photoURL = await getDownloadURL(storageRef);

    await updateProfile(currentUser, { photoURL });
    
    const userDocRef = doc(db, 'users', currentUser.uid);
    await setDoc(userDocRef, { photoURL }, { merge: true });

    // Update the user state directly to force a re-render with the new photoURL
    setUser(prevUser => {
      if (!prevUser) return null;
      // Create a new object to ensure React detects the state change
      const newUser = { ...prevUser, photoURL: photoURL };
      // Manually update the properties that might not be immediately available
      // on the cloned object to match the official FirebaseUser type.
      // This part is a bit of a workaround to satisfy TypeScript and React's state updates.
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
