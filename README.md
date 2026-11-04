# FRAGILE — Experiment 2

A separate, minimalist atlas of endangered species: pure white triangular wireframe sculptures on black, species-specific movement, and a fragment journey into a globe showing indicative habitat regions.

**Website:** https://koraitess-prog.github.io/fragile-experiment-2/

This experiment is independent of the original FRAGILE site at https://koraitess-prog.github.io/fragile/.

## Explore

- Drag an animal to rotate it; click to discover its world.
- Explore the globe, regional terrain studies, population context and threats.
- On desktop, click the globe or CLICK FOR NEXT ANIMAL to assemble the next species.
- On phones, the information becomes a full-width vertical reading journey. Drag the globe to explore; use the fixed NEXT ANIMAL text action to advance. Globe taps do not switch species.
- The collection allows direct species selection.

## Run locally

Requires Node.js 22.12 or later (the deployment uses Node.js 24).

```sh
npm ci
npm run dev
npm test
npm run build
```

Local preview: http://127.0.0.1:4180/

## Sources and scope

See [SOURCES.md](SOURCES.md) and [THIRD_PARTY](THIRD_PARTY). Population figures have different scopes and dates; they are not live counts. Globe markers indicate broad example regions, not exact range boundaries or individual animals. Terrain graphics use attributed regional elevation samples, with amplified relief. Animal movement is an artistic interpretation.

## Deployment

GitHub Pages deploys this repository independently on pushes to `main`. The workflow builds with the repository-specific base path, tests the source and uploads only `dist`.

Prepared from local atlas checkpoint `2aa04a0`. Local QA captures and editor configuration are retained in the development workspace and excluded from this publication snapshot.

Mobile fragment journeys interpolate responsive camera framing continuously, preserving the existing breakup/reassembly choreography. The regression suite includes projection continuity checks at both responsive transitions.

## Opening

First entry in a tab session counts to the dated IUCN total of 18,825 assessed threatened animal species, then types a short explanation of a growing selection of threatened life. The scope is assessed animal species classified CR, EN or VU; WWF Japan’s table reproducing IUCN Red List 2026-1 (9 July 2026) is linked on screen. This excludes plants and fungi and is not a complete count of all unassessed animals. Enter opens the loaded sculpture; Skip is always available. Reduced motion shows the final statistic and text immediately. Add `?intro=1` to replay the opening for review, or `?intro=0` to skip.


### Slower typography-to-sculpture opening
The counter is larger and takes 5.4 seconds, then holds for 1.2 seconds before a slower typed message. The message does not fix the collection size. ENTER triangulates the actual IBM Plex Mono Light glyph outlines at their rendered positions and sends them through the existing 6.8-second fragment journey into the first animal. Temporary display subdivisions settle gently into the original wireframe. Skip and reduced motion enter directly. Animal models, ordinary transitions and the original FRAGILE site are unchanged.

The locally derived font outline data retains the existing IBM Plex Mono OFL license in THIRD_PARTY. The optional Python conversion script uses fontTools only at build time.

Source checkpoint: ea6b311a81275f631a2c2b6c3b8b09cf3bed8035 (opening); formatting cleanup follows locally.
