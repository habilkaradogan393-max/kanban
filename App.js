import React from 'react';
import { StyleSheet, View, SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  // Not: Geliştirme aşamasında yerel IP kullanılabilir. 
  // APK için dist klasörü bir sunucu üzerinden veya gömülü olarak yüklenebilir.
  // Burada kolaylık olması açısından kullanıcının yerel ağ adresini kullanıyoruz.
  const uri = 'http://192.168.1.204:3000'; 

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.webview}>
        <WebView 
          source={{ uri }} 
          style={styles.flex}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
        />
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  webview: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
});
