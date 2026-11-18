import type { CSSProperties } from "react";

const ANG = [0, 72, 144, 216, 288];

/** Small five-petal pressed flower (logo, stamps, card corners). */
export function Petal({ size = 26, fill = "var(--petal)", center = "var(--gold)", className, style }: { size?: number; fill?: string; center?: string | null; className?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true" className={className} style={style} focusable="false">
      <g style={{ fill }}>
        {ANG.map((a) => (
          <ellipse key={a} cx="13" cy="6" rx="4" ry="6" transform={`rotate(${a} 13 13)`} />
        ))}
      </g>
      {center && <circle cx="13" cy="13" r="3" style={{ fill: center }} />}
    </svg>
  );
}

/** The hero bouquet: rose, lilac bloom and lavender sprig, with stems that draw and petals that bloom. */
export function HeroFlowers() {
  const rose = (cx: number, cy: number, rx: number, ry: number, fill: string, ox: number, oy: number) =>
    ANG.map((a) => <ellipse key={a + fill} cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(${a} ${ox} ${oy})`} />);
  const bloom = (delay: number): CSSProperties => ({ transformBox: "fill-box", transformOrigin: "center", animation: `bloom 1s ease-out ${delay}ms both` });
  const stem = (delay: number): CSSProperties => ({ stroke: "var(--stem)", strokeDasharray: 400, animation: `grow 1.2s ease-out ${delay}ms both` });
  return (
    <svg viewBox="0 0 420 480" className="h-auto w-full max-w-[300px] sm:max-w-[420px]" aria-hidden="true" focusable="false">
      <circle cx="230" cy="250" r="190" style={{ fill: "var(--halo)" }} />
      <g style={{ transformOrigin: "210px 470px", animation: "sway 7s ease-in-out infinite" }}>
        <path d="M210 470 C200 380 232 300 205 170" strokeWidth="2.5" fill="none" style={stem(0)} />
        <ellipse cx="190" cy="360" rx="22" ry="9" transform="rotate(-35 190 360)" style={{ fill: "var(--sage)" }} />
        <ellipse cx="226" cy="300" rx="22" ry="9" transform="rotate(30 226 300)" style={{ fill: "var(--sage2)" }} />
        <ellipse cx="208" cy="230" rx="18" ry="8" transform="rotate(-25 208 230)" style={{ fill: "var(--sage)" }} />
        <g style={bloom(900)}>
          <g style={{ fill: "var(--petal)" }}>{rose(205, 120, 17, 29, "a", 205, 150)}</g>
          <g style={{ fill: "var(--petal2)" }}>{rose(205, 132, 6, 13, "b", 205, 150)}</g>
          <circle cx="205" cy="150" r="10" style={{ fill: "var(--gold)" }} />
        </g>
      </g>
      <g style={{ transformOrigin: "210px 470px", animation: "sway2 8s ease-in-out infinite" }}>
        <path d="M210 470 C252 400 300 330 316 252" strokeWidth="2" fill="none" style={stem(150)} />
        <ellipse cx="262" cy="390" rx="18" ry="7" transform="rotate(-40 262 390)" style={{ fill: "var(--sage)" }} />
        <ellipse cx="300" cy="318" rx="16" ry="7" transform="rotate(35 300 318)" style={{ fill: "var(--sage2)" }} />
        <g style={bloom(1100)}>
          <g style={{ fill: "var(--lilac)" }}>{rose(318, 216, 11, 20, "c", 318, 236)}</g>
          <circle cx="318" cy="236" r="7" style={{ fill: "var(--butter)" }} />
        </g>
      </g>
      <g style={{ transformOrigin: "210px 470px", animation: "sway 9s ease-in-out infinite" }}>
        <path d="M210 470 C170 410 122 360 106 282" strokeWidth="2" fill="none" style={stem(300)} />
        <ellipse cx="150" cy="400" rx="18" ry="7" transform="rotate(40 150 400)" style={{ fill: "var(--sage)" }} />
        <ellipse cx="118" cy="340" rx="16" ry="7" transform="rotate(-30 118 340)" style={{ fill: "var(--sage2)" }} />
        <g style={bloom(1300)}>
          <g style={{ fill: "var(--lav)" }}>
            <ellipse cx="106" cy="270" rx="6" ry="9" /><ellipse cx="100" cy="254" rx="6" ry="9" /><ellipse cx="112" cy="252" rx="6" ry="9" />
            <ellipse cx="104" cy="238" rx="5" ry="8" /><ellipse cx="108" cy="224" rx="4" ry="7" />
          </g>
        </g>
      </g>
      <g style={{ fill: "var(--sky)" }}><circle cx="150" cy="320" r="6" /><circle cx="162" cy="312" r="5" /><circle cx="158" cy="328" r="5" /></g>
      <path d="M150 440 L270 440" strokeWidth="2" strokeLinecap="round" style={{ stroke: "var(--plank)" }} />
    </svg>
  );
}

/** Lavender sprig that sways. */
export function LavenderSprig({ width = 70, height = 150, className, style }: { width?: number; height?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg width={width} height={height} viewBox="0 0 70 150" aria-hidden="true" focusable="false" className={className} style={{ transformOrigin: "35px 150px", animation: "sway 7s ease-in-out infinite", ...style }}>
      <path d="M35 150 C33 110 40 80 35 40" strokeWidth="2" fill="none" style={{ stroke: "var(--stem)" }} />
      <ellipse cx="28" cy="100" rx="12" ry="5" transform="rotate(-30 28 100)" style={{ fill: "var(--sage)" }} />
      <g style={{ fill: "var(--lav)" }}>
        <ellipse cx="35" cy="34" rx="5" ry="8" /><ellipse cx="30" cy="22" rx="5" ry="8" /><ellipse cx="40" cy="20" rx="5" ry="8" /><ellipse cx="35" cy="8" rx="4" ry="7" />
      </g>
    </svg>
  );
}

export function FooterSprig() {
  return (
    <svg width="160" height="60" viewBox="0 0 160 60" aria-hidden="true" focusable="false" style={{ transformOrigin: "80px 50px", animation: "sway 8s ease-in-out infinite" }}>
      <path d="M10 50 C50 46 110 46 150 50" strokeWidth="2" fill="none" style={{ stroke: "var(--stem)" }} />
      <ellipse cx="50" cy="40" rx="12" ry="5" transform="rotate(-20 50 40)" style={{ fill: "var(--sage)" }} />
      <ellipse cx="110" cy="40" rx="12" ry="5" transform="rotate(20 110 40)" style={{ fill: "var(--sage)" }} />
      <g style={{ fill: "var(--petal)" }}>
        {ANG.map((a) => <ellipse key={a} cx="80" cy="16" rx="7" ry="12" transform={`rotate(${a} 80 28)`} />)}
      </g>
      <circle cx="80" cy="28" r="4" style={{ fill: "var(--gold)" }} />
    </svg>
  );
}

export function AsideFlower({ color = "var(--petal2)" }: { color?: string }) {
  return (
    <svg width="140" height="220" viewBox="0 0 140 220" aria-hidden="true" focusable="false" style={{ transformOrigin: "70px 220px", animation: "sway 8s ease-in-out infinite" }}>
      <path d="M70 220 C64 160 78 110 70 60" strokeWidth="2" fill="none" style={{ stroke: "var(--stem)" }} />
      <ellipse cx="56" cy="150" rx="20" ry="8" transform="rotate(-35 56 150)" style={{ fill: "var(--sage)" }} />
      <ellipse cx="84" cy="112" rx="18" ry="7" transform="rotate(30 84 112)" style={{ fill: "var(--sage)" }} />
      <g style={{ fill: color }}>
        {ANG.map((a) => <ellipse key={a} cx="70" cy="22" rx="14" ry="24" transform={`rotate(${a} 70 46)`} />)}
      </g>
      <circle cx="70" cy="46" r="8" style={{ fill: "var(--gold)" }} />
    </svg>
  );
}
