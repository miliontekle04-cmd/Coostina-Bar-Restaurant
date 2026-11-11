import { brand } from "@/config/brand";

export const seatColours = ["#8e2b22", "#4f5d2f", "#1c1814", "#c9a35b"];

export function seatColour(index: number): string {
  return seatColours[index % seatColours.length]!;
}

type Group = { guests: number; colour: string };

const SEAT = 30;
const SIDE_ROW = 26;
const TABLE_HEIGHT = 44;
const TABLE_GAP = 34;
const WIDTH = 12 * SEAT + 24;

/**
 * Long tables seen from above, with a seat for every guest.
 * Seats take the colour of their menu. Guests without a menu stay hollow.
 * Purely visual: whatever uses this also states the same numbers in text.
 */
export function BanquetPlan({
  guests,
  groups,
  onDark = false,
  className,
}: {
  guests: number;
  groups: Group[];
  onDark?: boolean;
  className?: string;
}) {
  const perTable = brand.events.seatsPerTable;
  const tableCount = Math.max(1, Math.ceil(guests / perTable));
  const unitHeight = SIDE_ROW * 2 + TABLE_HEIGHT + TABLE_GAP;
  const height = tableCount * unitHeight - TABLE_GAP;

  const colours: string[] = [];
  for (const group of groups) for (let i = 0; i < group.guests; i++) colours.push(group.colour);

  const hollow = onDark ? "#ffffff99" : "#231a1566";
  const cloth = onDark ? "#ffffff" : "#f7faf8";
  const clothEdge = onDark ? "transparent" : "#231a1540";

  let seatIndex = 0;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className={className} aria-hidden="true">
      {Array.from({ length: tableCount }, (_, table) => {
        const seated = Math.min(perTable, guests - table * perTable);
        const pairs = Math.ceil(seated / 2);
        const tableWidth = pairs * SEAT + 12;
        const x = (WIDTH - tableWidth) / 2;
        const y = table * unitHeight;
        const seats = [];
        for (let i = 0; i < seated; i++) {
          const top = i % 2 === 0;
          const column = Math.floor(i / 2);
          const colour = colours[seatIndex];
          seatIndex++;
          seats.push(
            <circle
              key={i}
              className="seat"
              cx={x + 6 + SEAT / 2 + column * SEAT}
              cy={top ? y + 11 : y + SIDE_ROW * 2 + TABLE_HEIGHT - 11}
              r="10"
              fill={colour ?? "transparent"}
              stroke={colour ?? hollow}
              strokeWidth="2.5"
            />,
          );
        }
        return (
          <g key={table}>
            {seats}
            <rect x={x} y={y + SIDE_ROW} width={tableWidth} height={TABLE_HEIGHT} rx="8" fill={cloth} stroke={clothEdge} strokeWidth="2" />
          </g>
        );
      })}
    </svg>
  );
}
