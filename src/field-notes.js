import {species} from './data.js';

// Atlas-only information layer for every species. The main FRAGILE app does
// not import this file; its models, movements and transitions are independent.
// Research references and full estimate notes remain in data.js / SOURCES.md.
export const fieldNotes = Object.fromEntries(species.map(animal => [animal.id, {
  population: animal.population,
  populationScope: animal.id === 'whale'
    ? 'individuals worldwide · 2018 estimate'
    : animal.unit,
  conservationStatus: animal.status,
  region: animal.region,
  habitat: animal.biome,
  threats: [...animal.threats],
}]));
