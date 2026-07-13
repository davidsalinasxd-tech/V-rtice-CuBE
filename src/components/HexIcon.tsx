export function HexIcon({ className = "h-13 w-13" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className}>
      <polygon
        points="50,6 90,28 90,72 50,94 10,72 10,28"
        fill="none"
        stroke="var(--color-navy-2)"
        strokeWidth="4"
      />
      <path
        d="M28 38 L50 66 L76 18"
        fill="none"
        stroke="var(--color-orange)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
