import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {interpolateFrame} from '../src/framing.js';
import {subdivide,earthGeometry,makeFlight,sampleFlight} from '../src/journey.js';

const model=JSON.parse(fs.readFileSync(new URL('../public/models/rhino.json',import.meta.url)));
const source=subdivide(model.positions),earth=earthGeometry([27,-13]);
const flight=makeFlight(source,earth.positions,390/679,{width:390,fullHeight:844,stageHeight:679,top:20,distance:18});
function projected(seconds,frame){
 const camera=new THREE.PerspectiveCamera(34,1,.1,150);camera.position.set(0,0,18);camera.lookAt(0,0,0);
 camera.setViewOffset(390,frame.height,0,-frame.top,390,844);camera.updateMatrixWorld();
 const out=new Float32Array(source.length);sampleFlight(flight,seconds,out);
 const pixels=[],p=new THREE.Vector3();for(let i=0;i<out.length;i+=3){p.fromArray(out,i).project(camera);pixels.push(p.x*195,p.y*422);}
 return pixels;
}
const displacement=(a,b)=>{let max=0;for(let i=0;i<a.length;i+=2)max=Math.max(max,Math.hypot(a[i]-b[i],a[i+1]-b[i+1]));return max;};

test('mobile layout changes cannot teleport fragment projections at assembly or departure',()=>{
 const animal={height:679,top:20},world={height:371,top:296};
 for(const [from,to,start] of [[animal,world,3],[world,animal,2.8]]){
  const epsilon=.0001,before=projected(start-epsilon,from);
  const oldJump=displacement(before,projected(start+epsilon,to));
  assert.ok(oldJump>100,'fixture must reproduce the previous abrupt projection change');
  const after=projected(start+epsilon,interpolateFrame(from,to,epsilon));
  assert.ok(displacement(before,after)<1,'projection must remain continuous at the layout switch');
  const ending=projected(start+1.2-epsilon,interpolateFrame(from,to,1.2-epsilon));
  assert.ok(displacement(ending,projected(start+1.2+epsilon,to))<1,'finishing the framing tween must also be continuous');
 }
});

test('framing reaches exact destination without overshoot or residual zoom',()=>{
 const from={height:679,top:20},to={height:371,top:296};
 assert.deepEqual(interpolateFrame(from,to,-1),from);
 assert.deepEqual(interpolateFrame(from,to,1.2),to);
 assert.deepEqual(interpolateFrame(from,to,8),to);
 let previous=from;for(let i=1;i<=120;i++){
  const frame=interpolateFrame(from,to,i/100);
  assert.ok(frame.height<=previous.height&&frame.height>=to.height);
  assert.ok(frame.top>=previous.top&&frame.top<=to.top);previous=frame;
 }
});
