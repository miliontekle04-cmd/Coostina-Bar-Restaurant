import type { SVGProps } from "react";

export const plateArts = ["pizza", "pasta", "salad", "fish", "meat", "soup", "dessert", "bread", "antipasti", "risotto", "cocktail", "wine"] as const;
export type PlateArtName = (typeof plateArts)[number];

const tomato = "#c42e17";
const oil = "#c9a35b";
const crust = "#d99a2e";
const basil = "#24634b";
const leaf = "#5c9a63";
const lagoon = "#1c1814";
const ink = "#231a15";
const paper = "#fbfdfc";
const cream = "#f4e6c4";
const blush = "#e88a73";

function Leaf({ x, y, r = 0, s = 1, fill = basil }: { x: number; y: number; r?: number; s?: number; fill?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}
      d="M0-14C9-9 11 4 0 14-11 4-9-9 0-14Z"
      fill={fill}
    />
  );
}

const foods: Record<PlateArtName, React.ReactNode> = {
  pizza: (
    <>
      <path d="M100 30c40-2 72 30 70 71-2 39-32 70-71 69-39-1-70-33-69-71 1-37 31-68 70-69Z" fill={crust} />
      <path d="M100 42c33-1 59 25 58 58-1 32-27 58-59 57-32-1-57-27-56-58 1-31 25-56 57-57Z" fill={tomato} />
      <path d="M72 66c9-5 20 0 21 10s-9 17-19 14-12-19-2-24ZM122 62c10-3 20 5 18 15s-14 13-22 7-6-19 4-22ZM116 112c11-5 25 2 24 14s-16 18-26 12-9-21 2-26ZM66 116c9-5 21 1 21 12s-13 16-22 11-9-18 1-23Z" fill={paper} />
      <Leaf x={100} y={99} r={35} s={0.9} />
      <Leaf x={92} y={134} r={-50} s={0.7} />
      <Leaf x={142} y={100} r={80} s={0.7} />
      <Leaf x={60} y={101} r={15} s={0.7} />
    </>
  ),
  pasta: (
    <>
      <g fill="none" stroke={oil} strokeWidth="8" strokeLinecap="round">
        <path d="M60 104c-4-30 26-52 54-44s42 40 28 62-46 30-66 12-16-48 6-58 44 4 46 26-20 36-36 26-12-30 4-32" />
        <path d="M48 96c8-34 44-58 78-44" stroke={crust} />
        <path d="M152 106c-2 30-30 54-60 50" stroke={crust} />
      </g>
      <circle cx="104" cy="102" r="11" fill={tomato} />
      <circle cx="136" cy="74" r="8" fill={tomato} />
      <circle cx="70" cy="136" r="8" fill={tomato} />
      <Leaf x={92} y={84} r={-40} s={0.75} />
      <Leaf x={118} y={124} r={60} s={0.7} />
    </>
  ),
  salad: (
    <>
      <Leaf x={72} y={72} r={-40} s={2.3} fill={leaf} />
      <Leaf x={126} y={68} r={35} s={2.4} />
      <Leaf x={140} y={120} r={110} s={2.2} fill={leaf} />
      <Leaf x={92} y={138} r={200} s={2.4} />
      <Leaf x={62} y={112} r={-85} s={1.9} fill={basil} />
      <path d="M84 92a18 18 0 0 1 34 12Z" fill={tomato} />
      <circle cx="122" cy="112" r="13" fill={oil} />
      <circle cx="122" cy="112" r="6" fill={crust} />
      <path d="M76 116a14 14 0 0 0 26 8Z" fill={tomato} />
    </>
  ),
  fish: (
    <>
      <path d="M38 118c26-36 72-48 106-22l26-20c-4 18-3 38 3 56l-29-16c-32 26-80 28-106 2Z" fill={lagoon} transform="rotate(-8 100 100)" />
      <circle cx="62" cy="118" r="5" fill={paper} />
      <circle cx="62" cy="118" r="2.2" fill={ink} />
      <g stroke={paper} strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M86 92c6 10 6 26 0 38" />
        <path d="M104 88c6 12 6 26 0 38" />
        <path d="M122 88c4 10 4 22 0 32" />
      </g>
      <path d="M118 140a24 24 0 0 1 42-12Z" fill={oil} />
      <Leaf x={70} y={70} r={-30} s={1} fill={leaf} />
      <Leaf x={90} y={60} r={25} s={0.8} />
    </>
  ),
  meat: (
    <>
      <path d="M58 78c24-22 70-20 88 4s4 56-26 66-66 0-74-26c-4-16 2-34 12-44Z" fill={ink} />
      <path d="M72 92c16-12 44-12 58 2s6 34-14 42-46 2-52-14c-2-12 0-22 8-30Z" fill={tomato} />
      <g stroke={ink} strokeWidth="4" strokeLinecap="round">
        <path d="M82 92l34 40" />
        <path d="M100 86l30 34" />
        <path d="M72 106l26 32" />
      </g>
      <circle cx="152" cy="138" r="13" fill={oil} />
      <circle cx="134" cy="154" r="11" fill={crust} />
      <Leaf x={152} y={62} r={40} s={1.1} />
    </>
  ),
  soup: (
    <>
      <circle cx="100" cy="100" r="66" fill={ink} />
      <circle cx="100" cy="100" r="58" fill={tomato} />
      <path d="M62 100c10-24 44-32 64-14s10 44-12 44-30-26-10-32" fill="none" stroke={paper} strokeWidth="6" strokeLinecap="round" />
      <Leaf x={134} y={72} r={20} s={0.75} />
      <Leaf x={72} y={134} r={-20} s={0.7} />
      <circle cx="140" cy="120" r="5" fill={oil} />
      <circle cx="66" cy="74" r="5" fill={oil} />
    </>
  ),
  dessert: (
    <>
      <path d="M50 118 138 56c14 6 22 22 20 38l-90 56c-12-4-18-18-18-32Z" fill={ink} />
      <path d="M50 118 138 56c5 2 10 6 13 10l-92 64c-5-3-8-7-9-12Z" fill={cream} />
      <circle cx="146" cy="130" r="11" fill={tomato} />
      <circle cx="126" cy="146" r="8" fill={oil} />
      <circle cx="158" cy="150" r="6" fill={tomato} />
      <Leaf x={88} y={70} r={-30} s={0.85} fill={leaf} />
    </>
  ),
  bread: (
    <>
      <path d="M46 92c0-26 30-40 56-38s54 16 54 44-20 50-54 50-56-26-56-56Z" fill={crust} />
      <path d="M58 94c2-20 26-30 46-28s42 12 40 34-18 36-42 36-46-20-44-42Z" fill={oil} />
      <g fill={crust}>
        <circle cx="78" cy="88" r="5" />
        <circle cx="104" cy="82" r="5" />
        <circle cx="128" cy="96" r="5" />
        <circle cx="88" cy="114" r="5" />
        <circle cx="116" cy="118" r="5" />
      </g>
      <g stroke={basil} strokeWidth="3.5" strokeLinecap="round">
        <path d="M70 100l8 10M92 96l10 8M114 100l6 10M100 128l8-8" />
      </g>
    </>
  ),
  antipasti: (
    <>
      <path d="M42 112c4-14 24-22 38-14s28 2 30 14-14 24-32 24-40-10-36-24Z" fill={blush} />
      <path d="M52 112c8-6 18-6 26 0s18 4 22 4" fill="none" stroke={paper} strokeWidth="4" strokeLinecap="round" />
      <path d="M124 52c18-4 36 10 34 28s-22 28-38 20-16-44 4-48Z" fill={paper} stroke={ink} strokeWidth="2.5" />
      <circle cx="134" cy="136" r="16" fill={tomato} />
      <circle cx="134" cy="136" r="8" fill={blush} />
      <circle cx="102" cy="150" r="11" fill={tomato} />
      <circle cx="72" cy="70" r="11" fill={ink} />
      <circle cx="94" cy="60" r="8" fill={basil} />
      <Leaf x={104} y={90} r={60} s={0.9} />
      <Leaf x={150} y={108} r={-20} s={0.75} fill={leaf} />
    </>
  ),
  risotto: (
    <>
      <path d="M100 38c36-1 64 26 63 62s-29 62-64 61-62-29-61-63 26-59 62-60Z" fill={oil} />
      <g fill={paper}>
        {[
          [70, 74, 20], [92, 62, -30], [120, 70, 50], [142, 92, 10], [58, 100, -40], [84, 92, 30], [112, 96, -15],
          [136, 118, 40], [66, 126, 15], [92, 120, -35], [118, 132, 25], [96, 146, 0],
        ].map(([x, y, r]) => (
          <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="7" ry="3.2" transform={`rotate(${r} ${x} ${y})`} />
        ))}
      </g>
      <path d="M72 96c0-12 24-14 28-2l-8 2 2 14h-10l-2-14Z" fill={ink} />
      <path d="M112 118c0-12 24-14 28-2l-8 2 2 14h-10l-2-14Z" fill={ink} />
      <Leaf x={124} y={82} r={40} s={0.8} />
    </>
  ),
  cocktail: (
    <>
      <circle cx="100" cy="100" r="54" fill={tomato} opacity=".9" />
      <circle cx="100" cy="100" r="54" fill="none" stroke={ink} strokeOpacity=".25" strokeWidth="5" />
      <path d="M78 118a32 32 0 0 1 40-46" fill="none" stroke={paper} strokeOpacity=".55" strokeWidth="5" strokeLinecap="round" />
      <circle cx="122" cy="84" r="20" fill={blush} />
      <circle cx="122" cy="84" r="15" fill={oil} />
      <path d="M122 69v30M107 84h30M111 73l22 22M133 73l-22 22" stroke={blush} strokeWidth="2" />
      <path d="M70 136 140 62" stroke={ink} strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  wine: (
    <>
      <circle cx="100" cy="100" r="50" fill="#5a1620" />
      <circle cx="100" cy="100" r="50" fill="none" stroke={ink} strokeOpacity=".25" strokeWidth="5" />
      <path d="M74 112a30 30 0 0 1 30-40" fill="none" stroke={paper} strokeOpacity=".4" strokeWidth="5" strokeLinecap="round" />
      <g fill={leaf}>
        <circle cx="146" cy="142" r="8" />
        <circle cx="160" cy="132" r="8" />
        <circle cx="152" cy="156" r="8" />
        <circle cx="166" cy="148" r="7" />
      </g>
      <Leaf x={150} y={118} r={50} s={0.8} />
    </>
  ),
};

export function isPlateArt(value: string): value is PlateArtName {
  return (plateArts as readonly string[]).includes(value);
}

/** An original cut-paper dish. Replace with photography by swapping this component where it's used. */
export function PlateArt({ art, ...props }: { art: string } & SVGProps<SVGSVGElement>) {
  const food = isPlateArt(art) ? foods[art] : foods.antipasti;
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" {...props}>
      <path d="M100 4c54-1 97 42 96 97-1 53-44 96-97 95S3 152 4 99C5 47 47 5 100 4Z" fill={paper} />
      <circle cx="100" cy="100" r="82" fill="none" stroke={ink} strokeOpacity="0.12" strokeWidth="2" />
      {food}
    </svg>
  );
}
