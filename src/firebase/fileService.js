import { db } from './config';
import { collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

export const getFiles = (userId, callback) => {
  const filesRef = collection(db, 'users', userId, 'files');
  const q = query(filesRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const files = [];
    snapshot.forEach((doc) => {
      files.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(files);
  });
};

export const createFile = async (userId, fileData) => {
  const filesRef = collection(db, 'users', userId, 'files');
  const newFileRef = doc(filesRef);
  await setDoc(newFileRef, fileData);
  return newFileRef.id;
};

export const updateFile = async (userId, fileId, fileData) => {
  const fileRef = doc(db, 'users', userId, 'files', fileId);
  await updateDoc(fileRef, fileData);
};

export const deleteFile = async (userId, fileId) => {
  const fileRef = doc(db, 'users', userId, 'files', fileId);
  await deleteDoc(fileRef);
}; 