import React, { Suspense, useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ContentPreviewScreen } from './src/screens/ContentPreviewScreen';

// react-native-skia's web binding (`Skia.web.ts`) does `JsiSkApi(global.CanvasKit)`
// at module-evaluation time. If anything that transitively imports `Skia` gets
// bundled/evaluated eagerly (a plain top-level `import`), it binds to an
// undefined CanvasKit forever — every path/shape call then fails with
// "Cannot read properties of undefined". `React.lazy` defers the `import()`
// (and everything it pulls in) until we actually render it, which we only do
// once CanvasKit has finished loading below.
const DressUpScreen = React.lazy(() =>
  import('./src/screens/DressUpScreen').then((m) => ({ default: m.DressUpScreen }))
);

export default function App() {
  const [skiaReady, setSkiaReady] = useState(Platform.OS !== 'web');
  const [mode, setMode] = useState<'dressup' | 'content'>('dressup');

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    import('@shopify/react-native-skia/lib/module/web').then(({ LoadSkiaWeb }) => {
      LoadSkiaWeb({ locateFile: (file: string) => `/${file}` }).then(() => setSkiaReady(true));
    });
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.modeToggle}
        onPress={() => setMode((m) => (m === 'dressup' ? 'content' : 'dressup'))}
      >
        <Text style={styles.modeToggleText}>{mode === 'dressup' ? 'Preview New Content Pack' : 'Back to Dress Up'}</Text>
      </TouchableOpacity>
      {mode === 'content' ? (
        <ContentPreviewScreen />
      ) : (
        <Suspense fallback={<Loading />}>{skiaReady ? <DressUpScreen /> : <Loading />}</Suspense>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

function Loading() {
  return (
    <View style={styles.loading}>
      <Text style={styles.loadingText}>Loading graphics engine…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff0f6',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff0f6',
  },
  loadingText: {
    color: '#b83c6f',
    fontWeight: '600',
  },
  modeToggle: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: '#b83c6f',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  modeToggleText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
