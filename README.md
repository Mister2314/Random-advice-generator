# Random Advice Generator

Full-screen landing page with a looping video hero and an advice card fed by a public API.

**Live demo:** https://mister2314.github.io/Random-advice-generator/

<div align="center">

| Desktop | Mobile |
|---|---|
| <img src="docs/shot-desktop.png" alt="Desktop view" width="700"> | <img src="docs/shot-mobile.png" alt="Mobile view" width="290"> |

</div>

## What it does

One button pulls a random quote from `api.adviceslip.com` and drops it into a glass card over a muted, looping background video. The fetch checks `response.ok` before parsing, reads the `slip` object into advice text and ID, and catches network errors instead of failing silently. It was an early exercise in combining media, layout and a real network request on a single static page.

## Tech stack

HTML5 + CSS3 + vanilla JS (Fetch API), deployed on GitHub Pages — no build step.

## Features

- Full-screen looping `<video>` hero, muted and autoplaying
- Advice fetched from `api.adviceslip.com` on button press; `response.ok` checked before parsing
- Advice ID rendered alongside the quote (`Advice #224`)
- Errors caught and logged, not swallowed
- Embedded Spotify playlist (`<iframe>`)

## Run locally

```bash
git clone https://github.com/Mister2314/Random-advice-generator.git
cd Random-advice-generator
npx serve .        # or just open index.html
```

The advice card needs a connection — the API is public and remote.
