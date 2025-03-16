import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  enableNetwork,
  disableNetwork,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { db } from './config';

let isOnline = true;
let connectionStateListeners = [];

const userCache = new Map();
const leaderboardCache = new Map();
const CACHE_EXPIRATION = 60000;

const VALID_COLLECTIONS = [
  'refiner-30',
  'refiner-60',
  'refiner-180',
  'refiner-300',
  'refiner-600',
  'wordsweeper'
];

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    enableNetwork(db).catch(() => {});
    notifyConnectionStateChange(true);
  });
  
  window.addEventListener('offline', () => {
    isOnline = false;
    disableNetwork(db).catch(() => {});
    notifyConnectionStateChange(false);
  });
}

function notifyConnectionStateChange(online) {
  connectionStateListeners.forEach(listener => {
    try {
      listener(online);
    } catch (err) {}
  });
}

export const addConnectionStateListener = (listener) => {
  connectionStateListeners.push(listener);
  listener(isOnline);
  
  return () => {
    connectionStateListeners = connectionStateListeners.filter(l => l !== listener);
  };
};

const validateCollection = (collectionName) => {
  if (!VALID_COLLECTIONS.includes(collectionName)) {
    throw new Error(`Invalid collection name: ${collectionName}. Must be one of: ${VALID_COLLECTIONS.join(', ')}`);
  }
  return collectionName;
};

const safeTimestamp = (scoreData) => {
  try {
    if (scoreData.timestamp && typeof scoreData.timestamp.toDate === 'function') {
      return scoreData.timestamp.toDate();
    } else if (scoreData.clientTimestamp) {
      return new Date(scoreData.clientTimestamp);
    }
  } catch (err) {}
  return new Date();
};

const batchFetchUserData = async (userIds) => {
  const uncachedUserIds = userIds.filter(id => !userCache.has(id));
  
  if (uncachedUserIds.length === 0) {
    return userIds.map(id => userCache.get(id) || { displayName: 'Unknown Player' });
  }
  
  const batchSize = 10;
  
  for (let i = 0; i < uncachedUserIds.length; i += batchSize) {
    const batch = uncachedUserIds.slice(i, i + batchSize);
    if (batch.length === 0) continue;
    
    try {
      if (batch.length === 1) {
        const userRef = doc(db, 'users', batch[0]);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          userCache.set(batch[0], userData);
        } else {
          userCache.set(batch[0], { displayName: 'Unknown Player' });
        }
      } else {
        const usersQuery = query(
          collection(db, 'users'),
          where('__name__', 'in', batch)
        );
        
        const userSnapshots = await getDocs(usersQuery);
        userSnapshots.forEach(userDoc => {
          userCache.set(userDoc.id, userDoc.data());
        });
        
        batch.forEach(userId => {
          if (!userCache.has(userId)) {
            userCache.set(userId, { displayName: 'Unknown Player' });
          }
        });
      }
    } catch (err) {
      batch.forEach(userId => {
        if (!userCache.has(userId)) {
          userCache.set(userId, { displayName: 'Unknown Player' });
        }
      });
    }
  }
  
  return userIds.map(id => userCache.get(id) || { displayName: 'Unknown Player' });
};

export const submitScore = async (userId, collectionName, score, gameDetails = {}) => {
  try {
    const validatedCollection = validateCollection(collectionName);
    
    let numericScore;
    
    if (typeof score === 'number') {
      numericScore = score;
    } else if (typeof score === 'string') {
      numericScore = parseInt(score, 10);
    } else {
      numericScore = Number(score);
    }
    
    if (isNaN(numericScore)) {
      if (gameDetails && typeof gameDetails.finalScore === 'number') {
        numericScore = gameDetails.finalScore;
      } else if (gameDetails && typeof gameDetails.scoreFromRef === 'number') {
        numericScore = gameDetails.scoreFromRef;
      } else {
        numericScore = 0;
      }
    }
    
    if (!isOnline) {
      throw new Error('Device is offline');
    }
    
    const cleanGameDetails = { ...gameDetails };
    Object.keys(cleanGameDetails).forEach(key => {
      if (cleanGameDetails[key] === undefined || cleanGameDetails[key] === null) {
        delete cleanGameDetails[key];
      }
    });
    
    const scoreData = {
      userId,
      score: numericScore,
      timestamp: serverTimestamp(),
      clientTimestamp: new Date().toISOString(),
      playerName: cleanGameDetails.playerName || 'Unknown Player',
      ...cleanGameDetails
    };
    
    const collectionRef = collection(db, validatedCollection);
    
    const customId = `${numericScore}-${validatedCollection}-${userId}-${Date.now()}`;
    const docRef = doc(collectionRef, customId);
    
    await setDoc(docRef, scoreData);
    
    leaderboardCache.delete(validatedCollection);
    
    return customId;
  } catch (error) {
    if (error.code === 'invalid-argument') {
      try {
        const collectionRef = collection(db, validatedCollection);
        const docRef = await addDoc(collectionRef, scoreData);
        return docRef.id;
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
    
    throw error;
  }
};

export const getTopScores = async (collectionName, limitCount = 10) => {
  try {
    const validatedCollection = validateCollection(collectionName);
    
    const cacheKey = validatedCollection;
    const cachedData = leaderboardCache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_EXPIRATION) {
      return cachedData.scores.slice(0, limitCount);
    }
    
    const scoresQuery = query(
      collection(db, validatedCollection),
      orderBy('score', 'desc'),
      limit(limitCount * 2)
    );
    
    const querySnapshot = await getDocs(scoresQuery);
    
    const userIds = [];
    const scoresData = [];
    
    querySnapshot.docs.forEach(scoreDoc => {
      const scoreData = scoreDoc.data();
      if (scoreData.userId) {
        userIds.push(scoreData.userId);
      }
      scoresData.push({
        id: scoreDoc.id,
        ...scoreData,
        timestamp: safeTimestamp(scoreData)
      });
    });
    
    await batchFetchUserData(userIds);
    
    const scores = scoresData.map(scoreData => {
      const userData = scoreData.userId ? 
        userCache.get(scoreData.userId) || { displayName: scoreData.playerName || 'Unknown Player' } :
        { displayName: scoreData.playerName || 'Unknown Player' };
      
      return {
        ...scoreData,
        user: {
          displayName: userData.displayName || scoreData.playerName || 'Unknown Player',
          photoURL: userData.photoURL
        }
      };
    });
    
    leaderboardCache.set(cacheKey, {
      scores,
      timestamp: Date.now()
    });
    
    return scores.slice(0, limitCount);
  } catch (error) {
    throw error;
  }
};

export const getUserBestScore = async (userId, collectionName) => {
  try {
    const validatedCollection = validateCollection(collectionName);
    
    const scoresQuery = query(
      collection(db, validatedCollection),
      where('userId', '==', userId),
      orderBy('score', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(scoresQuery);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const scoreData = querySnapshot.docs[0].data();
    
    return {
      id: querySnapshot.docs[0].id,
      ...scoreData,
      timestamp: safeTimestamp(scoreData)
    };
  } catch (error) {
    throw error;
  }
};

export const getUserRecentScores = async (userId, limitCount = 10) => {
  try {
    const allScores = [];
    
    for (const collectionName of VALID_COLLECTIONS) {
      try {
        const scoresQuery = query(
          collection(db, collectionName),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );
        
        const querySnapshot = await getDocs(scoresQuery);
        
        querySnapshot.docs.forEach(doc => {
          const data = doc.data();
          
          allScores.push({
            id: doc.id,
            collectionName,
            ...data,
            timestamp: safeTimestamp(data)
          });
        });
      } catch (err) {}
    }
    
    return allScores
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limitCount);
  } catch (error) {
    throw error;
  }
};

export const subscribeToLeaderboard = (collectionName, limitCount = 10, callback) => {
  try {
    const validatedCollection = validateCollection(collectionName);
    
    const cacheKey = validatedCollection;
    const cachedData = leaderboardCache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_EXPIRATION) {
      setTimeout(() => {
        callback(cachedData.scores.slice(0, limitCount));
      }, 0);
    }
    
    const scoresQuery = query(
      collection(db, validatedCollection),
      orderBy('score', 'desc'),
      limit(limitCount * 2)
    );
    
    return onSnapshot(scoresQuery, async (snapshot) => {
      const userIds = [];
      const scoresData = [];
      
      snapshot.docs.forEach(scoreDoc => {
        const scoreData = scoreDoc.data();
        if (scoreData.userId) {
          userIds.push(scoreData.userId);
        }
        scoresData.push({
          id: scoreDoc.id,
          ...scoreData,
          timestamp: safeTimestamp(scoreData)
        });
      });
      
      await batchFetchUserData(userIds);
      
      const scores = scoresData.map(scoreData => {
        const userData = scoreData.userId ? 
          userCache.get(scoreData.userId) || { displayName: scoreData.playerName || 'Unknown Player' } :
          { displayName: scoreData.playerName || 'Unknown Player' };
        
        return {
          ...scoreData,
          user: {
            displayName: userData.displayName || scoreData.playerName || 'Unknown Player',
            photoURL: userData.photoURL
          }
        };
      });
      
      leaderboardCache.set(cacheKey, {
        scores,
        timestamp: Date.now()
      });
      
      callback(scores.slice(0, limitCount));
    }, (error) => {
      callback([]);
    });
  } catch (error) {
    return () => {};
  }
}; 