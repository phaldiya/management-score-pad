import { getAvatarDataUri } from '../../lib/avatars.ts';
import type { Player } from '../../types/index.ts';

interface SeatingChartProps {
  players: Player[];
}

export default function SeatingChart({ players }: SeatingChartProps) {
  const count = players.length;
  const size = 180;
  const center = size / 2;
  const radius = 65;
  const startAngle = -Math.PI / 2; // top

  return (
    <div className="mt-4 flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        role="img"
        aria-label="Seating arrangement showing clockwise player order"
      >
        <title>Seating arrangement showing clockwise player order</title>
        {/* Clockwise arrow circle */}
        <circle
          cx={center}
          cy={center}
          r={radius - 18}
          fill="none"
          stroke="#d1d5db"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        <path
          d={describeArc(center, center, radius - 18, -60, 220)}
          fill="none"
          stroke="#9ca3af"
          strokeWidth={1.5}
          markerEnd="url(#arrowhead)"
        />
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="#9ca3af" />
          </marker>
        </defs>

        {/* Clockwise label */}
        <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" className="fill-gray-600 text-xs">
          clockwise
        </text>

        {/* Player nodes */}
        {players.map((player, i) => {
          const angle = startAngle + (2 * Math.PI * i) / count;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          const isFirst = i === 0;
          return (
            <g key={player.id}>
              <defs>
                <clipPath id={`avatar-clip-${i}`}>
                  <circle cx={x} cy={y} r={14} />
                </clipPath>
              </defs>
              <image
                href={getAvatarDataUri(player.avatar)}
                x={x - 14}
                y={y - 14}
                width={28}
                height={28}
                clipPath={`url(#avatar-clip-${i})`}
                preserveAspectRatio="xMidYMid slice"
              />
              <text x={x} y={y + 22} textAnchor="middle" dominantBaseline="middle" className="fill-gray-700 text-xs">
                {player.name}
              </text>
              {isFirst && (
                <image
                  href={`${import.meta.env.BASE_URL}dealer.png`}
                  x={x + 8}
                  y={y - 20}
                  width={16}
                  height={16}
                  aria-label="Dealer"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}
