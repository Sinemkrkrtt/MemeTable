import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');

const palet = {
  bg: '#F8F9FA',
  rim: '#FF86C8', 
  rimShadow: '#FF00D6',
  surface: '#FFF2F7',
  neonBlue: '#00E5FF', 
  neonOrange: '#FF914D',
  danger: '#FF3B30',
  glass: 'rgba(255, 255, 255, 0.25)', 
  textDark: '#1F1724', 
};

export const styles = StyleSheet.create({
  
  // ==========================================
  // 1. ANA YAPI VE MASA BÖLÜMÜ
  // ==========================================
  container: { 
    flex: 1, 
    backgroundColor: palet.bg 
  },
  whiteBackground: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: palet.bg 
  }, 
  tableContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: -15 
  }, 
  mainTableRim: { 
    width: '75%', 
    height: '75%', 
    backgroundColor: palet.rim, 
    borderRadius: 150, 
    borderWidth: 6, 
    borderColor: 'rgba(255, 255, 255, 0.8)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 20, 
    shadowColor: palet.rimShadow, 
    shadowOpacity: 0.35, 
    shadowRadius: 40, 
    shadowOffset: { width: 0, height: 20 } 
  },
  tableSurface: { 
    position: 'absolute', 
    width: '95%', 
    height: '94%', 
    backgroundColor: palet.surface, 
    borderRadius: 140, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: 'rgba(255,255,255,0.6)', 
    overflow: 'hidden' 
  },
  roomTableLogo: { 
    width: '85%', 
    height: '85%', 
    opacity: 0.08, 
    resizeMode: 'contain', 
    transform: [{ rotate: '-5deg' }] 
  },

  // ==========================================
  // 2. OYUNCU SLOTLARI (AVATARLAR)
  // ==========================================
  playerSlot: { 
    position: 'absolute', 
    alignItems: 'center', 
    zIndex: 60 
  },
  topPlayer: { 
    top: -35 
  }, 
  leftPlayer: { 
    left: -45, 
    top: '35%' 
  }, 
  rightPlayer: { 
    right: -45, 
    top: '35%' 
  }, 
  bottomPlayer: { 
    bottom: -35 
  },
  avatarContainer: { 
    alignItems: 'center' 
  },
  avatar: { 
    width: 68, 
    height: 68, 
    borderRadius: 24, 
    backgroundColor: '#FFF', 
    borderWidth: 4, 
    elevation: 15, 
    shadowColor: '#000', 
    shadowOpacity: 0.15, 
    shadowRadius: 10 
  },
  nameBadge: { 
    paddingHorizontal: 16, 
    paddingVertical: 6, 
    borderRadius: 20, 
    marginTop: -14, 
    borderWidth: 2, 
    borderColor: '#FFFFFF', 
    elevation: 10,
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    shadowRadius: 5
  },
  playerName: { 
    color: '#FFFFFF', 
    fontSize: 11, 
    fontWeight: '900', 
    letterSpacing: 1 
  },

  // ==========================================
  // 4. DUYURU BANNER'I
  // ==========================================
  announcementBanner: { 
    position: 'absolute', 
    top: '42%', 
    width: '100%', 
    zIndex: 1000, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  bannerGradient: { 
    width: '100%', 
    paddingVertical: 16, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderBottomWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.5)' 
  },
  announcementText: { 
    color: '#FFFFFF', 
    fontSize: 24, 
    fontWeight: '900', 
    letterSpacing: 10, 
    textShadowColor: 'rgba(0, 0, 0, 0.3)', 
    textShadowRadius: 8, 
    textShadowOffset: { width: 0, height: 2 } 
  },
  announcementTextWinner: { 
    color: '#FFFFFF', 
    textShadowColor: 'transparent' 
  },

  // ==========================================
  // 5. MERKEZ ALAN & DURUM KARTI
  // ==========================================
  centerArea: { 
    alignItems: 'center', 
    zIndex: 50 
  },
  situationCardWrapper: { 
    position: 'absolute', 
    top: -105, 
    alignSelf: 'center',
  },
  premiumSituationCard: { 
    width: 330, 
    minHeight: 160, 
    maxHeight: 185, 
    backgroundColor: '#FFD1A3', 
    borderRadius: 24, 
    borderWidth: 3.5, 
    borderColor: '#FFFFFF', 
    elevation: 20, 
    shadowColor: '#000', 
    shadowOpacity: 0.15, 
    shadowRadius: 12, 
    shadowOffset: { width: 0, height: 8 }, 
    overflow: 'hidden',
  },
  cardInnerContent: { 
    flex: 1, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    justifyContent: 'center', 
    zIndex: 2 
  },
  premiumHeaderCentered: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  moodBadge: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    paddingHorizontal: 12, 
    paddingVertical: 4,
    borderRadius: 10, 
    elevation: 4,
    shadowColor: '#FF8A00',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  moodLetter: { 
    fontSize: 14,
    fontWeight: '900', 
    letterSpacing: 1.5 
  },
  premiumDivider: { 
    height: 1.5, 
    backgroundColor: '#FFFFFF', 
    opacity: 0.7, 
    marginVertical: 6, 
    width: '80%',
    alignSelf: 'center'
  },
  premiumText: { 
    color: '#FFFFFF',
    fontSize: 15, 
    fontWeight: '800', 
    textAlign: 'center', 
    lineHeight: 20, 
  },

  // ==========================================
  // 6. YENİ NESİL NEON SAYAÇ (PRO TIMER)
  // ==========================================
  proTimerContainer: { 
    width: 120, 
    height: 120, 
    justifyContent: 'center', 
    alignItems: 'center' 
  }, 
  staticRing: { 
    position: 'absolute', 
    width: 104, 
    height: 104, 
    borderRadius: 52, 
    borderWidth: 3, 
    borderColor: 'rgba(255, 105, 235, 0.2)' 
  },
  staticRingFrozen: { 
    borderColor: 'rgba(0, 229, 255, 0.3)' 
  },
  timerRing: { 
    position: 'absolute', 
    width: 104, 
    height: 104, 
    borderRadius: 52, 
    borderWidth: 6, 
    borderBottomColor: 'transparent', 
    borderRightColor: 'transparent' 
  },
  timerRingNormal: { 
    borderTopColor: palet.neonOrange, 
    borderLeftColor: palet.neonOrange, 
    shadowColor: palet.neonOrange, 
    shadowOpacity: 0.9, 
    shadowRadius: 15 
  },
  timerRingDanger: { 
    borderTopColor: palet.danger, 
    borderLeftColor: palet.danger, 
    shadowColor: palet.danger, 
    shadowOpacity: 1, 
    shadowRadius: 20 
  },
  timerRingFrozen: { 
    borderTopColor: palet.neonBlue, 
    borderLeftColor: palet.neonBlue, 
    shadowColor: palet.neonBlue, 
    shadowOpacity: 1, 
    shadowRadius: 20 
  },
  snowOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    overflow: 'hidden', 
    borderRadius: 100, 
    zIndex: 10 
  },
  modernTimerContent: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: 'rgba(255, 255, 255, 0.85)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#FFFFFF', 
    elevation: 8, 
    shadowColor: '#000', 
    shadowOpacity: 0.15, 
    shadowRadius: 10 
  },
  modernTimerContentFrozen: { 
    backgroundColor: 'rgba(0, 229, 255, 0.2)' 
  },
  proTimerText: { 
    fontSize: 38, 
    fontWeight: '900', 
    color: palet.neonOrange 
  },
  proTimerTextDanger: { 
    color: palet.danger 
  },
  proTimerTextFrozen: { 
    color: palet.neonBlue, 
    textShadowColor: palet.neonBlue, 
    textShadowRadius: 15 
  },

  // ==========================================
  // 7. OYLAMA ALANI VE KARTLAR
  // ==========================================
  votingAreaPro: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: '100%', 
    paddingTop: 40 
  },
  proProgressBarContainer: { 
    position: 'absolute', 
    top: 15, 
    width: '60%', 
    height: 12, 
    backgroundColor: 'rgba(0, 0, 0, 0.08)', 
    borderRadius: 10, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.5)' 
  },
  proProgressBar: { 
    height: '100%', 
    borderRadius: 10, 
    elevation: 2 
  },
  votingRowPro: { 
    flexDirection: 'row', 
    gap: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 25 
  },
  voteCardWrapper: { 
    width: 105, 
    height: 145, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 14, 
    padding: 4, 
    borderWidth: 2, 
    borderColor: '#FFFFFF', 
    elevation: 15, 
    overflow: 'hidden', 
    shadowColor: '#000', 
    shadowOpacity: 0.2, 
    shadowRadius: 10 
  },
  votedCardStyle: { 
    borderColor: '#FFDC5E', 
    transform: [{ scale: 1.12 }], 
    shadowColor: '#FFDC5E', 
    shadowOpacity: 0.8, 
    shadowRadius: 15, 
    elevation: 20 
  },
  disabledVoteCard: { 
    opacity: 0.5 
  },
  myCardOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  myCardText: { 
    color: 'white', 
    fontSize: 11, 
    fontWeight: 'bold', 
    marginTop: 5, 
    letterSpacing: 1 
  },
  votedBadge: { 
    position: 'absolute', 
    bottom: -5, 
    right: -5, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 15, 
    padding: 5, 
    elevation: 10 
  },

  // ==========================================
  // 8. ALT AKSİYON MERKEZİ (DESTE)
  // ==========================================
  bottomDeckWrapper: { 
    position: 'absolute', 
    bottom: 25, 
    alignSelf: 'center', 
    alignItems: 'center', 
    width: '100%', 
    zIndex: 100 
  },
  handContainer: { 
    height: 110, 
    justifyContent: 'center' 
  },
  deckCard: {
    position: 'absolute',
    width: 110,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 4, 
  },
  deckCardInner: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent', 
  },
  highlightGlow: {
    shadowColor: '#00E5FF', 
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 15,
  },
  memeImage: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 10, 
    backgroundColor: '#F3F4F6' 
  },
  selectedBorder: { 
    ...StyleSheet.absoluteFillObject, 
    borderRadius: 14, 
    borderWidth: 4, 
    borderColor: '#FF00D6' 
  },
  playButton: { 
    position: 'absolute', 
    top: -60, 
    alignSelf: 'center', 
    zIndex: 150, 
    elevation: 25, 
    shadowColor: '#FF00D6', 
    shadowOpacity: 0.6, 
    shadowRadius: 15, 
    shadowOffset: { width: 0, height: 5 } 
  },
  playButtonGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 22, 
    paddingVertical: 12, 
    borderRadius: 25, 
    borderWidth: 2, 
    borderColor: 'rgba(255, 255, 255, 0.95)' 
  },
  playButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '900', 
    fontSize: 16, 
    letterSpacing: 2 
  },
  topBarContainer: {
    position: 'absolute',
    top: 19,
    left: -30, 
    zIndex: 50,
  },
  homeStylePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25, 
    borderWidth: 0.5,
    borderColor: 'rgba(255, 0, 214, 0.3)', 
    shadowColor: '#FF00D6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  verticalDivider: {
    width: 1.5,
    height: 18, 
    backgroundColor: 'rgba(148, 163, 184, 0.4)',
    borderRadius: 1,
  },
  hudWrapper: {
    position: 'absolute',
    top: 20,
    right: -30,
    zIndex: 999, 
  },
  hudContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)', 
    width: 55, 
    paddingVertical: 10, 
    alignItems: 'center',
    borderRadius: 25, 
    borderWidth: 1.5,
    borderColor: 'rgba(255, 0, 214, 0.3)',
    shadowColor: '#FF00D6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  hudTitleIcon: { 
    opacity: 0.9, 
    marginBottom: 8, 
    textShadowColor: 'rgba(251, 40, 216, 0.4)', 
    textShadowRadius: 18 
  },
  jokerIconWrapper: { 
    alignItems: 'center' 
  },
  jokerButton: {
    width: 40, 
    height: 50, 
    borderRadius: 18, 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#F0F0F0',
    marginBottom: 5,
    elevation: 6, 
    shadowOpacity: 0.45, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 4 }
  },
  jokerLogo: { 
    width: 32, 
    height: 32, 
    resizeMode: 'contain' 
  },
  jokerBadge: {
    position: 'absolute', 
    top: -6, 
    right: -6, 
    minWidth: 20, 
    height: 20, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: '#FFF', 
    elevation: 4
  },
  jokerBadgeText: { 
    color: '#FFF', 
    fontSize: 9, 
    fontWeight: '900' 
  },

});