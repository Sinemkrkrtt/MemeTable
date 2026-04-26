import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, Animated, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../services/firebase';
import { ref, onValue } from 'firebase/database';
import { styles } from './RoomScreenStyles'; 

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
      textShadowColor: '#00E5FF', textShadowRadius: 8
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
  
  // 🚀 DÜZELTME 2: Çift geçiş (double navigate) kilit sistemi
  const hasNavigated = useRef(false);

  const logoSwapHand = require('../../assets/joker1.png');
  const logoSwapCard = require('../../assets/joker2.png');
  const logoTimeFreeze = require('../../assets/joker3.png');
  const logoDoublePoints = require('../../assets/joker4.png');

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

        // 🚀 DÜZELTME 3: React Navigation animasyonlarına zaman tanıyoruz (1.2 saniye bekleme)
        if (data.status === 'playing' && !hasNavigated.current) {
          hasNavigated.current = true;
          setTimeout(() => {
             navigation.replace('RoomScreen', { roomId, myAvatarSeed, myName });
          }, 1200); // Masa yüklenir yüklenmez oyuna atmasın, önce bir masayı görsünler
        }
      }
    });

    Animated.spring(popAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();

    return () => unsubscribe();
  }, [roomId]);

  const PlayerSlot = ({ name, positionStyle, avatarAnimal, badgeColor, isPlayerReady, isHost }) => (
    <View style={[styles.playerSlot, positionStyle]}>
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: `https://api.dicebear.com/7.x/adventurer/png?seed=${avatarAnimal}&backgroundColor=ffffff` }} 
          style={[styles.avatar, { borderColor: isPlayerReady ? '#4ADE80' : badgeColor, backgroundColor: '#FFF' }]} 
        />
        {isHost && (
          <View style={{ position: 'absolute', top: -12, right: -5, backgroundColor: '#1A1A1A', borderRadius: 10, padding: 2 }}>
            <Ionicons name="ribbon" size={18} color="#FFD700" />
          </View>
        )}
        <View style={[styles.nameBadge, { backgroundColor: isPlayerReady ? '#4ADE80' : badgeColor }]}>
          <Text style={styles.playerName}>{name}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <View style={styles.whiteBackground} />

      <View style={styles.hudWrapper}>
        <View style={[styles.hudContainer, { opacity: 0.5 }]}>
          <Ionicons name="flash" size={20} color="#FF00D6" style={styles.hudTitleIcon} />
          {[logoSwapHand, logoSwapCard, logoTimeFreeze, logoDoublePoints].map((img, i) => (
            <View key={i} style={styles.jokerIconWrapper}>
              <View style={styles.jokerButton}>
                <Image source={img} style={styles.jokerLogo} resizeMode="contain" />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.announcementBanner}>
        <LinearGradient
          colors={['transparent', 'rgba(255, 105, 235, 0.8)', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.bannerGradient}
        >
          <Text style={styles.announcementText}>OYUNCULAR MASAYA OTURUYOR...</Text>
        </LinearGradient>
      </View>

      <View style={styles.tableContainer}>
        <View style={styles.mainTableRim}>
          <View style={styles.tableSurface}>
            <Image source={require('../../assets/roomTableLogo.png')} style={styles.roomTableLogo} />
          </View>

          {players.map((p, index) => {
            const positions = [styles.topPlayer, styles.leftPlayer, styles.rightPlayer, styles.bottomPlayer];
            const colors = ["#FDE58E", "#FBB0B2", "#FEC994", "#FCA9D7"];
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

          <View style={styles.centerArea}>
            <View style={styles.proTimerContainer}>
              <View style={[styles.staticRing, { borderColor: '#FF69EB', opacity: 0.6 }]} />
              
              <View style={styles.snowOverlay} pointerEvents="none">
                 <Snowflake delay={0} left="20%" size={14} />
                 <Snowflake delay={1000} left="70%" size={12} />
              </View>

              <View style={styles.modernTimerContent}>
                 <Text style={{ color: '#FF69EB', fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>{roomId}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottomDeckWrapper}>
        <Animated.View style={{ transform: [{ scale: popAnim }] }}>
          <LinearGradient 
            colors={['#4B5563', '#1F2937']} 
            style={{ paddingHorizontal: 30, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center' }}
          >
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ADE80', marginRight: 10 }} />
            <Text style={{ color: 'white', fontWeight: '700' }}>
              {players.length} OYUNCU HAZIRLANIYOR
            </Text>
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
}