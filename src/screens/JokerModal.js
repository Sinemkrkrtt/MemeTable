import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const palet = {
  vibrant: '#FF69EB',
  soft: '#FF86C8',
  peach: '#FFA3A5',
  sand: '#FFBF81',
  yellow: '#FFDC5E',
  darkText: '#4A1D3A',
};

// 🖼️ GÖLGE LOGOLARIN IMPORT EDİLMESİ
// (Bu dosyaların asset klasörünüzde bu isimlerle bulunduğunu varsayıyorum)
const logoSwapHand = require('../../assets/joker1.png'); // joker1: image_8.png tabanlı deste takası
const logoSwapCard = require('../../assets/joker2.png'); // joker2: image_6.png tabanlı tekli takas
const logoTimeFreeze = require('../../assets/joker3.png'); // joker3: image_7.png tabanlı buz saati
const logoDoublePoints = require('../../assets/joker4.png'); // joker4: image_9.png tabanlı X2 puan

const JOKERS = [
  { id: 'joker1', name: 'DESTE DEĞİŞTİR', desc: 'Tüm kartlarını çöpe at, yepyeni 5 kart çek!', logo: logoSwapHand, color: palet.vibrant, count: 2 },
  { id: 'joker2', name: 'TEKLİ SWAP', desc: 'İşine yaramayan 1 kartı yenisiyle değiştir.', logo: logoSwapCard, color: palet.peach, count: 5 },
  { id: 'joker3', name: 'ZAMAN DONDURUCU', desc: 'Süreyi 5 saniye dondur, rahatça düşün.', logo: logoTimeFreeze, color: '#00E5FF', count: 1 },
  { id: 'joker4', name: 'X2 ÇARPAN', desc: 'Bu turu kazanırsan tam 2 puan alırsın!', logo: logoDoublePoints, color: palet.yellow, count: 0 },
];

export default function JokerModal({ visible, onClose, onUseJoker }) {
  // Animasyon Değerleri
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // 🚀 Her bir kartın sırayla gelmesi için dizi halinde animasyon referansları
  const cardAnims = useRef(JOKERS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (visible) {
      // 1. Önce Ana Panel Açılsın
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true })
      ]).start(() => {
        // 2. Panel açıldıktan sonra kartlar SÜZÜLEREK (Stagger) sırayla gelsin!
        Animated.stagger(80, cardAnims.map(anim =>
          Animated.spring(anim, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true })
        )).start();
      });
    } else {
      // Kapanırken her şeyi sıfırla
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ...cardAnims.map(anim => Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }))
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        
        {/* Arkadaki Dev Işık Hüzmesi */}
        <View style={styles.modalAura} />

        <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}>
          
          {/* ✨ Üst Başlık */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <Ionicons name="flash" size={26} color={palet.yellow} />
              <Text style={styles.headerTitle}>YETENEK ENVANTERİ</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={36} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerDivider} />

          {/* 🃏 4'lü Yatay RPG Kart Dizilimi */}
          <View style={styles.cardsContainer}>
            {JOKERS.map((joker, index) => {
              const isOutOfStock = joker.count === 0;

              // Kart animasyon değerleri: Hem büyür hem de aşağıdan yukarı kayar
              const cardScale = cardAnims[index].interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
              const cardTranslateY = cardAnims[index].interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
              const cardOpacity = cardAnims[index];

              return (
                <Animated.View 
                  key={joker.id} 
                  style={[
                    styles.jokerCard, 
                    isOutOfStock && styles.outOfStockCard,
                    { opacity: cardOpacity, transform: [{ scale: cardScale }, { translateY: cardTranslateY }] }
                  ]}
                >
                  {/* Kart İç Gradyanı */}
                  <LinearGradient 
                    colors={[`${joker.color}1A`, 'rgba(0,0,0,0.6)']} 
                    style={StyleSheet.absoluteFill} 
                    borderRadius={22}
                  />

                  {/* İkon & Miktar (Mücevher Hissiyatı) */}
                  <View style={styles.cardTop}>
                    <View style={[styles.iconGlow, { borderColor: joker.color, shadowColor: joker.color }]}>
                      {/* 🖼️ EMOJİ YERİNE ÖZEL LOGO RESMİ */}
                      <Image 
  source={joker.logo} 
  style={styles.jokerLogoImage} 
  resizeMode="contain"
/>
                    </View>
                    <View style={[styles.countBadge, { backgroundColor: isOutOfStock ? '#444' : joker.color }]}>
                      <Text style={[styles.countText, isOutOfStock && { color: '#AAA' }]}>{joker.count}</Text>
                    </View>
                  </View>

                  {/* Yazılar */}
                  <View style={styles.cardMiddle}>
                    <Text style={[styles.jokerName, { color: isOutOfStock ? '#666' : joker.color }]}>
                      {joker.name}
                    </Text>
                    <Text style={styles.jokerDesc} numberOfLines={3}>{joker.desc}</Text>
                  </View>

                  {/* Kullan Butonu */}
                  <TouchableOpacity 
                    style={styles.useButtonWrapper}
                    activeOpacity={0.8}
                    disabled={isOutOfStock}
                    onPress={() => onUseJoker(joker.id)}
                  >
                    <LinearGradient
                      colors={isOutOfStock ? ['#2A2A2A', '#1A1A1A'] : [joker.color, `${joker.color}99`]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={styles.useButtonGradient}
                    >
                      <Text style={[styles.useButtonText, isOutOfStock && { color: '#666' }]}>
                        {isOutOfStock ? 'TÜKENDİ' : 'KULLAN'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                </Animated.View>
              );
            })}
          </View>
          
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 0, 10, 0.85)', // Çok derin bir karanlık
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAura: {
    position: 'absolute',
    width: width * 0.8,
    height: height * 0.6,
    backgroundColor: palet.vibrant,
    opacity: 0.15,
    borderRadius: 300,
    transform: [{ scaleX: 1.5 }],
  },
  modalContent: {
    width: '92%',
    maxWidth: 900,
    height: '80%',
    backgroundColor: 'rgba(20, 10, 25, 0.95)', // Kaliteli, opak mürdüm
    borderRadius: 35,
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 235, 0.3)',
    padding: 24,
    elevation: 30,
    shadowColor: palet.vibrant,
    shadowOpacity: 0.4,
    shadowRadius: 50,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontFamily: 'Nunito_900Black',
    fontSize: 26,
    color: '#FFF',
    letterSpacing: 4,
    textShadowColor: palet.vibrant,
    textShadowRadius: 15,
  },
  closeBtn: {
    padding: 2,
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
    marginBottom: 20,
  },
  cardsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },
  jokerCard: {
    flex: 1,
    backgroundColor: '#0A050D', // Kartların içi ekstra karanlık
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 10,
  },
  outOfStockCard: {
    borderColor: '#222',
  },
  cardTop: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  iconGlow: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2, // Çerçeve efekti
    shadowOpacity: 0.9,
    shadowRadius: 15,
    elevation: 12,
  },
  // 🖼️ LOGO RESMİ İÇİN YENİ STİL
  jokerLogoImage: {
    width: 45, // Emojiden biraz daha büyük durması için ideal boyut
    height: 45,
  },
  countBadge: {
    position: 'absolute',
    top: -5,
    right: 15,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0A050D', // Kartın arka plan rengiyle aynı ki kesik dursun
    elevation: 8,
  },
  countText: {
    color: '#FFF',
    fontFamily: 'Nunito_900Black',
    fontSize: 13,
  },
  cardMiddle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
  },
  jokerName: {
    fontFamily: 'Nunito_900Black',
    fontSize: 17,
    textAlign: 'center',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  jokerDesc: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 18,
  },
  useButtonWrapper: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  useButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useButtonText: {
    color: '#FFF',
    fontFamily: 'Nunito_900Black',
    fontSize: 14,
    letterSpacing: 2,
  },
}); 