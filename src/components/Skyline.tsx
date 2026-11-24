/** Minimal illustrated Melbourne skyline (Arts Centre spire, Eureka Tower, Flinders St dome, Yarra River). */
export function MelbourneSkyline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 420" className={className} role="img" aria-label="Ilustração do skyline de Melbourne" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EDEAE3" />
          <stop offset="1" stopColor="#F6F4EF" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9DDDF" />
          <stop offset="1" stopColor="#EEF0F0" />
        </linearGradient>
      </defs>
      <rect width="1200" height="420" fill="url(#sky)" />
      <circle cx="960" cy="110" r="38" fill="#F3E3B9" opacity="0.8" />
      {/* far towers */}
      <g fill="#D6D2CA">
        <rect x="60" y="210" width="50" height="140" />
        <rect x="120" y="180" width="40" height="170" />
        <rect x="170" y="230" width="60" height="120" />
        <rect x="560" y="150" width="46" height="200" />
        <rect x="615" y="190" width="40" height="160" />
        <rect x="820" y="170" width="50" height="180" />
        <rect x="880" y="215" width="70" height="135" />
        <rect x="1040" y="200" width="44" height="150" />
        <rect x="1095" y="235" width="60" height="115" />
      </g>
      {/* mid towers */}
      <g fill="#B9B4AA">
        <rect x="250" y="160" width="58" height="190" />
        <rect x="318" y="200" width="44" height="150" />
        {/* Rialto-like twin */}
        <path d="M670 120 h46 v230 h-46z" />
        <path d="M722 150 h34 v200 h-34z" />
        <rect x="960" y="180" width="54" height="170" />
      </g>
      {/* Eureka Tower */}
      <g>
        <rect x="430" y="60" width="62" height="290" fill="#8F897E" />
        <rect x="430" y="60" width="62" height="34" fill="#C9A24B" />
        <rect x="455" y="40" width="12" height="22" fill="#8F897E" />
        <g stroke="#A59F94" strokeWidth="1">
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={i} x1="430" x2="492" y1={110 + i * 17} y2={110 + i * 17} />
          ))}
        </g>
      </g>
      {/* Australia 108 */}
      <path d="M505 70 q20 -14 40 0 v280 h-40z" fill="#A39D91" />
      {/* Arts Centre spire */}
      <g stroke="#6F6A61" strokeWidth="2" fill="none">
        <path d="M790 350 L800 120 L810 350" />
        <path d="M778 350 L800 200 L822 350" />
        <path d="M784 300 h32 M788 260 h24 M792 220 h16 M795 180 h10" />
        <line x1="800" y1="120" x2="800" y2="70" />
      </g>
      {/* Flinders Street Station */}
      <g fill="#C8B79A">
        <rect x="140" y="300" width="300" height="50" />
        <rect x="250" y="270" width="80" height="34" />
        <path d="M252 272 q38 -48 76 0z" fill="#9FA8A0" />
        <rect x="380" y="262" width="18" height="40" />
        <circle cx="389" cy="276" r="6" fill="#F6F4EF" />
      </g>
      <g fill="#F6F4EF">
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x={152 + i * 24} y="318" width="10" height="16" rx="5" />
        ))}
      </g>
      {/* ground + river */}
      <rect y="350" width="1200" height="70" fill="url(#water)" />
      <g stroke="#C5CACC" strokeWidth="2" strokeLinecap="round">
        <line x1="90" y1="372" x2="190" y2="372" />
        <line x1="420" y1="386" x2="560" y2="386" />
        <line x1="700" y1="374" x2="790" y2="374" />
        <line x1="980" y1="392" x2="1110" y2="392" />
      </g>
      {/* tram */}
      <g>
        <rect x="600" y="332" width="120" height="18" rx="4" fill="#3F7D58" />
        <rect x="608" y="336" width="104" height="6" fill="#EAF3EC" />
        <line x1="660" y1="332" x2="672" y2="318" stroke="#6F6A61" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
