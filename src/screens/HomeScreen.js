import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, StatusBar, ScrollView, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import * as ScreenOrientation from 'expo-screen-orientation';

// 🔥 SADECE NUNITO AİLESİ (Kaba Fredoka'yı sildik, premium uyum geldi)
import { useFonts } from 'expo-font';
import { 
  Nunito_600SemiBold, 
  Nunito_700Bold, 
  Nunito_800ExtraBold, 
  Nunito_900Black,
  Nunito_800ExtraBold_Italic // 🔥 İtalik ve daha kibar versiyonu ekledik
} from '@expo-google-fonts/nunito';

const { width, height } = Dimensions.get('window');

const palet = {
  vibrant: '#FF69EB',
  soft: '#FF86C8',
  peach: '#FFA3A5',
  sand: '#FFBF81',
  yellow: '#FFDC5E',
  darkText: '#4A1D3A',
  bg: '#FFFFFF'
};

export default function HomeScreen({ navigation }) {
  const [nickname, setNickname] = useState("Meme Kralı");
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // HomeScreen içine ekle:
const scalePress = useRef(new Animated.Value(1)).current;

const onPressIn = () => {
  Animated.spring(scalePress, { toValue: 0.96, useNativeDriver: true }).start();
};
const onPressOut = () => {
  Animated.spring(scalePress, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
};


 let [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    Nunito_800ExtraBold_Italic, // Yazımın tam böyle olması lazım
  });

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();

    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        if (user.displayName) setNickname(user.displayName);
        else {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists()) setNickname(userSnap.data().nickname);
        }
      }
    };
    fetchUserData();
  }, []);

  if (!fontsLoaded) {
    return null; 
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 🛸 ESTETİK & UYUMLU HEADER */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingTextCreative}>
              Selam <Text style={styles.boldNameCreative}>{nickname}!</Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.creativeLogout} onPress={() => signOut(auth)}>
            <Ionicons name="power" size={18} color={palet.peach} style={styles.logoutIcon} />
          </TouchableOpacity>
        </View>

        {/* 🏎️ DEV ESTETİK LOGO */}
        <Animated.View style={[styles.logoArea, { opacity: fadeAnim }]}>
          <Image 
            source={require('../../assets/homeLogo.png')} 
            style={styles.homeLogoLarge}
            resizeMode="contain"
          />
        </Animated.View>

        {/* 🧩 MODERN AI GRID */}
        <View style={styles.gridContainer}>
          
          {/* SOL: HIZLI OYNA */}
          <TouchableOpacity 
            activeOpacity={0.85}
            onPress={() => navigation.navigate('RoomScreen', { mode: 'public' })}
            style={styles.bigActionCard}
          >
            <LinearGradient 
              colors={[palet.vibrant, palet.peach]} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 1 }} 
              style={styles.cardInner}
            >
             <View style={styles.cardHeader}>
                <Ionicons name="flash" size={30} color="white" />
                
                {/* 🔥 Oku View içine aldık ve arrow-up ile 45 derece sağa yatırdık */}
                <View style={styles.topRightArrow}>
                  <Ionicons name="arrow-up" size={22} color="white" />
                </View>
                
              </View>
              <View>
                <Text style={styles.cardTitleBig}>HIZLI{"\n"}OYNA</Text>
                <Text style={styles.cardSubTitle}>ANINDA EŞLEŞ</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* SAĞ: ODA KUR & KATIL */}
          <View style={styles.rightColumn}>
            
            {/* ODA KUR */}
            <TouchableOpacity 
              style={styles.smallActionCard} 
              onPress={() => navigation.navigate('LobbyScreen', { isHost: true })}
            >
              <LinearGradient 
                colors={[palet.peach, palet.sand]} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }} 
                style={styles.cardInner}
              >
                <View style={styles.cardHeader}>
                  <Ionicons name="add" size={26} color="white" />
                  
                  {/* 🔥 İkonu bir View içine aldık ve döndürmeyi ona vereceğiz */}
                  <View style={styles.topRightArrow}>
                    <Ionicons name="arrow-up" size={22} color="white" />
                  </View>
                  
                </View>
                <Text style={styles.cardTitleSmall}>ODA KUR</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* KATIL */}
            <TouchableOpacity 
              style={styles.smallActionCard} 
              onPress={() => navigation.navigate('JoinRoom')}
            >
              <LinearGradient 
                colors={[palet.sand, palet.yellow]} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }} 
                locations={[0.1, 0.7]} 
                style={styles.cardInner}
              >
               <View style={styles.cardHeader}>
                  <Ionicons name="qr-code" size={26} color="white" />
                  
                  {/* 🔥 Oku View içine aldık ve arrow-up ile 45 derece sağa yatırdık */}
                  <View style={styles.topRightArrow}>
                    <Ionicons name="arrow-up" size={22} color="white" />
                  </View>
                  
                </View>
                <Text style={styles.cardTitleSmall}>KATIL</Text>
              </LinearGradient>
            </TouchableOpacity>
            
          </View>
        </View>

        {/* 🎯 GÜNLÜK GÖREV */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Günlük Görevler</Text>
            <View style={styles.timerBadge}>
              <Ionicons name="time-outline" size={14} color={palet.peach} />
              <Text style={styles.timerText}>14s 23d</Text>
            </View>
          </View>

          <View style={styles.questRow}>
            <View style={[styles.questIconBox, {backgroundColor: palet.peach}]}>
              <Ionicons name="heart" size={22} color="white" />
            </View>
            
            <View style={styles.questContent}>
              <Text style={styles.questText}>3 farklı maçta kalp kazan!</Text>
              
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: '33%' }]} /> 
                </View>
                <Text style={styles.progressCount}>1/3</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.rewardBox}>
              <Text style={styles.rewardAmount}>+50</Text>
              <Text style={styles.rewardEmoji}>🪙</Text>
            </TouchableOpacity>
          </View>
        </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palet.bg },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 30 },

  // 🛸 Zarif Header Stilleri
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 20,
    marginBottom: -15 
  },
  headerLeft: { flex: 1 },
  greetingTextCreative: { 
    fontSize: 20, 
    color: '#A0A0A0', 
    fontFamily: 'Nunito_600SemiBold',
    letterSpacing: 0.5
  },
boldNameCreative: { 
    color: palet.vibrant, 
    fontSize: 24,
    // Önce özel fontu dene, bulamazsan sisteminkini italik yap
    fontFamily: 'Nunito_800ExtraBold_Italic', 
    fontStyle: 'italic', // 🔥 GARANTİ: Font yüklenmese bile sağa yatırır
    letterSpacing: -0.5,
   // Styles kısmında boldNameCreative'e ekle:
textShadowColor: 'rgba(255, 105, 235, 0.5)',
textShadowOffset: { width: 0, height: 0 },
textShadowRadius: 10, // Parlama miktarını artırdık
    
  },

  // 💎 Elmas Buton (Daha kibar boyutlarda)
  creativeLogout: { 
    width: 42, height: 42, borderRadius: 12, backgroundColor: 'white', 
    justifyContent: 'center', alignItems: 'center', elevation: 4,
    shadowColor: palet.peach, shadowOpacity: 0.6, shadowRadius: 6,
    borderWidth: 1, borderColor: '#F8F8F8',
    transform: [{ rotate: '45deg' }], marginRight: 5
  },
  logoutIcon: { transform: [{ rotate: '-45deg' }] },

  // 🔥 Logo
  logoArea: { 
    width: '100%', height: 240, marginTop: 0, marginBottom: 10, 
    justifyContent: 'center', alignItems: 'center',
  },
  homeLogoLarge: { width: '90%', height: '100%', borderRadius: 70 },

  // 🧩 Grid Düzeni
  gridContainer: { flexDirection: 'row', gap: 15 },
  bigActionCard: { flex: 1.2, borderRadius: 32, overflow: 'hidden', elevation: 10, height: 210 },
  rightColumn: { flex: 1, gap: 15 },
  smallActionCard: { borderRadius: 24, overflow: 'hidden', elevation: 6, height: 97 },
  
  // 🛠️ Kart İçi Detaylar
  cardInner: { flex: 1, padding: 18, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  topRightArrow: { transform: [{ rotate: '45deg' }], opacity: 0.8 },
  
  cardTitleBig: { 
    color: 'white', 
    fontSize: 26, 
    fontFamily: 'Nunito_900Black', // Kaba olmayan, oturaklı kalınlık
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  cardSubTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: 'Nunito_800ExtraBold', 
    marginTop: 4
  },
  cardTitleSmall: { 
    color: 'white', 
    fontSize: 16, 
    fontFamily: 'Nunito_900Black',
    letterSpacing: 0.5,
  },

  // 🎯 Quest Section
  historySection: { marginTop: 35 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  
  sectionTitle: { 
    fontSize: 18, 
    color: palet.darkText, 
    fontFamily: 'Nunito_900Black',
    letterSpacing: 0.2
  },
  
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  timerText: { 
    color: palet.peach, 
    fontSize: 12, 
    fontFamily: 'Nunito_800ExtraBold'
  },

  questRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 24, gap: 12, elevation: 4, shadowColor: palet.peach, shadowOpacity: 0.1, shadowRadius: 8 },
  questIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  questContent: { flex: 1, justifyContent: 'center' },
  
  questText: { 
    fontSize: 14, 
    color: palet.darkText, 
    marginBottom: 6,
    fontFamily: 'Nunito_700Bold' 
  },
  
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: palet.vibrant, borderRadius: 3 },
  progressCount: { 
    fontSize: 11, 
    color: '#AAA',
    fontFamily: 'Nunito_800ExtraBold'
  },

  rewardBox: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF9E6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: palet.yellow },
  rewardAmount: { 
    fontSize: 14, 
    color: '#E5A900',
    fontFamily: 'Nunito_900Black'
  },
  rewardEmoji: { fontSize: 14, marginTop: -2 }
});