import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { submitScore } from './scoreService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
      } else {
        await setDoc(userRef, {
          lastLogin: serverTimestamp()
        }, { merge: true });
      }
      
      submitPendingScores(user.uid);
      
      return user;
    } catch (error) {
      throw error;
    }
  };

  const submitPendingScores = async (userId) => {
    try {
      const pendingScores = JSON.parse(localStorage.getItem('pendingScores') || '[]');
      if (pendingScores.length === 0) return;
      
      const remainingScores = [];
      const processedScoreIds = new Set();
      
      for (const pendingScore of pendingScores) {
        try {
          const scoreId = `${pendingScore.collectionName}_${userId}_${pendingScore.timestamp || Date.now()}`;
          
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
          if (err.message.includes('offline') || 
              err.code === 'unavailable' || 
              err.code === 'failed-precondition') {
            remainingScores.push(pendingScore);
          }
        }
      }
      
      localStorage.setItem('pendingScores', JSON.stringify(remainingScores));
    } catch (err) {
    }
  };

  const logOut = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      if (user) {
        submitPendingScores(user.uid);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signInWithGoogle,
    logOut,
    loading,
    submitPendingScores
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 