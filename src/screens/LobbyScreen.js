import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Image, ScrollView, Dimensions, Platform, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StackActions } from '@react-navigation/native';

// 🔥 FIREBASE BAĞLANTILARI
import { database } from '../services/firebase';
import { ref, set, onValue, update, remove } from 'firebase/database';

const { width } = Dimensions.get('window');
const MAX_PLAYERS = 4;

export default function LobbyScreen({ route, navigation }) {
  const isHost = route.params?.isHost ?? false;
  const initialRoomId = route.params?.roomId ?? null;

  const [roomId, setRoomId] = useState(initialRoomId);
  const [myName, setMyName] = useState(route.params?.myName || 'Sinem');
  const [myAvatarSeed, setMyAvatarSeed] = useState(route.params?.userAvatar || 'Oliver');
  const [players, setPlayers] = useState([]);
  const [isReady, setIsReady] = useState(isHost);
  
  // 🎯 KRİTİK: userId'yi sadece bir kez oluşturuyoruz
  const [userId] = useState("USER_" + Math.random().toString(36).substring(7));

  useEffect(() => {
    // 🎯 KRİTİK DÜZELTME 1: currentRoomId'yi yerel bir değişkende tutuyoruz
    let currentRoomId = roomId; 
    
    // 1. HOST İSE VE ODA HENÜZ OLUŞTURULMADIYSA
    if (isHost && !currentRoomId) {
      currentRoomId = Math.random().toString(36).substring(7).toUpperCase();
      setRoomId(currentRoomId); // State'i sadece burada, oda yoksa güncelliyoruz
      
      const newRoomRef = ref(database, `rooms/${currentRoomId}`);
      set(newRoomRef, {
        status: 'waiting',
        hostId: userId,
        createdAt: Date.now(),
      });
    }

    // 2. OYUNCU EKLEME VE DİNLEME
    if (currentRoomId) {
      const roomRef = ref(database, `rooms/${currentRoomId}`);
      const myPlayerRef = ref(database, `rooms/${currentRoomId}/players/${userId}`);
      
      set(myPlayerRef, {
        name: myName,
        avatar: myAvatarSeed,
        isReady: isHost,
        isHost: isHost
      });

      const unsubscribe = onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          if (data.players) {
            const playersArray = Object.entries(data.players).map(([id, details]) => ({
              id: id,
              ...details
            }));
            setPlayers(playersArray);
          }
          
          if (data.status === 'playing') {
            navigation.dispatch(
              StackActions.replace('RoomScreen', { 
                roomId: currentRoomId, 
                myAvatarSeed, 
                myName,
                isHost 
              })
            );
          }
        }
      });
      return () => {
        unsubscribe();
        if (isHost) {
          remove(ref(database, `rooms/${currentRoomId}`));
        } else {
          remove(myPlayerRef);
        }
      };
    }
  }, [roomId]); // RoomId oluştuktan sonra tetiklenir

  // Yeni avatar senkronizasyonu
  useEffect(() => {
    if (route.params?.userAvatar && roomId) {
      const newAvatar = route.params.userAvatar;
      setMyAvatarSeed(newAvatar);
      update(ref(database, `rooms/${roomId}/players/${userId}`), {
        avatar: newAvatar
      });
    }
  }, [route.params?.userAvatar]);

  const toggleReady = () => {
    if (!roomId) return;
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    update(ref(database, `rooms/${roomId}/players/${userId}`), {
      isReady: newReadyState
    });
  };

  const startGame = () => {
    if (!roomId) return;
    if (players.length < 2) {
      Alert.alert("Yetersiz Oyuncu", "Oyunu başlatmak için en az 2 oyuncu gerekiyor.");
      return;
    }
    const allReady = players.every(p => p.isReady);
    if (!allReady) {
      Alert.alert("Bekle!", "Tüm oyuncuların hazır olması gerekiyor.");
      return;
    }
    update(ref(database, `rooms/${roomId}`), {
      status: 'playing' 
    });
  };

  const onShare = async () => {
    try {
      await Share.share({ message: `Meme Kapışması odama gel! Kodun: ${roomId}` });
    } catch (error) { console.log(error.message); }
  };

  const renderSlots = () => {
    const slots = [];
    for (let i = 0; i < MAX_PLAYERS; i++) {
      const player = players[i];
      if (player) {
        // 🎯 ARTIK "Sen" KONTROLÜ YAPMIYORUZ, DİREKT FIREBASE NICKNAME'İ ÇEKİYORUZ
        slots.push(
          <View key={player.id} style={styles.playerSlot}>
            <View style={styles.activeAvatarContainer}>
              <Image 
                source={{ uri: `https://api.dicebear.com/7.x/adventurer/png?seed=${player.avatar}&backgroundColor=FFDC5E` }} 
                style={styles.miniAvatar} 
              />
              {/* Hazır durumuna göre renk değişen küçük nokta */}
              <View style={[styles.statusIndicatorActive, !player.isReady && { backgroundColor: '#FF8A00' }]} />
            </View>
            
            {/* 🚀 BURASI DEĞİŞTİ: Direkt player.name basılıyor */}
            <Text style={styles.playerName} numberOfLines={1}>
              {player.name}
            </Text>
            
            <Text style={[styles.statusTextActive, !player.isReady && { color: '#FF8A00' }]}>
              {player.isReady ? "Hazır" : "Bekliyor"}
            </Text>
          </View>
        );
      } else {
        // Boş slot tasarımı (Aynı kalabilir)
        slots.push(
          <View key={`empty-${i}`} style={styles.playerSlot}>
            <View style={styles.emptyAvatarCircle}>
              <Ionicons name="person-outline" size={22} color="#9CA3AF" />
            </View>
            <Text style={styles.playerNameEmpty}>Boş</Text>
            <Text style={styles.statusTextWaiting}>Bekleniyor...</Text>
          </View>
        );
      }
    }
    return slots;
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF69EB', '#FFA3A5']} style={styles.headerBackground}>
        <View style={styles.headerNav}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <Ionicons name="chevron-back" size={24} color="white" />
           </TouchableOpacity>
           <Text style={styles.headerTitle}>OYUN LOBİSİ</Text>
           <View style={{width: 40}} /> 
        </View>

        <View style={styles.profileSection}>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={styles.avatarWrapper}
            onPress={() => navigation.navigate('AvatarScreen', { nextScreen: 'LobbyScreen', myName })}
          >
            <Image 
              source={{ uri: `https://api.dicebear.com/7.x/adventurer/png?seed=${myAvatarSeed}&backgroundColor=ffffff` }} 
              style={styles.avatarImage} 
            />
            <View style={styles.editIconContainer}>
              <MaterialCommunityIcons name="pencil" size={16} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.welcomeText}>Hoş geldin, <Text style={styles.nameHighlight}>{myName}</Text></Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.card}>
          <View style={styles.roomCodeContainer}>
            <View>
              <Text style={styles.cardSubtitle}>KATILIM KODU</Text>
              <Text style={styles.roomCodeText}>{roomId || '...'}</Text>
            </View>
            <TouchableOpacity style={styles.shareButton} onPress={onShare}>
               <Ionicons name="share-social" size={22} color="#FF69EB" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
           <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Mevcut Oyuncular</Text>
              <View style={styles.playerCountBadge}>
                <Text style={styles.playerCountText}>{players.length} / {MAX_PLAYERS}</Text>
              </View>
           </View>
           
           <View style={styles.playerGrid}>
              {renderSlots()}
           </View>
        </View>

        <View style={styles.qrCard}>
           <Text style={styles.qrTitle}>Hızlı Katılım</Text>
           <Text style={styles.qrDescription}>Arkadaşların bu kodu taratarak odaya doğrudan katılabilir.</Text>
           <View style={styles.qrContainer}>
              {roomId ? (
                <QRCode 
                  value={`memetable://join/${roomId}`} 
                  size={90} 
                  color="#1F2937" 
                  backgroundColor="transparent" 
                />
              ) : null}
           </View>
        </View>
      </ScrollView>

      <View style={styles.footerContainer}>
        <TouchableOpacity 
          style={[
            styles.actionButtonContainer, 
            (isHost && players.length < 2) && { opacity: 0.5 }
          ]} 
          activeOpacity={0.9}
          onPress={isHost ? startGame : toggleReady}
          disabled={isHost && players.length < 2}
        >
          <LinearGradient 
            colors={
              isHost 
                ? (players.length < 2 ? ['#9CA3AF', '#6B7280'] : ['#FFBF81', '#FF69EB']) 
                : isReady ? ['#FFBF81', '#FF69EB'] : ['#9CA3AF', '#6B7280']
            } 
            style={styles.actionButton} 
            start={{x: 0, y: 0}} 
            end={{x: 1, y: 1}}
          >
            <Text style={styles.actionButtonText}>
              {isHost 
                ? (players.length < 2 ? "OYUNCU BEKLENİYOR..." : "OYUNU BAŞLAT") 
                : (isReady ? "HAZIRIM (İPTAL ET)" : "HAZIR DEĞİLİM")}
            </Text>
            <Ionicons 
              name={isHost ? (players.length < 2 ? "time-outline" : "play") : (isReady ? "checkmark-circle" : "close-circle")} 
              size={22} 
              color="white" 
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  headerBackground: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center', shadowColor: '#FF69EB', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  headerNav: { flexDirection: 'row', width: '100%', paddingHorizontal: 20, justifyContent: 'space-between', alignItems: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: '700', letterSpacing: 1.5 },
  profileSection: { alignItems: 'center', marginTop: 25 },
  avatarWrapper: { position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  avatarImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF', borderWidth: 3, borderColor: '#FFF' },
  editIconContainer: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FFDC5E', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  welcomeText: { color: 'rgba(255,255,255,0.9)', marginTop: 15, fontSize: 18, fontWeight: '400' },
  nameHighlight: { color: '#FFF', fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 120 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  roomCodeContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardSubtitle: { fontSize: 12, fontWeight: '600', color: '#6B7280', letterSpacing: 0.5, marginBottom: 4 },
  roomCodeText: { fontSize: 28, fontWeight: '800', color: '#111827', letterSpacing: 3 },
  shareButton: { backgroundColor: 'rgba(255, 105, 235, 0.1)', width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  playerCountBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  playerCountText: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
  playerGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  playerSlot: { alignItems: 'center', width: (width - 80) / 4 },
  activeAvatarContainer: { position: 'relative', marginBottom: 8 },
  miniAvatar: { width: 56, height: 56, borderRadius: 28 },
  statusIndicatorActive: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, backgroundColor: '#FF69EB', borderRadius: 7, borderWidth: 2, borderColor: '#FFF' },
  playerName: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 2 },
  statusTextActive: { fontSize: 11, fontWeight: '600', color: '#FF69EB' },
  emptyAvatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  playerNameEmpty: { fontSize: 13, fontWeight: '500', color: '#9CA3AF', marginBottom: 2 },
  statusTextWaiting: { fontSize: 11, color: '#9CA3AF' },
  qrCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 20 },
  qrTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  qrDescription: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
  qrContainer: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  footerContainer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 24, paddingTop: 16, backgroundColor: 'rgba(243, 244, 246, 0.9)' },
  actionButtonContainer: { shadowColor: '#FF69EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  actionButton: { height: 60, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  actionButtonText: { color: 'white', fontWeight: '800', fontSize: 16, letterSpacing: 1 }
});