const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>Math.round(n).toLocaleString('en');
const point=(x,y)=>`${x.toFixed(2)},${y.toFixed(2)}`;
const frame='<path class="plot-frame" d="M6 28V6H28M232 6H254V28M254 232V254H232M28 254H6V232"/><text x="244" y="23" text-anchor="end">N ↑</text>';
const svg=(content,label,north='N ↑')=>`<svg viewBox="0 0 260 260" role="img" aria-label="${escape(label)}">${frame.replace('N ↑',north)}${content}</svg>`;

export function contourSegments(data){
 const g=data.elevations,n=g.length,out=[],range=data.max-data.min;if(range<=0)return out;
 const cases={1:[[3,0]],2:[[0,1]],3:[[3,1]],4:[[1,2]],5:[[3,0],[1,2]],6:[[0,2]],7:[[3,2]],8:[[2,3]],9:[[0,2]],10:[[0,1],[2,3]],11:[[1,2]],12:[[1,3]],13:[[0,1]],14:[[3,0]]};
 for(let level=1;level<12;level++){
  const h=data.min+range*level/12;
  for(let j=0;j<n-1;j++)for(let i=0;i<n-1;i++){
   const v=[g[j][i],g[j][i+1],g[j+1][i+1],g[j+1][i]],xy=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]],mask=v.reduce((m,e,k)=>m|(e>h?1<<k:0),0);
   let pairs=cases[mask]??[];
   if(mask===5&&v.reduce((a,b)=>a+b,0)/4>h)pairs=[[0,1],[2,3]];
   if(mask===10&&v.reduce((a,b)=>a+b,0)/4>h)pairs=[[3,0],[1,2]];
   const intersect=edge=>{const a=edge,b=(edge+1)%4,t=(h-v[a])/(v[b]-v[a]);return [20+(xy[a][0]+(xy[b][0]-xy[a][0])*t)/(n-1)*220,20+(xy[a][1]+(xy[b][1]-xy[a][1])*t)/(n-1)*220];};
   for(const [a,b] of pairs)out.push([intersect(a),intersect(b)]);
  }
 }
 return out;
}

export function reliefMarkup(data,mode='relief'){
 const g=data.elevations,n=g.length,range=Math.max(1,data.max-data.min);
 if(mode==='contours'){
  const d=contourSegments(data).map(([a,b])=>`M${point(...a)}L${point(...b)}`).join('');
  return svg(`<path class="terrain-contours" d="${d}"/><text x="20" y="250">${number(data.min)} — ${number(data.max)} m</text>`,`${data.label}: contours from sampled elevations, metres.`);
 }
 if(mode==='profile'){
  const row=g[Math.floor(n/2)],min=Math.min(...row),max=Math.max(...row),span=Math.max(1,max-min),path=row.map((v,i)=>(i?'L':'M')+point(54+i/(n-1)*180,202-(v-min)/span*150)).join('');
  let grid='';for(let i=0;i<4;i++){const y=202-i*50;grid+=`<path class="plot-grid" d="M54 ${y}H236"/><text x="48" y="${y+4}" text-anchor="end">${new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(min+span*i/3)}</text>`;}
  return svg(`${grid}<path class="profile-line" d="${path}"/><path class="plot-axis" d="M54 40V202H236"/><text x="54" y="223">W</text><text x="234" y="223" text-anchor="end">E</text><text x="140" y="244" text-anchor="middle">${data.widthKm.toFixed(1)} km · sampled transect</text><text x="54" y="31">m</text>`,`${data.label}: central west-to-east elevation profile, metres; not an animal movement track.`,'');
 }
 const project=(i,j,h)=>{const x=i/(n-1)*2-1,z=j/(n-1)*2-1;return [130+(x-z)*54,151+(x+z)*24-(h-data.min)/range*58];};
 const pts=[];for(let j=0;j<n;j+=2){const row=[];for(let i=0;i<n;i+=2)row.push(project(i,j,g[j][i]));pts.push(row);}
 let d='';for(let j=0;j<pts.length;j++)for(let i=0;i<pts[j].length;i++){
  const a=pts[j][i];if(i+1<pts[j].length)d+=`M${point(...a)}L${point(...pts[j][i+1])}`;
  if(j+1<pts.length)d+=`M${point(...a)}L${point(...pts[j+1][i])}`;
  if(j+1<pts.length&&i+1<pts[j].length)d+=`M${point(...a)}L${point(...pts[j+1][i+1])}`;
 }
 const corners=[[0,0],[n-1,0],[n-1,n-1],[0,n-1]],base=corners.map(([i,j])=>project(i,j,data.min-150/Math.max(1,data.widthKm)));
 const bottom=base.map(([x,y])=>[x,y+15]);let box=`M${bottom.map(p=>point(...p)).join('L')}Z`;
 corners.forEach(([i,j],k)=>{box+=`M${point(...project(i,j,g[j][i]))}L${point(...bottom[k])}`;});
 return svg(`<path class="relief-base" d="${box}"/><path class="terrain-mesh" d="${d}"/><text x="130" y="245" text-anchor="middle">Tile width ≈ ${data.widthKm.toFixed(1)} km</text>`,`${data.label}: triangular wireframe terrain from real elevation samples. Vertical relief is amplified.`,'N ↗');
}

export function populationHistoryMarkup(animal){
 if(!animal.history?.length)return '';
 const max=Math.max(...animal.history.map(p=>p.value));
 return `<svg viewBox="0 0 260 116" role="img" aria-label="${escape(animal.history.map(p=>p.year+': '+p.value).join('; '))}. Three reported population estimates, not an annual time series.">${animal.history.map((p,i)=>{const x=25+i*86,h=p.value/max*58,y=86-h;return `<path class="history-column" d="M${x} 86V${y}H${x+34}V86ZM${x} 86L${x+34} ${y}"/><text x="${x+17}" y="${y-8}" text-anchor="middle">${number(p.value)}</text><text x="${x+17}" y="106" text-anchor="middle">${p.year}</text>`;}).join('')}<path class="plot-axis" d="M15 86H246"/></svg>`;
}

export function createTerrainPanel(root){
 let data=null,request=0;const cache=new Map();
 const drawing=root.querySelector('[data-terrain-drawing]'),title=root.querySelector('[data-terrain-title]'),caption=root.querySelector('[data-terrain-caption]');
 function render(){if(!data)return;drawing.innerHTML=[['relief','Triangular relief'],['contours','Elevation contours'],['profile','West–east profile']].map(([mode,label])=>`<figure class="terrain-study"><figcaption>${label}</figcaption><div class="terrain-drawing">${reliefMarkup(data,mode)}</div></figure>`).join('');title.textContent=data.max<0?'Seafloor study':data.min<0?'Seafloor & coast':'Landscape study';
  caption.innerHTML=`<span>${escape(data.label)} · regional sample</span><span>Relief scaled · elevations in metres · <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener noreferrer">Mapzen / USGS / NOAA ↗</a></span>`;

 }

 return {async update(animal){const serial=++request;data=null;drawing.innerHTML='<p class="terrain-loading">Reading the landscape…</p>';title.textContent='Habitat relief';caption.textContent='';
  try{if(!cache.has(animal.id)){const response=await fetch(`${import.meta.env.BASE_URL}terrain/${animal.id}.json`);if(!response.ok)throw Error('Terrain sample unavailable');cache.set(animal.id,await response.json());}if(serial!==request)return;data=cache.get(animal.id);render();}
  catch(error){if(serial!==request)return;drawing.innerHTML='<p class="terrain-loading">Terrain sample unavailable.</p>';caption.textContent='The globe and species information are still available.';console.warn(error);}
 }};
}
