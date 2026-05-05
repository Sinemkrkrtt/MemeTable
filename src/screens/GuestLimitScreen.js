import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Alert, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  initConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  endConnection,
  purchaseUpdatedListener,
  purchaseErrorListener,
} from 'react-native-iap';
import { auth } from '../services/firebase';
import { api, describeApiError } from '../services/api';

const { width } = Dimensions.get('window');

const itemSkus = Platform.select({
  ios: ['com.sinem.memetable.app.matches_3'],
  android: ['com.sinem.memetable.app.matches_3'],
});

const theme = {
  white: '#FFFFFF',
  pink: '#FF69EB',
  orange: '#FFBF81',
  deepText: '#0F172A',
  subText: '#64748B',
  gold: '#FBBF24',
  border: '#E2E8F0',
};

export default function GuestLimitScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const processedTxRef = useRef(new Set());

  useEffect(() => {
    let cancelled = false;
    let purchaseUpdateSubscription;
    let purchaseErrorSubscription;

    const initializeIAP = async () => {
      try {
        await initConnection();
        if (cancelled) return;

        const products = await fetchProducts({ skus: itemSkus, type: 'in-app' });
        if (cancelled) return;
        console.log("App Store Ürünleri:", products);

        purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
          const token = purchase?.purchaseToken ?? purchase?.id;
          if (!token) return;

          const txId = purchase?.id ?? token;
          if (processedTxRef.current.has(txId)) {
            try { await finishTransaction({ purchase, isConsumable: true }); } catch {}
            return;
          }
          processedTxRef.current.add(txId);

          const user = auth.currentUser;
          if (!user) {
            try { await finishTransaction({ purchase, isConsumable: true }); } catch {}
            setLoading(false);
            return;
          }

          try {
            // Cloud Function ile receipt doğrulama + Firestore güncellemesi sunucu tarafında
            await api.validatePurchase({
              platform: Platform.OS,
              productId: purchase.productId
                ?? (Array.isArray(purchase.productIds) ? purchase.productIds[0] : null)
                ?? itemSkus[0],
              transactionId: purchase.id ?? token,
              receipt: purchase.transactionReceipt ?? purchase.purchaseToken,
              purchaseToken: purchase.purchaseToken,
            });
            await finishTransaction({ purchase, isConsumable: true });
            setLoading(false);
            Alert.alert("Başarılı!", "3 yeni oyun hakkı tanımlandı.", [
              { text: "Tamam", onPress: () => navigation.navigate('Home') }
            ]);
          } catch (e) {
            console.warn('Sunucu doğrulama hatası:', e);
            processedTxRef.current.delete(txId);
            setLoading(false);
            Alert.alert('Hata', describeApiError(e));
          }
        });

        purchaseErrorSubscription = purchaseErrorListener((error) => {
          console.warn('Satın alma hatası:', error);
          setLoading(false);
          if (error.code !== 'E_USER_CANCELLED') {
            Alert.alert('Hata', 'İşlem sırasında bir sorun oluştu.');
          }
        });

        // Async init sırasında cleanup geçtiyse listener'ları anında kaldır
        if (cancelled) {
          purchaseUpdateSubscription?.remove();
          purchaseErrorSubscription?.remove();
        }
      } catch (err) {
        console.warn("IAP Başlatma Hatası:", err);
      }
    };

    initializeIAP();

    return () => {
      cancelled = true;
      if (purchaseUpdateSubscription) purchaseUpdateSubscription.remove();
      if (purchaseErrorSubscription) purchaseErrorSubscription.remove();
      endConnection();
    };
  }, []);

  const handleRealPurchase = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const products = await fetchProducts({ skus: itemSkus, type: 'in-app' });

      if (!products || products.length === 0) {
        Alert.alert("Ürün bulunamadı", "App Store/Play Store'dan ürün bilgisi alınamadı. Lütfen daha sonra tekrar deneyin.");
        setLoading(false);
        return;
      }

      await requestPurchase({
        request: {
          ios: { sku: itemSkus[0] },
          android: { skus: [itemSkus[0]] },
        },
        type: 'in-app',
      });
      // Apple/Google diyaloğu açıldı; kullanıcı işlemi bitirinceye kadar
      // butonun kilitli kalması için setLoading(false) listener tarafında.
    } catch (err) {
      console.log("Detaylı Hata:", err);
      if (err?.code !== 'E_USER_CANCELLED') {
        Alert.alert("İşlem Başarısız", err?.message ?? 'Bilinmeyen hata');
      }
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.contentCard}>
        <LinearGradient colors={[theme.pink, theme.orange]} style={styles.headerIconContainer}>
          <MaterialCommunityIcons name="crown" size={54} color="white" />
        </LinearGradient>

        <Text style={styles.title}>Maceraya Devam Et!</Text>
        <Text style={styles.description}>
          Ücretsiz deneme hakların bitti. Ama <Text style={{color: theme.deepText, fontWeight: '700'}}>eğlence devam ediyor!</Text> Kayıt olarak tüm özelliklere erişebilirsin.
        </Text>

        <View style={styles.benefitList}>
           <View style={styles.benefitItem}>
              <View style={styles.benefitIconCircle}>
                <Ionicons name="gift-outline" size={18} color={theme.pink} />
              </View>
              <Text style={styles.benefitText}>100 Coin & 10 Elmas Hediye</Text>
           </View>
           
           <View style={styles.benefitItem}>
              <View style={styles.benefitIconCircle}>
                <Ionicons name="people-outline" size={18} color={theme.pink} />
              </View>
              <Text style={styles.benefitText}>Oda Kur ve Arkadaşlarınla Oyna</Text>
           </View>
           
           <View style={styles.benefitItem}>
              <View style={styles.benefitIconCircle}>
                <MaterialCommunityIcons name="flash-outline" size={18} color={theme.pink} />
              </View>
              <Text style={styles.benefitText}>Kart/Deste Değiştir ve Süreyi Dondur Jokerleri Kazan</Text>
           </View>
        </View>

        <TouchableOpacity 
          activeOpacity={0.9}
          style={styles.mainButtonShadow}
          onPress={() => navigation.navigate('AuthScreen')}
        >
          <LinearGradient colors={[theme.pink, theme.orange]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.mainButton}>
            <Text style={styles.mainButtonText}>Hemen Ücretsiz Kayıt Ol</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8}
          style={styles.premiumCardContainer} 
          onPress={handleRealPurchase}
          disabled={loading}
        >
          <LinearGradient
            colors={['#FFF9F0', '#FFF3E0']} 
            style={styles.premiumCardInner}
          >
            <View style={styles.premiumLeft}>
              <View style={styles.goldIconBadge}>
                <MaterialCommunityIcons name="lightning-bolt" size={24} color={theme.gold} />
              </View>
              <View>
                <Text style={styles.premiumTag}>ÖZEL PAKET</Text>
                <Text style={styles.premiumTitle}>3 Ekstra Maç</Text>
              </View>
            </View>

            <View style={styles.premiumPriceTag}>
              {loading ? (
                <ActivityIndicator size="small" color={theme.white} />
              ) : (
                <Text style={styles.premiumPriceText}>₺29,99</Text>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Daha sonra belki...</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  glowTop: { position: 'absolute', top: -120, right: -120, width: 350, height: 350, borderRadius: 175, backgroundColor: theme.pink, opacity: 0.1 },
  glowBottom: { position: 'absolute', bottom: -120, left: -120, width: 350, height: 350, borderRadius: 175, backgroundColor: theme.orange, opacity: 0.1 },
  contentCard: { width: width * 0.92, backgroundColor: theme.white, borderRadius: 38, padding: 24, alignItems: 'center', shadowColor: '#1E293B', shadowOpacity: 0.06, shadowRadius: 20, elevation: 10 },
  headerIconContainer: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginTop: -72, borderWidth: 8, borderColor: '#F8FAFC' },
  title: { fontSize: 26, fontWeight: '900', color: theme.deepText, marginTop: 15, textAlign: 'center' },
  description: { fontSize: 14, color: theme.subText, textAlign: 'center', lineHeight: 20, marginVertical: 18 },
  benefitList: { width: '100%', marginBottom: 25 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, paddingLeft: 10, paddingRight: 10 },
  benefitIconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF5FD', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  benefitText: { flex: 1, color: theme.deepText, fontSize: 14, fontWeight: '600', lineHeight: 18 },
  mainButtonShadow: { width: '100%', borderRadius: 20, shadowColor: theme.pink, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  mainButton: { height: 58, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  mainButtonText: { color: 'white', fontSize: 17, fontWeight: '800' },
  premiumCardContainer: { width: '100%', marginTop: 15, borderRadius: 22, backgroundColor: theme.white, shadowColor: theme.orange, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5, overflow: 'hidden', borderWidth: 1.5, borderColor: '#FFE0B2' },
  premiumCardInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 16 },
  premiumLeft: { flexDirection: 'row', alignItems: 'center' },
  goldIconBadge: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.white, justifyContent: 'center', alignItems: 'center', marginRight: 12, elevation: 2 },
  premiumTag: { fontSize: 10, fontWeight: '900', color: theme.orange, letterSpacing: 1.2, marginBottom: 2 },
  premiumTitle: { fontSize: 17, fontWeight: '900', color: theme.deepText },
  premiumPriceTag: { backgroundColor: theme.deepText, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 15 },
  premiumPriceText: { fontSize: 14, fontWeight: '900', color: theme.white },
  backLink: { marginTop: 22, padding: 5 },
  backLinkText: { color: theme.subText, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' }
});