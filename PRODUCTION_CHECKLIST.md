# MemeTable — Yayın Öncesi Kontrol Listesi

Kodda yapılan tüm güvenlik / bug düzeltmeleri tamamlandı. **Aşağıdaki adımlar
manuel ve sadece sen yapabilirsin** — AdMob/Apple/Google hesapları, gizlilik
politikası, deploy komutları vs.

---

## 1. Cloud Functions Kurulumu (BLOKER)

### a) Firebase Blaze plana geç
Cloud Functions Blaze (pay-as-you-go) gerektirir. Free plan'da deploy edemezsin.

```
https://console.firebase.google.com/project/memetable-official/usage/details
```

### b) Functions klasörü dependency'lerini yükle
```bash
cd functions
npm install
```

### c) Apple shared secret'i environment'a ekle
App Store Connect → My Apps → MemeTable → App Information → "App-Specific Shared Secret"

```bash
firebase functions:config:set apple.shared_secret="YOUR_APPLE_SHARED_SECRET"
firebase functions:config:set android.package_name="com.sinem.memetable.app"
```

VEYA modern syntax (önerilen):
```bash
firebase functions:secrets:set APPLE_SHARED_SECRET
firebase functions:secrets:set ANDROID_PACKAGE_NAME
```

### d) Google Play Service Account JSON
1. Google Play Console → Setup → API access
2. "Create new service account" → Google Cloud'a yönlendirir
3. Roles: "Service Account User"
4. JSON key indir
5. Functions için credentials environment variable'ı ayarla (deploy sırasında otomatik picked up edilir veya GOOGLE_APPLICATION_CREDENTIALS path'i ver)

### e) Deploy
```bash
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only database
```

**Mevcut firebase rules'ın yedeğini al** — `firestore.rules` ve `database.rules.json`
şu anki canlı kuralları override edecek. Backup için Firebase Console'dan
indirip kaydet.

---

## 2. AdMob Production ID (BLOKER)

`Market.js:96` satırını güncelle:
```js
const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-XXXXXXXXX/XXXXXXXXX';
```

`app.json` içindeki AdMob app ID'leri de test ID'leri (`3940256099942544`).
Production AdMob app ID'lerini AdMob console'dan al ve değiştir:
```json
"androidAppId": "ca-app-pub-XXXXXXX~YYYYYYY",
"iosAppId": "ca-app-pub-XXXXXXX~YYYYYYY"
```

---

## 3. App Store Connect / Play Console (BLOKER)

### iOS (App Store Connect)
- [ ] Paid Apps Agreement onaylı
- [ ] Banking / Tax bilgileri eksiksiz
- [ ] In-App Purchase ürünleri (consumable):
  - `com.sinem.memetable.app.matches_3` — ₺X
  - `com.sinem.memetable.app.diamonds_50` — ₺29.99
  - `com.sinem.memetable.app.diamonds_250` — ₺99.99
- [ ] Tüm ürünler "Ready to Submit" durumunda
- [ ] App-Specific Shared Secret oluşturulmuş ve Cloud Functions'a verilmiş

### Android (Play Console)
- [ ] Merchant account aktif
- [ ] In-App Products (managed, consumable):
  - Yukarıdakiyle aynı 3 product ID, aynı fiyat tier'larında
- [ ] Internal testing track'e build yüklenmiş
- [ ] Lisanslı tester e-postaları eklenmiş
- [ ] Service account oluşturulmuş, JSON key alınmış

---

## 4. Privacy & Yasal (BLOKER)

### Gizlilik Politikası + Kullanım Şartları
- [ ] Web'de host edilmiş URL (örn. memetable.com/privacy)
- [ ] AuthScreen'de kayıt butonu üstünde küçük link
- [ ] App Store / Play Console metadata'da URL girilmiş
- [ ] KVKK uyumluluğu — Türkiye'de yayın yapacaksan zorunlu (kişisel veri envanteri,
      veri saklama süresi, kullanıcı silme hakkı)

### App Tracking Transparency (iOS)
`expo-tracking-transparency` ekle ve `requestTrackingPermissionsAsync()` çağır
(AdMob personalize ads için):
```bash
npx expo install expo-tracking-transparency
```
App.js veya AuthScreen mount'unda:
```js
import * as Tracking from 'expo-tracking-transparency';
await Tracking.requestTrackingPermissionsAsync();
```

---

## 5. Crashlytics (BLOKER)

```bash
npx expo install @react-native-firebase/app @react-native-firebase/crashlytics
```

`app.json`'da plugins'e ekle:
```json
"plugins": [
  "@react-native-firebase/app",
  "@react-native-firebase/crashlytics",
  ...
]
```

App.js'in en üstünde:
```js
import crashlytics from '@react-native-firebase/crashlytics';
// global error handler
const originalHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  crashlytics().recordError(error);
  originalHandler(error, isFatal);
});
```

---

## 6. Misafir Suistimal Koruması (ÖNEMLİ)

Şu an `signInAnonymously` her seferinde yeni `uid` üretir → kullanıcı sınırsız
misafir hesabı açabilir. Cihaz başına 1 misafir limiti için:

### iOS
`expo-application` ile `getIosIdForVendorAsync()` — cihaz vendor ID'si.
Bu ID'yi Cloud Function'a göndererek "bu cihaz daha önce misafir hesabı
açtı mı?" kontrolü yap.

### Android
Play Integrity API veya `expo-application.androidId`.

Ek bir Cloud Function: `createGuestAccount` — vendor ID + Firestore'da
`guestDevices/{vendorId}` koleksiyonunda kontrol → varsa eski uid'le
sign in yap, yoksa yeni anonim oluştur.

Bu yapılana kadar misafir spam'i mümkün.

---

## 7. Bot AI Notu (NICE-TO-HAVE)

Mevcut yapıda botlar `WAITING_CARDS` ve `WAITING_VOTES` fazlarında host
tarafından **2.5sn force-fill timeout** ile rastgele kart atılıyor / oy
veriliyor. Süre dolmadan önce hareket etmiyorlar.

Daha "doğal" bot davranışı için RoomScreen'de `phase === 'PLAYING'` ve
`phase === 'VOTING'` fazlarında her bot için rastgele 2-6sn gecikmeyle
host'un kart attırması/oy verdirmesi eklenebilir. Şu hâli oynanabilir
ama bot'un bot olduğunu deneyimli oyuncular fark eder.

---

## 8. Eksik UX İyileştirmeleri (OPSİYONEL)

- [ ] Push notifications (FCM) — günlük görev hatırlatma
- [ ] Analytics (Firebase Analytics) — kullanıcı funnel
- [ ] Sound mute persistence (AsyncStorage) — şu an her oturumda reset
- [ ] Settings ekranı (mute, dil, gizlilik)
- [ ] Tutorial / onboarding ilk kez girenler için
- [ ] Player profile / istatistikler

---

## 9. Test Senaryoları (DEPLOY ÖNCESİ ZORUNLU)

| # | Senaryo | Beklenen |
|---|---|---|
| 1 | Sandbox IAP (iOS gerçek cihaz) | Receipt doğrulanır, diamond/match yansır |
| 2 | Aynı transaction iki kez triggered (Apple replay) | İkinci sefer `alreadyProcessed: true` döner, çift yazma yok |
| 3 | Joker satın alma — yetersiz coin | "Yetersiz coin" alert, Firestore yazılmaz |
| 4 | Daily mission — bugün zaten alındı | "Bugünün ödülü zaten alındı" |
| 5 | 2 cihazla aynı nickname kayıt yarışı | Biri başarılı, diğeri "Bu nickname kullanılıyor" |
| 6 | 5. oyuncu LobbyScreen'e girmeye çalışır | "Oda Dolu" alert |
| 7 | Host odadan ayrılır | İkinci oyuncu otomatik host olur, "OYUNU BAŞLAT" görür |
| 8 | Skor sync (4 cihaz) | Final puanlar tüm cihazlarda aynı |
| 9 | Network kopukluğu | DisconnectModal görünür, dönünce devam |
| 10 | Misafir 3 maç oynar → GuestLimitScreen → IAP | +3 hak yansır, çift yansımaz |

---

## 10. Deploy Sırası

1. Firebase Console → Blaze plan
2. `cd functions && npm install`
3. APPLE_SHARED_SECRET ve Google service account ayarla
4. `firebase deploy --only functions,firestore:rules,database`
5. Production AdMob ID'lerini değiştir
6. App Store Connect IAP'leri "Ready to Submit"
7. Crashlytics + ATT entegrasyonu
8. Gizlilik politikası URL'i
9. EAS build (`eas build --platform all --profile production`)
10. TestFlight + Play Console internal testing — yukarıdaki 10 senaryoyu test et
11. App Store + Play Store review submit

---

## 11. Bilinen Riskler / Sınırlar

- **Misafir suistimal:** Cihaz başına 1 misafir kontrolü yok (Madde 6).
- **AdMob test ID'leri canlıda:** Madde 2'yi atlatma → reklam yüklenmez.
- **Server tarihi UTC:** `claimDailyMission` UTC midnight'ı kullanıyor; kullanıcı saat dilimine
  göre "yeni gün" başlangıcı kayabilir. Önemliyse `data.lastMissionDate` saat dilimi-aware yap.
- **`ScreenOrientation`:** RoomScreen landscape kilidini her seferinde yeniden uyguluyor.
  Tablet kullanıcıları için sorun olabilir; iPad'de test et.
- **`react-native-iap@15` Nitro modules:** EAS production build'de native compile sorunu
  yaşarsan SDK versiyonunu sabitle (`"react-native-iap": "15.2.0"`).
