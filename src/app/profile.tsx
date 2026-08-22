import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/features/auth/AuthContext';
import { colors } from '@/theme/colors';

const GOOGLE_G_LOGO = 'https://developers.google.com/static/identity/images/g-logo.png';

function friendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Ha ocurrido un error con la cuenta.';
  if (/provider.*not.*enabled|unsupported provider/i.test(message)) {
    return 'Google OAuth todavía necesita conectar las credenciales de Google Cloud.';
  }
  if (/invalid login credentials/i.test(message)) return 'Email o contraseña incorrectos.';
  if (/already registered/i.test(message)) return 'Ese email ya está registrado.';
  return message;
}

export default function ProfileScreen() {
  const {
    user,
    profile,
    isLoading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    updateProfile,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName ?? '');
    setUsername(profile.username ?? '');
  }, [profile]);

  const run = async (action: () => Promise<void>, success?: string) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await action();
      if (success) setMessage(success);
    } catch (caught) {
      setError(friendlyAuthError(caught));
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.muted}>Comprobando la cuenta…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>PERFIL</Text>
        <Text style={styles.title}>Que la noche tenga dueño.</Text>
        <Text style={styles.subtitle}>
          Inicia sesión para guardar tus salidas en la nube y recuperarlas en otros dispositivos.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>ENTRAR O CREAR CUENTA</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={styles.input}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            secureTextEntry
            autoComplete="password"
            style={styles.input}
          />

          <Text style={styles.label}>Nombre <Text style={styles.optional}>(solo al registrarte)</Text></Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Cómo quieres aparecer"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.success}>{message}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed, busy && styles.disabled]}
            disabled={busy}
            onPress={() => run(() => signInWithEmail(email, password))}
          >
            <Text style={styles.primaryButtonText}>INICIAR SESIÓN</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed, busy && styles.disabled]}
            disabled={busy}
            onPress={() =>
              run(async () => {
                const needsConfirmation = await signUpWithEmail(email, password, fullName);
                setMessage(
                  needsConfirmation
                    ? 'Cuenta creada. Revisa tu email para confirmar el registro.'
                    : 'Cuenta creada y sesión iniciada.',
                );
              })
            }
          >
            <Text style={styles.secondaryButtonText}>CREAR CUENTA</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>O</Text>
            <View style={styles.divider} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continuar con Google"
            style={({ pressed }) => [styles.googleButton, pressed && styles.googleButtonPressed, busy && styles.disabled]}
            disabled={busy}
            onPress={() => run(signInWithGoogle)}
          >
            <Image source={{ uri: GOOGLE_G_LOGO }} style={styles.googleLogo} resizeMode="contain" />
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </Pressable>

          {busy ? <ActivityIndicator style={styles.busy} color={colors.accent} /> : null}
        </View>

        <View style={styles.localNotice}>
          <Ionicons name="phone-portrait-outline" size={18} color={colors.textMuted} />
          <Text style={styles.localNoticeText}>
            Puedes seguir usando RESAKA sin cuenta. El almacenamiento local sigue funcionando como hasta ahora.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>PERFIL</Text>
      <View style={styles.identityRow}>
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarText}>{(profile?.username ?? profile?.fullName ?? user.email ?? 'R').slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.identityCopy}>
          <Text style={styles.title}>{profile?.username ? `@${profile.username}` : 'Perfil sin alias'}</Text>
          <Text style={styles.subtitle}>{user.email}</Text>
        </View>
      </View>

      <View style={styles.cloudBadge}>
        <Ionicons name="cloud-done-outline" size={18} color={colors.success} />
        <View style={styles.cloudCopy}>
          <Text style={styles.cloudTitle}>SUPABASE CONECTADO</Text>
          <Text style={styles.cloudText}>Las salidas terminadas se sincronizan con tu cuenta.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>DATOS DE PERFIL</Text>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Nombre visible"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Alias</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="ej. david"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          maxLength={24}
          style={styles.input}
        />
        <Text style={styles.helper}>Entre 3 y 24 caracteres. El alias es único.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.success}>{message}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed, busy && styles.disabled]}
          disabled={busy}
          onPress={() =>
            run(
              () => updateProfile({ username: username || null, fullName: fullName || null }),
              'Perfil actualizado.',
            )
          }
        >
          <Text style={styles.primaryButtonText}>GUARDAR PERFIL</Text>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.signOutButton, pressed && styles.buttonPressed]}
        onPress={() => run(signOut)}
        disabled={busy}
      >
        <Ionicons name="log-out-outline" size={19} color={colors.danger} />
        <Text style={styles.signOutText}>CERRAR SESIÓN</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 18, paddingTop: 30, paddingBottom: 120, gap: 18 },
  loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 12 },
  eyebrow: { color: colors.accent, fontSize: 12, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: colors.text, fontSize: 28, lineHeight: 32, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  muted: { color: colors.textMuted, fontSize: 13 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 18, gap: 10 },
  cardTitle: { color: colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 1.2, marginBottom: 4 },
  label: { color: colors.text, fontSize: 12, fontWeight: '800', marginTop: 4 },
  optional: { color: colors.textMuted, fontWeight: '600' },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surfaceRaised, color: colors.text, paddingHorizontal: 14, fontSize: 15 },
  helper: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  primaryButton: { minHeight: 48, marginTop: 8, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  primaryButtonText: { color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.8 },
  secondaryButton: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.accent, fontSize: 13, fontWeight: '900', letterSpacing: 0.8 },
  googleButton: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: '#747775', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 12 },
  googleButtonPressed: { backgroundColor: '#F7F8F8' },
  googleLogo: { width: 20, height: 20 },
  googleButtonText: { color: '#1F1F1F', fontSize: 14, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 5 },
  divider: { height: 1, flex: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  busy: { marginTop: 4 },
  disabled: { opacity: 0.55 },
  buttonPressed: { opacity: 0.78 },
  error: { color: colors.danger, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  success: { color: colors.success, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  localNotice: { flexDirection: 'row', gap: 10, paddingHorizontal: 4, alignItems: 'flex-start' },
  localNoticeText: { flex: 1, color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  identityCopy: { flex: 1, gap: 3 },
  avatarFallback: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.text, fontSize: 24, fontWeight: '900' },
  cloudBadge: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cloudCopy: { flex: 1, gap: 2 },
  cloudTitle: { color: colors.success, fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  cloudText: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  signOutButton: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  signOutText: { color: colors.danger, fontSize: 13, fontWeight: '900', letterSpacing: 0.6 },
});
