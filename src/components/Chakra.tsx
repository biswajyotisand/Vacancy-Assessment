interface ChakraProps {
  className?: string;
}

/** 24-spoke Ashoka Chakra rendered as an inline SVG. */
export function Chakra({ className }: ChakraProps) {
  const spokes = Array.from({ length: 24 }, (_, i) => (i * 360) / 24);
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
      />
      <circle cx="50" cy="50" r="7" fill="currentColor" />
      {spokes.map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          <line
            key={a}
            x1="50"
            y1="50"
            x2={50 + 43 * Math.cos(rad)}
            y2={50 + 43 * Math.sin(rad)}
            stroke="currentColor"
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}
