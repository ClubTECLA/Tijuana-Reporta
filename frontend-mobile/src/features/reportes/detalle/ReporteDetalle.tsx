import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ComentarioConAutor, Reporte } from '@/types/api';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { hace } from '@/lib/time';
import { LocationPinIcon } from '@/components/icons/LocationPinIcon';
import { SendIcon } from '@/components/icons/SendIcon';
import { EstadoVista } from '@/components/estado/EstadoVista';
import { estadoDeQuery, mensajeDeError } from '@/lib/estados';
import { useEnLinea } from '@/lib/red';
import { CategoriaBadge } from '../crear/CategoriaBadge';
import { CerrarButton } from '../crear/CerrarButton';
import { etiquetaLabel } from '../crear/categorias';
import { useComentar, useComentarios } from '../hooks';

interface ReporteDetalleProps {
  reporte: Reporte;
  /** Distancia desde el borde superior / inferior de la pantalla hasta la tarjeta. */
  top: number;
  bottom: number;
  onClose: () => void;
  /** Solo para el invitado: en lugar del campo de comentario se muestra un botón que llama a esto. */
  onPedirCuenta?: () => void;
}

/** Extrae la primera letra del autor en mayúscula, o una cadena vacía si no hay nombre. */
const inicial = (autor: string) => autor.trim().charAt(0).toUpperCase();

/** Muestra autor, antigüedad y texto de un comentario, destacando a los rescatistas. */
function Comentario({ comentario }: { comentario: ComentarioConAutor }) {
  const rescatista = comentario.es_rescatista === true;
  return (
    <View style={styles.comentario}>
      <View style={[styles.avatar, rescatista && styles.avatarRescatista]}>
        <Text style={styles.avatarTexto}>{inicial(comentario.autor)}</Text>
      </View>
      <View style={styles.comentarioCuerpo}>
        <Text style={styles.comentarioMeta}>
          <Text style={[styles.comentarioAutor, rescatista && styles.rescatista]}>{comentario.autor}</Text>
          {rescatista && <Text style={styles.rescatista}> · Rescatista</Text>}
          <Text style={styles.comentarioHace}> · {hace(comentario.created_at).toLowerCase()}</Text>
        </Text>
        <Text style={styles.comentarioTexto}>{comentario.comentario}</Text>
      </View>
    </View>
  );
}

/**
 * Tarjeta "Ver reporte" (Figma 22): foto, título, dirección, etiquetas e hilo de
 * comentarios. Se abre al tocar un pin del mapa o "Ver reporte" tras crear uno.
 */
export function ReporteDetalle({ reporte, top, bottom, onClose, onPedirCuenta }: ReporteDetalleProps) {
  const [categoriaPrincipal, ...categoriasExtra] = reporte.categorias;
  const comentariosQuery = useComentarios(reporte.id);
  const comentarios = comentariosQuery.data ?? [];
  const estadoHilo = estadoDeQuery(comentariosQuery, (lista) => lista.length === 0);
  const comentar = useComentar(reporte.id);
  const enLinea = useEnLinea();
  const [texto, setTexto] = useState('');
  const hilo = useRef<ScrollView>(null);
  const [teclado, setTeclado] = useState(0);
  const insets = useSafeAreaInsets();

  // Con el teclado abierto la tarjeta sube y la foto se compacta, para que el hilo y el
  // campo de texto sigan visibles en pantallas bajas.
  useEffect(() => {
    const mostrar = Keyboard.addListener('keyboardDidShow', (e) => setTeclado(e.endCoordinates.height));
    const ocultar = Keyboard.addListener('keyboardDidHide', () => setTeclado(0));
    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, []);

  const puedeEnviar = texto.trim().length > 0 && !comentar.isPending;

  /** Publica el texto válido y, al completarse, limpia el campo y desplaza el hilo al final. */
  const enviar = () => {
    if (!puedeEnviar) return;
    comentar.mutate(texto.trim(), {
      onSuccess: () => {
        setTexto('');
        setTimeout(() => hilo.current?.scrollToEnd({ animated: true }), 100);
      },
    });
  };

  return (
    <View style={[styles.tarjeta, { top, bottom: teclado > 0 ? teclado + insets.bottom + 8 : bottom }]}>
      <View style={[styles.encabezado, teclado > 0 && styles.encabezadoCompacto]}>
        {reporte.image_url ? (
          <Image source={{ uri: reporte.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.fotoVacia]}>
            {teclado === 0 && <CategoriaBadge categoria={categoriaPrincipal} size={64} glyphScale={1.2} />}
          </View>
        )}
        <LinearGradient
          colors={['transparent', colors.captionGradient]}
          style={styles.pie}
          pointerEvents="none"
        />
        <Text style={styles.pieTexto}>{hace(reporte.created_at)}</Text>
        <View style={styles.cerrar}>
          <CerrarButton onPress={onClose} />
        </View>
      </View>

      <View style={styles.titulo}>
        <View style={styles.badges}>
          <CategoriaBadge categoria={categoriaPrincipal} size={23} />
          {categoriasExtra.map((categoria) => (
            <CategoriaBadge key={categoria} categoria={categoria} size={23} />
          ))}
        </View>
        <Text style={styles.tituloTexto} numberOfLines={2}>
          {reporte.titulo}
        </Text>
      </View>

      <View style={styles.zona}>
        <LocationPinIcon size={23} color={colors.slate} />
        <Text style={styles.zonaTexto} numberOfLines={1}>
          {reporte.direccion ?? `${reporte.lat.toFixed(4)}, ${reporte.lng.toFixed(4)}`}
        </Text>
      </View>

      {reporte.tags.length > 0 && (
        <View style={styles.etiquetas}>
          {reporte.tags.map((tag) => (
            <View key={tag} style={styles.etiqueta}>
              <Text style={styles.etiquetaTexto}>{etiquetaLabel(tag)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.hilo}>
        {estadoHilo === 'cargando' ? (
          <EstadoVista estado="cargando" mensaje="Cargando comentarios…" compacto />
        ) : estadoHilo === 'sin-conexion' ? (
          <EstadoVista estado="sin-conexion" mensaje="Sin conexión: los comentarios se cargarán al reconectar." compacto />
        ) : estadoHilo === 'error' ? (
          <EstadoVista
            estado="error"
            mensaje="No se pudieron cargar los comentarios."
            onReintentar={() => void comentariosQuery.refetch()}
            compacto
          />
        ) : estadoHilo === 'vacio' ? (
          <EstadoVista estado="vacio" mensaje="Aún no hay comentarios. Sé el primero en comentar." compacto />
        ) : (
          <ScrollView
            ref={hilo}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.hiloContenido}
          >
            {comentarios.map((comentario) => (
              <Comentario key={comentario.id} comentario={comentario} />
            ))}
          </ScrollView>
        )}
      </View>

      {onPedirCuenta ? (
        // El invitado puede leer el hilo, pero para comentar necesita una cuenta.
        <View style={styles.escribir}>
          <Pressable onPress={onPedirCuenta} accessibilityRole="button" style={styles.pedirCuenta}>
            <Text style={styles.pedirCuentaTexto}>Crea una cuenta para comentar</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {comentar.isError && (
            <Text style={styles.errorEnvio} accessibilityLiveRegion="polite">
              {mensajeDeError(comentar.error, 'No se pudo publicar tu comentario. Intenta de nuevo.')}
            </Text>
          )}
          {!enLinea && !comentar.isError && (
            <Text style={styles.avisoEnvio}>Sin conexión: podrás comentar cuando vuelvas a estar en línea.</Text>
          )}
          <View style={styles.escribir}>
            <TextInput
              value={texto}
              onChangeText={(nuevo) => {
                // El aviso era de lo que se intentó enviar: al editar deja de aplicar.
                if (comentar.isError) comentar.reset();
                setTexto(nuevo);
              }}
              onSubmitEditing={enviar}
              placeholder="Escribe un comentario"
              placeholderTextColor={colors.textMuted}
              returnKeyType="send"
              style={styles.campo}
            />
            <Pressable
              onPress={enviar}
              disabled={!puedeEnviar}
              accessibilityRole="button"
              accessibilityLabel="Enviar comentario"
              style={[styles.enviar, !puedeEnviar && styles.enviarInactivo]}
            >
              {comentar.isPending ? <ActivityIndicator color={colors.white} /> : <SendIcon size={20} />}
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    position: 'absolute',
    left: 10,
    right: 10,
    borderRadius: 30,
    backgroundColor: colors.white,
    overflow: 'hidden',
    gap: 13,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  encabezado: {
    height: 151,
    backgroundColor: colors.photoBackground,
  },
  encabezadoCompacto: {
    height: 56,
  },
  fotoVacia: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pie: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 38,
  },
  pieTexto: {
    position: 'absolute',
    left: 12,
    bottom: 4,
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.white,
  },
  cerrar: {
    position: 'absolute',
    top: 9,
    right: 9,
  },

  titulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  tituloTexto: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 27,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  zona: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  zonaTexto: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 15.5,
    color: colors.slate,
  },
  etiquetas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
  },
  etiqueta: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.infoSubtle,
  },
  etiquetaTexto: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.brandText,
  },

  hilo: {
    flex: 1,
    borderTopWidth: 1.3,
    borderTopColor: colors.borderSubtle,
  },
  hiloContenido: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
  },
  errorEnvio: {
    paddingHorizontal: 16,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.estadoError,
  },
  avisoEnvio: {
    paddingHorizontal: 16,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.slate,
  },
  comentario: {
    flexDirection: 'row',
    gap: 11,
    paddingVertical: 9,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginTop: 2,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRescatista: {
    backgroundColor: colors.rescatistaAvatar,
  },
  avatarTexto: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: colors.white,
  },
  comentarioCuerpo: {
    flex: 1,
  },
  comentarioMeta: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 22,
  },
  comentarioAutor: {
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
  },
  rescatista: {
    color: colors.rescatista,
  },
  comentarioHace: {
    color: colors.labelMuted,
  },
  comentarioTexto: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(31,39,51,0.8)',
  },

  pedirCuenta: {
    flex: 1,
    height: 48,
    borderRadius: 31,
    backgroundColor: colors.infoSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pedirCuentaTexto: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: colors.brandText,
  },
  escribir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingLeft: 11,
    paddingRight: 23,
    paddingVertical: 10,
    borderTopWidth: 1.3,
    borderTopColor: colors.borderSubtle,
  },
  campo: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: colors.divider,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.ink,
  },
  enviar: {
    width: 50,
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.reportRed,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.reportRed,
  },
  enviarInactivo: {
    opacity: 0.5,
  },
});
