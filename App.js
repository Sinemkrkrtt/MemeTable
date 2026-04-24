import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/services/firebase';

// Ekranlar (Dosya yollarının doğruluğundan emin ol!)
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import MemeLibrary from './src/screens/MemeLibrary';
import RoomScreen from './src/screens/RoomScreen';
import ScoreScreen from './src/screens/scoreScreen'; 
import JoinRoom from './src/screens/JoinRoom'; 
import LobbyScreen from './src/screens/LobbyScreen';

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Firebase oturum kontrolü
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
    });
    return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Giriş Yapmış Kullanıcı Ekranları
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="RoomScreen" component={RoomScreen} />
            <Stack.Screen name="MemeLibrary" component={MemeLibrary} />
            <Stack.Screen name="ScoreScreen" component={ScoreScreen} />
            <Stack.Screen name="JoinRoom" component={JoinRoom} />
            <Stack.Screen name="LobbyScreen" component={LobbyScreen} />
          </>
        ) : (
          // Giriş Yapmamış Kullanıcı Ekranı
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}