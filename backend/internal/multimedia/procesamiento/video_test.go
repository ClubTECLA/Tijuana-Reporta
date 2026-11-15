package procesamiento

import (
	"bytes"
	"encoding/binary"
	"errors"
	"testing"
	"time"
)

const maxDuracionTest = 6 * time.Second

// ubicacion es lo que un teléfono guarda de la posición; no debe sobrevivir.
var ubicacion = []byte("+32.5149-117.0382/")

// armarCaja arma una caja MP4: tamaño, tipo y el contenido.
func armarCaja(tipo string, contenido ...[]byte) []byte {
	cuerpo := bytes.Join(contenido, nil)
	b := make([]byte, 8, 8+len(cuerpo))
	binary.BigEndian.PutUint32(b, uint32(8+len(cuerpo)))
	copy(b[4:], tipo)
	return append(b, cuerpo...)
}

func uint32BE(n uint32) []byte { return binary.BigEndian.AppendUint32(nil, n) }

// mvhdV0 arma un mvhd de versión 0 con la duración dada en unidades de timescale.
func mvhdV0(timescale, duracion uint32) []byte {
	return armarCaja("mvhd", []byte{0, 0, 0, 0}, uint32BE(0), uint32BE(0), uint32BE(timescale), uint32BE(duracion), make([]byte, 80))
}

// mvhdV1 arma un mvhd de versión 1 (tiempos de 64 bits).
func mvhdV1(timescale uint32, duracion uint64) []byte {
	return armarCaja("mvhd", []byte{1, 0, 0, 0}, make([]byte, 8), make([]byte, 8), uint32BE(timescale),
		binary.BigEndian.AppendUint64(nil, duracion), make([]byte, 80))
}

func ftyp(marca string) []byte {
	return armarCaja("ftyp", []byte(marca), uint32BE(0), []byte("isom"))
}

var mdatDePrueba = bytes.Repeat([]byte{0xAB}, 64)

// mp4De arma un MP4 mínimo con cinco segundos, ubicación en varios lugares y los datos al final.
func mp4De(moov []byte) []byte {
	return bytes.Join([][]byte{ftyp("mp42"), moov, armarCaja("mdat", mdatDePrueba)}, nil)
}

// mdhdV0 arma un mdhd de versión 0, que tiene el mismo formato que mvhd en lo que se lee.
func mdhdV0(timescale, duracion uint32) []byte {
	return armarCaja("mdhd", []byte{0, 0, 0, 0}, uint32BE(0), uint32BE(0), uint32BE(timescale), uint32BE(duracion), make([]byte, 4))
}

// hdlr arma la caja que dice de qué tipo es una pista (vide, soun, meta...).
func hdlr(tipo string) []byte {
	return armarCaja("hdlr", []byte{0, 0, 0, 0}, uint32BE(0), []byte(tipo), make([]byte, 12), []byte{0})
}

// trakDe arma una pista del tipo dado, de cinco segundos, con la ubicación a nivel
// de trak; mdiaExtra son cajas que se agregan dentro de su mdia.
func trakDe(tipo string, mdhd []byte, mdiaExtra ...[]byte) []byte {
	mdia := armarCaja("mdia", append([][]byte{hdlr(tipo), mdhd}, mdiaExtra...)...)
	return armarCaja("trak", armarCaja("tkhd", make([]byte, 84)), armarCaja("udta", armarCaja("\xa9xyz", ubicacion)), mdia)
}

func trakValido() []byte { return trakDe("vide", mdhdV0(1000, 5000)) }

func moovCon(mvhd []byte, trak []byte) []byte {
	return armarCaja("moov", mvhd, trak, armarCaja("udta", armarCaja("\xa9xyz", ubicacion)), armarCaja("meta", []byte{0, 0, 0, 0}, ubicacion))
}

func moovValido(mvhd []byte) []byte { return moovCon(mvhd, trakValido()) }

func mp4Valido() []byte { return mp4De(moovValido(mvhdV0(1000, 5000))) }

func TestDetectarTipo(t *testing.T) {
	tests := []struct {
		name  string
		datos []byte
		want  Tipo
		err   error
	}{
		{name: "JPEG", datos: []byte{0xFF, 0xD8, 0xFF, 0xE0, 0, 0}, want: TipoFoto},
		{name: "MP4", datos: mp4Valido(), want: TipoVideo},
		{name: "PNG", datos: []byte("\x89PNG\r\n\x1a\n0000"), err: ErrFormatoNoSoportado},
		{name: "vacío", datos: nil, err: ErrFormatoNoSoportado},
		{name: "ftyp en otra posición", datos: []byte("ftyp0000000000"), err: ErrFormatoNoSoportado},
		{name: "muy corto", datos: []byte{0xFF, 0xD8}, err: ErrFormatoNoSoportado},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := DetectarTipo(tt.datos)
			if !errors.Is(err, tt.err) || got != tt.want {
				t.Errorf("DetectarTipo() = %q, %v; want %q, %v", got, err, tt.want, tt.err)
			}
		})
	}
}

func TestProcesarVideo_QuitaLaUbicacionYConservaElResto(t *testing.T) {
	entrada := mp4Valido()
	copiaEntrada := append([]byte{}, entrada...)

	salida, err := ProcesarVideo(entrada, maxDuracionTest)
	if err != nil {
		t.Fatalf("ProcesarVideo() = %v, want nil", err)
	}

	if bytes.Contains(salida, ubicacion) {
		t.Error("la ubicación sigue en el archivo")
	}
	if len(salida) != len(entrada) {
		t.Errorf("tamaño = %d, want %d (mismo tamaño para no mover offsets)", len(salida), len(entrada))
	}
	if !bytes.Contains(salida, mdatDePrueba) {
		t.Error("los datos del video cambiaron")
	}
	if !bytes.Equal(entrada, copiaEntrada) {
		t.Error("ProcesarVideo modificó la entrada")
	}
	for _, tipo := range []string{"udta", "meta", "\xa9xyz"} {
		if bytes.Contains(salida, []byte(tipo)) {
			t.Errorf("la caja %q sigue en el archivo", tipo)
		}
	}
	for _, tipo := range []string{"ftyp", "moov", "mvhd", "trak", "tkhd", "mdat"} {
		if !bytes.Contains(salida, []byte(tipo)) {
			t.Errorf("falta la caja %q", tipo)
		}
	}
}

func TestProcesarVideo_QuitaUuidDeNivelSuperior(t *testing.T) {
	xmp := []byte("<xmp>" + string(ubicacion) + "</xmp>")
	entrada := append(mp4Valido(), armarCaja("uuid", make([]byte, 16), xmp)...)

	salida, err := ProcesarVideo(entrada, maxDuracionTest)
	if err != nil {
		t.Fatalf("ProcesarVideo() = %v, want nil", err)
	}
	if bytes.Contains(salida, ubicacion) || bytes.Contains(salida, []byte("uuid")) {
		t.Error("la caja uuid con la ubicación sigue en el archivo")
	}
}

func TestProcesarVideo_Duracion(t *testing.T) {
	tests := []struct {
		name string
		moov []byte
		err  error
	}{
		{name: "cinco segundos", moov: moovValido(mvhdV0(1000, 5000))},
		{name: "justo en el límite", moov: moovValido(mvhdV0(1000, 6000))},
		{name: "un milisegundo de más", moov: moovValido(mvhdV0(1000, 6001)), err: ErrVideoMuyLargo},
		{name: "muy largo", moov: moovValido(mvhdV0(600, 600*3600)), err: ErrVideoMuyLargo},
		{name: "versión 1 válida", moov: moovValido(mvhdV1(1000, 5000))},
		{name: "versión 1 muy larga", moov: moovValido(mvhdV1(1000, 1<<40)), err: ErrVideoMuyLargo},
		{name: "duración cero (fragmentado)", moov: moovValido(mvhdV0(1000, 0)), err: ErrFormatoNoSoportado},
		{name: "timescale cero", moov: moovValido(mvhdV0(0, 5000)), err: ErrFormatoNoSoportado},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := ProcesarVideo(mp4De(tt.moov), maxDuracionTest)
			if !errors.Is(err, tt.err) {
				t.Errorf("ProcesarVideo() = %v, want %v", err, tt.err)
			}
		})
	}
}

func TestProcesarVideo_Pistas(t *testing.T) {
	gps := []byte("GPS+32.5149-117.0382")
	metaEnMdia := armarCaja("meta", []byte{0, 0, 0, 0}, gps)
	tests := []struct {
		name string
		trak []byte
		err  error
	}{
		{name: "pista de audio", trak: trakDe("soun", mdhdV0(44100, 220500))},
		{name: "pista de metadatos con tiempo (GPS)", trak: trakDe("meta", mdhdV0(1000, 5000)), err: ErrFormatoNoSoportado},
		{name: "pista de texto", trak: trakDe("text", mdhdV0(1000, 5000)), err: ErrFormatoNoSoportado},
		{name: "pista más larga que mvhd", trak: trakDe("vide", mdhdV0(1000, 30000)), err: ErrVideoMuyLargo},
		{name: "pista justo en el límite", trak: trakDe("vide", mdhdV0(1000, 6000))},
		{name: "mdhd sin duración", trak: trakDe("vide", mdhdV0(1000, 0)), err: ErrFormatoNoSoportado},
		{name: "sin mdia", trak: armarCaja("trak", armarCaja("tkhd", make([]byte, 84))), err: ErrFormatoNoSoportado},
		{name: "mdia sin hdlr", trak: armarCaja("trak", armarCaja("mdia", mdhdV0(1000, 5000))), err: ErrFormatoNoSoportado},
		{name: "mdia sin mdhd", trak: armarCaja("trak", armarCaja("mdia", hdlr("vide"))), err: ErrFormatoNoSoportado},
		{name: "hdlr truncada", trak: armarCaja("trak", armarCaja("mdia", armarCaja("hdlr", []byte{0, 0, 0, 0}), mdhdV0(1000, 5000))), err: ErrFormatoNoSoportado},
		{name: "ubicación dentro de mdia", trak: trakDe("vide", mdhdV0(1000, 5000), metaEnMdia)},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			salida, err := ProcesarVideo(mp4De(moovCon(mvhdV0(1000, 5000), tt.trak)), maxDuracionTest)
			if !errors.Is(err, tt.err) {
				t.Fatalf("ProcesarVideo() = %v, want %v", err, tt.err)
			}
			if err == nil && bytes.Contains(salida, gps) {
				t.Error("la ubicación de la pista sigue en el archivo")
			}
		})
	}
}

func TestProcesarVideo_Estructura(t *testing.T) {
	trak := trakValido()
	tests := []struct {
		name  string
		datos []byte
	}{
		{name: "vacío", datos: nil},
		{name: "sin ftyp al inicio", datos: bytes.Join([][]byte{moovValido(mvhdV0(1000, 5000)), ftyp("mp42")}, nil)},
		{name: "QuickTime (.mov)", datos: bytes.Join([][]byte{ftyp("qt  "), moovValido(mvhdV0(1000, 5000))}, nil)},
		{name: "imagen HEIC", datos: bytes.Join([][]byte{ftyp("heic"), armarCaja("meta", make([]byte, 40))}, nil)},
		{name: "sin mdat", datos: bytes.Join([][]byte{ftyp("mp42"), moovValido(mvhdV0(1000, 5000))}, nil)},
		{name: "sin moov", datos: bytes.Join([][]byte{ftyp("mp42"), armarCaja("mdat", mdatDePrueba)}, nil)},
		{name: "moov sin mvhd", datos: mp4De(armarCaja("moov", trak))},
		{name: "moov sin trak", datos: mp4De(armarCaja("moov", mvhdV0(1000, 5000)))},
		{name: "dos moov", datos: append(mp4Valido(), moovValido(mvhdV0(1000, 5000))...)},
		{name: "mvhd demasiado corto", datos: mp4De(armarCaja("moov", armarCaja("mvhd", []byte{0, 0, 0, 0, 0}), trak))},
		{name: "caja menor que su cabecera", datos: append(mp4Valido(), 0, 0, 0, 4, 'f', 'r', 'e', 'e')},
		{name: "caja más grande que el archivo", datos: append(mp4Valido(), 0, 0, 0xFF, 0xFF, 'm', 'd', 'a', 't')},
		{name: "sobran bytes al final", datos: append(mp4Valido(), 1, 2, 3)},
		{name: "caja de 64 bits truncada", datos: append(mp4Valido(), 0, 0, 0, 1, 'm', 'd', 'a', 't', 0, 0)},
		{name: "caja de 64 bits gigante", datos: append(mp4Valido(), 0, 0, 0, 1, 'm', 'd', 'a', 't', 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF)},
		{name: "hija de moov más grande que moov", datos: mp4De(armarCaja("moov", mvhdV0(1000, 5000), trak, []byte{0, 0, 0xFF, 0, 'u', 'd', 't', 'a'}))},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if _, err := ProcesarVideo(tt.datos, maxDuracionTest); !errors.Is(err, ErrFormatoNoSoportado) {
				t.Errorf("ProcesarVideo() = %v, want %v", err, ErrFormatoNoSoportado)
			}
		})
	}
}

func TestProcesarVideo_CajasDeTamanoEspecial(t *testing.T) {
	moov := moovValido(mvhdV0(1000, 5000))
	cuerpo := mdatDePrueba

	t.Run("mdat de 64 bits", func(t *testing.T) {
		mdat := append([]byte{0, 0, 0, 1, 'm', 'd', 'a', 't'}, binary.BigEndian.AppendUint64(nil, uint64(16+len(cuerpo)))...)
		mdat = append(mdat, cuerpo...)
		if _, err := ProcesarVideo(bytes.Join([][]byte{ftyp("mp42"), moov, mdat}, nil), maxDuracionTest); err != nil {
			t.Errorf("ProcesarVideo() = %v, want nil", err)
		}
	})
	t.Run("mdat con tamaño cero hasta el final", func(t *testing.T) {
		mdat := append([]byte{0, 0, 0, 0, 'm', 'd', 'a', 't'}, cuerpo...)
		if _, err := ProcesarVideo(bytes.Join([][]byte{ftyp("mp42"), moov, mdat}, nil), maxDuracionTest); err != nil {
			t.Errorf("ProcesarVideo() = %v, want nil", err)
		}
	})
	t.Run("moov al principio y mdat después", func(t *testing.T) {
		if _, err := ProcesarVideo(bytes.Join([][]byte{ftyp("mp42"), moov, armarCaja("mdat", cuerpo)}, nil), maxDuracionTest); err != nil {
			t.Errorf("ProcesarVideo() = %v, want nil", err)
		}
	})
}

// Ningún archivo cortado en cualquier punto debe tronar ni pasar como válido.
func TestProcesarVideo_TruncadoNuncaTronaNiPasa(t *testing.T) {
	completo := mp4Valido()
	for n := 0; n < len(completo); n++ {
		if _, err := ProcesarVideo(completo[:n], maxDuracionTest); err == nil {
			t.Fatalf("ProcesarVideo(primeros %d de %d bytes) = nil, want error", n, len(completo))
		}
	}
}

func FuzzProcesarVideo(f *testing.F) {
	f.Add(mp4Valido())
	f.Add([]byte{})
	f.Fuzz(func(t *testing.T, datos []byte) {
		salida, err := ProcesarVideo(datos, maxDuracionTest)
		if err == nil && len(salida) != len(datos) {
			t.Fatalf("salida de %d bytes para una entrada de %d", len(salida), len(datos))
		}
	})
}
