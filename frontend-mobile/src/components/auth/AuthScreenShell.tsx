import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';
import { AuthMapBackground } from './AuthMapBackground';

type Props = {
  title: string;
  children: ReactNode;
};

/** Layout compartido por las pantallas de auth: fondo de mapa + título + contenido scrolleable. */
export function AuthScreenShell({ title, children }: Props) {
  const { height: windowHeight } = useWindowDimensions();

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
});
