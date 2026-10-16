interface ClusterSegment {
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
export default function ClusterPin({ count, segments }: ClusterPinProps) {
    // Cada arco empieza donde termina el anterior.
    const arcs = segments.reduce<{ color: string; length: number; offset: number }[]>((list, segment) => {
        const previous = list.at(-1);
        const offset = previous ? previous.offset + previous.length : 0;
        return [...list, { color: segment.color, length: (segment.value / count) * CIRCUMFERENCE, offset }];
    }, []);

    return (
        <div
            role="img"
            aria-label={`${count} incidentes agrupados`}
            title="Acerca el mapa para ver los incidentes"
            className="size-18 cursor-pointer drop-shadow-[0_4px_10px_rgba(11,18,32,0.25)] transition-transform hover:scale-105"
        >
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full">
                <circle cx={CENTER} cy={CENTER} r={CENTER - 1} fill="white" />
                <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
                    {arcs.map((arc, index) =>
                        <circle
                            key={index}
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
                    className="fill-[#111827] font-['Inter',sans-serif] text-[18px] font-bold"
                >
                    {count}
                </text>
            </svg>
        </div>
    );
}
