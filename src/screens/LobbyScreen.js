import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Image, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LobbyScreen({ route, navigation }) {
  const { isHost } = route.params || {};
  const [roomId] = useState(Math.random().toString(36).substring(7).toUpperCase());
  
  // Seçilen avatarı tutan state (Varsayılan olarak DiceBear veya boş)
  const [myAvatar, setMyAvatar] = useState(null);

  // AvatarScreen'den dönen veriyi yakala
  useEffect(() => {
    if (route.params?.userAvatar) {
      setMyAvatar(route.params.userAvatar);
    }
  }, [route.params?.userAvatar]);

  const onShare = async () => {
    try {
      await Share.share({ message: `Meme Kapışması odama gel! Kodun: ${roomId}` });
    } catch (error) { console.log(error.message); }
  };

  return (
    <LinearGradient colors={['#FFF5F9', '#FFFFFF']} style={styles.container}>
      
      {/* ÜST BAŞLIK */}
      <View style={styles.header}>
        <Text style={styles.title}>{isHost ? "Odan Hazır! 👑" : "Lobiye Girildi"}</Text>
        <Text style={styles.roomIdText}>ODA KODU: <Text style={{color: '#FF00D6'}}>{roomId}</Text></Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 🎨 AVATAR SEÇİM ALANI */}
        <TouchableOpacity 
          style={styles.avatarSection} 
          onPress={() => navigation.navigate('AvatarScreen')}
        >
          <View style={styles.avatarCircle}>
            {myAvatar ? (
              <Image source={myAvatar} style={styles.selectedAvatarImg} />
            ) : (
              <Ionicons name="person-add" size={40} color="#FF00D6" />
            )}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={14} color="white" />
            </View>
          </View>
          <Text style={styles.avatarHint}>Karakterini Değiştir</Text>
        </TouchableOpacity>

        {/* 📱 QR & PAYLAŞIM */}
        <View style={styles.qrCard}>
          <QRCode value={roomId} size={120} color="#FF00D6" />
          <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
            <Ionicons name="share-social" size={20} color="white" />
            <Text style={styles.shareTxt}>Arkadaşlarını Çağır</Text>
          </TouchableOpacity>
        </View>

        {/* 👥 OYUNCU LİSTESİ (Simüle Edilmiş) */}
        <View style={styles.playerListContainer}>
          <Text style={styles.listTitle}>Oyuncular (1/4)</Text>
          <View style={styles.playerRow}>
            <View style={styles.playerItem}>
               <View style={[styles.miniAvatar, {backgroundColor: '#FF00D6'}]}>
                 <Text style={{color: 'white', fontWeight: 'bold'}}>SEN</Text>
               </View>
               <Text style={styles.playerName}>Hazır!</Text>
            </View>
            {/* Boş Slotlar */}
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.playerItem}>
                <View style={[styles.miniAvatar, {backgroundColor: '#EEE', borderStyle: 'dashed', borderWidth: 2, borderColor: '#CCC'}]}>
                  <Ionicons name="ellipsis-horizontal" size={20} color="#AAA" />
                </View>
                <Text style={[styles.playerName, {color: '#AAA'}]}>Bekleniyor...</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* 🚀 BAŞLAT BUTONU */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.startBtn, !myAvatar && {backgroundColor: '#CCC'}]} 
          disabled={!myAvatar}
          onPress={() => navigation.navigate('RoomScreen', { 
            roomId, 
            myAvatarSource: myAvatar // Seçilen resmi odaya gönderiyoruz
          })}
        >
          <Text style={styles.startBtnTxt}>
            {myAvatar ? (isHost ? "OYUNU BAŞLAT" : "HAZIRIM!") : "ÖNCE AVATAR SEÇ"}
          </Text>
        </TouchableOpacity>
      </View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginTop: 60, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#333' },
  roomIdText: { fontSize: 16, fontWeight: '700', color: '#888', marginTop: 5 },
  scrollContent: { alignItems: 'center', paddingBottom: 120 },
  
  // Avatar
  avatarSection: { marginVertical: 30, alignItems: 'center' },
  avatarCircle: { 
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFE6F2',
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FF00D6'
  },
  selectedAvatarImg: { width: '100%', height: '100%', borderRadius: 50 },
  editBadge: { 
    position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FF8A00',
    padding: 6, borderRadius: 15, borderWidth: 2, borderColor: 'white'
  },
  avatarHint: { marginTop: 10, color: '#FF00D6', fontWeight: 'bold' },

  // QR Card
  qrCard: { backgroundColor: 'white', padding: 20, borderRadius: 25, alignItems: 'center', elevation: 5, width: '80%' },
  shareBtn: { flexDirection: 'row', backgroundColor: '#FF8A00', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 15, gap: 8, marginTop: 20 },
  shareTxt: { color: 'white', fontWeight: 'bold' },

  // Player List
  playerListContainer: { width: '90%', marginTop: 30 },
  listTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15, color: '#444' },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  playerItem: { alignItems: 'center', flex: 1 },
  miniAvatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  playerName: { fontSize: 12, fontWeight: 'bold', color: '#FF00D6' },

  // Footer
  footer: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' },
  startBtn: { backgroundColor: '#FF00D6', paddingVertical: 18, width: '80%', borderRadius: 25, elevation: 8 },
  startBtnTxt: { color: 'white', fontWeight: '900', fontSize: 20, textAlign: 'center' }
});