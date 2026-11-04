import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {glyphTriangles,refinement} from '../src/opening-fragments.js';
import {makeFlight,sampleFlight,JOURNEY_SECONDS} from '../src/journey.js';
const font=new FontLoader().parse(JSON.parse(readFileSync(new URL('../public/fonts/ibm-plex-mono-light-outline.json',import.meta.url))));
const area=data=>{let sum=0;for(let i=0;i<data.length;i+=9)sum+=Math.abs((data[i+3]-data[i])*(data[i+7]-data[i+1])-(data[i+6]-data[i])*(data[i+4]-data[i+1]))/2;return sum;};
test('real font outlines retain counters and triangulate into finite faces',()=>{
 for(const char of '49,505Species are threatened with extinction.FRAGILE reveals a fraction of their world.'){
  const data=glyphTriangles(font,char,100);assert.equal(data.length%9,0);assert.ok(data.every(Number.isFinite));if(char!==' ')assert.ok(area(data)>0);
 }
 const zero=font.generateShapes('0',100);assert.ok(zero.some(shape=>shape.holes.length));
});
test('exact display refinement preserves area and follows deformation coherently',()=>{
 const source=new Float32Array([0,0,0,4,0,0,0,3,0]);
 for(const count of [1,2,3,17,880]){
  const map=refinement(source,count),out=map.apply(source);assert.equal(out.length,count*9);assert.ok(Math.abs(area(out)-6)<.00001);
  const moved=source.map((v,i)=>v+(i%3===0?7:i%3===1?-2:3)),result=map.apply(moved);
  result.forEach((v,i)=>assert.ok(Math.abs(v-out[i]-(i%3===0?7:i%3===1?-2:3))<.00001));
 }
 assert.throws(()=>refinement(source,.5));
});
test('typography fragments use the existing flight and reach exact animal destinations',()=>{
 const from=new Float32Array(glyphTriangles(font,'9',100)),raw=new Float32Array([0,0,0,1,0,0,0,1,0]);
 const to=refinement(raw,from.length/9).apply(raw),flight=makeFlight(from,to),out=from.slice();
 sampleFlight(flight,0,out);assert.deepEqual(out,from);
 sampleFlight(flight,3,out);assert.ok(out.every(Number.isFinite));assert.notDeepEqual(out,from);
 sampleFlight(flight,JOURNEY_SECONDS,out);assert.deepEqual(out,to);
});
