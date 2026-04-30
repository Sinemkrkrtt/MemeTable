import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Image, StatusBar, ScrollView, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore'; 
import { db, auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import * as ScreenOrientation from 'expo-screen-orientation';
import { styles, palet } from './HomeScreenStyles';
import DailyMission from './DailyMission';

// 🚀 YENİ EKLENENLER: SES VE TİTREŞİM
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

import { useFonts } from 'expo-font';
import { 
  Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, 
  Nunito_900Black, Nunito_800ExtraBold_Italic 
} from '@expo-google-fonts/nunito';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [nickname, setNickname] = useState("");
  const [wonHearts, setWonHearts] = useState(0);
  const [isBoxOpened, setIsBoxOpened] = useState(false);
  
  const [coins, setCoins] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scalePress = useRef(new Animated.Value(1)).current;

  let [fontsLoaded] = useFonts({
    Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black, Nunito_800ExtraBold_Italic,
  });

  
const playHomeSound = async (soundType) => {
  try {
    const soundAsset = soundType === 'money' 
      ? require('../../assets/sounds/cha-ching.mp3') 
      : require('../../assets/sounds/ui_tap.mp3');
    
    // 🚀 unloadAsync kullanarak hafızayı temiz tutan ve daha stabil yükleme yapan yapı
    const { sound } = await Audio.Sound.createAsync(
      soundAsset,
      { shouldPlay: true } // Yüklenir yüklenmez çal
    );

    sound.setOnPlaybackStatusUpdate(async (status) => {
      if (status.didJustFinish) {
        await sound.unloadAsync();
      }
    });
  } catch (error) {
    console.log("Ses çalma hatası:", error);
  }
};
  useEffect(() => {

    const configureAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch (e) {
      console.log("Audio ayarı hatası:", e);
    }
  };
  configureAudio();

    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    
    const user = auth.currentUser;
    let unsubscribe;

    if (user) {
      const userRef = doc(db, "users", user.uid);
      unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setNickname(data.nickname || "Oyuncu");
          setWonHearts(data.wonHearts || 0);
          setIsBoxOpened(data.isBoxOpened || false);
          setCoins(data.coins || 0);
          setDiamonds(data.diamonds || 0);
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleNavigateWithAvatar = (targetScreen, additionalParams = {}) => {
    // Buton sesi ve hafif titreşim
    playHomeSound('tap');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    navigation.navigate('AvatarScreen', {
      nextScreen: targetScreen,
      extraParams: additionalParams,
      myName: nickname
    });
  };

  if (!fontsLoaded) return null; 

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.headerRow, { width: '100%', paddingHorizontal: 4 }]}>
            
            <TouchableOpacity 
              onPress={() => {
                playHomeSound('money'); // 🚀 Para sesi
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('MarketScreen');
              }} 
              activeOpacity={0.8}
            >
              <View style={styles.sleekVault}>
                <View style={styles.shopIconContainer}>
                  <AntDesign name="shop" size={22} color='#FF69EB' />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="layers" size={16} color="#FFD700" />
                  <Text style={styles.vaultValue}>{coins.toLocaleString()}</Text>
                </View>

                <View style={styles.vaultSeparator} />

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="diamond" size={16} color="#00E5FF" />
                  <Text style={styles.vaultValue}>{diamonds}</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.creativeLogout} 
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                signOut(auth);
              }}
            >
              <Ionicons name="power" size={20} color={palet.peach} style={styles.logoutIcon} />
            </TouchableOpacity>

          </View>

          <Animated.View style={[styles.logoArea, { opacity: fadeAnim }]}>
            <Image source={require('../../assets/homeLogo.png')} style={styles.homeLogoLarge} resizeMode="contain" />
          </Animated.View>

          <View style={styles.gridContainer}>
            <Animated.View style={{ flex: 1.2, transform: [{ scale: scalePress }] }}>
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => handleNavigateWithAvatar('RoomScreen', { mode: 'public' })} 
                style={styles.bigActionCard}
              >
                <LinearGradient colors={[palet.vibrant, palet.peach]} style={styles.cardInner}>
                  <View style={styles.cardHeader}><Ionicons name="flash" size={30} color="white" /><View style={styles.topRightArrow}><Ionicons name="arrow-up" size={22} color="white" /></View></View>
                  <View><Text style={styles.cardTitleBig}>HIZLI{"\n"}OYNA</Text><Text style={styles.cardSubTitle}>ANINDA EŞLEŞ</Text></View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
            
            <View style={styles.rightColumn}>
              <TouchableOpacity 
                style={styles.smallActionCard} 
                onPress={() => handleNavigateWithAvatar('LobbyScreen', { isHost: true })}
              >
                <LinearGradient colors={[palet.peach, palet.sand]} style={styles.cardInner}>
                  <View style={styles.cardHeader}><Ionicons name="add" size={26} color="white" /><View style={styles.topRightArrow}><Ionicons name="arrow-up" size={22} color="white" /></View></View>
                  <Text style={styles.cardTitleSmall}>ODA KUR</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.smallActionCard} 
                onPress={() => handleNavigateWithAvatar('JoinRoom')}
              >
                <LinearGradient colors={[palet.sand, palet.yellow]} style={styles.cardInner}>
                  <View style={styles.cardHeader}><Ionicons name="qr-code" size={26} color="white" /><View style={styles.topRightArrow}><Ionicons name="arrow-up" size={22} color="white" /></View></View>
                  <Text style={styles.cardTitleSmall}>KATIL</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <DailyMission 
            wonHearts={wonHearts} 
            isBoxOpened={isBoxOpened} 
          />

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}