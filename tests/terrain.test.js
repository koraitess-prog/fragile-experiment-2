import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {species} from '../src/data.js';
import {reliefMarkup,contourSegments,populationHistoryMarkup} from '../src/terrain-panel.js';

test('every species has a bounded, attributed, offline sample of real terrain data',()=>{
 for(const animal of species){
  const data=JSON.parse(fs.readFileSync(new URL(`../public/terrain/${animal.id}.json`,import.meta.url)));
  assert.equal(data.elevations.length,33);assert.ok(data.elevations.every(row=>row.length===33&&row.every(Number.isFinite)));
  const values=data.elevations.flat();assert.equal(data.min,Math.min(...values));assert.equal(data.max,Math.max(...values));
  assert.ok(data.samplePoint[0]>=data.bounds.west&&data.samplePoint[0]<=data.bounds.east);assert.ok(data.samplePoint[1]>=data.bounds.south&&data.samplePoint[1]<=data.bounds.north);
  assert.match(data.sourceUrl,/^https:\/\/s3.amazonaws.com\/elevation-tiles-prod\/terrarium\//);assert.match(data.attribution,/USGS.*NOAA/);assert.ok(data.widthKm>0);
  for(const mode of ['relief','contours','profile']){const html=reliefMarkup(data,mode);assert.match(html,/<svg/);assert.ok(!/NaN|Infinity|undefined/.test(html));}
  for(const line of contourSegments(data))for(const p of line)assert.ok(p.every(v=>Number.isFinite(v)&&v>=19.999&&v<=240.001));
 }
});

test('flat samples produce no invented contours, and only documented population histories are charted',()=>{
 assert.deepEqual(contourSegments({min:10,max:10,elevations:[[10,10],[10,10]]}),[]);
 for(const animal of species){const chart=populationHistoryMarkup(animal);if(animal.id!=='rhino')assert.equal(chart,'');else for(const estimate of animal.history){assert.ok(chart.includes(estimate.year));assert.ok(chart.includes(estimate.value.toLocaleString('en')));}}
});

test('saddle contours keep disconnected high corners apart when the centre is below the level',()=>{
 const segments=contourSegments({min:0,max:10,elevations:[[0,6],[6,0]]});
 const near=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<1e-6;
 const top=[20+220*5/6,20],right=[240,20+220/6];
 assert.ok(segments.some(([a,b])=>(near(a,top)&&near(b,right))||(near(a,right)&&near(b,top))));
});
