import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, StatusBar, Animated,Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackActions } from '@react-navigation/native'; 
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Image } from 'expo-image';

// 🚀 YENİ: Ses ve Titreşim
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const GRID_PADDING = 15;
const CARD_MARGIN = 8;
const CARD_SIZE = (width - (GRID_PADDING * 2) - (CARD_MARGIN * 6)) / 3;

const AVATAR_LIST = [
  'Oliver', 'Willow', 'Felix', 'Jack', 'Luna', 'Zoe', 'Milo', 'Ash', 'Ruby',
  'Jasper', 'Sasha', 'Leo', 'Nala', 'Simba', 'Buster', 'Molly', 'Coco', 'Shadow'
];

export default function AvatarScreen({ navigation, route }) {
  const [selected, setSelected] = useState('Oliver');
  
  // 🚀 SENIOR DOKUNUŞ: Seçili avatarın sürekli nefes alan (pulse) animasyonu
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Ses Hafızaları
  const bubbleSound = useRef(null);
  const tapSound = useRef(null);

  useEffect(() => {
    // Sesleri Yükle
    const setupAudio = async () => {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      
      const { sound: pop } = await Audio.Sound.createAsync(require('../../assets/sounds/bubble_pop.mp3'));
      bubbleSound.current = pop;

      const { sound: tap } = await Audio.Sound.createAsync(require('../../assets/sounds/ui_tap.mp3'));
      tapSound.current = tap;
    };
    setupAudio();

    // Pulse Animasyonunu Başlat
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
      ])
    ).start();

    return () => {
      if (bubbleSound.current) bubbleSound.current.unloadAsync();
      if (tapSound.current) tapSound.current.unloadAsync();
    };
  }, []);

  const handleConfirm = async () => { 
    // 🚀 AKSİYON: Onay sesi ve titreşimi
    if (tapSound.current) await tapSound.current.replayAsync();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const { nextScreen, extraParams } = route.params || {};
    const user = auth.currentUser;
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { avatarSeed: selected });
      } catch (error) {
        console.log("Avatar kaydedilemedi:", error);
      }
    }
    
    const currentName = extraParams?.myName || route.params?.myName || auth.currentUser?.displayName || 'Oyuncu';

    if (nextScreen) {
      navigation.dispatch(
        StackActions.replace(nextScreen, {
          ...extraParams,
          userAvatar: selected, 
          myAvatarSeed: selected, 
          myName: currentName 
        })
      );
    } else {
      navigation.navigate('Home');
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selected === item;
    return (
      <TouchableOpacity 
        style={[styles.card, isSelected && styles.selectedCard]} 
        onPress={async () => {
          setSelected(item);
          // 🚀 AKSİYON: Karakter seçildiğinde bubble pop sesi ve hafif titreşim
          if (bubbleSound.current) await bubbleSound.current.replayAsync();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        activeOpacity={0.8} // Daha tok bir basım hissi
      >
       <Image 
          source={{ uri: `https://api.dicebear.com/7.x/adventurer/png?seed=${item}&backgroundColor=ffffff` }} 
          style={[styles.avatarImage, isSelected && { transform: [{ scale: 1.15 }] }]} 
          contentFit="cover" 
          transition={300} 
          cachePolicy="memory-disk" 
        />
        {isSelected && (
           <View style={styles.activeIndicatorWrapper}>
              <View style={styles.activeIndicator} />
           </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 🚀 SENIOR DOKUNUŞ: Arka plana hafif, oyunsu bir degradé (gradient) */}
      <LinearGradient colors={['#FAFAFA', '#F3F4F6']} style={StyleSheet.absoluteFillObject} />
      
      <View style={styles.minimalHeader}>
        <TouchableOpacity 
          style={styles.closeBtn} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Home');
          }}
        >
          <Ionicons name="chevron-back" size={24} color='#FF69EB' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Karakter Seçimi</Text>
        <View style={{ width: 44 }} /> 
      </View>

      <View style={styles.showcase}>
        <Animated.View style={[styles.previewRing, { transform: [{ scale: pulseAnim }] }]}>
  <Image 
      source={{ uri: `https://api.dicebear.com/7.x/adventurer/png?seed=${selected}&backgroundColor=ffffff` }} 
      style={styles.previewImage} 
      placeholder={require('../../assets/placeholderAvatar.png')} // defaultSource yerine placeholder
      contentFit="contain" 
      transition={200} // Seçim değiştikçe yumuşak geçiş yapar
      cachePolicy="memory-disk" // Önizleme için de agresif önbellekleme
   />
</Animated.View>
        <Text style={styles.instructionText}>Masadaki yeni tarzını belirle</Text>
      </View>

      <FlatList
        data={AVATAR_LIST}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        numColumns={3}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.premiumButton} onPress={handleConfirm} activeOpacity={0.9}>
          <LinearGradient 
            colors={['#FF69EB', '#FF00D6']} // Renk akışı pürüzsüzleştirildi
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            {/* Buton içine şık bir parlama efekti */}
            <View style={styles.buttonGloss} />
            <Text style={styles.buttonText}>MASAYA KATIL</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  minimalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  showcase: { alignItems: 'center', paddingVertical: 25 },
  previewRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFF',
    elevation: 20,
    shadowColor: '#FF00D6',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 0, 214, 0.05)'
  },
  previewImage: { width: 140, height: 140 },
  instructionText: { marginTop: 20, fontSize: 15, fontWeight: '700', color: '#6B7280' },
  listPadding: { paddingHorizontal: GRID_PADDING, paddingBottom: 140 },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    margin: CARD_MARGIN,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1
  },
  selectedCard: {
    borderColor: '#FF00D6',
    shadowColor: '#FF00D6',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    transform: [{ translateY: -3 }]
  },
  avatarImage: { width: '75%', height: '75%' },
  activeIndicatorWrapper: {
    position: 'absolute', 
    bottom: 8,
    backgroundColor: '#FFF',
    padding: 3,
    borderRadius: 10,
  },
  activeIndicator: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#FF00D6' 
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 25,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    paddingTop: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  premiumButton: {
    height: 64,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#FF00D6',
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 10
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.2
  }
});