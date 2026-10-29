import { useEffect, useRef, useState } from "react";
import { Marker, type MapMouseEvent } from "maplibre-gl";
import { useMap } from "./useMap";
import { buscarDireccion, direccionDe } from "../services/geocoding.services";

export type Position = { latitude: number; longitude: number };

/** "found": se movió el marcador; "not-found": Nominatim no dio resultados; "ignored": vacía, cancelada o ya sin marcador. */
export type SearchResult = "found" | "not-found" | "ignored";

// Cancela la búsqueda de dirección anterior y devuelve la señal de la nueva.
function restartLookup(ref: { current: AbortController | null }) {
    ref.current?.abort();
    ref.current = new AbortController();
    return ref.current.signal;
}

/**
 * Selector de ubicación sobre el mapa ("Nuevo incidente"): un marcador arrastrable que también se mueve con un clic en
 * el mapa o buscando una dirección, y la dirección aproximada del punto. Marcador, posición y dirección cambian siempre
 * juntos aquí, y el marcador se quita al desmontar. Quien lo usa solo pinta el contenido del marcador, con un portal
 * sobre `markerElement`.
 */
export function useLocationPicker() {
    const { map } = useMap();

    const [position, setPosition] = useState<Position | null>(() => {
        const center = map?.getCenter();
        return center ? { latitude: center.lat, longitude: center.lng } : null;
    });
    const [address, setAddress] = useState("");

    // El marcador es un elemento propio de MapLibre; su contenido se pinta con React mediante un portal.
    const [markerElement] = useState(() => document.createElement("div"));
    const markerRef = useRef<Marker | null>(null);
    // Una sola búsqueda de dirección viva (inicial, al mover el marcador, al buscar): cada una, lo que escribe el
    // usuario y desmontar cancelan la anterior. Así una respuesta tardía no pisa la ubicación ni el texto, y lo
    // cancelado sale de la cola de Nominatim en vez de retrasar la búsqueda actual.
    const lookupRef = useRef<AbortController | null>(null);

    // Marcador arrastrable: se mueve arrastrándolo o haciendo clic en el mapa.
    useEffect(() => {
        if (!map) return;

        const lookupAddress = (latitude: number, longitude: number) => {
            const signal = restartLookup(lookupRef);
            direccionDe(latitude, longitude, signal)
                .then((found) => { if (!signal.aborted) setAddress(found ?? "") })
                .catch(() => { if (!signal.aborted) setAddress("") });
        };
        const placeAt = (latitude: number, longitude: number) => {
            setPosition({ latitude, longitude });
            lookupAddress(latitude, longitude);
        };

        const center = map.getCenter();
        const marker = new Marker({ element: markerElement, draggable: true, anchor: "center" })
            .setLngLat(center)
            .addTo(map);
        markerRef.current = marker;
        lookupAddress(center.lat, center.lng);

        const handleDragEnd = () => {
            const { lat, lng } = marker.getLngLat();
            placeAt(lat, lng);
        };
        const handleMapClick = (e: MapMouseEvent) => {
            marker.setLngLat(e.lngLat);
            placeAt(e.lngLat.lat, e.lngLat.lng);
        };

        marker.on("dragend", handleDragEnd);
        map.on("click", handleMapClick);
        map.getCanvas().style.cursor = "crosshair";

        return () => {
            map.off("click", handleMapClick);
            map.getCanvas().style.cursor = "";
            marker.remove();
            markerRef.current = null;
            // Se quiere la búsqueda viva al desmontar (puede ser de search), no la de cuando montó el efecto.
            // eslint-disable-next-line react-hooks/exhaustive-deps
            lookupRef.current?.abort();
        };
    }, [map, markerElement]);

    /** Busca una dirección escrita y, si la encuentra, lleva allí el marcador y el mapa. Lanza si falla la búsqueda. */
    const search = async (query: string): Promise<SearchResult> => {
        if (!query.trim()) return "ignored";

        // Cancelada si alguien movió el marcador, volvió a escribir o se desmontó: así no mueve el mapa ni avisa tarde.
        // Sin marcador (mapa aún sin cargar) tampoco se aplica: la posición publicada debe ser la del marcador.
        const signal = restartLookup(lookupRef);
        const isCurrent = () => !signal.aborted && markerRef.current !== null;
        try {
            const found = await buscarDireccion(query, signal);
            if (!isCurrent()) return "ignored";
            if (!found) return "not-found";
            markerRef.current?.setLngLat([found.longitude, found.latitude]);
            map?.flyTo({ center: [found.longitude, found.latitude], zoom: 16 });
            setPosition({ latitude: found.latitude, longitude: found.longitude });
            setAddress(found.address);
            return "found";
        } catch (error) {
            if (!isCurrent()) return "ignored";
            throw error;
        }
    };

    // Escribir en el buscador cancela la búsqueda pendiente: lo escrito no se sustituye por una respuesta vieja.
    const editAddress = (text: string) => {
        lookupRef.current?.abort();
        setAddress(text);
    };

    return { markerElement, position, address, editAddress, search };
}
