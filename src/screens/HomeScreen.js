import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore'; 
import { db, auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import * as ScreenOrientation from 'expo-screen-orientation';
import { styles, palet } from './HomeScreenStyles';
import DailyMission from './DailyMission';
import RandomMatchScreen from './RandomMatchScreen';
import { Image } from 'expo-image';
// 1. YENİ EKLENEN IMPORTLAR: Ses işlemleri için yeni useAudioPlayer ve setAudioModeAsync kullanıyoruz.
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
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

  // 2. YENİ SES HOOK'LARI: Ses sayfa açıldığında hafızaya yüklenir.
  const moneySound = useAudioPlayer(require('../../assets/sounds/cash.mp3'));
  const tapSound = useAudioPlayer(require('../../assets/sounds/ui_tap.mp3'));

  // 3. YENİ VE HIZLI playHomeSound FONKSİYONU
  const playHomeSound = (soundType) => {
    try {
      if (soundType === 'money') {
        moneySound.seekTo(0);
        moneySound.play();
      } else {
        tapSound.seekTo(0);
        tapSound.play();
      }
    } catch (error) {
      console.log("Ses çalma hatası:", error);
    }
  };

  useEffect(() => {
    // 4. SES AYARLARI GÜNCELLENDİ (Eski Audio kütüphanesi referansı kaldırıldı)
    const configureAudio = async () => {
        try {
            await setAudioModeAsync({ playsInSilentMode: true });
        } catch (error) {
            console.log("Ses ayarı yapılamadı:", error);
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

  const onPressIn = () => {
    Animated.spring(scalePress, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const onPressOut = () => {
    Animated.spring(scalePress, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };


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
            {/* 🔥 DÜZELTME: İkonu bir View içine alıp stili o View'a veriyoruz! */}
            <View style={styles.logoutIcon}>
              <Ionicons name="power" size={20} color={palet.peach} />
            </View>
          </TouchableOpacity>

          </View>

          <Animated.View style={[styles.logoArea, { opacity: fadeAnim }]}>
         <Image 
          source={require('../../assets/homeLogo.png')} 
          style={styles.homeLogoLarge} 
          contentFit="contain"
          priority="high" // Açılışta en önce bu yüklensin
          transition={500} // Uygulama açılırken logonun yumuşakça belirmesini sağlar
          cachePolicy="memory" // RAM'de hazır tutar
      />
          </Animated.View>

          <View style={styles.gridContainer}>
            <Animated.View style={{ flex: 1.2, transform: [{ scale: scalePress }] }}>
                  <TouchableOpacity 
                    activeOpacity={0.9} 
                    onPressIn={onPressIn} // <-- Eklendi
                    onPressOut={onPressOut} // <-- Eklendi
                    onPress={() => handleNavigateWithAvatar('RandomMatchScreen', { mode: 'public' })} 
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