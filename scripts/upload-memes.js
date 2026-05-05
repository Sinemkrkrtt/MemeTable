#!/usr/bin/env node
/**
 * MemeTable — Toplu meme görsel yükleme script'i.
 *
 * Çalışma mantığı:
 *   1. `assets/memes/` (varsayılan) klasörünü tarar — png/jpg/webp dosyaları
 *   2. Her dosyayı Firebase Storage'a `memes/{filename}` yoluna yükler
 *   3. Public URL alır
 *   4. Firestore `memes` koleksiyonuna { url, category, filename, addedAt } yazar
 *   5. Aynı dosyayı iki kez yüklemeyi engeller (filename hash ile id)
 *
 * Kullanım:
 *   1. Firebase Console → Project Settings → Service Accounts → "Generate new
 *      private key" → indir, repo dışı bir yere koy (.gitignore'da olmalı!)
 *   2. Klasörde:
 *        npm install firebase-admin mime-types
 *   3. Çalıştır:
 *        GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
 *        node scripts/upload-memes.js
 *
 *   Opsiyonel: özel klasör vermek için
 *        node scripts/upload-memes.js ./assets/memes/turkce
 *
 * NOT: Bu script SADECE LOKAL'de çalışır — service account credentials'i
 * mobile bundle'a girmez. Production app'i etkilemez.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mime = require('mime-types');

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------
const PROJECT_ID = 'memetable-official';
const STORAGE_BUCKET = `${PROJECT_ID}.firebasestorage.app`;
const FIRESTORE_COLLECTION = 'memes';
const STORAGE_PREFIX = 'memes/';

const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

const DEFAULT_DIR = path.resolve(__dirname, '../assets/memes');

// ----------------------------------------------------------------------------
// KURULUM
// ----------------------------------------------------------------------------
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('❌ GOOGLE_APPLICATION_CREDENTIALS environment variable yok.');
  console.error('   Service account JSON path\'ini ayarla:');
  console.error('   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json');
  process.exit(1);
}

admin.initializeApp({
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
});

const bucket = admin.storage().bucket();
const db = admin.firestore();

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

// Dosya adından kategori çıkar (`tepki_001_x.png` → `tepki`)
function categoryFromFilename(filename) {
  const base = path.basename(filename, path.extname(filename));
  const parts = base.split('_');
  if (parts.length >= 2 && /^[a-z]+$/i.test(parts[0])) {
    return parts[0].toLowerCase();
  }
  return 'other';
}

// İçerik bazlı stable id (aynı görseli iki kez yüklemeyelim)
function hashFile(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha1').update(buf).digest('hex').substring(0, 16);
}

async function uploadOne(filePath) {
  const filename = path.basename(filePath);
  const ext = path.extname(filename).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return { skipped: true, reason: 'unsupported extension', filename };
  }

  const id = hashFile(filePath);
  const docRef = db.collection(FIRESTORE_COLLECTION).doc(id);

  // Aynı içerik daha önce yüklendi mi?
  const existing = await docRef.get();
  if (existing.exists) {
    return { skipped: true, reason: 'already uploaded', filename, id };
  }

  const storagePath = `${STORAGE_PREFIX}${id}${ext}`;
  const file = bucket.file(storagePath);

  // Yükle
  await bucket.upload(filePath, {
    destination: storagePath,
    metadata: {
      contentType: mime.lookup(ext) || 'application/octet-stream',
      cacheControl: 'public, max-age=31536000', // 1 yıl
      metadata: { originalFilename: filename },
    },
  });

  // Public URL — Storage rules'da .read public ise direct URL kullanılabilir.
  // Aksi halde signed URL (uzun ömürlü) tercih et.
  await file.makePublic();
  const url = `https://storage.googleapis.com/${STORAGE_BUCKET}/${storagePath}`;

  // Firestore kaydı
  await docRef.set({
    url,
    category: categoryFromFilename(filename),
    filename,
    storagePath,
    addedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { uploaded: true, filename, id, url };
}

// ----------------------------------------------------------------------------
// MAIN
// ----------------------------------------------------------------------------
async function main() {
  const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_DIR;

  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Klasör bulunamadı: ${targetDir}`);
    console.error(`   Görselleri ${DEFAULT_DIR} altına koy ve tekrar çalıştır.`);
    process.exit(1);
  }

  const stat = fs.statSync(targetDir);
  if (!stat.isDirectory()) {
    console.error(`❌ Verilen yol klasör değil: ${targetDir}`);
    process.exit(1);
  }

  console.log(`📂 Taraniyor: ${targetDir}`);

  // Recursive tara — alt klasörler de dahil
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) files.push(full);
    }
  };
  walk(targetDir);

  console.log(`📦 ${files.length} dosya bulundu.`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const filePath of files) {
    try {
      const result = await uploadOne(filePath);
      if (result.uploaded) {
        uploaded++;
        console.log(`✅ [${result.id}] ${result.filename}`);
      } else {
        skipped++;
        console.log(`⏭️  ${result.filename} — ${result.reason}`);
      }
    } catch (err) {
      failed++;
      console.error(`❌ ${path.basename(filePath)} — ${err.message}`);
    }
  }

  console.log('');
  console.log(`Tamamlandı: ${uploaded} yüklendi, ${skipped} atlandı, ${failed} hata.`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('❌ Beklenmeyen hata:', err);
  process.exit(1);
});
