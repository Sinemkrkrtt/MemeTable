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
  justifyContent: 'space-between', // Bu arayı otomatik açar
  alignItems: 'center', 
  marginTop: 25,
  marginBottom: -5,
  paddingHorizontal: 20, // Kenarlardan nefes payı
  width: '100%', // Sağa yaslanması için tam genişlik şart
},
sleekVault: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.98)',
  // 🔥 DEĞİŞİKLİK BURADA:
  paddingLeft: 4,      // Market ikonunu sola iyice yaklaştırdık
  paddingRight: 16,     // Sağ taraftaki elmasın bitişinde boşluk bıraktık
  paddingVertical: 4,   // Dikeyde daha fit bir görünüm
  borderRadius: 18,     // Biraz daha keskin ve modern
  shadowColor: '#B832FA',
  shadowOpacity: 0.2,
  shadowRadius: 5,
  elevation: 8,
  borderWidth: 1,
  borderColor: '#F8F8F8',
},

shopIconContainer: {
  padding: 10,               // İkonun içindeki doluluk
  borderRadius: 14,          // Kutu kavisini ana çerçeveyle uyumlu yaptık
  marginRight: 12,           // Yanındaki coin ile arasını açtık
},
vaultValue: { 
  fontFamily: 'Nunito_900Black', 
  fontSize: 16, 
  color: '#2D1F35', // Çok koyu olmayan bir mor/siyah
  minWidth: 40,    // Rakamlar değişince kayma yapmaması için
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
    

  },
  logoutIcon: { transform: [{ rotate: '-45deg' }] },

  // --- LOGO ALANI ---
  logoArea: { 
    width: '100%', height: 240, marginTop: 10, marginBottom: 10, 
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

});