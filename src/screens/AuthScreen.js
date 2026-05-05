import React, { useState, useEffect, useRef } from 'react'; // 🚀 useRef EKLENDİ
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, 
  StatusBar, Dimensions, ActivityIndicator, ScrollView, Keyboard,
  Modal, Animated // 🚀 Animated EKLENDİ
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail,
  signInAnonymously 
} from "firebase/auth";
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, setDoc } from "firebase/firestore";
import { api, describeApiError } from '../services/api';

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
  const logoAnimHeight = useRef(new Animated.Value(width * 0.55)).current;
  const logoAnimMargin = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardStatus(true);
      // Klavye açılınca yumuşakça küçült
      Animated.parallel([
        Animated.timing(logoAnimHeight, {
          toValue: height * 0.12,
          duration: 250, // Saniye cinsinden hız (250ms = çeyrek saniye)
          useNativeDriver: false,
        }),
        Animated.timing(logoAnimMargin, {
          toValue: 5,
          duration: 250,
          useNativeDriver: false,
        })
      ]).start();
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardStatus(false);
      // Klavye kapanınca yumuşakça eski haline getir
      Animated.parallel([
        Animated.timing(logoAnimHeight, {
          toValue: width * 0.55,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(logoAnimMargin, {
          toValue: 15,
          duration: 250,
          useNativeDriver: false,
        })
      ]).start();
    });

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
      setEmail('');
    } catch (error) {
      let msg = "Sıfırlama e-postası gönderilemedi.";
      switch (error.code) {
        case 'auth/user-not-found':
          msg = "Bu e-posta ile kayıtlı bir hesap bulunamadı.";
          break;
        case 'auth/invalid-email':
          msg = "Geçersiz bir e-posta adresi.";
          break;
        case 'auth/network-request-failed':
          msg = "İnternet bağlantını kontrol et ve tekrar dene.";
          break;
        case 'auth/too-many-requests':
          msg = "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar dene.";
          break;
      }
      showAlert("Hata", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    let createdUser = null;
    try {
      const userCredential = await signInAnonymously(auth);
      createdUser = userCredential.user;

      const guestNickname = "Misafir_" + createdUser.uid.substring(0, 4).toUpperCase();
      await updateProfile(createdUser, { displayName: guestNickname });

      await setDoc(doc(db, "users", createdUser.uid), {
        uid: createdUser.uid,
        nickname: guestNickname,
        email: "Misafir Hesabı",
        isGuest: true,
        guestMatchesLeft: 3,
        createdAt: new Date(),
        coins: 0,
        diamonds: 0,
        joker_skip: 0,
        joker_double: 0,
        joker_freeze: 0,
        wonHearts: 0,
        isBoxOpened: false,
        level: 1,
        experience: 0,
      }, { merge: true });

    } catch (error) {
      console.log("Misafir Girişi Hatası:", error);
      // Auth oluştu ama Firestore yazımı düştüyse anonymous user'ı temizle (orphan kalmasın)
      if (createdUser) {
        try { await createdUser.delete(); }
        catch (delErr) {
          console.warn('Anonymous user silinemedi, signOut deneniyor:', delErr);
          try { await auth.signOut(); } catch {}
        }
      }
      showAlert("Hata", "Misafir girişi yapılamadı. Bağlantını kontrol et.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    const cleanEmail = email.trim();
    const cleanNickname = nickname.trim();

    if (!cleanEmail || !password || (!isLogin && !cleanNickname)) {
      showAlert("Eksik Bilgi", "Lütfen tüm alanları doldur.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      showAlert("Geçersiz E-posta", "Lütfen geçerli bir e-posta adresi yaz.");
      return;
    }

    if (password.length < 6) {
      showAlert("Zayıf Şifre", "Şifren en az 6 karakter uzunluğunda olmalıdır.");
      return;
    }

    if (!isLogin) {
      if (cleanNickname.length < 3 || cleanNickname.length > 12) {
        showAlert("Geçersiz İsim", "Kullanıcı adın 3 ile 12 karakter arasında olmalıdır.");
        return;
      }
      const nicknameRegex = /^[a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]+$/;
      if (!nicknameRegex.test(cleanNickname)) {
        showAlert("Geçersiz Karakter", "İsminde boşluk veya özel semboller (!, @, vs.) kullanamazsın.");
        return;
      }
    }

    setLoading(true);
    let createdUser = null;
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      } else {
        // Sıra: 1) auth oluştur 2) nickname server-side rezerve et (atomik) 3) Firestore profil
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        createdUser = userCredential.user;

        try {
          // Atomik benzersizlik kontrolü — Cloud Function nicknames/{lowercase} doc'a yazıyor
          await api.reserveNickname({ nickname: cleanNickname });
          await updateProfile(createdUser, { displayName: cleanNickname });
          await setDoc(doc(db, "users", createdUser.uid), {
            uid: createdUser.uid,
            nickname: cleanNickname,
            email: cleanEmail,
            createdAt: new Date(),
            coins: 100, diamonds: 10, joker_skip: 1, joker_double: 1, joker_freeze: 1,
            wonHearts: 0, isBoxOpened: false, level: 1, experience: 0,
          });
        } catch (writeErr) {
          console.warn('Kayıt sonrası yazma başarısız, hesap geri alınıyor:', writeErr);
          try { await createdUser.delete(); }
          catch (delErr) {
            console.warn('Hesap silinemedi, signOut deneniyor:', delErr);
            try { await auth.signOut(); } catch {}
          }
          throw writeErr;
        }
      }
    } catch (error) {
      console.log("Kimlik Doğrulama Hatası:", error);
      let errorMsg = isLogin ? "Giriş başarısız oldu." : "Kayıt işlemi gerçekleştirilemiyor.";

      switch (error.code) {
        case 'already-exists':
          errorMsg = "Bu nickname kullanılıyor. Başka bir isim dene.";
          break;
        case 'auth/email-already-in-use':
          errorMsg = "Bu e-posta adresi zaten kullanımda.";
          break;
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          errorMsg = "E-posta veya şifren hatalı.";
          break;
        case 'auth/invalid-email':
          errorMsg = "Geçersiz bir e-posta adresi.";
          break;
        case 'auth/weak-password':
          errorMsg = "Şifren çok zayıf. En az 6 karakter olmalı.";
          break;
        case 'auth/too-many-requests':
          errorMsg = "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar dene.";
          break;
        case 'auth/network-request-failed':
          errorMsg = "İnternet bağlantını kontrol et ve tekrar dene.";
          break;
        case 'permission-denied':
          errorMsg = "Veritabanı izinleri uygun değil. Lütfen daha sonra tekrar dene.";
          break;
        default:
          errorMsg = isLogin ? "Giriş yapılamadı, tekrar dene." : "Kayıt tamamlanamadı, tekrar dene.";
      }
      showAlert("Hata", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <Modal visible={alertVisible} 
      transparent
       animationType="fade"
       onRequestClose={() => setAlertVisible(false)}
       >
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
              
             {/* 🚀 LOGO ARTIK ANİMATİON İLE KÜÇÜLÜYOR */}
              <Animated.View style={[styles.logoContainer, { height: logoAnimHeight, marginBottom: logoAnimMargin }]}>
                <Image source={require('../../assets/homeLogo.png')} style={styles.logoImage} resizeMode="contain" />
              </Animated.View>

              <View style={styles.headerTextGroup}>
                <Text style={styles.mainTitle}>{isLogin ? 'Hoş Geldin!' : 'Aramıza Katıl'}</Text>
                <Text style={styles.subTitle}>{isLogin ? 'Meme dünyasına kaldığın yerden devam et.' : 'En komik masada yerini hemen ayırt.'}</Text>
              </View>

              <View style={styles.formContainer}>
                {!isLogin && (
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={18} color={theme.pink} />
                    <TextInput 
                      style={styles.input} 
                      placeholder="Nickname" 
                      placeholderTextColor={theme.subText} 
                      value={nickname} 
                      onChangeText={setNickname} 
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                )}

                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color={theme.pink} />
                 <TextInput 
                    style={styles.input} 
                    placeholder="E-posta" 
                    placeholderTextColor={theme.subText} 
                    value={email} 
                    onChangeText={(text) => setEmail(text.replace(/\s/g, ''))} 
                    autoCapitalize="none" 
                    keyboardType="email-address" 
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={theme.pink} />
                  <TextInput style={styles.input} placeholder="Şifre" placeholderTextColor={theme.subText} secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={theme.subText} />
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

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>veya</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin} activeOpacity={0.7} disabled={loading}>
                <Ionicons name="game-controller" size={20} color={theme.pink} style={styles.guestIcon} />
                <Text style={styles.guestButtonText}>Misafir Olarak Dene</Text>
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
  content: { 
    flex: 1, 
    paddingHorizontal: 28, 
    paddingTop: 10,
    paddingBottom: 15, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  logoContainer: { 
    width: width * 0.75, 
  },
  logoImage: { 
    width: '100%', 
    height: '100%' 
  },
  // 🚀 METİNLER TIRAŞLANDI
  headerTextGroup: { 
    width: '100%', 
    marginBottom: 20, 
    alignItems: 'center' 
  },
  mainTitle: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#424242', 
    marginBottom: 4 
  },
  subTitle: { 
    fontSize: 14, 
    color: theme.subText, 
    textAlign: 'center', 
    fontWeight: '500' 
  },
  formContainer: { 
    width: '100%', 
    marginBottom: 15 
  },
  // 🚀 İNPUT YÜKSEKLİKLERİ VE BOŞLUKLARI KÜÇÜLTÜLDÜ
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.inputBg, 
    height: 54, 
    borderRadius: 18, 
    paddingHorizontal: 18, 
    marginBottom: 12, 
    borderWidth: 1.5, 
    borderColor: theme.border 
  },
  input: { 
    flex: 1, 
    fontSize: 15, 
    color: theme.deepText, 
    fontWeight: '600', 
    marginLeft: 10 
  },
  forgotPass: { 
    alignSelf: 'flex-end', 
    marginTop: -2, 
    paddingVertical: 5 
  },
  forgotPassText: { 
    color: theme.pink, 
    fontWeight: '700', 
    fontSize: 13 
  },
  buttonShadow: { 
    width: '100%', 
    shadowColor: theme.pink, 
    shadowOpacity: 0.4, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 8 
  },
  // 🚀 ANA BUTON YÜKSEKLİĞİ KÜÇÜLTÜLDÜ
  mainButton: { 
    height: 56, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  buttonText: { 
    color: 'white', 
    fontSize: 17, 
    fontWeight: '800' 
  },
  // 🚀 VEYA ÇİZGİSİ BOŞLUKLARI AZALTILDI
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dividerText: {
    paddingHorizontal: 14,
    color: theme.subText,
    fontSize: 13,
    fontWeight: '600',
  },
  // 🚀 MİSAFİR BUTONU KÜÇÜLTÜLDÜ
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 54,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: theme.pink + '40',
    backgroundColor: theme.pink + '0A',
  },
  guestIcon: {
    marginRight: 8,
  },
  guestButtonText: {
    fontSize: 15,
    color: theme.pink,
    fontWeight: '700',
  },
  // 🚀 FOOTER BOŞLUĞU AZALTILDI
  footerLink: { 
    marginTop: 20, 
    padding: 10 
  },
  footerText: { 
    fontSize: 14, 
    color: theme.subText, 
    fontWeight: '500' 
  },
  footerLinkBold: { 
    color: theme.pink, 
    fontWeight: '800' 
  },
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