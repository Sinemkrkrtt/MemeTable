import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

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

// 🚀 HOT RELOAD KORUMASI: Eğer app daha önce başlatılmadıysa başlat
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Auth'u AsyncStorage ile ilk kez kuruyoruz
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  // Eğer hot-reload olduysa (zaten başlatılmışsa) var olanı kullan
  app = getApp();
  auth = getAuth(app); 
}

const db = getFirestore(app);
const storage = getStorage(app);
const database = getDatabase(app);

// Hepsini güvenle dışa aktarıyoruz
export { app, auth, db, storage, database };