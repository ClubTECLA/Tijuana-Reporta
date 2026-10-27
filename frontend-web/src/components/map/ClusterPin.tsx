interface ClusterSegment {
    /** Id de la categoría: clave estable del arco aunque dos categorías compartan color. */
    id: number
    color: string
    value: number
}

interface ClusterPinProps {
    count: number
    segments: ClusterSegment[]
}

const SIZE = 72;
const CENTER = SIZE / 2;
const RING_RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// "Web/Agrupación" del Figma: anillo dividido por el color de cada categoría y el total en el centro.
// Se pinta dentro del <button> del marcador (IncidentsLayer), que es el que recibe el clic y el foco.
export default function ClusterPin({ count, segments }: ClusterPinProps) {
    // Se reparte entre la suma de los segmentos y no entre count: si llega un reporte de una categoría que
    // el mapa aún no conoce, su segmento falta y el anillo quedaría incompleto.
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);
    // Cada arco empieza donde termina el anterior.
    const arcs = segments.reduce<{ id: number; color: string; length: number; offset: number }[]>((list, segment) => {
        const previous = list.at(-1);
        const offset = previous ? previous.offset + previous.length : 0;
        return [...list, { id: segment.id, color: segment.color, length: (segment.value / total) * CIRCUMFERENCE, offset }];
    }, []);

    return (
        <span title="Haz clic para acercar" className="block size-18 drop-shadow-pin transition-transform hover:scale-105">
            <span className="sr-only">{count} incidentes agrupados. Acercar el mapa</span>
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full" aria-hidden>
                <circle cx={CENTER} cy={CENTER} r={CENTER - 1} fill="white" />
                <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
                    {arcs.map((arc) =>
                        <circle
                            key={arc.id}
                            cx={CENTER}
                            cy={CENTER}
                            r={RING_RADIUS}
                            fill="none"
                            stroke={arc.color}
                            strokeWidth={9}
                            strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
                            strokeDashoffset={-arc.offset}
                        />
                    )}
                </g>
                <text
                    x={CENTER}
                    y={CENTER}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-ink font-['Inter',sans-serif] text-[18px] font-bold"
                >
                    {count}
                </text>
            </svg>
        </span>
    );
}
