import { initializeApp } from "@firebase/app";
import { getAuth } from "@firebase/auth";
import { getFirestore } from "@firebase/firestore";

// Firebase configuration for the Vacancy Calculation project
const firebaseConfig = {
  apiKey: "AIzaSyCkjqW_ng2ovYDY-uOwb3y8dHDnKrPUr0s",
  authDomain: "vacancy-calculation.firebaseapp.com",
  projectId: "vacancy-calculation",
  storageBucket: "vacancy-calculation.firebasestorage.app",
  messagingSenderId: "662714562201",
  appId: "1:662714562201:web:5595afa978c02a069f6a08",
  measurementId: "G-HGWFZXME2S",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
