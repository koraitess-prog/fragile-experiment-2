import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {faceData} from './sculpture/geometry.js';
import {createNaturalMotion} from './sculpture/natural-motion.js';
import {subdivide,earthGeometry,geographic,makeFlight,sampleFlight,smooth,random,JOURNEY_SECONDS} from './journey.js';

export function createWorldViewer(container,models,profiles,initial,coast,onState) {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x000000);container.replaceChildren(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,150);
 camera.position.set(-8,4,12);camera.lookAt(0,0,0);
 const controls=new OrbitControls(camera,container);controls.enableDamping=true;controls.dampingFactor=.07;controls.enableZoom=false;controls.enablePan=false;controls.rotateSpeed=.65;controls.minPolarAngle=.25;controls.maxPolarAngle=Math.PI-.25;controls.mouseButtons.MIDDLE=null;controls.mouseButtons.RIGHT=null;controls.touches.TWO=null;
 const earthUniform={value:0};
 const material=new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,side:THREE.DoubleSide,toneMapped:false,transparent:true});
 material.forceSinglePass=true;
 material.onBeforeCompile=shader=>{shader.uniforms.earthAmount=earthUniform;shader.vertexShader='varying vec3 hemisphere;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nhemisphere = normalize(normalMatrix * position);');shader.fragmentShader='uniform float earthAmount; varying vec3 hemisphere;\n'+shader.fragmentShader.replace('#include <opaque_fragment>','#include <opaque_fragment>\ngl_FragColor.a *= mix(1.0, mix(0.015, 0.22, smoothstep(-0.10, 0.15, hemisphere.z)), earthAmount);');};
 const geometry=new THREE.BufferGeometry(),mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;scene.add(mesh);
 const origin=performance.now()/1000,focusDirection=new THREE.Vector3(),rigs=models.map(m=>{const faces=faceData(m);return createNaturalMotion(faces.map(f=>[f,f]),{tigerClockOrigin:origin,orangutanClockOrigin:origin});});
 let active=initial,mode='animal',busy=false,flight=null,started=0,destination='world',next=initial,positions,disposed=false,raf,previous=0,frames=0,earth=null,worldProgress=0,geographyOpacity=0,flightDistance=0,departureDistance=0,cameraStarted=0;
 const posed=models.map(m=>new Float32Array(m.positions));
 function pose(index,t){const p=posed[index];p.set(models[index].positions);rigs[index].apply(p,0,reduced?origin:t);return p;}
 function setPositions(data){geometry.dispose();positions=data.slice();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));}
 setPositions(pose(active,origin));

 const geography=new THREE.Group();scene.add(geography);
 const coastPoints=[];
 for(const feature of coast.features){const lines=feature.geometry.type==='MultiLineString'?feature.geometry.coordinates:[feature.geometry.coordinates];for(const line of lines)for(let i=1;i<line.length;i++)coastPoints.push(...geographic(line[i-1],2.265).toArray(),...geographic(line[i],2.265).toArray());}
 const coastGeo=new THREE.BufferGeometry();coastGeo.setAttribute('position',new THREE.Float32BufferAttribute(coastPoints,3));
 const coastMaterial=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0});
 const coastline=new THREE.LineSegments(coastGeo,coastMaterial);geography.add(coastline);
 // Shader hides the far hemisphere without an opaque sphere or filled faces.
 coastMaterial.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 atlasNormal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\natlasNormal = normalize(normalMatrix * position);');shader.fragmentShader='varying vec3 atlasNormal;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(atlasNormal.z < 0.10) discard;');};
 const markerGroup=new THREE.Group();geography.add(markerGroup);
 const markerMaterial=new THREE.MeshBasicMaterial({color:0xffffff,wireframe:false,transparent:true,depthTest:false});
 const ringMaterial=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,depthTest:false});
 const markerGeo=new THREE.OctahedronGeometry(.095,0);
 const ringGeo=new THREE.BufferGeometry().setFromPoints(Array.from({length:48},(_,i)=>new THREE.Vector3(Math.cos(i/48*Math.PI*2)*.145,Math.sin(i/48*Math.PI*2)*.145,0)));
 const pinLabel=document.createElement('div');pinLabel.className='habitat-pin-label';pinLabel.textContent='HABITAT AREA';pinLabel.hidden=true;pinLabel.setAttribute('aria-hidden','true');container.parentElement.append(pinLabel);
 function buildMarkers(){
  markerGroup.clear();
  for(const point of profiles[active].points){
   const group=new THREE.Group();group.position.copy(geographic(point,2.30));group.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),group.position.clone().normalize());
   const diamond=new THREE.Mesh(markerGeo,markerMaterial);diamond.position.z=.045;diamond.renderOrder=4;group.add(diamond);
   const inner=new THREE.LineLoop(ringGeo,ringMaterial),outer=new THREE.LineLoop(ringGeo,ringMaterial);inner.renderOrder=4;outer.renderOrder=4;outer.scale.setScalar(1.65);group.add(inner,outer);markerGroup.add(group);
  }
 }

 // Separate screen-space triangles form the infographic symbols, entering from outside.
 const overlay=new THREE.Scene(),ortho=new THREE.OrthographicCamera(0,1,0,1,-10,10),iconGeo=new THREE.BufferGeometry(),iconMat=new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:1,side:THREE.DoubleSide,depthTest:false});
 const icons=new THREE.Mesh(iconGeo,iconMat);icons.frustumCulled=false;overlay.add(icons);let iconTargets=new Float32Array(),iconPositions=new Float32Array();
 const shapes=[[[[-.20,-.65],[.20,-.65],[.27,-.30],[-.27,-.30]],[[-.40,-.22],[.40,-.22],[.60,.22],[.23,.15],[.22,.75],[-.22,.75],[-.23,.15],[-.60,.22]]],[[[-.85,.65],[-.18,-.70],[.20,.10],[.48,-.32],[.92,.65]]],[[[-.65,-.70],[.65,-.70],[.65,.70],[-.65,.70]]],[[[0,-.8],[.72,-.48],[.55,.30],[0,.85],[-.55,.30],[-.72,-.48]]]];
 function layoutIcons(){const rect=container.parentElement.getBoundingClientRect(),out=[];document.querySelectorAll('[data-icon]').forEach((el,k)=>{const r=el.getBoundingClientRect();if(!r.width||!r.height)return;const cx=r.left-rect.left+r.width/2,cy=r.top-rect.top+r.height/2,scale=22;for(const polygon of shapes[{population:0,habitat:1,risk:3}[el.dataset.icon]??k]){const p=polygon.map(([x,y])=>new THREE.Vector2(x,y));for(const face of THREE.ShapeUtils.triangulateShape(p,[])){const tri=face.flatMap(i=>[cx+p[i].x*scale,cy+p[i].y*scale,0]);out.push(...subdivide(tri));}}});iconTargets=new Float32Array(out);iconPositions=iconTargets.slice();iconGeo.setAttribute('position',new THREE.BufferAttribute(iconPositions,3).setUsage(THREE.DynamicDrawUsage));}
 function drawIcons(progress){icons.visible=progress>0;for(let i=0;i<iconTargets.length;i+=9){const u=smooth((progress-random(i+8)*.2)/.8),side=random(i+7)>.5?-100:container.clientWidth+100,cy=random(i+11)*container.clientHeight;for(let j=0;j<3;j++){const o=i+j*3;iconPositions[o]=side+(iconTargets[o]-side)*u;iconPositions[o+1]=cy+(iconTargets[o+1]-cy)*u;iconPositions[o+2]=0;}}iconGeo.attributes.position.needsUpdate=true;}
 let width=1,height=1,fullHeight=1,stageTop=0;
 function resize(){
  width=container.clientWidth;height=container.clientHeight;fullHeight=container.parentElement.clientHeight;
  stageTop=container.getBoundingClientRect().top-container.parentElement.getBoundingClientRect().top;
  if(!width||!height)return;
  // Extend the existing stage frustum above and below, without moving the
  // assembled animal or globe. Only fragments use the extra screen space.
  renderer.setSize(width,fullHeight);renderer.domElement.style.position='absolute';renderer.domElement.style.top=-stageTop+'px';
  camera.setViewOffset(width,height,0,-stageTop,width,fullHeight);
  ortho.right=width;ortho.bottom=fullHeight;ortho.updateProjectionMatrix();layoutIcons();
 }

 const observer=new ResizeObserver(resize);observer.observe(container);resize();
 const direction=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(),p=new THREE.Vector3();
 function requiredDistance(data,kind){
  direction.copy(camera.position).normalize();right.crossVectors(camera.up,direction).normalize();up.crossVectors(direction,right);
  const tan=Math.tan(camera.fov*Math.PI/360),mobile=width<760,padding=kind==='animal' ? .72 : mobile ? .86 : .67;
  let distance=6;
  for(let i=0;i<data.length;i+=3){p.fromArray(data,i);distance=Math.max(distance,p.dot(direction)+Math.abs(p.dot(right))/(tan*camera.aspect*padding),p.dot(direction)+Math.abs(p.dot(up))/(tan*(mobile ? .68 : .70)));}
  return distance;
 }
 function fit(dt){
  if(busy)return; // Never zoom out to contain the offscreen fragment cloud.
  const distance=requiredDistance(positions,mode),current=camera.position.length();
  camera.position.normalize().multiplyScalar(distance>current?distance:THREE.MathUtils.damp(current,distance,3,dt));camera.lookAt(0,0,0);
 }

 function notify(){onState({mode,busy,species:active});}
 function begin(to,index=active){if(busy)return;controls.enableDamping=false;controls.update();controls.enableDamping=true;destination=to;next=index;const time=performance.now()/1000;let source=mode==='animal'?subdivide(pose(active,time)):positions.slice(),target;
  if(to==='world'){earth?.geometry.dispose();focusDirection.copy(camera.position).normalize();earth=earthGeometry(profiles[active].focus,camera.quaternion);target=earth.positions;geography.quaternion.copy(earth.rotation);buildMarkers();}
  else target=subdivide(pose(index,time));
  departureDistance=camera.position.length();flightDistance=requiredDistance(target,to);flight=makeFlight(source,target,camera.aspect,{orientation:camera.quaternion.clone(),distance:flightDistance,fov:camera.fov,width,fullHeight,stageHeight:height,top:stageTop});setPositions(source);busy=true;mode=to==='world'?'dispersing':'returning';started=time;cameraStarted=time;controls.enabled=false;notify();
  if(reduced)started-=JOURNEY_SECONDS;
 }
 function reveal(){if(mode==='animal')begin('world');else begin('animal',(active+1)%models.length);}
 function select(index){if(!busy&&index!==active)begin('animal',index);}
 function reset(){if(busy)return;controls.enableDamping=false;controls.update();const distance=camera.position.length();camera.position.copy(mode==='world'?focusDirection:new THREE.Vector3(-.48,.23,.85)).normalize().multiplyScalar(distance);controls.update();controls.enableDamping=true;}
 let down=null;
 const pointerDown=e=>{if(e.isPrimary)down={x:e.clientX,y:e.clientY,id:e.pointerId,moved:false};};
 const pointerMove=e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)down.moved=true;};
 const pointerUp=e=>{if(!down||e.pointerId!==down.id)return;const click=!down.moved;down=null;if(click)reveal();};
 const cancel=()=>down=null;
 container.addEventListener('pointerdown',pointerDown);container.addEventListener('pointermove',pointerMove);container.addEventListener('pointerup',pointerUp);container.addEventListener('pointercancel',cancel);
 function render(ms){if(disposed)return;raf=requestAnimationFrame(render);if(document.hidden)return;const time=ms/1000,dt=Math.min(.05,previous?time-previous:1/60);previous=time;
  if(busy){const elapsed=time-started;camera.position.normalize().multiplyScalar(THREE.MathUtils.lerp(departureDistance,flightDistance,smooth((time-cameraStarted)/.9)));camera.lookAt(0,0,0);
   if(destination==='animal')flight.target.set(subdivide(pose(next,time)));
   sampleFlight(flight,elapsed,positions);
   worldProgress=destination==='world'?smooth((elapsed-4.3)/2.5):1-smooth(elapsed/1.1);
   if(destination==='world'&&elapsed>=3&&mode!=='assembling'){mode='assembling';notify();if(width<760){resize();departureDistance=camera.position.length();flightDistance=requiredDistance(flight.target,'world');cameraStarted=time;}}
   if(elapsed>=JOURNEY_SECONDS){busy=false;controls.enabled=true;active=next;mode=destination;worldProgress=mode==='world'?1:0;if(mode==='animal')setPositions(pose(active,time));notify();}
  }else if(mode==='animal')positions.set(pose(active,time));
  geometry.attributes.position.needsUpdate=true;
  earthUniform.value=worldProgress;
  // Annotations appear only after every fragment has reached its destination.
  geographyOpacity=busy?0:THREE.MathUtils.damp(geographyOpacity,mode==='world'?1:0,5,dt);
  geography.visible=geographyOpacity>.001;coastMaterial.opacity=geographyOpacity;markerMaterial.opacity=geographyOpacity;ringMaterial.opacity=geographyOpacity*.85;
  controls.update(dt);fit(dt);camera.updateMatrixWorld();geography.updateMatrixWorld(true);
  let labelPoint=null,bestFacing=.32;
  for(const m of markerGroup.children){
   p.copy(m.position).applyMatrix4(geography.matrixWorld);const facing=p.clone().normalize().dot(camera.position.clone().normalize());m.visible=facing>.08;
   m.children[2].scale.setScalar(1.65+(reduced?0:.12*Math.sin(time*1.4)));
   if(facing>bestFacing){bestFacing=facing;labelPoint=p.clone();}
  }
  pinLabel.hidden=busy||geographyOpacity<.7||!labelPoint;
  if(!pinLabel.hidden){labelPoint.project(camera);const x=(labelPoint.x+1)*width/2,y=(1-labelPoint.y)*fullHeight/2;pinLabel.style.left=x+'px';pinLabel.style.top=y+'px';pinLabel.classList.toggle('flip',x>width*.66);}

  renderer.render(scene,camera);drawIcons(busy?0:geographyOpacity);renderer.autoClear=false;renderer.clearDepth();renderer.render(overlay,ortho);renderer.autoClear=true;frames++;
 }
 raf=requestAnimationFrame(render);notify();
 function diagnostics(){
  const box=new THREE.Box3();let offscreenVertices=0;camera.updateMatrixWorld();
  for(let i=0;i<positions.length;i+=3){p.fromArray(positions,i).project(camera);box.expandByPoint(p);if(Math.abs(p.x)>1||Math.abs(p.y)>1)offscreenVertices++;}
  return{mode,busy,species:profiles[active].id,faces:positions.length/9,worldProgress,cameraDistance:camera.position.length(),stageHeight:height,stageTop,frames,azimuth:controls.getAzimuthalAngle(),fullyVisible:offscreenVertices===0,offscreenVertices,screenBounds:{left:box.min.x,right:box.max.x,bottom:box.min.y,top:box.max.y},wireframe:material.wireframe,geographyVisible:geography.visible,annotationOpacity:geographyOpacity,iconTriangles:iconTargets.length/9,visibleHabitatMarkers:markerGroup.children.filter(m=>m.visible).length,habitatLabelVisible:!pinLabel.hidden};
 }

 return{reveal,select,reset,diagnostics,dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();controls.dispose();geometry.dispose();material.dispose();coastGeo.dispose();coastMaterial.dispose();markerGeo.dispose();markerMaterial.dispose();ringGeo.dispose();ringMaterial.dispose();pinLabel.remove();earth?.geometry.dispose();iconGeo.dispose();iconMat.dispose();renderer.dispose();container.removeEventListener('pointerdown',pointerDown);container.removeEventListener('pointermove',pointerMove);container.removeEventListener('pointerup',pointerUp);container.removeEventListener('pointercancel',cancel);}};
}
