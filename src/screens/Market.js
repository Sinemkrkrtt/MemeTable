import React, { useState, useEffect } from 'react'; 
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ScrollView, Modal, Dimensions, StatusBar, Image, FlatList, Alert 
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

// 🚀 FİREBASE İMPORTLARI (Kendi dosya yoluna göre '../services/firebase' kısmını kontrol et)
import { doc, onSnapshot, updateDoc, increment } from 'firebase/firestore'; 
import { db, auth } from '../services/firebase'; 

const { width } = Dimensions.get('window');
const cardWidth = (width - 55) / 2;

// 🎨 Pastel Paletin
const palet = {
  pink: '#FF69EB',
  softPink: '#FF86C8',
  salmon: '#FFA3A5',
  orange: '#FFBF81',
  yellow: '#FFDC5E',
  bg: '#F8F9FE', 
  textDark: '#1F1724',
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

  // 🚀 BAKIYELER BAŞLANGIÇTA 0, FIREBASE'DEN GELECEK
  const [userCoins, setUserCoins] = useState(0);
  const [userDiamonds, setUserDiamonds] = useState(0);

  let [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  // 🚀 FIREBASE ANLIK VERİ ÇEKME (REAL-TIME LISTENER)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return; // Kullanıcı giriş yapmamışsa durdur

    const userRef = doc(db, 'users', user.uid);
    
    // onSnapshot, veritabanındaki her değişikliği anında ekrana yansıtır
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserCoins(data.coins || 0);
        setUserDiamonds(data.diamonds || 0);
      }
    });

    return () => unsubscribe(); // Sayfadan çıkınca dinlemeyi bırak
  }, []);

 // 🚀 FIREBASE'E YAZAN SATIN ALMA FONKSİYONU
  const handlePurchase = async (item) => {
    if (!item) return;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Hata", "Lütfen önce giriş yapın.");
      return;
    }

    const userRef = doc(db, 'users', user.uid);

    try {
      if (item.type === 'coin') {
        // Joker Satın Alma (Coin ile alınır)
        if (userCoins >= item.price) {
          
          // 🚀 KRİTİK DÜZELTME: jokers.item.id YERİNE direkt item.id kullanıyoruz
          // Çünkü veritabanında joker_skip, joker_double gibi ana dizindeler.
          await updateDoc(userRef, {
            coins: increment(-item.price), // Kasadan coini düş
            [item.id]: increment(1)        // joker_skip, joker_double veya joker_freeze'i 1 artır
          });

          Alert.alert("Başarılı!", `Tebrikler, ${item.name} envanterinize eklendi.`);
          setModalVisible(false);
        } else {
          Alert.alert("Yetersiz Bakiye", "Bunun için yeterli coininiz yok. Lütfen kasa doldurun.");
        }
      } 
      else if (item.type === 'diamond') {
        // Coin Satın Alma (Elmas ile alınır)
        if (userDiamonds >= item.price) {
          await updateDoc(userRef, {
            diamonds: increment(-item.price), 
            coins: increment(item.amount)     
          });
          Alert.alert("Kasa Doldu!", `Tebrikler, +${item.amount} Coin hesabınıza eklendi.`);
          setModalVisible(false);
        } else {
          Alert.alert("Yetersiz Elmas", "Yeterli elmasınız yok. Lütfen premium elmas satın alın.");
        }
      } 
      else if (item.type === 'real') {
        // Elmas Satın Alma (Gerçek Para Simülasyonu)
        Alert.alert(
          "Ödeme Onayı", 
          `${item.price} tutarındaki ödeme App Store / Google Play üzerinden yapılacaktır. Onaylıyor musunuz?`,
          [
            { text: "İptal", style: "cancel" },
            { 
              text: "Satın Al", 
              onPress: async () => {
                await updateDoc(userRef, { 
                  diamonds: increment(item.amount) 
                });
                Alert.alert("Ödeme Başarılı!", `Tebrikler, +${item.amount} Elmas hesabınıza eklendi.`);
                setModalVisible(false);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error("Satın alma hatası:", error);
      Alert.alert("Hata", "İşlem gerçekleştirilemedi.");
    }
  };

  const renderIcon = (item, size) => {
    if (item.iconFamily === 'FontAwesome5') {
      return <FontAwesome5 name={item.icon} size={size} color={item.color} />;
    }
    return <Ionicons name={item.icon} size={size} color={item.color} />;
  };

  const renderJokerCard = (item) => (
    <TouchableOpacity key={item.id} style={styles.jokerCard} activeOpacity={0.9} onPress={() => { setSelectedItem(item); setModalVisible(true); }}>
      <View style={[styles.jokerIconBg, { backgroundColor: item.color + '15' }]}>
        <Image source={item.source} style={styles.jokerImage} resizeMode="contain" />
      </View>
      <View style={styles.jokerInfo}>
        <Text style={styles.jokerName}>{item.name}</Text>
        <Text style={styles.jokerDesc} numberOfLines={2}>{item.desc}</Text>
        <LinearGradient colors={[palet.yellow, palet.orange]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={[styles.actionButton, { marginTop: 8 }]}>
          <FontAwesome5 name="coins" size={12} color="white" style={{ marginRight: 6 }} />
          <Text style={styles.actionButtonText}>{item.price}</Text>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );

  const renderBoxCard = (item) => (
    <TouchableOpacity key={item.id} style={styles.boxCard} activeOpacity={0.9} onPress={() => { setSelectedItem(item); setModalVisible(true); }}>
      {item.badge && (
        <LinearGradient colors={['#FF007A', '#FF69EB']} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </LinearGradient>
      )}
      <View style={[styles.boxIconBg, { backgroundColor: item.color + '15' }]}>
        {renderIcon(item, 45)}
      </View>
      <Text style={styles.boxName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.boxAmount}>+{item.amount}</Text>
      <LinearGradient colors={[palet.pink, palet.orange]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={[styles.actionButton, { marginTop: 15, width: '100%' }]}>
        {item.type !== 'real' && <FontAwesome5 name={item.type === 'coin' ? 'coins' : 'gem'} size={12} color="white" style={{ marginRight: 6 }} />}
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

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={palet.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MAĞAZA</Text>
        <View style={styles.premiumVault}>
          <View style={styles.vaultItem}>
            <FontAwesome5 name="coins" size={13} color="yellow" />
            <Text style={styles.vaultText}>{userCoins}</Text>
          </View>
          <View style={styles.vaultSeparator} />
          <View style={styles.vaultItem}>
            <FontAwesome5 name="gem" size={13} color="lightblue" />
            <Text style={styles.vaultText}>{userDiamonds}</Text>
          </View>
        </View>
      </View>

      {/* TÜM MARKET ANA KAYDIRMA ALANI */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50, paddingTop: 10 }}>
        
        {/* KATEGORİ: ÜCRETSİZ KAZAN */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎁 Ücretsiz Ödüller</Text>
          <Text style={styles.sectionSub}>Kısa bir video izle, kasanı doldur.</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.adBannerCard} 
          activeOpacity={0.9} 
          onPress={() => Alert.alert('Reklam', 'Bu özellik uygulama markete yüklendiğinde aktif olacaktır.')}
        >
          <LinearGradient colors={[palet.orange, palet.pink]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={styles.adBannerGradient}>
            <View style={styles.adBannerInfo}>
              <View style={styles.adIconContainer}>
                <Ionicons name="play-circle" size={32} color={palet.pink} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.adBannerTitle}>Reklam İzle</Text>
                <Text style={styles.adBannerSub}>Ücretsiz Coin Kazan</Text>
              </View>
            </View>
            <View style={styles.adRewardBox}>
              <Text style={styles.adRewardText}>+50</Text>
              <FontAwesome5 name="coins" size={14} color="#FFD700" style={{ marginLeft: 4 }} />
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
          contentContainerStyle={{ paddingLeft: 12, paddingRight: 20 }}
          snapToInterval={width * 0.85 + 16} 
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
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Ionicons name="close-circle" size={32} color="#E0E0E0" />
            </TouchableOpacity>

            {selectedItem && (
              <>
                <View style={[styles.modalIconBg, { backgroundColor: selectedItem.color + '20' }]}>
                  {selectedItem.isImage ? (
                    <Image source={selectedItem.source} style={{ width: 80, height: 80 }} resizeMode="contain" />
                  ) : (
                    renderIcon(selectedItem, 80)
                  )}
                </View>
                
                <Text style={styles.modalTitle}>{selectedItem.name}</Text>
                {selectedItem.desc && <Text style={styles.modalDesc}>{selectedItem.desc}</Text>}
                {selectedItem.amount && <Text style={styles.modalAmountText}>+{selectedItem.amount} İçerir</Text>}

                {/* 🚀 SATIN AL BUTONU */}
                <TouchableOpacity style={styles.buyBtn} activeOpacity={0.9} onPress={() => handlePurchase(selectedItem)}>
                  <LinearGradient colors={[palet.pink, palet.orange]} style={styles.buyBtnGradient}>
                    <Text style={styles.buyBtnText}>
                      {selectedItem.price} {selectedItem.type === 'real' ? 'ile Satın Al' : selectedItem.type.toUpperCase() + ' ÖDE'}
                    </Text>
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
  container: { flex: 1, backgroundColor: palet.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 24, fontFamily: 'Nunito_900Black', color: palet.textDark, letterSpacing: -0.5 },
  premiumVault: { flexDirection: 'row', backgroundColor: palet.salmon, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, elevation: 5, shadowColor: palet.orange, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  vaultItem: { flexDirection: 'row', alignItems: 'center' },
  vaultText: { fontFamily: 'Nunito_900Black', fontSize: 14, color: 'white', marginLeft: 6 },
  vaultSeparator: { width: 1, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 10 },
  sectionHeader: { marginHorizontal: 20, marginTop: 5, marginBottom: 15 },
  sectionTitle: { fontFamily: 'Nunito_900Black', fontSize: 20, color: palet.textDark },
  sectionSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#888', marginTop: 2 },
  gridContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  jokerCard: { flexDirection: 'row', backgroundColor: 'white', width: width * 0.85, marginHorizontal: 8, marginBottom: 15, padding: 18, borderRadius: 28, shadowColor: palet.pink, shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  jokerIconBg: { width: 75, height: 75, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  jokerImage: { width: 45, height: 45 },
  jokerInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  jokerName: { fontFamily: 'Nunito_900Black', fontSize: 17, color: palet.textDark },
  jokerDesc: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#888', marginTop: 2, lineHeight: 16 },
  boxCard: { width: cardWidth, marginBottom: 15, backgroundColor: 'white', borderRadius: 28, padding: 15, alignItems: 'center', shadowColor: palet.pink, shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  boxIconBg: { width: 65, height: 65, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  boxName: { fontFamily: 'Nunito_900Black', fontSize: 16, color: palet.textDark, textAlign: 'center' },
  boxAmount: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#888', marginTop: 4 },
  actionButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 16 },
  actionButtonText: { fontFamily: 'Nunito_900Black', fontSize: 14, color: 'white' },
  badge: { position: 'absolute', top: -12, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, zIndex: 10, shadowColor: '#FF007A', shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  badgeText: { color: 'white', fontSize: 10, fontFamily: 'Nunito_900Black', letterSpacing: 0.8, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 20, right: 20 },
  modalIconBg: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'Nunito_900Black', fontSize: 24, color: palet.textDark },
  modalDesc: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#666', textAlign: 'center', marginTop: 10 },
  modalAmountText: { fontFamily: 'Nunito_800ExtraBold', color: palet.salmon, marginTop: 15 },
  buyBtn: { width: '100%', marginTop: 30, shadowColor: palet.pink, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  buyBtnGradient: { paddingVertical: 18, borderRadius: 20, alignItems: 'center' },
  buyBtnText: { color: 'white', fontFamily: 'Nunito_900Black', fontSize: 16 },
  adBannerCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 24, shadowColor: palet.orange, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  adBannerGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 24 },
  adBannerInfo: { flexDirection: 'row', alignItems: 'center' },
  adIconContainer: { backgroundColor: 'white', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  adBannerTitle: { fontFamily: 'Nunito_900Black', fontSize: 18, color: 'white' },
  adBannerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  adRewardBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  adRewardText: { fontFamily: 'Nunito_900Black', fontSize: 18, color: 'white' }
});