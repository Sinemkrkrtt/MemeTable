import React, { useState, useEffect, useRef } from 'react';
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
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getAvailablePurchases,
} from 'react-native-iap';

const PRODUCT_SKUS = [
  'com.sinem.memetable.app.diamonds_50',
  'com.sinem.memetable.app.diamonds_250',
];

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
    { id: 'd1', productId: 'com.sinem.memetable.app.diamonds_50',  name: 'Avuç İçi',     price: '₺29.99',  type: 'real', amount: 50,  icon: 'gem',   iconFamily: 'FontAwesome5', color: '#00D2FF' },
    { id: 'd2', productId: 'com.sinem.memetable.app.diamonds_250', name: 'Kral Sandığı', price: '₺99.99', type: 'real', amount: 250, icon: 'crown', iconFamily: 'FontAwesome5', color: palet.pink, badge: 'AVANTAJLI' },
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
  
  // 🚀 YENİ: Apple'dan gelen dinamik fiyatlı ürünleri tutacağımız state
  const [iapProducts, setIapProducts] = useState([]);

  // Aynı transaction için listener'ın çift fire'ını engellemek için in-memory dedupe.
  const processedTxIdsRef = useRef(new Set());

  let [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  const clickSound = useAudioPlayer(require('../../assets/sounds/click.mp3'));
  const successSound = useAudioPlayer(require('../../assets/sounds/cha-ching.mp3'));
  const errorSound = useAudioPlayer(require('../../assets/sounds/error.mp3'));

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
    // 🚀 1. Component'in ekranda olup olmadığını takip eden bayrak
    let isMounted = true; 

    const configureAudio = async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true });
      } catch (error) {
        console.log("Ses ayarı yapılamadı:", error);
      }
    };
    configureAudio();

    const user = auth.currentUser;
    const userRef = user ? doc(db, 'users', user.uid) : null;
    
    // 🚀 2. Firebase Snapshot - React çizimi bitirene kadar bekletiyoruz
    const unsubscribe = userRef
      ? onSnapshot(
          userRef,
          (docSnap) => {
            setTimeout(() => {
              if (isMounted && docSnap.exists()) {
                const data = docSnap.data();
                setUserCoins(data.coins || 0);
                setUserDiamonds(data.diamonds || 0);
              }
            }, 0); // 0 ms gecikme işlemi event loop'un sonuna iter, çakışmayı önler
          },
          (error) => {
            console.log("Market dinleyicisi yetkisi düştü (Normal durum):", error.code);
          }
        )
      : null;

    let purchaseUpdateSub = null;
    let purchaseErrorSub = null;

    const processPurchase = async (purchase, { silent = false } = {}) => {
      const txId = purchase?.id;
      if (txId && processedTxIdsRef.current.has(txId)) {
        if (!silent && isMounted) setIsPurchasing(false);
        return;
      }
      if (txId) processedTxIdsRef.current.add(txId);

      try {
        const item = STORE_DATA.diamonds.find((d) => d.productId === purchase.productId);
        if (!item) throw new Error(`Bilinmeyen ürün: ${purchase.productId}`);
        if (!userRef) throw new Error('Oturum yok.');

        await updateDoc(userRef, { diamonds: increment(item.amount) });
        await finishTransaction({ purchase, isConsumable: true });

        if (silent) return;

        playSound('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        if (isMounted) {
          setModalVisible(false);
          setTimeout(() => {
            if (isMounted) showAlert('Tebrikler!', `+${item.amount} Elmas hesabına eklendi.`);
          }, 400);
        }
      } catch (e) {
        console.log('processPurchase hatası:', e);
        if (silent) {
          try {
            await finishTransaction({ purchase, isConsumable: true });
          } catch (finishErr) {
            console.log('Cleanup finishTransaction hatası:', finishErr?.message || finishErr);
          }
          return;
        }
        playSound('error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        if (isMounted) {
          setModalVisible(false);
          setTimeout(() => {
            if (isMounted) showAlert('Hata', e?.message || 'İşlem tamamlanamadı.');
          }, 400);
        }
      } finally {
        if (isMounted) setIsPurchasing(false);
      }
    };

    const setupIAP = async () => {
      try {
        await initConnection();
        // 🚀 YENİ: Apple'dan fiyatları çek ve state'e kaydet
        const products = await fetchProducts({ skus: PRODUCT_SKUS, type: 'in-app' });
        if (isMounted) {
          setIapProducts(products);
        }
      } catch (e) {
        console.log('IAP init hatası:', e?.message || e);
      }

      purchaseUpdateSub = purchaseUpdatedListener((purchase) => {
        processPurchase(purchase);
      });

      // 🚀 3. IAP Error Listener Kontrolü
      purchaseErrorSub = purchaseErrorListener((error) => {
        console.log('IAP hata:', error);
        
        if (isMounted) {
          setIsPurchasing(false);
          setModalVisible(false);
        }
        
        if (error?.code === 'E_USER_CANCELLED') return;
        if (error?.code === 'duplicate-purchase') return; 
        
        playSound('error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => {
          if (isMounted) showAlert('Satın Alma Başarısız', error?.message || 'İşlem tamamlanamadı.');
        }, 400);
      });

      try {
        const pending = await getAvailablePurchases({
          onlyIncludeActiveItemsIOS: false,
        });
        if (Array.isArray(pending) && pending.length > 0) {
          console.log(`IAP: ${pending.length} bekleyen işlem temizleniyor.`);
          for (const p of pending) {
            await processPurchase(p, { silent: true });
          }
        }
      } catch (e) {
        console.log('getAvailablePurchases hatası:', e?.message || e);
      }
    };

    setupIAP();

    // 🚀 4. Cleanup (Temizlik) Aşamasında isMounted değerini false yapıyoruz
    return () => {
      isMounted = false; 
      if (unsubscribe) unsubscribe();
      if (purchaseUpdateSub) purchaseUpdateSub.remove();
      if (purchaseErrorSub) purchaseErrorSub.remove();
      endConnection();
    };
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
      setModalVisible(false);
      setTimeout(() => {
        showAlert("Hata", "Lütfen önce giriş yapın.");
      }, 400); // 🚀 400ms daha güvenli
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
          setModalVisible(false);
          setTimeout(() => {
            showAlert("Başarılı!", `Tebrikler, ${item.name} envanterinize eklendi.`);
          }, 400);
        } else {
          playSound('error'); 
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setModalVisible(false); 
          setTimeout(() => {     
            showAlert("Yetersiz Bakiye", "Bunun için yeterli coininiz yok. Lütfen kasanızı doldurun.");
          }, 400);
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
          setModalVisible(false);
          setTimeout(() => {
            showAlert("Kasa Doldu!", `Tebrikler, +${item.amount} Coin hesabınıza eklendi.`);
          }, 400);
        } else {
          playSound('error'); 
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setModalVisible(false); 
          setTimeout(() => {      
            showAlert("Yetersiz Elmas", "Yeterli elmasınız yok. Lütfen premium elmas satın alın.");
          }, 400); 
        }
      } 
     else if (item.type === 'real') {
        if (!item.productId) {
          setModalVisible(false);
          setTimeout(() => {
            showAlert('Hata', 'Ürün tanımlı değil.');
          }, 400);
          setIsPurchasing(false);
          return;
        }
        try {
          await requestPurchase({
            request: {
              apple: { sku: item.productId },
              google: { skus: [item.productId] },
            },
            type: 'in-app',
          });
          return;
        } catch (e) {
          console.log('requestPurchase hatası:', e);
          setIsPurchasing(false);
          setModalVisible(false); // 🚀 EKLENDİ: İptal bile edilse çakışmaması için modalı kapat
          if (e?.code !== 'E_USER_CANCELLED') {
            playSound('error');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setTimeout(() => {
              showAlert('Hata', e?.message || 'Satın alma başlatılamadı.');
            }, 400);
          }
          return;
        }
      }
    } catch (error) {
      console.error("Satın alma hatası:", error);
      playSound('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setModalVisible(false);
      setTimeout(() => {
        showAlert("Hata", "İşlem gerçekleştirilemedi.");
      }, 400);
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

  const renderBoxCard = (item) => {
    // 🚀 YENİ: Apple'dan gelen dinamik fiyatı belirle
    let displayPrice = item.price;
    if (item.type === 'real') {
      const storeProduct = iapProducts.find(p => p.productId === item.productId);
      if (storeProduct && storeProduct.localizedPrice) {
        displayPrice = storeProduct.localizedPrice;
      }
    }

    return (
      <TouchableOpacity 
        key={item.id} 
        style={styles.boxCard} 
        activeOpacity={0.8} 
        onPress={() => { 
          playSound('click');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // Modala gönderirken ekranda gösterilecek dinamik fiyatı da gönderiyoruz
          setSelectedItem({ ...item, displayPrice }); 
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
          {/* 🚀 YENİ: Dinamik fiyatı bas */}
          <Text style={[styles.actionButtonText, { color: 'white' }]}>{displayPrice}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (!fontsLoaded) {
    return null; 
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* 🚀 CUSTOM ALERT MODAL (BİREBİR iOS NATIVE STİLİ) */}
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            
            <View style={styles.alertHeaderArea}>
              <Text style={styles.alertTitle}>{alertConfig.title}</Text>
              {!!alertConfig.message && <Text style={styles.alertMessage}>{alertConfig.message}</Text>}
            </View>
            
            <View style={styles.alertButtonGroup}>
              {alertConfig.buttons.map((btn, index) => {
                // Başlıkta hata ifade eden bir kelime geçiyorsa kırmızı, değilse orijinal Apple mavisi yap.
                const isError = alertConfig.title?.includes('Hata') || alertConfig.title?.includes('Yetersiz') || alertConfig.title?.includes('Başarısız');
                const textColor = isError ? '#FF3B30' : '#007AFF'; 
                const isBold = index === alertConfig.buttons.length - 1; // En alttaki buton Apple'da kalındır

                return (
                  <View key={index} style={{ width: '100%' }}>
                    <View style={styles.alertSeparator} />
                    <TouchableOpacity 
                      style={styles.alertBtn} 
                      onPress={() => {
                        setAlertVisible(false);
                        if (btn.onPress) btn.onPress();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.alertBtnText, 
                        { color: textColor },
                        isBold && { fontFamily: 'Nunito_700Bold' }
                      ]}>
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
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
        
        {/* KATEGORİ: JOKERLER */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Taktiksel Güçler</Text>
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
          <Text style={styles.sectionTitle}>Kasa Doldur</Text>
          <Text style={styles.sectionSub}>Elmaslarını coine dönüştür.</Text>
        </View>
        <View style={styles.gridContainer}>
          {STORE_DATA.coins.map(item => renderBoxCard(item))}
        </View>

        {/* KATEGORİ: ELMASLAR */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Premium Elmas</Text>
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
                        {/* 🚀 YENİ: Modalda dinamik fiyatı bas */}
                        <Text style={styles.buyBtnText}>
                          {selectedItem.displayPrice || selectedItem.price} {selectedItem.type === 'real' ? 'ile Satın Al' : selectedItem.type.toUpperCase() + ' ÖDE'}
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

  // 🚀 --- CUSTOM ALERT STYLES (iOS NATIVE YAKLAŞIMI) ---
  alertOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.4)', // iOS standart arka plan karartması
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  alertContainer: { 
    width: 270, // iOS alert genişliği
    backgroundColor: 'rgba(250, 250, 250, 0.93)', // Transparan beyazımsı görünüm
    borderRadius: 14, 
    alignItems: 'center', 
    overflow: 'hidden'
  },
  alertHeaderArea: {
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 16,
    alignItems: 'center'
  },
  alertTitle: { 
    fontSize: 17, 
    fontFamily: 'Nunito_700Bold', 
    color: '#000', 
    textAlign: 'center',
    marginBottom: 4
  },
  alertMessage: { 
    fontSize: 13, 
    fontFamily: 'Nunito_600SemiBold', 
    color: '#000', 
    textAlign: 'center', 
    lineHeight: 18 
  },
  alertButtonGroup: { 
    width: '100%', 
    alignItems: 'center' 
  },
  alertSeparator: {
    width: '100%',
    height: StyleSheet.hairlineWidth, // En ince ve zarif çizgi
    backgroundColor: 'rgba(60, 60, 67, 0.29)' // iOS standart ayırıcı rengi
  },
  alertBtn: { 
    height: 44, 
    justifyContent: 'center', 
    alignItems: 'center', 
    width: '100%' 
  },
  alertBtnText: { 
    fontSize: 17, 
    fontFamily: 'Nunito_600SemiBold',
  }
});