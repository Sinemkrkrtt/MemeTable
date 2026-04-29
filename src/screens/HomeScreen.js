import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Image, StatusBar, ScrollView, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore'; // 🚀 onSnapshot eklendi
import { db, auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import * as ScreenOrientation from 'expo-screen-orientation';
import { styles, palet } from './HomeScreenStyles';
import DailyMission from './DailyMission';

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
  
  // 💰 YENİ: Dinamik Para Birimleri State'leri
  const [coins, setCoins] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scalePress = useRef(new Animated.Value(1)).current;

  let [fontsLoaded] = useFonts({
    Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black, Nunito_800ExtraBold_Italic,
  });

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    
    // 🔥 SENIOR DOKUNUŞ: Real-time Listener (Canlı Veri Takibi)
    const user = auth.currentUser;
    let unsubscribe;

    if (user) {
      const userRef = doc(db, "users", user.uid);
      
      // Veritabanında bir şey değiştiği an burası tetiklenir
      unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setNickname(data.nickname || "Oyuncu");
          setWonHearts(data.wonHearts || 0);
          setIsBoxOpened(data.isBoxOpened || false);
          
          // 🚀 Dinamik verileri setliyoruz
          setCoins(data.coins || 0);
          setDiamonds(data.diamonds || 0);
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe(); // Sayfadan çıkınca dinlemeyi durdurur (Performans için)
    };
  }, []);

  const handleNavigateWithAvatar = (targetScreen, additionalParams = {}) => {
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
  
  {/* MARKET & VAULT BLOĞU */}
  <TouchableOpacity 
    onPress={() => navigation.navigate('MarketScreen')} 
    activeOpacity={0.8}
  >
    <View style={styles.sleekVault}>
      {/* 🛒 Market İkon Kutusu - En Sola Yaslı */}
      <View style={styles.shopIconContainer}>
        <AntDesign name="shop" size={22} color='#FF69EB' />
      </View>

      {/* RAKAMLAR ARTIK DAHA DENGELİ */}
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

  {/* LOGOUT AYNI KALDI */}
  <TouchableOpacity style={styles.creativeLogout} onPress={() => signOut(auth)}>
    <Ionicons name="power" size={20} color={palet.peach} style={styles.logoutIcon} />
  </TouchableOpacity>

</View>

          {/* LOGO */}
          <Animated.View style={[styles.logoArea, { opacity: fadeAnim }]}>
            <Image source={require('../../assets/homeLogo.png')} style={styles.homeLogoLarge} resizeMode="contain" />
          </Animated.View>

          {/* BUTONLAR (Değişmedi) */}
          <View style={styles.gridContainer}>
            <Animated.View style={{ flex: 1.2, transform: [{ scale: scalePress }] }}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => handleNavigateWithAvatar('RoomScreen', { mode: 'public' })} style={styles.bigActionCard}>
                <LinearGradient colors={[palet.vibrant, palet.peach]} style={styles.cardInner}>
                  <View style={styles.cardHeader}><Ionicons name="flash" size={30} color="white" /><View style={styles.topRightArrow}><Ionicons name="arrow-up" size={22} color="white" /></View></View>
                  <View><Text style={styles.cardTitleBig}>HIZLI{"\n"}OYNA</Text><Text style={styles.cardSubTitle}>ANINDA EŞLEŞ</Text></View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
            
            <View style={styles.rightColumn}>
              <TouchableOpacity style={styles.smallActionCard} onPress={() => handleNavigateWithAvatar('LobbyScreen', { isHost: true })}>
                <LinearGradient colors={[palet.peach, palet.sand]} style={styles.cardInner}>
                  <View style={styles.cardHeader}><Ionicons name="add" size={26} color="white" /><View style={styles.topRightArrow}><Ionicons name="arrow-up" size={22} color="white" /></View></View>
                  <Text style={styles.cardTitleSmall}>ODA KUR</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.smallActionCard} onPress={() => handleNavigateWithAvatar('JoinRoom')}>
                <LinearGradient colors={[palet.sand, palet.yellow]} style={styles.cardInner}>
                  <View style={styles.cardHeader}><Ionicons name="qr-code" size={26} color="white" /><View style={styles.topRightArrow}><Ionicons name="arrow-up" size={22} color="white" /></View></View>
                  <Text style={styles.cardTitleSmall}>KATIL</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* GÜNÜN GÖREVİ */}
          <DailyMission 
            wonHearts={wonHearts} 
            isBoxOpened={isBoxOpened} 
            // onRefreshUser={fetchUserData} // Artık onSnapshot olduğu için buna gerek bile kalmadı ama durabilir
          />

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}