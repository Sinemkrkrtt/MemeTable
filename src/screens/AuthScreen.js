import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image, KeyboardAvoidingView, Platform, Alert, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const { width } = Dimensions.get('window');

const theme = {
  white: '#FFFFFF',
  pink: '#FF69EB',
  orange: '#FFBF81',
  text: '#1F2937',
  grayText: '#9CA3AF',
  inputBg: '#F9FAFB',
};

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !nickname)) {
      Alert.alert("Eksik Bilgi", "Lütfen tüm alanları doldur tatlım.");
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: nickname });
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          nickname: nickname,
          email: email,
          createdAt: new Date(),
          score: 0
        });
      }
    } catch (error) {
      Alert.alert("Hata", "İşlem başarısız: " + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 1. KATMAN: Arka Plan Dekorları (Kodda en üstte olmalı) */}
      <View style={styles.circleBlur1} />
      <View style={styles.circleBlur2} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          {/* 2. KATMAN: İçerik */}
          <View style={styles.content}>
            
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/memeLogo.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>


            <View style={styles.formContainer}>
              {/* --- NICKNAME (Sadece Kayıt) --- */}
              {!isLogin && (
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={theme.pink} style={styles.icon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="Nickname (Oyuncu Adın)"
                    placeholderTextColor={theme.grayText}
                    value={nickname}
                    onChangeText={setNickname}
                  />
                </View>
              )}

              <View style={styles.inputWrapper}>
                <Ionicons name="mail-unread-outline" size={20} color={theme.pink} style={styles.icon} />
                <TextInput 
                  style={styles.input}
                  placeholder="E-posta Adresin"
                  placeholderTextColor={theme.grayText}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.pink} style={styles.icon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Şifren"
                  placeholderTextColor={theme.grayText}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={theme.grayText} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.buttonShadow} onPress={handleAuth} activeOpacity={0.9}>
              <LinearGradient colors={[theme.pink, theme.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mainButton}>
                <Text style={styles.buttonText}>{isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.footerLink}>
              <Text style={styles.footerText}>
                {isLogin ? 'Henüz bir hesabın yok mu? ' : 'Zaten hesabın var mı? '}
                <Text style={styles.footerLinkBold}>{isLogin ? 'Kayıt Ol' : 'Giriş Yap'}</Text>
              </Text>
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.white },
  
  circleBlur1: { 
    position: 'absolute', 
    top: -90,    // Biraz daha içeri aldık ki görünür olsun
    right: -60, 
    width: 250, 
    height: 230, 
    borderRadius: 140, 
    backgroundColor: theme.pink, 
    opacity: 0.2, // Opacity'yi %10'dan %20'ye çıkardım
  },

  circleBlur2: { 
    position: 'absolute', 
    bottom: -50, 
    left: -50, 
    width: 220, 
    height: 220, 
    borderRadius: 110, 
    backgroundColor: theme.orange, 
    opacity: 0.2, // Opacity'yi artırdım
  },

  content: { 
    flex: 1, 
    paddingHorizontal: 30, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'transparent' // Arkadaki daireleri görmesi için şeffaf olmalı
  },
  
  logoContainer: { 
    width: width * 0.85, 
    height: width * 0.68, 
    marginBottom: 5,
    marginTop: Platform.OS === 'ios' ? 0 : 0
  },
  
  logoImage: { width: '100%', height: '100%' },
  headerTextContainer: { alignItems: 'center', marginBottom: 20 },
  mainTitle: { fontSize: 26, fontWeight: '800', color: theme.text, letterSpacing: -0.5 },

  formContainer: { width: '100%', gap: 15, marginBottom: 20 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.inputBg, 
    height: 58, 
    borderRadius: 18, 
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: theme.text, fontWeight: '500' },

  buttonShadow: { width: '100%', shadowColor: theme.pink, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
  mainButton: { height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  footerLink: { marginTop: 20 },
  footerText: { fontSize: 14, color: theme.text },
  footerLinkBold: { color: theme.pink, fontWeight: 'bold' }
});