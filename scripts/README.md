# Scripts — Meme Yükleme

## Hızlı kullanım

### 1. Service account JSON al

Firebase Console → ⚙️ Project Settings → Service Accounts sekmesi →
"Generate new private key" → indir.

⚠️ **Bu dosyayı asla commit etme**. Repo dışına koy:
```
~/secrets/memetable-admin.json
```

`.gitignore` zaten `*.json` içeren bir pattern içermiyorsa şunu ekle:
```
serviceAccount*.json
firebase-admin*.json
```

### 2. Bağımlılıkları kur

```bash
cd /Users/sinem/Desktop/MemeTable/MemeTable
npm install --no-save firebase-admin mime-types
```

(`--no-save` mobile app'in `package.json`'ını kirletmemek için — script
sadece lokal kullanımdır.)

### 3. Memeleri klasöre koy

`assets/memes/` altına AI ile ürettiğin görselleri yerleştir.
İsim formatı: `{kategori}_{numara}_{anahtar-kelime}.png`

```
assets/memes/
├── tepki_001_screaming-raccoon.png
├── tepki_002_confused-cat.png
├── durum_011_indecisive-doors.png
├── turkce_021_giant-tea.png
└── basarisiz_031_banana-slip.png
```

Detaylı prompt rehberi: `scripts/meme-prompts.md`

### 4. Yükle

```bash
GOOGLE_APPLICATION_CREDENTIALS=~/secrets/memetable-admin.json \
  node scripts/upload-memes.js
```

Belirli bir alt klasörü yüklemek için:
```bash
GOOGLE_APPLICATION_CREDENTIALS=~/secrets/memetable-admin.json \
  node scripts/upload-memes.js ./assets/memes/turkce
```

## Ne yapar

1. Klasörü recursive tarar (alt klasörler dahil)
2. Her dosyanın içerik hash'ini alır (SHA1 ilk 16 karakter)
3. Aynı hash Firestore'da varsa atlar (idempotent — script'i tekrar çalıştırabilirsin)
4. Yoksa Firebase Storage'a `memes/{hash}.{ext}` yoluna yükler
5. Public URL alır (`makePublic()`)
6. Firestore `memes` koleksiyonuna `{ url, category, filename, storagePath, addedAt }` doc'u yazar
7. RoomScreen otomatik bu yeni meme'leri çeker (`getDocs(collection(db, 'memes'))`)

## Mevcut memelerden kurtulma

Eski telifli memelerin Firestore'da kaldıysa toplu silmek için:

```js
// scripts/clear-memes.js (oluşturmadım — istersen yazabilirim)
const snap = await db.collection('memes').get();
const batch = db.batch();
snap.docs.forEach(d => batch.delete(d.ref));
await batch.commit();
```

VEYA Firebase Console → Firestore → `memes` koleksiyonu → tek tek sil.

Storage tarafından eski görselleri de temizle (Storage rules → Storage → memes/
klasörü → toplu seç → sil).

## Storage rules notu

Public read için Storage rules'ında `memes/` klasörünün okuma açık olması
yeterli. `storage.rules` dosyası varsa şuna benzer olmalı:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /memes/{file} {
      allow read: if true;
      allow write: if false; // sadece admin SDK / script yazabilir
    }
  }
}
```

`makePublic()` çağrısı yine de gerekli (bu rule'ları geçer ama public URL
oluşturma için Storage IAM ayarı şart).

## Maliyet

- Firebase Storage: ilk 5GB ücretsiz, sonrası ~$0.026/GB. 100 meme x 200KB
  = 20MB → ücretsiz tier'da kalır.
- Firestore writes: ilk 20K/gün ücretsiz. 100 meme = 100 write → ücretsiz.
- Storage reads (oyuncular): kişi başı oyun başına ~5 read. Ücretsiz tier
  zaten 50K read/gün, ilk binlerce kullanıcıya kadar ücretsiz.

## Güvenlik

- Service account JSON **bilgisayarında** tutulur, **app bundle'a girmez**.
- Bu script sadece **sen** çalıştırırsın (CI/CD'ye koyma).
- Firebase Admin SDK her şeyi yapma yetkisine sahip — JSON sızdırırsan
  projen ele geçirilebilir. Asla GitHub'a push etme.
