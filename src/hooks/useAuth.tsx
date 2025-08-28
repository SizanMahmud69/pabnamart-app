
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
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import type { User as AppUser } from '@/types';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';


const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

interface AuthContextType {
  user: FirebaseUser | null;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
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
    await setDoc(userDocRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName,
        photoURL: null,
        status: 'active',
        joined: new Date().toISOString(),
        shippingAddresses: [],
    });

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
    if (!auth.currentUser) {
        throw new Error("No user is signed in.");
    }
    
    const storageRef = ref(storage, `profilePictures/${auth.currentUser.uid}`);
    await uploadBytes(storageRef, file);
    const photoURL = await getDownloadURL(storageRef);

    await updateProfile(auth.currentUser, { photoURL });
    
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userDocRef, { photoURL }, { merge: true });

    // Force a refresh of the user object to get the new photoURL
    await auth.currentUser.reload();
    const refreshedUser = auth.currentUser;
    setUser(refreshedUser ? { ...refreshedUser } : null);
  };

  const value = {
    user,
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
