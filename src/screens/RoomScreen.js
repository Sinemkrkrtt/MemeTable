import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons, Entypo } from '@expo/vector-icons';
import { OFFICIAL_MEMES } from '../memeData';
import { styles } from './RoomScreenStyles';
import ScoreScreen from './scoreScreen';
import JokerModal from './JokerModal';
import { doc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { db, auth, database } from '../services/firebase';
import { ref, onValue, update, onDisconnect, remove } from 'firebase/database'; 
import { SITUATION_PROMPTS } from './situationPrompts';
import DisconnectModal from './DisconnectModal'; 
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

const hashStr = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return h;
};

const mulberry32 = (a) => {
  return () => {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
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
      opacity: fadeAnim, transform: [{ translateY }], textShadowColor: '#00E5FF', textShadowRadius: 8
    }}>❄️</Animated.Text>
  );
};

export default function RoomScreen({ navigation, route }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { roomId, myAvatarSeed, myName, isHost } = route?.params || { roomId: null, myAvatarSeed: 'Oliver', myName: 'Ben', isHost: false };

  const [players, setPlayers] = useState([]); 
  const [myHand, setMyHand] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [phase, setPhase] = useState('READING'); 
  const [timeLeft, setTimeLeft] = useState(5); 
  const [stagedCard, setStagedCard] = useState(null); 
  const [playedCards, setPlayedCards] = useState([]); 
  const [hasPlayed, setHasPlayed] = useState(false); 
  const [votedCardId, setVotedCardId] = useState(null); 
  const [scores, setScores] = useState({}); 
  const [roundEnded, setRoundEnded] = useState(false); 
  const [winnerName, setWinnerName] = useState(""); 
  const [currentPrompt, setCurrentPrompt] = useState("Durum bekleniyor..."); 

  const [jokerInventory, setJokerInventory] = useState({ joker_skip: 0, joker_double: 0, joker_freeze: 0 }); 
  const [isJokerMenuVisible, setIsJokerMenuVisible] = useState(false);
  const [isTimeFrozen, setIsTimeFrozen] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const popAnim = useRef(new Animated.Value(0)).current; 
  const flipAnim = useRef(new Animated.Value(0)).current; 
  const announcementAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const timeLeftAnim = useRef(new Animated.Value(1)).current;

  const currentRoundRef = useRef(1);
  const initialHandDrawn = useRef(false);

  const cleanMyName = myName?.trim();
  const me = players.find(p => p.name?.trim() === cleanMyName);
  const amIHost = isHost || (players.length > 0 && players[0].name?.trim() === cleanMyName);

  const tickSoundRef = useRef(null); 
  const playTickSoundRef = useRef(null); 

  const highlightAnim = useRef(new Animated.Value(0)).current; 
  const [highlightedCardId, setHighlightedCardId] = useState(null); 

  const [userStats, setUserStats] = useState({ coins: 0, diamonds: 0 });
  const [isFullInventoryVisible, setIsFullInventoryVisible] = useState(false); 

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    async function loadTimerSounds() {
      try {
        const { sound: voteSound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/tick.mp3')
        );
        tickSoundRef.current = voteSound;

        const { sound: playSound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/play_tick.mp3') 
        );
        playTickSoundRef.current = playSound;
      } catch (e) {
        console.log("Süre sesleri yüklenemedi", e);
      }
    }
    loadTimerSounds();

    return () => {
      if (tickSoundRef.current) tickSoundRef.current.unloadAsync();
      if (playTickSoundRef.current) playTickSoundRef.current.unloadAsync();
    };
  }, []);

  const playSound = async (soundType) => {
    try {
      let soundAsset;
      switch (soundType) {
        case 'swoosh':
          soundAsset = require('../../assets/sounds/swoosh.mp3'); 
          break;
        case 'tick':
          soundAsset = require('../../assets/sounds/tick.mp3'); 
          break;
        case 'win':
          soundAsset = require('../../assets/sounds/win.mp3'); 
          break;
        case 'fail':
          soundAsset = require('../../assets/sounds/fail.mp3'); 
          break;
      case 'card_swap':
          soundAsset = require('../../assets/sounds/card_swap.mp3'); 
          break;
        case 'iced_magic':
          soundAsset = require('../../assets/sounds/iced_magic.mp3'); 
          break;
        default:
          return;
      }
     const { sound } = await Audio.Sound.createAsync(soundAsset);
      await sound.playAsync();
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) sound.unloadAsync();
      });
    } catch (error) {
      console.log(`Ses efekti (${soundType}) çalınamadı:`, error);
    }
  };

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true, 
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (e) {
        console.log("Ses ayarı yapılamadı:", e);
      }
    };
    setupAudio();
    
    let unsubscribeUser = () => {};
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      unsubscribeUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setJokerInventory({
            joker_skip: data.joker_skip || 0,
            joker_double: data.joker_double || 0,
            joker_freeze: data.joker_freeze || 0
          });
          setUserStats({
            coins: data.coins || 0,
            diamonds: data.diamonds || 0
          });
        }
      });
    }
    return () => unsubscribeUser();
  }, []);

  useEffect(() => {
    const connectedRef = ref(database, ".info/connected");
    
    const unsubscribeConnection = onValue(connectedRef, (snap) => {
      const isOnline = snap.val() === true;
      setIsConnected(isOnline);

      if (isOnline && roomId && me?.id) { 
        const myPlayerRef = ref(database, `rooms/${roomId}/players/${me.id}`);
        update(myPlayerRef, {
          name: cleanMyName,
          avatar: myAvatarSeed,
        }).catch(err => console.log("Yeniden bağlanma hatası:", err));

        onDisconnect(myPlayerRef).remove();
      }
    });

    return () => unsubscribeConnection();
  }, [roomId, cleanMyName, myAvatarSeed, me?.id]);

  const stateRefs = useRef({ hasPlayed, votedCardId, myHand, playedCards });
  useEffect(() => {
    stateRefs.current = { hasPlayed, votedCardId, myHand, playedCards };
  }, [hasPlayed, votedCardId, myHand, playedCards]);

  useEffect(() => {
    const lockScreen = async () => await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    lockScreen();
    
    if (roomId) {
      const playersRef = ref(database, `rooms/${roomId}/players`);
      const unsubscribePlayers = onValue(playersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const rawPlayers = Object.keys(data).map(key => ({ id: key, ...data[key] }));

          const uniquePlayers = [];
          const seenNames = new Set();
          rawPlayers.forEach(p => {
            const pName = p.name?.trim();
            if (!seenNames.has(pName)) {
              seenNames.add(pName);
              uniquePlayers.push(p);
            }
          });

          setPlayers(uniquePlayers);
          
          setScores(prevScores => {
            const newScores = { ...prevScores };
            uniquePlayers.forEach(p => { if (newScores[p.name] === undefined) newScores[p.name] = 0; });
            return newScores;
          });

          if (!initialHandDrawn.current) {
            const sortedPlayers = [...uniquePlayers].sort((a, b) => a.name.localeCompare(b.name));
            const myIdx = sortedPlayers.findIndex(p => p.name?.trim() === cleanMyName);
            
            if (myIdx !== -1) {
              const seed = hashStr(roomId || 'default');
              const rand = mulberry32(seed);
              const sharedDeck = [...OFFICIAL_MEMES].sort(() => rand() - 0.5);
              const startIdx = (myIdx * 5) % Math.max(1, sharedDeck.length - 5);
              setMyHand(sharedDeck.slice(startIdx, startIdx + 5));
              initialHandDrawn.current = true;
            }
          }
        }
      });

      const roomRef = ref(database, `rooms/${roomId}`);
     const unsubscribeRoom = onValue(roomRef, (snapshot) => {
        const roomData = snapshot.val();
        if (roomData) {
          setIsTimeFrozen(roomData.isGlobalFrozen || false);
          if (roomData.round && roomData.round > currentRoundRef.current) {
            currentRoundRef.current = roomData.round;
            startNextRound(); 
          }
          if (roomData.currentPrompt) {
            setCurrentPrompt(roomData.currentPrompt);
          } else {
            const randomPrompt = SITUATION_PROMPTS[Math.floor(Math.random() * SITUATION_PROMPTS.length)];
            update(ref(database, `rooms/${roomId}`), { currentPrompt: randomPrompt });
          }
        }
      });
      
      Animated.spring(popAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();

      return () => { unsubscribePlayers(); unsubscribeRoom(); ScreenOrientation.unlockAsync(); };
    }
  }, [roomId]);

  useEffect(() => {
    if (phase === 'PLAYING' && !isTimeFrozen) {
      Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true })).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [phase, isTimeFrozen]);

  useEffect(() => {
    let timer;
    
    const totalPhaseTime = phase === 'READING' ? 5 : (phase === 'PLAYING' ? 7 : 10);
    
    Animated.timing(timeLeftAnim, {
      toValue: timeLeft / totalPhaseTime,
      duration: 1000,
      useNativeDriver: false, 
    }).start();

    const activePhases = ['READING', 'PLAYING', 'VOTING'];

    if (timeLeft > 0 && activePhases.includes(phase) && !isTimeFrozen) { 
      
      if (phase === 'PLAYING' && timeLeft === 3 && tickSoundRef.current) {
        tickSoundRef.current.playFromPositionAsync(0);
      }

      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      
   } else if (timeLeft === 0 && activePhases.includes(phase)) {
      timeLeftAnim.setValue(1);
      
      if (tickSoundRef.current) {
        tickSoundRef.current.stopAsync();
      }
      
      if (phase === 'READING') {
        setPhase('PLAYING');
        setTimeLeft(7); 
      } 
      else if (phase === 'PLAYING') {
        if (!stateRefs.current.hasPlayed && stateRefs.current.myHand.length > 0) {
          const handNow = [...stateRefs.current.myHand]; 
          const randomIndex = Math.floor(Math.random() * handNow.length);
          const randomCard = handNow[randomIndex]; 
          
          handlePlayCard(randomCard.id); 
        }
        setPhase('WAITING_CARDS'); 
      }
      else if (phase === 'VOTING') {
        if (!stateRefs.current.votedCardId && stateRefs.current.playedCards.length > 0) {
          const opponentCards = stateRefs.current.playedCards.filter(c => !c.isMine);
          if (opponentCards.length > 0) {
            const randomOpponent = opponentCards[Math.floor(Math.random() * opponentCards.length)];
            handleVote(randomOpponent.id);
          }
        }
        setPhase('WAITING_VOTES'); 
      }
    }
    return () => clearTimeout(timer);
  }, [timeLeft, phase, isTimeFrozen]);


// 🚀 DÜZELTME: Kart Atma Aşamasında AFK Olanları Host Üzerinden Oynatma
  useEffect(() => {
    if (phase === 'WAITING_CARDS') {
      const actualPlayers = players.filter(p => p.name !== 'Bekleniyor...');
      const allPlayed = actualPlayers.length > 0 && actualPlayers.every(p => p.playedCard);
      
      if (allPlayed) {
        moveToVotingPhase();
      } else {
        const hostTimeout = setTimeout(() => {
          if (amIHost) {
            actualPlayers.forEach(p => {
              if (!p.playedCard) {
                // 🚀 DÜZELTME: Her defasında desteden yepyeni bir kart çek ve ID'sini benzersiz yap
                const randomMeme = OFFICIAL_MEMES[Math.floor(Math.random() * OFFICIAL_MEMES.length)];
                const autoCard = { ...randomMeme, id: Math.random().toString() };
                
                update(ref(database, `rooms/${roomId}/players/${p.id}`), { playedCard: autoCard });
              }
            });
          }
        }, 2500);

        const forceTimeout = setTimeout(() => {
          moveToVotingPhase();
        }, 4000);

        return () => {
          clearTimeout(hostTimeout);
          clearTimeout(forceTimeout);
        };
      }
    }
  }, [phase, players, amIHost, roomId]);

  // 🚀 DÜZELTME: Oylama Aşamasında AFK Olanları Host Üzerinden Oynatma
  // 🚀 DÜZELTME: Oylama Aşamasında Botların ve AFK Olanların Rastgele Oy Atması
  useEffect(() => {
    if (phase === 'WAITING_VOTES') {
      const actualPlayers = players.filter(p => p.name !== 'Bekleniyor...');
      const allVoted = actualPlayers.length > 0 && actualPlayers.every(p => p.votedFor);
      
      if (allVoted) {
        calculateResults();
      } else {
        // Eğer oylamayan (veya Bot olan) kaldıysa Host onlar adına tam rastgele oy atar.
        const hostTimeout = setTimeout(() => {
          if (amIHost) {
            actualPlayers.forEach(p => {
              if (!p.votedFor && stateRefs.current.playedCards.length > 0) {
                // Kendi kartı HARİÇ masadaki diğer tüm kartları bir havuza al
                const opponentCards = stateRefs.current.playedCards.filter(c => c.owner !== p.name);
                
                if (opponentCards.length > 0) {
                  // Masadaki kartları tamamen rastgele karıştır
                  const shuffledOpponents = [...opponentCards].sort(() => Math.random() - 0.5);
                  
                  // İlk sıradaki karta oy ver (Bot veya Gerçek Oyuncu fark etmeksizin)
                  const randomCard = shuffledOpponents[0];
                  update(ref(database, `rooms/${roomId}/players/${p.id}`), { votedFor: randomCard.id });
                }
              }
            });
          }
        }, 2500);

        const forceTimeout = setTimeout(() => {
          calculateResults();
        }, 4000);

        return () => {
          clearTimeout(hostTimeout);
          clearTimeout(forceTimeout);
        };
      }
    }
  }, [phase, players, amIHost, roomId]);

  useEffect(() => {
    const toggleOrientation = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch (error) {
        console.log("Oryantasyon kilitlenemedi:", error);
      }
    };

    toggleOrientation();

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    });

    return () => {
      unsubscribe();
      unsubscribeBlur();
    };
  }, [navigation]);

  const handleUseJoker = async (jokerId) => {
    if (jokerId === 'joker_skip' && !selectedCard) {
      alert("Önce değiştirmek istediğin kartı seç!");
      return; 
    }

    if (jokerInventory[jokerId] <= 0) return; 

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { [jokerId]: increment(-1) });
    }

    switch (jokerId) {
      case 'joker_skip':
        playSound('card_swap');
        const newCardId = Math.random().toString();
        const randomCard = OFFICIAL_MEMES[Math.floor(Math.random() * OFFICIAL_MEMES.length)];
        
        setMyHand(prev => prev.map(c => c.id === selectedCard ? {...randomCard, id: newCardId} : c));
        
        setHighlightedCardId(newCardId);
        triggerHighlight();
        setSelectedCard(null);
        break;

      case 'joker_double':
        playSound('card_swap');
        const currentHandSize = myHand.length;
        const newHand = [...OFFICIAL_MEMES]
          .sort(() => Math.random() - 0.5)
          .slice(0, currentHandSize)
          .map(c => ({ ...c, id: Math.random().toString() }));
        
        setMyHand(newHand);
        setHighlightedCardId('ALL');
        triggerHighlight();
        break;

     case 'joker_freeze':
        playSound('iced_magic');
        update(ref(database, `rooms/${roomId}`), { isGlobalFrozen: true });
        setTimeout(() => {
          update(ref(database, `rooms/${roomId}`), { isGlobalFrozen: false });
        }, 5000);
        break;
    }
    setIsJokerMenuVisible(false);
  };

  const triggerHighlight = () => {
    highlightAnim.setValue(0);
    Animated.sequence([
      Animated.timing(highlightAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
      Animated.timing(highlightAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
    ]).start(() => setHighlightedCardId(null));
  };

  const handlePlayCard = (autoCardId = null) => {
      const isEvent = autoCardId && typeof autoCardId === 'object' && autoCardId.nativeEvent;
      const explicitCardId = (!isEvent && autoCardId !== null && autoCardId !== undefined) ? autoCardId : null;
      const targetCardId = explicitCardId !== null ? explicitCardId : selectedCard;

      if (stateRefs.current.hasPlayed || !targetCardId) return; 

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      playSound('swoosh');

      if (tickSoundRef.current) {
        tickSoundRef.current.stopAsync();
      }

      const cardToPlay = stateRefs.current.myHand.find(c => c.id === targetCardId);
      if (!cardToPlay) return;
      
      setStagedCard(cardToPlay); 
      setMyHand(prev => prev.filter(c => c.id !== targetCardId)); 
      setSelectedCard(null);
      setHasPlayed(true); 
      setIsTimeFrozen(false); 

      if (me?.id) {
        update(ref(database, `rooms/${roomId}/players/${me.id}`), { playedCard: cardToPlay });
      }
    };

  const moveToVotingPhase = () => {
      const actualPlayers = players.filter(p => p.name !== 'Bekleniyor...' && p.playedCard);
      const tableCards = actualPlayers.map(p => ({
          ...p.playedCard,
          isMine: p.name?.trim() === cleanMyName,
          owner: p.name,
          id: p.playedCard.id + '_' + p.name 
      }));

      // 🚀 DÜZELTME: Kartları ID'ye göre sabit sıralamak yerine rastgele karıştırıyoruz!
      const shuffledCards = tableCards.sort(() => Math.random() - 0.5);

      setPlayedCards(shuffledCards);
      
      setPhase('VOTING');
      setTimeLeft(10);
      Animated.sequence([
        Animated.timing(announcementAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(announcementAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    };

  const handleVote = (cardId) => {
      if (stateRefs.current.votedCardId || phase !== 'VOTING') return; 
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setVotedCardId(cardId);
      if (me?.id) {
          update(ref(database, `rooms/${roomId}/players/${me.id}`), { votedFor: cardId });
      }
    };

  const calculateResults = () => {
      setPhase('ROUND_ENDED');
      const voteCounts = {};
      players.forEach(p => {
          if (p.votedFor) { voteCounts[p.votedFor] = (voteCounts[p.votedFor] || 0) + 1; }
      });

      if (Object.keys(voteCounts).length === 0 && stateRefs.current.playedCards.length > 0) {
          const sortedCards = [...stateRefs.current.playedCards].sort((a, b) => a.id.localeCompare(b.id));
          voteCounts[sortedCards[0].id] = 1;
      }

      const roundPoints = {};
      stateRefs.current.playedCards.forEach(card => {
          const votes = voteCounts[card.id] || 0;
          if (votes > 0) {
              roundPoints[card.owner] = (roundPoints[card.owner] || 0) + votes;
          }
      });

      setScores(prev => {
          const newScores = { ...prev };
          Object.keys(roundPoints).forEach(owner => {
              newScores[owner] = (newScores[owner] || 0) + roundPoints[owner];
          });
          return newScores;
      });

      let maxVotes = 0;
      let winners = [];
      Object.keys(roundPoints).forEach(owner => {
          if (roundPoints[owner] > maxVotes) {
              maxVotes = roundPoints[owner];
              winners = [owner];
          } else if (roundPoints[owner] === maxVotes && maxVotes > 0) {
              winners.push(owner);
          }
      });

      let bannerText = "HESAPLANIYOR...";
      let isMeWinner = false;

      if (winners.length === 1) {
          if (winners[0]?.trim() === cleanMyName) {
              bannerText = "RAUNDU KAZANDIN!";
              isMeWinner = true;
          } else {
              bannerText = `${winners[0].toUpperCase()} KAZANDI!`;
          }
      } else if (winners.length > 1) {
          if (winners.includes(cleanMyName)) {
              bannerText = "BERABERE! (SEN DE KAZANDIN)";
              isMeWinner = true;
          } else {
              bannerText = "RAUND BERABERE!"; 
          }
      }

      setWinnerName(bannerText);

      // 🚀 DÜZELTME 1: Raundu kazanana sadece ses çal, kalp verme.
      if (isMeWinner) {
        playSound('win');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        playSound('fail');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      setRoundEnded(true);

      Animated.spring(announcementAnim, { toValue: 1, useNativeDriver: true }).start();

      // 🚀 DÜZELTME 2: Oyun Bitti mi kontrolü (Eldeki kartlar bittiyse oyun bitmiştir)
      const isGameOver = stateRefs.current.myHand.length === 0;

      if (isGameOver) {
        // Oyun bittiyse, genel toplam skorları hesapla
        const finalScores = { ...scores };
        Object.keys(roundPoints).forEach(owner => {
          finalScores[owner] = (finalScores[owner] || 0) + roundPoints[owner];
        });

        // Masadaki en yüksek toplam puanı bul
        let gameMaxScore = 0;
        let gameWinners = [];
        Object.keys(finalScores).forEach(owner => {
          if (finalScores[owner] > gameMaxScore) {
            gameMaxScore = finalScores[owner];
            gameWinners = [owner];
          } else if (finalScores[owner] === gameMaxScore && gameMaxScore > 0) {
            gameWinners.push(owner);
          }
        });

        // 🏆 Eğer TÜM OYUNU genel skorda SEN KAZANDIYSAN Kalp Ver!
        if (gameWinners.includes(cleanMyName)) {
          const user = auth.currentUser;
          if (user) {
            const userRef = doc(db, 'users', user.uid);
            updateDoc(userRef, {
              wonHearts: increment(1)
            }).catch(e => console.log("Veri güncellenirken hata:", e));
          }
        }
      } else {
        // Oyun bitmediyse, raund bittikten 4 saniye sonra yeni el başlar
        setTimeout(() => {
          if (amIHost) {
            handleHostNewRound();
          }
        }, 4000); 
      }
    };

  const handleHostNewRound = () => {
    if (amIHost && roomId) {
      const nextRound = currentRoundRef.current + 1;
      const randomPrompt = SITUATION_PROMPTS[Math.floor(Math.random() * SITUATION_PROMPTS.length)];
      
      // 🚀 DÜZELTME: Yeni raunt başlarken Host herkesin masasını ve oylarını tertemiz yapar
      const updates = { 
        round: nextRound,
        currentPrompt: randomPrompt 
      };

      players.forEach(p => {
        if (p.id) {
          updates[`players/${p.id}/playedCard`] = null;
          updates[`players/${p.id}/votedFor`] = null;
        }
      });

      update(ref(database, `rooms/${roomId}`), updates);
    }
  };
  const startNextRound = () => {
      if (me?.id) { 
        update(ref(database, `rooms/${roomId}/players/${me.id}`), { playedCard: null, votedFor: null }); 
      }
      
      if (stateRefs.current.myHand.length === 0) {
        setScores(prevScores => {
          const resetScores = {};
          Object.keys(prevScores).forEach(name => {
            resetScores[name] = 0;
          });
          return resetScores;
        });

        const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));
        const myIdx = sortedPlayers.findIndex(p => p.name?.trim() === cleanMyName);
        const safeIdx = myIdx !== -1 ? myIdx : 0;
        
        const seed = hashStr(roomId || 'default') + currentRoundRef.current;
        const rand = mulberry32(seed);
        const sharedDeck = [...OFFICIAL_MEMES].sort(() => rand() - 0.5);
        
        const startIdx = (safeIdx * 5) % Math.max(1, sharedDeck.length - 5);
        setMyHand(sharedDeck.slice(startIdx, startIdx + 5));
      }
      
     setHasPlayed(false);
      setStagedCard(null);
      setPlayedCards([]);
      setVotedCardId(null);
      setRoundEnded(false);
      setWinnerName("");
      setPhase('READING');
      setTimeLeft(5);
      
      stateRefs.current.hasPlayed = false;
      stateRefs.current.votedCardId = null;
      stateRefs.current.playedCards = [];
      
      announcementAnim.setValue(0); popAnim.setValue(0); flipAnim.setValue(0);
      Animated.spring(popAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();
    };

  const PlayerSlot = ({ name, positionStyle, avatarAnimal, badgeColor }) => (
    <View style={[styles.playerSlot, positionStyle]}>
      <View style={styles.avatarContainer}>
        {name.includes('Bekleniyor') ? (
            <View style={[styles.avatar, { borderColor: badgeColor, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person-outline" size={30} color="#9CA3AF" />
            </View>
        ) : (
          <Image 
          source={{ uri: `https://api.dicebear.com/7.x/adventurer/png?seed=${avatarAnimal}&backgroundColor=ffffff` }} 
          style={[styles.avatar, { borderColor: badgeColor, backgroundColor: '#FFF' }]} 
          contentFit="cover"
          transition={250} 
          cachePolicy="memory-disk" 
        />
        )}
        <View style={[styles.nameBadge, { backgroundColor: badgeColor }]}><Text style={styles.playerName}>{name}</Text></View>
      </View>
    </View>
  );

  const cardScale = flipAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }); 
  const cardRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }); 

  let opponents = players.filter(p => p.name?.trim() !== cleanMyName);
  while (opponents.length < 3) {
    opponents.push({ id: `empty_${opponents.length}`, name: 'Bekleniyor...', avatar: 'empty' });
  }

  const opponentPositions = [styles.topPlayer, styles.leftPlayer, styles.rightPlayer];
  const opponentColors = ["#E5E7EB", "#E5E7EB", "#E5E7EB"];

  const toggleSound = async () => {
    try {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      
      await Audio.setIsEnabledAsync(!newMutedState);
      
      if (newMutedState) {
        if (tickSoundRef.current) await tickSoundRef.current.setVolumeAsync(0);
        if (playTickSoundRef.current) await playTickSoundRef.current.setVolumeAsync(0);
      } else {
        if (tickSoundRef.current) await tickSoundRef.current.setVolumeAsync(1);
        if (playTickSoundRef.current) await playTickSoundRef.current.setVolumeAsync(1);
      }
    } catch (error) {
      console.log("Ses durumu değiştirilirken hata oluştu:", error);
    }
  };

  return (
      <View style={styles.container}>
        <StatusBar hidden />
        <View style={styles.whiteBackground} />
        <JokerModal 
          visible={isFullInventoryVisible} 
          onClose={() => setIsFullInventoryVisible(false)} 
          onUseJoker={(id) => {
            handleUseJoker(id);
            setIsFullInventoryVisible(false); 
          }}
          inventory={jokerInventory}
          selectedCard={selectedCard}
        />

        {isJokerMenuVisible && (
          <TouchableOpacity 
            activeOpacity={1}
            style={[StyleSheet.absoluteFillObject, { zIndex: 998 }]}
            onPress={() => setIsJokerMenuVisible(false)}
          />
        )}

            <View style={[
              styles.topBarContainer, 
              { 
                zIndex: 50, 
                marginLeft: Math.max(insets.left, 15) 
              }
            ]}>
          <LinearGradient 
            colors={['rgba(255,255,255,0.95)', 'rgba(245,245,250,0.9)']} 
            style={[styles.homeStylePill, { paddingHorizontal: 16, paddingVertical: 8 }]}
          >
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => {
                playSound('click');
                if (me?.id) {
                  remove(ref(database, `rooms/${roomId}/players/${me.id}`));
                }
                navigation.replace('Home');
              }}
            >
           <View style={{ transform: [{ scaleX: -1 }] }}>
            <Ionicons 
              name="exit-outline" 
              size={22} 
              color="#FF4D00" 
              style={{ 
                textShadowColor: 'rgba(255, 59, 48, 0.5)', 
                textShadowRadius: 8
                // transform komutunu buradan sildik ve yukarıdaki View'a taşıdık
              }} 
            />
          </View>
            </TouchableOpacity>

            <View style={[styles.verticalDivider, { marginHorizontal: 12 }]} />

           <TouchableOpacity activeOpacity={0.7} onPress={toggleSound}>
                <Ionicons 
                  name={isMuted ? "volume-mute" : "volume-high"} 
                  size={22} 
                  color={isMuted ? "#FF0404E8" : "#FFD500E8"} 
                />
              </TouchableOpacity>

            <View style={[styles.verticalDivider, { marginHorizontal: 12 }]} />

            <TouchableOpacity activeOpacity={0.7} onPress={() => setIsFullInventoryVisible(true)}>
               <Ionicons name="cart" size={22} color='#FF00D6' style={{ textShadowColor: 'rgba(0, 229, 255, 0.5)', textShadowRadius: 8 }} />
            </TouchableOpacity>
          </LinearGradient>
        </View>

       <View style={[
    styles.hudWrapper, 
    { paddingRight: Math.max(insets.right, 10) } 
  ]}>
          <View style={styles.hudContainer}>
            
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsJokerMenuVisible(!isJokerMenuVisible);
              }}
              style={{ marginBottom: isJokerMenuVisible ? 10 : 0 }} 
            >
               <Ionicons 
                 name={isJokerMenuVisible ? "close-circle" : "flash"} 
                 size={30} 
                 color="#FF00D6" 
                 style={styles.hudTitleIcon} 
               />
            </TouchableOpacity>

            {isJokerMenuVisible && (
              <View style={{ alignItems: 'center' }}>
                
                {[
                  { id: 'joker_skip', logo: require('../../assets/joker1.png'), color: '#FF69EB' },
                  { id: 'joker_double', logo: require('../../assets/joker2.png'), color: '#FF8A00' },
                  { id: 'joker_freeze', logo: require('../../assets/joker3.png'), color: '#00E5FF' }
                ].map((joker, index) => { 
                  const currentCount = jokerInventory[joker.id] || 0; 
                  const isDepleted = currentCount <= 0;
                  return (
                    <View key={joker.id || index} style={[styles.jokerIconWrapper, { marginVertical: 5 }]}> 
                      <TouchableOpacity 
                        activeOpacity={0.7} 
                        disabled={isDepleted} 
                        onPress={() => {
                          handleUseJoker(joker.id);
                        }} 
                        style={[styles.jokerButton, { shadowColor: joker.color, opacity: isDepleted ? 0.3 : 1 }]}
                      >
                      <Image 
                        source={joker.logo} 
                        style={styles.jokerLogo} 
                        contentFit="contain" 
                        transition={200} 
                        priority="high" 
                        cachePolicy="memory" 
                      />
                        {!isDepleted && (
                          <View style={[styles.jokerBadge, { backgroundColor: joker.color }]}>
                            <Text style={styles.jokerBadgeText}>{currentCount}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
        
        <Animated.View pointerEvents="none" style={[styles.announcementBanner, { transform: [{ translateX: announcementAnim.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) }] }]}>
          <LinearGradient colors={['transparent', roundEnded ? '#FF4D00' : '#FF00D6', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bannerGradient}>
            <Text 
              style={[styles.announcementText, roundEnded && styles.announcementTextWinner]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {roundEnded ? winnerName : "EN İYİ MEME'İ SEÇ!"}
            </Text>
          </LinearGradient>
        </Animated.View>

        <View style={styles.tableContainer}>
          <View style={styles.mainTableRim}>
            <View style={styles.tableSurface}
            >
             <Image 
              source={require('../../assets/roomTableLogo.png')} 
              style={styles.roomTableLogo} 
              contentFit="contain" 
              priority="high" 
              cachePolicy="memory" 
              transition={500} 
            />
            </View>

            <PlayerSlot 
              name={`${me?.name || myName}: ${scores[me?.name || myName] || 0}`} 
              positionStyle={styles.bottomPlayer} 
              avatarAnimal={me?.avatar || myAvatarSeed} 
              badgeColor="#FCA9D7" 
            />
            
            {opponents.slice(0, 3).map((opp, idx) => (
            <PlayerSlot 
              key={opp.id || idx} 
              name={opp.name === 'Bekleniyor...' ? opp.name : `${opp.name}: ${scores[opp.name] || 0}`} 
              positionStyle={opponentPositions[idx % 3]} 
              avatarAnimal={opp.avatar} 
              badgeColor={opp.name === 'Bekleniyor...' ? opponentColors[idx % 3] : ["#FDE58E", "#FBB0B2", "#FEC994"][idx % 3]} 
            />
        ))}

            <View style={styles.centerArea}>
              {phase === 'READING' && (
                <Animated.View style={[styles.situationCardWrapper, { transform: [{ scale: popAnim }, { scale: cardScale }, { rotateY: cardRotate }] }]}>
                  <View style={styles.premiumSituationCard}>
                    <LinearGradient colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']} style={styles.glossyHighlight} />
                    <View style={styles.cardInnerContent}>
                      <View style={styles.premiumHeaderCentered}>
                        <View style={styles.moodBadge}>
                          <Text style={[styles.moodLetter, { color: '#FF69EB' }]}>M</Text>
                          <Text style={[styles.moodLetter, { color: '#FF86C8' }]}>O</Text>
                          <Text style={[styles.moodLetter, { color: '#FF8001' }]}>O</Text>
                          <Text style={[styles.moodLetter, { color: '#F53BDC' }]}>D</Text>
                        </View>
                      </View>
                      <View style={styles.premiumDivider} />
                      <Text style={styles.premiumText}>{currentPrompt}</Text>
                    </View>
                  </View>
                </Animated.View>
              )}

              {(phase === 'PLAYING' || phase === 'WAITING_CARDS') && (
                <View style={styles.proTimerContainer}>
                  <View style={[styles.staticRing, isTimeFrozen && styles.staticRingFrozen]} />
                  <Animated.View style={[
                    styles.timerRing, 
                    isTimeFrozen ? styles.timerRingFrozen : (timeLeft <= 3 && phase !== 'WAITING_CARDS' ? styles.timerRingDanger : styles.timerRingNormal),
                    { transform: [{ rotate: rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }
                  ]} />
                  {isTimeFrozen && (
                    <View style={styles.snowOverlay} pointerEvents="none">
                       <Snowflake delay={0} left="25%" size={14} />
                       <Snowflake delay={600} left="55%" size={10} />
                    </View>
                  )}
                  <View style={[styles.modernTimerContent, isTimeFrozen && styles.modernTimerContentFrozen]}>
                     <Text style={[
                       styles.proTimerText, 
                       timeLeft <= 3 && !isTimeFrozen && phase !== 'WAITING_CARDS' && styles.proTimerTextDanger,
                       isTimeFrozen && styles.proTimerTextFrozen
                     ]}>{phase === 'WAITING_CARDS' ? '...' : timeLeft}</Text>
                  </View>
                </View>
              )}

              {(phase === 'VOTING' || phase === 'WAITING_VOTES' || phase === 'ROUND_ENDED') && playedCards.length > 0 && (
                <View style={styles.votingAreaPro}>
                  {!roundEnded && (
                    <View style={styles.proProgressBarContainer}>
                      <Animated.View style={[
                        styles.proProgressBar, 
                        { 
                          width: timeLeftAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                          backgroundColor: timeLeftAnim.interpolate({ inputRange: [0, 0.2, 0.5, 1], outputRange: ['#FF3B30', '#FF9500', '#FFDC5E', '#FF69EB'] })
                        }
                      ]} />
                    </View>
                  )}
                  <View style={styles.votingRowPro}>
                    {playedCards.map((card, index) => { 
                      const isVoted = votedCardId === card.id;
                      return (
                        <TouchableOpacity 
                          key={card.id || `played_${index}`} 
                          style={[styles.voteCardWrapper, isVoted && styles.votedCardStyle, card.isMine && styles.disabledVoteCard]} 
                          disabled={card.isMine || votedCardId !== null || phase === 'WAITING_VOTES' || phase === 'ROUND_ENDED'} onPress={() => handleVote(card.id)} activeOpacity={0.8}
                        >
                         <Image 
                            source={{ uri: card.url }} 
                            style={styles.memeImage} 
                            contentFit="cover" 
                            transition={400} 
                            priority="high" 
                            cachePolicy="memory-disk" 
                            placeholder={require('../../assets/placeholderAvatar.png')} 
                        />
                          {card.isMine && (
                            <View style={styles.myCardOverlay}>
                              <Ionicons name="lock-closed" size={16} color="white" />
                              <Text style={styles.myCardText}>SENİN</Text>
                            </View>
                          )}
                          {isVoted && (
                            <View style={styles.votedBadge}>
                              <Ionicons name="heart" size={20} color="#FF00D6" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.bottomDeckWrapper}>
          {!hasPlayed && (phase === 'READING' || phase === 'PLAYING') && (
            <View style={[styles.handContainer, { width: width }]}>
              {myHand.map((item, index) => { 
                const rotation = (index - Math.floor(myHand.length / 2)) * 10; 
                const isSelected = selectedCard === item.id;

                const isThisCardHighlighted = highlightedCardId === item.id || highlightedCardId === 'ALL';
                const borderGlow = highlightAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(255, 255, 255, 0)', 'rgba(0, 229, 255, 1)']
                });
                return (
                  <TouchableOpacity 
                    key={item.id || `hand_${index}`} 
                    activeOpacity={1} 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCard(isSelected ? null : item.id);
                    }} 
                    style={[
                      styles.deckCard, 
                      { transform: [{ rotate: `${rotation}deg` }, { translateY: isSelected ? -30 : 0 }, { scale: isSelected ? 1.1 : 1 }], 
                        zIndex: isSelected ? 100 : index, 
                        left: (width / 2) - 55 + (index - Math.floor(myHand.length / 2)) * 50 }
                    ]}
                  >
                   <Animated.View style={[
                        styles.deckCardInner, 
                        isThisCardHighlighted && {
                          shadowColor: '#00E5FF',
                          shadowOpacity: highlightAnim,
                          shadowRadius: 15,
                          borderColor: borderGlow,
                          borderWidth: 2
                        }
                                        ]}>
                      <Image 
                          source={{ uri: item.url }} 
                          style={styles.memeImage} 
                          contentFit="cover" 
                          transition={400} 
                          priority="high" 
                          cachePolicy="memory-disk" 
                      />
      </Animated.View>
                    {isSelected && <View style={styles.selectedBorder} />}
                    {isSelected && (
                      <TouchableOpacity style={styles.playButton} onPress={() => handlePlayCard()} activeOpacity={0.8}>
                        <LinearGradient colors={['#FFA167', '#F73ED8']} style={styles.playButtonGradient}>
                          <Text style={styles.playButtonText}>AT</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {roundEnded && myHand.length === 0 && (
          <ScoreScreen 
            scores={scores} 
            navigation={navigation} 
            onNewGame={amIHost ? handleHostNewRound : () => {}} 
          />
        )}
        
        <DisconnectModal 
          visible={!isConnected} 
          onQuit={() => { 
            navigation.replace('Home'); 
          }}
        />
      </View>
    );
}