import { db } from './config';
import { 
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  limit,
  orderBy
} from 'firebase/firestore';

// Collection name
const EMAILS_COLLECTION = 'emails';

/**
 * Send a new email
 * @param {string} from - Sender's email
 * @param {string} to - Recipient's email
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @returns {Promise<string>} - The ID of the new email
 */
export const sendEmail = async (from, to, subject, body) => {
  try {
    const emailData = {
      from,
      to,
      subject,
      body,
      timestamp: serverTimestamp(),
      read: false,
      archived: false,
      deleted: false
    };
    
    const docRef = await addDoc(collection(db, EMAILS_COLLECTION), emailData);
    console.log('Email sent:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Get all emails in the inbox for a user
 * @param {string} userEmail - The user's email
 * @returns {Promise<Array>} - Array of email objects
 */
export const getInbox = async (userEmail) => {
  try {
    console.log('Getting inbox for:', userEmail);
    
    const q = query(
      collection(db, EMAILS_COLLECTION),
      where('to', '==', userEmail),
      where('deleted', '==', false),
      where('archived', '==', false),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const inboxEmails = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
    }));
    
    console.log(`Found ${inboxEmails.length} inbox emails`);
    return inboxEmails;
  } catch (error) {
    console.error('Error getting inbox:', error);
    return [];
  }
};

/**
 * Get all sent emails from a user
 * @param {string} userEmail - The user's email
 * @returns {Promise<Array>} - Array of email objects
 */
export const getSentEmails = async (userEmail) => {
  try {
    const q = query(
      collection(db, EMAILS_COLLECTION),
      where('from', '==', userEmail),
      where('deleted', '==', false),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const sentEmails = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
    }));
    
    return sentEmails;
  } catch (error) {
    console.error('Error getting sent emails:', error);
    return [];
  }
};

/**
 * Get all archived emails for a user
 * @param {string} userEmail - The user's email
 * @returns {Promise<Array>} - Array of email objects
 */
export const getArchivedEmails = async (userEmail) => {
  try {
    const q = query(
      collection(db, EMAILS_COLLECTION),
      where('to', '==', userEmail),
      where('archived', '==', true),
      where('deleted', '==', false),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const archivedEmails = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
    }));
    
    return archivedEmails;
  } catch (error) {
    console.error('Error getting archived emails:', error);
    return [];
  }
};

/**
 * Mark an email as read
 * @param {string} emailId - The email ID
 * @returns {Promise<void>}
 */
export const markAsRead = async (emailId) => {
  try {
    const emailRef = doc(db, EMAILS_COLLECTION, emailId);
    await updateDoc(emailRef, {
      read: true
    });
    console.log('Marked email as read:', emailId);
    return;
  } catch (error) {
    console.error('Error marking email as read:', error);
    throw error;
  }
};

/**
 * Archive an email
 * @param {string} emailId - The email ID
 * @returns {Promise<void>}
 */
export const archiveEmail = async (emailId) => {
  try {
    const emailRef = doc(db, EMAILS_COLLECTION, emailId);
    await updateDoc(emailRef, {
      archived: true
    });
    console.log('Archived email:', emailId);
    return;
  } catch (error) {
    console.error('Error archiving email:', error);
    throw error;
  }
};

/**
 * Delete an email
 * @param {string} emailId - The email ID
 * @returns {Promise<void>}
 */
export const deleteEmail = async (emailId) => {
  try {
    const emailRef = doc(db, EMAILS_COLLECTION, emailId);
    await updateDoc(emailRef, {
      deleted: true
    });
    console.log('Deleted email:', emailId);
    return;
  } catch (error) {
    console.error('Error deleting email:', error);
    throw error;
  }
};

/**
 * Get a specific email by ID
 * @param {string} emailId - The email ID
 * @returns {Promise<Object>} - The email object
 */
export const getEmailById = async (emailId) => {
  try {
    const emailRef = doc(db, EMAILS_COLLECTION, emailId);
    const docSnap = await getDoc(emailRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        timestamp: docSnap.data().timestamp?.toDate?.() || docSnap.data().timestamp
      };
    } else {
      throw new Error('Email not found');
    }
  } catch (error) {
    console.error('Error getting email by ID:', error);
    throw error;
  }
};

/**
 * Get user suggestions for autocomplete
 * @param {string} query - The search query
 * @returns {Promise<Array>} - Array of user suggestions
 */
export const getUserSuggestions = async (searchQuery) => {
  try {
    // Use Firestore to get user data
    const usersQuery = query(
      collection(db, 'users'),
      where('displayName', '>=', searchQuery),
      where('displayName', '<=', searchQuery + '\uf8ff'),
      limit(10)
    );
    
    const querySnapshot = await getDocs(usersQuery);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    return querySnapshot.docs.map(doc => ({
      name: doc.data().displayName || doc.data().email,
      email: doc.data().email
    }));
  } catch (error) {
    console.error('Error getting user suggestions:', error);
    return [];
  }
};

/**
 * Get all users who have sent or received emails
 * @returns {Promise<Array>} - Array of unique email addresses
 */
export const getAllMailingUsers = async () => {
  try {
    const sentQuery = query(collection(db, EMAILS_COLLECTION), limit(100));
    const querySnapshot = await getDocs(sentQuery);
    
    // Extract unique sender and recipient email addresses
    const emailAddresses = new Set();
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.from) emailAddresses.add(data.from);
      if (data.to) emailAddresses.add(data.to);
    });
    
    return Array.from(emailAddresses);
  } catch (error) {
    console.error('Error getting mailing users:', error);
    return [];
  }
}; 