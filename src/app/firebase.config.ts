import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1Qf2T8fa6XVRXyI6lnYTw-8flIMOxbII",
  authDomain: "newstalgia-f019d.firebaseapp.com",
  projectId: "newstalgia-f019d",
  storageBucket: "newstalgia-f019d.firebasestorage.app",
  messagingSenderId: "512552991212",
  appId: "1:512552991212:web:70ade11a8e14b59f89a8c9",
  measurementId: "G-6S3CNVNNTF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); 