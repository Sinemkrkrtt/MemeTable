import 'react-native-url-polyfill/auto'; 
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/services/firebase';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import LobbyScreen from './src/screens/LobbyScreen'; 
import LobbyRoom from './src/screens/LobbyRoom';
import JoinRoom from './src/screens/JoinRoom'; 
import ScoreScreen from './src/screens/scoreScreen'; 
import AvatarScreen from './src/screens/AvatarScreen';
import RoomScreen from './src/screens/RoomScreen';
import MarketScreen from './src/screens/Market';
import DisconnectModal from './src/screens/DisconnectModal';
import JokerModal from  './src/screens/JokerModal';
import RandomMatchScreen from './src/screens/RandomMatchScreen';

const Stack = createStackNavigator();
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return null; 

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={user ? "Home" : "AuthScreen"} 
        screenOptions={{ 
          headerShown: false,
          animationEnabled: true, 
          gestureEnabled: false    
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="MarketScreen" component={MarketScreen} />
            <Stack.Screen name="AvatarScreen" component={AvatarScreen} />
            <Stack.Screen name="LobbyScreen" component={LobbyScreen} /> 
            <Stack.Screen name="LobbyRoom" component={LobbyRoom} />
            <Stack.Screen name="RoomScreen" component={RoomScreen} /> 
            <Stack.Screen name="JoinRoom" component={JoinRoom} />
            <Stack.Screen name="ScoreScreen" component={ScoreScreen} />
             <Stack.Screen name="DisconnectModal" component={DisconnectModal} />
                <Stack.Screen name="JokerModal" component={JokerModal} />
                <Stack.Screen name="RandomMatchScreen" component={RandomMatchScreen}/>
          </>
        ) : (
          <Stack.Screen name="AuthScreen" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}