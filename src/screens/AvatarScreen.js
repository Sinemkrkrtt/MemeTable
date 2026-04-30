import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions, StatusBar, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackActions } from '@react-navigation/native'; 
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

// 🚀 YENİ: Ses ve Titreşim
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

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
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Karakter Seçimi</Text>
        <View style={{ width: 44 }} /> 
      </View>

      <View style={styles.showcase}>
        <Animated.View style={[styles.previewRing, { transform: [{ scale: pulseAnim }] }]}>
           <Image 
              source={{ uri: `https://api.dicebear.com/7.x/adventurer/png?seed=${selected}&backgroundColor=ffffff` }} 
              style={styles.previewImage} 
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 14, // Biraz daha yumuşak köşeler
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  headerTitle: { fontSize: 20, fontFamily: 'Nunito_900Black', color: '#111827', letterSpacing: -0.5 },
  showcase: { alignItems: 'center', paddingVertical: 25 },
  previewRing: {
    width: 130, // Biraz daha büyütüldü
    height: 130,
    borderRadius: 70,
    backgroundColor: '#FFF',
    elevation: 25,
    shadowColor: '#FF00D6',
    shadowOpacity: 0.15, // Gölge daha belirgin ama yumuşak
    shadowRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 0, 214, 0.1)' // Çerçeveye hafif pembe ton
  },
  previewImage: { width: 130, height: 130 },
  instructionText: { marginTop: 20, fontSize: 15, fontFamily: 'Nunito_700Bold', color: '#6B7280' },
  listPadding: { paddingHorizontal: 15, paddingBottom: 140 },
  card: {
    flex: 1,
    aspectRatio: 1,
    margin: 8,
    borderRadius: 24,
    backgroundColor: '#FFF', // Gri yerine beyaz yapıp hafif gölge eklendi
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
    backgroundColor: '#FFF',
    borderColor: '#FF00D6',
    shadowColor: '#FF00D6',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ translateY: -2 }] // Seçili olan hafif yukarı kalkar
  },
  avatarImage: { width: '85%', height: '85%' },
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
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'rgba(255,255,255,0.8)', // Blur hissi için opacity düşürüldü
  },
  premiumButton: {
    height: 64,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#FF00D6',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12
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
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Camımsı parlama
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Nunito_900Black',
    letterSpacing: 1.2
  }
});