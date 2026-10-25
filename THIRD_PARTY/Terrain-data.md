# Terrain and infographic data

The habitat relief drawings use locally stored, sampled numeric elevation grids from Mapzen Terrain Tiles on AWS Open Data. The reference image supplied by the user is inspiration for the geometric presentation; no stock illustration, watermark, photograph or protected chart has been copied into the project.

- Dataset registry: https://registry.opendata.aws/terrain-tiles/
- Terrarium encoding and public S3 endpoint: https://github.com/tilezen/joerd/blob/master/docs/formats.md
- Attribution / underlying source terms: https://github.com/tilezen/joerd/blob/master/docs/attribution.md
- SRTM and GMTED2010 data courtesy of the U.S. Geological Survey.
- Global ETOPO1 data: DOC/NOAA/NESDIS/NCEI, U.S. Department of Commerce.
- Mapzen Terrain Tiles are the aggregator and tile provider.

Each `public/terrain/*.json` file retains its exact source URL, tile coordinates, geographic bounds, sampled point, retrieval timestamp, units and credit. The samples for this atlas are in Africa, Asia and adjacent tropical / Pacific waters; regional source terms for unrelated territories are not asserted to cover these samples.

## Processing

`scripts/fetch-terrain.py` decodes Terrarium RGB numerical data as `R × 256 + G + B / 256 − 32768` metres. Each tile is reduced to 33 × 33 nearest-pixel samples. Display meshes use every second row and column; contours use the full stored grid. West–east profiles use the central sampled row. The underlying data have mixed source dates and resolutions; retrieval date is not a survey date.

Relief is normalized independently per tile to remain readable in a small square. Absolute vertical scale is therefore deliberately amplified, not a common physical 3D scale. The captions disclose this. Tile width is approximate at the tile's middle latitude. These are representative regional landscape / seafloor samples, not the full animal range, sighting records, exact occupied habitat, animal dive depth, live readings, or navigational maps.

## Population graph

Only the black rhinoceros has a population chart, because the supplied atlas data contain three dated estimates: 2,410 (1995), 6,195 (2022), 6,788 (2024). The chart displays these three independent reported estimates as categorical columns. It does not invent intervening years or imply a smooth annual series. Original citations are retained in `src/data.js` and `SOURCES.md`.
