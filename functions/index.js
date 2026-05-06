/**
 * MemeTable Cloud Functions
 *
 * Bu dosya, ekonomi (coin / diamond / wonHearts / jokerlar) ve in-app purchase
 * doğrulamasının server-side yapıldığı yerdir. Client artık bu alanları DOĞRUDAN
 * Firestore'a yazmamalı — bunun yerine `httpsCallable` ile aşağıdaki
 * fonksiyonları çağırır.
 *
 * Deploy: `firebase deploy --only functions` (Blaze plan gerekir)
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { SignedDataVerifier, Environment } = require('@apple/app-store-server-library');

admin.initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 20 });

const APPLE_BUNDLE_ID = 'com.sinem.memetable.app';
const CERTS_DIR = path.join(__dirname, 'certs');

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// ============================================================================
// SABİTLER
// ============================================================================

const COIN_PACKS = {
  c1: { price: 10, amount: 1000 },
  c2: { price: 40, amount: 5000 },
};

const JOKER_PRICES = {
  joker_skip: 500,
  joker_double: 800,
  joker_freeze: 1000,
};

// IAP product → kullanıcı belgesinde artırılacak alan / miktar
const IAP_PRODUCTS = {
  'com.sinem.memetable.app.matches_3': { field: 'guestMatchesLeft', amount: 3 },
  'com.sinem.memetable.app.diamonds_50': { field: 'diamonds', amount: 50 },
  'com.sinem.memetable.app.diamonds_250': { field: 'diamonds', amount: 250 },
};

// Reklam ödülü
const REWARD_AD_COIN = 50;

// Daily mission ödül dağılımı (DailyMission.js ile aynı)
const DAILY_REWARDS = [
  { id: 'joker1', weight: 3, type: 'joker', field: 'joker_skip', amount: 1 },
  { id: 'joker2', weight: 1, type: 'joker', field: 'joker_double', amount: 1 },
  { id: 'joker3', weight: 3, type: 'joker', field: 'joker_freeze', amount: 1 },
  { id: 'coin', weight: 5, type: 'currency', field: 'coins', amount: 500 },
  { id: 'diamond', weight: 1, type: 'currency', field: 'diamonds', amount: 10 },
];

const DAILY_HEART_REQUIREMENT = 3;

// ============================================================================
// HELPERS
// ============================================================================

function requireAuth(request) {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Giriş yapılmalı.');
  }
  return request.auth.uid;
}

function pickWeightedReward() {
  const total = DAILY_REWARDS.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const r of DAILY_REWARDS) {
    roll -= r.weight;
    if (roll < 0) return r;
  }
  return DAILY_REWARDS[DAILY_REWARDS.length - 1];
}

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

// ============================================================================
// IAP DOĞRULAMA
// ============================================================================

// Apple StoreKit 2 JWS (signedTransaction) doğrulaması.
// Cert chain validation Apple Root CA'lere kadar yapılır → imzayı saldırgan üretemez.
let _appleRootCAs = null;
const _verifierCache = {};

function loadAppleRootCAs() {
  if (_appleRootCAs) return _appleRootCAs;
  if (!fs.existsSync(CERTS_DIR)) {
    throw new HttpsError(
      'failed-precondition',
      'functions/certs/ dizini yok. Apple Root CA cert dosyalarını yerleştir.'
    );
  }
  const files = fs.readdirSync(CERTS_DIR).filter((f) => f.endsWith('.cer') || f.endsWith('.pem'));
  if (!files.length) {
    throw new HttpsError(
      'failed-precondition',
      'functions/certs/ içinde Apple Root CA cert dosyası yok (AppleRootCA-G3.cer vb.).'
    );
  }
  _appleRootCAs = files.map((f) => fs.readFileSync(path.join(CERTS_DIR, f)));
  return _appleRootCAs;
}

function getAppleVerifier(env) {
  if (_verifierCache[env]) return _verifierCache[env];
  const roots = loadAppleRootCAs();
  const verifier = new SignedDataVerifier(
    roots,
    false, // enableOnlineChecks: çevrimdışı cert/imza doğrulaması yeterli
    env === 'sandbox' ? Environment.SANDBOX : Environment.PRODUCTION,
    APPLE_BUNDLE_ID
  );
  _verifierCache[env] = verifier;
  return verifier;
}

// JWS'i sandbox sonra production olarak dene; ilk başaran kazanır.
async function verifyAppleJWS(signedTransaction) {
  const errors = [];
  for (const env of ['sandbox', 'production']) {
    try {
      const v = getAppleVerifier(env);
      return await v.verifyAndDecodeTransaction(signedTransaction);
    } catch (e) {
      errors.push(`${env}: ${e?.message || e}`);
    }
  }
  throw new HttpsError('invalid-argument', `Apple JWS doğrulanamadı (${errors.join(' | ')})`);
}

// Google Play Developer API ile purchase doğrulaması
async function verifyGooglePurchase(productId, purchaseToken) {
  const packageName = process.env.ANDROID_PACKAGE_NAME;
  if (!packageName) {
    throw new HttpsError('failed-precondition', 'ANDROID_PACKAGE_NAME tanımlı değil.');
  }

  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  const androidpublisher = google.androidpublisher({ version: 'v3', auth });

  const result = await androidpublisher.purchases.products.get({
    packageName,
    productId,
    token: purchaseToken,
  });

  // purchaseState: 0 = purchased, 1 = canceled, 2 = pending
  if (result.data.purchaseState !== 0) {
    throw new HttpsError('invalid-argument', `Purchase aktif değil (state: ${result.data.purchaseState})`);
  }
  // consumptionState: 0 = unconsumed (henüz tüketilmemiş)
  return result.data;
}

/**
 * IAP satın almasını doğrula ve kullanıcıya ödülünü yansıt.
 *
 * @param data.platform 'ios' | 'android'
 * @param data.productId 'com.sinem.memetable.app.matches_3' vb.
 * @param data.transactionId Client'ın gönderdiği transaction id (cross-session dedupe için)
 * @param data.purchaseToken iOS = StoreKit 2 JWS (signedTransaction), Android = Google Play token
 */
exports.validatePurchase = onCall({ enforceAppCheck: false }, async (request) => {
  const uid = requireAuth(request);
  const { platform, productId, purchaseToken } = request.data || {};
  let { transactionId } = request.data || {};

  if (!platform || !productId || !transactionId || !purchaseToken) {
    throw new HttpsError('invalid-argument', 'platform / productId / transactionId / purchaseToken zorunlu.');
  }

  const productConfig = IAP_PRODUCTS[productId];
  if (!productConfig) {
    throw new HttpsError('invalid-argument', `Tanımsız ürün: ${productId}`);
  }

  // Doğrulama: client iddialarına güvenmiyoruz — productId / bundleId / transactionId imzalı
  // payload'la eşleşmek zorunda.
  if (platform === 'ios') {
    const decoded = await verifyAppleJWS(purchaseToken);
    if (decoded.bundleId !== APPLE_BUNDLE_ID) {
      throw new HttpsError('invalid-argument', 'bundleId eşleşmiyor.');
    }
    if (decoded.productId !== productId) {
      throw new HttpsError('invalid-argument', 'productId eşleşmiyor.');
    }
    // İmzalı transactionId'yi otoriter kabul et (client manipüle etmiş olabilir).
    transactionId = String(decoded.transactionId);
  } else if (platform === 'android') {
    await verifyGooglePurchase(productId, purchaseToken);
  } else {
    throw new HttpsError('invalid-argument', `Bilinmeyen platform: ${platform}`);
  }

  // Cross-session dedupe — verify SONRASI yap ki client uydurma transactionId ile
  // gerçek bir purchaseToken'i hiç işlenmiş gibi gösteremesin.
  const txRef = db.collection('processedPurchases').doc(transactionId);
  const txSnap = await txRef.get();
  if (txSnap.exists) {
    return { alreadyProcessed: true };
  }

  // Atomik: hem kullanıcının ekonomisini güncelle hem de processedPurchases'a yaz
  const userRef = db.collection('users').doc(uid);
  await db.runTransaction(async (t) => {
    const dup = await t.get(txRef);
    if (dup.exists) return; // race güvencesi
    // set + merge: user doc yoksa otomatik oluşturulsun ki update 'not-found' atmasın.
    t.set(
      userRef,
      { [productConfig.field]: FieldValue.increment(productConfig.amount) },
      { merge: true }
    );
    t.set(txRef, {
      uid,
      platform,
      productId,
      field: productConfig.field,
      amount: productConfig.amount,
      processedAt: FieldValue.serverTimestamp(),
    });
  });

  return { ok: true, field: productConfig.field, amount: productConfig.amount };
});

// ============================================================================
// COIN İLE JOKER SATIN ALMA
// ============================================================================

exports.purchaseJokerWithCoins = onCall(async (request) => {
  const uid = requireAuth(request);
  const { jokerId } = request.data || {};

  const price = JOKER_PRICES[jokerId];
  if (!price) {
    throw new HttpsError('invalid-argument', `Geçersiz joker: ${jokerId}`);
  }

  const userRef = db.collection('users').doc(uid);
  await db.runTransaction(async (t) => {
    const snap = await t.get(userRef);
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Kullanıcı bulunamadı.');
    }
    const coins = snap.data().coins || 0;
    if (coins < price) {
      throw new HttpsError('failed-precondition', 'Yetersiz coin.');
    }
    t.update(userRef, {
      coins: FieldValue.increment(-price),
      [jokerId]: FieldValue.increment(1),
    });
  });

  return { ok: true };
});

// ============================================================================
// DIAMOND İLE COIN PAKETİ ALMA
// ============================================================================

exports.purchaseCoinPack = onCall(async (request) => {
  const uid = requireAuth(request);
  const { packId } = request.data || {};

  const pack = COIN_PACKS[packId];
  if (!pack) {
    throw new HttpsError('invalid-argument', `Geçersiz paket: ${packId}`);
  }

  const userRef = db.collection('users').doc(uid);
  await db.runTransaction(async (t) => {
    const snap = await t.get(userRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Kullanıcı bulunamadı.');
    const diamonds = snap.data().diamonds || 0;
    if (diamonds < pack.price) {
      throw new HttpsError('failed-precondition', 'Yetersiz elmas.');
    }
    t.update(userRef, {
      diamonds: FieldValue.increment(-pack.price),
      coins: FieldValue.increment(pack.amount),
    });
  });

  return { ok: true, coinsAdded: pack.amount };
});

// ============================================================================
// JOKER KULLANIMI (oyun içinde)
// ============================================================================

exports.consumeJoker = onCall(async (request) => {
  const uid = requireAuth(request);
  const { jokerId } = request.data || {};

  if (!Object.prototype.hasOwnProperty.call(JOKER_PRICES, jokerId)) {
    throw new HttpsError('invalid-argument', `Geçersiz joker: ${jokerId}`);
  }

  const userRef = db.collection('users').doc(uid);
  await db.runTransaction(async (t) => {
    const snap = await t.get(userRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Kullanıcı bulunamadı.');
    const count = snap.data()[jokerId] || 0;
    if (count <= 0) {
      throw new HttpsError('failed-precondition', 'Bu jokerden envanterinde yok.');
    }
    t.update(userRef, { [jokerId]: FieldValue.increment(-1) });
  });

  return { ok: true };
});

// ============================================================================
// REKLAM ÖDÜLÜ
// ============================================================================

exports.claimRewardAd = onCall(async (request) => {
  const uid = requireAuth(request);
  const { adRewardId } = request.data || {};

  if (!adRewardId || typeof adRewardId !== 'string') {
    throw new HttpsError('invalid-argument', 'adRewardId zorunlu.');
  }

  // Aynı reklam ID'si tekrar kullanılamaz (replay koruması)
  const rewardRef = db.collection('processedAdRewards').doc(`${uid}_${adRewardId}`);
  const userRef = db.collection('users').doc(uid);

  await db.runTransaction(async (t) => {
    const dup = await t.get(rewardRef);
    if (dup.exists) {
      throw new HttpsError('already-exists', 'Bu ödül zaten verildi.');
    }
    t.update(userRef, { coins: FieldValue.increment(REWARD_AD_COIN) });
    t.set(rewardRef, { uid, processedAt: FieldValue.serverTimestamp() });
  });

  return { ok: true, coins: REWARD_AD_COIN };
});

// ============================================================================
// GÜNLÜK GÖREV
// ============================================================================

// Mount sırasında çağrılır: yeni gün başladıysa wonHearts/isBoxOpened sıfırlanır.
// Server tarihi otoritedir, böylece client clock manipülasyonu mümkün değil.
exports.resetDailyIfNeeded = onCall(async (request) => {
  const uid = requireAuth(request);
  const userRef = db.collection('users').doc(uid);
  const today = todayKey();

  const result = await db.runTransaction(async (t) => {
    const snap = await t.get(userRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Kullanıcı bulunamadı.');
    const data = snap.data();

    if (data.lastMissionDate === today) {
      return { reset: false, wonHearts: data.wonHearts || 0, isBoxOpened: !!data.isBoxOpened };
    }
    t.update(userRef, {
      wonHearts: 0,
      isBoxOpened: false,
      lastMissionDate: today,
    });
    return { reset: true, wonHearts: 0, isBoxOpened: false };
  });

  return result;
});

exports.claimDailyMission = onCall(async (request) => {
  const uid = requireAuth(request);
  const userRef = db.collection('users').doc(uid);
  const today = todayKey();

  return await db.runTransaction(async (t) => {
    const snap = await t.get(userRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Kullanıcı bulunamadı.');
    const data = snap.data();

    // Bugün zaten claim edilmiş mi?
    if (data.lastMissionDate === today && data.isBoxOpened === true) {
      throw new HttpsError('failed-precondition', 'Bugünün ödülü zaten alındı.');
    }

    // Yeterli kalp var mı?
    const hearts = data.wonHearts || 0;
    if (hearts < DAILY_HEART_REQUIREMENT) {
      throw new HttpsError('failed-precondition', 'Yeterli kalp yok.');
    }

    const reward = pickWeightedReward();
    const updates = {
      wonHearts: 0,
      isBoxOpened: true,
      lastMissionDate: today,
      [reward.field]: FieldValue.increment(reward.amount),
    };
    t.update(userRef, updates);

    return { ok: true, reward };
  });
});

// ============================================================================
// OYUN SONU — wonHearts artırma (host tarafından çağrılır)
// ============================================================================
//
// RoomScreen `roundResult.gameWinners` listesi yayınlandığında, host bu Cloud
// Function'ı her kazanan oyuncu için çağırır. Bu sayede `wonHearts` cihazda
// değil, server'da artar — bot olmayan kazananlar aldığını alır.

exports.awardGameWin = onCall(async (request) => {
  const uid = requireAuth(request);
  const { roomId, roundNumber } = request.data || {};

  if (!roomId || typeof roundNumber !== 'number') {
    throw new HttpsError('invalid-argument', 'roomId ve roundNumber zorunlu.');
  }

  // RTDB'den oda durumunu admin SDK ile çek; host'un yayınladığı sonuca güven
  const rtdb = admin.database();
  const snap = await rtdb.ref(`rooms/${roomId}`).get();
  if (!snap.exists()) {
    throw new HttpsError('not-found', 'Oda bulunamadı.');
  }
  const room = snap.val();

  if (!room.roundResult || room.roundResult.roundNumber !== roundNumber) {
    throw new HttpsError('failed-precondition', 'Round sonucu eşleşmiyor.');
  }
  if (!room.roundResult.isGameOver) {
    throw new HttpsError('failed-precondition', 'Oyun henüz bitmedi.');
  }

  // Çağıran kullanıcının player record'unu bul
  const players = room.players || {};
  const myPlayer = players[uid];
  if (!myPlayer || !myPlayer.name) {
    throw new HttpsError('permission-denied', 'Bu odada oyuncu kaydın yok.');
  }

  const gameWinners = room.roundResult.gameWinners || [];
  if (!gameWinners.includes(myPlayer.name)) {
    throw new HttpsError('failed-precondition', 'Bu oyunda kazanan değilsin.');
  }

  // Aynı oyun için tekrar kalp verme
  const awardId = `${roomId}_${roundNumber}_${uid}`;
  const awardRef = db.collection('processedGameAwards').doc(awardId);
  const userRef = db.collection('users').doc(uid);

  await db.runTransaction(async (t) => {
    const dup = await t.get(awardRef);
    if (dup.exists) return;
    t.update(userRef, { wonHearts: FieldValue.increment(1) });
    t.set(awardRef, { uid, roomId, roundNumber, processedAt: FieldValue.serverTimestamp() });
  });

  return { ok: true };
});

// ============================================================================
// MİSAFİR HAK DÜŞÜRME
// ============================================================================

exports.consumeGuestMatch = onCall(async (request) => {
  const uid = requireAuth(request);
  if (!request.auth.token.firebase.sign_in_provider === 'anonymous') {
    // sadece misafir kullanıcılar
    return { ok: true, skipped: true };
  }

  const userRef = db.collection('users').doc(uid);
  await db.runTransaction(async (t) => {
    const snap = await t.get(userRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Kullanıcı bulunamadı.');
    const left = snap.data().guestMatchesLeft || 0;
    if (left <= 0) {
      throw new HttpsError('failed-precondition', 'Misafir hakkı bitmiş.');
    }
    t.update(userRef, { guestMatchesLeft: FieldValue.increment(-1) });
  });

  return { ok: true };
});

// ============================================================================
// NICKNAME REZERVASYONU (atomik, race-free)
// ============================================================================

exports.reserveNickname = onCall(async (request) => {
  const uid = requireAuth(request);
  const { nickname } = request.data || {};

  if (typeof nickname !== 'string') {
    throw new HttpsError('invalid-argument', 'nickname zorunlu.');
  }
  const clean = nickname.trim();
  if (clean.length < 3 || clean.length > 12) {
    throw new HttpsError('invalid-argument', 'Nickname 3-12 karakter olmalı.');
  }
  if (!/^[a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]+$/.test(clean)) {
    throw new HttpsError('invalid-argument', 'Nickname geçersiz karakter içeriyor.');
  }

  const key = clean.toLowerCase();
  const nickRef = db.collection('nicknames').doc(key);

  await db.runTransaction(async (t) => {
    const snap = await t.get(nickRef);
    if (snap.exists) {
      throw new HttpsError('already-exists', 'Bu nickname kullanılıyor.');
    }
    t.set(nickRef, { uid, nickname: clean, reservedAt: FieldValue.serverTimestamp() });
  });

  return { ok: true };
});
