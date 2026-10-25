import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {species,speciesIndex,sourceList} from '../src/data.js';
import {mapMarkup,project} from '../src/map.js';
import {faceData,correspondence} from '../src/sculpture/geometry.js';
import {createFragments} from '../src/sculpture/fragments.js';
import {createNaturalMotion} from '../src/sculpture/natural-motion.js';
const models=species.map(s=>JSON.parse(fs.readFileSync(new URL(`../public/models/${s.id}.json`,import.meta.url))));
test('all ten profiles retain their identities and supply contextual facts and sources',()=>{
 assert.deepEqual(species.map(s=>s.id),['rhino','turtle','orangutan','pangolin','eagle','shark','tiger','saola','manta','whale']);
 assert.equal(speciesIndex('not-a-species'),0);assert.equal(speciesIndex('whale'),9);
 for(const s of species){assert.ok(s.title.length&&s.story.length&&s.region.length&&s.biome.length);assert.equal(s.facts.length,3);assert.ok(s.note.length>30);assert.ok(['CR','EN'].includes(s.code));assert.ok(sourceList(s).length>=2);for(const ref of sourceList(s))assert.equal(new URL(ref.url).protocol,'https:');for(const point of [...s.points,s.focus])assert.ok(Math.abs(point[0])<=180&&Math.abs(point[1])<=90);}
 for(const id of ['pangolin','shark','saola','manta'])assert.equal(species.find(s=>s.id===id).population,'Unknown');
 assert.match(species.find(s=>s.id==='turtle').unit,/females only/);assert.match(species.find(s=>s.id==='eagle').unit,/pairs/);
});
test('actual coastlines project without NaN or back-face map markers',()=>{
 const coast=JSON.parse(fs.readFileSync(new URL('../public/coastline.geojson',import.meta.url)));assert.equal(coast.type,'FeatureCollection');assert.ok(coast.features.length>50);
 for(const s of species)for(const yaw of [0,60,180,300]){const svg=mapMarkup(coast,s,yaw);assert.ok(!/NaN|Infinity|undefined/.test(svg));assert.match(svg,/map-coast/);}
 assert.ok(Math.abs(project([25,-12],[25,-12])[2]-1)<1e-10);assert.ok(project([-155,12],[25,-12])[2]<0);
});
test('all animal models remain closed triangular meshes',()=>{
 for(const m of models){const edges=new Map(),vertices=new Set();assert.equal(m.positions.length,220*9);for(let f=0;f<220;f++){const p=Array.from({length:3},(_,i)=>m.positions.slice(f*9+i*3,f*9+i*3+3).join(','));p.forEach(v=>vertices.add(v));for(let j=0;j<3;j++){const key=[p[j],p[(j+1)%3]].sort().join('|');edges.set(key,(edges.get(key)||0)+1);}}assert.equal(vertices.size,112);assert.ok([...edges.values()].every(n=>n===2));}
});
test('arbitrary species selection preserves captured poses and exact reassembly endpoints',()=>{
 const slots=correspondence(...models.map(faceData));
 for(let from=0;from<10;from++)for(let to=0;to<10;to++){if(from===to)continue;const pairs=slots.map(p=>[p[from],p[to]]),fragments=createFragments(pairs),motion=createNaturalMotion(pairs);fragments.update(0);motion.apply(fragments.positions,0,38);const source=fragments.positions.slice();fragments.prepare(0,new THREE.Vector3(-2,0,0),{},source);let error=0;
  fragments.update(0,0);motion.apply(fragments.positions,0,38,0,true);for(let i=0;i<source.length;i++)error=Math.max(error,Math.abs(source[i]-fragments.positions[i]));assert.ok(error<1e-6);
  for(const elapsed of [.2,1,2.5,3.8,5.5]){fragments.update(0,elapsed);motion.apply(fragments.positions,0,38+elapsed,elapsed,true);assert.ok(fragments.positions.every(Number.isFinite));}
  const arrival=fragments.positions.slice();fragments.update(1);motion.apply(fragments.positions,1,43.5);for(let i=0;i<arrival.length;i++)assert.ok(Math.abs(arrival[i]-fragments.positions[i])<1e-6);assert.equal(fragments.mesh.material.wireframe,true);fragments.dispose();
 }
});
