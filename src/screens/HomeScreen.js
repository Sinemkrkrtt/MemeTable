import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, StatusBar, ScrollView, Dimensions, Animated, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import * as ScreenOrientation from 'expo-screen-orientation';
import { styles, palet } from './HomeScreenStyles';

// 🔥 NUNITO AİLESİ
import { useFonts } from 'expo-font';
import { 
  Nunito_600SemiBold, 
  Nunito_700Bold, 
  Nunito_800ExtraBold, 
  Nunito_900Black,
  Nunito_800ExtraBold_Italic 
} from '@expo-google-fonts/nunito';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation, route }) {
  const [nickname, setNickname] = useState("Meme Kralı");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scalePress = useRef(new Animated.Value(1)).current;

  // Hediye State'leri
  const [wonHearts, setWonHearts] = useState(3); 
  const [isBoxOpened, setIsBoxOpened] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isOpened, setIsOpened] = useState(false); 
  const { myName, myAvatarSeed } = route?.params || { myName: 'Sen', myAvatarSeed: 'Sinem' };
  
  // Animasyon Değerleri
  const boxAnim = useRef(new Animated.Value(1)).current; 
  const rewardOpacity = useRef(new Animated.Value(0)).current;

  let [fontsLoaded] = useFonts({
    Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black, Nunito_800ExtraBold_Italic,
  });

  const onPressIn = () => Animated.spring(scalePress, { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scalePress, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();

  // ⚡ TEK TIKLA HEDİYEYİ AÇAN FONKSİYON
  const handleInstantOpen = () => {
    setIsModalVisible(true); 
    setIsOpened(true);      
    
    rewardOpacity.setValue(0);
    boxAnim.setValue(0.5); 
    
    Animated.parallel([
      Animated.timing(rewardOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(boxAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true })
    ]).start();
  };

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) setNickname(userSnap.data().nickname);
      }
    };
    fetchUserData();
  }, []);

  if (!fontsLoaded) return null; 

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* HEADER */}
          <View style={styles.headerRow}>
            <View style={styles.sleekVault}>
              <View style={styles.vaultItem}><Ionicons name="layers" size={18} color="#FFD700" /><Text style={styles.vaultValue}>1,250</Text></View>
              <View style={styles.vaultSeparator} />
              <View style={styles.vaultItem}><Ionicons name="diamond" size={18} color="#00E5FF" /><Text style={[styles.vaultValue, { color: '#000000' }]}>12</Text></View>
            </View>
            <TouchableOpacity style={styles.creativeLogout} onPress={() => signOut(auth)}>
              <Ionicons name="power" size={20} color={palet.peach} style={styles.logoutIcon} />
            </TouchableOpacity>
          </View>

          {/* LOGO */}
          <Animated.View style={[styles.logoArea, { opacity: fadeAnim }]}>
            <Image source={require('../../assets/homeLogo.png')} style={styles.homeLogoLarge} resizeMode="contain" />
          </Animated.View>

          {/* GRID */}
          <View style={styles.gridContainer}>
            <Animated.View style={{ flex: 1.2, transform: [{ scale: scalePress }] }}>
              <TouchableOpacity activeOpacity={0.9} onPressIn={onPressIn} onPressOut={onPressOut} onPress={() => navigation.navigate('RoomScreen', { mode: 'public' })} style={styles.bigActionCard}>
                <LinearGradient colors={[palet.vibrant, palet.peach]} style={styles.cardInner}>
                  <View style={styles.cardHeader}><Ionicons name="flash" size={30} color="white" /><View style={styles.topRightArrow}><Ionicons name="arrow-up" size={22} color="white" /></View></View>
                  <View><Text style={styles.cardTitleBig}>HIZLI{"\n"}OYNA</Text><Text style={styles.cardSubTitle}>ANINDA EŞLEŞ</Text></View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
            <View style={styles.rightColumn}>
              <TouchableOpacity style={styles.smallActionCard} onPress={() => navigation.navigate('LobbyScreen', { isHost: true })}>
                <LinearGradient colors={[palet.peach, palet.sand]} style={styles.cardInner}>
                  <View style={styles.cardHeader}><Ionicons name="add" size={26} color="white" />
                  <View style={styles.topRightArrow}><Ionicons name="arrow-up" size={22} color="white" /></View></View>
                  <Text style={styles.cardTitleSmall}>ODA KUR</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallActionCard} onPress={() => navigation.navigate('JoinRoom')}>
                <LinearGradient colors={[palet.sand, palet.yellow]} style={styles.cardInner}>
                  <View style={styles.cardHeader}><Ionicons name="qr-code" size={26} color="white" />
                  <View style={styles.topRightArrow}><Ionicons name="arrow-up" size={22} color="white" /></View></View>
                  <Text style={styles.cardTitleSmall}>KATIL</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* MISSION SECTION */}
          <View style={styles.historySection}>
            <View style={styles.missionHeaderRow}>
              <View style={styles.titleWithBadge}>
                <LinearGradient colors={[palet.vibrant, '#B832FA']} style={styles.missionIconBadge}><Ionicons name="sparkles" size={14} color="white" /></LinearGradient>
                <View><Text style={styles.missionMainTitle}>Günün Görevi</Text><Text style={styles.missionSubTitle}>Paketi açmak için {3 - wonHearts} maç kaldı</Text></View>
              </View>
              <View style={styles.premiumTimerBadge}><Ionicons name="time" size={12} color={palet.vibrant} /><Text style={styles.premiumTimerText}>14:23:05</Text></View>
            </View>

            <View style={styles.questCard}>
              <View style={styles.questMainRow}>
                <View style={[styles.questIconBox, { backgroundColor: '#FFF0F5' }]}><Ionicons name="heart" size={24} color={palet.vibrant} /></View>
                <View style={styles.questContent}>
                  <Text style={styles.questText}>3 Maç Kazan, Paketi Kap!</Text>
                  <View style={styles.progressRow}>
                    <View style={styles.progressTrack}><LinearGradient colors={[palet.vibrant, palet.peach]} style={[styles.progressFill, { width: `${(wonHearts / 3) * 100}%` }]} /></View>
                    <Text style={styles.currentProgressText}>{wonHearts}/3</Text>
                  </View>
                </View>

                {/* 🎁 GÜNCEL HEDİYE PAKETİ */}
                <View style={styles.giftWrapper}>
                  {wonHearts < 3 ? (
                    <View style={styles.lockedGift}><Ionicons name="gift-outline" size={24} color="#DDD" /><Text style={styles.lockedText}>KİLİTLİ</Text></View>
                  ) : !isBoxOpened ? (
                    <TouchableOpacity onPress={handleInstantOpen}> 
                      <View>
                        <LinearGradient colors={['#FFBF81','#FFD700','#FFA3A5', '#FF86C8','#FF69EB','#D22FFB']} style={styles.activeGift}><Ionicons name="gift" size={28} color="white" /></LinearGradient>
                        <Text style={styles.openMeText}>AÇ BENİ!</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.openedGift}><Text style={styles.rewardEmoji}>🃏</Text><Text style={styles.rewardSub}>SWAP!</Text></View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* TEST BUTONU (Test ederken işine yarasın diye bıraktım, canlıya alırken silersin) */}
          <TouchableOpacity style={{ backgroundColor: '#F0F0F0', padding: 10, borderRadius: 10, marginTop: 10, alignItems: 'center' }} onPress={() => setWonHearts(prev => (prev >= 3 ? 0 : prev + 1))}>
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', color: palet.vibrant }}>Kalp Ekle ({wonHearts}/3)</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 🌌 ULTRA ESTETİK GANİMET EKRANI */}
        <Modal visible={isModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            
            {/* ✨ BURASI DEĞİŞTİ: Tıklanınca sistemi baştan başlatır */}
            <TouchableOpacity 
              style={styles.closeModalIcon} 
              onPress={() => { 
                setIsModalVisible(false); 
                setIsOpened(false); 
                setIsBoxOpened(false); // Kutuyu kapalıya çevir
                setWonHearts(0);       // İlerlemeyi sıfırla
              }}
            >
              <Ionicons name="close-outline" size={35} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>

            <View style={styles.lootMainStage}>
              <Animated.View style={{ 
                opacity: rewardOpacity, 
                transform: [{ scale: boxAnim }, { translateY: 0 }], 
                alignItems: 'center' 
              }}>
                
                {/* 1. KATMAN: Arka Plan Büyük Işıma */}
                <LinearGradient
                  colors={['transparent', 'rgba(255, 105, 235, 0.2)', 'transparent']}
                  style={styles.rewardAuraOuter}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                />

                {/* 2. KATMAN: Odak Işığı */}
                <View style={styles.rewardAuraCore} />

                {/* 3. KATMAN: Obje (Joker) */}
                <View style={styles.objectSpotlight}>
                  <Text style={styles.rewardEmojiUltra}>🃏</Text>
                </View>

                {/* 4. KATMAN: Şık İsim Etiketi */}
                <View style={styles.glassNameTag}>
                  <Text style={styles.rarityTextSmall}>NADİR JOKER</Text>
                  <Text style={styles.lootTitleText}>SWAP</Text>
                </View>

              </Animated.View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}