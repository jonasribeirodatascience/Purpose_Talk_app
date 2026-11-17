import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  isSigningIn: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<User | null> => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      return credential.user;
    } catch (error: unknown) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: unknown }).code)
          : '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Login cancelado antes da conclusão.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('O pop-up de login foi bloqueado pelo navegador. Libere os pop-ups e tente novamente.');
      } else {
        setAuthError('Não foi possível conectar com o Google. Tente novamente em instantes.');
      }
      return null;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOutUser = async (): Promise<void> => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao sair da conta Google:', error);
      setAuthError('Não foi possível encerrar a sessão.');
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        isSigningIn,
        authError,
        clearAuthError: () => setAuthError(null),
        signInWithGoogle,
        signOutUser,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebase(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase deve ser usado dentro de um FirebaseProvider');
  }
  return ctx;
}
