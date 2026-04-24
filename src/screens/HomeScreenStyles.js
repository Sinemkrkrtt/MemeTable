import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const palet = {
  vibrant: '#FF69EB',
  soft: '#FF86C8',
  peach: '#FFA3A5',
  sand: '#FFBF81',
  yellow: '#FFDC5E',
  darkText: '#4A1D3A',
  bg: '#FFFFFF'
};

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palet.bg },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 30 },

  // --- PREMİUM HEADER ---
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 20,
    marginBottom: 10,
  },
  sleekVault: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#B832FA',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F8F8F8',
  },
  vaultItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vaultValue: { 
    fontFamily: 'Nunito_900Black', 
    fontSize: 15, 
    color: '#4A1D3A',
    letterSpacing: -0.2 
  },
  vaultSeparator: { 
    width: 1, 
    height: 18, 
    backgroundColor: '#F0F0F0', 
    marginHorizontal: 15 
  },
  creativeLogout: { 
    width: 42, 
    height: 42, 
    borderRadius: 14, 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    transform: [{ rotate: '45deg' }],
    shadowColor: palet.peach,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    marginRight: 5
  },
  logoutIcon: { transform: [{ rotate: '-45deg' }] },

  // --- LOGO ALANI ---
  logoArea: { 
    width: '100%', height: 240, marginTop: 0, marginBottom: 10, 
    justifyContent: 'center', alignItems: 'center',
  },
  homeLogoLarge: { width: '90%', height: '100%', borderRadius: 70 },

  // --- GRID BUTONLARI ---
  gridContainer: { flexDirection: 'row', gap: 15 },
  bigActionCard: { flex: 1, borderRadius: 32, overflow: 'hidden', elevation: 12, height: 210 },
  rightColumn: { flex: 1, gap: 15 },
  smallActionCard: { borderRadius: 24, overflow: 'hidden', elevation: 8, height: 97 },
  cardInner: { flex: 1, padding: 18, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  topRightArrow: { transform: [{ rotate: '45deg' }], opacity: 0.8 },
  cardTitleBig: { 
    color: 'white', fontSize: 26, fontFamily: 'Nunito_900Black', letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2
  },
  cardSubTitle: {
    color: 'rgba(255,255,255,0.9)', fontSize: 11, letterSpacing: 2, fontFamily: 'Nunito_800ExtraBold', marginTop: 4
  },
  cardTitleSmall: { color: 'white', fontSize: 16, fontFamily: 'Nunito_900Black', letterSpacing: 0.5 },

  // --- GÜNLÜK GÖREV BAŞLIĞI ---
  historySection: { marginTop: 20, paddingBottom: 20 },
  missionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 20,
  },
  titleWithBadge: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  missionIconBadge: {
    width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: palet.vibrant, shadowOpacity: 0.3, shadowRadius: 5,
  },
  missionMainTitle: { fontSize: 18, fontFamily: 'Nunito_900Black', color: '#522343', letterSpacing: -0.3 },
  missionSubTitle: { fontSize: 10, fontFamily: 'Nunito_700Bold', color: '#AFAFAF', marginTop: -2 },
  premiumTimerBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 12, gap: 5, borderWidth: 1, borderColor: '#F5F5F5', elevation: 2, backgroundColor: '#FFD0F5B1',
  },
  premiumTimerText: { fontSize: 12, fontFamily: 'Nunito_800ExtraBold', color: palet.vibrant },

  // --- GÖREV KARTI & HEDİYE SİSTEMİ ---
  questCard: {
    backgroundColor: 'white', borderRadius: 24, padding: 16,
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10,
  },
  questMainRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  questIconBox: { 
    width: 50, height: 50, borderRadius: 18, justifyContent: 'center', alignItems: 'center' 
  },
  questContent: { flex: 1 },
  questText: { fontSize: 15, color: palet.darkText, fontFamily: 'Nunito_800ExtraBold', marginBottom: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  currentProgressText: { fontSize: 12, fontFamily: 'Nunito_900Black', color: palet.darkText },

  // --- HEDİYE (GIFT) WRAPPER ---
  giftWrapper: { width: 70, alignItems: 'center', justifyContent: 'center' },
  lockedGift: { opacity: 0.5, alignItems: 'center' },
  lockedText: { fontSize: 8, fontFamily: 'Nunito_900Black', color: '#BBB', marginTop: 4 },
  activeGift: {
    width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center',
    elevation: 10, shadowColor: '#FFA500', shadowOpacity: 0.5, shadowRadius: 10,
  },
  openMeText: { fontSize: 9, fontFamily: 'Nunito_900Black', color: '#E5A900', textAlign: 'center', marginTop: 5 },
  openedGift: { alignItems: 'center' },
  rewardEmoji: { fontSize: 24 },
  rewardSub: { fontSize: 9, fontFamily: 'Nunito_900Black', color: palet.vibrant },
// --- 🌅 PEMBE & TURUNCU ESTETİK GANİMET EKRANI ---
  // --- 🌅 TAM EKRAN PEMBE & TURUNCU GANİMET ---
  modalOverlay: {
    // Ekranın tam boyutunu alıyoruz (Navigasyon barı dahil her yeri kaplar)
    width: Dimensions.get('screen').width,
    height: Dimensions.get('screen').height,
    backgroundColor: 'rgba(20, 10, 10, 0.9)', 
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute', // Her şeyin üzerine biner
  },
  lootMainStage: {
    width: '100%',
    height: '100%', // Artık tüm modalı kaplar
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Arkadaki ışık hüzmesini de tüm ekranı kaplayacak şekilde genişletiyoruz
  rewardAuraOuter: {
    position: 'absolute',
    width: Dimensions.get('screen').width,
    height: 600, // Daha geniş bir ışık dalgası
    opacity: 0.5,
  },
  closeModalIcon: {
    position: 'absolute',
    top: 60, // SafeArea boşluğunu buraya manuel verdik
    right: 25,
    zIndex: 110,

  },
  rewardAuraOuter: {
    position: 'absolute',
    width: width * 1.2,
    height: 400,
    opacity: 0.6,
    // Ekranı boydan boya geçen pembe-turuncu gradyan hüzmesi
  },
  objectSpotlight: {
    zIndex: 5,
    // Objenin parlamasını altın sarısına çektik (Turuncuyla uyumlu)
    shadowColor: palet.vibrant,
    shadowOpacity: 0.9,
    shadowRadius: 70,
    elevation: 30,
  },
  rewardEmojiUltra: {
    fontSize: 160,
    transform: [{ rotate: '-8deg' }], // Biraz daha eğlenceli bir açı
  },
  // 🏷️ ŞEFFAF & SICAK ETİKET
  glassNameTag: {
    marginTop: 50,
    paddingHorizontal: 45,
    paddingVertical: 18,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: palet.sand, // Turuncu çerçeve
    alignItems: 'center',
  },
  lootTitleText: {
    fontFamily: 'Nunito_900Black',
    fontSize: 28,
    color: '#FFF',
    letterSpacing: 3,
    textShadowColor: palet.vibrant, // Pembe gölge
    textShadowRadius: 15,
  },
  rarityTextSmall: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 13,
    color: palet.yellow,
    letterSpacing: 5,
    marginBottom: 8,
  }
});