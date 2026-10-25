# FRAGILE — Experiment 2

A separate, minimalist atlas of endangered species: pure white triangular wireframe sculptures on black, species-specific movement, and a fragment journey into a globe showing indicative habitat regions.

**Website:** https://koraitess-prog.github.io/fragile-experiment-2/

This experiment is independent of the original FRAGILE site at https://koraitess-prog.github.io/fragile/.

## Explore

- Drag an animal to rotate it; click to discover its world.
- Explore the globe, regional terrain studies, population context and threats.
- Click the globe or CLICK FOR NEXT ANIMAL to assemble the next species.
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

Prepared from local atlas checkpoint `89f8b6c90bea152fb528ff54d9fdb08a70b23473`. Local QA captures and editor configuration are retained in the development workspace and excluded from this publication snapshot.
