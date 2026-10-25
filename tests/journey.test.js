import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {species} from '../src/data.js';
import {subdivide,earthGeometry,geographic,makeFlight,sampleFlight,JOURNEY_SECONDS} from '../src/journey.js';

const area=p=>new THREE.Vector3(...p.slice(3,6)).sub(new THREE.Vector3(...p.slice(0,3))).cross(new THREE.Vector3(...p.slice(6,9)).sub(new THREE.Vector3(...p.slice(0,3)))).length()/2;
test('child triangles tile their original face without changing the source model',()=>{
 const source=[0,0,0,4,0,0,0,2,0],children=subdivide(source);
 assert.deepEqual(source,[0,0,0,4,0,0,0,2,0]);assert.equal(children.length,36);
 let sum=0;for(let i=0;i<36;i+=9)sum+=area(children.slice(i,i+9));assert.equal(sum,area(source));
});
test('each species has 880 persistent destinations and reaches Earth exactly, without NaN',()=>{
 for(const profile of species){
  const model=JSON.parse(fs.readFileSync(new URL(`../public/models/${profile.id}.json`,import.meta.url))),source=subdivide(model.positions),earth=earthGeometry(profile.focus),flight=makeFlight(source,earth.positions,1.6),out=new Float32Array(source.length);
  assert.equal(source.length/9,880);assert.equal(earth.positions.length,source.length);
  const focused=geographic(profile.focus,1).applyQuaternion(earth.rotation);assert.ok(focused.distanceTo(new THREE.Vector3(0,0,1))<1e-6);
  sampleFlight(flight,0,out);assert.deepEqual(out,source);
  for(const t of [.1,1.2,2.8,4.1,6.2,JOURNEY_SECONDS]){sampleFlight(flight,t,out);assert.ok(out.every(Number.isFinite));}
  assert.deepEqual(out,earth.positions);
  const reverse=makeFlight(earth.positions,source);sampleFlight(reverse,JOURNEY_SECONDS,out);assert.deepEqual(out,source);earth.geometry.dispose();
 }
 assert.throws(()=>makeFlight(new Float32Array(9),new Float32Array(18)),/exactly one destination/);
});

test('the viewport-aligned cloud fills portrait and landscape screens and exits every edge',()=>{
 const source=subdivide(JSON.parse(fs.readFileSync(new URL('../public/models/rhino.json',import.meta.url))).positions);
 for(const [width,fullHeight,stageHeight,top] of [[1280,720,477,75],[390,844,604,70]])for(const direction of [[0,0,1],[-.48,.23,.85]]){
  const distance=14,camera=new THREE.PerspectiveCamera(34,width/stageHeight,.1,150);
  camera.position.set(...direction).normalize().multiplyScalar(distance);camera.lookAt(0,0,0);camera.updateMatrixWorld();camera.setViewOffset(width,stageHeight,0,-top,width,fullHeight);
  const flight=makeFlight(source,source,width/stageHeight,{orientation:camera.quaternion,distance,width,fullHeight,stageHeight,top}),hits={left:0,right:0,top:0,bottom:0,inside:0};
  for(let i=0;i<flight.cloud.length;i+=3){const p=new THREE.Vector3().fromArray(flight.cloud,i).project(camera);if(p.x<-1)hits.left++;if(p.x>1)hits.right++;if(p.y>1)hits.top++;if(p.y<-1)hits.bottom++;if(Math.abs(p.x)<=1&&Math.abs(p.y)<=1)hits.inside++;}
  for(const edge of ['left','right','top','bottom'])assert.ok(hits[edge]>25,`${edge}: ${JSON.stringify(hits)}`);
  assert.ok(hits.inside>250&&hits.inside<650,JSON.stringify(hits));
 }
});
