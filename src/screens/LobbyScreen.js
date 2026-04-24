import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg'; // npx expo install react-native-qrcode-svg
import { Ionicons } from '@expo/vector-icons';

export default function LobbyScreen({ route, navigation }) {
  // navigation'dan gelen 'isHost' (Kurucu mu?) bilgisi
  const { isHost } = route.params || {};
  const [roomId] = useState(Math.random().toString(36).substring(7).toUpperCase());

  // Arkadaşa kod gönderme
  const onShare = async () => {
    try {
      await Share.share({
        message: `Meme Kapışması odama gel! Kodun: ${roomId}`,
      });
    } catch (error) { console.log(error.message); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isHost ? "ODAN HAZIR! 👑" : "LOBİYE GİRİLDİ"}</Text>
      
      {/* 📱 ARKADAŞINI ÇAĞIRMA ALANI */}
      <View style={styles.qrCard}>
        <QRCode value={roomId} size={150} color="#FF00D6" />
        <Text style={styles.codeText}>{roomId}</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
          <Ionicons name="share-social" size={20} color="white" />
          <Text style={styles.shareTxt}>Kodu Paylaş</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.waitingTxt}>Oyuncular bekleniyor... (1/4)</Text>

      {/* 🚀 OYUNA GİRİŞ */}
      <TouchableOpacity 
        style={styles.startBtn} 
        onPress={() => navigation.navigate('RoomScreen', { roomId })}
      >
        <Text style={styles.startBtnTxt}>OYUNU BAŞLAT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F9', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#FF00D6', marginBottom: 30 },
  qrCard: { backgroundColor: 'white', padding: 20, borderRadius: 30, alignItems: 'center', elevation: 10 },
  codeText: { fontSize: 32, fontWeight: '900', letterSpacing: 5, marginVertical: 15 },
  shareBtn: { flexDirection: 'row', backgroundColor: '#FF8A00', padding: 10, borderRadius: 15, gap: 8 },
  shareTxt: { color: 'white', fontWeight: 'bold' },
  waitingTxt: { marginTop: 20, color: '#888', fontWeight: '700' },
  startBtn: { marginTop: 40, backgroundColor: '#FF00D6', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 20 },
  startBtnTxt: { color: 'white', fontWeight: '900', fontSize: 18 }
});