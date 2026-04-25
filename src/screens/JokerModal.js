import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const JOKERS = [

{ id: 'joker1', name: 'DESTE TAKASI', desc: 'Tüm elini çöpe at, taze 5 kart çek!', logo: require('../../assets/joker2.png'), color: '#FF69EB', count: 2 },

{ id: 'joker2', name: 'TEKLİ DEĞİŞİM', desc: 'Beğenmediğin 1 kartı yenisiyle değiştir.', logo: require('../../assets/joker1.png'), color: '#FF8A00', count: 5 },

{ id: 'joker3', name: 'BUZ SAATİ', desc: 'Süreyi 5 saniye dondur, hamleni planla.', logo: require('../../assets/joker3.png'), color: '#00E5FF', count: 1 },

{ id: 'joker4', name: 'X2 PUAN', desc: 'Bu tur kazanırsan hanene çift puan yazdır!', logo: require('../../assets/joker4.png'), color: '#FFDC5E', count: 0 },

];
export default function JokerModal({ visible, onClose, onUseJoker, inventory }) {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(JOKERS.map(() => new Animated.Value(0))).current;

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

  // Modal açık değilse hiçbir şey çizme
  if (!visible) return null;

  return (
    // 🎯 DÜZELTME 1: <Modal> yerine tam ekran (absoluteFillObject) View kullanıldı. Z-index ile en üste alındı.
    <View style={styles.absoluteOverlay}>
      <Animated.View style={[styles.overlayBackground, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>
      
      <Animated.View style={[styles.modalContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        
        {/* SOL GLASSMORPHISM PANEL */}
        <View style={styles.glassSidebar}>
          <LinearGradient colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.1)']} style={styles.glassEffect} />
          <Text style={styles.sidebarTitle}>ENVANTER</Text>
          <View style={styles.sidebarDivider} />
          <Ionicons name="shield-checkmark" size={24} color="#FF00D6" style={{ opacity: 0.6 }} />
        </View>

        {/* SAĞ ANA İÇERİK ALANI */}
        <View style={styles.mainContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBg}>
                <Ionicons name="flash" size={20} color="#FF00D6" />
              </View>
              {/* 🎯 NOT: Font çökmesi olmasın diye standart font ağırlıkları eklendi */}
              <Text style={styles.headerTitle}>Yetenek Envanteri</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeCircle}>
              <Ionicons name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {JOKERS.map((joker, index) => {
              const isLocked = inventory ? inventory[joker.id] <= 0 : joker.count <= 0;
              const currentCount = inventory ? inventory[joker.id] : joker.count;
              const cardOpacity = cardAnims[index];
              const cardScale = cardAnims[index].interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

              return (
                <Animated.View key={joker.id} style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
                  {/* 🎯 DÜZELTME 2: LinearGradient borderRadius hatası engellendi */}
                  <View style={[StyleSheet.absoluteFill, { borderRadius: 25, overflow: 'hidden' }]}>
                     <LinearGradient colors={['#FDFDFD', '#F4F5F7']} style={StyleSheet.absoluteFill} />
                  </View>
                  
                  <View style={styles.cardTop}>
                    <View style={styles.imgWrapper}>
                      <Image source={joker.logo} style={styles.jokerImg} resizeMode="contain" />
                      <View style={[styles.badge, { backgroundColor: isLocked ? '#CCC' : joker.color }]}>
                        <Text style={styles.badgeText}>{currentCount}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.jokerName}>{joker.name}</Text>
                    <Text style={styles.jokerDesc} numberOfLines={2}>{joker.desc}</Text>
                  </View>

                  <TouchableOpacity disabled={isLocked} onPress={() => onUseJoker(joker.id)} style={styles.useBtn}>
                    {/* 🎯 DÜZELTME 3: Çökmeye sebep olan alpha hex renkleri standart RGB/Hex renklere çevrildi */}
                    <LinearGradient
                      colors={isLocked ? ['#DDDDDD', '#BBBBBB'] : [joker.color, joker.color]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>{isLocked ? 'TÜKENDİ' : 'KULLAN'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999, // En üstte durmasını garantiler
    elevation: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)', 
  },
  modalContent: {
    width: width > 600 ? 800 : '95%', 
    height: height > 400 ? 380 : '85%', 
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 35,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 25,
  },
  glassSidebar: {
    width: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  glassEffect: {
    ...StyleSheet.absoluteFillObject,
  },
  sidebarTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF00D6',
    transform: [{ rotate: '-90deg' }],
    width: 100,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 40,
  },
  sidebarDivider: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255, 0, 214, 0.2)',
    marginVertical: 20,
    borderRadius: 1,
  },
  mainContent: { flex: 1, padding: 20 },
  grid: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  card: {
    width: '23%', 
    height: '90%',
    borderRadius: 25,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFE6F7', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1D1D1F' },
  closeCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center' },
  imgWrapper: { width: 55, height: 55, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  jokerImg: { width: 35, height: 35 },
  badge: { position: 'absolute', top: -5, right: -5, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  cardInfo: { alignItems: 'center', marginVertical: 8 },
  jokerName: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  jokerDesc: { fontSize: 9, fontWeight: '600', textAlign: 'center', color: '#999', marginTop: 4 },
  useBtn: { width: '100%', height: 36, borderRadius: 12, overflow: 'hidden' },
  btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
});