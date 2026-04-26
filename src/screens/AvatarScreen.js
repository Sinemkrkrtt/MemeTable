import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackActions } from '@react-navigation/native'; 
// 🔥 EKLEME: Firebase güncellenmesi için gerekli importlar
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

const { width } = Dimensions.get('window');

const AVATAR_LIST = [
  'Oliver', 'Willow', 'Felix', 'Jack', 'Luna', 'Zoe', 'Milo', 'Ash', 'Ruby',
  'Jasper', 'Sasha', 'Leo', 'Nala', 'Simba', 'Buster', 'Molly', 'Coco', 'Shadow'
];

export default function AvatarScreen({ navigation, route }) {
  const [selected, setSelected] = useState('Oliver');

  const handleConfirm = async () => { 
    const { nextScreen, extraParams } = route.params || {};
    
    // 🔥 EKLEME: Seçilen avatarı Firebase'e kaydet (Böylece her yerde güncel kalır)
    const user = auth.currentUser;
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { avatarSeed: selected });
      } catch (error) {
        console.log("Avatar kaydedilemedi:", error);
      }
    }
    
    // 🚀 DÜZELTME: İsmi ararken önce extraParams'a (JoinRoom'dan gelen), 
    // sonra route.params'a (Home'dan gelen), en son Firebase Auth'a bakarız.
    const currentName = extraParams?.myName || route.params?.myName || auth.currentUser?.displayName || 'Oyuncu';

    if (nextScreen) {
      navigation.dispatch(
        StackActions.replace(nextScreen, {
          ...extraParams,
          // 🚀 KRİTİK DÜZELTME: Hem 'userAvatar' hem 'myAvatarSeed' gönderiyoruz 
          // Böylece RoomScreen (myAvatarSeed) ve Lobby (userAvatar) ikisi de mutlu olur.
          userAvatar: selected, 
          myAvatarSeed: selected, 
          myName: currentName // 🎯 Sabit "Sinem" yazısı kaldırıldı, dinamik isim bağlandı!
        })
      );
    } else {
      navigation.navigate('Home');
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selected === item;
    return (
      <TouchableOpacity 
        style={[styles.card, isSelected && styles.selectedCard]} 
        onPress={() => setSelected(item)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: `https://api.dicebear.com/7.x/adventurer/png?seed=${item}&backgroundColor=ffffff` }} 
          style={[styles.avatarImage, isSelected && { transform: [{ scale: 1.15 }] }]} 
        />
        {isSelected && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.minimalHeader}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Karakter Seçimi</Text>
        <View style={{ width: 44 }} /> 
      </View>

      <View style={styles.showcase}>
        <View style={styles.previewRing}>
           <Image 
              source={{ uri: `https://api.dicebear.com/7.x/adventurer/png?seed=${selected}&backgroundColor=ffffff` }} 
              style={styles.previewImage} 
            />
        </View>
        <Text style={styles.instructionText}>Masadaki yeni tarzını belirle</Text>
      </View>

      <FlatList
        data={AVATAR_LIST}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        numColumns={3}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.premiumButton} onPress={handleConfirm} activeOpacity={0.8}>
          <LinearGradient 
            colors={['#FF00D6', '#FF69EB']} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>MASAYA KATIL</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  minimalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: 'Nunito_900Black', color: '#1D1D1F' },
  showcase: { alignItems: 'center', paddingVertical: 25 },
  previewRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFF',
    elevation: 20,
    shadowColor: '#FF00D6',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  previewImage: { width: 120, height: 120 },
  instructionText: { marginTop: 15, fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: '#8E8E93' },
  listPadding: { paddingHorizontal: 20, paddingBottom: 140 },
  card: {
    flex: 1,
    aspectRatio: 1,
    margin: 8,
    borderRadius: 24,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  selectedCard: {
    backgroundColor: '#FFF',
    borderColor: '#FF00D6',
    shadowColor: '#FF00D6',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  avatarImage: { width: '85%', height: '85%' },
  activeIndicator: { 
    position: 'absolute', 
    bottom: 12, 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: '#FF00D6' 
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 25,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  premiumButton: {
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF00D6',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Nunito_900Black',
  }
});