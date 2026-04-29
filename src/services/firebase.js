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

// 🔐 Konfigürasyon (Senin bilgilerin)
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

// 🚀 HOT RELOAD & INITIALIZATION KORUMASI
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Auth'u oturum kalıcılığı (Persistence) ile başlatıyoruz
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  app = getApp();
  auth = getAuth(app); 
}

// 🛠 Servisleri Başlat
const db = getFirestore(app);      // Kullanıcı verileri, jokerler, paralar (Firestore)
const storage = getStorage(app);   // Avatarlar ve görseller (Storage)
const database = getDatabase(app); // Canlı maç verileri (Realtime Database)

// Hepsini güvenle dışa aktar
export { app, auth, db, storage, database };