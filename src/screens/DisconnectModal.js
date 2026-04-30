import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const DisconnectModal = ({ visible, onQuit }) => {
  // 🎨 Yeni Senior Palet: Canlı Pembe -> Sıcak Turuncu
  const gradientColors = ['#FF45E6','#FF69EB', '#FF9A6A', '#FA7D43']; 

  // 🚀 ANİMASYON DEĞERİ (Pulse Efekti İçin)
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Noktanın nefes alıp vermesi için sonsuz döngü
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3, // Şeffaflaş ve
            duration: 800, // 0.8 saniyede
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1, // Geri belirginleş
            duration: 800,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1); // Modal kapanırsa animasyonu sıfırla
    }
  }, [visible, pulseAnim]);

  return (
    <Modal 
      transparent 
      visible={visible} 
      animationType="fade"
      supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']} 
    >
      <View style={styles.overlay}>
        {/* Modern şık bir gölge için arka plan kartı */}
        <View style={styles.glassContainer}>
          <View style={styles.modalContent}>
            
            {/* 🚀 SAĞA ÇARPI BUTONU (QUIT) */}
            <TouchableOpacity style={styles.closeButton} onPress={onQuit} activeOpacity={0.7}>
              <Ionicons name="close" size={26} color="#CCCCCC" />
            </TouchableOpacity>

            {/* İkonun Yarısı Dışarıda Kalan Şık Tasarım (Pembe-Turuncu) */}
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconBg}
            >
              <Ionicons name="cloud-offline-outline" size={40} color="white" style={styles.iconShadow} />
            </LinearGradient>
            
            {/* Yazı Alanı */}
            <View style={styles.textStack}>
              <Text style={styles.title}>Bağlantı Kesildi!</Text>
              <Text style={styles.desc}>
                İnternet bağlantını kontrol ediyoruz. Lütfen odadan ayrılma, seni tekrar bağlamaya çalışıyoruz...
              </Text>
            </View>

            {/* Durum Alanı (Animasyonlu) */}
            <View style={styles.statusBox}>
              <Animated.View 
                style={[
                  styles.pulseCircle, 
                  { 
                    backgroundColor: '#FF69EB',
                    opacity: pulseAnim, // 🚀 Şeffaflık animasyonu
                    transform: [{ scale: pulseAnim }] // 🚀 Büyüyüp küçülme animasyonu
                  }
                ]} 
              />
              <Text style={styles.reconnectingText}>Yeniden bağlanıyor...</Text>
            </View>

          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 15, 25, 0.9)', // Daha koyu, sofistike bir arka plan
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassContainer: {
    width: '60%', // Yatay ekrana uygun genişlik
    backgroundColor: 'white',
    borderRadius: 35,
    padding: 3,
    shadowColor: "#FF69EB", 
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 32,
    paddingVertical: 35,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 10,
    padding: 5,
  },
  iconBg: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -75, 
    borderWidth: 6,
    borderColor: 'white',
    shadowColor: "#FF9A6A",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  iconShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },
  textStack: {
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontFamily: 'Nunito_900Black', 
    fontSize: 24,
    color: '#1F1724',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  desc: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 10,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  pulseCircle: {
    width: 10, // Animasyon belli olsun diye çok ufak büyüttüm
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  reconnectingText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 13,
    color: '#FF758C', 
  },
});

export default DisconnectModal;