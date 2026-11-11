import { PlateArt } from "./PlateArt";

const places = [
  { art: "bread", x: -30, y: 56, size: 190 },
  { art: "meat", x: 190, y: 34, size: 230 },
  { art: "salad", x: 450, y: 92, size: 180 },
  { art: "soup", x: 660, y: 26, size: 270 },
  { art: "fish", x: 960, y: 80, size: 200 },
  { art: "salad", x: 1190, y: 46, size: 190 },
  { art: "soup", x: 1400, y: 76, size: 210 },
];

const glasses = [
  { x: 150, y: 74 },
  { x: 432, y: 62 },
  { x: 942, y: 62 },
  { x: 1170, y: 240 },
  { x: 1382, y: 62 },
];

/** A long table seen from above, running off both edges of the screen. It gets laid once on load. */
export function TableScene() {
  return (
    <svg
      viewBox="0 0 1600 340"
      preserveAspectRatio="xMidYMid slice"
      className="block h-[200px] w-full sm:h-[280px] lg:h-[340px]"
      aria-hidden="true"
    >
      <path d="M0 14C400 4 1200 22 1600 10V340H0Z" fill="#e8efec" />
      <path d="M0 14C400 4 1200 22 1600 10" fill="none" stroke="#2a1a33" strokeOpacity=".14" strokeWidth="3" transform="translate(0 16)" />
      {glasses.map((glass, index) => (
        <g key={glass.x} className="lay-plate" style={{ animationDelay: `${650 + index * 70}ms` }}>
          <circle cx={glass.x} cy={glass.y} r="20" fill="#efbd3f" opacity=".9" />
          <circle cx={glass.x} cy={glass.y} r="13" fill="#c42e17" />
        </g>
      ))}
      {places.map((place, index) => (
        <g key={place.art} className="lay-plate" style={{ animationDelay: `${index * 90}ms` }}>
          <PlateArt art={place.art} x={place.x} y={place.y} width={place.size} height={place.size} />
        </g>
      ))}
    </svg>
  );
}
