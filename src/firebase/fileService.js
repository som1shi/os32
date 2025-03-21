import { db } from './config';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  limit
} from 'firebase/firestore';

/**
 * Get files for a user with real-time updates
 * @param {string} userId - User ID
 * @param {function} callback - Callback function for file updates
 * @param {number} maxFiles - Maximum number of files to retrieve
 * @returns {function} Unsubscribe function
 */
export const getFiles = (userId, callback, maxFiles = 50) => {
  if (!userId) {
    callback([]);
    return () => {};
  }
  
  try {
    const filesRef = collection(db, 'users', userId, 'files');
    const q = query(
      filesRef, 
      orderBy('updatedAt', 'desc'),
      limit(maxFiles)
    );
    
    return onSnapshot(q, 
      (snapshot) => {
        const files = [];
        snapshot.forEach((doc) => {
          files.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(files);
      },
      (error) => {
        console.error('Error getting files:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up files listener:', error);
    callback([]);
    return () => {};
  }
};

/**
 * Create a new file
 * @param {string} userId - User ID
 * @param {object} fileData - File data
 * @returns {string} New file ID
 */
export const createFile = async (userId, fileData) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!fileData || typeof fileData !== 'object') {
    throw new Error('File data is required and must be an object');
  }
  
  const safeFileData = {
    ...fileData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId
  };
  
  delete safeFileData.id;
  
  try {
    const filesRef = collection(db, 'users', userId, 'files');
    const newFileRef = doc(filesRef);
    await setDoc(newFileRef, safeFileData);
    return newFileRef.id;
  } catch (error) {
    console.error('Error creating file:', error);
    throw new Error(`Failed to create file: ${error.message}`);
  }
};

/**
 * Update an existing file
 * @param {string} userId - User ID
 * @param {string} fileId - File ID
 * @param {object} fileData - Updated file data
 */
export const updateFile = async (userId, fileId, fileData) => {
  if (!userId || !fileId) {
    throw new Error('User ID and File ID are required');
  }

  if (!fileData || typeof fileData !== 'object') {
    throw new Error('File data is required and must be an object');
  }
  
  const safeUpdateData = {
    ...fileData,
    updatedAt: serverTimestamp()
  };
  
  delete safeUpdateData.id;
  delete safeUpdateData.createdAt;
  delete safeUpdateData.createdBy;
  
  try {
    const fileRef = doc(db, 'users', userId, 'files', fileId);
    await updateDoc(fileRef, safeUpdateData);
  } catch (error) {
    console.error('Error updating file:', error);
    throw new Error(`Failed to update file: ${error.message}`);
  }
};

/**
 * Delete a file
 * @param {string} userId - User ID
 * @param {string} fileId - File ID
 */
export const deleteFile = async (userId, fileId) => {
  if (!userId || !fileId) {
    throw new Error('User ID and File ID are required');
  }
  
  try {
    const fileRef = doc(db, 'users', userId, 'files', fileId);
    await deleteDoc(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}; 