import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgz7wpg1nkXZ9uuHyCgLRwAfZ_FzFAlJA",
  authDomain: "travelmate-07chss.firebaseapp.com",
  databaseURL: "https://travelmate-07chss-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "travelmate-07chss",
  storageBucket: "travelmate-07chss.firebasestorage.app",
  messagingSenderId: "985002644614",
  appId: "1:985002644614:web:bba90799c119c92ef76d07"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the Realtime Database instance
export const db = getDatabase(app);

// Export the Authentication instance
export const auth = getAuth(app);
