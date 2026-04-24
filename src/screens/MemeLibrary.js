import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, SafeAreaView, Dimensions } from 'react-native';
import { OFFICIAL_MEMES } from '../memeData'; // Az önce oluşturduğun dosyayı çağırıyoruz

const { width } = Dimensions.get('window');

export default function MemeLibrary() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meme Kütüphanesi 📚</Text>
        <Text style={styles.subtitle}>{OFFICIAL_MEMES.length} Efsane İçerik</Text>
      </View>

      <FlatList
        data={OFFICIAL_MEMES}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image 
              source={{ uri: item.url }} 
              style={styles.image} 
              resizeMode="cover"
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F9' },
  header: { padding: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#2D0031' },
  subtitle: { fontSize: 14, color: '#FF00D6', fontWeight: '600', marginTop: 5 },
  listContent: { padding: 10 },
  card: {
    flex: 1,
    margin: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    overflow: 'hidden'
  },
  image: {
    width: '100%',
    height: width / 2 - 40, // Kare formunda şık durması için
  }
});