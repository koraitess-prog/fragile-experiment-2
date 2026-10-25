import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {faceData,correspondence} from './sculpture/geometry.js';
import {createFragments} from './sculpture/fragments.js';
import {createNaturalMotion} from './sculpture/natural-motion.js';
import {DURATION} from './sculpture/transitions.js';
export function thumbnail(model){
 const camera=new THREE.PerspectiveCamera(35,1.5,.1,100);camera.position.set(-7,3.3,10);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 const points=[];for(let i=0;i<model.positions.length;i+=3)points.push(new THREE.Vector3(...model.positions.slice(i,i+3)).project(camera));
 const box=new THREE.Box3().setFromPoints(points),scale=Math.min(108/(box.max.x-box.min.x),67/(box.max.y-box.min.y)),center=box.getCenter(new THREE.Vector3());let d='';
 for(let i=0;i<points.length;i+=3){for(let j=0;j<3;j++){const p=points[i+j];d+=(j?'L':'M')+(60+(p.x-center.x)*scale).toFixed(2)+','+(40-(p.y-center.y)*scale).toFixed(2);}d+='Z';}
 return`<svg viewBox="0 0 120 80" aria-hidden="true"><path class="thumb-lines" d="${d}"/></svg>`;
}
export function createViewer(container,models,initial,onMidpoint,onComplete){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x050505);renderer.outputColorSpace=THREE.SRGBColorSpace;container.replaceChildren(renderer.domElement);
 const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root);root.rotation.y=.08;
 const camera=new THREE.PerspectiveCamera(34,1,.1,100),target=new THREE.Vector3(0,.08,0);camera.position.set(-7,3.8,11);
 const controls=new OrbitControls(camera,container);controls.target.copy(target);controls.enableDamping=true;controls.dampingFactor=.075;controls.rotateSpeed=.7;controls.enablePan=false;controls.enableZoom=false;controls.minPolarAngle=Math.PI/9;controls.maxPolarAngle=Math.PI*.46;controls.touches.TWO=null;controls.mouseButtons.RIGHT=null;controls.mouseButtons.MIDDLE=null;
 const pairs=correspondence(...models.map(faceData)),origin=performance.now()/1000;let active=initial,pair,fragments,motion,busy=false,start=0,midpoint=false,queued=null,raf=0,disposed=false,frames=0;
 function setup(a,b){if(fragments){root.remove(fragments.mesh);fragments.dispose();}pair=pairs.map(p=>[p[a],p[b]]);fragments=createFragments(pair);motion=createNaturalMotion(pair,{tigerClockOrigin:origin,orangutanClockOrigin:origin});root.add(fragments.mesh);}
 setup(active,(active+1)%models.length);
 const direction=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(),p=new THREE.Vector3();
 function fit(dt){root.updateMatrixWorld(true);direction.copy(camera.position).sub(target).normalize();right.crossVectors(camera.up,direction).normalize();up.crossVectors(direction,right);const tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));let radius=3;
  for(let i=0;i<fragments.positions.length;i+=3){p.fromArray(fragments.positions,i).applyMatrix4(root.matrixWorld).sub(target);const depth=p.dot(direction);radius=Math.max(radius,depth+Math.abs(p.dot(right))/(tan*camera.aspect*.84),depth+Math.abs(p.dot(up))/(tan*.78));}
  const current=camera.position.distanceTo(target),distance=radius>current?radius:THREE.MathUtils.damp(current,radius,4,dt);camera.position.copy(target).addScaledVector(direction,distance);camera.lookAt(target);
 }
 function resize(){const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
 const observer=new ResizeObserver(resize);observer.observe(container);resize();let previous=0;
 function select(index){if(index===active&&!busy)return;if(busy){queued=index;return;}if(reduced){active=index;setup(active,(active+1)%models.length);onMidpoint(index);onComplete(index);return;}
  const captured=fragments.positions.slice(),from=active;setup(from,index);root.updateMatrixWorld(true);camera.updateMatrixWorld();const orientation=root.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(camera.getWorldQuaternion(new THREE.Quaternion()));fragments.prepare(0,new THREE.Vector3(-2,0,0),{aspect:camera.aspect,orientation},captured);busy=true;start=performance.now()/1000;midpoint=false;queued=null;targetIndex=index;
 }
 let targetIndex=initial;
 function render(ms){if(disposed)return;raf=requestAnimationFrame(render);if(document.hidden)return;const t=ms/1000,dt=Math.min(.05,previous?t-previous:1/60);previous=t;
  const elapsed=busy?t-start:-1;let nextSelection=null;
  if(busy&&elapsed>=DURATION){active=targetIndex;busy=false;setup(active,(active+1)%models.length);if(!midpoint){midpoint=true;onMidpoint(active);}onComplete(active);if(queued!==null&&queued!==active){nextSelection=queued;queued=null;}}
  if(busy&&!midpoint&&elapsed>=2.55){midpoint=true;onMidpoint(targetIndex);}
  const clock=reduced?origin:t;fragments.update(0,busy?Math.min(DURATION,t-start):-1);motion.apply(fragments.positions,0,clock,busy?t-start:-1,busy);fragments.mesh.geometry.attributes.position.needsUpdate=true;controls.update(dt);fit(dt);renderer.render(scene,camera);frames++;if(nextSelection!==null)select(nextSelection);
 }
 raf=requestAnimationFrame(render);
 function reset(){controls.enableDamping=false;controls.update();const distance=camera.position.distanceTo(target);camera.position.copy(target).add(new THREE.Vector3(-.45,.27,.85).normalize().multiplyScalar(distance));controls.update();controls.enableDamping=true;}
 function diagnostics(){const box=new THREE.Box3();camera.updateMatrixWorld();root.updateMatrixWorld(true);for(let i=0;i<fragments.positions.length;i+=3)box.expandByPoint(p.fromArray(fragments.positions,i).applyMatrix4(root.matrixWorld).project(camera));return{species:models[active].name,busy,frames,wireframe:fragments.mesh.material.wireframe,faces:fragments.count,azimuth:controls.getAzimuthalAngle(),fullyVisible:box.min.x>=-1&&box.max.x<=1&&box.min.y>=-1&&box.max.y<=1};}
 return{select,reset,diagnostics,dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();controls.dispose();fragments.dispose();renderer.dispose();}};
}
