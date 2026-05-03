import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar,Animated, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { database, auth } from '../services/firebase'; // 🚀 DÜZELTİLDİ: auth eklendi
import { ref, onValue, remove, onDisconnect, update } from 'firebase/database'; // 🚀 DÜZELTİLDİ: update eklendi
import { styles } from './RoomScreenStyles'; 

const Snowflake = ({ delay, left, size }) => {
  const fallAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: delay, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(fallAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 0, duration: 2500, useNativeDriver: true })
        ]),
        Animated.timing(fallAnim, { toValue: 0, duration: 0, useNativeDriver: true }) 
      ])
    );
    animation.start();

    return () => animation.stop(); // Memory Leak önlendi
  }, []);

  const translateY = fallAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 120] }); // Yatay ekran için 80 yerine 120'ye uzattık

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
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hasNavigated = useRef(false);

  const logoSwapHand = require('../../assets/joker1.png');
  const logoSwapCard = require('../../assets/joker2.png');
  const logoTimeFreeze = require('../../assets/joker3.png');

  const handleLeaveRoom = async () => {
    // Kendi id'mizle odadan çıkıyoruz
    const myPlayerRef = ref(database, `rooms/${roomId}/players/${auth.currentUser.uid}`);
    try {
      await remove(myPlayerRef); // Firebase'den sil
    } catch (e) { console.log(e); }
    
    // 🚀 DÜZELTİLDİ: Yatay moddan dikey moda (Home) dönerken kilit açılır.
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    navigation.replace('Home'); 
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  useEffect(() => {
    const lockScreen = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    };
    lockScreen();

    // 🚀 EKLENDİ: Uygulama çökerse veya internet giderse beni odadan sil (Ghost Player Koruması)
    const myPlayerRef = ref(database, `rooms/${roomId}/players/${auth.currentUser?.uid}`);
    onDisconnect(myPlayerRef).remove(); 

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
        if (data.status === 'playing' && !hasNavigated.current) {
          hasNavigated.current = true;
          // 🚀 DÜZELTİLDİ: Timeout kısaltıldı. Senkronizasyon bozulmasın.
          setTimeout(() => {
             navigation.replace('RoomScreen', { roomId, myAvatarSeed, myName });
          }, 300); 
        }
      } else {
         // 🚀 EKLENDİ: Eğer oda silinmişse (Host iptal ettiyse) herkesi lobiye şutla
         if(!hasNavigated.current) {
             alert("Oda kurucusu oyunu iptal etti veya bağlantısı koptu.");
             handleLeaveRoom();
         }
      }
    });

    Animated.spring(popAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();

    return () => {
       unsubscribe();
       // 🚀 EKLENDİ: Sayfa değiştiğinde onDisconnect'i iptal et ki RoomScreen'de bizi oyundan atmasın.
       onDisconnect(myPlayerRef).cancel();
    }
  }, [roomId]);

  const PlayerSlot = ({ name, positionStyle, avatarAnimal, badgeColor, isPlayerReady, isHost }) => (
    <View style={[styles.playerSlot, positionStyle]}>
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: `https://api.dicebear.com/7.x/adventurer/png?seed=${avatarAnimal}&backgroundColor=ffffff` }} 
          style={[styles.avatar, { borderColor: isPlayerReady ?  "#FF00D6": badgeColor, backgroundColor: '#FFF' }]} 
        />
        {isHost && (
          <View style={{ position: 'absolute', top: -12, right: -5, backgroundColor: '#1A1A1A', borderRadius: 10, padding: 2 }}>
            <Ionicons name="ribbon" size={18} color="#FFD700" />
          </View>
        )}
        <View style={[styles.nameBadge, { backgroundColor: isPlayerReady ? "#FF00D6": badgeColor }]}>
          <Text style={styles.playerName}>{name}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <View style={styles.whiteBackground} />

      <TouchableOpacity 
        style={{ position: 'absolute', top: 20, left: 20, zIndex: 99, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}
        onPress={handleLeaveRoom}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      <View style={styles.hudWrapper}>
        <View style={[styles.hudContainer, { opacity: 0.5 }]}>
          <Ionicons name="flash" size={20} color="#FF00D6" style={styles.hudTitleIcon} />
          {[logoSwapHand, logoSwapCard, logoTimeFreeze].map((img, i) => (
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
          colors={['transparent', '#FF00D6', 'transparent']}
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

     {/* Alt Bilgi Barı - Premium Pill Tasarımı */}
      <View style={styles.bottomDeckWrapper}>
        <Animated.View style={{ transform: [{ scale: popAnim }, { scale: pulseAnim }] }}>
          {/* 🚀 DÜZELTİLDİ: Eğer Host bensem ve yeterince oyuncu varsa BAŞLAT butonu olmalı */}
          {players.find(p => p.id === auth.currentUser?.uid)?.isHost ? (
            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => {
                   // Host "Başlat" butonuna bastığında status değişir, herkes RoomScreen'e gider
                   if(players.length >= 2) { 
                      // 🚀 DÜZELTİLDİ: Firestore kodu silindi, yerine Realtime DB update fonksiyonu yazıldı
                      const roomRef = ref(database, `rooms/${roomId}`);
                      update(roomRef, { status: 'playing' });
                   } else {
                      alert("Oyuna başlamak için en az 2 kişi olmalı.");
                   }
                }}
             >
                <LinearGradient 
                  colors={['#FF00D6', '#FF86C8']} 
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ 
                    paddingHorizontal: 40, paddingVertical: 14, borderRadius: 30, 
                    flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#FFF',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, letterSpacing: 2 }}>OYUNU BAŞLAT</Text>
                </LinearGradient>
             </TouchableOpacity>
          ) : (
            <LinearGradient 
              colors={['rgba(255, 124, 42, 0.9)', 'rgba(247, 62, 216, 0.9)']} 
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ 
                paddingHorizontal: 35, paddingVertical: 12, borderRadius: 30, flexDirection: 'row', alignItems: 'center',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
              }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF', marginRight: 12 }} />
            <LinearGradient 
              colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.15)']} 
              style={{ 
                paddingHorizontal: 35, 
                paddingVertical: 12, 
                borderRadius: 30, 
                flexDirection: 'row', 
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
                minWidth: 280, // Genişliği sabitleyerek titremeyi önler
                justifyContent: 'center'
              }}
            >
              {/* 🚀 CANLI NOKTA: Yanıp sönen (pulse) animasyonlu nokta */}
              <Animated.View style={{ 
                width: 10, 
                height: 10, 
                borderRadius: 5, 
                backgroundColor: '#FF6F00', // Sarı/Altın rengi dikkati çeker
                marginRight: 15,
                opacity: pulseAnim, // Zaten tanımlı olan pulseAnim'i kullanıyoruz
                shadowColor: '#FF5709',
                shadowOpacity: 0.8,
                shadowRadius: 6,
                elevation: 5
              }} />

              <View style={{ flexDirection: 'column' }}>
                <Text style={{ 
                  color:  '#FFBF81', 
                  fontWeight: '900', 
                  fontSize: 13, 
                  letterSpacing: 1.5,
                  textShadowColor: 'rgba(0,0,0,0.3)',
                  textShadowRadius: 4
                }}>
                  HOST BEKLENİYOR
                </Text>
                <Text style={{ 
                  color: '#FFBF81', 
                  fontSize: 10, 
                  fontWeight: '700',
                  textAlign: 'center',
                  marginTop: 2
                }}>
                  OYUN BİRAZDAN BAŞLAYACAK
                </Text>
              </View>
            </LinearGradient>
            </LinearGradient>
          )}
        </Animated.View>
      </View>
    </View>
  );
}