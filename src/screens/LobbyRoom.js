import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, Animated, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../services/firebase';
import { ref, onValue } from 'firebase/database';
import { styles } from './RoomScreenStyles'; 

// 🔥 RENK PALETİ TEMA
const THEME = {
  pink: '#FF69EB',     // Ana Pembe
  orange: '#FF914D',   // Ana Turuncu
  neonPink: '#FF00D6', // Vurgu Pembesi (Eski yeşilin yerine)
  glow: '#FF9EED',     // Parlama
  host: '#FFD700'      // Gold (Lider için kalabilir)
};

const Snowflake = ({ delay, left, size }) => {
  const fallAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: delay, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(fallAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 0, duration: 2500, useNativeDriver: true })
        ]),
        Animated.timing(fallAnim, { toValue: 0, duration: 0, useNativeDriver: true }) 
      ])
    ).start();
  }, []);

  const translateY = fallAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 80] });

  return (
    <Animated.Text style={{
      position: 'absolute', left: left, top: -10, fontSize: size,
      opacity: fadeAnim, transform: [{ translateY }],
      textShadowColor: THEME.glow, // Temaya uygun parlama
      textShadowRadius: 8
    }}>
      ❄️
    </Animated.Text>
  );
};

export default function LobbyRoom({ route, navigation }) {
  const { width, height } = useWindowDimensions();
  const { roomId, myAvatarSeed, myName } = route.params || { roomId: '...', myAvatarSeed: 'Oliver', myName: 'Oyuncu' };

  const [players, setPlayers] = useState([]);
  const popAnim = useRef(new Animated.Value(0)).current;
  
  const hasNavigated = useRef(false);

  // Joker görselleri (assets klasöründe olmalı)
  const logoSwapHand = require('../../assets/joker1.png');
  const logoSwapCard = require('../../assets/joker2.png');
  const logoTimeFreeze = require('../../assets/joker3.png');


  useEffect(() => {
    const lockScreen = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    };
    lockScreen();

    const roomRef = ref(database, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.players) {
          const playersList = Object.keys(data.players).map(key => ({
            id: key,
            ...data.players[key]
          }));
          setPlayers(playersList);
        }

        // Oyun başladıysa yönlendir (1.2sn gecikmeli)
        if (data.status === 'playing' && !hasNavigated.current) {
          hasNavigated.current = true;
          setTimeout(() => {
             navigation.replace('RoomScreen', { roomId, myAvatarSeed, myName });
          }, 1200);
        }
      }
    });

    Animated.spring(popAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();

    return () => unsubscribe();
  }, [roomId]);

  // 🚀 DÜZELTME: Oyuncu slot tasarımı (Yeşiller Neon Pembe yapıldı)
  const PlayerSlot = ({ name, positionStyle, avatarAnimal, badgeColor, isPlayerReady, isHost }) => (
    <View style={[styles.playerSlot, positionStyle]}>
      <View style={styles.avatarContainer}>
        {/* Hazırsa Neon Pembe çerçeve, değilse slotun kendi rengi */}
        <Image 
          source={{ uri: `https://api.dicebear.com/7.x/adventurer/png?seed=${avatarAnimal}&backgroundColor=ffffff` }} 
          style={[
            styles.avatar, 
            { 
                borderColor: isPlayerReady ? THEME.neonPink : badgeColor, // Değişti: #4ADE80 -> neonPink
                backgroundColor: '#FFF' 
            }
          ]} 
        />
        {isHost && (
          <View style={{ position: 'absolute', top: -12, right: -5, backgroundColor: '#1A1A1A', borderRadius: 10, padding: 2, zIndex: 2 }}>
            <Ionicons name="ribbon" size={18} color={THEME.host} />
          </View>
        )}
        {/* İsim rozeti: Hazırsa Neon Pembe, değilse slotun rengi */}
        <View style={[styles.nameBadge, { backgroundColor: isPlayerReady ? THEME.neonPink : badgeColor }]}>
          <Text style={[styles.playerName, { color: '#000', fontWeight: 'bold' }]}>{name}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {/* Hafif kremsi bir arka plan */}
      <View style={[styles.whiteBackground, { backgroundColor: '#FFFAF0' }]} />

      {/* Üst Joker HUD (Silik duruyor lobide) */}
      <View style={styles.hudWrapper}>
        <View style={[styles.hudContainer, { opacity: 0.3 }]}>
          <Ionicons name="flash" size={24} color={THEME.neonPink} style={styles.hudTitleIcon} />
          {[logoSwapHand, logoSwapCard, logoTimeFreeze].map((img, i) => (
            <View key={i} style={styles.jokerIconWrapper}>
              <View style={styles.jokerButton}>
                <Image source={img} style={styles.jokerLogo} resizeMode="contain" />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Orta Banner */}
      <View style={styles.announcementBanner}>
        <LinearGradient
          colors={['transparent', 'rgba(255, 105, 235, 0.4)', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.bannerGradient}
        >
          <Text style={styles.announcementText}>OYUNCULAR MASAYA OTURUYOR...</Text>
        </LinearGradient>
      </View>

      {/* Masa Alanı */}
      <View style={styles.tableContainer}>
        <View style={styles.mainTableRim}>
          {/* Masa Yüzeyi (Tasarım aynı kaldı) */}
          <View style={styles.tableSurface}>
            <Image source={require('../../assets/roomTableLogo.png')} style={styles.roomTableLogo} />
          </View>

          {/* Oyuncular - Renk paleti pembe/turuncu/sarı tonlarına sabitlendi */}
          {players.map((p, index) => {
            const positions = [styles.topPlayer, styles.leftPlayer, styles.rightPlayer, styles.bottomPlayer];
            // Slot renkleri daha sıcak tonlar yapıldı
            const colors = ["#FED7AA", "#FCA5A5", "#FDE68A", "#FBCFE8"]; // Sırasıyla Turuncu, Kırmızımsı, Sarı, Pembe
            return (
              <PlayerSlot 
                key={p.id}
                name={p.name === myName ? "SEN" : p.name}
                positionStyle={positions[index % 4]}
                avatarAnimal={p.avatar}
                badgeColor={colors[index % 4]}
                isPlayerReady={p.isReady}
                isHost={p.isHost}
              />
            );
          })}

          {/* Orta Oda Kodu */}
          <View style={styles.centerArea}>
            <View style={styles.proTimerContainer}>
              <View style={[styles.staticRing, { borderColor: THEME.pink, opacity: 0.6 }]} />
              
              <View style={styles.snowOverlay} pointerEvents="none">
                 <Snowflake delay={0} left="20%" size={14} />
                 <Snowflake delay={1000} left="70%" size={12} />
              </View>

              <View style={styles.modernTimerContent}>
                 <Text style={{ color: THEME.pink, fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>{roomId}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 🚀 DÜZELTME: Alt Deck Alanı (Gri ve Yeşil kaldırıldı, Pembe-Turuncu Tema) */}
      <View style={[styles.bottomDeckWrapper, { shadowColor: THEME.glow, shadowRadius: 15, shadowOpacity: 0.5, elevation: 10 }]}>
        <Animated.View style={{ transform: [{ scale: popAnim }] }}>
          <LinearGradient 
            colors={[THEME.orange, THEME.pink]} // Turuncu -> Pembe Gradyan
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ 
                paddingHorizontal: 40, 
                paddingVertical: 12, 
                borderRadius: 25, 
                flexDirection: 'row', 
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)'
            }}
          >
            {/* Nokta: Neon Pembe */}
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: THEME.neonPink, marginRight: 12, shadowColor: THEME.neonPink, shadowRadius: 5, shadowOpacity: 1 }} />
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 }}>
              {players.length} OYUNCU BEKLENİYOR
            </Text>
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
}