import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';
import { AuthMapBackground } from './AuthMapBackground';
import { ArrowLeftIcon } from '../icons/ArrowLeftIcon';

type Props = {
  title: string;
  children: ReactNode;
  showBackButton?: boolean;
};

/** Layout compartido por las pantallas de auth: fondo de mapa + título + contenido scrolleable. */
export function AuthScreenShell({ title, children, showBackButton = true }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.root}>
      {/* Sin "top": el mapa debe llegar hasta el borde superior de la
          pantalla, igual que en el diseño (va detrás de la barra de estado). */}
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces
          >
            {/* El mapa va dentro del scroll (no fijo) para que se desplace
                junto con el formulario y nunca quede el texto montado sobre
                los pines del mapa. */}
            <AuthMapBackground height={windowHeight * 0.52} />
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.body}>{children}</View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Botón de retroceso superpuesto */}
      {showBackButton && (
        <Pressable
          style={[styles.backButton, { top: Math.max(insets.top + 16, 16) }]}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
        >
          <ArrowLeftIcon size={24} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  content: {
    paddingHorizontal: 24,
    backgroundColor: colors.white,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 30,
    color: colors.black,
    marginBottom: 20,
  },
  body: {
    gap: 18,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
