import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBERrhZy57-HW_JTrV_1COY3u8_JVV2r8I", 
  authDomain: "resturant-menu-eb399.firebaseapp.com",
  projectId: "resturant-menu-eb399",
  storageBucket: "resturant-menu-eb399.appspot.com",
  messagingSenderId: "958539449401",
  appId: "1:958539449401:web:6ad329396d8cc45884b9e8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

<<<<<<< HEAD
// Debug: Log Firebase configuration
=======
// Debug: Log Firebase configuration (remove in production)
>>>>>>> 96dfa78d819267cd8ce260245b0319e61301b189
console.log('Firebase initialized with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKey: firebaseConfig.apiKey ? 'SET' : 'NOT SET'
});