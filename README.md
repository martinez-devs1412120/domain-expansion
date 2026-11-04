# ⚡ DOMAIN EXPANSION — Interactive Webtoon

A manga-style interactive website built from the PRATAO art drops: scroll like a
webtoon, tap panels for impact SFX, and unleash a full-screen **DOMAIN EXPANSION**
cut-in. Includes a **Panel Lab** that procedurally generates brand-new panels
(art + crop + bubbles + SFX) from a shareable seed.

> Story & Art — PRATAO · Built as a static site: **no build step, no dependencies.**

---

## 🚀 Run it locally

Just open `index.html` in a browser — or serve it (recommended so fonts/lazy-load behave):

```bash
# from this folder — pick one
python -m http.server 8080
npx serve .
```

Then visit <http://localhost:8080>.

---

## 🌍 Make it LIVE (GitHub Pages — free demo URL)

### Option A — in your browser (easiest)

1. Create a new GitHub repository named **`domain-expansion`** (public).
2. Upload the **contents of this folder** (index.html, css/, js/, assets/, .nojekyll, README.md).
3. Go to **Settings → Pages** → under *Build and deployment* set:
   - Source: **Deploy from a branch**
   - Branch: **main** / folder: **/ (root)**
4. Wait ~1 minute. Your live demo:
   `https://<your-username>.github.io/domain-expansion/`

### Option B — from the terminal

```bash
cd domain-expansion
git init
git add .
git commit -m "Domain Expansion webtoon v1"
# create the repo on github.com first (empty, no README), then:
git remote add origin https://github.com/<your-username>/domain-expansion.git
git branch -M main
git push -u origin main
# enable Pages once:
# Settings → Pages → Source: Deploy from a branch → main / root
```

Live at: `https://<your-username>.github.io/domain-expansion/`

If you have the GitHub CLI: `gh repo create domain-expansion --public --source=. --push` then enable Pages as above (or `gh api` / the web UI).

---

## 🎮 What's inside

| Feature | Where |
|---|---|
| Webtoon vertical scroll with panel reveals + parallax | all chapters |
| Tappable panels → shake, flash, flying SFX, sound | every panel |
| Full-screen DOMAIN EXPANSION cut-in | `D` key, nav button, domain panels |
| Procedural sound (WebAudio, no audio files) | 🔊 toggle / `S` key |
| Seeded **Panel Lab** generator (new panels + text, endlessly) | `#lab` |
| Reading progress bar, chapter nav, to-be-continued stamp | top bar / ch.3 |
| Reduced-motion support + lazy images + mobile responsive | everywhere |

## 🛠 Customizing the story

Every panel is plain HTML in `index.html`. Copy a `<figure class="panel">` block and:

- change the crop: `style="--pos: 50% 30%; --zoom: 1.3"` on the `<img>`
- move/add bubbles: `<div class="bubble b-br">…</div>` (spots: `b-tl b-tr b-tc b-bl b-br b-bc`)
- move/add SFX: `<div class="sfx sfx-pink s1">ZAP!!</div>` (spots: `s1 s2 s3`)
- mark a panel to trigger the cut-in: add `data-domain`
- new chapter: copy a `<section class="chapter">` block
