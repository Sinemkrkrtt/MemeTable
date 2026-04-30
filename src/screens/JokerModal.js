import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const JOKERS = [
  { 
    id: 'joker_skip', // joker1 yerine joker_skip
    name: 'TEKLİ DEĞİŞİM', 
    desc: 'Beğenmediğin 1 kartı yenisiyle değiştir.', 
    logo: require('../../assets/joker1.png'), 
    color: '#FF8A00' 
  },
  { 
    id: 'joker_double', // joker2 yerine joker_double
    name: 'DESTE TAKASI', 
    desc: 'Tüm elini çöpe at, taze 5 kart çek!', 
    logo: require('../../assets/joker2.png'), 
    color: '#FF69EB' 
  },
  { 
    id: 'joker_freeze', // joker3 yerine joker_freeze
    name: 'BUZ SAATİ', 
    desc: 'Süreyi 5 saniye dondur, hamleni planla.', 
    logo: require('../../assets/joker3.png'), 
    color: '#00E5FF' 
  }
];

export default function JokerModal({ visible, onClose, onUseJoker, inventory, selectedCard }) {
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

  if (!visible) return null;

  

  return (
    <View style={styles.absoluteOverlay}>
      <Animated.View style={[styles.overlayBackground, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>
      
      <Animated.View style={[styles.modalContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        
        {/* ⚡️ SOL ŞİMŞEK ŞERİDİ (HUD Tasarımı) */}
        <View style={styles.glassSidebar}>
          <LinearGradient 
            colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.05)']} 
            style={styles.glassEffect} 
          />
          <View style={styles.sidebarTopIcon}>
            <Ionicons name="flash" size={28} color="#FF00D6" />
          </View>
          
          <View style={styles.textContainer}>
             <Text style={styles.sidebarTitle}>ENVANTER</Text>
          </View>
          
          <View style={styles.sidebarDivider} />
          <Ionicons name="sparkles" size={20} color="#FF00D6" style={{ opacity: 0.4 }} />
        </View>

        {/* SAĞ ANA İÇERİK ALANI */}
        <View style={styles.mainContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Yeteneklerin</Text>
              <View style={styles.activeBadge}>
                 <View style={styles.dot} />
                 <Text style={styles.activeText}>AKTİF</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeCircle}>
              <Ionicons name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
           {JOKERS.map((joker, index) => {
            const currentCount = inventory ? (inventory[joker.id] || 0) : 0;
            const isLocked = currentCount <= 0;
            
            // 🚀 YENİ KONTROL: Tekli değişim seçili ama kart seçilmemişse butonu gri yap
            const isActionDisabled = isLocked || (joker.id === 'joker_skip' && !selectedCard);
              const cardOpacity = cardAnims[index];
              const cardScale = cardAnims[index].interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

              return (
                <Animated.View key={joker.id} style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
                  <View style={[StyleSheet.absoluteFill, { borderRadius: 25, overflow: 'hidden' }]}>
                     <LinearGradient colors={['#FDFDFD', '#F4F5F7']} style={StyleSheet.absoluteFill} />
                  </View>
                  
                  <View style={styles.cardTop}>
                    <View style={[styles.imgWrapper, isLocked && { opacity: 0.5 }]}>
                      <Image source={joker.logo} style={styles.jokerImg} resizeMode="contain" />
                      <View style={[styles.badge, { backgroundColor: isLocked ? '#9CA3AF' : joker.color }]}>
                        <Text style={styles.badgeText}>{currentCount}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.jokerName}>{joker.name}</Text>
                    <Text style={styles.jokerDesc} numberOfLines={2}>{joker.desc}</Text>
                  </View>

                  <TouchableOpacity disabled={isLocked} onPress={() => onUseJoker(joker.id)} style={styles.useBtn}>
                    <LinearGradient
                      colors={isLocked ? ['#E5E7EB', '#D1D5DB'] : [joker.color, joker.color]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.btnGradient}
                    >
                      <Text style={[styles.btnText, isLocked && { color: '#6B7280' }]}>
                        {isLocked ? 'YOK' : 'KULLAN'}
                      </Text>
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
    zIndex: 9999, 
    elevation: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)', 
  },
  modalContent: {
    width: width > 600 ? 750 : '95%', 
    height: height > 400 ? 360 : '80%', 
    backgroundColor: '#FFF',
    borderRadius: 35,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 25,
  },
  glassSidebar: {
    width: 70,
    backgroundColor: 'rgba(255, 0, 214, 0.05)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 0, 214, 0.1)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 25,
  },
  glassEffect: { ...StyleSheet.absoluteFillObject },
  sidebarTopIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 5,
    shadowColor: '#FF00D6',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  textContainer: { flex: 1, justifyContent: 'center' },
  sidebarTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FF00D6',
    transform: [{ rotate: '-90deg' }],
    width: 150,
    textAlign: 'center',
    letterSpacing: 4,
  },
  sidebarDivider: {
    width: 20,
    height: 3,
    backgroundColor: '#FF00D6',
    marginVertical: 20,
    borderRadius: 2,
    opacity: 0.3
  },
  mainContent: { flex: 1, padding: 25 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#111827' },
  activeBadge: { marginLeft: 12, backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 5 },
  activeText: { fontSize: 10, fontWeight: 'bold', color: '#059669' },
  closeCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4FB', justifyContent: 'center', alignItems: 'center' },
  grid: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  card: {
    width: '31%', 
    height: '100%',
    borderRadius: 25,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  imgWrapper: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  jokerImg: { width: 38, height: 38 },
  badge: { position: 'absolute', top: -8, right: -8, minWidth: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  cardInfo: { alignItems: 'center', marginVertical: 10 },
  jokerName: { fontSize: 12, fontWeight: '900', textAlign: 'center', color: '#1F2937' },
  jokerDesc: { fontSize: 9, fontWeight: '500', textAlign: 'center', color: '#6B7280', marginTop: 4, lineHeight: 12 },
  useBtn: { width: '100%', height: 40, borderRadius: 14, overflow: 'hidden' },
  btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
});