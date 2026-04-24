import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// 1. Resim Listesi (require ile yerel assetler)
const AVATAR_LIST = [
  { id: '1', source: require('../../assets/avatar1.JPG'), label: 'Savaşçı' },
  { id: '2', source: require('../../assets/avatar2.JPG'), label: 'Gezgin' },
  { id: '3', source: require('../../assets/avatar3.JPG'), label: 'Bilge' },
  { id: '4', source: require('../../assets/avatar4.JPG'), label: 'Hacker' },
];

export default function AvatarScreen({ navigation }) {
  const [selectedId, setSelectedId] = useState('1');

  const handleConfirm = () => {
    const selectedAvatar = AVATAR_LIST.find(a => a.id === selectedId);
    // Seçilen avatarı bir önceki ekrana (Lobby) parametre olarak gönderiyoruz
    navigation.navigate('Lobby', { userAvatar: selectedAvatar.source });
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      
      {/* 2. BÜYÜK ÖNİZLEME ALANI */}
      <View style={styles.previewContainer}>
        <Text style={styles.title}>Karakterini Belirle</Text>
        <View style={styles.previewCircle}>
          <Image 
            source={AVATAR_LIST.find(a => a.id === selectedId).source} 
            style={styles.previewImage} 
          />
        </View>
        <Text style={styles.avatarLabel}>
          {AVATAR_LIST.find(a => a.id === selectedId).label}
        </Text>
      </View>

      {/* 3. SEÇİM LİSTESİ */}
      <FlatList
        data={AVATAR_LIST}
        numColumns={3}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSelected = item.id === selectedId;
          return (
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => setSelectedId(item.id)}
              style={[styles.avatarCard, isSelected && styles.selectedCard]}
            >
              <Image source={item.source} style={styles.avatarThumb} />
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#00f2fe" />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* 4. ONAY BUTONU */}
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
        <LinearGradient colors={['#00f2fe', '#4facfe']} style={styles.gradientBtn}>
          <Text style={styles.btnText}>HAZIRIM!</Text>
        </LinearGradient>
      </TouchableOpacity>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  previewContainer: { alignItems: 'center', marginBottom: 30 },
  title: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  previewCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: '#4facfe',
    overflow: 'hidden',
    backgroundColor: '#333'
  },
  previewImage: { width: '100%', height: '100%' },
  avatarLabel: { color: '#4facfe', fontSize: 18, marginTop: 10, fontWeight: '600' },
  listContent: { paddingHorizontal: 20, alignItems: 'center' },
  avatarCard: {
    width: width / 3 - 30,
    height: width / 3 - 30,
    margin: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden'
  },
  selectedCard: { borderColor: '#00f2fe', transform: [{ scale: 1.05 }] },
  avatarThumb: { width: '100%', height: '100%' },
  checkBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#FFF', borderRadius: 12 },
  confirmButton: { marginHorizontal: 40, marginBottom: 40, height: 55, borderRadius: 30, overflow: 'hidden' },
  gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' }
});