// Susto raro para manter o estudante atento: a cada segundo, chance de 1 em 100.000
// (em média uma vez a cada ~28 horas de site aberto). Personagem original: o NULL.
import { toast } from './util.js';

export const SCARE_CHANCE = 1 / 100000;

const NULL_SVG = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="ns-eye" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff6d0"/><stop offset=".25" stop-color="#ff3b30"/><stop offset="1" stop-color="#3a0000"/>
    </radialGradient>
    <radialGradient id="ns-head" cx="50%" cy="40%" r="65%">
      <stop offset="0" stop-color="#3b3f46"/><stop offset="1" stop-color="#0c0d10"/>
    </radialGradient>
    <pattern id="ns-grid" width="34" height="22" patternUnits="userSpaceOnUse">
      <path d="M34 0H0V22" fill="none" stroke="#5b616b" stroke-width="1.4" opacity=".55"/>
    </pattern>
  </defs>
  <path d="M70 120 L110 40 L150 95 L200 20 L250 95 L290 40 L330 120 L360 230 L320 350 L200 392 L80 350 L40 230 Z" fill="url(#ns-head)"/>
  <path d="M70 120 L110 40 L150 95 L200 20 L250 95 L290 40 L330 120 L360 230 L320 350 L200 392 L80 350 L40 230 Z" fill="url(#ns-grid)"/>
  <path d="M120 70 L140 150 L118 210 M300 80 L272 160 M215 30 L205 110" stroke="#000" stroke-width="5" fill="none" opacity=".8"/>
  <ellipse cx="140" cy="175" rx="46" ry="38" fill="#000"/>
  <ellipse cx="262" cy="175" rx="46" ry="38" fill="#000"/>
  <circle class="ns-eye" cx="140" cy="178" r="24" fill="url(#ns-eye)"/>
  <circle class="ns-eye" cx="262" cy="178" r="24" fill="url(#ns-eye)"/>
  <circle cx="140" cy="178" r="6" fill="#000"/><circle cx="262" cy="178" r="6" fill="#000"/>
  <path d="M80 255 Q200 225 322 255 L300 330 Q200 362 102 330 Z" fill="#120000"/>
  <path d="M84 258 L104 296 L118 252 L136 300 L150 247 L168 302 L182 244 L200 304 L218 244 L232 302 L250 247 L264 300 L282 252 L296 296 L318 258 Z" fill="#f1ece0"/>
  <path d="M104 328 L122 292 L138 335 L156 296 L172 340 L190 298 L208 342 L226 298 L242 340 L260 296 L276 335 L294 292 L300 326 Q200 360 104 328 Z" fill="#e4ddcc"/>
  <text x="200" y="125" text-anchor="middle" font-family="Consolas, monospace" font-size="38" font-weight="700" fill="#ff3b30" opacity=".85" letter-spacing="6">NULL</text>
</svg>`;

let audioCtx = null;
function screech() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const ctx = audioCtx, t0 = ctx.currentTime, dur = 1.1;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.exponentialRampToValueAtTime(0.35, t0 + 0.03);
    out.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    out.connect(ctx.destination);
    // ruído áspero
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const noise = ctx.createBufferSource(); noise.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.8;
    noise.connect(bp); bp.connect(out); noise.start(t0);
    // guincho que desce
    for (const [f, type] of [[1400, 'sawtooth'], [1460, 'square']]) {
      const o = ctx.createOscillator(); o.type = type;
      o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(180, t0 + dur);
      const g = ctx.createGain(); g.gain.value = 0.25;
      o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + dur);
    }
  } catch { /* sem áudio: fica só o visual */ }
}

let active = false;
export function triggerScare() {
  if (active) return;
  active = true;
  const el = document.createElement('div');
  el.className = 'scare';
  el.setAttribute('role', 'presentation');
  el.innerHTML = `<div class="scare-face">${NULL_SVG}</div>`;
  document.body.append(el);
  document.body.classList.add('scare-shake');
  screech();
  setTimeout(() => {
    el.classList.add('out');
    document.body.classList.remove('scare-shake');
    setTimeout(() => { el.remove(); active = false; }, 350);
    toast('Você sobreviveu ao NULL. Atenção redobrada: volte a estudar.', 4500);
  }, 1300);
}

/** Sorteia uma vez por segundo, só com a aba visível. */
export function initScare(isEnabled) {
  setInterval(() => {
    if (document.hidden || !isEnabled()) return;
    if (Math.random() < SCARE_CHANCE) triggerScare();
  }, 1000);
}
