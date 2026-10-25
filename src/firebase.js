import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBPK6EcSrT3RFpO28rv5DG_yqRa7_nhymo",
  authDomain: "diaria-facil-289cb.firebaseapp.com",
  projectId: "diaria-facil-289cb",
  storageBucket: "diaria-facil-289cb.firebasestorage.app",
  messagingSenderId: "34820610072",
  appId: "1:34820610072:web:c99642ca57966569c4b6d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();