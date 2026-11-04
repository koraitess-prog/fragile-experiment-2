import * as THREE from 'three';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';

// Display-only refinement. Barycentric coordinates keep every child on its
// original animated face; each bisection adds exactly one triangle.
export function refinement(data,count){
 if(count<data.length/9||!Number.isInteger(count))throw Error('Invalid fragment count');
 const faces=Array.from({length:data.length/9},(_,i)=>({base:i,weights:[[1,0,0],[0,1,0],[0,0,1]]}));
 const point=(f,w)=>w.map((_,axis)=>w.reduce((sum,v,k)=>sum+v*data[f.base*9+k*3+axis],0));
 while(faces.length<count){
  let best=-1,chosen=0,edge=0;
  faces.forEach((f,i)=>{const p=f.weights.map(w=>point(f,w));for(let k=0;k<3;k++){const d=p[k].reduce((s,v,a)=>s+(v-p[(k+1)%3][a])**2,0);if(d>best){best=d;chosen=i;edge=k;}}});
  const f=faces[chosen],a=f.weights[edge],b=f.weights[(edge+1)%3],c=f.weights[(edge+2)%3],mid=a.map((v,k)=>(v+b[k])/2);
  faces[chosen]={base:f.base,weights:[a,mid,c]};faces.push({base:f.base,weights:[mid,b,c]});
 }
 return {faces,apply(source,out=new Float32Array(count*9)){
  faces.forEach((f,i)=>f.weights.forEach((w,j)=>{for(let axis=0;axis<3;axis++)out[i*9+j*3+axis]=w.reduce((s,v,k)=>s+v*source[f.base*9+k*3+axis],0);}));return out;
 }};
}

export function glyphTriangles(font,char,size){
 const g=new THREE.ShapeGeometry(font.generateShapes(char,size),2),p=g.attributes.position,index=g.index,out=[];
 for(let i=0;i<(index?.count??p.count);i++){const k=index?index.getX(i):i;out.push(p.getX(k),p.getY(k),0);}
 g.dispose();return out;
}

let fontPromise;
export function loadOpeningFont(){
 return fontPromise??=fetch(`${import.meta.env.BASE_URL}fonts/ibm-plex-mono-light-outline.json`).then(r=>{if(!r.ok)throw Error('Opening font unavailable');return r.json();}).then(data=>new FontLoader().parse(data)).catch(error=>{fontPromise=null;throw error;});
}

// Read actual per-character line boxes, so mobile wrapping and letter spacing
// match the visible typography rather than a second approximation of its layout.
export async function textFragments(elements){
 const [font]=await Promise.all([loadOpeningFont(),document.fonts.ready]);
 const ctx=document.createElement('canvas').getContext('2d'),out=[];
 for(const element of elements){
  const style=getComputedStyle(element),size=parseFloat(style.fontSize),node=element.firstChild;
  if(!node||node.nodeType!==Node.TEXT_NODE)continue;
  ctx.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const ascent=ctx.measureText('Hg').fontBoundingBoxAscent??font.data.ascender/font.data.resolution*size;
  for(let i=0;i<node.textContent.length;i++){
   const char=node.textContent[i];if(char===' ')continue;
   const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1);
   const r=range.getBoundingClientRect(),tri=glyphTriangles(font,char,size);
   for(let j=0;j<tri.length;j+=3)out.push(r.left+tri[j],r.top+ascent-tri[j+1],0);
  }
 }
 return new Float32Array(out);
}
