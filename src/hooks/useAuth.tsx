
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
  User as FirebaseUser,
} from 'firebase/auth';
import app from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import type { User as AppUser } from '@/types';

const auth = getAuth(app);
const db = getFirestore(app);

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, displayName: string) => Promise<any>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
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
        // This case might happen if user was created in Auth but not in Firestore, or was deleted from Firestore.
        // For security, we can deny login.
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
        status: 'active',
        joined: new Date().toISOString(),
    });

    // Manually update the user state because onAuthStateChanged might not fire immediately
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

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    sendPasswordReset,
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
