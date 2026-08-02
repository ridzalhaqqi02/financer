import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2VnK5050PaJkdn7PFIrkkoES7NmxcDtc",
  authDomain: "financetracker-a3d76.firebaseapp.com",
  projectId: "financetracker-a3d76",
  storageBucket: "financetracker-a3d76.firebasestorage.app",
  messagingSenderId: "23487859325",
  appId: "1:23487859325:web:ae0a2e174aa636da42bf14"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi Database (Firestore) yang siap digunakan
export const db = getFirestore(app);