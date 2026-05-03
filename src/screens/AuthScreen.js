import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, 
  StatusBar, Dimensions, ActivityIndicator, ScrollView, Keyboard,
  Modal 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const theme = {
  white: '#FFFFFF',
  pink: '#FF69EB',
  orange: '#FFBF81',
  deepText: '#0F172A',
  subText: '#64748B',
  inputBg: '#F8FAFC',
  border: '#E2E8F0',
};

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyboardStatus, setKeyboardStatus] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardStatus(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardStatus(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const showAlert = (title, message) => {
    setAlertConfig({ title, message });
    setAlertVisible(true);
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      showAlert("E-posta Gerekli", "Şifreni sıfırlamak için önce e-posta adresini yazmalısın.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      showAlert("Bağlantı Gönderildi", "Sıfırlama e-postası gönderildi. Lütfen kutunu kontrol et!");
    } catch (error) {
      showAlert("Hata", "Sıfırlama e-postası gönderilemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password || (!isLogin && !nickname)) {
      showAlert("Eksik Bilgi", "Lütfen tüm alanları doldur.");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: nickname });
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid, nickname, email: cleanEmail, createdAt: new Date(),
          coins: 100, diamonds: 10, joker_skip: 1, joker_double: 1, joker_freeze: 1,
          wonHearts: 0, isBoxOpened: false, level: 1, experience: 0
        });
      }
    } catch (error) {
      let errorMsg = "E-posta veya şifre hatalı.";
      if (error.code === 'auth/email-already-in-use') errorMsg = "Bu hesap zaten kayıtlı.";
      showAlert("Hata", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/*CUSTOM ALERT MODAL */}
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertContainer}>
            <LinearGradient colors={[theme.pink, theme.orange]} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.alertHeaderIcon}>
              <Ionicons name="notifications-outline" size={32} color="white" />
            </LinearGradient>
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={() => setAlertVisible(false)}>
              <LinearGradient colors={[theme.pink, theme.orange]} style={styles.alertButtonGradient}>
                <Text style={styles.alertButtonText}>Tamam</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.circleBlur2} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
            <View style={styles.content}>
              
              <View style={[styles.logoContainer, keyboardStatus && { height: height * 0.15, marginBottom: 10 }]}>
                <Image source={require('../../assets/homeLogo.png')} style={styles.logoImage} resizeMode="contain" />
              </View>

              <View style={styles.headerTextGroup}>
                <Text style={styles.mainTitle}>{isLogin ? 'Hoş Geldin!' : 'Aramıza Katıl'}</Text>
                <Text style={styles.subTitle}>{isLogin ? 'Meme dünyasına kaldığın yerden devam et.' : 'En komik masada yerini hemen ayırt.'}</Text>
              </View>

              <View style={styles.formContainer}>
                {!isLogin && (
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color={theme.pink} />
                    <TextInput style={styles.input} placeholder="Nickname" placeholderTextColor={theme.subText} value={nickname} onChangeText={setNickname} />
                  </View>
                )}

                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={theme.pink} />
                  <TextInput style={styles.input} placeholder="E-posta" placeholderTextColor={theme.subText} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.pink} />
                  <TextInput style={styles.input} placeholder="Şifre" placeholderTextColor={theme.subText} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.subText} />
                  </TouchableOpacity>
                </View>

                {isLogin && (
                  <TouchableOpacity style={styles.forgotPass} onPress={handleForgotPassword}>
                    <Text style={styles.forgotPassText}>Şifremi Unuttum</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={styles.buttonShadow} onPress={handleAuth} activeOpacity={0.85} disabled={loading}>
                <LinearGradient colors={[theme.pink, theme.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mainButton}>
                  {loading ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.buttonText}>{isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.footerLink}>
                <Text style={styles.footerText}>{isLogin ? 'Hesabın yok mu? ' : 'Zaten üye misin? '}<Text style={styles.footerLinkBold}>{isLogin ? 'Kayıt Ol' : 'Giriş Yap'}</Text></Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // --- ANA KONTEYNER VE ARKA PLAN ---
  container: { 
    flex: 1, 
    backgroundColor: theme.white 
  },
  circleBlur2: { 
    position: 'absolute', 
    bottom: -70, 
    left: -60, 
    width: 240, 
    height: 240, 
    borderRadius: 120, 
    backgroundColor: theme.orange, 
    opacity: 0.15 
  },

  // --- İÇERİK YAPISI ---
  content: { 
    flex: 1, 
    paddingHorizontal: 28, 
    paddingBottom: 30, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  logoContainer: { 
    width: width * 0.8, 
    height: width * 0.55, 
    marginBottom: 20 
  },
  logoImage: { 
    width: '100%', 
    height: '100%' 
  },

  // --- METİN GRUPLARI ---
  headerTextGroup: { 
    width: '100%', 
    marginBottom: 30, 
    alignItems: 'center' 
  },
  mainTitle: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: '#424242', 
    marginBottom: 8 
  },
  subTitle: { 
    fontSize: 15, 
    color: theme.subText, 
    textAlign: 'center', 
    fontWeight: '500' 
  },

  // --- FORM VE GİRDİ ALANLARI ---
  formContainer: { 
    width: '100%', 
    marginBottom: 25 
  },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.inputBg, 
    height: 62, 
    borderRadius: 20, 
    paddingHorizontal: 20, 
    marginBottom: 16, 
    borderWidth: 1.5, 
    borderColor: theme.border 
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: theme.deepText, 
    fontWeight: '600', 
    marginLeft: 12 
  },

  // --- ŞİFRE UNUTTUM VE BUTONLAR ---
  forgotPass: { 
    alignSelf: 'flex-end', 
    marginTop: -4, 
    paddingVertical: 5 
  },
  forgotPassText: { 
    color: theme.pink, 
    fontWeight: '700', 
    fontSize: 14 
  },
  buttonShadow: { 
    width: '100%', 
    shadowColor: theme.pink, 
    shadowOpacity: 0.4, 
    shadowRadius: 12, 
    shadowOffset: { width: 0, height: 6 }, 
    elevation: 10 
  },
  mainButton: { 
    height: 64, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  buttonText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: '800' 
  },

  // --- FOOTER (ALT KISIM) ---
  footerLink: { 
    marginTop: 25, 
    padding: 10 
  },
  footerText: { 
    fontSize: 15, 
    color: theme.subText, 
    fontWeight: '500' 
  },
  footerLinkBold: { 
    color: theme.pink, 
    fontWeight: '800' 
  },

  // 🚀 ALERT (UYARI) MODAL STİLLERİ
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  alertContainer: { 
    width: width * 0.85, 
    backgroundColor: 'white', 
    borderRadius: 30, 
    padding: 25, 
    alignItems: 'center', 
    elevation: 20 
  },
  alertHeaderIcon: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20, 
    marginTop: -60, 
    borderWidth: 5, 
    borderColor: 'white' 
  },
  alertTitle: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: theme.deepText, 
    marginBottom: 10 
  },
  alertMessage: { 
    fontSize: 14, 
    color: theme.subText, 
    textAlign: 'center', 
    lineHeight: 20, 
    marginBottom: 25 
  },
  alertButton: { 
    width: '100%', 
    height: 50, 
    borderRadius: 15, 
    overflow: 'hidden' 
  },
  alertButtonGradient: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  alertButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});