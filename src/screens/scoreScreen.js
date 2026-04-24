import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const ScoreScreen = ({ scores, navigation, onNewGame }) => {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  return (
    // 🔥 Overlay tüm ekranı kaplar ve arkayı karartır
    <View style={styles.overlay}>
      <LinearGradient colors={['rgba(10, 5, 20, 0.85)', 'rgba(25, 15, 35, 0.95)']} style={StyleSheet.absoluteFill} />
      
      {/* 🎯 PENCERE BURASI (Modal Window) */}
      <View style={styles.modalWindow}>
        <View style={styles.header}>
           <Text style={styles.headerSubtitle}>MAÇ SONA ERDİ</Text>
           <Text style={styles.headerTitle}>TUR SIRALAMASI</Text>
        </View>

        <View style={styles.podiumContainer}>
          {sorted.map(([name, score], index) => {
            const isFirst = index === 0;
            return (
              <View key={name} style={[styles.podiumCard, isFirst && styles.firstCard]}>
                {isFirst && <Text style={styles.crown}>👑</Text>}
                <View style={[styles.rankBadge, { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }]}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <Text style={[styles.playerName, isFirst && styles.winnerText]} numberOfLines={1}>
                   {name === 'Ben' ? 'SENSİN' : name.toUpperCase()}
                </Text>
                <Text style={styles.scoreText}>{score} PUAN</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.exitText}>AYRIL</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.playBtn} onPress={onNewGame}>
            <LinearGradient colors={['#FF69EB', '#FF00D6']} style={styles.playGradient}>
              <Text style={styles.playText}>YENİ OYUN</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999999,
  },
  modalWindow: {
    width: '60%', // Genişliği yatay ekranın %85'i yaptık
    height: '85%', // Yüksekliği %80 yaptık (Pencere formu oluştu)
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#FF69EB',
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: { alignItems: 'center' },
  headerSubtitle: { color: '#AAA', fontWeight: '900', fontSize: 10, letterSpacing: 2 },
  headerTitle: { color: '#FF69EB', fontWeight: '900', fontSize: 22, letterSpacing: 3 },
  podiumContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', width: '100%', height: '50%', gap: 10 },
  podiumCard: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 20, padding: 10, alignItems: 'center', height: '80%' },
  firstCard: { height: '100%', borderColor: '#FFD700', borderWidth: 2, backgroundColor: '#FFFBEB', transform: [{ scale: 1.05 }] },
  rankBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  rankText: { fontSize: 12, fontWeight: '900' },
  playerName: { fontSize: 16, fontWeight: '800', color: '#555' },
  winnerText: { color: '#D4AF37', fontWeight: '900' },
  scoreText: { fontSize: 13, fontWeight: '900', color: '#333' },
  crown: { position: 'absolute', top: -25, fontSize: 30 },
  actionRow: { flexDirection: 'row', gap: 20, width: '100%', justifyContent: 'center', marginBottom: 10 },
  exitBtn: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 15, backgroundColor: '#EEE' },
  exitText: { color: '#888', fontWeight: '900' },
  playBtn: { width: 200, borderRadius: 15, overflow: 'hidden' },
  playGradient: { paddingVertical: 12, alignItems: 'center' },
  playText: { color: '#FFF', fontWeight: '900' }
});

export default ScoreScreen;