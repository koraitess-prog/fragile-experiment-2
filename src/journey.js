import * as THREE from 'three';

export const JOURNEY_SECONDS = 6.8;
export const smooth = t => { t = Math.max(0, Math.min(1, t)); return t*t*(3-2*t); };
export const random = n => { const x = Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); };

// Four children tile each original face exactly. No model or topology is edited.
export function subdivide(positions) {
  const out = [];
  for (let i=0; i<positions.length; i+=9) {
    const a=Array.from(positions.slice(i,i+3)), b=Array.from(positions.slice(i+3,i+6)), c=Array.from(positions.slice(i+6,i+9));
    const mid=(p,q)=>p.map((v,j)=>(v+q[j])/2), ab=mid(a,b), bc=mid(b,c), ca=mid(c,a);
    out.push(...a,...ab,...ca,...ab,...b,...bc,...ca,...bc,...c,...ab,...bc,...ca);
  }
  return new Float32Array(out);
}

export function geographic([lon,lat], radius=2.25) {
  lon*=Math.PI/180; lat*=Math.PI/180;
  return new THREE.Vector3(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon)).multiplyScalar(radius);
}

export function earthGeometry(focus, orientation=new THREE.Quaternion()) {
  // 22 × 20 × 2 = 880 actual triangular faces: one destination per child face.
  const indexed=new THREE.SphereGeometry(2.25,22,21), geometry=indexed.toNonIndexed(); indexed.dispose();
  const rotation=new THREE.Quaternion().setFromUnitVectors(geographic(focus,1),new THREE.Vector3(0,0,1));
  rotation.premultiply(orientation); geometry.applyQuaternion(rotation);
  return {positions:geometry.attributes.position.array.slice(),rotation,geometry};
}

export function makeFlight(source,target,aspect=1,view={}) {
  if(source.length!==target.length) throw Error('Every fragment must have exactly one destination.');
  const count=source.length/9, cloud=new Float32Array(count*3), spins=new Float32Array(count*3);
  const orientation=view.orientation??new THREE.Quaternion(),distance=view.distance??12;
  const w=view.width??1000,h=view.fullHeight??w/aspect,stageHeight=view.stageHeight??h,top=view.top??0;
  const unitsPerPixel=2*distance*Math.tan((view.fov??34)*Math.PI/360)/stageHeight;
  const columns=Math.ceil(Math.sqrt(count*w/h)),rows=Math.ceil(count/columns),point=new THREE.Vector3();
  for(let i=0;i<count;i++) {
    // A jittered viewport grid fills the entire image rather than a central band.
    // Its outer cells intentionally travel beyond all four screen edges.
    const x=((i%columns+random(i+4))/columns*2-1)*1.42;
    const y=((Math.floor(i/columns)+random(i+91))/rows*2-1)*1.42;
    point.set(x*w*.5*unitsPerPixel,y*h*.5*unitsPerPixel+(top+stageHeight/2-h/2)*unitsPerPixel,(random(i+14)-.5)*distance*.28).applyQuaternion(orientation);
    point.toArray(cloud,i*3);
    spins.set([(random(i+1)-.5)*7,(random(i+2)-.5)*7,(random(i+3)-.5)*7],i*3);
  }
  return {source:source.slice(),target:target.slice(),cloud,spins,count};
}

const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),center=new THREE.Vector3(),end=new THREE.Vector3(),v=new THREE.Vector3(),spin=new THREE.Euler();
export function sampleFlight(flight,seconds,out) {
  const {source,target,cloud,spins,count}=flight;
  if(seconds<=0){out.set(source);return;}
  if(seconds>=JOURNEY_SECONDS){out.set(target);return;}
  for(let i=0;i<count;i++) {
    const offset=i*9, delay=random(i+23)*.48, leave=smooth((seconds-delay)/2.0), arrive=smooth((seconds-3.0-random(i+37)*.65)/2.65);
    center.set(0,0,0);end.set(0,0,0);
    for(let j=0;j<3;j++){center.add(a.fromArray(source,offset+j*3));end.add(a.fromArray(target,offset+j*3));}
    center.multiplyScalar(1/3);end.multiplyScalar(1/3);
    b.fromArray(cloud,i*3);c.copy(center).lerp(b,leave).lerp(end,arrive);
    const suspended=leave*(1-arrive), shrink=1-.5*suspended;
    spin.set(spins[i*3]*suspended,spins[i*3+1]*suspended,spins[i*3+2]*suspended);
    for(let j=0;j<3;j++) {
      v.fromArray(source,offset+j*3).sub(center);a.fromArray(target,offset+j*3).sub(end);v.lerp(a,arrive).multiplyScalar(shrink).applyEuler(spin).add(c);
      v.toArray(out,offset+j*3);
    }
  }
}
