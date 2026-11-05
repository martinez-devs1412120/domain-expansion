/* ============================================================
   DOMAIN EXPANSION — interactive engine v2
   intro · directional reveals · screen flash & quake ·
   cinematic zoom · chapter rail · procedural sound
   ============================================================ */
(() => {
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------------- TOAST ---------------- */
  const toastEl = $('#toast');
  let toastTimer;
  const toast = msg => {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1600);
  };

  /* ---------------- SOUND ENGINE (procedural, no files) ---------------- */
  let ac = null, master = null;
  let soundOn = false;
  const acGet = () => {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain();
      master.gain.value = .75;
      master.connect(ac.destination);
    }
    return ac;
  };
  // browsers suspend audio until a gesture — unlock on first interaction
  addEventListener('pointerdown', () => { acGet().resume?.(); }, { once: true });

  const canPlay = () => soundOn && ac && ac.state === 'running';

  function tone({ type = 'sine', from = 200, to = 80, dur = .18, vol = .2, delay = 0 }) {
    if (!canPlay()) return;
    const c = acGet(), t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + dur + .02);
  }
  function noise({ dur = .25, vol = .15, hp = 300, sweepTo = null, delay = 0 }) {
    if (!canPlay()) return;
    const c = acGet(), t = c.currentTime + delay;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'highpass';
    f.frequency.setValueAtTime(hp, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t);
  }
  const sfxThump  = () => { tone({ type: 'sine', from: 110, to: 38, dur: .24, vol: .34 }); noise({ dur: .1, vol: .08, hp: 60 }); };
  const sfxWhoosh = (hp = 1600) => noise({ dur: .2, vol: .06, hp, sweepTo: 260 });
  const sfxZap    = () => { tone({ type: 'sawtooth', from: 900, to: 120, dur: .15, vol: .12 }); noise({ dur: .12, vol: .1, hp: 1200 }); };
  const sfxRiser  = () => {
    tone({ type: 'sawtooth', from: 70, to: 520, dur: .6, vol: .06 });
    tone({ type: 'sine', from: 40, to: 110, dur: .7, vol: .22, delay: .1 });
    noise({ dur: .55, vol: .05, hp: 400, sweepTo: 3000 });
  };
  const sfxHit    = () => { noise({ dur: .14, vol: .16, hp: 900 }); tone({ type: 'sine', from: 1250, to: 600, dur: .12, vol: .1 }); };
  const sfxTick   = () => tone({ type: 'square', from: 2600, to: 2100, dur: .035, vol: .045 });
  const sfxDomain = () => {
    tone({ type: 'sine', from: 38, to: 95, dur: 1, vol: .32 });
    tone({ type: 'sawtooth', from: 180, to: 900, dur: .8, vol: .07, delay: .12 });
    noise({ dur: 1, vol: .1, hp: 90, delay: .05 });
  };

  const soundBtn = $('#soundBtn'), soundIcon = $('#soundIcon');
  function setSound(on, silent = false) {
    soundOn = on;
    soundIcon.textContent = on ? '🔊' : '🔇';
    localStorage.setItem('de_sound', on ? '1' : '0');
    if (on) { acGet().resume?.(); if (!silent) toast('SOUND ON ⚡'); sfxZap(); }
  }
  soundBtn.addEventListener('click', () => setSound(!soundOn));
  // restore preference without creating a context (no gesture yet)
  soundOn = localStorage.getItem('de_sound') !== '0';
  soundIcon.textContent = soundOn ? '🔊' : '🔇';

  /* ---------------- SCREEN FLASH + QUAKE ---------------- */
  const flashEl = $('#flashfx'), mainEl = $('main');
  let lastFlash = 0;
  function flash(a = .3, dbl = false) {
    if (reduced) return;
    const now = performance.now();
    if (now - lastFlash < 300) return;   // never strobe
    lastFlash = now;
    flashEl.style.setProperty('--fo', a);
    flashEl.classList.remove('go', 'go2');
    void flashEl.offsetWidth;
    flashEl.classList.add(dbl ? 'go2' : 'go');
  }
  function quake() {
    if (reduced) return;
    mainEl.classList.remove('quake');
    void mainEl.offsetWidth;
    mainEl.classList.add('quake');
  }

  /* ---------------- INTRO CUT-IN ---------------- */
  const intro = $('#intro');
  const seenIntro = sessionStorage.getItem('de_intro') === '1';
  function enterIntro() {
    if (!intro.parentNode) return;
    intro.classList.add('lift');
    document.documentElement.classList.remove('intro-lock');
    sessionStorage.setItem('de_intro', '1');
    const stored = localStorage.getItem('de_sound');
    setSound(stored === '0' ? false : true, stored !== null); // gesture: audio unlocked
    setTimeout(() => { flash(.3); sfxThump(); }, 200);
    setTimeout(() => intro.remove(), 750);
  }
  if (reduced || seenIntro) {
    intro?.remove();
    document.documentElement.classList.remove('intro-lock');
    sessionStorage.setItem('de_intro', '1');
  } else {
    document.documentElement.classList.add('intro-lock');
    // reveal via rAF when possible, timer fallback if rAF is throttled (background tab)
    const showIntro = () => intro.classList.add('reveal');
    requestAnimationFrame(() => requestAnimationFrame(showIntro));
    setTimeout(showIntro, 400);
    intro.addEventListener('click', enterIntro, { once: true });
  }

  /* ---------------- CHAPTER DECOR (kanji / gogogo) ---------------- */
  const KANJI = { ch1: '泣', ch2: '対', ch3: '領', ch4: '雷', ch5: '呪', ch6: '完' };
  const GOGO  = { ch2: [8, 84], ch4: [88, 12], ch6: [10, 86] };
  $$('.chapter-card').forEach(card => {
    const sec = card.closest('section');
    const id = sec && sec.id;
    if (id && KANJI[id]) {
      const k = document.createElement('span');
      k.className = 'cc-kanji';
      k.setAttribute('aria-hidden', 'true');
      k.textContent = KANJI[id];
      card.appendChild(k);
    }
    if (id && GOGO[id]) {
      GOGO[id].forEach((x, i) => {
        const g = document.createElement('span');
        g.className = 'cc-gogo';
        g.setAttribute('aria-hidden', 'true');
        g.textContent = 'ゴゴゴゴ';
        g.style.left = x + '%';
        g.style.animationDelay = (i * .9) + 's';
        card.appendChild(g);
      });
    }
  });
  const kanjis = $$('.cc-kanji');

  /* ---------------- REVEAL (directional) ---------------- */
  const ANIM = {
    1:'wipe', 2:'left', 3:'right', 4:'wipe', 5:'zoom',
    6:'zoom', 7:'wipe', 8:'up', 9:'left', 10:'right',
    11:'left', 12:'zoom', 13:'right', 14:'wipe', 15:'drop', 16:'zoom',
    17:'right', 18:'zoom', 19:'left', 20:'left', 21:'right',
    22:'wipe', 23:'up', 24:'left', 25:'zoom', 26:'right', 27:'wipe',
    28:'left', 29:'zoom', 30:'right', 31:'zoom', 32:'left', 33:'wipe', 34:'drop',
  };
  const CZ = { 12: .10, 13: .10, 30: .12, 31: .18 }; // cinematic zoom-on-scroll

  $$('.panel').forEach(p => {
    const n = +p.dataset.no;
    if (ANIM[n]) p.setAttribute('data-anim', ANIM[n]);
    if (CZ[n]) p.setAttribute('data-cz', CZ[n]);
  });
  const cine = $$('.panel[data-cz]').map(p => ({
    img: p.querySelector('.art'),
    cz: +p.getAttribute('data-cz'),
  }));

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('in');
      io.unobserve(el);
      if (el.classList.contains('chapter-card')) {
        flash(.3); quake(); sfxThump();
      } else if (el.classList.contains('panel')) {
        if (el.hasAttribute('data-domain')) { flash(.22); sfxRiser(); }
        else if (el.matches('.panel--sfx, .panel--impact')) { flash(.16, true); sfxHit(); }
        else sfxWhoosh();
      }
    });
  }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal]').forEach(el => io.observe(el));

  /* panel-enter sounds — repeatable in BOTH scroll directions, rate-limited,
     so scrolling up sounds the same as scrolling down */
  let lastEnter = 0;
  const enterIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const now = performance.now();
      if (now - lastEnter > 150) {
        lastEnter = now;
        sfxWhoosh(1200 + Math.random() * 900);
      }
    });
  }, { threshold: .3, rootMargin: '0px 0px -8% 0px' });
  $$('.panel').forEach(p => enterIO.observe(p));

  /* ---------------- CHAPTER RAIL + ACTIVE NAV ---------------- */
  const SECTIONS = [['ch1','CH.1'],['ch2','CH.2'],['ch3','CH.3'],['ch4','CH.4'],['ch5','CH.5'],['ch6','CH.6'],['lab','LAB']];
  const rail = $('#rail');
  SECTIONS.forEach(([id, label]) => {
    const b = document.createElement('button');
    b.dataset.for = id;
    b.setAttribute('aria-label', 'Jump to ' + label);
    b.innerHTML = `<span>${label}</span>`;
    b.addEventListener('click', () =>
      document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }));
    rail.appendChild(b);
  });
  const navLinks = new Map($$('.nav__links a').map(a => [a.getAttribute('href').slice(1), a]));
  let activeSec = '';
  function setActive(id) {
    if (id === activeSec) return;
    activeSec = id;
    $$('#rail button').forEach(b => b.classList.toggle('on', b.dataset.for === id));
    navLinks.forEach((a, key) => a.classList.toggle('on', key === id));
    if (activeSec) sfxTick();
  }
  const secIO = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  SECTIONS.forEach(([id]) => { const s = document.getElementById(id); if (s) secIO.observe(s); });

  /* ---------------- PARALLAX + CINEMATIC + PROGRESS ---------------- */
  const bar = $('#progressBar');
  const arts = $$('.panel .art');
  const cover = $('#cover');
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      try {
        const h = document.documentElement, vh = innerHeight, y = h.scrollTop;

        bar.style.width = (y / (h.scrollHeight - h.clientHeight || 1) * 100).toFixed(2) + '%';

        // cover drifts away as you leave it
        if (cover && y <= vh) {
          cover.style.opacity = String(1 - clamp(y / (vh * .85), 0, 1));
          cover.style.transform = `translateY(${(y * .16).toFixed(1)}px)`;
        }

        if (!reduced) {
          // pass 1 — read all geometry first (avoids layout thrashing)
          const cineOps = [], artOps = [], kanjiOps = [];
          for (const { img, cz } of cine) {
            const r = img.parentElement.getBoundingClientRect();
            if (r.bottom < 0 || r.top > vh) continue;
            const prog = clamp(1 - (r.top + r.height) / (vh + r.height), 0, 1);
            cineOps.push([img, (1 + cz * prog).toFixed(3)]);
          }
          for (const img of arts) {
            const r = img.parentElement.getBoundingClientRect();
            if (r.bottom < -80 || r.top > vh + 80) continue;
            const prog = (vh / 2 - (r.top + r.height / 2)) / vh;
            artOps.push([img, (prog * r.height * .09).toFixed(1) + 'px']);
          }
          for (const k of kanjis) {
            const r = k.parentElement.getBoundingClientRect();
            if (r.bottom < 0 || r.top > vh) continue;
            const prog = (vh / 2 - (r.top + r.height / 2)) / vh;
            kanjiOps.push([k, `translate(-50%,-52%) translateY(${(prog * -70).toFixed(1)}px)`]);
          }
          // pass 2 — write styles
          for (const [el, v] of cineOps) el.style.setProperty('--czs', v);
          for (const [el, v] of artOps) el.style.setProperty('--py', v);
          for (const [el, v] of kanjiOps) el.style.transform = v;
        }
      } finally {
        ticking = false; // never brick the scroll pipeline
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
    void panel.offsetWidth;
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
    flash(.3, true);
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
  const SFX = ['ZAP!!', 'KRA-KOOM!!', 'DOOOM!!', 'RAAAH!!', 'VWOOM!!', 'GOGOGO', 'SHUDAN!!', 'DOKAA!!', 'BZZT!!', 'GUROGURO...', 'TRA-KOOM!!', 'DORU-GAH!!', 'SECOND DRAFT!!', 'STATIC RISE!!'];
  const NARR = [
    'THE WAREHOUSE — 11:47 PM',
    'MEANWHILE, ABOVE THE CITY…',
    'THE DOMAIN TREMBLED.',
    'PAGE 143 — THE TURNING POINT.',
    'NO ONE WROTE WHAT CAME NEXT.',
    'THE CURSE LAUGHS LAST… FOR NOW.',
    'TWO HEARTBEATS. ONE HANDSIGN.',
    'THE INK IS STILL DRYING.',
    'ROUND TWO. NO MERCY.',
    'PAGE 144 — WRITTEN.',
    'TWELVE HOURS EARLIER…',
    'THE STATIC RISES.',
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
    'Then throw FASTER!',
    'WHERE IS YOUR DOMAIN NOW?',
    'The page is WRITTEN.',
    'SEQUELS SELL.',
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

  // first paint (static, no sound before gesture)
  generatePanel(labSeed);
})();
