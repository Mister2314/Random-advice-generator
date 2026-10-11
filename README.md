# Advice Generator

**A full-screen landing experience with a looping video hero and a random advice card fed by a public API.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-mister2314.github.io/Random--advice--generator-2ea44f?style=flat-square&logo=vercel&logoColor=white)](https://mister2314.github.io/Random-advice-generator/)
![HTML5](https://img.shields.io/badge/HTML5-e34f26?style=flat-square&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572b6?style=flat-square&logoColor=white)
![Fetch API](https://img.shields.io/badge/Fetch_API-f7df1e?style=flat-square&logoColor=white)

<p align="center">
  <a href="https://mister2314.github.io/Random-advice-generator/">
    <img src="docs/preview.png" alt="Advice Generator — desktop preview" width="100%">
  </a>
</p>

## Overview

A single-screen site built around atmosphere: a muted, looping video fills the background, a glass card floats over it, and one button pulls a random piece of advice from a public API.

The fetch is handled explicitly — response status is checked before parsing, the returned `slip` is split into its advice text and ID, and both are written into the card. Errors are caught and logged rather than failing silently.

It was an early exercise in combining media, layout and a real network request in one page.

## Features

- Full-screen looping video hero, muted and autoplaying
- Glass card overlay with the advice text
- Random advice fetched from `api.adviceslip.com` on button press
- Displays the advice ID alongside the text
- Explicit error handling around the network request
- Embedded Spotify playlist
- Roboto typography, responsive layout

## Tech Stack

| Layer | Technology |
| --- | --- |
| Markup | HTML5 (video, iframe) |
| Styling | CSS3 |
| Logic | Vanilla JavaScript, Fetch API |
| Deploy | GitHub Pages |

## Screenshots

| Desktop | Mobile |
| :---: | :---: |
| <img src="docs/preview.png" alt="Desktop view"> | <img src="docs/preview-mobile.png" alt="Mobile view" width="230"> |

## Getting Started

No build step and no dependencies — clone the repo and open the entry file, or serve the folder locally:

```bash
git clone https://github.com/Mister2314/Random-advice-generator.git
cd Random-advice-generator

# Option 1 — open it directly
start index.html      # Windows
open  index.html      # macOS

# Option 2 — serve it locally
npx serve .
```

## Project Structure

```
index.html — video hero, advice card and Spotify embed
assets/js/index.js — button handler, fetch, response handling
assets/css/style.css — hero layout and card styling
assets/video/ — background video asset
```

## Author

**Xəyal Hüseynli** — Junior Front-End Developer

[Portfolio](https://hypnosdev.vercel.app) · [GitHub](https://github.com/Mister2314) · [LinkedIn](https://www.linkedin.com/in/x%C9%99yal-h%C3%BCseynli-3487b91ba/) · [xeyalhuseynli06@gmail.com](mailto:xeyalhuseynli06@gmail.com)
