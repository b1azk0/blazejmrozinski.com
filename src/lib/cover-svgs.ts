import type { LabelSlug } from './labels.ts';

export function getCoverSvg(label: LabelSlug, accent: string): string {
  const generators: Record<LabelSlug, () => string> = {
    'infrastructure': () => infrastructureSvg(accent),
    'ai-automation': () => aiAutomationSvg(accent),
    'product': () => productSvg(accent),
    'research': () => researchSvg(accent),
    'systems-thinking': () => systemsThinkingSvg(accent),
    'operator-notes': () => operatorNotesSvg(accent),
    'academic-work': () => academicWorkSvg(accent),
  };
  return generators[label]();
}

function infrastructureSvg(c: string): string {
  return `<svg viewBox="0 0 280 240" xmlns="http://www.w3.org/2000/svg" fill="none">
    <rect x="20" y="10" width="240" height="220" rx="8" fill="${c}08" stroke="${c}22" stroke-width="2"/>
    <rect x="40" y="28" width="200" height="40" rx="5" fill="${c}0d" stroke="${c}30" stroke-width="1.5"/>
    <circle cx="62" cy="48" r="5" fill="#2dd4a0"/>
    <circle cx="78" cy="48" r="5" fill="#2dd4a0" opacity="0.6"/>
    <rect x="160" y="40" width="60" height="16" rx="3" fill="${c}10" stroke="${c}20" stroke-width="1"/>
    <line x1="175" y1="42" x2="175" y2="54" stroke="${c}20" stroke-width="1"/>
    <line x1="190" y1="42" x2="190" y2="54" stroke="${c}20" stroke-width="1"/>
    <line x1="205" y1="42" x2="205" y2="54" stroke="${c}20" stroke-width="1"/>
    <rect x="40" y="78" width="200" height="40" rx="5" fill="${c}0d" stroke="${c}30" stroke-width="1.5"/>
    <circle cx="62" cy="98" r="5" fill="#f59e0b"/>
    <circle cx="78" cy="98" r="5" fill="#2dd4a0" opacity="0.6"/>
    <rect x="160" y="90" width="60" height="16" rx="3" fill="${c}10" stroke="${c}20" stroke-width="1"/>
    <line x1="175" y1="92" x2="175" y2="104" stroke="${c}20" stroke-width="1"/>
    <line x1="190" y1="92" x2="190" y2="104" stroke="${c}20" stroke-width="1"/>
    <rect x="40" y="128" width="200" height="40" rx="5" fill="${c}0d" stroke="${c}30" stroke-width="1.5"/>
    <circle cx="62" cy="148" r="5" fill="#2dd4a0"/>
    <circle cx="78" cy="148" r="5" fill="#2dd4a0"/>
    <rect x="160" y="140" width="60" height="16" rx="3" fill="${c}10" stroke="${c}20" stroke-width="1"/>
    <line x1="175" y1="142" x2="175" y2="154" stroke="${c}20" stroke-width="1"/>
    <line x1="190" y1="142" x2="190" y2="154" stroke="${c}20" stroke-width="1"/>
    <line x1="205" y1="142" x2="205" y2="154" stroke="${c}20" stroke-width="1"/>
    <rect x="40" y="178" width="200" height="40" rx="5" fill="${c}08" stroke="${c}1a" stroke-width="1.5"/>
    <text x="56" y="204" font-family="monospace" font-size="16" fill="${c}55">$ ssh root@</text>
  </svg>`;
}

function aiAutomationSvg(c: string): string {
  return `<svg viewBox="0 0 280 240" xmlns="http://www.w3.org/2000/svg" fill="none">
    <path d="M140 30 C95 30 60 55 60 90 C60 108 68 122 80 132 C76 145 80 162 96 172 C104 180 120 186 140 186 C160 186 176 180 184 172 C200 162 204 145 200 132 C212 122 220 108 220 90 C220 55 185 30 140 30Z" stroke="${c}35" stroke-width="2" fill="${c}06"/>
    <path d="M105 65 L120 90 L105 115" stroke="${c}22" stroke-width="1.5" fill="none"/>
    <path d="M160 65 L175 90 L160 115" stroke="${c}22" stroke-width="1.5" fill="none"/>
    <line x1="120" y1="90" x2="160" y2="90" stroke="${c}22" stroke-width="1.5"/>
    <path d="M112 140 L140 155 L168 140" stroke="${c}22" stroke-width="1.5" fill="none"/>
    <circle cx="105" cy="65" r="7" fill="${c}35" stroke="${c}66" stroke-width="1.5"/>
    <circle cx="160" cy="65" r="7" fill="${c}35" stroke="${c}66" stroke-width="1.5"/>
    <circle cx="120" cy="90" r="8" fill="${c}44" stroke="${c}77" stroke-width="1.5"/>
    <circle cx="160" cy="90" r="8" fill="${c}44" stroke="${c}77" stroke-width="1.5"/>
    <circle cx="105" cy="115" r="7" fill="${c}35" stroke="${c}66" stroke-width="1.5"/>
    <circle cx="160" cy="115" r="7" fill="${c}35" stroke="${c}66" stroke-width="1.5"/>
    <circle cx="140" cy="155" r="8" fill="${c}44" stroke="${c}77" stroke-width="1.5"/>
    <circle cx="120" cy="90" r="18" stroke="${c}15" stroke-width="1" fill="none"/>
    <circle cx="140" cy="155" r="22" stroke="${c}10" stroke-width="1" fill="none"/>
    <line x1="220" y1="90" x2="255" y2="90" stroke="${c}28" stroke-width="1.5" stroke-dasharray="5 4"/>
    <line x1="60" y1="90" x2="25" y2="90" stroke="${c}28" stroke-width="1.5" stroke-dasharray="5 4"/>
    <circle cx="255" cy="90" r="5" fill="${c}35"/>
    <circle cx="25" cy="90" r="5" fill="${c}35"/>
  </svg>`;
}

function researchSvg(c: string): string {
  return `<svg viewBox="0 0 280 240" xmlns="http://www.w3.org/2000/svg" fill="none">
    <line x1="40" y1="200" x2="260" y2="200" stroke="${c}35" stroke-width="2"/>
    <line x1="40" y1="200" x2="40" y2="20" stroke="${c}35" stroke-width="2"/>
    <line x1="40" y1="150" x2="260" y2="150" stroke="${c}0a" stroke-width="1"/>
    <line x1="40" y1="100" x2="260" y2="100" stroke="${c}0a" stroke-width="1"/>
    <line x1="40" y1="50" x2="260" y2="50" stroke="${c}0a" stroke-width="1"/>
    <circle cx="55" cy="175" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="75" cy="162" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="90" cy="168" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="108" cy="135" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="128" cy="125" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="145" cy="138" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="162" cy="105" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="180" cy="92" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="198" cy="100" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="218" cy="72" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="235" cy="55" r="5.5" fill="${c}55" stroke="${c}88" stroke-width="1"/>
    <circle cx="250" cy="42" r="6.5" fill="${c}66" stroke="${c}99" stroke-width="1.5"/>
    <line x1="48" y1="182" x2="256" y2="35" stroke="#f59e0b88" stroke-width="2" stroke-dasharray="8 5"/>
    <path d="M48 172 L256 22 L256 48 L48 195 Z" fill="${c}06"/>
    <text x="140" y="222" font-family="monospace" font-size="12" fill="${c}40" text-anchor="middle">n = 20,000</text>
  </svg>`;
}

function productSvg(c: string): string {
  return `<svg viewBox="0 0 280 240" xmlns="http://www.w3.org/2000/svg" fill="none">
    <rect x="10" y="10" width="260" height="220" rx="8" fill="${c}06" stroke="${c}28" stroke-width="2"/>
    <rect x="10" y="10" width="260" height="30" rx="8" fill="${c}0a"/>
    <rect x="10" y="32" width="260" height="8" fill="${c}0a"/>
    <circle cx="28" cy="25" r="5" fill="#ef4444" opacity="0.4"/>
    <circle cx="44" cy="25" r="5" fill="#eab308" opacity="0.4"/>
    <circle cx="60" cy="25" r="5" fill="#22c55e" opacity="0.4"/>
    <rect x="100" y="18" width="150" height="14" rx="7" fill="${c}0a" stroke="${c}15" stroke-width="1"/>
    <rect x="24" y="52" width="36" height="7" rx="3" fill="${c}22"/>
    <rect x="68" y="52" width="28" height="7" rx="3" fill="${c}15"/>
    <rect x="104" y="52" width="32" height="7" rx="3" fill="${c}15"/>
    <rect x="144" y="52" width="24" height="7" rx="3" fill="${c}15"/>
    <rect x="24" y="72" width="110" height="10" rx="3" fill="${c}22"/>
    <rect x="24" y="88" width="80" height="5" rx="2" fill="${c}10"/>
    <rect x="24" y="98" width="90" height="5" rx="2" fill="${c}10"/>
    <rect x="24" y="114" width="56" height="14" rx="7" fill="${c}28" stroke="${c}40" stroke-width="1"/>
    <rect x="160" y="72" width="96" height="56" rx="5" fill="${c}0a" stroke="${c}15" stroke-width="1"/>
    <line x1="160" y1="72" x2="256" y2="128" stroke="${c}08" stroke-width="1"/>
    <line x1="256" y1="72" x2="160" y2="128" stroke="${c}08" stroke-width="1"/>
    <rect x="24" y="145" width="70" height="70" rx="5" fill="${c}0a" stroke="${c}15" stroke-width="1"/>
    <rect x="102" y="145" width="70" height="70" rx="5" fill="${c}0a" stroke="${c}15" stroke-width="1"/>
    <rect x="180" y="145" width="70" height="70" rx="5" fill="${c}0a" stroke="${c}15" stroke-width="1"/>
    <rect x="30" y="153" width="54" height="5" rx="2" fill="${c}15"/>
    <rect x="30" y="164" width="40" height="4" rx="1" fill="${c}0a"/>
    <rect x="108" y="153" width="54" height="5" rx="2" fill="${c}15"/>
    <rect x="108" y="164" width="44" height="4" rx="1" fill="${c}0a"/>
    <rect x="186" y="153" width="54" height="5" rx="2" fill="${c}15"/>
    <rect x="186" y="164" width="36" height="4" rx="1" fill="${c}0a"/>
  </svg>`;
}

function systemsThinkingSvg(c: string): string {
  return `<svg viewBox="0 0 280 240" xmlns="http://www.w3.org/2000/svg" fill="none">
    <rect x="100" y="80" width="80" height="44" rx="6" fill="${c}15" stroke="${c}48" stroke-width="2"/>
    <rect x="112" y="94" width="56" height="6" rx="2" fill="${c}28"/>
    <rect x="118" y="106" width="40" height="4" rx="1.5" fill="${c}18"/>
    <rect x="108" y="8" width="64" height="34" rx="5" fill="${c}0a" stroke="${c}28" stroke-width="1.5"/>
    <rect x="118" y="18" width="44" height="5" rx="2" fill="${c}20"/>
    <rect x="108" y="162" width="64" height="34" rx="5" fill="${c}0a" stroke="${c}28" stroke-width="1.5"/>
    <rect x="118" y="172" width="44" height="5" rx="2" fill="${c}20"/>
    <rect x="8" y="85" width="64" height="34" rx="5" fill="${c}0a" stroke="${c}28" stroke-width="1.5"/>
    <rect x="18" y="95" width="44" height="5" rx="2" fill="${c}20"/>
    <rect x="208" y="85" width="64" height="34" rx="5" fill="${c}0a" stroke="${c}28" stroke-width="1.5"/>
    <rect x="218" y="95" width="44" height="5" rx="2" fill="${c}20"/>
    <rect x="22" y="170" width="56" height="30" rx="5" fill="${c}06" stroke="${c}20" stroke-width="1.2"/>
    <rect x="30" y="179" width="38" height="4" rx="1.5" fill="${c}15"/>
    <rect x="200" y="170" width="56" height="30" rx="5" fill="${c}06" stroke="${c}20" stroke-width="1.2"/>
    <rect x="208" y="179" width="38" height="4" rx="1.5" fill="${c}15"/>
    <line x1="140" y1="42" x2="140" y2="80" stroke="${c}30" stroke-width="2"/>
    <line x1="140" y1="124" x2="140" y2="162" stroke="${c}30" stroke-width="2"/>
    <line x1="72" y1="102" x2="100" y2="102" stroke="${c}30" stroke-width="2"/>
    <line x1="180" y1="102" x2="208" y2="102" stroke="${c}30" stroke-width="2"/>
    <line x1="100" y1="124" x2="60" y2="170" stroke="${c}20" stroke-width="1.5" stroke-dasharray="5 3"/>
    <line x1="180" y1="124" x2="220" y2="170" stroke="${c}20" stroke-width="1.5" stroke-dasharray="5 3"/>
    <path d="M 272 102 Q 276 145 256 188" stroke="${c}18" stroke-width="1.5" fill="none" stroke-dasharray="5 3"/>
  </svg>`;
}

function operatorNotesSvg(c: string): string {
  return `<svg viewBox="0 0 280 240" xmlns="http://www.w3.org/2000/svg" fill="none">
    <rect x="10" y="10" width="260" height="220" rx="8" fill="${c}05" stroke="${c}20" stroke-width="2"/>
    <rect x="10" y="10" width="260" height="28" rx="8" fill="${c}08"/>
    <rect x="10" y="30" width="260" height="8" fill="${c}08"/>
    <circle cx="28" cy="24" r="5" fill="#ef4444" opacity="0.35"/>
    <circle cx="44" cy="24" r="5" fill="#eab308" opacity="0.35"/>
    <circle cx="60" cy="24" r="5" fill="#22c55e" opacity="0.35"/>
    <text x="24" y="60" font-family="monospace" font-size="13" fill="#22c55e88">✓</text>
    <text x="42" y="60" font-family="monospace" font-size="12" fill="${c}40">deploy v2.4.1 completed</text>
    <text x="24" y="82" font-family="monospace" font-size="13" fill="#22c55e88">✓</text>
    <text x="42" y="82" font-family="monospace" font-size="12" fill="${c}40">ssl cert renewed (90d)</text>
    <text x="24" y="104" font-family="monospace" font-size="13" fill="#ef444488">✗</text>
    <text x="42" y="104" font-family="monospace" font-size="12" fill="#ef444455">ssh: connection refused</text>
    <text x="24" y="126" font-family="monospace" font-size="13" fill="#eab30888">⚠</text>
    <text x="42" y="126" font-family="monospace" font-size="12" fill="#eab30855">disk usage 87% /var/log</text>
    <text x="24" y="148" font-family="monospace" font-size="13" fill="#22c55e88">✓</text>
    <text x="42" y="148" font-family="monospace" font-size="12" fill="${c}40">firewall rules updated</text>
    <text x="24" y="170" font-family="monospace" font-size="13" fill="#22c55e88">✓</text>
    <text x="42" y="170" font-family="monospace" font-size="12" fill="${c}40">backup job 03:00 ok</text>
    <text x="24" y="200" font-family="monospace" font-size="12" fill="${c}50">$</text>
    <rect x="36" y="190" width="10" height="16" fill="${c}30"/>
  </svg>`;
}

function academicWorkSvg(c: string): string {
  return `<svg viewBox="0 0 280 240" xmlns="http://www.w3.org/2000/svg" fill="none">
    <rect x="45" y="14" width="190" height="216" rx="6" fill="${c}06" stroke="${c}15" stroke-width="1"/>
    <rect x="25" y="5" width="190" height="216" rx="6" fill="${c}0a" stroke="${c}28" stroke-width="2"/>
    <rect x="42" y="22" width="120" height="10" rx="3" fill="${c}28"/>
    <rect x="42" y="38" width="90" height="6" rx="2" fill="${c}15"/>
    <line x1="42" y1="52" x2="198" y2="52" stroke="${c}12" stroke-width="1"/>
    <rect x="42" y="62" width="150" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="42" y="72" width="140" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="42" y="82" width="144" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="42" y="92" width="110" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="42" y="110" width="60" height="6" rx="2" fill="${c}20"/>
    <rect x="42" y="124" width="150" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="42" y="134" width="136" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="42" y="144" width="144" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="42" y="154" width="120" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="42" y="164" width="140" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="42" y="174" width="130" height="4.5" rx="1.5" fill="${c}10"/>
    <rect x="38" y="122" width="4" height="40" rx="2" fill="${c}28"/>
    <circle cx="190" cy="20" r="14" fill="#22c55e15" stroke="#22c55e35" stroke-width="1.5"/>
    <path d="M184 20 L188 24 L197 15" stroke="#22c55e55" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`;
}

export function glossarySvg(accent: string): string {
  return `<svg viewBox="0 0 280 240" xmlns="http://www.w3.org/2000/svg" fill="none">
    <rect x="50" y="12" width="180" height="216" rx="6" fill="${accent}08" stroke="${accent}22" stroke-width="2"/>
    <rect x="30" y="4" width="180" height="216" rx="6" fill="${accent}0d" stroke="${accent}30" stroke-width="2"/>
    <rect x="30" y="4" width="24" height="216" rx="6" fill="${accent}12"/>
    <line x1="54" y1="4" x2="54" y2="220" stroke="${accent}20" stroke-width="1"/>
    <rect x="70" y="28" width="100" height="10" rx="3" fill="${accent}28"/>
    <rect x="70" y="46" width="70" height="6" rx="2" fill="${accent}15"/>
    <line x1="70" y1="62" x2="190" y2="62" stroke="${accent}12" stroke-width="1"/>
    <text x="72" y="84" font-family="monospace" font-size="24" font-weight="bold" fill="${accent}55">Aa</text>
    <rect x="70" y="100" width="120" height="4" rx="1.5" fill="${accent}10"/>
    <rect x="70" y="110" width="110" height="4" rx="1.5" fill="${accent}10"/>
    <rect x="70" y="120" width="100" height="4" rx="1.5" fill="${accent}10"/>
    <line x1="70" y1="138" x2="190" y2="138" stroke="${accent}12" stroke-width="1"/>
    <rect x="70" y="150" width="90" height="6" rx="2" fill="${accent}20"/>
    <rect x="70" y="164" width="120" height="4" rx="1.5" fill="${accent}10"/>
    <rect x="70" y="174" width="105" height="4" rx="1.5" fill="${accent}10"/>
    <rect x="70" y="184" width="115" height="4" rx="1.5" fill="${accent}10"/>
    <circle cx="190" cy="30" r="12" fill="${accent}15" stroke="${accent}35" stroke-width="1.5"/>
    <text x="184" y="35" font-family="sans-serif" font-size="14" font-weight="bold" fill="${accent}55">?</text>
  </svg>`;
}
