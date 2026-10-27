# Panchal Gases — website

Industrial gas cylinder supplier in Jarod, Vadodara (Gujarat): Oxygen, Argon,
Nitrogen, CO₂ and Dissolved Acetylene.

**Live:** https://panchalgases7.netlify.app

A fast single-page site in plain HTML, CSS and JavaScript (no frameworks, no
build step):

- `index.html` – the page
- `css/style.css` – styles; `fonts/` – self-hosted variable font
- `js/motion.js` – hand-written scroll / reveal animations
- `js/script.js` – the enquiry slip: builds the message in the browser and hands
  it to the visitor's own mail app (nothing is sent to any server)
- `js/india-states.js` – state list for the enquiry slip
- `_headers` – Netlify security headers (strict Content-Security-Policy etc.)

## Run / deploy

Open `index.html` through any static server (e.g. `npx serve .`), or deploy
the folder as-is on Netlify (drag and drop, or connect this repository; no
build command, publish directory `.`).
