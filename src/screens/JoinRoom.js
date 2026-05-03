import React, { useState, useEffect } from 'react'; 
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, StatusBar,ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { ref, get } from 'firebase/database';
import { auth, database } from '../services/firebase'; // 🚀 db yerine database (Realtime DB) kullanıyoruz
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function JoinRoom({ navigation, route }) {
  const clickSound = useAudioPlayer(require('../../assets/sounds/click.mp3'));
  const readySound = useAudioPlayer(require('../../assets/sounds/ready.mp3'));
  const joinSound = useAudioPlayer(require('../../assets/sounds/join.mp3'));
  const startSound = useAudioPlayer(require('../../assets/sounds/start.mp3'));
  const errorSound = useAudioPlayer(require('../../assets/sounds/error.mp3'));

  const playSound = (type) => {
    try {
      if (type === 'click') { clickSound.seekTo(0); clickSound.play(); }
      else if (type === 'ready') { readySound.seekTo(0); readySound.play(); }
      else if (type === 'join') { joinSound.seekTo(0); joinSound.play(); }
      else if (type === 'start') { startSound.seekTo(0); startSound.play(); }
      else if (type === 'error') { errorSound.seekTo(0); errorSound.play(); }
    } catch (error) {
      console.log("Ses hatası:", error);
    }
  };

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

  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');

 const handleJoinRoom = async (rawData) => {
    if (!rawData || rawData.trim().length === 0 || scanned) return;
    
    setScanned(true); 
    let code = rawData.trim();

    // Link üzerinden geliyorsa son kısmı al
    if (code.includes('://')) {
      const parts = code.split('/');
      code = parts[parts.length - 1]; 
    }

    const cleanCode = code.toUpperCase().trim();

    // 🚀 DÜZELTİLDİ: Sadece A-Z harfler ve 0-9 rakamlara izin ver (Örn: 5 veya 6 haneli oda kodu)
    const roomCodeRegex = /^[A-Z0-9]{4,8}$/; // Oda kodun kaç haneliyse 4,8 arasını ona göre ayarlayabilirsin
    if (!roomCodeRegex.test(cleanCode)) {
      playSound('error');
      alert("Geçersiz Kod! Lütfen geçerli bir oda kodu girin veya okutun.");
      setTimeout(() => setScanned(false), 2000); 
      return; 
    }

   try {
      // 🚀 DÜZELTİLDİ: Firestore yerine Realtime Database'den oda kontrolü yapıyoruz!
      const roomRef = ref(database, `rooms/${cleanCode}`); 
      const roomSnap = await get(roomRef);

      if (!roomSnap.exists()) {
        playSound('error');
        alert("Oda bulunamadı veya kapanmış! Kodun doğruluğundan emin ol.");
        setTimeout(() => setScanned(false), 2000);
        return;
      }

      // Oda varsa işlemlere devam et
      playSound('join');

      const params = route.params || {};
      const selectedAvatar = params.userAvatar || params.myAvatarSeed || 'Oliver';
      const currentUserName = params.myName || auth.currentUser?.displayName || 'Oyuncu';

      navigation.replace('LobbyScreen', { 
        roomId: cleanCode, 
        isHost: false,
        myName: currentUserName, 
        userAvatar: selectedAvatar,
        myAvatarSeed: selectedAvatar
      });
      
    } catch (error) {
      console.log("Oda kontrol hatası:", error);
      playSound('error');
      alert("Bağlantı hatası oluştu, lütfen tekrar dene.");
      setTimeout(() => setScanned(false), 2000);
    }
  };
   
  const handleBackPress = () => {
    playSound('click');
    navigation.goBack();
  };

  const handleManualJoin = () => {
    if (manualCode.length < 3) {
       playSound('error');
       return;
    }
    playSound('click');
    handleJoinRoom(manualCode);
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <LinearGradient colors={['#FF69EB', '#FFA3A5']} style={styles.permissionBg} />
        <View style={styles.permissionCard}>
          <Ionicons name="camera" size={80} color="#FF69EB" style={{marginBottom: 20}} />
          <Text style={styles.permissionTitle}>Kamera İzni Gerekli</Text>
          <Text style={styles.permissionText}>Odalara QR kod ile hızlıca katılabilmek için kameralara erişmemiz gerekiyor! 📸</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={() => {
              playSound('click'); // 🔊 İZİN BUTONU SESİ
              requestPermission();
          }}>
            <LinearGradient colors={['#FFBF81', '#FF69EB']} style={styles.btnGradient} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
              <Text style={styles.permissionBtnText}>İzin Ver</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />

      <View style={styles.headerNav}>
         <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
           <Ionicons name="chevron-back" size={24} color="#1F2937" />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>ODAYA KATIL</Text>
         <View style={{width: 40}} /> 
      </View>

        {/* 🚀 EKLENDİ: ScrollView ile klavye açıldığında ekranın kayması sağlandı */}
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" // Klavye açıkken butona basılabilmesini sağlar
      >

      <View style={styles.content}>
        
        <View style={styles.scannerWrapper}>
          <View style={styles.scannerOutline}>
            {isFocused && (
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanned ? undefined : ({ data }) => handleJoinRoom(data)}
            />
          )}
            {/* 🎨 ODAK KÖŞELERİ - FFDC5E (Sarı Tonu) */}
            <View style={[styles.corner, styles.topLeft, { borderColor: '#FFDC5E' }]} />
            <View style={[styles.corner, styles.topRight, { borderColor: '#FFDC5E' }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: '#FFDC5E' }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor: '#FFDC5E' }]} />
          </View>
          <Text style={styles.scannerHint}>Oda kodunu taratmak için kamerayı hizala</Text>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>VEYA</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.manualInputContainer}>
          <Text style={styles.inputLabel}>Oda Kodunu Gir</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="keypad" size={20} color="#FF69EB" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="ÖR: X7B9K"
              placeholderTextColor="#9CA3AF"
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              maxLength={10}
            />
          </View>

          <TouchableOpacity 
            style={[styles.joinBtnContainer, manualCode.length < 3 && { opacity: 0.5 }]} 
            disabled={manualCode.length < 3}
            onPress={handleManualJoin}
          >
            <LinearGradient colors={['#FFBF81', '#FF69EB']} style={styles.joinBtnGradient}>
              <Text style={styles.joinBtnText}>MASAYA OTUR</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  // --- ANA KONTEYNER VE NAVİGASYON ---
  container: { 
    flex: 1, 
    backgroundColor: '#F3F4F6' 
  },
  headerNav: { 
    flexDirection: 'row', 
    width: '100%', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 20, 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  headerTitle: { 
    color: '#1F2937', 
    fontSize: 16, 
    fontWeight: '800', 
    letterSpacing: 1.5 
  },

  // --- İÇERİK VE TARAYICI (SCANNER) ---
  content: { 
    flex: 1, 
    paddingHorizontal: 24, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  scannerWrapper: { 
    alignItems: 'center', 
    marginBottom: 30 
  },
  scannerOutline: { 
    width: width * 0.7, 
    height: width * 0.7, 
    borderRadius: 30, 
    overflow: 'hidden', 
    position: 'relative', 
    shadowColor: '#FF69EB', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 20, 
    elevation: 10 
  },
  camera: { 
    flex: 1 
  },

  // --- TARAYICI KÖŞE ÇİZGİLERİ ---
  corner: { 
    position: 'absolute', 
    width: 40, 
    height: 40, 
    borderWidth: 5 
  },
  topLeft: { 
    top: 20, 
    left: 20, 
    borderBottomWidth: 0, 
    borderRightWidth: 0, 
    borderTopLeftRadius: 15 
  },
  topRight: { 
    top: 20, 
    right: 20, 
    borderBottomWidth: 0, 
    borderLeftWidth: 0, 
    borderTopRightRadius: 15 
  },
  bottomLeft: { 
    bottom: 20, 
    left: 20, 
    borderTopWidth: 0, 
    borderRightWidth: 0, 
    borderBottomLeftRadius: 15 
  },
  bottomRight: { 
    bottom: 20, 
    right: 20, 
    borderTopWidth: 0, 
    borderLeftWidth: 0, 
    borderBottomRightRadius: 15 
  },
  scannerHint: { 
    marginTop: 16, 
    fontSize: 13, 
    color: '#6B7280', 
    fontWeight: '500' 
  },

  // --- AYIRAÇ (DIVIDER) ---
  dividerContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: '100%', 
    marginBottom: 30, 
    paddingHorizontal: 20 
  },
  dividerLine: { 
    flex: 1, 
    height: 1, 
    backgroundColor: '#E5E7EB' 
  },
  dividerText: { 
    marginHorizontal: 15, 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#9CA3AF', 
    letterSpacing: 1 
  },

  // --- MANUEL GİRİŞ FORMU ---
  manualInputContainer: { 
    width: '100%', 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 24, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    elevation: 3 
  },
  inputLabel: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#4B5563', 
    marginBottom: 10, 
    letterSpacing: 0.5 
  },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F9FAFB', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    marginBottom: 16 
  },
  inputIcon: { 
    marginRight: 10 
  },
  textInput: { 
    flex: 1, 
    height: 55, 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#111827', 
    letterSpacing: 2 
  },

  // --- BUTONLAR ---
  joinBtnContainer: { 
    height: 55, 
    borderRadius: 16, 
    shadowColor: '#FF69EB', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 5 
  },
  joinBtnGradient: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 16, 
    gap: 10 
  },
  joinBtnText: { 
    color: 'white', 
    fontWeight: '800', 
    fontSize: 15, 
    letterSpacing: 1 
  },

  // --- İZİN EKRANI (PERMISSION) ---
  permissionContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F3F4F6' 
  },
  permissionBg: { 
    position: 'absolute', 
    top: 0, 
    width: '100%', 
    height: '40%', 
    borderBottomLeftRadius: 50, 
    borderBottomRightRadius: 50 
  },
  permissionCard: { 
    backgroundColor: '#FFF', 
    width: '85%', 
    padding: 30, 
    borderRadius: 30, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 20, 
    elevation: 10 
  },
  permissionTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#1F2937', 
    marginBottom: 10 
  },
  permissionText: { 
    fontSize: 14, 
    color: '#6B7280', 
    textAlign: 'center', 
    marginBottom: 30, 
    lineHeight: 22 
  },
  permissionBtn: { 
    width: '100%', 
    height: 55, 
    borderRadius: 16, 
    shadowColor: '#FF69EB', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 5 
  },
  btnGradient: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 16 
  },
  permissionBtnText: { 
    color: 'white', 
    fontWeight: '800', 
    fontSize: 16, 
    letterSpacing: 1 
  }
});