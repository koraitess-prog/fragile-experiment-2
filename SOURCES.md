# Field Atlas research notes

Content researched on **25 October 2026**. Population totals retain the scope/date stated by the underlying source; a research date is not an estimate date. The existing project's conservation categories refer to IUCN references, while US ESA and other legal designations can differ.

All values are editable in `src/data.js`. Each numeric fact has a source link in the interface. Unknown population totals remain unknown. Regional marker coordinates are an authored schematic overview and must not be interpreted as official IUCN range polygons, migration tracks or observations.

## Species sources

- **Black rhinoceros:** [Save the Rhino population figures](https://www.savetherhino.org/rhino-info/population-figures/), [species profile](https://www.savetherhino.org/rhino-info/rhino-species/black-rhinos/), [International Rhino Foundation — State of the Rhino](https://rhinos.org/about-rhinos/state-of-the-rhino/). The 6,788 figure refers to the end of 2024, reported in 2025. The chart uses separately reported points for 1995, 2022 and 2024, with no interpolated annual estimates.
- **Hawksbill sea turtle:** [NOAA profile](https://www.fisheries.noaa.gov/species/hawksbill-turtle), [NOAA 2023 framework](https://www.fisheries.noaa.gov/s3/2023-09/Sea-Turtle-Framework-for-ESA-Sections-7.pdf), [Sea Turtle Conservancy](https://conserveturtles.org/species/hawksbill/). Population refers to nesting females, not all turtles; the quoted source does not state an estimate year.
- **Tapanuli orangutan:** [IUCN species description, 2017](https://iucn.org/news/species/201711/new-orangutan-species-described-indonesia), [IUCN APES Atlas](https://apesatlas.iucnapesportal.org/index.php/Tapanuli_Orangutan), [SOS — where we work](https://www.orangutans-sos.org/our-work/where-we-work/). The approximately 1,100 km² figure describes the forest area cited at species description in 2017, not a current measured range or current remaining habitat area. Fewer than 800 is a broad published estimate, not a live census.
- **Chinese pangolin:** [IUCN SSC Pangolin Specialist Group profile](https://pangolinsg.org/portfolio/chinese-pangolin/), [the living pangolin species](https://pangolinsg.org/pangolins/), [ZSL conservation context](https://www.zsl.org/what-we-do/species/why-are-pangolins-endangered). The distribution is broad and does not imply confirmed occupancy everywhere. The quoted gestation range is species-specific.
- **Philippine eagle:** [Philippine Eagle Foundation](https://www.philippineeaglefoundation.org/philippine-eagle). About 400 pairs is not an individual count, and no census year is provided by that page. Reported territory sizes depend on prey availability. [IUCN conservation-status reference](https://doi.org/10.2305/IUCN.UK.2025-2.RLTS.T22696012A273773083.en).
- **Great hammerhead:** [Shark Research Institute](https://www.sharks.org/great-hammerhead-shark-sphyrna-mokarran), [Georgia Aquarium](https://www.georgiaaquarium.org/animal/great-hammerhead-shark/), [Marine Megafauna Foundation](https://marinemegafauna.org/species/great-hammerhead), [Save Our Seas](https://saveourseas.com/worldofsharks/species/great-hammerhead-shark). Possible maximum size is distinguished from the encounter-size range; no remaining-individual total is inferred from decline percentages.
- **Sunda tiger:** [WWF](https://www.worldwildlife.org/species/tiger/sunda-tiger/), [ZSL Sumatran tiger conservation](https://www.zsl.org/what-we-do/projects/sumatran-tiger-conservation). The body-mass range is a rounded conversion of WWF's range in pounds. The less-than-400 estimate has no stated estimate year on the cited source and is not presented as a current census.
- **Saola:** [WWF](https://www.worldwildlife.org/species/saola/), [Saola Working Group discovery account](https://www.savethesaola.org/the-saola/saolas-remarkable-discovery/), [WCS Laos](https://programs.wcs.org/laos/Saving-Wildlife/Saola.aspx). Scientific discovery is distinguished from local knowledge. Population remains unknown; no speculative remaining count is used.
- **Oceanic manta ray:** [NOAA profile](https://www.fisheries.noaa.gov/species/giant-manta-ray), [NOAA 2024 framework](https://www.fisheries.noaa.gov/s3/2024-04/Giant-Manta-Ray-Section-7-Framework-2024-0.pdf), [Florida Fish and Wildlife profile](https://myfwc.com/research/saltwater/sharks-rays/ray-species/giant-manta/), [IUCN status](https://doi.org/10.2305/IUCN.UK.2020-3.RLTS.T198921A68632946.en). The documented disc-width maximum is distinguished from larger anecdotal reports. Estimated lifetime pup production is identified as an estimate. A global population count is not available.
- **Blue whale:** [NOAA](https://www.fisheries.noaa.gov/species/blue-whale), [NAMMCO](https://nammco.no/blue-whale/), [IUCN Cetacean Specialist Group](https://iucn-csg.org/red-list-status-of-cetaceans/). NOAA upper size limits are rounded metric conversions and vary by population. The broad global population estimate cites Cooke (2018); mature-individual counts have a different scope.

## Geography

Natural Earth 1:110m coastline data:

- [Project and public-domain terms](https://www.naturalearthdata.com/about/terms-of-use/)
- [Source GeoJSON](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_coastline.geojson)

Only coastlines are displayed, not national boundaries. Hemisphere clipping is a rendering operation. The white markers indicate broad habitat regions; they are not externally sourced point observations or real-time data.

## Editorial reference

[In Pieces — 30 species, 30 pieces](https://www.species-in-pieces.com/), by Bryan James. The original exhibition's profile discovery, conservation information and navigation were studied, including the user-provided source reference. No source code, animal illustrations or written passages were copied into this site.

## Regional elevation and topographic drawings

- **Mapzen Terrain Tiles / AWS Open Data:** https://registry.opendata.aws/terrain-tiles/
- **Tilezen Terrarium format and endpoint:** https://github.com/tilezen/joerd/blob/master/docs/formats.md
- **Attribution and source terms:** https://github.com/tilezen/joerd/blob/master/docs/attribution.md
- **Credits:** Mapzen; SRTM/GMTED2010 courtesy USGS; ETOPO1 courtesy NOAA.
- **Scope:** representative regional tiles, not complete species distributions or individual animal locations. Elevations are sampled; visual relief is independently amplified. Marine examples show the seabed, not swimming depth. Exact source tile URLs, bounds and retrieval dates are in each `public/terrain/*.json` file.

Processing details and usage notes: `THIRD_PARTY/Terrain-data.md`. No stock-reference imagery is included.
