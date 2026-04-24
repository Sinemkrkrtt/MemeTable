import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  
  // --- ANA YAPI ---
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  whiteBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FAFAFA' },
  tableContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -30 },

  // --- MASA & OYUNCULAR ---
  mainTableRim: { width: '72%', height: '75%', backgroundColor: '#FF86C8', borderRadius: 120, borderWidth: 8, borderColor: 'rgba(255, 255, 255, 0.9)', justifyContent: 'center', alignItems: 'center', elevation: 40, shadowColor: '#FF69EB', shadowOpacity: 0.45, shadowRadius: 35 },
  tableSurface: { position: 'absolute', width: '95%', height: '92%', backgroundColor: '#FFF2F7', borderRadius: 100, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(0, 0, 0, 0.04)', overflow: 'hidden' },
  roomTableLogo: { width: 340, height: 340, opacity: 0.18, resizeMode: 'contain', transform: [{ rotate: '-3deg' }, { scale: 1.05 }] },

  playerSlot: { position: 'absolute', alignItems: 'center', zIndex: 60 },
  topPlayer: { top: -30 }, leftPlayer: { left: -30, top: '35%' }, rightPlayer: { right: -30, top: '35%' }, bottomPlayer: { bottom: -30 },
  avatarContainer: { alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 22, backgroundColor: '#FFF', borderWidth: 4, elevation: 15 },
  nameBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: -14, borderWidth: 2, borderColor: '#FFFFFF', elevation: 10 },
  playerName: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  // --- MERKEZ & DURUM KARTI ---
  centerArea: { alignItems: 'center', zIndex: 50 },
  situationCardWrapper: { position: 'absolute', top: -105 },
  premiumSituationCard: { width: 240, height: 160, backgroundColor: '#FFD1A3', borderRadius: 20, borderWidth: 4, borderColor: '#FFFFFF', elevation: 20 },
  cardInnerContent: { flex: 1, padding: 18, justifyContent: 'space-between' },
  glossyHighlight: { position: 'absolute', top: 0, left: 0, right: 0, height: '40%' },
  premiumHeaderCentered: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  moodBadge: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, elevation: 5 },
  moodLetter: { fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  premiumDivider: { height: 2, backgroundColor: '#FFFFFF', opacity: 0.8, marginBottom: 10 },
  premiumText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', textAlign: 'center', lineHeight: 24 },

  // --- DUYURU BANNER'I ---
  announcementBanner: { position: 'absolute', top: '42%', width: '100%', zIndex: 1000, alignItems: 'center', justifyContent: 'center' },
  bannerGradient: { width: '100%', paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' },
  announcementText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: 8, textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowRadius: 10 },

  // --- ELİMİZDEKİ KARTLAR (DESTE) ---
  deckContainer: { position: 'absolute', bottom: -10, width: '100%', height: 160, alignItems: 'center' },
  deckCard: { position: 'absolute', width: 95, height: 135, borderRadius: 14, backgroundColor: '#FFFFFF', padding: 4, elevation: 15 },
  memeImage: { width: '100%', height: '100%', borderRadius: 12, backgroundColor: '#F3F4F6' },
  selectedBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 16, borderWidth: 4, borderColor: '#FF69EB' },
  playButton: { position: 'absolute', top: -55, alignSelf: 'center', zIndex: 150, elevation: 20, shadowColor: '#FF69EB', shadowOpacity: 1, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } },
  playButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.9)' },
  playButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16, letterSpacing: 2, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 },

  // --- YENİ NESİL SAYAÇ (PRO TIMER) ---
  proTimerContainer: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center' },
  staticRing: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: 'rgba(255, 105, 235, 0.15)' },
  timerRing: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 5, borderColor: 'transparent', shadowColor: '#FF69EB', shadowOpacity: 0.8, shadowRadius: 10 },
  modernTimerContent: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255, 255, 255, 0.4)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.6)' },
  proTimerText: { fontSize: 32, fontWeight: '900', color: '#FF69EB', textShadowColor: 'rgba(255, 105, 235, 0.5)', textShadowRadius: 10 },

  // --- OYLAMA ALANI (VOTING PRO) ---
  votingAreaPro: { alignItems: 'center', justifyContent: 'center', width: '100%', paddingTop: 40 },
  proProgressBarContainer: { position: 'absolute', top: 20, width: '60%', height: 10, backgroundColor: 'rgba(0, 0, 0, 0.1)', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' },
  proProgressBar: { height: '100%', borderRadius: 10, shadowColor: '#FF69EB', shadowOpacity: 0.9, shadowRadius: 8, elevation: 5 },
  votingRowPro: { flexDirection: 'row', gap: 15, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  voteCardWrapper: { width: 100, height: 140, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 3, borderWidth: 2, borderColor: '#FFFFFF', elevation: 15, overflow: 'hidden' },
  votedCardStyle: { borderColor: '#FFDC5E', transform: [{ scale: 1.1 }], shadowColor: '#FFDC5E', shadowOpacity: 0.8, shadowRadius: 15 },
  disabledVoteCard: { opacity: 0.6 },
  myCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  myCardText: { color: 'white', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  votedBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#FFFFFF', borderRadius: 15, padding: 4, elevation: 10 },

  // --- SONUÇ MODALI (RESULT WINDOW) ---
  proModalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  resultWindow: { width: 400, backgroundColor: '#FFF', borderRadius: 25, overflow: 'hidden' },
  windowHeader: { paddingVertical: 12, alignItems: 'center' },
  windowHeaderText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 4 },
  windowBody: { padding: 20 },
  scoreListContainer: { width: '100%', gap: 8 },
  scoreRowPro: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 10, borderRadius: 12 },
  winnerRow: { backgroundColor: '#FFF9E6', borderWidth: 1, borderColor: '#FFDC5E' },
  rankText: { width: 30, fontWeight: '900', color: '#FF69EB', fontSize: 16 },
  scoreNameText: { flex: 1, fontWeight: '700', color: '#444' },
  scoreValueText: { fontWeight: '900', color: '#333' },
  windowActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 15 },
  modalExitBtn: { flex: 1, paddingVertical: 12, borderRadius: 15, backgroundColor: '#EEE', alignItems: 'center' },
  modalExitText: { color: '#888', fontWeight: '900' },
  modalPlayBtn: { flex: 1, paddingVertical: 12, borderRadius: 15, backgroundColor: '#FF69EB', alignItems: 'center' },
  modalPlayText: { color: '#FFF', fontWeight: '900' },

});