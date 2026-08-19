import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
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
            title: 'Salida',
            tabBarLabelStyle: styles.recordLabel,
            tabBarIcon: ({ focused }) => (
              <View style={[styles.recordButton, focused && styles.recordButtonFocused]}>
                <Ionicons name="add" color={colors.text} size={31} />
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
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
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
