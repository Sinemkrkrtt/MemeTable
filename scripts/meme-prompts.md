# Meme Görsel Üretim Rehberi

Hedef: telif riski sıfır, stil tutarlı, oyun temasıyla uyumlu **özgün** meme
görselleri. Aşağıdaki prompt'ları Midjourney / DALL-E 3 / Leonardo.ai'da
kullanabilirsin.

---

## STİL KURALI (her prompt'a ekle)

```
flat cartoon illustration, bold outlines, vibrant colors,
playful expression, white background, no text, no logos,
no real celebrity faces, original character design
```

Bu stil hem tanınabilir meme estetiği verir hem de telif sızdırmaz.
Karakterler "Doge"a değil ama benzer komik enerjiye sahip olur.

---

## KATEGORİ 1 — TEPKİ / DUYGU MEMELERİ

Bunlar oyuncuların durumlara reaksiyon vermek için kullandıkları temel.
Toplam: ~30 görsel

```
1. Cartoon raccoon screaming dramatically with sparkling eyes
2. Confused cartoon cat staring at math equations floating in the air
3. Smug cartoon frog (NOT pepe — make it different shape) sipping tea
4. Bewildered cartoon octopus with all 8 arms holding question marks
5. Crying cartoon penguin holding a tiny umbrella
6. Pixelated retro 8-bit character throwing arms up in celebration
7. Tired cartoon sloth with bags under eyes drinking coffee
8. Suspicious cartoon owl side-eye glance
9. Embarrassed cartoon flamingo covering face with wing
10. Excited cartoon hamster vibrating with energy
```

---

## KATEGORİ 2 — DURUM / SAHNE MEMELERİ

Belirli durumları temsil eden görseller (tanıdık format ama özgün).
Toplam: ~30 görsel

```
11. Cartoon character standing between two doors, sweating, can't decide
12. Cartoon character fishing but pulled out a tiny boot instead of fish
13. Two cartoon characters arm-wrestling, one is tiny but determined
14. Cartoon character running away from a giant rolling cookie
15. Cartoon scientist with hair on fire, beaker exploding
16. Cartoon character trying to fit oversized object into tiny box
17. Cartoon astronaut planting flag on weird-shaped planet
18. Cartoon character holding a tiny umbrella in cartoon hurricane
19. Cartoon character at podium with microphone, awkward silence
20. Cartoon character knocked back by tiny sneeze, comic-book style
```

---

## KATEGORİ 3 — TÜRKÇE KÜLTÜRE ÖZEL

Yerel hisle bağ kuran sahneler. Türk pazarına özel.
Toplam: ~20 görsel

```
21. Cartoon character holding extra-large tea glass with steam, tulip-shaped
22. Cartoon character at simit cart, eyes shining
23. Cartoon character on minibüs, hand stretched out, asking driver
24. Cartoon grandma with rolling pin, comic angry face
25. Cartoon character with evil eye charm necklace, smirking
26. Cartoon character on Bosphorus ferry, seagull stealing simit
27. Cartoon character at Pazar, holding 5 bags, struggling
28. Cartoon character watching match on TV, hands on head, dramatic
29. Cartoon character in front of fridge at 3am, glow on face
30. Cartoon character covered in snow, only eyes visible, deadpan
```

---

## KATEGORİ 4 — GERİ KAÇ / BAŞARISIZLIK

"Bu kadar memeden bahsederken nasıl yapsam"a karşılık gelen sahneler.
Toplam: ~20 görsel

```
31. Cartoon character slipping on banana peel, mid-fall
32. Cartoon character pressing wrong button, room behind explodes
33. Cartoon character dropping ice cream cone, single tear
34. Cartoon character locked outside with house keys visible inside
35. Cartoon character's giant tower of plates collapsing
36. Cartoon character missing high-five completely, awkward
37. Cartoon character ironing shirt while wearing it, smoke
38. Cartoon character showing off 2 trophies, but third hidden burning
39. Cartoon character sending text, autocorrect monster behind them
40. Cartoon character with party hat at empty room, only one balloon
```

---

## KAÇINMAN GEREKEN ŞEYLER

Prompt'larında **asla** şunları kullanma — Apple/Google review'da yakalanır:

❌ Spesifik karakter isimleri: Mickey, Mario, Pikachu, Spongebob, Pepe, Doge, Wojak
❌ Ünlü kişi: "Drake style", "Trump face", "Elon Musk"
❌ Marka: Nike, McDonald's, Apple, Pepsi
❌ Film/dizi sahnesi: "Office reaction", "Game of Thrones"
❌ "Like meme of X" — meme adı geçirme, sadece duyguyu/sahneyi tarif et
❌ Photorealistic insan yüzü (deepfake riski)
❌ Tanınmış logolar veya tipografi

---

## DOSYA İSİMLENDİRME KURALI

Üretilen her görsel için:

```
{kategori}_{numara}_{anahtar-kelime}.png
```

Örnek:
- `tepki_001_screaming-raccoon.png`
- `durum_011_indecisive-doors.png`
- `turkce_021_giant-tea.png`
- `basarisiz_031_banana-slip.png`

Dosyaları `assets/memes/` klasörüne koy. Sonra `node scripts/upload-memes.js`
çalıştır — Firebase Storage'a yükler ve `memes` koleksiyonuna kaydeder.

---

## TOPLU ÜRETİM AKIŞI

1. **Bir hafta sonu, tek oturum**: Midjourney pro plan ($30/ay)
2. Her kategori için 50 prompt çalıştır → hızlı triage (en güzel 30'unu seç)
3. Photoshop/Photopea'da arka planları temizle (gerekirse)
4. `assets/memes/` klasörüne kategori bazlı koy
5. `upload-memes.js` çalıştır → bitti
6. RoomScreen otomatik bu yeni memeleri çekiyor olacak (`getDocs(memes)`)

Toplam ~100 görsel + üretim ~6-8 saat. Maliyet: Midjourney Pro 1 ay ($30) +
opsiyonel freelance temizlik ($50). Toplam ~$80, telif riski sıfır.

---

## TICARI KULLANIM LİSANSI NOTU

- **Midjourney Pro / Mega plan**: ürettiğin görselleri ticari olarak
  kullanabilirsin (kendi şirketinin gelirleri için). Free plan'da sadece
  kişisel kullanım. https://docs.midjourney.com/docs/terms-of-service
- **DALL-E 3 (OpenAI)**: ChatGPT Plus ($20/ay) ile ticari kullanım hakkı.
- **Leonardo.ai**: Standard plan ve üzeri ticari kullanım için.
- **Stable Diffusion (yerel)**: tamamen ücretsiz ve ticari serbest.

Önemli: hangi tool'u kullanırsan kullan, plan'ının "commercial use" kapsadığını
görsel üretmeden önce doğrula. Free tier ile üretip sat'mak lisans ihlali olur.
