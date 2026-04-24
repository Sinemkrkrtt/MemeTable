import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/services/firebase';

// Ekranlar
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import LobbyScreen from './src/screens/LobbyScreen'; 
import RoomScreen from './src/screens/RoomScreen';    
import JoinRoom from './src/screens/JoinRoom'; 
import MemeLibrary from './src/screens/MemeLibrary';
import ScoreScreen from './src/screens/scoreScreen'; 
// Eğer ayrı bir profil/avatar sayfası yaptıysan buraya ekle:
// import AvatarScreen from './src/screens/AvatarScreen'; 

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Firebase oturum kontrolü - Kullanıcıyı hatırlar
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
    });
    return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // ✅ GİRİŞ YAPMIŞ KULLANICI AKIŞI
          <>
            {/* Oyun ilk açıldığında Home görünür */}
            <Stack.Screen name="Home" component={HomeScreen} />
            
            {/* Karakterini belirlediğin yer */}
            <Stack.Screen name="LobbyScreen" component={LobbyScreen} />
            
            {/* Odaya katılma ekranı */}
            <Stack.Screen name="JoinRoom" component={JoinRoom} />
            
            {/* Asıl oyunun döndüğü yer */}
            <Stack.Screen name="RoomScreen" component={RoomScreen} />
            
            {/* Diğer yardımcı ekranlar */}
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