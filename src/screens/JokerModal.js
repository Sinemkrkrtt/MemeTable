import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, Modal, useWindowDimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useFonts, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { Image } from 'expo-image';
import { doc, onSnapshot, updateDoc, increment } from 'firebase/firestore'; 
import { db, auth } from '../services/firebase'; 

const palet = {
  pink: '#FF69EB',
  softPink: '#FF86C8',
  orange: '#FFBF81',
  yellow: '#FFDC5E',
  bg: '#F4F6FC',
  textDark: '#1A131F',
};

const JOKERS = [
  { 
    id: 'joker_skip', 
    name: 'TEKLİ DEĞİŞİM', 
    desc: 'Beğenmediğin 1 kartı yenisiyle değiştir.', 
    logo: require('../../assets/joker1.png'), 
    color: palet.pink,
    price: 500
  },
  { 
    id: 'joker_double', 
    name: 'DESTE TAKASI', 
    desc: 'Tüm elini çöpe at, taze 5 kart çek!', 
    logo: require('../../assets/joker2.png'), 
    color: palet.softPink,
    price: 800
  },
  { 
    id: 'joker_freeze', 
    name: 'BUZ SAATİ', 
    desc: 'Süreyi 5 saniye dondur, hamleni planla.', 
    logo: require('../../assets/joker3.png'), 
    color: palet.orange,
    price: 1000
  }
];

export default function JokerModal({ visible, onClose, onUseJoker, selectedCard, isMarketMode = false }) {
  const { width, height } = useWindowDimensions();

  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(JOKERS.map(() => new Animated.Value(0))).current;
  const [realtimeInventory, setRealtimeInventory] = useState({ joker_skip: 0, joker_double: 0, joker_freeze: 0 });
  const [userCoins, setUserCoins] = useState(0);

  const [buyingJokerId, setBuyingJokerId] = useState(null);

  let [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    let unsubscribe;
    const user = auth.currentUser;
    
    // Sadece modal açıkken Firebase dinlenir (Performans tasarrufu)
    if (visible && user) {
      unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserCoins(data.coins || 0);
          setRealtimeInventory({
            joker_skip: data.joker_skip || 0,
            joker_double: data.joker_double || 0,
            joker_freeze: data.joker_freeze || 0,
          });
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [visible]);

  // MODAL ANİMASYONLARI
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 10, tension: 50, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true })
      ]).start(() => {
        Animated.stagger(40, cardAnims.map(anim =>
          Animated.spring(anim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true })
        )).start();
      });
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
      cardAnims.forEach(anim => anim.setValue(0));
    }
  }, [visible]);

  const handleBuyJoker = async (joker) => {
    if (buyingJokerId) return; // Zaten işlem yapılıyorsa durdur
    
    const user = auth.currentUser;
    if (!user) return;

    if (userCoins >= joker.price) {
      setBuyingJokerId(joker.id); // Butonu kilitle
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          coins: increment(-joker.price),
          [joker.id]: increment(1)
        });
      } catch (error) {
        console.log("Satın alma hatası:", error);
        Alert.alert("Hata", "İşlem başarısız oldu.");
      } finally {
        setBuyingJokerId(null); // İşlem bitince kilidi aç
      }
    } else {
      Alert.alert("Yetersiz Coin", "Bu jokeri almak için kasanızda yeterli coin bulunmuyor.");
    }
  };

  if (!fontsLoaded) return null;

  return (
    <Modal 
      visible={visible} 
      transparent={true} 
      animationType="none" 
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
    >
      <View style={styles.absoluteOverlay}>
        <Animated.View style={[styles.overlayBackground, { opacity: fadeAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        </Animated.View>
      
        {/* 🚀 DİNAMİK GENİŞLİK VE YÜKSEKLİK BURAYA EKLENDİ */}
        <Animated.View style={[
          styles.modalContent, 
          { 
            width: width > 600 ? 750 : '90%', 
            height: height > 400 ? 360 : '80%', 
            opacity: fadeAnim, 
            transform: [{ scale: scaleAnim }] 
          }
        ]}>
          
          {/* SOL ŞERİT */}
          <View style={styles.glassSidebar}>
            <LinearGradient colors={['rgba(255, 105, 235, 0.1)', 'transparent']} style={styles.glassEffect} />
            <View style={styles.sidebarTopIcon}>
              <Ionicons name={isMarketMode ? "cart" : "flash"} size={24} color={palet.pink} />
            </View>
            
            <View style={styles.textContainer} />

            {/* Anlık Coin Gösterimi */}
            <View style={styles.coinBadge}>
              <FontAwesome5 name="coins" size={10} color="#FFDC5E" />
              <Text style={styles.coinText}>{userCoins}</Text>
            </View>
          </View>

          {/* SAĞ ANA İÇERİK ALANI */}
          <View style={styles.mainContent}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                {/* Market modundaysa başlık değişir */}
                <Text style={styles.headerTitle}>{isMarketMode ? 'Joker Market' : 'Jokerler'}</Text>
                <View style={styles.activeBadge}>
                   <View style={styles.dot} />
                   <Text style={styles.activeText}>{isMarketMode ? 'MAĞAZA' : 'AKTİF'}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeCircle}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.grid}>
             {JOKERS.map((joker, index) => {
                const currentCount = realtimeInventory[joker.id] || 0;
                const hasItem = currentCount > 0;
                const isSkipDisabled = !isMarketMode && joker.id === 'joker_skip' && !selectedCard;
                
                // 🚀 HANGİ BUTONUN YÜKLENDİĞİNİ ANLAMAK İÇİN EKLENDİ
                const isCurrentlyBuying = buyingJokerId === joker.id; 
                
                const cardOpacity = cardAnims[index];
                const cardScale = cardAnims[index].interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

                let btnText = '';
                let btnColors = [];
                let onBtnPress = null;
                let isBtnDisabled = false;

                // AKILLI BUTON MANTIĞI
                if (isMarketMode || !hasItem) {
                  btnText = `${joker.price} AL`;
                  // 🚀 HERHANGİ BİR JOKER ALINIYORSA TÜM BUTONLAR KİLİTLENİR (ÇİFT TIKLAMAYI ÖNLER)
                  isBtnDisabled = userCoins < joker.price || buyingJokerId !== null; 
                  btnColors = isBtnDisabled ? ['#E2E8F0', '#CBD5E1'] : [palet.yellow, palet.orange];
                  onBtnPress = () => handleBuyJoker(joker);
                } else if (isSkipDisabled) {
                  btnText = 'KART SEÇ';
                  btnColors = ['#E2E8F0', '#CBD5E1'];
                  isBtnDisabled = true;
                } else {
                  btnText = 'KULLAN';
                  isBtnDisabled = buyingJokerId !== null;
                  btnColors = isBtnDisabled ? ['#E2E8F0', '#CBD5E1'] : [joker.color, palet.pink];
                  onBtnPress = () => {
                    if (onUseJoker) onUseJoker(joker.id);
                    onClose(); 
                  };
                }

                return (
                  <Animated.View key={joker.id} style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
                    <View style={styles.cardTop}>
                      {/* Market modunda joker varsa resim renkli kalsın, oyun içindeyse ve joker yoksa soluklaşsın */}
                      <View style={[styles.imgWrapper, (!hasItem && !isMarketMode) && { opacity: 0.6, filter: 'grayscale(0.5)' }]}>
                        <Image 
                          source={joker.logo} 
                          style={styles.jokerImg} 
                          contentFit="contain" 
                          priority="high" 
                          cachePolicy="memory" 
                        />
                            
                        {/* Envanter Sayısı Badge'i */}
                        {hasItem && (
                          <View style={[styles.badge, { backgroundColor: joker.color }]}>
                            <Text style={styles.badgeText}>{currentCount}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.cardInfo}>
                      <Text style={styles.jokerName}>{joker.name}</Text>
                      <Text style={styles.jokerDesc} numberOfLines={2}>{joker.desc}</Text>
                    </View>

                    <TouchableOpacity disabled={isBtnDisabled} onPress={onBtnPress} style={styles.useBtn} activeOpacity={0.8}>
                      <LinearGradient
                        colors={btnColors}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.btnGradient}
                      >
                        {/* 🚀 ACTIVITY INDICATOR (YÜKLENİYOR İKONU) BURAYA EKLENDİ */}
                        {isCurrentlyBuying ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <>
                            {(!hasItem || isMarketMode) && !isSkipDisabled && (
                              <FontAwesome5 name="coins" size={10} color={isBtnDisabled ? '#94A3B8' : 'white'} style={{ marginRight: 4 }} />
                            )}
                            <Text style={[styles.btnText, isBtnDisabled && { color: '#64748B' }]}>
                              {btnText}
                            </Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// 🚀 STYLES BÖLÜMÜ EKLENDİ
const styles = StyleSheet.create({
  absoluteOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    zIndex: 9999, 
    elevation: 9999, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  overlayBackground: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(15, 23, 42, 0.7)' 
  },
  modalContent: {
    backgroundColor: palet.bg,
    borderRadius: 36,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 25,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }
  },
  glassSidebar: {
    width: 70,
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 25,
    zIndex: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  glassEffect: { 
    ...StyleSheet.absoluteFillObject 
  },
  sidebarTopIcon: { 
    width: 45, 
    height: 45, 
    borderRadius: 16, 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 30, 
    elevation: 5, 
    shadowColor: palet.pink, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 4 } 
  },
  textContainer: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  sidebarTitle: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 13, 
    color: palet.pink, 
    transform: [{ rotate: '-90deg' }], 
    width: 150, 
    textAlign: 'center', 
    letterSpacing: 4 
  },
  coinBadge: { 
    backgroundColor: '#2D2D2D98', 
    paddingHorizontal: 10, 
    paddingVertical: 8, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 20, 
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    shadowRadius: 5 
  },
  coinText: { 
    fontFamily: 'Nunito_800ExtraBold', 
    color: 'white', 
    fontSize: 10, 
    marginTop: 4 
  },
  mainContent: { 
    flex: 1, 
    padding: 25, 
    backgroundColor: palet.bg 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  headerLeft: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 22, 
    color: palet.textDark, 
    letterSpacing: -0.5 
  },
  activeBadge: { 
    marginLeft: 12, 
    backgroundColor: '#FEE0FD', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 10, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  dot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: '#FF2AD1', 
    marginRight: 5 
  },
  activeText: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 10, 
    color: '#FF2AD1', 
    letterSpacing: 1 
  },
  closeCircle: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: 'white', 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 5, 
    elevation: 2 
  },
  grid: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: 12 
  },
  card: { 
    width: '31%', 
    height: '100%', 
    borderRadius: 28, 
    padding: 14, 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#FFF', 
    borderWidth: 1, 
    borderColor: 'rgba(0,0,0,0.02)', 
    shadowColor: '#94A3B8', 
    shadowOpacity: 0.15, 
    shadowRadius: 15, 
    shadowOffset: { width: 0, height: 8 }, 
    elevation: 4 
  },
  imgWrapper: { 
    width: 65, 
    height: 65, 
    borderRadius: 22, 
    backgroundColor: '#F8FAFC', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  jokerImg: { 
    width: 42, 
    height: 42 
  },
  badge: { 
    position: 'absolute', 
    top: -6, 
    right: -6, 
    minWidth: 22, 
    height: 22, 
    borderRadius: 11, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#FFF', 
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    shadowRadius: 3 
  },
  badgeText: { 
    fontFamily: 'Nunito_900Black', 
    color: '#FFF', 
    fontSize: 10 
  },
  cardInfo: { 
    alignItems: 'center', 
    marginVertical: 8 
  },
  jokerName: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 13, 
    textAlign: 'center', 
    color: palet.textDark, 
    letterSpacing: -0.2 
  },
  jokerDesc: { 
    fontFamily: 'Nunito_600SemiBold', 
    fontSize: 10, 
    textAlign: 'center', 
    color: '#64748B', 
    marginTop: 4, 
    lineHeight: 14 
  },
  useBtn: { 
    width: '100%', 
    height: 42, 
    borderRadius: 14, 
    overflow: 'hidden', 
    shadowColor: palet.pink, 
    shadowOpacity: 0.2, 
    shadowRadius: 5, 
    shadowOffset: { width: 0, height: 3 } 
  },
  btnGradient: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  btnText: { 
    fontFamily: 'Nunito_900Black', 
    color: '#FFF', 
    fontSize: 12, 
    letterSpacing: 0.5 
  },
});