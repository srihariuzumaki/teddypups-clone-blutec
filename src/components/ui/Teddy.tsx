/** Teddy the mascot, static sitting pose (ported from the original inline SVG). */
export default function Teddy({
  label = "Teddy, the TeddyPups puppy",
  facing = "right",
  className = "",
}: {
  label?: string;
  facing?: "left" | "right";
  className?: string;
}) {
  return (
    <div className={`pup-buddy ${className}`.trim()} data-facing={facing} style={facing === "left" ? { transform: "scaleX(-1)" } : undefined}>
      <svg viewBox="0 0 300 240" style={{ overflow: "visible" }} role="img" aria-label={label} focusable="false">
        <g data-p="root">
          <ellipse data-p="shadow" cx="150" cy="230" rx="92" ry="7" fill="#2a170e" opacity="0" transform="translate(0 0) scale(1 1)" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          <g data-p="body" transform="translate(0 0) rotate(0 196 206) translate(196 0) scale(1 1) translate(-196 0)" opacity="0">
            <g data-p="bf" transform="translate(94 192) rotate(0)" opacity="1">
              <path d="M-14 -14 C-14 4 -12 18 -12 27 C-12 34 -7 36 0 36 C9 36 13 33 13 27 C13 18 14 4 14 -14Z" fill="#e4a352" />
              <path d="M-14 -14 C-14 4 -12 18 -12 27 C-12 34 -7 36 0 36 C9 36 13 33 13 27 C13 18 14 4 14 -14" stroke="#2a170e" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" fill="none" />
              <path d="M-3.5 29 v5 M4.5 29 v5" stroke="#2a170e" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" fill="none" />
            </g>
            <g data-p="ff" transform="translate(168 192) rotate(0)">
              <path d="M-11 -14 C-11 4 -12 18 -12 27 C-12 34 -7 36 0 36 C9 36 13 33 13 27 C13 18 11 4 11 -14Z" fill="#e4a352" />
              <path d="M-11 -14 C-11 4 -12 18 -12 27 C-12 34 -7 36 0 36 C9 36 13 33 13 27 C13 18 11 4 11 -14" stroke="#2a170e" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" fill="none" />
              <path d="M-3.5 29 v5 M4.5 29 v5" stroke="#2a170e" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" fill="none" />
            </g>
            <g data-p="tail" transform="rotate(-20 84 150)">
              <path d="M86 152 C80 146 76 140 74 136" stroke="#2a170e" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" fill="none" />
              <path d="M86 152 C80 146 76 140 74 136" stroke="#f2be6b" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M70.0 110.0Q78.1 105.0 80.9 113.7Q90.5 114.8 86.7 123.2Q93.4…[210]" fill="#f2be6b" stroke="#2a170e" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" />
            </g>
            <g data-p="bn" transform="translate(110 194) rotate(0)" opacity="1">
              <path d="M-15 -14 C-15 4 -12 16 -12 25 C-12 32 -7 34 0 34 C9 34 13 31 13 25 C13 16 15 4 15 -14Z" fill="#f2be6b" />
              <path d="M-15 -14 C-15 4 -12 16 -12 25 C-12 32 -7 34 0 34 C9 34 13 31 13 25 C13 16 15 4 15 -14" stroke="#2a170e" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" fill="none" />
              <path d="M-3.5 27 v5 M4.5 27 v5" stroke="#2a170e" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" fill="none" />
            </g>
            <path d="M76.8 175.6Q69.0 167.9 78.2 160.7Q76.6 151.8 90.3 147.3Q95.2…[363]" fill="#f2be6b" stroke="#2a170e" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" />
            <path d="M182.7 196.4Q169.4 196.9 166.6 183.0Q156.1 174.1 162.3 161.5…[229]" fill="#f2be6b" stroke="#2a170e" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" />
            <g data-p="fn" transform="translate(186 194) rotate(0)">
              <path d="M-12 -14 C-12 4 -12 16 -12 25 C-12 32 -7 34 0 34 C9 34 13 31 13 25 C13 16 12 4 12 -14Z" fill="#f2be6b" />
              <path d="M-12 -14 C-12 4 -12 16 -12 25 C-12 32 -7 34 0 34 C9 34 13 31 13 25 C13 16 12 4 12 -14" stroke="#2a170e" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" fill="none" />
              <path d="M-3.5 27 v5 M4.5 27 v5" stroke="#2a170e" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" fill="none" />
            </g>
          </g>
          <g data-p="haunch" opacity="0" transform="translate(0 0)">
            <path d="M80.0 204.0Q75.1 194.9 85.7 189.9Q88.4 180.2 100.7 181.2Q110…[245]" fill="#f2be6b" stroke="#2a170e" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" />
            <path d="M112 214 C126 212 142 214 146 221 C148 226 144 229 136 229 L116 229 C108 229 104 224 106 219 Z" fill="#f2be6b" stroke="#2a170e" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" />
            <path d="M132 222v5M139 222v5" stroke="#2a170e" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" fill="none" />
          </g>
          <g data-p="head" transform="translate(0 4) rotate(0 212 100)">
            <path d="M178 146 Q212 162 246 146 L246 154 Q212 170 178 154 Z" fill="#a24a1a" stroke="#2a170e" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            <path d="M212 160 C212 156 206 155 206 159.4 C206 163 212 166.6 212 168.4 C212 166.6 218 163 218 159.4 C218 155 212 156 212 160 Z" fill="#fbe3b4" stroke="#2a170e" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
            <path data-p="earL" d="M177.1 78.7Q186.9 70.8 186.6 87.4Q196.0 89.9 189.9 105.5Q195…[244]" fill="#e4a352" stroke="#2a170e" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" transform="rotate(-6 174 82)" />
            <path data-p="earR" d="M246.9 78.7Q252.7 67.5 259.2 82.8Q268.7 81.2 269.5 98.0Q279.…[244]" fill="#e4a352" stroke="#2a170e" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" transform="rotate(6 250 82)" />
            <path d="M212.0 54.0Q223.4 48.2 231.5 57.5Q244.5 56.1 248.1 67.5Q260.…[381]" fill="#f2be6b" stroke="#2a170e" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" />
            <path d="M195.0 52.0Q190.7 45.8 200.0 43.5Q203.2 36.9 212.0 40.0Q220.…[188]" fill="#f2be6b" stroke="#2a170e" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            <path d="M188 120 C188 106 200 100 212 100 C224 100 236 106 236 120 C236 133 225 140 212 140 C199 140 188 133 188 120 Z" fill="#fbe3b4" />
            <circle cx="181" cy="116" r="7" fill="#f9b9a6" opacity="0.85" />
            <circle cx="243" cy="116" r="7" fill="#f9b9a6" opacity="0.85" />
            <g data-p="eyes" transform="translate(0 0)">
              <g data-p="open" opacity="1">
                <g data-p="blink" transform="translate(0 0) scale(1 1)">
                  <ellipse cx="194" cy="98" rx="7.4" ry="8.6" fill="#2a170e" />
                  <ellipse cx="230" cy="98" rx="7.4" ry="8.6" fill="#2a170e" />
                  <circle cx="196.6" cy="94.6" r="2.7" fill="#fff" />
                  <circle cx="232.6" cy="94.6" r="2.7" fill="#fff" />
                  <circle cx="192" cy="101.2" r="1.2" fill="#fff" />
                  <circle cx="228" cy="101.2" r="1.2" fill="#fff" />
                </g>
              </g>
            </g>
            <path data-p="happy" d="M186.5 101 Q194 91.5 201.5 101 M222.5 101 Q230 91.5 237.5 101" stroke="#2a170e" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" fill="none" opacity="0" />
            <path data-p="shut" d="M186.5 97 Q194 103.5 201.5 97 M222.5 97 Q230 103.5 237.5 97" stroke="#2a170e" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" fill="none" opacity="0" />
            <path d="M204.5 111.5 Q212 107.2 219.5 111.5 Q218.2 118.4 212 120 Q205.8 118.4 204.5 111.5 Z" fill="#2a170e" />
            <path d="M212 120 V124.5 M212 124.5 Q207.2 129.6 202.8 125.2 M212 124.5 Q216.8 129.6 221.2 125.2" stroke="#2a170e" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" fill="none" />
            <path data-p="tongue" d="M207.6 127.4 Q212 136.6 216.4 127.4 Z" fill="#e98c8c" stroke="#2a170e" strokeWidth="2.2" strokeLinejoin="round" opacity="1" />
            <g data-p="mouth" opacity="0">
              <path d="M203 126 Q212 122 221 126 Q219 138 212 139 Q205 138 203 126 Z" fill="#6b2a1c" stroke="#2a170e" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
              <path d="M206.5 133.5 Q212 130 217.5 133.5 Q215 138 212 138 Q209 138 206.5 133.5 Z" fill="#e98c8c" />
            </g>
          </g>
          <g data-p="ledge" opacity="1">
            <path d="M175 159 C175 148 181 142 190 142 C199 142 205 148 205 159 Z…[121]" fill="#f2be6b" stroke="#2a170e" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" />
            <path d="M186 153 v-4.5 M194 153 v-4.5 M230 153 v-4.5 M238 153 v-4.5" stroke="#2a170e" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" fill="none" />
          </g>
        </g>
      </svg>
      
      <span aria-hidden="true" className="pup-bubble" data-show="false" />
    </div>
  );
}
