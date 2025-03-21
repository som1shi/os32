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
const CACHE_EXPIRATION = 120000;
const FETCH_TIMEOUT = 10000;

const VALID_COLLECTIONS = [
  'refiner-30',
  'refiner-60',
  'refiner-180',
  'refiner-300',
  'refiner-600',
  'wordsweeper',
  'colormania'
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
  if (!userIds || userIds.length === 0) {
    return [];
  }
  
  const uniqueUserIds = [...new Set(userIds)];
  
  const uncachedUserIds = uniqueUserIds.filter(id => !userCache.has(id));
  
  if (uncachedUserIds.length === 0) {
    return uniqueUserIds.map(id => userCache.get(id) || { displayName: 'Unknown Player' });
  }
  
  const batchSize = 10;
  
  const fetchPromises = [];
  
  for (let i = 0; i < uncachedUserIds.length; i += batchSize) {
    const batch = uncachedUserIds.slice(i, i + batchSize);
    if (batch.length === 0) continue;
    
    fetchPromises.push((async () => {
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
          
          const foundUserIds = new Set();
          
          userSnapshots.forEach(userDoc => {
            userCache.set(userDoc.id, userDoc.data());
            foundUserIds.add(userDoc.id);
          });
          
          batch.forEach(userId => {
            if (!foundUserIds.has(userId) && !userCache.has(userId)) {
              userCache.set(userId, { displayName: 'Unknown Player' });
            }
          });
        }
      } catch (err) {
        console.error('Error fetching user batch:', err);
        batch.forEach(userId => {
          if (!userCache.has(userId)) {
            userCache.set(userId, { displayName: 'Unknown Player' });
          }
        });
      }
    })());
  }
  
  try {
    await withTimeout(Promise.all(fetchPromises), FETCH_TIMEOUT);
  } catch (err) {
    console.error('User fetch timeout:', err);
    uncachedUserIds.forEach(userId => {
      if (!userCache.has(userId)) {
        userCache.set(userId, { displayName: 'Unknown Player' });
      }
    });
  }
  
  return uniqueUserIds.map(id => userCache.get(id) || { displayName: 'Unknown Player' });
};

const getCachedLeaderboard = (cacheKey, limitCount) => {
  const cachedData = leaderboardCache.get(cacheKey);
  if (cachedData) {
    return {
      scores: [...cachedData.scores].slice(0, limitCount),
      timestamp: cachedData.timestamp
    };
  }
  return null;
};

const withTimeout = (promise, timeoutMs) => {
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error('Operation timed out'));
    }, timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutHandle);
  });
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

export const getTopScores = async (collectionName, limitCount = 5, forceRefresh = false) => {
  try {
    const validatedCollection = validateCollection(collectionName);
    
    const cacheKey = validatedCollection;
    const cachedData = getCachedLeaderboard(cacheKey, limitCount);
    
    if (!forceRefresh && cachedData) {
      if ((Date.now() - cachedData.timestamp) >= CACHE_EXPIRATION) {
        setTimeout(() => {
          getTopScores(collectionName, limitCount, true)
            .catch(err => console.error('Background refresh failed:', err));
        }, 100);
      }
      return cachedData.scores;
    }
    
    const scoresQuery = query(
      collection(db, validatedCollection),
      orderBy('score', 'desc'),
      limit(limitCount * 2)
    );
    
    const querySnapshot = await withTimeout(getDocs(scoresQuery), FETCH_TIMEOUT);
    
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
    
    await withTimeout(batchFetchUserData(userIds), FETCH_TIMEOUT);
    
    const scores = scoresData.map(scoreData => {
      const userData = scoreData.userId ? 
        userCache.get(scoreData.userId) || { displayName: scoreData.playerName || 'Unknown Player' } :
        { displayName: scoreData.playerName || 'Unknown Player' };
      
      let photoURL = userData.photoURL || null;
      if (photoURL) {
        if (photoURL.includes('=s96-c')) {
          photoURL = photoURL.replace('=s96-c', '=s32-c');
        } else if (photoURL.includes('&s96-c')) {
          photoURL = photoURL.replace('&s96-c', '&s32-c');
        }
      }
      
      return {
        ...scoreData,
        user: {
          displayName: userData.displayName || scoreData.playerName || 'Unknown Player',
          photoURL: photoURL
        }
      };
    });
    
    leaderboardCache.set(cacheKey, {
      scores,
      timestamp: Date.now()
    });
    
    return scores.slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching top scores:', error);
    
    const cacheKey = validateCollection(collectionName);
    const cachedData = getCachedLeaderboard(cacheKey, limitCount);
    if (cachedData) {
      return cachedData.scores;
    }
    
    return [];
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

export const subscribeToLeaderboard = (collectionName, limitCount = 5, callback) => {
  try {
    const validatedCollection = validateCollection(collectionName);
    
    const cacheKey = validatedCollection;
    const cachedData = getCachedLeaderboard(cacheKey, limitCount);
    
    if (cachedData) {
      setTimeout(() => {
        callback(cachedData.scores);
      }, 0);
    } else {
      setTimeout(() => {
        callback([]);
      }, 0);
    }
    
    const scoresQuery = query(
      collection(db, validatedCollection),
      orderBy('score', 'desc'),
      limit(limitCount)
    );
    
    const timeoutId = setTimeout(() => {
      if (cachedData) {
        callback(cachedData.scores);
      } else {
        callback([]);
      }
    }, 5000);
    
    return onSnapshot(scoresQuery, async (snapshot) => {
      clearTimeout(timeoutId);
      
      if (snapshot.empty) {
        if (cachedData) {
          callback(cachedData.scores);
        } else {
          callback([]);
        }
        return;
      }
      
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
      
      try {
        await withTimeout(batchFetchUserData(userIds), FETCH_TIMEOUT);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
      
      const scores = scoresData.map(scoreData => {
        const userData = scoreData.userId ? 
          userCache.get(scoreData.userId) || { displayName: scoreData.playerName || 'Unknown Player' } :
          { displayName: scoreData.playerName || 'Unknown Player' };
        
        let photoURL = userData.photoURL || null;
        if (photoURL) {
          if (photoURL.includes('=s96-c')) {
            photoURL = photoURL.replace('=s96-c', '=s32-c');
          } else if (photoURL.includes('&s96-c')) {
            photoURL = photoURL.replace('&s96-c', '&s32-c');
          }
        }
        
        return {
          ...scoreData,
          user: {
            displayName: userData.displayName || scoreData.playerName || 'Unknown Player',
            photoURL: photoURL
          }
        };
      });
      
      leaderboardCache.set(cacheKey, {
        scores,
        timestamp: Date.now()
      });
      
      callback(scores);
    }, (error) => {
      clearTimeout(timeoutId);
      console.error('Snapshot error:', error);
      
      const cachedData = getCachedLeaderboard(cacheKey, limitCount);
      if (cachedData) {
        callback(cachedData.scores);
      } else {
        callback([]);
      }
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    
    const cachedData = getCachedLeaderboard(cacheKey, limitCount);
    if (cachedData) {
      callback(cachedData.scores);
    } else {
      callback([]);
    }
    
    return () => {};
  }
}; 