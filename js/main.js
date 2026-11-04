/* ============================================================
   DOMAIN EXPANSION — interactive engine
   ============================================================ */
(() => {
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- TOAST ---------------- */
  const toastEl = $('#toast');
  let toastTimer;
  const toast = msg => {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1600);
  };

  /* ---------------- SOUND (procedural, no files) ---------------- */
  let audioCtx = null;
  let soundOn = false;
  const ac = () => (audioCtx ||= new (window.AudioContext || window.webkitAudioContext)());

  function tone({ type = 'sine', from = 200, to = 80, dur = .18, vol = .22, delay = 0 }) {
    if (!soundOn) return;
    const ctx = ac(), t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + dur + .02);
  }
  function noise({ dur = .25, vol = .18, hp = 300, delay = 0 }) {
    if (!soundOn) return;
    const ctx = ac(), t = ctx.currentTime + delay;
    const len = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t);
  }
  const sfxThump = () => { tone({ type: 'sine', from: 120, to: 40, dur: .22, vol: .3 }); noise({ dur: .12, vol: .1, hp: 80 }); };
  const sfxZap   = () => { tone({ type: 'sawtooth', from: 900, to: 120, dur: .16, vol: .14 }); noise({ dur: .14, vol: .12, hp: 900 }); };
  const sfxWhoosh= () => { tone({ type: 'sine', from: 60, to: 500, dur: .5, vol: .12 }); noise({ dur: .5, vol: .06, hp: 200 }); };
  const sfxDomain= () => {
    tone({ type: 'sine', from: 40, to: 90, dur: .9, vol: .3 });
    tone({ type: 'sawtooth', from: 200, to: 900, dur: .7, vol: .07, delay: .15 });
    noise({ dur: .9, vol: .1, hp: 100, delay: .05 });
  };

  const soundBtn = $('#soundBtn'), soundIcon = $('#soundIcon');
  function setSound(on) {
    soundOn = on;
    soundIcon.textContent = on ? '🔊' : '🔇';
    toast(on ? 'SOUND ON ⚡' : 'SOUND OFF');
    if (on) { ac().resume?.(); sfxZap(); }
  }
  soundBtn.addEventListener('click', () => setSound(!soundOn));

  /* ---------------- REVEAL ON SCROLL ---------------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal]').forEach(el => io.observe(el));

  /* ---------------- PARALLAX + PROGRESS ---------------- */
  const bar = $('#progressBar');
  const arts = $$('.panel .art');
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      // progress
      const h = document.documentElement;
      const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      bar.style.width = (p * 100).toFixed(2) + '%';

      // parallax
      if (!reduced) {
        const vh = innerHeight;
        for (const img of arts) {
          const r = img.parentElement.getBoundingClientRect();
          if (r.bottom < -80 || r.top > vh + 80) continue;
          const prog = (vh / 2 - (r.top + r.height / 2)) / vh; // -0.5..0.5ish
          img.style.setProperty('--py', (prog * r.height * .09).toFixed(1) + 'px');
        }
      }
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------------- PANEL IMPACT ---------------- */
  const FLY = ['ZAP!!', 'BAM!!', 'DOOOM!!', 'KRAK!!', 'GOGOGO', 'VWOOM!!', 'SHUDAN!!', 'DOKAA!!'];
  function flyWord(x, y, word) {
    const el = document.createElement('span');
    el.className = 'fly-sfx';
    el.textContent = word;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.setProperty('--rot', (Math.random() * 24 - 12).toFixed(1) + 'deg');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }
  function impact(panel, x, y) {
    if (reduced) return;
    panel.classList.remove('impact');
    void panel.offsetWidth; // restart animation
    panel.classList.add('impact');
    flyWord(x, y, FLY[Math.random() * FLY.length | 0]);
    Math.random() < .5 ? sfxThump() : sfxZap();
  }

  /* ---------------- DOMAIN OVERLAY ---------------- */
  const overlay = $('#domainOverlay');
  let overlayTimer;
  function openDomain() {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    sfxDomain();
    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(closeDomain, 3400);
  }
  function closeDomain() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    clearTimeout(overlayTimer);
  }
  overlay.addEventListener('click', closeDomain);
  $('#domainBtn').addEventListener('click', openDomain);
  $$('.js-domain').forEach(b => b.addEventListener('click', openDomain));

  // panels flagged data-domain trigger the cut-in; others just impact
  $$('.panel').forEach(panel => {
    panel.addEventListener('click', ev => {
      if (panel.hasAttribute('data-domain')) {
        openDomain();
        flyWord(ev.clientX, ev.clientY, '領域展開!!');
      } else {
        impact(panel, ev.clientX, ev.clientY);
      }
    });
  });

  /* ---------------- SHORTCUTS ---------------- */
  addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    const k = e.key.toLowerCase();
    if (k === 'd') openDomain();
    if (k === 's') setSound(!soundOn);
    if (k === 'escape') closeDomain();
  });

  /* ============================================================
     PANEL LAB — procedural manga panel generator
     ============================================================ */
  const ARTS = [
    { src: 'assets/img/clash-2v1.jpg',        pos: [[50, 10], [50, 45], [50, 80]],  zoom: [1.1, 1.6] },
    { src: 'assets/img/clash-bw.jpg',         pos: [[30, 15], [55, 45], [80, 60]],  zoom: [1.0, 1.5] },
    { src: 'assets/img/clash-bw-color.jpg',   pos: [[25, 40], [74, 42], [50, 85]],  zoom: [1.0, 1.6] },
    { src: 'assets/img/warehouse-fight.jpg',  pos: [[28, 50], [60, 30], [50, 80]],  zoom: [1.05, 1.5] },
    { src: 'assets/img/domain-anime.jpg',     pos: [[50, 15], [50, 40], [70, 80]],  zoom: [1.05, 1.5] },
    { src: 'assets/img/domain-realism.jpg',   pos: [[30, 20], [50, 45], [80, 75]],  zoom: [1.05, 1.5] },
    { src: 'assets/img/domain-anime-grid.png',pos: [[50, 50], [25, 55], [75, 45]],  zoom: [1.0, 1.35] },
    { src: 'assets/img/desk-tears-1.jpg',     pos: [[50, 12], [50, 45], [50, 85]],  zoom: [1.1, 1.6] },
    { src: 'assets/img/desk-tears-2.jpg',     pos: [[50, 14], [50, 40], [50, 75]],  zoom: [1.1, 1.6] },
    { src: 'assets/img/desk-tears-3.jpg',     pos: [[50, 12], [50, 45], [50, 85]],  zoom: [1.1, 1.6] },
    { src: 'assets/img/villain.jpg',          pos: [[50, 20], [50, 45], [50, 70]],  zoom: [1.15, 1.6] },
    { src: 'assets/img/villain-2.jpg',        pos: [[50, 20], [50, 45], [50, 70]],  zoom: [1.15, 1.6] },
  ];
  const SFX = ['ZAP!!', 'KRA-KOOM!!', 'DOOOM!!', 'RAAAH!!', 'VWOOM!!', 'GOGOGO', 'SHUDAN!!', 'DOKAA!!', 'BZZT!!', 'GUROGURO...'];
  const NARR = [
    'THE WAREHOUSE — 11:47 PM',
    'MEANWHILE, ABOVE THE CITY…',
    'THE DOMAIN TREMBLED.',
    'PAGE 143 — THE TURNING POINT.',
    'NO ONE WROTE WHAT CAME NEXT.',
    'THE CURSE LAUGHS LAST… FOR NOW.',
    'TWO HEARTBEATS. ONE HANDSIGN.',
    'THE INK IS STILL DRYING.',
  ];
  const BUB = [
    'You should have stayed at your desk.',
    'Not before the ink dries!',
    'Now — BOTH HANDS!',
    'This page belongs to US.',
    'Hold the sign. Hold the line.',
    'You brought a curse. We brought a STORY.',
    'Together, then.',
    'Write your last word.',
  ];
  const SFX_CLASS = ['sfx-pink', 'sfx-cyan', 'sfx-white'];
  const SFX_SPOT  = ['s1', 's2', 's3'];
  const BUB_SPOT  = ['b-tl', 'b-tr', 'b-bl', 'b-br', 'b-tc', 'b-bc'];
  const TILT      = [-.6, -.3, 0, .3, .6];

  // mulberry32 — tiny seeded PRNG (same seed ⇒ same panel)
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const pick = (r, arr) => arr[r() * arr.length | 0];

  const labPanel  = $('#labPanel');
  const labArt    = $('#labArt');
  const labSfx    = $('#labSfx');
  const labBubble = $('#labBubble');
  const labNarr   = $('#labNarr');
  const labSeedEl = $('#labSeed');
  const labPanelBox = $('#labPanel');

  function generatePanel(seed) {
    const r = rng(seed);
    const a = pick(r, ARTS);
    const [x, y] = pick(r, a.pos);
    const zoom = (a.zoom[0] + r() * (a.zoom[1] - a.zoom[0])).toFixed(2);

    labArt.src = a.src;
    labArt.style.setProperty('--pos', `${x}% ${y}%`);
    labArt.style.setProperty('--zoom', zoom);
    labPanelBox.style.setProperty('--tilt', pick(r, TILT) + 'deg');
    labPanelBox.style.setProperty('--d', '0s');

    labSfx.textContent = pick(r, SFX);
    labSfx.className = 'sfx ' + pick(r, SFX_CLASS) + ' ' + pick(r, SFX_SPOT);
    labSfx.style.setProperty('--rot', (r() * 24 - 12).toFixed(1) + 'deg');
    labSfx.style.setProperty('--d', '.15s');

    labBubble.textContent = pick(r, BUB);
    labBubble.className = 'bubble ' + pick(r, BUB_SPOT);
    labBubble.style.setProperty('--d', '.35s');

    labNarr.textContent = pick(r, NARR);
    labNarr.className = 'narration ' + (r() < .5 ? 'n-tl' : 'n-br');
    labNarr.style.setProperty('--d', '.1s');

    labSeedEl.textContent = String(seed).padStart(4, '0');
    labPanel.dataset.no = String(seed % 100).padStart(2, '0');

    // replay pop animations
    labPanel.classList.remove('in');
    void labPanel.offsetWidth;
    labPanel.classList.add('in');
    sfxZap();
  }

  let labSeed = Math.floor(Math.random() * 10000);
  $('#genBtn').addEventListener('click', () => { labSeed = (labSeed + 1 + Math.floor(Math.random() * 900)) % 10000; generatePanel(labSeed); });
  $('#genReset').addEventListener('click', () => { labSeed = Math.floor(Math.random() * 10000); generatePanel(labSeed); toast('NEW SEED ROLLED 🎲'); });

  // first paint (static, no sound yet)
  generatePanel(labSeed);
  soundOn = false; // ensure first generate stays silent before user opts in
})();
