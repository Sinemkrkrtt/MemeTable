import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Button } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function JoinRoom() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return <View />; // İzinler yükleniyor

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>Kamera iznine ihtiyacımız var Sinem! 📸</Text>
        <Button onPress={requestPermission} title="İzin Ver" />
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    alert(`Oda Kodu Okundu: ${data}`);
    // Burada navigation.navigate('RoomScreen', { roomId: data }) yapabilirsin
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      {scanned && (
        <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
          <Text style={styles.btnText}>Tekrar Tara</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  rescanBtn: { position: 'absolute', bottom: 50, alignSelf: 'center', backgroundColor: '#FF00D6', padding: 20, borderRadius: 15 },
  btnText: { color: 'white', fontWeight: 'bold' }
});