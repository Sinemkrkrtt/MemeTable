import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const DisconnectModal = ({ visible }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.disconnectOverlay}>
        <View style={styles.disconnectContainer}>
          {/* İkonun Yarısı Dışarıda Kalan Şık Tasarım */}
          <LinearGradient
            colors={['#FF86C8', '#FF69EB']}
            style={styles.disconnectIconBg}
          >
            <Ionicons name="cloud-offline-outline" size={40} color="white" />
          </LinearGradient>
          
          <Text style={styles.disconnectTitle}>Bağlantı Kesildi!</Text>
          <Text style={styles.disconnectDesc}>
            İnternet bağlantını kontrol ediyoruz. Lütfen odadan ayrılma, seni tekrar bağlamaya çalışıyoruz...
          </Text>

          <View style={styles.loadingContainer}>
            <Text style={styles.reconnectingText}>Yeniden bağlanıyor...</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  disconnectOverlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 23, 36, 0.85)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  disconnectContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 30,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  disconnectIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -70, // Senior dokunuş: Dışarı taşan ikon
    borderWidth: 5,
    borderColor: 'white',
  },
  disconnectTitle: {
    fontFamily: 'Nunito_900Black', // Projenin fontuyla uyumlu
    fontSize: 22,
    color: '#1F1724',
    marginBottom: 10,
  },
  disconnectDesc: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 15,
  },
  reconnectingText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 12,
    color: '#FF69EB',
  },
});

export default DisconnectModal;