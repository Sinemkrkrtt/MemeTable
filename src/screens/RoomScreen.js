import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar, Animated, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { OFFICIAL_MEMES } from '../memeData';
import { styles } from './RoomScreenStyles';
import ScoreScreen from './scoreScreen';


export default function RoomScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
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
  
  const popAnim = useRef(new Animated.Value(0)).current; 
  const flipAnim = useRef(new Animated.Value(0)).current; 
  const announcementAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  // 🔥 BU SATIRI EKLE
const timeLeftAnim = useRef(new Animated.Value(1)).current;


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
// 1. Önce bu değişkenin tanımlı olduğundan emin ol (useRef'lerin orada):
  // const timeLeftAnim = useRef(new Animated.Value(1)).current;

  // 2. useEffect bloğunu bu şekilde güncelle:
  useEffect(() => {
    let timer;
    
    // Şeridi her saniye yumuşak bir şekilde kaydırır
    const totalPhaseTime = phase === 'READING' ? 5 : 10;
    Animated.timing(timeLeftAnim, {
      toValue: timeLeft / totalPhaseTime,
      duration: 1000,
      useNativeDriver: false, // Renk animasyonu için false olmalı
    }).start();

    if (timeLeft > 0 && !roundEnded) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      // Faz değiştiğinde şeridi anında başa sar (full yap)
      timeLeftAnim.setValue(1);
      
      if (phase === 'READING') {
        setPhase('PLAYING');
        setTimeLeft(5); // Oynama süresini 10'a çıkardık
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

    // 🔥 KAZANAN BANNER'INI TETİKLE
    Animated.sequence([
      Animated.spring(announcementAnim, { toValue: 1, speed: 12, bounciness: 8, useNativeDriver: true }),
      Animated.delay(2000), // Kazanan 2 saniye ekranda parlasın
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

  const PlayerSlot = ({ name, positionStyle, avatarSeed, badgeColor }) => (
    <View style={[styles.playerSlot, positionStyle]}>
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}` }} 
          style={[styles.avatar, { borderColor: badgeColor }]} 
        />
        <View style={[styles.nameBadge, { backgroundColor: badgeColor }]}>
          <Text style={styles.playerName}>{name}</Text>
        </View>
      </View>
    </View>
  );

  const cardScale = flipAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }); 
  const cardRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }); 

  
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <View style={styles.whiteBackground} />
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
        <View style={styles.mainTableRim}>
          <View style={styles.tableSurface}>
            <Image source={require('../../assets/roomTableLogo.png')} style={styles.roomTableLogo} />
          </View>

          <PlayerSlot name={`Ali: ${scores.Ali}`} positionStyle={styles.topPlayer} avatarSeed="Ali" badgeColor="#FDE58E" />
          <PlayerSlot name={`Ece: ${scores.Ece}`} positionStyle={styles.leftPlayer} avatarSeed="Ece" badgeColor="#FBB0B2" />
          <PlayerSlot name={`Can: ${scores.Can}`} positionStyle={styles.rightPlayer} avatarSeed="Can" badgeColor="#FEC994" />
          <PlayerSlot name={`Sen: ${scores.Ben}`} positionStyle={styles.bottomPlayer} avatarSeed="Sinem" badgeColor="#FCA9D7" />

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
    {/* Arkadaki loş halka */}
    <View style={styles.staticRing} />
    
    {/* Dönen Neon Halka */}
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

    {/* Şeffaf ve Modern Sayı */}
    <View style={styles.modernTimerContent}>
       <Text style={[styles.proTimerText, timeLeft <= 3 && {color: '#FF3B30'}]}>
         {timeLeft}
       </Text>
    </View>
  </View>
)}     
 {phase === 'VOTING' && playedCards.length > 0 && (
  <View style={styles.votingAreaPro}>
    
    {/* 📈 SÜRE ŞERİDİ */}
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

    {/* 🎯 ARTIK TAM ORTALANAN KARTLAR */}
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

    {/* 🏆 OYUN BİTTİ SIRALAMA PENCERESİ */}
    {roundEnded && myHand.length === 0 && (
      <View style={styles.proModalOverlay}>
        <Animated.View style={[styles.resultWindow, { transform: [{ scale: popAnim }] }]}>
          <LinearGradient colors={['#FF69EB', '#FF00D6']} style={styles.windowHeader}>
            <Text style={styles.windowHeaderText}>OYUN SONUCU</Text>
          </LinearGradient>

          <View style={styles.windowBody}>
            <View style={styles.scoreListContainer}>
              {Object.entries(scores)
                .sort((a, b) => b[1] - a[1]) // Büyükten küçüğe sıralama
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
{/* 🏆 FINAL EKRANINI DIŞARIDAN ÇEKİYORUZ */}
      {roundEnded && myHand.length === 0 && (
        <ScoreScreen 
          scores={scores} 
          navigation={navigation} 
          onNewGame={startNextRound} 
        />
      )}
    </View>
  );
}