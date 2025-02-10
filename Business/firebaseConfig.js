// firebaseConfig.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js';
import { getFirestore, doc, setDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyCfURsGecDlJ0U_T9lUXhonwvbBfoDAjJs",
  authDomain: "gap-business-finance-tracker.firebaseapp.com",
  projectId: "gap-business-finance-tracker",
  storageBucket: "gap-business-finance-tracker.firebasestorage.app",
  messagingSenderId: "313106435110",
  appId: "1:313106435110:web:118f852ef41b6c4cdc6ae7",
  measurementId: "G-7PNHBQ52TY"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
