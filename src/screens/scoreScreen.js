import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ActivityIndicator,Animated } from 'react-native'; // 🚀 EKLENDİ: ActivityIndicator
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// 🚀 DÜZELTİLDİ: onQuit eklendi, navigation çıkarıldı
const ScoreScreen = ({ scores, onQuit, onNewGame, amIHost }) => { 
  const { width } = useWindowDimensions(); 
  const [isLoading, setIsLoading] = useState(false); // 🚀 EKLENDİ: Buton Spam Koruması

  // 🚀 PULSE ANİMASYONU BURAYA EKLENDİ
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Yanıp sönme animasyonunu başlat
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    );
    animation.start();

    return () => animation.stop(); // Bileşen kapandığında durdur
  }, []);


  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const highestScore = sorted.length > 0 ? sorted[0][1] : 0;

  const handlePlayAgain = () => {
    if (isLoading) return;
    setIsLoading(true);
    onNewGame();
    // Host butona bastıktan sonra Firebase onValue tetiklenene kadar buton kilitli kalacak
  };

  return (
    <View style={styles.overlay}>
      <LinearGradient 
        colors={['rgba(255, 105, 235, 0.7)', 'rgba(255, 191, 129, 0.7)', 'rgba(255, 220, 94, 0.7)']} 
        style={StyleSheet.absoluteFill} 
      />
      
      <View style={[styles.topGlow, { width: width }]} />
      
      <View style={styles.modalWindow}>
       <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onQuit} 
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <Ionicons name="close" size={30} color="#FF69EB" />
        </TouchableOpacity>

        <View style={styles.glassReflect} />

        <View style={styles.headerContainer}>
          <View style={styles.statusBadge}>
            <Ionicons name="flash" size={12} color="#FFDC5E" />
            <Text style={styles.statusText}>MAÇ TAMAMLANDI</Text>
          </View>
          
          <View style={styles.titleArea}>
            <Text style={styles.headerTitleGlow}>FİNAL SKORU</Text>
            <Text style={styles.headerTitle}>FİNAL SKORU</Text>
          </View>
        </View>

        <View style={styles.podiumContainer}>
        {sorted.map(([name, score], index) => {
  // 🚀 DÜZELTİLDİ: Sadece index 0 değil, en yüksek puana sahip herkes "birinci" sayılır
  const isFirst = score === highestScore && score > 0; 
  const isMe = name === 'Ben' || name === 'SEN' || name === 'Sen'; // İsim kontrolünü sağlama alalım
  
  const rankColors = ['#FFDC5E', '#FF69EB', '#FFA3A5', '#FFBF81'];
  const heightMap = ['100%', '86%', '76%', '68%'];

  return (
    <View 
      key={name} 
      style={[
        styles.podiumCard, 
        // 🚀 DÜZELTİLDİ: Birinci olanların hepsi altın rengi (rankColors[0]) ve tam boy olsun
        { 
          height: isFirst ? heightMap[0] : heightMap[index], 
          borderColor: (isFirst ? rankColors[0] : rankColors[index]) + '40' 
        },
        isFirst && styles.firstCard,
        (!isFirst && isMe) && styles.myCard
      ]}
    >
      <LinearGradient 
        colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.3)']} 
        style={StyleSheet.absoluteFill} 
        borderRadius={24}
      />

      {/* 🚀 DÜZELTİLDİ: Puanı en yüksek olan herkese taç gider */}
      {isFirst && <Text style={styles.crown}>👑</Text>}
      
      <View style={[
        styles.rankBadge, 
        { backgroundColor: isFirst ? rankColors[0] : rankColors[index] }
      ]}>
        <Text style={styles.rankText}>{isFirst ? 1 : index + 1}</Text>
      </View>
      
      <View style={styles.playerInfo}>
        <Text 
          style={[styles.playerName, isFirst && styles.winnerText, isMe && styles.meTextBold]} 
          numberOfLines={1} 
          adjustsFontSizeToFit
        >
           {name === 'Ben' ? 'SEN' : name.toUpperCase()}
        </Text>
        
        <View style={[
          styles.scorePill, 
          { backgroundColor: (isFirst ? rankColors[0] : rankColors[index]) + '15' }
        ]}>
          <Text style={[
            styles.scoreText, 
            { color: isFirst ? '#CC9900' : rankColors[index] }
          ]}>
            {score} PK
          </Text>
        </View>
      </View>
    </View>
  );
})}
        </View>
       <View style={styles.actionRow}>
          {/* 🚀 DÜZELTİLDİ: Sadece Host ise Yeniden Oyna butonu çıksın, Guest beklesin */}
          {amIHost ? (
            <TouchableOpacity style={styles.playBtnContainer} onPress={handlePlayAgain} activeOpacity={0.9} disabled={isLoading}>
              <View style={[styles.btnAura, { backgroundColor: '#FF69EB', opacity: 0.3 }]} />
              <LinearGradient 
                colors={['#FF69EB', '#FFA3A5']} 
                start={{x: 0, y: 0.5}} end={{x: 1, y: 0.5}}
                style={styles.playBtnGradient}
              >
                <View style={styles.innerReflect} />
                {isLoading ? (
                   <ActivityIndicator color="white" size="small" />
                ) : (
                   <Text style={styles.playBtnText}>YENİDEN OYNA</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : (
 <View style={styles.playBtnContainer}>
  <LinearGradient 
    // 🚀 GÜNCELLENDİ: Arka plan şeffaflığı artırıldı (0.05 -> 0.3)
    colors={['rgba(255, 148, 33, 0.53)', 'rgba(255, 60, 222, 0.4)']} 
    style={{ 
      paddingHorizontal: 35, 
      paddingVertical: 12, 
      borderRadius: 30, 
      flexDirection: 'row', 
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: 'rgba(251, 58, 219, 0.21)',
      minWidth: 280,
      justifyContent: 'center',
      // Hafif bir bulanıklık hissi için gölge
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    }}
  >
    {/* 🚀 CANLI NOKTA: Daha parlak hale getirildi */}
    <Animated.View style={{ 
      width: 10, 
      height: 10, 
      borderRadius: 5, 
      backgroundColor: '#FF7207', 
      marginRight: 15,
      opacity: pulseAnim, 
      shadowColor: '#FFDC5E',
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 5
    }} />

    <View style={{ flexDirection: 'column' }}>
      <Text style={{ 
        color: '#FFFFFF', // Saf beyaz
        fontWeight: '900', 
        fontSize: 14, // Biraz büyütüldü
        letterSpacing: 1.5,
        // 🚀 GÜNCELLENDİ: Daha belirgin siyah gölge
        textShadowColor: 'rgba(255, 108, 2, 0.8)',
        textShadowRadius: 6,
        textShadowOffset: { width: 1, height: 1 }
      }}>
        HOST BEKLENİYOR
      </Text>
      <Text style={{ 
        color: '#FFDC5E', // 🚀 GÜNCELLENDİ: Alt yazı sarı yapılarak kontrast sağlandı
        fontSize: 11, 
        fontWeight: '800',
        textAlign: 'center',
        marginTop: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowRadius: 4
      }}>
        OYUN BİRAZDAN BAŞLAYACAK
      </Text>
    </View>
  </LinearGradient>
</View>
          )}
        </View>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  // --- OVERLAY VE ARKA PLAN EFEKTLERİ ---
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)', 
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999999,
  },
  topGlow: {
    position: 'absolute', 
    top: -100, 
    height: 300,
    backgroundColor: '#FFF', 
    opacity: 0.2, 
    borderRadius: 150, 
    transform: [{ scaleX: 2 }],
  },
  glassReflect: {
    position: 'absolute', 
    top: -50, 
    left: -50, 
    width: 200, 
    height: 200,
    backgroundColor: 'rgba(255, 225, 159, 0.4)', 
    borderRadius: 100, 
    transform: [{ rotate: '45deg' }],
  },

  // --- ANA MODAL PENCERESİ ---
  modalWindow: {
    width: '75%', 
    height: '92%',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 40,
    padding: 25,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    elevation: 30,
    shadowColor: '#FF69EB', 
    shadowOpacity: 0.3, 
    shadowRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- HEADER VE BAŞLIK ALANI ---
  headerContainer: { 
    alignItems: 'center', 
    marginTop: 5 
  },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FF9D4193', 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    borderRadius: 10, 
    marginBottom: 12 
  },
  statusText: { 
    color: '#FFF', 
    fontSize: 10, 
    fontWeight: '900', 
    letterSpacing: 2, 
    marginLeft: 5 
  },
  titleArea: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerTitleGlow: {
    position: 'absolute', 
    color: '#FF69EB', 
    fontSize: 36, 
    fontWeight: '900',
    letterSpacing: 2, 
    opacity: 0.3,
    marginBottom: 5
  },
  headerTitle: { 
    color: '#FF86C8', 
    fontSize: 36, 
    fontWeight: '900', 
    letterSpacing: 2, 
    fontFamily: 'Nunito_900Black',
    marginBottom: 5
  },

  // --- KÜRSÜ (PODIUM) VE KARTLAR ---
  podiumContainer: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    justifyContent: 'center', 
    width: '100%', 
    height: '50%', 
    gap: 15 
  },
  podiumCard: { 
    flex: 1, 
    borderRadius: 24, 
    padding: 8, 
    alignItems: 'center',
    justifyContent: 'flex-end', 
    borderWidth: 2, 
    zIndex: 1
  },
  firstCard: { 
    backgroundColor: '#FFFBE6', 
    transform: [{ scale: 1.05 }],
    shadowColor: '#FFDC5E', 
    shadowOpacity: 0.5, 
    shadowRadius: 15, 
    elevation: 10
  },
  myCard: { 
    backgroundColor: '#FFF0F9', 
    borderStyle: 'dashed' 
  },

  // --- OYUNCU BİLGİLERİ VE SKOR ---
  playerInfo: { 
    alignItems: 'center', 
    width: '100%', 
    marginBottom: 15, 
    zIndex: 10 
  },
  playerName: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: '#555', 
    marginBottom: 8 
  },
  meTextBold: { 
    color: '#FF69EB' 
  },
  winnerText: { 
    color: '#CC9900', 
    fontSize: 16 
  },
  scorePill: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 14 
  },
  scoreText: { 
    fontSize: 13, 
    fontWeight: '900' 
  },
  rankBadge: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10, 
    elevation: 5, 
    zIndex: 10 
  },
  rankText: { 
    fontSize: 14, 
    fontWeight: '900', 
    color: '#FFF' 
  },
  crown: { 
    position: 'absolute', 
    top: -35, 
    fontSize: 36, 
    zIndex: 20 
  },

  // --- ALT AKSİYON ALANI VE BUTON ---
  actionRow: { 
    width: '100%', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  playBtnContainer: { 
    width: 220, 
    height: 62, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10 
  },
  btnAura: {
    position: 'absolute', 
    width: '90%', 
    height: '60%', 
    backgroundColor: '#FF69EB',
    borderRadius: 20, 
    opacity: 0.4, 
  },
  playBtnGradient: {
    width: '100%', 
    height: '80%', 
    borderRadius: 20,
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 18, 
    elevation: 10, 
    justifyContent: 'center', 
  },
  innerReflect: {
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    height: '40%', 
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  playBtnText: { 
    color: '#FFF', 
    fontSize: 14, 
    fontWeight: '900', 
    letterSpacing: 1, 
    textAlign: 'center' 
  },
  btnIconCircle: { 
    width: 32, 
    height: 32, 
    borderRadius: 10, 
    backgroundColor: 'transparent', 
    justifyContent: 'center', 
    alignItems: 'center', 
    position: 'absolute', 
    right: 15, 
  },
});

export default ScoreScreen;