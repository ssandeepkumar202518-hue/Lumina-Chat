import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          // Subscribe to user updates
          const unsubProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (doc) => {
            if (doc.exists()) {
              setUser(doc.data() as User);
            }
          });
          setLoading(false);
          return unsubProfile;
        } else {
          // Create new user profile
          const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Anonymous',
            photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
            username: firebaseUser.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || `user_${firebaseUser.uid.slice(0, 5)}`,
            isOnline: true,
            lastSeen: Date.now(),
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Update presence
  useEffect(() => {
    if (!user) return;

    const updatePresence = async (online: boolean) => {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          isOnline: online,
          lastSeen: Date.now()
        });
        await setDoc(doc(db, 'presence', user.uid), {
          uid: user.uid,
          isOnline: online,
          lastSeen: Date.now()
        }, { merge: true });
      } catch (err) {
        console.error('Presence update error:', err);
      }
    };

    updatePresence(true);

    const handleVisibilityChange = () => {
      updatePresence(document.visibilityState === 'visible');
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', () => updatePresence(false));

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      updatePresence(false);
    };
  }, [user?.uid]);

  const [isSigningIn, setIsSigningIn] = useState(false);

  const signInWithGoogle = async () => {
    if (isSigningIn) return;
    
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Firebase Auth Error:', error);
      if (error.code === 'auth/popup-blocked') {
        alert('Sign-in popup was blocked. Please allow popups for this site or open the app in a new tab to sign in.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Ignore cancelled requests
      } else if (error.code === 'auth/popup-closed-by-user') {
        // Ignore if user closed it
      } else {
        alert('Authentication failed: ' + error.message);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const logout = async () => {
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        isOnline: false,
        lastSeen: Date.now()
      });
    }
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
