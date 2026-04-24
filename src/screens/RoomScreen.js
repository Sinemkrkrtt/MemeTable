import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, Animated, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { OFFICIAL_MEMES } from '../memeData';
import { styles } from './RoomScreenStyles';
import ScoreScreen from './scoreScreen';
import JokerModal from './JokerModal';

export default function RoomScreen({ navigation, route }) {
  const { width, height } = useWindowDimensions();
  
  // Lobi'den (LobbyScreen) gelen oyuncu verileri
  const { myName, myAvatarSeed } = route?.params || { myName: 'Sen', myAvatarSeed: 'Sinem' };

  // --- STATE'LER ---
  const [myHand, setMyHand] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [phase, setPhase] = useState('READING'); 
  const [timeLeft, setTimeLeft] = useState(5); 
  const [stagedCard, setStagedCard] = useState(null); 
  const [playedCards, setPlayedCards] = useState([]); 
  const [hasPlayed, setHasPlayed] = useState(false); 
  const [votedCardId, setVotedCardId] = useState(null); 
  const [scores, setScores] = useState({ Ali: 0, Ece: 0, Can: 0, Ben: 0 }); 
  const [roundEnded, setRoundEnded] = useState(false); 
  const [winnerName, setWinnerName] = useState(""); 
  const [isJokerMenuVisible, setIsJokerMenuVisible] = useState(false);
  
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
    
    const shuffle = [...OFFICIAL_MEMES].sort(() => 0.5 - Math.random());
    setMyHand(shuffle.slice(0, 5));
    Animated.spring(popAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();
    
    return () => { ScreenOrientation.unlockAsync(); };
  }, []);

  useEffect(() => {
    let timer;
    const totalPhaseTime = phase === 'READING' ? 5 : 10;
    
    Animated.timing(timeLeftAnim, {
      toValue: timeLeft / totalPhaseTime,
      duration: 1000,
      useNativeDriver: false, 
    }).start();

    if (timeLeft > 0 && !roundEnded) {
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
  }, [timeLeft, phase, roundEnded]);

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
    
    const opponents = ['Ali', 'Ece', 'Can'];
    const opponentsCards = [...OFFICIAL_MEMES]
      .filter(c => c.id !== (finalCard?.id || -1)) 
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((c, index) => ({ ...c, isMine: false, id: c.id + '_opp', owner: opponents[index] }));
      
    const tableCards = [{ ...finalCard, isMine: true, owner: 'Ben' }, ...opponentsCards];
    setPlayedCards(tableCards.sort(() => 0.5 - Math.random()));
  };

  const handlePlayCard = () => {
    if (selectedCard) {
      const cardToPlay = myHand.find(c => c.id === selectedCard);
      setStagedCard(cardToPlay); 
      setMyHand(myHand.filter(c => c.id !== selectedCard)); 
      setSelectedCard(null);
      setHasPlayed(true); 
    }
  };

  const handleVote = (cardId) => {
    if (votedCardId || roundEnded) return; 
    setVotedCardId(cardId);
    
    setTimeout(() => {
      const winnerCard = playedCards[Math.floor(Math.random() * playedCards.length)];
      setWinnerName(winnerCard.owner);
      setScores(prev => ({ ...prev, [winnerCard.owner]: prev[winnerCard.owner] + 1 }));
      setRoundEnded(true);

      Animated.sequence([
        Animated.spring(announcementAnim, { toValue: 1, speed: 12, bounciness: 8, useNativeDriver: true }),
        Animated.delay(2000), 
        Animated.timing(announcementAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();

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
    setPhase('READING');
    setTimeLeft(5);
    popAnim.setValue(0);
    flipAnim.setValue(0);
    Animated.spring(popAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();
  };

const PlayerSlot = ({ name, positionStyle, avatarAnimal, badgeColor }) => (
  <View style={[styles.playerSlot, positionStyle]}>
    <View style={styles.avatarContainer}>
      <Image 
        source={{ uri: `https://api.dicebear.com/7.x/adventurer/png?seed=${avatarAnimal}&backgroundColor=ffffff` }} 
        style={[styles.avatar, { borderColor: badgeColor, backgroundColor: '#FFF' }]} 
      />
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
  
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <View style={styles.whiteBackground} />
      
      {/* DUYURU BANNER'I */}
      <Animated.View 
        style={[
          styles.announcementBanner, 
          { 
            transform: [{ 
              translateX: announcementAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-width, 0] 
              }) 
            }] 
          }
        ]}
      >
        <LinearGradient
          colors={['transparent', roundEnded ? 'rgba(255, 180, 130, 0.91)' : 'rgba(255, 105, 235, 0.9)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bannerGradient}
        >
          <Text style={[styles.announcementText, roundEnded && { color: '#FFFFFF', textShadowColor: 'transparent' }]}>
            {roundEnded 
              ? (winnerName === 'Ben' ? "KAZANAN SENSİN! 🏆" : `${winnerName.toUpperCase()} KAZANDI!`) 
              : "EN İYİ MEME'İ SEÇ!"}
          </Text>
        </LinearGradient>
      </Animated.View>

      <View style={styles.tableContainer}>
        
        {/* 🧰 ULTRA-PREMIUM HUD JOKER PANELİ */}
        <View style={{ 
          position: 'absolute', 
          left: 20, 
          top: '20%', 
          backgroundColor: 'transparent',
          borderTopRightRadius: 35,
          borderBottomRightRadius: 35,
          paddingVertical: 15,
          paddingHorizontal: 12,
          paddingLeft: 10, 
          borderWidth: 1.5,
          borderLeftWidth: 0, 
          borderColor: 'rgba(255, 255, 255, 0.15)',
          alignItems: 'center',
          gap: 5, 
          zIndex: 999,
        }}>
          {[
            { id: 'joker1', logo: logoSwapHand, color: '#F7A33B', count: 2, label: 'SWAP' },
            { id: 'joker2', logo: logoSwapCard, color: '#F7A33B', count: 5, label: 'ONE' },
            { id: 'joker3', logo: logoTimeFreeze, color: '#F7A33B', count: 1, label: 'TIME' },
            { id: 'joker4', logo: logoDoublePoints, color: '#F7A33B', count: 2, label: 'X2' }
          ].map((joker) => (
            <View key={joker.id} style={{ alignItems: 'center', marginBottom: -3 }}>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => setIsJokerMenuVisible(true)}
                style={{
                  width: 50, 
                  height: 50,
                  overflow: 'visible', 
                  shadowColor: joker.color,
                  shadowOpacity: 0.3,
                  shadowRadius: 5,
                  elevation: 6,
                }}
              >
                <Image 
                  source={joker.logo}
                  style={{
                    width: '100%', 
                    height: '100%', 
                    borderRadius: 16, 
                    borderWidth: 1.5,
                    borderColor: `${joker.color}70`, 
                    backgroundColor: '#FFF', 
                  }}
                  resizeMode="cover" 
                />
                
                <View style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: joker.color,
                  minWidth: 22,
                  height: 22,
                  borderRadius: 11,
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 10,
                }}>
                  <Text style={{ 
                    color: '#FFF', 
                    fontSize: 11, 
                    fontFamily: 'Nunito_900Black',
                    includeFontPadding: false 
                  }}>{joker.count}</Text>
                </View>
              </TouchableOpacity>
                
              <Text style={{ 
                color: joker.color, 
                fontSize: 9, 
                fontFamily: 'Nunito_900Black', 
                letterSpacing: 2, 
                marginTop: 6,
                textShadowColor: joker.color,
                textShadowRadius: 4,
              }}>
                {joker.label}
              </Text>
            </View>
          ))}
        </View>
    
        <View style={styles.mainTableRim}>
          <View style={styles.tableSurface}>
            <Image source={require('../../assets/roomTableLogo.png')} style={styles.roomTableLogo} />
          </View>

      {/* OYUNCULAR BÖLÜMÜ */}
<PlayerSlot 
  name={`Ali: ${scores.Ali}`} 
  positionStyle={styles.topPlayer} 
  avatarAnimal="Oliver" // Biraz gözlüklü, strateji yapan tip
  badgeColor="#FDE58E" 
/>
<PlayerSlot 
  name={`Ece: ${scores.Ece}`} 
  positionStyle={styles.leftPlayer} 
  avatarAnimal="Willow" // Cool ve her meme'e bir cevabı olan tip
  badgeColor="#FBB0B2" 
/>
<PlayerSlot 
  name={`Can: ${scores.Can}`} 
  positionStyle={styles.rightPlayer} 
  avatarAnimal="Felix" // Komik ve masanın neşesi
  badgeColor="#FEC994" 
/>
<PlayerSlot 
  name={`${myName}: ${scores.Ben}`} 
  positionStyle={styles.bottomPlayer} 
  avatarAnimal="Sinem" // Senin ismini seed olarak verdim, sana özel bir karakter çıksın!
  badgeColor="#FCA9D7" 
/>
          {/* MERKEZ (DURUM, SAAT, OYLAMA) */}
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
                    <Text style={styles.premiumText}>Vize haftası varken ben ve bitmeyen uykum...</Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {phase === 'PLAYING' && (
              <View style={styles.proTimerContainer}>
                <View style={styles.staticRing} />
                <Animated.View style={[
                  styles.timerRing, 
                  { 
                    borderTopColor: timeLeft <= 3 ? '#FF3B30' : '#FF69EB', 
                    borderLeftColor: timeLeft <= 3 ? '#FF3B30' : '#FF69EB',
                    transform: [{ 
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg']
                      }) 
                    }] 
                  }
                ]} />
                <View style={styles.modernTimerContent}>
                   <Text style={[styles.proTimerText, timeLeft <= 3 && {color: '#FF3B30'}]}>
                     {timeLeft}
                   </Text>
                </View>
              </View>
            )}     
            
            {phase === 'VOTING' && playedCards.length > 0 && (
              <View style={styles.votingAreaPro}>
                {!roundEnded && (
                  <View style={[styles.proProgressBarContainer, { zIndex: 999 }]}>
                    <Animated.View style={[
                      styles.proProgressBar, 
                      { 
                        width: timeLeftAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%']
                        }),
                        backgroundColor: timeLeftAnim.interpolate({
                          inputRange: [0, 0.2, 0.5, 1],
                          outputRange: ['#FF3B30', '#FF9500', '#FFDC5E', '#FF69EB'] 
                        })
                      }
                    ]} />
                  </View>
                )}

                <View style={styles.votingRowPro}>
                  {playedCards.map((card) => {
                    const isVoted = votedCardId === card.id;
                    return (
                      <TouchableOpacity 
                        key={card.id} 
                        style={[styles.voteCardWrapper, isVoted && styles.votedCardStyle, card.isMine && styles.disabledVoteCard]} 
                        disabled={card.isMine || votedCardId !== null} 
                        onPress={() => handleVote(card.id)} 
                        activeOpacity={0.8}
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
                            .map(([name, score], index) => (
                              <View key={name} style={[styles.scoreRowPro, index === 0 && styles.winnerRow]}>
                                <Text style={styles.rankText}>{index + 1}.</Text>
                                <Text style={styles.scoreNameText}>{name === 'Ben' ? 'SEN' : name}</Text>
                                <Text style={styles.scoreValueText}>{score} PK</Text>
                              </View>
                            ))}
                        </View>

                        <View style={styles.windowActions}>
                          <TouchableOpacity style={styles.modalExitBtn} onPress={() => navigation.navigate('Home')}>
                            <Text style={styles.modalExitText}>OYUNDAN ÇIK</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.modalPlayBtn} onPress={startNextRound}>
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

      {/* DESTE (KARTLAR) */}
      {!hasPlayed && phase !== 'VOTING' && (
        <View style={styles.deckContainer}>
          {myHand.map((item, index) => {
            const rotation = (index - Math.floor(myHand.length / 2)) * 10; 
            const isSelected = selectedCard === item.id;
            return (
              <TouchableOpacity key={item.id} activeOpacity={1} onPress={() => setSelectedCard(item.id === selectedCard ? null : item.id)} style={[styles.deckCard, { transform: [{ rotate: `${rotation}deg` }, { translateY: isSelected ? -40 : 0 }, { scale: isSelected ? 1.2 : 1 }], zIndex: isSelected ? 100 : index, left: (width / 2) - 55 + (index - Math.floor(myHand.length / 2)) * 50 }]}>
                <Image source={{ uri: item.url }} style={styles.memeImage} />
                {isSelected && <View style={styles.selectedBorder} />}
                {isSelected && (
                  <TouchableOpacity style={styles.playButton} onPress={handlePlayCard} activeOpacity={0.7}>
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

      {/* 🏆 FINAL EKRANI */}
      {roundEnded && myHand.length === 0 && (
        <ScoreScreen 
          scores={scores} 
          navigation={navigation} 
          onNewGame={startNextRound} 
        />
      )}

      {/* 🎁 JOKER ÇANTASI MODALI */}
      <JokerModal 
        visible={isJokerMenuVisible} 
        onClose={() => setIsJokerMenuVisible(false)}
        onUseJoker={(jokerId) => {
          console.log("Joker Onaylandı:", jokerId);
          setIsJokerMenuVisible(false);
        }}
      />
    </View>
  );
}