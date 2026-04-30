import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  
  // ==========================================
  // 1. ANA YAPI VE MASA BÖLÜMÜ
  // ==========================================
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  whiteBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F4F5F9' }, // Daha soft ve premium bir gri/beyaz tonu
  tableContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -10 },

  mainTableRim: { 
    width: '73%', height: '75%', 
    backgroundColor: '#FF86C8', 
    borderRadius: 140, 
    borderWidth: 8, borderColor: 'rgba(255, 255, 255, 0.95)', 
    justifyContent: 'center', alignItems: 'center', 
    elevation: 35, 
    marginRight:0,
    shadowColor: '#FF00D6', shadowOpacity: 0.25, shadowRadius: 30, shadowOffset: { width: 0, height: 15 } 
  },
  tableSurface: { 
    position: 'absolute', width: '96%', height: '93%', 
    backgroundColor: '#FFF2F7', 
    borderRadius: 120, 
    justifyContent: 'center', alignItems: 'center', 
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)', overflow: 'hidden' 
  },
  roomTableLogo: { width: 340, height: 340, opacity: 0.12, resizeMode: 'contain', transform: [{ rotate: '-3deg' }, { scale: 1.05 }] },

  // ==========================================
  // 2. OYUNCU SLOTLARI (AVATARLAR)
  // ==========================================
  playerSlot: { position: 'absolute', alignItems: 'center', zIndex: 60 },
  topPlayer: { top: -35 }, 
  leftPlayer: { left: -35, top: '35%' }, 
  rightPlayer: { right: -35, top: '35%' }, 
  bottomPlayer: { bottom: -35 },
  
  avatarContainer: { alignItems: 'center' },
  avatar: { 
    width: 68, height: 68, borderRadius: 24, 
    backgroundColor: '#FFF', borderWidth: 4, 
    elevation: 15, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10 
  },
  nameBadge: { 
    paddingHorizontal: 16, paddingVertical: 6, 
    borderRadius: 20, marginTop: -14, 
    borderWidth: 2, borderColor: '#FFFFFF', elevation: 10,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5
  },
  playerName: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  // ==========================================
  // 3. SOL KENAR HUD (JOKER MENÜSÜ - YENİ)
  // ==========================================
 hudWrapper: {
    position: 'absolute',
    right: 35,
    top: '8%',
    zIndex: 999, // Her şeyin en üstünde olmalı
  },

  hudContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 30,
    padding: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    // iOS Gölge
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    // Android Gölge
    elevation: 8,
  },
  hudTitleIcon: { opacity: 0.7, marginBottom:10 },
  jokerIconWrapper: { alignItems: 'center' },
  jokerButton: {
    width: 45, height: 60, borderRadius: 18, 
    backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', 
    borderWidth: 1, borderColor: '#F0F0F0',marginBottom:5,
    elevation: 6, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }
  },
  jokerLogo: { width: 32, height: 32, resizeMode: 'contain' },
  jokerBadge: {
    position: 'absolute', top: -6, right: -6, 
    minWidth: 20, height: 20, borderRadius: 10, 
    justifyContent: 'center', alignItems: 'center', 
    borderWidth: 2, borderColor: '#FFF', elevation: 4
  },
  jokerBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },

  // ==========================================
  // 4. DUYURU BANNER'I
  // ==========================================
  announcementBanner: { position: 'absolute', top: '42%', width: '100%', zIndex: 1000, alignItems: 'center', justifyContent: 'center' },
  bannerGradient: { width: '100%', paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)' },
  announcementText: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', letterSpacing: 10, textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 2 } },
  announcementTextWinner: { color: '#FFFFFF', textShadowColor: 'transparent' },

  // ==========================================
  // 5. MERKEZ ALAN & DURUM KARTI
  // ==========================================
  centerArea: { alignItems: 'center', zIndex: 50 },
  situationCardWrapper: { position: 'absolute', top: -105 },
  premiumSituationCard: { 
    width: 260, height: 170, backgroundColor: '#FFD1A3', 
    borderRadius: 20, borderWidth: 4, borderColor: '#FFFFFF', 
    elevation: 25, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 10 }, overflow: 'hidden'
  },
  cardInnerContent: { flex: 1, padding: 18, justifyContent: 'space-between', zIndex: 2 },
  glossyHighlight: { position: 'absolute', top: 0, left: 0, right: 0, height: '25%', zIndex: 1 },
  premiumHeaderCentered: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  moodBadge: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, elevation: 5 },
  moodLetter: { fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  premiumDivider: { height: 2, backgroundColor: '#FFFFFF', opacity: 0.9, marginBottom: 3 },
  premiumText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', textAlign: 'center', lineHeight: 22, textShadowColor: 'rgba(0,0,0,0.1)', textShadowRadius: 3 },

  // ==========================================
  // 6. YENİ NESİL NEON SAYAÇ (PRO TIMER)
  // ==========================================
  proTimerContainer: { width: 110, height: 110, justifyContent: 'center', alignItems: 'center' },
  staticRing: { position: 'absolute', width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: 'rgba(255, 105, 235, 0.15)' },
  staticRingFrozen: { borderColor: 'rgba(0, 229, 255, 0.25)' },
  timerRing: { position: 'absolute', width: 96, height: 96, borderRadius: 48, borderWidth: 5, borderBottomColor: 'transparent', borderRightColor: 'transparent' },
  timerRingNormal: { borderTopColor: '#FF8011', borderLeftColor: '#FF8011', shadowColor: '#FF8011', shadowOpacity: 0.8, shadowRadius: 12 },
  timerRingDanger: { borderTopColor: '#FF3B30', borderLeftColor: '#FF3B30', shadowColor: '#FF3B30', shadowOpacity: 0.9, shadowRadius: 15 },
  timerRingFrozen: { borderTopColor: '#00E5FF', borderLeftColor: '#00E5FF', shadowColor: '#00E5FF', shadowOpacity: 0.9, shadowRadius: 15 },
  snowOverlay: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', borderRadius: 100, zIndex: 10 },
  modernTimerContent: { width: 74, height: 74, borderRadius: 37, backgroundColor: 'rgba(255, 255, 255, 0.7)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF', elevation: 5 },
  modernTimerContentFrozen: { backgroundColor: 'rgba(0, 229, 255, 0.15)' },
  proTimerText: { fontSize: 34, fontWeight: '900', color: '#FF8011' },
  proTimerTextDanger: { color: '#FF3B30' },
  proTimerTextFrozen: { color: '#00E5FF', textShadowColor: '#00E5FF', textShadowRadius: 12 },

  // ==========================================
  // 7. OYLAMA ALANI VE KARTLAR
  // ==========================================
  votingAreaPro: { alignItems: 'center', justifyContent: 'center', width: '100%', paddingTop: 40 },
  proProgressBarContainer: { position: 'absolute', top: 15, width: '60%', height: 12, backgroundColor: 'rgba(0, 0, 0, 0.08)', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)' },
  proProgressBar: { height: '100%', borderRadius: 10, elevation: 2 },
  votingRowPro: { flexDirection: 'row', gap: 18, justifyContent: 'center', alignItems: 'center', marginTop: 25 },
  voteCardWrapper: { width: 105, height: 145, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 4, borderWidth: 2, borderColor: '#FFFFFF', elevation: 15, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  votedCardStyle: { borderColor: '#FFDC5E', transform: [{ scale: 1.12 }], shadowColor: '#FFDC5E', shadowOpacity: 0.8, shadowRadius: 15, elevation: 20 },
  disabledVoteCard: { opacity: 0.5 },
  myCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  myCardText: { color: 'white', fontSize: 11, fontWeight: 'bold', marginTop: 5, letterSpacing: 1 },
  votedBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#FFFFFF', borderRadius: 15, padding: 5, elevation: 10 },

  // ==========================================
  // 8. ALT AKSİYON MERKEZİ (DESTE)
  // ==========================================
  bottomDeckWrapper: { position: 'absolute', bottom: 25, alignSelf: 'center', alignItems: 'center', width: '100%', zIndex: 100 },
  handContainer: { height: 110, justifyContent: 'center' },
  deckCard: {
    position: 'absolute',
    width: 110,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#fff',
    // Kartın etrafındaki boşluk hissi
    padding: 4, 
  },

  // Animasyonlu View için stil
  deckCardInner: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden', // Resim köşeleri taşmasın
    borderWidth: 2,
    borderColor: 'transparent', // Normalde şeffaf, parlarken renklenecek
  },
  // 4. YENİ KARTIN PARLAMA EFEKTİ (HIGHLIGHT)
  highlightGlow: {
    shadowColor: '#00E5FF', // Turkuaz parlama
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 15, // Android için
  },
  memeImage: { width: '100%', height: '100%', borderRadius: 10, backgroundColor: '#F3F4F6' },
  selectedBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 14, borderWidth: 4, borderColor: '#FF00D6' },
  playButton: { position: 'absolute', top: -60, alignSelf: 'center', zIndex: 150, elevation: 25, shadowColor: '#FF00D6', shadowOpacity: 0.6, shadowRadius: 15, shadowOffset: { width: 0, height: 5 } },
  playButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 25, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.95)' },
  playButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16, letterSpacing: 2 },
// Sol Üst Kapsül Konteyneri (Konumu aynı kalıyor)
  topBarContainer: {
    position: 'absolute',
    top: 25,
    left: 30, 
    zIndex: 1000,
  },

  // Beyaz Kapsül - BOYUTLARI KÜÇÜLTÜLDÜ
  homeStylePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF8B',
    paddingHorizontal: 10, // Küçüldü (eski: 16)
    paddingVertical: 6,    // Küçüldü (eski: 10)
    borderRadius: 20,      // Küçüldü (eski: 30) - Yükseklik azaldığı için yuvarlaklığı korundu
    elevation: 6,          // Gölge hafifletildi
    shadowColor: '#E0B0FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },

  shopIcon: {
    marginRight: 10, // Küçüldü (eski: 14)
  },
shopPillIcon: { // Mağaza ikonu ve text arası boşluk
    marginRight: 8,
  },
  statGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Sayı Fontları - KÜÇÜLTÜLDÜ
  homeStatText: {
    fontSize: 13,        // Küçüldü (eski: 16)
    fontWeight: '900',   // Kalınlık korundu
    color: '#4A3B4A',
    marginLeft: 4,      // Küçüldü (eski: 6)
  },

  // Dikey Ayraç - KÜÇÜLTÜLDÜ
  verticalDivider: {
    width: 1,
    height: 16,        // Küçüldü (eski: 20)
    backgroundColor: '#F3E8F3',
    marginHorizontal: 10, // Küçüldü (eski: 14)
  },

});