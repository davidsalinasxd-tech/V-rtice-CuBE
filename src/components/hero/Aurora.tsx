/**
 * Manchas de luz navy y naranja que se desplazan muy despacio detrás del hero,
 * más un hexágono de líneas finas. Decorativo; solo anima transform (clases en globals.css).
 * El difuminado ya está en el degradado radial: no hay filter blur animado.
 */
export function Aurora() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="aurora-a absolute -top-[20%] -left-[10%] h-[90%] w-[80%] bg-[radial-gradient(closest-side,rgba(0,70,140,.55),rgba(0,47,89,0)_100%)]" />
      <div className="aurora-b absolute top-[10%] -right-[15%] h-[80%] w-[70%] bg-[radial-gradient(closest-side,rgba(254,102,1,.16),rgba(254,102,1,0)_100%)]" />
      <svg
        viewBox="0 0 100 104"
        className="hex-float absolute top-[2%] -right-[30%] w-75 opacity-[.07] md:top-[8%] md:right-[4%] md:w-130"
      >
        <g fill="none" stroke="#fff" strokeWidth=".35">
          <polygon points="50,2 93,27 93,77 50,102 7,77 7,27" />
          <path d="M50 52V102M50 52L7 27M50 52L93 27" />
        </g>
      </svg>
    </div>
  );
}
