import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Image } from 'expo-image';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const REWARDS = [
  { id: 'joker1', type: 'joker', title: 'TEKLİ DEĞİŞİM', desc: '1 Kartı Yenile', icon: 'refresh', rarity: 'NADİR', color: '#FF8A00' },
  { id: 'joker2', type: 'joker', title: 'DESTE TAKASI', desc: 'Tüm Eli Yenile', icon: 'layers', rarity: 'DESTANSI', color: '#FF00D6' },
  { id: 'joker3', type: 'joker', title: 'BUZ SAATİ', desc: 'Süreyi Dondur', icon: 'snow', rarity: 'NADİR', color: '#00A6FF' },
  { id: 'coin', type: 'currency', title: 'COIN PAKETİ', desc: '500 Altın Kazandın!', icon: 'logo-bitcoin', rarity: 'YAYGIN', color: '#FFD700' },
  { id: 'diamond', type: 'currency', title: 'ELMAS KESESİ', desc: '10 Elmas Kazandın!', icon: 'diamond', rarity: 'EFSANEVİ', color: '#00EEFF' },
];

export default function DailyMission({ wonHearts, onRefreshUser }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentReward, setCurrentReward] = useState(REWARDS[0]);
  const [isClaiming, setIsClaiming] = useState(false);
  
  // 🚀 YENİ EKLENEN STATE'LER
  const [localHearts, setLocalHearts] = useState(wonHearts);
  const [isBoxOpened, setIsBoxOpened] = useState(false);
  
  const rewardOpacity = useRef(new Animated.Value(0)).current;
  const boxAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const palet = { vibrant: '#FF00D6', orange: '#FF8A00', gray: '#D1D5DB' ,purple: 'rgb(199, 13, 199)', gold: '#FFD700',peach: '#FFA3A5'};

  const playRevealSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/magic_reveal.mp3'),
        { shouldPlay: true }
      );
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log("Ses çalınamadı:", error);
    }
  };

  useEffect(() => {
    const setupAudio = async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
      });
    };
    setupAudio();

    if (isModalVisible) {
      Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 12000, useNativeDriver: true })).start();
    }
  }, [isModalVisible]);

  // 🚀 GÜNLÜK SIFIRLAMA KONTROLÜ (DAILY RESET LOGIC)
  useEffect(() => {
    const checkDailyReset = async () => {
      const user = auth.currentUser;
      if (!user) return;
      
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      
      if (snap.exists()) {
        const data = snap.data();
        // Bugünün tarihini YYYY-MM-DD formatında al
        const today = new Date().toISOString().split('T')[0]; 

        // Eğer veritabanındaki tarih bugün değilse YENİ GÜN gelmiş demektir!
        if (data.lastMissionDate !== today) {
          await updateDoc(userRef, {
            wonHearts: 0,
            isBoxOpened: false,
            lastMissionDate: today
          });
          setLocalHearts(0);
          setIsBoxOpened(false);
          if (onRefreshUser) onRefreshUser();
        } else {
          // Aynı günse mevcut durumu yükle
          setLocalHearts(data.wonHearts || 0);
          setIsBoxOpened(data.isBoxOpened || false);
        }
      }
    };
    
    checkDailyReset();
  }, [wonHearts]); // wonHearts proptan her güncellendiğinde senkronize et

  useEffect(() => {
    if (localHearts >= 3 && !isBoxOpened) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [localHearts, isBoxOpened]);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const handleInstantOpen = () => {
    playRevealSound();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const randomReward = REWARDS[Math.floor(Math.random() * REWARDS.length)];
    setCurrentReward(randomReward);
    setIsModalVisible(true);
    Animated.parallel([
      Animated.timing(rewardOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(boxAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true })
    ]).start();
  };

  const handleClaimReward = async () => {
    if (isClaiming) return;
    setIsClaiming(true);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, "users", user.uid);
      try {
        const today = new Date().toISOString().split('T')[0]; 
        
        let updateData = { 
          wonHearts: 0, 
          isBoxOpened: true, // 🚀 DÜZELTME: Kutu artık "AÇILDI" olarak işaretlenecek (false idi)
          lastMissionDate: today
        };

        if (currentReward.type === 'joker') {
          let dbField = 'joker_skip'; 
          if (currentReward.id === 'joker2') dbField = 'joker_double';
          if (currentReward.id === 'joker3') dbField = 'joker_freeze'; 
          
          updateData[dbField] = increment(1);
        } else if (currentReward.id === 'coin') {
          updateData[`coins`] = increment(500);
        } else if (currentReward.id === 'diamond') {
          updateData[`diamonds`] = increment(10);
        }

        await updateDoc(userRef, updateData);
        setIsBoxOpened(true); // UI'ı hemen güncelle
        setLocalHearts(0);
        
        if (onRefreshUser) onRefreshUser();
        setIsModalVisible(false);
      } catch (error) {
        console.error("Hediye işlenirken hata:", error);
      } finally {
        setIsClaiming(false);
      }
    }
  };

  return (
    <View style={styles.historySection}>
      <View style={styles.missionHeaderRow}>
        <View style={styles.titleWithBadge}>
          <LinearGradient colors={[palet.vibrant, palet.purple]} style={styles.missionIconBadge}>
            <Ionicons name="sparkles" size={19} color="white" />
          </LinearGradient>
          <View>
            <Text style={styles.missionMainTitle}>Günün Görevi</Text>
            <Text style={styles.missionSubTitle}>
              {isBoxOpened 
                ? "Günün görevi tamamlandı!" 
                : localHearts < 3 
                  ? `Paketi açmak için ${3 - localHearts} maç kaldı` 
                  : "Paket Hazır!"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.questCard}>
        <View style={styles.questMainRow}>
          <View style={[styles.questIconBox, { backgroundColor: '#FFF0F5' }]}>
            <Ionicons name="heart" size={24} color={palet.vibrant} />
          </View>
          <View style={styles.questContent}>
            <Text style={styles.questText}>3 Maç Kazan, Hediyeni Kap!</Text>
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <LinearGradient 
                  colors={[palet.vibrant, palet.orange]} 
                  style={[styles.progressFill, { width: `${(Math.min(localHearts, 3) / 3) * 100}%` }]} 
                />
              </View>
              <Text style={styles.currentProgressText}>{Math.min(localHearts, 3)}/3</Text>
            </View>
          </View>
          
          <View style={styles.giftWrapper}>
            {/* 🚀 UI DÜZELTMESİ: Eğer kutu açıldıysa Yarın Gel yaz, Açılmadıysa kilitli/açık göster */}
            {isBoxOpened ? (
              <View style={styles.lockedGift}>
                <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                <Text style={[styles.lockedText, { color: '#10B981' }]}>YARIN GEL</Text>
              </View>
            ) : localHearts < 3 ? (
              <View style={styles.lockedGift}>
                <Ionicons name="gift" size={32} color={palet.gray} />
                <Text style={styles.lockedText}>KİLİTLİ</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleInstantOpen} activeOpacity={0.8}> 
                <Animated.View style={{ alignItems: 'center', transform: [{ scale: pulseAnim }] }}>
                  <LinearGradient colors={[palet.vibrant,palet.orange, palet.peach]} style={styles.activeGift}>
                    <Ionicons name="gift" size={32} color="white" />
                  </LinearGradient>
                  <Text style={styles.openMeText}>AÇ BENİ!</Text>
                </Animated.View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.lightRaysContainer, { opacity: rewardOpacity, transform: [{ rotate: spin }] }]}>
            <LinearGradient colors={['transparent', palet.orange, 'transparent']} style={styles.rayBeam} />
            <LinearGradient colors={['transparent', palet.vibrant, 'transparent']} style={[styles.rayBeam, { transform: [{ rotate: '60deg' }] }]} />
            <LinearGradient colors={['transparent', palet.purple, 'transparent']} style={[styles.rayBeam, { transform: [{ rotate: '120deg' }] }]} />
          </Animated.View>

          <View style={styles.lootMainStage}>
            <Animated.View style={{ 
              opacity: rewardOpacity, 
              transform: [{ scale: boxAnim }, { translateY: boxAnim.interpolate({inputRange:[0,1], outputRange:[40, 0]}) }], 
              alignItems: 'center' 
            }}>
              
              <View style={styles.rewardAuraCore}>
                <LinearGradient colors={[palet.vibrant, palet.orange]} style={styles.auraCircle} />
              </View>

              <View style={styles.premiumObjectFrame}>
                <LinearGradient colors={['#FFFFFF', '#F9F9F9']} style={styles.objectInner}>
                  <LinearGradient colors={['rgba(255,255,255,0.9)', 'transparent', 'rgba(255,255,255,0.2)']} style={styles.shineOverlay} start={{x:0, y:0}} end={{x:1, y:1}} />
                  {currentReward.type === 'joker' ? (
                 <Image 
                    source={
                      currentReward.id === 'joker1' ? require('../../assets/joker1.png') : 
                      currentReward.id === 'joker2' ? require('../../assets/joker2.png') : 
                      require('../../assets/joker3.png')
                    } 
                    style={styles.rewardImage} 
                    contentFit="contain"
                    priority="high" 
                    cachePolicy="memory" 
                />
                  ) : (
                    <Ionicons name={currentReward.icon} size={100} color={currentReward.color} />
                  )}
                </LinearGradient>
              </View>

              <View style={styles.glassInfoCard}>
                <Text style={[styles.rarityTextPremium, { color: currentReward.color }]}>{currentReward.rarity}</Text>
                <Text style={styles.lootTitlePremium}>{currentReward.title}</Text>
                <View style={[styles.dividerPremium, { backgroundColor: currentReward.color }]} />
                <Text style={styles.lootDescPremium}>{currentReward.desc}</Text>
              </View>

              <TouchableOpacity style={[styles.claimButton, isClaiming && { opacity: 0.8 }]} onPress={handleClaimReward} disabled={isClaiming} activeOpacity={0.9}>
                <LinearGradient colors={['#FF69EB', '#FF00D6']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.claimGradient}>
                  <View style={styles.buttonGloss} />
                  <Text style={styles.claimText}>{isClaiming ? 'BAĞLANIYOR...' : 'HEDİYENİ AL'}</Text>
                </LinearGradient>
              </TouchableOpacity>

            </Animated.View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Stillerin tamamı senin gönderdiğinle aynı, aşağıda aynı şekilde bırakıldı...
const styles = StyleSheet.create({
  historySection: { paddingHorizontal: 10, marginTop: 30 },
  missionHeaderRow: { marginBottom: 15 },
  titleWithBadge: { flexDirection: 'row', alignItems: 'center' },
  missionIconBadge: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  missionMainTitle: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 19, 
    color: '#1A1A1A',
    letterSpacing: -0.5 
  },
  missionSubTitle: { 
    fontFamily: 'Nunito_600SemiBold', 
    fontSize: 13, 
    color: '#666' 
  },
  questCard: { width: '100%', backgroundColor: 'white', borderRadius: 25, padding: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  questMainRow: { flexDirection: 'row', alignItems: 'center' },
  questIconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  questContent: { flex: 1, paddingHorizontal: 15 },
  questText: { 
    fontFamily: 'Nunito_800ExtraBold', 
    fontSize: 15, 
    color: '#333', 
    marginBottom: 8 
  },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressTrack: { flex: 1, height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden', marginRight: 10 },
  progressFill: { height: '100%', borderRadius: 4 },
  currentProgressText: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 13, 
    color: '#FF00D6' 
  },
  giftWrapper: { alignItems: 'center', minWidth: 80 },
  lockedGift: { alignItems: 'center', opacity: 0.6 },
  lockedText: { 
    fontFamily: 'Nunito_800ExtraBold', 
    fontSize: 10, 
    color: '#9CA3AF', 
    marginTop: 5, 
    letterSpacing: 1.5 
  },
  activeGift: { width: 50, height: 50, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF00D6', shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  openMeText: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 11, 
    color: '#FF00D6', 
    marginTop: 8,
    textTransform: 'uppercase' 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(5, 0, 10, 0.97)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  lightRaysContainer: { 
    position: 'absolute', 
    width: width * 2, 
    height: width * 2, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  rayBeam: { 
    position: 'absolute', 
    width: '100%', 
    height: 140, 
    opacity: 0.4 
  },
  lootMainStage: { alignItems: 'center' },
  rewardAuraCore: { 
    position: 'absolute', 
    width: 280, 
    height: 300, 
    top: -30,
    opacity: 0.35
  },
  auraCircle: { flex: 1, borderRadius: 140 },
  premiumObjectFrame: { 
   width: width * 0.4,
    aspectRatio: 0.75,
    height: 230, 
    borderRadius: 40, 
    backgroundColor: '#fff', 
    padding: 8, 
    elevation: 30, 
    shadowColor: '#FF00D6', 
    shadowOpacity: 0.6, 
    shadowRadius: 25 
  },
  objectInner: { 
    flex: 1, 
    borderRadius: 32, 
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden'
  },
  rewardImage: { width: '95%', height: '95%', resizeMode: 'contain' },
  shineOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10
  },
  glassInfoCard: { 
    marginTop: 35,
    padding: 20, 
    width: width * 0.85,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    borderRadius: 35, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
 rarityTextPremium: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 12, 
    letterSpacing: 5, 
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  lootTitlePremium: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 34, 
    color: '#fff', 
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 10
  },
  dividerPremium: {
    width: 45,
    height: 4,
    borderRadius: 2,
    marginVertical: 18
  },
  lootDescPremium: { 
    fontFamily: 'Nunito_700Bold', 
    fontSize: 16, 
    color: 'rgba(255,255,255,0.8)', 
    textAlign: 'center', 
    lineHeight: 24
  },
  claimButton: { 
    marginTop: 45, 
    width: 210, 
    height: 58, 
    borderRadius: 25, 
    overflow: 'hidden',
    shadowColor: '#FF00D6',
    shadowOpacity: 0.7,
    shadowRadius: 15,
    elevation: 15
  },
  claimGradient: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)'
  },
  buttonGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
 claimText: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 17, 
    color: '#fff', 
    letterSpacing: 1.5,
    textTransform: 'uppercase' ,
  },
});