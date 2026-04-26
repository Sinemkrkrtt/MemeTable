import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, Animated, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { OFFICIAL_MEMES } from '../memeData';
import { styles } from './RoomScreenStyles';
import ScoreScreen from './scoreScreen';
import JokerModal from './JokerModal'; 
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth, database } from '../services/firebase'; 
import { ref, onValue } from 'firebase/database'; 

// ❄️ KAR TANESİ ANİMASYON BİLEŞENİ
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

  const translateY = fallAnim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: [-20, 80] 
  });

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

export default function RoomScreen({ navigation, route }) {
  const { width, height } = useWindowDimensions();
  
  // 🎯 LOBİDEN GELEN GERÇEK VERİLER
  const { roomId, myAvatarSeed, myName } = route?.params || { roomId: null, myAvatarSeed: 'Oliver', myName: 'Ben' };

  // --- STATE'LER ---
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
  const [isJokerMenuVisible, setIsJokerMenuVisible] = useState(false);
  
  // --- JOKER STATE'LERİ ---
  const [jokerInventory, setJokerInventory] = useState({ joker1: 2, joker2: 5, joker3: 1, joker4: 2 }); 
  const [isDoublePoints, setIsDoublePoints] = useState(false); 
  const [isTimeFrozen, setIsTimeFrozen] = useState(false);

  // --- ANİMASYONLAR ---
  const popAnim = useRef(new Animated.Value(0)).current; 
  const flipAnim = useRef(new Animated.Value(0)).current; 
  const announcementAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const timeLeftAnim = useRef(new Animated.Value(1)).current;

  // --- EFEKTLER ---
  useEffect(() => {
    const lockScreen = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    };
    lockScreen();
    
    if (roomId) {
      const playersRef = ref(database, `rooms/${roomId}/players`);
      const unsubscribe = onValue(playersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const playersArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          setPlayers(playersArray);

          setScores(prevScores => {
            const newScores = { ...prevScores };
            playersArray.forEach(p => {
              if (newScores[p.name] === undefined) newScores[p.name] = 0;
            });
            return newScores;
          });
        }
      });
      
      const shuffle = [...OFFICIAL_MEMES].sort(() => 0.5 - Math.random());
      setMyHand(shuffle.slice(0, 5));
      Animated.spring(popAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();

      return () => {
        unsubscribe();
        ScreenOrientation.unlockAsync();
      };
    }
  }, [roomId]);

  useEffect(() => {
    if (phase === 'PLAYING' && !isTimeFrozen) {
      Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [phase, isTimeFrozen]);

  useEffect(() => {
    let timer;
    const totalPhaseTime = phase === 'READING' ? 5 : 10;
    
    Animated.timing(timeLeftAnim, {
      toValue: timeLeft / totalPhaseTime,
      duration: 1000,
      useNativeDriver: false, 
    }).start();

    if (timeLeft > 0 && !roundEnded && !isTimeFrozen) { 
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      timeLeftAnim.setValue(1);
      
      if (phase === 'READING') {
        setPhase('PLAYING');
        setTimeLeft(5); 
      } else if (phase === 'PLAYING') {
        processPlayingPhase();
      } else if (phase === 'VOTING' && !votedCardId && !roundEnded) {
        const opponentCards = playedCards.filter(c => !c.isMine);
        if (opponentCards.length > 0) {
          const randomOpponent = opponentCards[Math.floor(Math.random() * opponentCards.length)];
          handleVote(randomOpponent.id);
        }
      }
    }
    return () => clearTimeout(timer);
  }, [timeLeft, phase, roundEnded, isTimeFrozen]);

  // --- JOKER ÇALIŞTIRMA MANTIĞI ---
  const handleUseJoker = (jokerId) => {
    if (jokerInventory[jokerId] <= 0) return; 
    setJokerInventory(prev => ({ ...prev, [jokerId]: prev[jokerId] - 1 }));

    switch (jokerId) {
      case 'joker1': 
        if (myHand.length > 0) {
          const cardToSwap = selectedCard || myHand[0].id;
          const randomNewCard = [...OFFICIAL_MEMES].sort(() => 0.5 - Math.random())[0];
          setMyHand(prev => prev.map(c => 
            c.id === cardToSwap ? { ...randomNewCard, id: Math.random().toString() } : c
          ));
          setSelectedCard(null);
        }
        break;
      case 'joker2': 
        if (myHand.length > 0) {
          const currentHandSize = myHand.length; 
          const newHand = [...OFFICIAL_MEMES].sort(() => 0.5 - Math.random()).slice(0, currentHandSize);
          setMyHand(newHand);
          setSelectedCard(null); 
        }
        break;
      case 'joker3': 
        setIsTimeFrozen(true); 
        break;
      case 'joker4': 
        setIsDoublePoints(true);
        break;
    }
    setIsJokerMenuVisible(false);
  };

  // --- OYUN MANTIĞI ---
  const processPlayingPhase = () => {
    setPhase('VOTING');
    setTimeLeft(10); 
    
    Animated.sequence([
      Animated.timing(announcementAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(announcementAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    let finalCard = stagedCard;
    let currentHand = [...myHand];
    
    if (!finalCard && currentHand.length > 0) {
        finalCard = currentHand[0];
        currentHand.shift();
        setMyHand(currentHand);
        setHasPlayed(true);
    }
    
    const opponentsForCards = players.filter(p => p.name !== myName);
    const opponentsCards = [...OFFICIAL_MEMES]
      .filter(c => c.id !== (finalCard?.id || -1)) 
      .sort(() => 0.5 - Math.random())
      .slice(0, opponentsForCards.length > 0 ? opponentsForCards.length : 1) 
      .map((c, index) => ({ 
        ...c, 
        isMine: false, 
        id: c.id + '_opp', 
        owner: opponentsForCards[index] ? opponentsForCards[index].name : 'Bekleniyor...' // Bot yerine Bekleniyor yazısı
      }));
      
    // 🎯 BURASI ÖNEMLİ: Eğer elimiz boşsa null olan kartın React'i bozmaması için Fallback ID atadık.
    const tableCards = [{ ...finalCard, isMine: true, owner: myName, id: finalCard?.id || `fallback_${Math.random()}` }, ...opponentsCards];
    setPlayedCards(tableCards.sort(() => 0.5 - Math.random()));
  };

  const handlePlayCard = () => {
    if (selectedCard) {
      const cardToPlay = myHand.find(c => c.id === selectedCard);
      setStagedCard(cardToPlay); 
      setMyHand(myHand.filter(c => c.id !== selectedCard)); 
      setSelectedCard(null);
      setHasPlayed(true); 
      setIsTimeFrozen(false); 
    }
  };

  const handleVote = async (cardId) => {
    if (votedCardId || roundEnded || phase !== 'VOTING') return; 
    setVotedCardId(cardId);
    
    setTimeout(async () => {
      const winnerCard = playedCards[Math.floor(Math.random() * playedCards.length)];
      const currentWinner = winnerCard.owner;
      
      setWinnerName(currentWinner);
      
      let pointsEarned = 1;
      const isMeWinner = currentWinner === myName;

      if (isMeWinner && isDoublePoints) {
        pointsEarned = 2; 
      }

      setScores(prev => ({ 
        ...prev, 
        [currentWinner]: (prev[currentWinner] || 0) + pointsEarned 
      }));
      
      setRoundEnded(true);

      if (isMeWinner) {
        const user = auth.currentUser;
        if (user) {
          try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { wonHearts: increment(1) });
          } catch (error) {
            console.error("Kalp güncellenemedi:", error);
          }
        }
      }

      Animated.spring(announcementAnim, { toValue: 1, useNativeDriver: true }).start();
      if (myHand.length > 0) {
        setTimeout(() => startNextRound(), 3500);
      }
    }, 1500);
  };

  const startNextRound = () => {
    if (myHand.length === 0) {
      const shuffle = [...OFFICIAL_MEMES].sort(() => 0.5 - Math.random());
      setMyHand(shuffle.slice(0, 5));
    }
    setHasPlayed(false);
    setStagedCard(null);
    setPlayedCards([]);
    setVotedCardId(null);
    setRoundEnded(false);
    setWinnerName("");
    setIsDoublePoints(false); 
    setPhase('READING');
    setTimeLeft(5);

    announcementAnim.setValue(0); 
    popAnim.setValue(0);
    flipAnim.setValue(0);
    
    Animated.spring(popAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();
  };

  const PlayerSlot = ({ name, positionStyle, avatarAnimal, badgeColor }) => (
    <View style={[styles.playerSlot, positionStyle]}>
      <View style={styles.avatarContainer}>
        {/* Eğer oyuncu boş ise (Bekleniyor) standart ikon göster */}
        {name.includes('Bekleniyor') ? (
            <View style={[styles.avatar, { borderColor: badgeColor, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person-outline" size={30} color="#9CA3AF" />
            </View>
        ) : (
            <Image 
              source={{ uri: `https://api.dicebear.com/7.x/adventurer/png?seed=${avatarAnimal}&backgroundColor=ffffff` }} 
              style={[styles.avatar, { borderColor: badgeColor, backgroundColor: '#FFF' }]} 
            />
        )}

        <View style={[styles.nameBadge, { backgroundColor: badgeColor }]}>
          <Text style={styles.playerName}>{name}</Text>
        </View>
      </View>
    </View>
  );

  const cardScale = flipAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }); 
  const cardRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }); 

  const logoSwapHand = require('../../assets/joker1.png');
  const logoSwapCard = require('../../assets/joker2.png');
  const logoTimeFreeze = require('../../assets/joker3.png');
  const logoDoublePoints = require('../../assets/joker4.png');

  // 🚀 DİNAMİK MASAYA OTURTMA (Gerçek Kişiler + Boş Koltuklar)
  const me = players.find(p => p.name === myName);
  let opponents = players.filter(p => p.name !== myName);

  // Masada boş kalan yerleri doldur (Bot değil, Boş Koltuk)
  while (opponents.length < 3) {
    const emptyIndex = opponents.length;
    opponents.push({
      id: `empty_${emptyIndex}`,
      name: 'Bekleniyor...',
      avatar: 'empty' // Avatar göstermemesi için
    });
  }

  const opponentPositions = [styles.topPlayer, styles.leftPlayer, styles.rightPlayer];
  const opponentColors = ["#E5E7EB", "#E5E7EB", "#E5E7EB"]; // Boş koltuklar için gri renk

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <View style={styles.whiteBackground} />

      {/* 🔮 SOL KENAR SABİT JOKER HUD */}
      <View style={styles.hudWrapper}>
        <View style={styles.hudContainer}>
          <Ionicons name="flash" size={20} color="#FF00D6" style={styles.hudTitleIcon} />
          {[
            { id: 'joker1', logo: logoSwapHand, color: '#FF69EB' },
            { id: 'joker2', logo: logoSwapCard, color: '#FF8A00' },
            { id: 'joker3', logo: logoTimeFreeze, color: '#00E5FF' },
            { id: 'joker4', logo: logoDoublePoints, color: '#FFDC5E' }
          ].map((joker, index) => { // 🎯 Düzeltme eklendi
            const currentCount = jokerInventory[joker.id];
            const isDepleted = currentCount <= 0;
            return (
              <View key={joker.id || index} style={styles.jokerIconWrapper}> 
                <TouchableOpacity 
                  activeOpacity={0.7} disabled={isDepleted} onPress={() => handleUseJoker(joker.id)} 
                  style={[styles.jokerButton, { shadowColor: joker.color, opacity: isDepleted ? 0.5 : 1 }]}
                >
                  <Image source={joker.logo} style={styles.jokerLogo} resizeMode="contain" />
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
      </View>
      
      {/* 📢 DUYURU BANNER'I */}
      <Animated.View pointerEvents="none" style={[styles.announcementBanner, { transform: [{ translateX: announcementAnim.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) }] }]}>
        <LinearGradient
          colors={['transparent', roundEnded ? 'rgba(255, 180, 130, 0.95)' : 'rgba(255, 105, 235, 0.95)', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bannerGradient}
        >
          <Text style={[styles.announcementText, roundEnded && styles.announcementTextWinner]}>
            {roundEnded 
              ? (winnerName === myName ? "KAZANAN SENSİN! 🏆" : `${winnerName.toUpperCase()} KAZANDI!`) 
              : "EN İYİ MEME'İ SEÇ!"}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* 🟢 OYUN MASASI */}
      <View style={styles.tableContainer}>
        <View style={styles.mainTableRim}>
          <View style={styles.tableSurface}>
            <Image source={require('../../assets/roomTableLogo.png')} style={styles.roomTableLogo} />
          </View>

          {/* 🚀 SENİN YERİN (Sürekli altta) */}
          <PlayerSlot 
            name={`${myName}: ${scores[myName] || 0}`} 
            positionStyle={styles.bottomPlayer} 
            avatarAnimal={myAvatarSeed} 
            badgeColor="#FCA9D7" 
          />

          {/* 🚀 RAKİPLERİN YERLERİ (Gerçek Kişi veya Boş Koltuk) */}
          {opponents.map((opp, idx) => {
              // Eğer oyuncu gerçekse ona renk ver, değilse gri kalır
              const displayColor = opp.name === 'Bekleniyor...' ? opponentColors[idx % 3] : ["#FDE58E", "#FBB0B2", "#FEC994"][idx % 3];
              
              return (
                  <PlayerSlot 
                    key={opp.id || idx} 
                    name={opp.name === 'Bekleniyor...' ? opp.name : `${opp.name}: ${scores[opp.name] || 0}`} 
                    positionStyle={opponentPositions[idx % 3]} 
                    avatarAnimal={opp.avatar} 
                    badgeColor={displayColor} 
                  />
              );
          })}

          {/* MERKEZ ALAN */}
          <View style={styles.centerArea}>
            
            {/* READING FAZI */}
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
                    <Text style={styles.premiumText}>Vize haftası varken ben ve bitmeyen uykum...</Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* PLAYING FAZI */}
            {phase === 'PLAYING' && (
              <View style={styles.proTimerContainer}>
                <View style={[styles.staticRing, isTimeFrozen && styles.staticRingFrozen]} />
                <Animated.View style={[
                  styles.timerRing, 
                  isTimeFrozen ? styles.timerRingFrozen : (timeLeft <= 3 ? styles.timerRingDanger : styles.timerRingNormal),
                  { transform: [{ rotate: rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }
                ]} />
                {isTimeFrozen && (
                  <View style={styles.snowOverlay} pointerEvents="none">
                     <Snowflake delay={0} left="25%" size={14} />
                     <Snowflake delay={600} left="55%" size={10} />
                     <Snowflake delay={1200} left="35%" size={16} />
                     <Snowflake delay={1800} left="65%" size={12} />
                  </View>
                )}
                <View style={[styles.modernTimerContent, isTimeFrozen && styles.modernTimerContentFrozen]}>
                   <Text style={[
                     styles.proTimerText, 
                     timeLeft <= 3 && !isTimeFrozen && styles.proTimerTextDanger,
                     isTimeFrozen && styles.proTimerTextFrozen
                   ]}>{timeLeft}</Text>
                </View>
              </View>
            )}

            {/* VOTING FAZI */}
            {phase === 'VOTING' && playedCards.length > 0 && (
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
                  {playedCards.map((card, index) => { // 🎯 Düzeltme eklendi
                    const isVoted = votedCardId === card.id;
                    return (
                      <TouchableOpacity 
                        key={card.id || `played_${index}`} // 🎯 ID bozulursa diye yedek kilit
                        style={[styles.voteCardWrapper, isVoted && styles.votedCardStyle, card.isMine && styles.disabledVoteCard]} 
                        disabled={card.isMine || votedCardId !== null} onPress={() => handleVote(card.id)} activeOpacity={0.8}
                      >
                        <Image source={{ uri: card.url }} style={styles.memeImage} />
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

                {/* SONUÇ EKRANI */}
                {roundEnded && myHand.length === 0 && (
                  <View style={styles.proModalOverlay}>
                    <Animated.View style={[styles.resultWindow, { transform: [{ scale: popAnim }] }]}>
                      <LinearGradient colors={['#FF69EB', '#FF00D6']} style={styles.windowHeader}>
                        <Text style={styles.windowHeaderText}>OYUN SONUCU</Text>
                      </LinearGradient>
                      <View style={styles.windowBody}>
                        <View style={styles.scoreListContainer}>
                          {Object.entries(scores)
                            .sort((a, b) => b[1] - a[1]) 
                            .map(([name, score], index) => ( // 🎯 Düzeltme eklendi
                              <View key={name || `score_${index}`} style={[styles.scoreRowPro, index === 0 && styles.winnerRow]}>
                                <Text style={styles.rankText}>{index + 1}.</Text>
                                <Text style={styles.scoreNameText}>{name === myName ? 'SEN' : name}</Text>
                                <Text style={styles.scoreValueText}>{score} PK</Text>
                              </View>
                            ))}
                        </View>
                        <View style={styles.windowActions}>
                          <TouchableOpacity style={styles.modalExitBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.8}>
                            <Text style={styles.modalExitText}>OYUNDAN ÇIK</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.modalPlayBtn} onPress={startNextRound} activeOpacity={0.8}>
                            <Text style={styles.modalPlayText}>YENİ OYUN</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Animated.View>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* 🚀 ALT AKSİYON MERKEZİ */}
      <View style={styles.bottomDeckWrapper}>
        {!hasPlayed && phase !== 'VOTING' && (
          <View style={[styles.handContainer, { width: width }]}>
            {myHand.map((item, index) => { // 🎯 Düzeltme eklendi
              const rotation = (index - Math.floor(myHand.length / 2)) * 10; 
              const isSelected = selectedCard === item.id;
              
              return (
                <TouchableOpacity 
                  key={item.id || `hand_${index}`} // 🎯 Yedek kilit eklendi
                  activeOpacity={1} onPress={() => setSelectedCard(isSelected ? null : item.id)} 
                  style={[
                    styles.deckCard, 
                    { 
                      transform: [{ rotate: `${rotation}deg` }, { translateY: isSelected ? -30 : 0 }, { scale: isSelected ? 1.1 : 1 }], 
                      zIndex: isSelected ? 100 : index, 
                      left: (width / 2) - 55 + (index - Math.floor(myHand.length / 2)) * 50 
                    }
                  ]}
                >
                  <Image source={{ uri: item.url }} style={styles.memeImage} />
                  {isSelected && <View style={styles.selectedBorder} />}
                  {isSelected && (
                    <TouchableOpacity style={styles.playButton} onPress={handlePlayCard} activeOpacity={0.8}>
                      <LinearGradient colors={['#FF69EB', '#FF00D6']} style={styles.playButtonGradient}>
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

      {/* SCORE SCREEN (Bitiş) */}
      {roundEnded && myHand.length === 0 && (
        <ScoreScreen scores={scores} navigation={navigation} onNewGame={startNextRound} />
      )}
    </View>
  );
}