import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  browserSessionPersistence,
  setPersistence
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { submitScore } from './scoreService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    try {
      await setPersistence(auth, browserSessionPersistence);
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (!user || !user.uid) {
        throw new Error('Authentication failed: Invalid user data');
      }
      
      const userRef = doc(db, 'users', user.uid);
      
      try {
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName || 'Anonymous User',
            email: user.email,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
          });
        } else {
          await setDoc(userRef, {
            lastLogin: serverTimestamp(),
            ...(user.displayName && { displayName: user.displayName }),
            ...(user.photoURL && { photoURL: user.photoURL })
          }, { merge: true });
        }
        
        await submitPendingScores(user.uid);
      } catch (dbError) {
        console.error('Database error during sign-in:', dbError);
      }
      
      return user;
    } catch (error) {
      console.error('Google sign-in error:', error);
      setAuthError(error.message || 'Failed to sign in with Google');
      throw error;
    }
  }, []);

  const submitPendingScores = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      const pendingScores = JSON.parse(localStorage.getItem('pendingScores') || '[]');
      if (pendingScores.length === 0) return;
      
      const remainingScores = [];
      const processedScoreIds = new Set();
      
      const scoresToProcess = [...pendingScores];
      
      for (const pendingScore of scoresToProcess) {
        try {
          const scoreId = `${pendingScore.collectionName}_${userId}_${pendingScore.timestamp || Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          
          if (processedScoreIds.has(scoreId)) {
            continue;
          }
          
          processedScoreIds.add(scoreId);
          
          if (pendingScore.userId === userId) {
            await submitScore(
              userId,
              pendingScore.collectionName,
              pendingScore.score,
              pendingScore
            );
          } else {
            remainingScores.push(pendingScore);
          }
        } catch (err) {
          console.error('Error submitting pending score:', err);
          if (err.message?.includes('offline') || 
              err.code === 'unavailable' || 
              err.code === 'failed-precondition') {
            remainingScores.push(pendingScore);
          }
        }
      }
      
      localStorage.setItem('pendingScores', JSON.stringify(remainingScores));
    } catch (err) {
      console.error('Error processing pending scores:', err);
    }
  }, []);

  const logOut = useCallback(async () => {
    try {
      await signOut(auth);
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      if (user) {
        submitPendingScores(user.uid).catch(err => {
          console.error('Error submitting pending scores after auth change:', err);
        });
      }
    });

    return () => unsubscribe();
  }, [submitPendingScores]);

  const value = {
    currentUser,
    signInWithGoogle,
    logOut,
    loading,
    authError,
    clearAuthError: () => setAuthError(null),
    submitPendingScores
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 