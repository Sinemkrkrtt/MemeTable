import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeAuth, 
  getAuth, 
  getReactNativePersistence 
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyC2AGoRD3uwkOzSGlfNngnGHVwrHKiPUws",
  authDomain: "memetable-official.firebaseapp.com",
  projectId: "memetable-official",
  storageBucket: "memetable-official.firebasestorage.app",
  messagingSenderId: "990694950111",
  appId: "1:990694950111:web:c6c5488730949df143156a",
  measurementId: "G-67ZZSPS05P",
  databaseURL: "https://memetable-official-default-rtdb.firebaseio.com"
};

let app;
let auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  app = getApp();
  auth = getAuth(app); 
}

const db = getFirestore(app);
const storage = getStorage(app);
const database = getDatabase(app);
// Cloud Functions — region functions/index.js içindeki setGlobalOptions ile uyumlu
const functions = getFunctions(app, 'europe-west1');

export { app, auth, db, storage, database, functions };