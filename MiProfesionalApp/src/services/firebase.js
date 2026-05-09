import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase project configuration - MiProfesional
const firebaseConfig = {
  apiKey: "AIzaSyBqYJZaLAgDmzXfT2fk_flacCqsHioOcM0",
  authDomain: "miprofesional-e57cf.firebaseapp.com",
  projectId: "miprofesional-e57cf",
  storageBucket: "miprofesional-e57cf.firebasestorage.app",
  messagingSenderId: "691897081822",
  appId: "1:691897081822:web:92a129613fbb957043074f",
  measurementId: "G-LNTR5WQR5P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
