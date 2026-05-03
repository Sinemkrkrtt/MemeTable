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
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Image } from 'expo-image';

const BOT_NAMES = [
  // Gerçekçi Türk İsimleri & Nickler
  "Alex", "Zeynep", "Cansu", "Burak", "Efe_TR", "Kaan", "Aslıhan", "Mertcan", "Ceren", 
  "Emirhan", "Selin_99", "Berkay", "Elif Su", "Kerem", "Deniz", "Tolga", "Aylin", "Onur",
  "Yasin", "Zehra", "Eren_K", "Buse", "Arda", "Can", "Umut_06", "Melis", "Pelin",
  "FB_Taha", "Kadikoylu", "Alex_10", "Fenerli_07", "Cengo", "Ece", "Ruzgar",

  //Gamer & Troll Nickleri
  "MemeLord", "Shadow", "IronMan_99", "DogeFan", "xX_Slayer_Xx", "NoobMaster", "ProGamer",
  "KediKız", "ToxicBoy", "Afk_Always", "Ping999", "L33t", "Gigachad", "CringeLord", 
  "Sneaky", "DarkKnight", "TrollFace", "DankMeme", "PepeTheFrog", "Skibidi", "BigChungus",
  "Ghost", "Ninja", "Headshot_Kralı", "YalnızKurt", "GeceGölgesi", "CayTiryakisi",
  "Panda", "RoflCopter", "CasualGamer", "TryHard", "BotDeğilim", "GerçekBiri", "Simülasyon",

  // Global İsimler
  "John", "Sarah", "Emily", "Mike", "Chris_88", "Sam", "Jessica", "David", "Emma",
  "Oliver", "Sophia", "Lucas", "Mia", "Arthur", "Chloe", "Noah", "Grace", "Liam"
];

const BOT_AVATARS = [
  "Felix", "Bella", "Max", "Luna", "Charlie", "Lucy", "Cooper", "Daisy", "Rocky",
  "Leo", "Mia", "Nolan", "Oliver", "Penny", "Quinn", "Ruby", "Sam", "Toby", "Uma",
  "Victor", "Wendy", "Xander", "Yara", "Zane", "Apollo", "Athena", "Bandit", "Bear",
  "Boomer", "Buster", "Cleo", "Coco", "Duke", "Finn", "Gigi", "Gizmo", "Harley",
  "Hazel", "Hunter", "Jack", "Jasper", "Kobe", "Loki", "Lucky", "Mac", "Milo", "Moose",
  "Nala", "Ollie", "Oscar", "Peanut", "Pepper", "Piper", "Riley", "Romeo", "Rosie",
  "Roxy", "Sadie", "Sammy", "Scout", "Shadow", "Simba", "Sparky", "Stella", "Tank",
  "Teddy", "Thor", "Tilly", "Tucker", "Winston", "Zeus", "Zoe", "Aria", "Ezra",
  "Nova", "Maya", "Otis", "Arlo", "Hugo", "Ivy", "Gus", "Zelda", "Blue", "Ziggy",
  "Marlowe", "Rocco", "Xena", "Kai", "Juno", "Pip", "Lulu", "Rex"
];

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
  
  const searchTimeoutRef = useRef(null);
  const poolDataRef = useRef(null);

  const matchSound = useAudioPlayer(require('../../assets/sounds/ready.mp3'));
  const clickSound = useAudioPlayer(require('../../assets/sounds/click.mp3'));

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true });
      } catch (e) {
        console.log("Ses ayarı yapılamadı:", e);
      }
    };
    setupAudio();
  }, []);

  const playSound = (type) => {
    try {
      if (type === 'match') {
        matchSound.seekTo(0);
        matchSound.play();
      } else {
        clickSound.seekTo(0);
        clickSound.play();
      }
    } catch (error) { 
      console.log("Ses hatası:", error); 
    }
  };

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    // ...
    const user = auth.currentUser;
    let unsubscribeUser = () => {};
    if (user) {
      unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) setUserStats({ coins: docSnap.data().coins || 0, diamonds: docSnap.data().diamonds || 0 });
      });
    }
    return () => unsubscribeUser(); 
  }, []);

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

  const handleMatchmaking = (data, isTimeUp) => {
    if (hasMatched.current || !data) return;
    const myData = data[myPlayerId];
    if (myData && myData.matchedRoom) {
      hasMatched.current = true;
      clearTimeout(searchTimeoutRef.current);
      setIsSearching(false);
      setMatchFound(true);
      playSound('match');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.spring(matchPopAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();

      update(ref(database, `rooms/${myData.matchedRoom}/players/${myPlayerId}`), {
        id: myPlayerId,
        name: cleanMyName,
        avatar: myAvatarSeed,
        isHost: false
      });

      remove(ref(database, `matchmaking/waiting_pool/${myPlayerId}`));

      setTimeout(() => {
        navigation.replace('RoomScreen', { 
          roomId: myData.matchedRoom, 
          myAvatarSeed, 
          myName: cleanMyName, 
          isHost: false,
          myPlayerId: myPlayerId
        });
      }, 2500);
      return;
    }

    const playersInPool = Object.values(data)
      .filter(p => !p.matchedRoom) 
      .sort((a, b) => a.joinedAt - b.joinedAt);
    if (playersInPool.length >= 4 || (isTimeUp && playersInPool.length > 0)) {
      const matchedPlayers = playersInPool.slice(0, 4);
      const isMeMatched = matchedPlayers.some(p => p.id === myPlayerId);

      if (isMeMatched) {
        const amIHost = matchedPlayers[0].id === myPlayerId;
        
        if (amIHost) {
          hasMatched.current = true;
          clearTimeout(searchTimeoutRef.current);
          setIsSearching(false);
          setMatchFound(true);
          playSound('match');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.spring(matchPopAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();
          const newRoomId = `PUB_${Date.now().toString().slice(-5)}_${Math.random().toString(36).substring(2, 6)}`;

          update(ref(database, `rooms/${newRoomId}`), {
            status: 'playing',
            round: 1,
            createdAt: Date.now()
          });
          matchedPlayers.forEach(p => {
            if (p.id === myPlayerId) {
              remove(ref(database, `matchmaking/waiting_pool/${p.id}`));
            } else {
              update(ref(database, `matchmaking/waiting_pool/${p.id}`), { matchedRoom: newRoomId });
            }
          });
          const botsNeeded = 4 - matchedPlayers.length;
          const usedIndices = [];
          for (let i = 0; i < botsNeeded; i++) {
            let randIdx;
            do { randIdx = Math.floor(Math.random() * BOT_NAMES.length); } while (usedIndices.includes(randIdx));
            usedIndices.push(randIdx);

            const botId = `bot_${Math.random().toString(36).substring(7)}`;
            update(ref(database, `rooms/${newRoomId}/players/${botId}`), {
              id: botId,
              name: BOT_NAMES[randIdx],
              avatar: BOT_AVATARS[randIdx],
              isHost: false,
              isBot: true
            });
          }

          update(ref(database, `rooms/${newRoomId}/players/${myPlayerId}`), {
            id: myPlayerId,
            name: cleanMyName,
            avatar: myAvatarSeed,
            isHost: true
          });

          setTimeout(() => {
            navigation.replace('RoomScreen', { 
              roomId: newRoomId, 
              myAvatarSeed, 
              myName: cleanMyName, 
              isHost: true,
              myPlayerId: myPlayerId
            });
          }, 2500);
        }
      }
    }
  };

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

    searchTimeoutRef.current = setTimeout(() => {
      if (!hasMatched.current && poolDataRef.current) {
        handleMatchmaking(poolDataRef.current, true);
      }
    }, 1000); // 30 Saniye

    const unsubscribe = onValue(poolRef, (snapshot) => {
      poolDataRef.current = snapshot.val();
      handleMatchmaking(poolDataRef.current, false);

      if (poolDataRef.current) {
        const playersInPool = Object.values(poolDataRef.current)
          .filter(p => !p.matchedRoom) 
          .sort((a, b) => a.joinedAt - b.joinedAt);
        setPlayers(playersInPool);
      } else {
        setPlayers([]);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(searchTimeoutRef.current);
      if (!hasMatched.current) { remove(myPlayerRef); }
    };
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleCancelSearch);
    return () => backHandler.remove();
  }, []);

  const handleCancelSearch = () => {
    if (hasMatched.current) return true; 

    clearTimeout(searchTimeoutRef.current); 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playSound('click');
    remove(ref(database, `matchmaking/waiting_pool/${myPlayerId}`)); 
    navigation.goBack();
    return true; 
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
            transition={200}
            cachePolicy="memory-disk"
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
              priority="high" 
              cachePolicy="memory" 
              transition={500} 
            />
            </View>

          <PlayerSlot name={cleanMyName} positionStyle={roomStyles.bottomPlayer} avatarAnimal={myAvatarSeed} badgeColor="#FCA9D7" />
        {opponents.slice(0, 3).map((opp, idx) => (
            <PlayerSlot 
                key={opp.id || idx} 
                name={opp.name} 
                positionStyle={opponentPositions[idx % 3]} 
                avatarAnimal={opp.avatar} 
                badgeColor={opp.isSearching ? opponentColors[idx % 3] : ["#FDE58E", "#FBB0B2", "#FEC994"][idx % 3]} 
                isSearchingSlot={opp.isSearching} 
            />
        ))}

          <View style={roomStyles.centerArea}>
            {isSearching && (
              <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                
                <TouchableOpacity activeOpacity={0.7} onPress={handleCancelSearch} style={{ alignItems: 'center' }}>
                  <Animated.View style={[
                    styles.radarCenter,
                    {
                      transform: [{
                        scale: radarAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.25] 
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
              <Animated.View style={[styles.seniorMatchCard, { transform: [{ scale: matchPopAnim }] }]}>
            <LinearGradient 
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(253, 240, 250, 0.95)']} 
              start={{x: 0, y: 0}} 
              end={{x: 1, y: 1}} 
              style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} 
            />
            
            <View style={styles.neonBorder} />

            {/* İkon Konteyneri */}
            <View style={styles.matchIconWrapper}>
              <LinearGradient 
                colors={['#FF00D6', '#FF8A00']} 
                start={{x: 0, y: 0}} 
                end={{x: 1, y: 1}} 
                style={StyleSheet.absoluteFillObject} 
              />
              <Ionicons name="game-controller" size={34} color="#FFF" />
            </View>
            <Text style={styles.matchTitle}>EŞLEŞME BULUNDU!</Text>
            <Text style={styles.matchSubtitle}>Rakipler masaya oturuyor...</Text>
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
  },
 seniorMatchCard: {
    width: 270,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF00D6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35, 
    shadowRadius: 25,
    elevation: 22,
  },
  neonBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: '#FF00D6',
    opacity: 0.8,
  },
  matchIconWrapper: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#FF8A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  matchTitle: {
    fontSize: 19,
    fontWeight: '900',
    color:  '#FF4D00',
    letterSpacing: 1.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  matchSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B', 
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});