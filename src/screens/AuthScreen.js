import React, { useState, useEffect, useRef } from 'react'; // 🚀 useRef eklendi
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, 
  StatusBar, Dimensions, ActivityIndicator, ScrollView, Keyboard,
  Modal, Animated // 🚀 Animated eklendi
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail,
  deleteUser 
} from "firebase/auth";
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

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

  // 🚀 LOGO ANİMASYON DEĞERLERİ EKLENDİ
  const logoAnimHeight = useRef(new Animated.Value(width * 0.55)).current;
  const logoAnimMargin = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardStatus(true);
      // Klavye açılınca yavaşça küçült
      Animated.parallel([
        Animated.timing(logoAnimHeight, {
          toValue: height * 0.15,
          duration: 250, // 250 milisaniye (akıcı geçiş süresi)
          useNativeDriver: false,
        }),
        Animated.timing(logoAnimMargin, {
          toValue: 10,
          duration: 250,
          useNativeDriver: false,
        })
      ]).start();
    });
    
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardStatus(false);
      // Klavye kapanınca yavaşça eski haline getir
      Animated.parallel([
        Animated.timing(logoAnimHeight, {
          toValue: width * 0.55,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(logoAnimMargin, {
          toValue: 20,
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
      showAlert("Hata", "Sıfırlama e-postası gönderilemedi.");
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

    // 🚀 BURASI YENİ EKLENDİ: OYUN İÇİ NICKNAME GÜVENLİK DUVARI
    if (!isLogin) {
      // 3 ile 12 karakter sınırı (Oyun masası tasarımı taşmasın diye)
      if (cleanNickname.length < 3 || cleanNickname.length > 12) {
        showAlert("Geçersiz İsim", "Kullanıcı adın 3 ile 12 karakter arasında olmalıdır.");
        return;
      }
      // Sadece harf, rakam ve Türkçe karakterlere izin ver (Özel sembol ve boşluk yasak)
      const nicknameRegex = /^[a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]+$/;
      if (!nicknameRegex.test(cleanNickname)) {
        showAlert("Geçersiz Karakter", "İsminde boşluk veya özel semboller (!, @, vs.) kullanamazsın.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      } else {
        // 🚀 1. ÖNCE NICKNAME KONTROLÜ (Hesap açmadan önce)
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("nickname", "==", cleanNickname));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          showAlert("Bu Koltuk Dolu!", "Bu nickname daha önce alınmış. Lütfen başka bir isim dene.");
          setLoading(false);
          return; // İsim doluysa işlemi durdur, hesap falan açma!
        }

        // 🚀 2. İSİM BOŞTAYSA HESABI AÇ VE KAYDET
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: cleanNickname });
        
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid, 
          nickname: cleanNickname, 
          email: cleanEmail, 
          createdAt: new Date(),
          coins: 100, diamonds: 10, joker_skip: 1, joker_double: 1, joker_freeze: 1,
          wonHearts: 0, isBoxOpened: false, level: 1, experience: 0
        });
      }
    } catch (error) {
      console.log("Kimlik Doğrulama Hatası:", error); 
      let errorMsg = isLogin ? "Giriş başarısız oldu." : "Kayıt işlemi gerçekleştirilemiyor.";

      if (error.message && error.message.includes('permission-denied')) {
        errorMsg = "Veritabanı güvenlik kuralları nickname kontrolünü engelliyor. (Adım 2'yi uygulayın!)";
      } else if (error.code === 'auth/email-already-in-use') {
        errorMsg = "Bu e-posta adresi zaten kullanımda.";
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMsg = "E-posta veya şifreniz hatalı.";
      } else {
        errorMsg = `Beklenmeyen bir hata oluştu: ${error.code || "Bilinmiyor"}`;
      }
      showAlert("Hata", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/*CUSTOM ALERT MODAL */}
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
              
              {/* 🚀 BURASI Animated.View OLARAK DEĞİŞTİRİLDİ */}
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
                    <Ionicons name="person-outline" size={20} color={theme.pink} />
                    <TextInput 
                      style={styles.input} 
                      placeholder="Nickname" 
                      placeholderTextColor={theme.subText} 
                      value={nickname} 
                      onChangeText={setNickname} 
                      autoCapitalize="none" // 🚀 Kullanıcı yazarken ilk harfi zorla büyütmesin
                      autoCorrect={false}   // 🚀 Klavyenin kelime düzeltmesini engeller
                    />
                  </View>
                )}

                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={theme.pink} />
                 <TextInput 
                    style={styles.input} 
                    placeholder="E-posta" 
                    placeholderTextColor={theme.subText} 
                    value={email} 
                    onChangeText={(text) => setEmail(text.replace(/\s/g, ''))} // 🚀 Anında boşluk silme eklendi
                    autoCapitalize="none" 
                    keyboardType="email-address" 
                  />
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
    // 🚀 DİNAMİK OLACAĞI İÇİN BURADAKİ height VE marginBottom KALDIRILDI
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