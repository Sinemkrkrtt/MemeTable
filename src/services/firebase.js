import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Senin güncel config bilgilerin
const firebaseConfig = {
  apiKey: "AIzaSyC2AGoRD3uwkOzSGlfNngnGHVwrHKiPUws",
  authDomain: "memetable-official.firebaseapp.com",
  projectId: "memetable-official",
  storageBucket: "memetable-official.firebasestorage.app",
  messagingSenderId: "990694950111",
  appId: "1:990694950111:web:c6c5488730949df143156a",
  measurementId: "G-67ZZSPS05P"
};

// Uygulamayı başlat (Çakışmayı önlemek için kontrol ediyoruz)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 🔥 KRİTİK DOKUNUŞ: Auth'u AsyncStorage ile başlatıyoruz
// Bu sayede kullanıcı uygulamadan çıkınca tekrar giriş yapmak zorunda kalmaz.
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };