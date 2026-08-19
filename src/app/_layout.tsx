import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { OutingSessionProvider, useOutingSession } from '@/features/outing/OutingSessionContext';
import { colors } from '@/theme/colors';

function StorageWarning({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <View style={styles.storageWarning}>
      <Ionicons name="warning-outline" color={colors.warning} size={16} />
      <Text style={styles.storageWarningText}>No se ha podido guardar localmente el último cambio.</Text>
    </View>
  );
}

function RootTabs() {
  const {
    activeOuting,
    lastFinishedOuting,
    showCompletionSummary,
    dismissCompletionSummary,
    isHydrated,
    persistenceError,
  } = useOutingSession();
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];

  useEffect(() => {
    if (!isHydrated || !showCompletionSummary) return;

    if (currentRoute === 'index') {
      dismissCompletionSummary();
    }
  }, [
    currentRoute,
    dismissCompletionSummary,
    isHydrated,
    showCompletionSummary,
  ]);

  if (!isHydrated) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingTitle}>RECUPERANDO LA NOCHE</Text>
        <Text style={styles.loadingText}>Un segundo, estamos buscando las pruebas.</Text>
      </View>
    );
  }

  // Redirect síncrono: al terminar una salida evitamos que /outing llegue
  // a renderizarse sin activeOuting antes de abrir el resumen.
  if (
    showCompletionSummary &&
    !activeOuting &&
    lastFinishedOuting &&
    currentRoute === 'outing'
  ) {
    return <Redirect href="/summary" />;
  }

  return (
    <View style={styles.appShell}>
      <StorageWarning visible={persistenceError} />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explorar',
            tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="outing"
          options={{
            title: activeOuting ? 'En curso' : 'Salida',
            tabBarLabelStyle: styles.recordLabel,
            tabBarIcon: ({ focused }) => (
              <View style={[styles.recordButton, focused && styles.recordButtonFocused]}>
                <Ionicons name={activeOuting ? 'radio' : 'add'} color={colors.text} size={activeOuting ? 24 : 31} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="clubs"
          options={{
            title: 'Cuadrillas',
            tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
          }}
        />
        <Tabs.Screen name="summary" options={{ href: null, lazy: false }} />
      </Tabs>
    </View>
  );
}

export default function RootLayout() {
  return (
    <OutingSessionProvider>
      <StatusBar style="light" />
      <RootTabs />
    </OutingSessionProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 28,
    backgroundColor: colors.background,
  },
  loadingTitle: {
    marginTop: 8,
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  storageWarning: {
    minHeight: 34,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.surfaceRaised,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  storageWarningText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '700',
  },
  tabBar: {
    height: 78,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  recordLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
  },
  recordButton: {
    width: 54,
    height: 54,
    marginTop: -18,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderWidth: 4,
    borderColor: colors.background,
  },
  recordButtonFocused: {
    backgroundColor: colors.accentPressed,
  },
});