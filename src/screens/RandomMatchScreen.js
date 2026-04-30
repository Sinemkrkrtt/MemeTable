import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated, useWindowDimensions, Easing, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { styles as roomStyles } from './RoomScreenStyles'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { ref, onValue, update, onDisconnect, remove } from 'firebase/database'; 
import { db, auth, database } from '../services/firebase';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';

export default function RandomMatchScreen({ navigation, route }) {
  const { width, height } = useWindowDimensions();
  const { myAvatarSeed, myName } = route?.params || { myAvatarSeed: 'Oliver', myName: 'Ben' };

  const [players, setPlayers] = useState([]);
  const [isSearching, setIsSearching] = useState(true);
  const [matchFound, setMatchFound] = useState(false);
  const [userStats, setUserStats] = useState({ coins: 0, diamonds: 0 });

  const cleanMyName = myName?.trim();
  const myPlayerId = auth.currentUser?.uid || `random_${Math.random().toString(36).substring(7)}`;

  const radarAnim = useRef(new Animated.Value(0)).current;
  const matchPopAnim = useRef(new Animated.Value(0)).current;
  const hasMatched = useRef(false);

  const playSound = async (type) => {
    try {
      const soundAsset = type === 'match' ? require('../../assets/sounds/ready.mp3') : require('../../assets/sounds/click.mp3');
      const { sound } = await Audio.Sound.createAsync(soundAsset);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => { if (status.didJustFinish) sound.unloadAsync(); });
    } catch (error) { console.log("Ses hatası:", error); }
  };

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    const user = auth.currentUser;
    let unsubscribeUser = () => {};
    if (user) {
      unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) setUserStats({ coins: docSnap.data().coins || 0, diamonds: docSnap.data().diamonds || 0 });
      });
    }
    
    return () => { 
      unsubscribeUser(); 
    };
  }, []);

  // 🚀 DÜZELTME: Animasyon artık pürüzsüz bir şekilde büyüyüp küçülecek (Nefes alma efekti)
  useEffect(() => {
    if (isSearching) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(radarAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(radarAnim, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      ).start();
    } else {
      radarAnim.stopAnimation();
    }
  }, [isSearching]);

  useEffect(() => {
    const poolRef = ref(database, 'matchmaking/waiting_pool');
    const myPlayerRef = ref(database, `matchmaking/waiting_pool/${myPlayerId}`);

    update(myPlayerRef, {
      id: myPlayerId,
      name: cleanMyName,
      avatar: myAvatarSeed,
      joinedAt: Date.now()
    });

    onDisconnect(myPlayerRef).remove();

    const unsubscribe = onValue(poolRef, (snapshot) => {
      if (hasMatched.current) return; 

      const data = snapshot.val();
      if (data) {
        const playersInPool = Object.values(data).sort((a, b) => a.joinedAt - b.joinedAt);
        setPlayers(playersInPool);

        if (playersInPool.length >= 2) {
          
          const matchedPlayers = playersInPool.slice(0, 2);
          const isMeMatched = matchedPlayers.some(p => p.id === myPlayerId);

          if (isMeMatched) {
            hasMatched.current = true; 
            setIsSearching(false);
            setMatchFound(true);
            playSound('match');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            Animated.spring(matchPopAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();

            const amIHost = matchedPlayers[0].id === myPlayerId;
            const newRoomId = `PUB_${matchedPlayers[0].id.substring(0, 6)}`;

            if (amIHost) {
              update(ref(database, `rooms/${newRoomId}`), {
                status: 'playing',
                round: 1,
                createdAt: Date.now()
              });
              matchedPlayers.forEach(p => remove(ref(database, `matchmaking/waiting_pool/${p.id}`)));
            }

            update(ref(database, `rooms/${newRoomId}/players/${myPlayerId}`), {
              id: myPlayerId,
              name: cleanMyName,
              avatar: myAvatarSeed,
              isHost: amIHost
            });

            setTimeout(() => {
              navigation.replace('RoomScreen', { 
                roomId: newRoomId, 
                myAvatarSeed, 
                myName: cleanMyName, 
                isHost: amIHost,
                myPlayerId: myPlayerId
              });
            }, 2500);
          }
        }
      }
    });

    return () => {
      unsubscribe();
      if (!hasMatched.current) { remove(myPlayerRef); }
    };
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleCancelSearch
    );

    return () => backHandler.remove();
  }, []);

const handleCancelSearch = () => {
    // 🚀 DÜZELTME: Eşleşme bulunduysa iptal etmeyi engelle!
    if (hasMatched.current) return true; 

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playSound('click');
    remove(ref(database, `matchmaking/waiting_pool/${myPlayerId}`)); 
    navigation.goBack();
    return true; // BackHandler için true dönmek zorundayız
  };

  let opponents = players.filter(p => p.id !== myPlayerId);
  while (opponents.length < 3) { opponents.push({ id: `searching_${opponents.length}`, name: 'Aranıyor...', avatar: 'empty', isSearching: true }); }
  const opponentPositions = [roomStyles.topPlayer, roomStyles.leftPlayer, roomStyles.rightPlayer];
  const opponentColors = ["#E5E7EB", "#E5E7EB", "#E5E7EB"];

  const PlayerSlot = ({ name, positionStyle, avatarAnimal, badgeColor, isSearchingSlot }) => (
    <View style={[roomStyles.playerSlot, positionStyle]}>
      <View style={roomStyles.avatarContainer}>
        {isSearchingSlot ? (
            <Animated.View style={[roomStyles.avatar, { borderColor: badgeColor, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', opacity: isSearching ? 0.6 : 1 }]}>
                <Ionicons name="search" size={28} color="#94A3B8" />
            </Animated.View>
        ) : (
          <Image 
            source={{ uri: `https://api.dicebear.com/7.x/adventurer/png?seed=${avatarAnimal}&backgroundColor=ffffff` }} 
            style={[roomStyles.avatar, { borderColor: badgeColor, backgroundColor: '#FFF' }]} 
            contentFit="cover"
            transition={200} // Oyuncu odaya girdiğinde yumuşakça belirmesi için
            cachePolicy="memory-disk" // Rakip oyuncuların avatarlarını hafızaya kazır
          />
        )}
        <View style={[roomStyles.nameBadge, { backgroundColor: badgeColor, shadowColor: badgeColor }]}>
           <Text style={[roomStyles.playerName, isSearchingSlot && { color: '#64748B' }]}>{name}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={roomStyles.container}>
      <StatusBar hidden />
      <View style={roomStyles.whiteBackground} />


      <View style={roomStyles.tableContainer}>
        <View style={roomStyles.mainTableRim}>
          <View style={roomStyles.tableSurface}>
           <Image 
              source={require('../../assets/roomTableLogo.png')} 
              style={roomStyles.roomTableLogo} 
              contentFit="contain" 
              priority="high" // Masa yüklendiğinde ilk bu çizilsin
              cachePolicy="memory" // Yerel dosya olduğu için RAM'de hazır tutulsun
              transition={500} // Odaya girerken logonun yumuşakça parlamasını sağlar
            />
            </View>

          <PlayerSlot name={cleanMyName} positionStyle={roomStyles.bottomPlayer} avatarAnimal={myAvatarSeed} badgeColor="#FCA9D7" />
          
          {opponents.map((opp, idx) => (
              <PlayerSlot key={opp.id || idx} name={opp.name} positionStyle={opponentPositions[idx % 3]} avatarAnimal={opp.avatar} badgeColor={opp.isSearching ? opponentColors[idx % 3] : ["#FDE58E", "#FBB0B2", "#FEC994"][idx % 3]} isSearchingSlot={opp.isSearching} />
          ))}

          <View style={roomStyles.centerArea}>
            {isSearching && (
              <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                
                {/* 🚀 DÜZELTME: Sadece Arama ikonu animasyona bağlandı */}
                <TouchableOpacity activeOpacity={0.7} onPress={handleCancelSearch} style={{ alignItems: 'center' }}>
                  <Animated.View style={[
                    styles.radarCenter,
                    {
                      transform: [{
                        scale: radarAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.25] // 1 normal, 1.25 büyümüş hali
                        })
                      }]
                    }
                  ]}>
                    <Ionicons name="search" size={32} color="#FF00D6" />
                  </Animated.View>
                  
                  <Text style={styles.searchingText}>RAKİPLER ARANIYOR...</Text>
                  
                  <View style={styles.cancelBadge}>
                    <Ionicons name="close" size={14} color="#FFF" />
                    <Text style={styles.cancelBadgeText}>İPTAL ET</Text>
                  </View>
                </TouchableOpacity>

              </View>
            )}

            {matchFound && (
              <Animated.View style={[roomStyles.premiumSituationCard, { justifyContent: 'center', alignItems: 'center', transform: [{ scale: matchPopAnim }] }]}>
                <LinearGradient colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={roomStyles.glossyHighlight} />
                <Ionicons name="game-controller" size={44} color="#FF00D6" style={{ marginBottom: 5 }} />
                <Text style={[roomStyles.premiumText, { color: '#FFFFFFF2', fontSize: 16, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 5 }]}>EŞLEŞME BULUNDU!</Text>
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', marginTop: 5, fontSize: 12 }}>Oyun Başlıyor...</Text>
              </Animated.View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  radarCenter: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 3, 
    borderColor: '#FF00D6', 
    elevation: 8, 
    shadowColor: '#FF00D6', 
    shadowOpacity: 0.6, 
    shadowRadius: 12, 
    shadowOffset: { width: 0, height: 4 } 
  },
  searchingText: { 
    marginTop: 16, 
    fontSize: 12, 
    fontWeight: '900', 
    color: '#FF00D6', 
    letterSpacing: 2, 
    textShadowColor: 'rgba(255, 0, 214, 0.3)', 
    textShadowRadius: 8 
  },
  cancelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FC5C18',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    marginTop: 15,
    shadowColor: '#FF4D00',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  cancelBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 4,
    letterSpacing: 1.5,
  }
});