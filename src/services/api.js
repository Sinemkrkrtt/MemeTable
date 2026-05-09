/**
 * Cloud Functions wrapper'ları.
 *
 * Tüm ekonomi işlemleri (coin / diamond / wonHearts / jokerlar / IAP) artık
 * doğrudan Firestore yazılmıyor — bu fonksiyonlar üzerinden Cloud Function'a
 * gidiyor. Bu sayede client manipülasyon yapamaz, atomik garanti alır.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

const call = (name) => httpsCallable(functions, name);

export const api = {
  validatePurchase: call('validatePurchase'),
  purchaseJokerWithCoins: call('purchaseJokerWithCoins'),
  purchaseCoinPack: call('purchaseCoinPack'),
  consumeJoker: call('consumeJoker'),
  claimRewardAd: call('claimRewardAd'),
  claimDailyMission: call('claimDailyMission'),
  resetDailyIfNeeded: call('resetDailyIfNeeded'),
  awardGameWin: call('awardGameWin'),
  consumeGuestMatch: call('consumeGuestMatch'),
  reserveNickname: call('reserveNickname'),
};

/**
 * Callable hatalarını kullanıcı-dostu mesaja çevir.
 * onCall'da `throw new HttpsError(code, message)` mesajı `error.message`'da gelir.
 */
export function describeApiError(err) {
  if (!err) return 'Bilinmeyen hata.';
  if (err.code === 'unauthenticated') return 'Lütfen tekrar giriş yap.';
  if (err.code === 'failed-precondition') return err.message || 'İşlem koşulları sağlanmadı.';
  if (err.code === 'invalid-argument') return err.message || 'Geçersiz istek.';
  if (err.code === 'already-exists') return err.message || 'Bu işlem zaten tamamlanmış.';
  if (err.code === 'resource-exhausted') return 'Çok fazla istek, biraz sonra tekrar dene.';
  return err.message || 'İşlem sırasında bir hata oluştu.';
}
