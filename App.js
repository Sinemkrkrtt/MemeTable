import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/services/firebase';

// --- EKRANLAR (SCREENS) ---
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import AvatarScreen from './src/screens/AvatarScreen';
import LobbyScreen from './src/screens/LobbyScreen'; 
import LobbyRoom from './src/screens/LobbyRoom';
import RoomScreen from './src/screens/RoomScreen';
import JoinRoom from './src/screens/JoinRoom'; 
import MemeLibrary from './src/screens/MemeLibrary';
import ScoreScreen from './src/screens/scoreScreen'; 

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true); // Yüklenme durumu eklendi

  useEffect(() => {
    // Firebase oturum durumunu dinle
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      if (isInitializing) setIsInitializing(false);
    });
    
    return unsubscribe;
  }, []);

  // Firebase bağlantısı kurulana kadar beyaz ekran (veya loading) gösterilir
  if (isInitializing) return null; 

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // 🟢 GİRİŞ YAPMIŞ KULLANICI AKIŞI
          <>
            {/* Ana Menü ve Karakter Seçimi */}
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="AvatarScreen" component={AvatarScreen} />
            <Stack.Screen name="JoinRoom" component={JoinRoom} />
            
            {/* OYUN AKIŞI */}
            {/* 1. Aşama: Oda Kurma ve Kod Paylaşma */}
            <Stack.Screen name="LobbyScreen" component={LobbyScreen} /> 
            
            {/* 2. Aşama: Masaya Oturma ve Rakipleri Bekleme */}
            <Stack.Screen name="LobbyRoom" component={LobbyRoom} />
            
            {/* 3. Aşama: Asıl Oyun ve Kart Atma */}
            <Stack.Screen name="RoomScreen" component={RoomScreen} /> 
            
            {/* Yardımcı Ekranlar */}
            <Stack.Screen name="MemeLibrary" component={MemeLibrary} />
            <Stack.Screen name="ScoreScreen" component={ScoreScreen} />
          </>
        ) : (
          // 🔒 GİRİŞ YAPMAMIŞ KULLANICI AKIŞI
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}