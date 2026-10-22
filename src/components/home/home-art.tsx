/* 시안(askore_planty_house_lab_v2.html)의 SVG를 JSX로 옮긴 장식용 일러스트. 실제 측정·식물 데이터가 아님. */

type ArtProps = { className?: string };

export function HouseScene({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 720 570" role="img" aria-label="거실, 작은 방, 베란다가 보이는 아파트 단면도의 그래픽. 화면 위 각 방 선택 버튼으로 방을 고를 수 있습니다.">
      <defs>
      <pattern id="hl-window-lines" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 0H14M0 0V14" stroke="#ffffff" strokeOpacity=".17" strokeWidth="1" /></pattern>
      <pattern id="hl-back-dots" width="17" height="17" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#7b9d98" opacity=".5"/></pattern>
      <linearGradient id="hl-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a8e6e2"/><stop offset="100%" stopColor="#f7db94"/></linearGradient>
      <linearGradient id="hl-sunbeams" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffeea2" stopOpacity=".55"/><stop offset="100%" stopColor="#ffeea2" stopOpacity="0"/></linearGradient>
      <g id="hl-plant-leaves"><path d="M0 0 Q-45 -36 -21 -69 Q5 -65 0 0Z" fill="#387e59" stroke="#173d3e" strokeWidth="3"/><path d="M0 0 Q43 -45 28 -82 Q3 -70 0 0Z" fill="#b1dc5f" stroke="#173d3e" strokeWidth="3"/><path d="M0 0 Q-37 -5 -47 -39 Q-13 -42 0 0Z" fill="#78bd65" stroke="#173d3e" strokeWidth="3"/><path d="M0 0 Q30 -18 57 -47 Q62 -7 0 0Z" fill="#408b57" stroke="#173d3e" strokeWidth="3"/><path d="M0 0 L0 30" stroke="#173d3e" strokeWidth="4"/></g>
      <g id="hl-pot"><path d="M-26 0H26L19 35H-19Z" fill="#ff7759" stroke="#173d3e" strokeWidth="3"/><path d="M-29 -4H29V6H-29Z" fill="#ffbb8b" stroke="#173d3e" strokeWidth="3"/></g>
      </defs>
      <rect width="720" height="570" fill="#1c3741"/>
      <rect width="720" height="570" fill="url(#hl-back-dots)"/>
      <circle cx="644" cy="89" r="47" fill="#ddf75e"/><path d="M601 89H687M644 46V132" stroke="#203940" strokeWidth="1.5" opacity=".4"/>
      <text x="42" y="44" fill="#c7d9d1" fontSize="11" fontFamily="monospace" letterSpacing="2">HOUSE / MATCH / 001</text>
      <text x="676" y="43" textAnchor="end" fill="#d9f65a" fontSize="11" fontFamily="monospace" letterSpacing="2">KR — HOME</text>
      {/* apartment foundation and roof */}
      <path d="M66 182 L360 63 L656 182" fill="none" stroke="#d8f65c" strokeWidth="19" strokeLinejoin="miter"/>
      <path d="M65 182L360 63L656 182" fill="none" stroke="#132830" strokeWidth="3"/>
      <rect x="78" y="181" width="566" height="330" fill="#f2ecce" stroke="#0a202b" strokeWidth="11"/>
      <rect x="86" y="188" width="284" height="150" fill="#e8e2c6"/>
      <rect x="377" y="188" width="259" height="150" fill="#f4c5a8"/>
      <rect x="86" y="345" width="550" height="158" fill="#cfe4d9"/>
      <rect x="369" y="181" width="8" height="157" fill="#0f2530"/>
      <rect x="78" y="338" width="566" height="9" fill="#0f2530"/>
      {/* second-floor living */}
      <rect x="105" y="209" width="130" height="94" fill="url(#hl-glass)" stroke="#2e6774" strokeWidth="6"/>
      <rect x="105" y="209" width="130" height="94" fill="url(#hl-window-lines)"/>
      <path d="M169 208V304" stroke="#2e6774" strokeWidth="5"/>
      <path d="M105 303L179 267L236 267V303Z" fill="url(#hl-sunbeams)" opacity=".8"/>
      <path d="M103 290H239" stroke="#2e6774" strokeWidth="5"/>
      <rect x="101" y="309" width="258" height="14" fill="#a47d6f"/>
      <path d="M130 295h117v28H130Z" fill="#89a3a0" stroke="#183741" strokeWidth="3"/>
      <path d="M123 285Q124 272 140 272H243Q255 274 255 286V296H123Z" fill="#5c8c86" stroke="#183741" strokeWidth="3"/>
      <rect x="144" y="285" width="46" height="9" fill="#dce5b2" opacity=".5"/>
      <ellipse cx="270" cy="318" rx="51" ry="7" fill="#375e63" opacity=".2"/>
      <path d="M296 287V240" fill="none" stroke="#174b42" strokeWidth="4"/>
      <g transform="translate(298 277) scale(.60)"><use href="#hl-plant-leaves"/></g>
      <g transform="translate(298 290) scale(.56)"><use href="#hl-pot"/></g>
      <rect x="272" y="305" width="74" height="7" fill="#965d45"/>
      {/* bedroom */}
      <rect x="402" y="211" width="103" height="84" fill="#a9dae2" stroke="#2e6774" strokeWidth="6"/>
      <rect x="402" y="211" width="103" height="84" fill="url(#hl-window-lines)"/>
      <path d="M455 211V294M404 278H504" stroke="#2e6774" strokeWidth="4"/>
      <path d="M517 272H627V321H517Z" fill="#6a8498" stroke="#193642" strokeWidth="4"/>
      <path d="M517 262H628V289H517Z" fill="#f4f0e5" stroke="#193642" strokeWidth="4"/>
      <rect x="520" y="283" width="44" height="16" fill="#d7ba99"/>
      <rect x="569" y="285" width="48" height="12" fill="#dce4c7"/>
      <rect x="534" y="232" width="8" height="39" fill="#1c3941"/>
      <path d="M512 231Q533 204 551 231Z" fill="#fc765b" stroke="#1c3941" strokeWidth="3"/>
      <rect x="413" y="306" width="80" height="9" fill="#cc8c66" stroke="#193641" strokeWidth="3"/>
      <g transform="translate(454 304) scale(.40)"><use href="#hl-plant-leaves"/></g>
      <g transform="translate(454 307) scale(.35)"><use href="#hl-pot"/></g>
      {/* balcony greenhouse */}
      <rect x="105" y="364" width="494" height="121" fill="#acd6d6" stroke="#2e6774" strokeWidth="5"/>
      <rect x="105" y="364" width="494" height="121" fill="url(#hl-window-lines)" opacity=".35"/>
      <path d="M270 364V485M435 364V485M105 448H599" stroke="#2e6774" strokeWidth="5"/>
      <path d="M105 485H599" stroke="#103038" strokeWidth="6"/>
      <g transform="translate(165 435) scale(.9)"><use href="#hl-plant-leaves"/></g><g transform="translate(165 458) scale(.69)"><use href="#hl-pot"/></g>
      <g transform="translate(308 439) scale(.74)"><use href="#hl-plant-leaves"/></g><g transform="translate(308 462) scale(.56)"><use href="#hl-pot"/></g>
      <g transform="translate(496 435) scale(.94)"><use href="#hl-plant-leaves"/></g><g transform="translate(496 465) scale(.65)"><use href="#hl-pot"/></g>
      <path d="M196 484V444M207 484V448M218 484V441" stroke="#bc7f54" strokeWidth="3"/>
      <rect x="86" y="486" width="550" height="17" fill="#f4a177"/>
      <path d="M78 512H648V533H78Z" fill="#334f53"/>
      <path d="M54 533H670" stroke="#ddf75e" strokeWidth="3" strokeDasharray="7 7"/>
      {/* info arrows and symbols */}
      <circle cx="666" cy="286" r="18" fill="#ddf75e" stroke="#112a32" strokeWidth="3"/><path d="M658 286H674M666 278V294" stroke="#112a32" strokeWidth="2"/>
      <text x="74" y="555" fill="#c4dcd4" fontSize="10" fontFamily="monospace" letterSpacing="1">AN ILLUSTRATED HOUSE / NOT A LIVE MEASUREMENT</text>
      </svg>
  );
}

export function SpecimenIndoor({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 380 280" aria-hidden="true"><path d="M190 265V147M188 203Q128 159 112 97M195 214Q248 178 263 119M195 170Q221 133 226 76" fill="none" stroke="#234936" strokeWidth="7" strokeLinecap="round"/><path d="M111 100Q42 96 48 32Q121 13 132 77Q129 95 111 100Z" fill="#286b45" stroke="#173d37" strokeWidth="4"/><path d="M114 97L83 51" stroke="#d7ec9e" strokeWidth="2"/><path d="M263 122Q342 100 324 28Q246 31 247 94Q248 113 263 122Z" fill="#1a593d" stroke="#173d37" strokeWidth="4"/><path d="M260 117L290 65" stroke="#d7ec9e" strokeWidth="2"/><path d="M229 81Q172 57 190 8Q249 13 247 59Q245 75 229 81Z" fill="#397d51" stroke="#173d37" strokeWidth="4"/><path d="M220 76L225 33" stroke="#d7ec9e" strokeWidth="2"/><path d="M150 171Q94 198 65 159Q91 109 134 139Q145 148 150 171Z" fill="#3b8053" stroke="#173d37" strokeWidth="4"/><path d="M155 170L98 153" stroke="#d7ec9e" strokeWidth="2"/><path d="M224 190Q292 209 320 162Q278 122 246 159Q234 175 224 190Z" fill="#6baf65" stroke="#173d37" strokeWidth="4"/><path d="M224 189L291 163" stroke="#d7ec9e" strokeWidth="2"/><ellipse cx="189" cy="267" rx="68" ry="9" fill="#2b513d" opacity=".2"/><path d="M129 228H251L238 270H142Z" fill="#f77c59" stroke="#173d37" strokeWidth="5"/><path d="M124 218H256V231H124Z" fill="#ffb18c" stroke="#173d37" strokeWidth="4"/></svg>
  );
}

export function SpecimenHerbs({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 380 280" aria-hidden="true"><path d="M194 249Q183 159 158 83M193 245Q211 146 245 57M193 245Q155 166 111 139M196 246Q241 177 285 149M189 248Q188 172 194 22" stroke="#244f40" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <g fill="#427651" stroke="#244f40" strokeWidth="2"><ellipse cx="148" cy="80" rx="18" ry="9" transform="rotate(-35 148 80)"/><ellipse cx="172" cy="100" rx="18" ry="9" transform="rotate(39 172 100)"/><ellipse cx="137" cy="119" rx="21" ry="10" transform="rotate(-45 137 119)"/><ellipse cx="172" cy="149" rx="21" ry="10" transform="rotate(48 172 149)"/><ellipse cx="242" cy="76" rx="22" ry="10" transform="rotate(35 242 76)"/><ellipse cx="223" cy="110" rx="21" ry="10" transform="rotate(-35 223 110)"/><ellipse cx="266" cy="127" rx="21" ry="10" transform="rotate(40 266 127)"/><ellipse cx="120" cy="150" rx="23" ry="11" transform="rotate(-30 120 150)"/><ellipse cx="151" cy="174" rx="21" ry="10" transform="rotate(50 151 174)"/><ellipse cx="281" cy="163" rx="21" ry="10" transform="rotate(30 281 163)"/><ellipse cx="230" cy="178" rx="23" ry="10" transform="rotate(-35 230 178)"/><ellipse cx="186" cy="64" rx="19" ry="9" transform="rotate(-27 186 64)"/></g>
      <g fill="#e2efae" stroke="#395b4c" strokeWidth="1.6"><circle cx="194" cy="23" r="10"/><circle cx="195" cy="41" r="8"/><circle cx="244" cy="53" r="8"/><circle cx="163" cy="80" r="8"/><circle cx="286" cy="147" r="8"/></g>
      <ellipse cx="190" cy="262" rx="62" ry="9" fill="#45473a" opacity=".18"/><path d="M133 221H250L238 268H145Z" fill="#f8dfb2" stroke="#173d37" strokeWidth="5"/><path d="M129 212H255V226H129Z" fill="#f7c872" stroke="#173d37" strokeWidth="4"/></svg>
  );
}

export function SpecimenTrees({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 380 280" aria-hidden="true"><path d="M191 244V94M192 173Q160 145 121 136M190 186Q222 133 265 125M190 133Q158 99 145 63M197 140Q224 106 236 58" fill="none" stroke="#4c5140" strokeWidth="10" strokeLinecap="round"/><path d="M191 103Q103 117 91 69Q81 30 134 12Q169 1 195 41Q248 -1 284 30Q341 41 311 102Q289 131 246 108Q217 147 191 103Z" fill="#4d8654" stroke="#1a463e" strokeWidth="5"/><path d="M107 68Q155 49 175 79M215 45Q242 80 285 57M194 107Q222 105 244 90" fill="none" stroke="#bbd989" strokeWidth="3" opacity=".8"/><circle cx="127" cy="58" r="6" fill="#e2eaa8"/><circle cx="241" cy="44" r="6" fill="#e2eaa8"/><circle cx="271" cy="83" r="6" fill="#e2eaa8"/><ellipse cx="191" cy="261" rx="66" ry="8" fill="#414a45" opacity=".2"/><path d="M132 217H249L235 269H146Z" fill="#ff9b76" stroke="#1a463e" strokeWidth="5"/><path d="M129 209H253V222H129Z" fill="#ffc39a" stroke="#1a463e" strokeWidth="4"/></svg>
  );
}

export function SosDrawing({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 240 200" aria-hidden="true"><path d="M112 180Q94 99 44 38Q156 12 175 82Q194 153 112 180Z" fill="#ffbe9c" stroke="#142a2e" strokeWidth="7"/><path d="M112 178Q94 115 73 72" fill="none" stroke="#142a2e" strokeWidth="5"/><circle cx="101" cy="96" r="11" fill="#142a2e"/><circle cx="151" cy="108" r="7" fill="#142a2e"/><path d="M110 41L132 72" stroke="#142a2e" strokeWidth="4"/><path d="M200 24V58M183 41H217" stroke="#142a2e" strokeWidth="6"/></svg>
  );
}

export function SeasonArt({ className }: ArtProps) {
  return (
    <svg className={className} viewBox="0 0 500 330" aria-hidden="true"><circle cx="389" cy="87" r="61" fill="#d5f3df"/><circle cx="389" cy="87" r="37" fill="#c5e8de" stroke="#254b47" strokeWidth="3"/><path d="M79 280H429" stroke="#16393c" strokeWidth="6"/><path d="M82 280V47H245V280" fill="none" stroke="#16393c" strokeWidth="6"/><path d="M90 52H237V263H90Z" fill="#d5eee1" stroke="#16393c" strokeWidth="3"/><path d="M162 52V263M91 175H236" stroke="#427c78" strokeWidth="4"/><path d="M118 274Q92 229 96 191Q149 199 144 256L137 277" fill="#4e855d" stroke="#1e4940" strokeWidth="4"/><path d="M174 270Q131 197 174 125Q225 163 190 266Z" fill="#6ca26d" stroke="#1e4940" strokeWidth="4"/><path d="M209 263Q200 200 241 185Q249 226 218 272Z" fill="#2c725e" stroke="#1e4940" strokeWidth="4"/><path d="M143 252H226L217 292H154Z" fill="#ff9474" stroke="#1e4940" strokeWidth="5"/><path d="M136 246H230V259H136Z" fill="#ffc095" stroke="#1e4940" strokeWidth="4"/><path d="M311 248Q305 202 318 164M315 208Q288 195 290 178M318 196Q342 180 338 169" fill="none" stroke="#1e4940" strokeWidth="6"/><path d="M304 246H352L343 276H314Z" fill="#ff9474" stroke="#1e4940" strokeWidth="4"/><path d="M300 242H357V252H300Z" fill="#ffc095" stroke="#1e4940" strokeWidth="4"/><path d="M293 107L323 94M315 130L341 120M349 75L372 55" stroke="#1e4940" strokeWidth="3"/><text x="290" y="54" fill="#153b3e" fontFamily="monospace" fontSize="12">LIGHT / TIME</text></svg>
  );
}
