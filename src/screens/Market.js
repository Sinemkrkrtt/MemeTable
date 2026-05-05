import React, { useState, useEffect } from 'react'; 
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ScrollView, Modal, Dimensions, StatusBar, FlatList, Platform,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { 
  Nunito_600SemiBold, 
  Nunito_700Bold, 
  Nunito_800ExtraBold, 
  Nunito_900Black 
} from '@expo-google-fonts/nunito';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { doc, onSnapshot, updateDoc, increment } from 'firebase/firestore'; 
import { db, auth } from '../services/firebase'; 
import { RewardedAd, TestIds, RewardedAdEventType } from 'react-native-google-mobile-ads';
import Purchases from 'react-native-purchases';

const { width } = Dimensions.get('window');
const cardWidth = (width - 55) / 2;

const palet = {
  pink: '#FF69EB',
  softPink: '#FF86C8',
  salmon: '#FFA3A5',
  orange: '#FFBF81',
  yellow: '#FFDC5E',
  bg: '#F4F6FC', 
  textDark: '#1A131F', 
};

const STORE_DATA = {
 jokers: [
    { 
      id: 'joker_skip', name: 'Kart Değiştir', price: 500, type: 'coin', 
      isImage: true, source: require('../../assets/joker1.png'), 
      color: palet.pink, desc: 'İstemediğin bir kartı değiştir.' 
    },
    { 
      id: 'joker_double', name: 'Deste Değiştir', price: 800, type: 'coin', 
      isImage: true, source: require('../../assets/joker2.png'), 
      color: palet.softPink, desc: 'Tüm desteyi değiştir.' 
    },
    { 
      id: 'joker_freeze', name: 'Zamanı Durdur', price: 1000, type: 'coin', 
      isImage: true, source: require('../../assets/joker3.png'), 
      color: palet.orange, desc: 'Süreyi kart atana kadar durdur.' 
    },
  ],
  coins: [
    { id: 'c1', name: 'Küçük Kese', price: 10, type: 'diamond', amount: 1000, icon: 'coins', iconFamily: 'FontAwesome5', color: '#FFD700' },
    { id: 'c2', name: 'Meme Zulası', price: 40, type: 'diamond', amount: 5000, icon: 'piggy-bank', iconFamily: 'FontAwesome5', color: palet.salmon, badge: 'EN ÇOK SATAN' },
  ],
  diamonds: [
    { id: 'd1', name: 'Avuç İçi', price: '₺29.99', type: 'real', amount: 50, icon: 'gem', iconFamily: 'FontAwesome5', color: '#00D2FF' },
    { id: 'd2', name: 'Kral Sandığı', price: '₺129.99', type: 'real', amount: 250, icon: 'crown', iconFamily: 'FontAwesome5', color: palet.pink, badge: 'AVANTAJLI' },
  ]
};

export default function MarketScreen({ navigation }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false); 
  const [userCoins, setUserCoins] = useState(0);
  const [userDiamonds, setUserDiamonds] = useState(0);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });

  let [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  const clickSound = useAudioPlayer(require('../../assets/sounds/click.mp3'));
  const successSound = useAudioPlayer(require('../../assets/sounds/cha-ching.mp3'));
  const errorSound = useAudioPlayer(require('../../assets/sounds/error.mp3'));

  const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-xxxxxxxxxxxxx';
  const showRewardAd = () => {
  const rewarded = RewardedAd.createForAdUnit(adUnitId);
  
  rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
    // Kullanıcı reklamı izledi, +50 coin ver
    handleRewardSuccess(50);
  });

  rewarded.load();
  rewarded.show();
};


const handleRewardSuccess = async (amount) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        coins: increment(amount)
      });
      playSound('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert("Tebrikler!", `Reklamı başarıyla izledin ve +${amount} Coin kazandın.`);
    } catch (error) {
      console.error("Reklam ödülü hatası:", error);
      showAlert("Hata", "Ödül verilirken bir sorun oluştu.");
    }
  };

  
  const playSound = (type) => {
    try {
      if (type === 'click') {
        clickSound.seekTo(0);
        clickSound.play();
      } else if (type === 'success') {
        successSound.seekTo(0);
        successSound.play();
      } else if (type === 'error') {
        errorSound.seekTo(0);
        errorSound.play();
      }
    } catch (error) {
      console.log("Ses hatası:", error);
    }
  };

  useEffect(() => {
    const configureAudio = async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true });
      } catch (error) {
        console.log("Ses ayarı yapılamadı:", error);
      }
    };
    configureAudio();

    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserCoins(data.coins || 0);
          setUserDiamonds(data.diamonds || 0);
        }
      },
      (error) => {
        console.log("Market dinleyicisi yetkisi düştü (Normal durum):", error.code);
      }
    );

    return () => unsubscribe(); 
  }, []);

  const showAlert = (title, message, buttons) => {
    setAlertConfig({
      title,
      message,
      buttons: buttons || [{ text: 'Tamam' }]
    });
    setAlertVisible(true);
  };

  const handlePurchase = async (item) => {
    if (!item || isPurchasing) return;
    setIsPurchasing(true); 

    const user = auth.currentUser;
    if (!user) {
      playSound('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert("Hata", "Lütfen önce giriş yapın.");
      setIsPurchasing(false);
      return;
    }

    const userRef = doc(db, 'users', user.uid);

    try {
      if (item.type === 'coin') {
        if (userCoins >= item.price) {
          await updateDoc(userRef, {
            coins: increment(-item.price), 
            [item.id]: increment(1)        
          });
          playSound('success'); 
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showAlert("Başarılı!", `Tebrikler, ${item.name} envanterinize eklendi.`);
          setModalVisible(false);
        } else {
          playSound('error'); 
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          showAlert("Yetersiz Bakiye", "Bunun için yeterli coininiz yok. Lütfen kasa doldurun.");
        }
      } 
      else if (item.type === 'diamond') {
        if (userDiamonds >= item.price) {
          await updateDoc(userRef, {
            diamonds: increment(-item.price), 
            coins: increment(item.amount)     
          });
          playSound('success'); 
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showAlert("Kasa Doldu!", `Tebrikler, +${item.amount} Coin hesabınıza eklendi.`);
          setModalVisible(false);
        } else {
          playSound('error'); 
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          showAlert("Yetersiz Elmas", "Yeterli elmasınız yok. Lütfen premium elmas satın alın.");
        }
      } 
    // handlePurchase fonksiyonu içindeki 'real' kısmı için:
else if (item.type === 'real') {
  try {
    // RevenueCat veya Expo IAP tetikleme
    const purchaseMade = await Purchases.purchasePackage(item.package);
    
    if (typeof purchaseMade.customerInfo.entitlements.active['premium'] !== "undefined") {
      // Satın alım başarılı, Firebase'i güncelle
      await updateDoc(userRef, { diamonds: increment(item.amount) });
      showAlert("Başarılı", "Elmaslar hesabına eklendi!");
    }
  } catch (e) {
    if (!e.userCancelled) {
      showAlert("Hata", "Ödeme işlemi sırasında bir sorun oluştu.");
    }
  }
}
    } catch (error) {
      console.error("Satın alma hatası:", error);
      playSound('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert("Hata", "İşlem gerçekleştirilemedi.");
    }
    
    setIsPurchasing(false); 
  };

  const renderIcon = (item, size) => {
    if (item.iconFamily === 'FontAwesome5') {
      return <FontAwesome5 name={item.icon} size={size} color={item.color} />;
    }
    return <Ionicons name={item.icon} size={size} color={item.color} />;
  };

  const renderJokerCard = (item) => (
    <TouchableOpacity 
      key={item.id} 
      style={styles.jokerCard} 
      activeOpacity={0.8} 
      onPress={() => { 
        playSound('click');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedItem(item); 
        setModalVisible(true); 
      }}
    >
      <View style={[styles.jokerIconBg, { backgroundColor: item.color + '15' }]}>
      <Image 
        source={item.source} 
        style={styles.jokerImage} 
        contentFit="contain" 
        transition={200} 
        cachePolicy="memory"
      />
      </View>
      <View style={styles.jokerInfo}>
        <Text style={styles.jokerName}>{item.name}</Text>
        <Text style={styles.jokerDesc} numberOfLines={2}>{item.desc}</Text>
        <LinearGradient colors={[item.color, palet.orange]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={[styles.actionButton, { marginTop: 12 }]}>
          <FontAwesome5 name="coins" size={11} color="white" style={{ marginRight: 6 }} />
          <Text style={styles.actionButtonText}>{item.price}</Text>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );

  const renderBoxCard = (item) => (
    <TouchableOpacity 
      key={item.id} 
      style={styles.boxCard} 
      activeOpacity={0.8} 
      onPress={() => { 
        playSound('click');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedItem(item); 
        setModalVisible(true); 
      }}
    >
      {item.badge && (
        <LinearGradient colors={['#FF007A', '#FF69EB']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </LinearGradient>
      )}
      <View style={[styles.boxIconBg, { backgroundColor: item.color + '15' }]}>
        {renderIcon(item, 40)}
      </View>
      <Text style={styles.boxName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.boxAmount}>+{item.amount}</Text>
      
      <LinearGradient colors={[item.color, palet.orange]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={[styles.actionButton, { marginTop: 16, width: '100%' }]}>
        {item.type !== 'real' && <FontAwesome5 name={item.type === 'coin' ? 'coins' : 'gem'} size={11} color="white" style={{ marginRight: 6 }} />}
        <Text style={[styles.actionButtonText, { color: 'white' }]}>{item.price}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (!fontsLoaded) {
    return null; 
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* 🚀 CUSTOM ALERT MODAL */}
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <LinearGradient colors={[palet.pink, palet.orange]} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.alertHeaderIcon}>
              <Ionicons name="notifications-outline" size={34} color="white" />
            </LinearGradient>
            
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            
            <View style={styles.alertButtonGroup}>
              {alertConfig.buttons.map((btn, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.alertBtn, 
                    btn.style === 'cancel' ? styles.alertBtnCancel : styles.alertBtnConfirm,
                    alertConfig.buttons.length > 1 && { flex: 1, marginHorizontal: 6 }
                  ]} 
                  onPress={() => {
                    setAlertVisible(false);
                    if (btn.onPress) btn.onPress();
                  }}
                  activeOpacity={0.8}
                >
                  {btn.style !== 'cancel' ? (
                    <LinearGradient colors={[palet.pink, palet.orange]} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.alertBtnGradient}>
                      <Text style={styles.alertBtnTextConfirm}>{btn.text}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.alertBtnTextCancel}>{btn.text}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { playSound('click'); navigation.goBack(); }} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={palet.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MAĞAZA</Text>
        <View style={styles.premiumVault}>
          <View style={styles.vaultItem}>
            <FontAwesome5 name="coins" size={12} color="#FFDC5E" />
            <Text style={styles.vaultText}>{userCoins}</Text>
          </View>
          <View style={styles.vaultSeparator} />
          <View style={styles.vaultItem}>
            <FontAwesome5 name="gem" size={12} color="#00D2FF" />
            <Text style={styles.vaultText}>{userDiamonds}</Text>
          </View>
        </View>
      </View>

      {/* TÜM MARKET ANA KAYDIRMA ALANI */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50, paddingTop: 5 }}>
        
        {/* KATEGORİ: ÜCRETSİZ KAZAN */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎁 Ücretsiz Ödüller</Text>
          <Text style={styles.sectionSub}>Kısa bir video izle, kasanı doldur.</Text>
        </View>
        
        <TouchableOpacity 
            style={styles.adBannerCard} 
            activeOpacity={0.9} 
            onPress={() => { 
              playSound('click'); 
              showAlert('Reklam Yükleniyor', 'Lütfen bekleyin, test reklamı hazırlanıyor...', [{ text: 'Tamam' }]);
              showRewardAd(); 
            }}
            >
          <LinearGradient colors={[palet.orange, palet.pink]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.adBannerGradient}>
            <View style={styles.adBannerInfo}>
              <View style={styles.adIconContainer}>
                <Ionicons name="play" size={24} color={palet.pink} style={{ marginLeft: 3 }} />
              </View>
              <View style={{ marginLeft: 16 }}>
                <Text style={styles.adBannerTitle}>Reklam İzle</Text>
                <Text style={styles.adBannerSub}>Ücretsiz Coin Kazan</Text>
              </View>
            </View>
            <View style={styles.adRewardBox}>
              <Text style={styles.adRewardText}>+50</Text>
              <FontAwesome5 name="coins" size={14} color="#FFD700" style={{ marginLeft: 6 }} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* KATEGORİ: JOKERLER */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🃏 Taktiksel Güçler</Text>
          <Text style={styles.sectionSub}>Oyun içi coinlerinle yetenek al.</Text>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STORE_DATA.jokers}
          keyExtractor={item => item.id}
          renderItem={({ item }) => renderJokerCard(item)}
          contentContainerStyle={{ paddingLeft: 20, paddingRight: 10, paddingBottom: 10 }}
          snapToInterval={width * 0.82 + 16} 
          decelerationRate="fast"
          snapToAlignment="start"
        />

        {/* KATEGORİ: COINLER */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💰 Kasa Doldur</Text>
          <Text style={styles.sectionSub}>Elmaslarını coine dönüştür.</Text>
        </View>
        <View style={styles.gridContainer}>
          {STORE_DATA.coins.map(item => renderBoxCard(item))}
        </View>

        {/* KATEGORİ: ELMASLAR */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💎 Premium Elmas</Text>
          <Text style={styles.sectionSub}>Özel teklifleri kaçırma.</Text>
        </View>
        <View style={styles.gridContainer}>
          {STORE_DATA.diamonds.map(item => renderBoxCard(item))}
        </View>

      </ScrollView>

      {/* PREMIUM MODAL */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Sürükleme Çubuğu */}
            <View style={styles.modalDragIndicator} />
            
          <TouchableOpacity 
            style={styles.closeBtn} 
            disabled={isPurchasing} // 🚀 EKLENDİ
            onPress={() => { 
              if(isPurchasing) return; // 🚀 EKLENDİ
              playSound('click'); 
              setModalVisible(false); 
            }}>
              <Ionicons name="close-circle" size={30} color="#CBD5E1" />
            </TouchableOpacity>

            {selectedItem && (
              <>
                <View style={[styles.modalIconBg, { backgroundColor: selectedItem.color + '15' }]}>
                  {selectedItem.isImage ? (
              <Image 
              source={selectedItem.source} 
              style={{ width: 85, height: 85 }} 
              contentFit="contain" 
              transition={300}
              priority="high"
              cachePolicy="memory" 
            />
                  ) : (
                    renderIcon(selectedItem, 75)
                  )}
                </View>
                
                <Text style={styles.modalTitle}>{selectedItem.name}</Text>
                {selectedItem.desc && <Text style={styles.modalDesc}>{selectedItem.desc}</Text>}
                {selectedItem.amount && <Text style={styles.modalAmountText}>+{selectedItem.amount} Eklenecek</Text>}

                <TouchableOpacity 
                  style={styles.buyBtn} 
                  activeOpacity={0.9} 
                  onPress={() => handlePurchase(selectedItem)}
                  disabled={isPurchasing} 
                >
                  <LinearGradient colors={[selectedItem.color || palet.pink, palet.orange]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.buyBtnGradient}>
                    {isPurchasing ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Text style={styles.buyBtnText}>
                          {selectedItem.price} {selectedItem.type === 'real' ? 'ile Satın Al' : selectedItem.type.toUpperCase() + ' ÖDE'}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="white" style={{ position: 'absolute', right: 24 }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  // --- ANA KONTEYNER ---
  container: { 
    flex: 1, 
    backgroundColor: palet.bg 
  },
  
  // --- HEADER (ÜST KISIM) ---
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 40 : 10, 
    paddingBottom: 15 
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'flex-start' 
  },
  headerTitle: { 
    fontSize: 22, 
    fontFamily: 'Nunito_900Black', 
    color: palet.textDark, 
    letterSpacing: 0.5 
  },
  premiumVault: { 
    flexDirection: 'row', 
    backgroundColor: '#00000057', 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 20, 
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 5 
  },
  vaultItem: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  vaultText: { 
    fontFamily: 'Nunito_800ExtraBold', 
    fontSize: 13, 
    color: 'white', 
    marginLeft: 6, 
    letterSpacing: 0.5 
  },
  vaultSeparator: { 
    width: 1, 
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    marginHorizontal: 12 
  },
  
  // --- SECTIONS (BÖLÜM BAŞLIKLARI) ---
  sectionHeader: { 
    marginHorizontal: 20, 
    marginTop: 10, 
    marginBottom: 16 
  },
  sectionTitle: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 19, 
    color: palet.textDark, 
    letterSpacing: -0.3 
  },
  sectionSub: { 
    fontFamily: 'Nunito_600SemiBold', 
    fontSize: 13, 
    color: '#64748B', 
    marginTop: 4, 
    letterSpacing: 0.2 
  },
  
  // --- AD BANNER (REKLAM ALANI) ---
  adBannerCard: { 
    marginHorizontal: 20, 
    marginBottom: 24, 
    borderRadius: 24, 
    shadowColor: palet.pink, 
    shadowOpacity: 0.3, 
    shadowRadius: 12, 
    shadowOffset: { width: 0, height: 6 }, 
    elevation: 6 
  },
  adBannerGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 20, 
    borderRadius: 24 
  },
  adBannerInfo: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  adIconContainer: { 
    backgroundColor: 'white', 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 4 
  },
  adBannerTitle: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 18, 
    color: 'white', 
    letterSpacing: 0.5 
  },
  adBannerSub: { 
    fontFamily: 'Nunito_700Bold', 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.9)', 
    marginTop: 2 
  },
  adRewardBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.25)', 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.5)' 
  },
  adRewardText: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 16, 
    color: 'white' 
  },

  // --- JOKER CARDS (JOKER KARTLARI) ---
  jokerCard: { 
    flexDirection: 'row', 
    backgroundColor: 'white', 
    width: width * 0.82, 
    marginRight: 16, 
    padding: 16, 
    borderRadius: 28, 
    borderWidth: 1, 
    borderColor: 'rgba(0,0,0,0.03)', 
    shadowColor: '#94A3B8', 
    shadowOpacity: 0.15, 
    shadowRadius: 15, 
    shadowOffset: { width: 0, height: 8 }, 
    elevation: 4 
  },
  jokerIconBg: { 
    width: 80, 
    height: 80, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  jokerImage: { 
    width: 48, 
    height: 48 
  },
  jokerInfo: { 
    flex: 1, 
    marginLeft: 16, 
    justifyContent: 'center' 
  },
  jokerName: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 17, 
    color: palet.textDark, 
    letterSpacing: -0.2 
  },
  jokerDesc: { 
    fontFamily: 'Nunito_600SemiBold', 
    fontSize: 12, 
    color: '#64748B', 
    marginTop: 4, 
    lineHeight: 18 
  },

  // --- BOX CARDS (IZGARA DÜZENİ) ---
  gridContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    marginBottom: 15 
  },
  boxCard: { 
    width: cardWidth, 
    backgroundColor: 'white', 
    borderRadius: 28, 
    padding: 18, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(0,0,0,0.03)', 
    shadowColor: '#94A3B8', 
    shadowOpacity: 0.15, 
    shadowRadius: 15, 
    shadowOffset: { width: 0, height: 8 }, 
    elevation: 4 
  },
  boxIconBg: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  boxName: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 15, 
    color: palet.textDark, 
    textAlign: 'center', 
    letterSpacing: -0.2 
  },
  boxAmount: { 
    fontFamily: 'Nunito_800ExtraBold', 
    fontSize: 13, 
    color: '#64748B', 
    marginTop: 6 
  },
  
  // --- BUTTONS & BADGES (BUTONLAR VE ETİKETLER) ---
  actionButton: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 10, 
    borderRadius: 14 
  },
  actionButtonText: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 13, 
    color: 'white', 
    letterSpacing: 0.5 
  },
  badge: { 
    position: 'absolute', 
    top: -12, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12, 
    zIndex: 10, 
    shadowColor: '#FF007A', 
    shadowOpacity: 0.4, 
    shadowRadius: 6, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 6 
  },
  badgeText: { 
    color: 'white', 
    fontSize: 9, 
    fontFamily: 'Nunito_900Black', 
    letterSpacing: 1 
  },

  // --- MODAL (BOTTOM SHEET - ALT PANEL) ---
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.6)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: 'white', 
    borderTopLeftRadius: 36, 
    borderTopRightRadius: 36, 
    paddingHorizontal: 30, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 30, 
    paddingTop: 15, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    shadowRadius: 20, 
    shadowOffset: { width: 0, height: -10 }, 
    elevation: 20 
  },
  modalDragIndicator: { 
    width: 40, 
    height: 5, 
    backgroundColor: '#E2E8F0', 
    borderRadius: 3, 
    marginBottom: 20 
  },
  closeBtn: { 
    position: 'absolute', 
    top: 20, 
    right: 24, 
    zIndex: 10 
  },
  modalIconBg: { 
    width: 130, 
    height: 130, 
    borderRadius: 65, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  modalTitle: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 26, 
    color: palet.textDark, 
    letterSpacing: -0.5 
  },
  modalDesc: { 
    fontFamily: 'Nunito_600SemiBold', 
    fontSize: 15, 
    color: '#64748B', 
    textAlign: 'center', 
    marginTop: 12, 
    lineHeight: 22, 
    paddingHorizontal: 10 
  },
  modalAmountText: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 18, 
    color: palet.pink, 
    marginTop: 20, 
    letterSpacing: 0.5 
  },
  buyBtn: { 
    width: '100%', 
    marginTop: 30, 
    shadowColor: palet.pink, 
    shadowOpacity: 0.4, 
    shadowRadius: 15, 
    shadowOffset: { width: 0, height: 8 }, 
    elevation: 8 
  },
  buyBtnGradient: { 
    paddingVertical: 20, 
    borderRadius: 24, 
    alignItems: 'center', 
    flexDirection: 'row', 
    justifyContent: 'center' 
  },
  buyBtnText: { 
    color: 'white', 
    fontFamily: 'Nunito_900Black', 
    fontSize: 16, 
    letterSpacing: 0.5 
  },

  // --- CUSTOM ALERT STYLES (ÖZEL UYARI STİLLERİ) ---
  alertOverlay: { 
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
    fontFamily: 'Nunito_900Black', 
    color: palet.textDark, 
    marginBottom: 10, 
    textAlign: 'center' 
  },
  alertMessage: { 
    fontSize: 14, 
    fontFamily: 'Nunito_600SemiBold', 
    color: '#64748B', 
    textAlign: 'center', 
    lineHeight: 20, 
    marginBottom: 25 
  },
  alertButtonGroup: { 
    flexDirection: 'row', 
    width: '100%', 
    justifyContent: 'center' 
  },
  alertBtn: { 
    height: 50, 
    borderRadius: 15, 
    overflow: 'hidden', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minWidth: 100 
  },
  alertBtnConfirm: { 
    flex: 1, 
    shadowColor: palet.pink, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 5 
  },
  alertBtnCancel: { 
    flex: 1, 
    backgroundColor: '#F1F5F9', 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  alertBtnGradient: { 
    flex: 1, 
    width: '100%', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  alertBtnTextConfirm: { 
    color: 'white', 
    fontSize: 15, 
    fontFamily: 'Nunito_800ExtraBold' 
  },
  alertBtnTextCancel: { 
    color: '#64748B', 
    fontSize: 15, 
    fontFamily: 'Nunito_800ExtraBold' 
  }
});