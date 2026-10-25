const rad=Math.PI/180;
export function project([lon,lat],[lon0,lat0]){const p=lat*rad,p0=lat0*rad,l=(lon-lon0)*rad;return[Math.cos(p)*Math.sin(l),Math.cos(p0)*Math.sin(p)-Math.sin(p0)*Math.cos(p)*Math.cos(l),Math.sin(p0)*Math.sin(p)+Math.cos(p0)*Math.cos(p)*Math.cos(l)];}
function linePath(points,focus){let path='',drawing=false;for(const p of points){const[x,y,z]=project(p,focus);if(z<.015){drawing=false;continue;}path+=(drawing?'L':'M')+(250+x*145).toFixed(2)+','+(153-y*145).toFixed(2);drawing=true;}return path;}
export function mapMarkup(geo,species,rotation=0){
 const focus=[species.focus[0]+rotation,species.focus[1]],paths=[];
 for(const f of geo?.features??[]){const lines=f.geometry.type==='LineString'?[f.geometry.coordinates]:f.geometry.type==='MultiLineString'?f.geometry.coordinates:[];for(const line of lines)paths.push(linePath(line,focus));}
 let grid='';for(let lat=-75;lat<=75;lat+=15)for(let lon=-180;lon<180;lon+=30){grid+=linePath([[lon,lat],[lon+30,lat],[lon+30,lat+15],[lon,lat]],focus);}
 const pins=species.points.map(p=>{const[x,y,z]=project(p,focus);if(z<.02)return'';const px=250+x*145,py=153-y*145;return`<circle cx="${px}" cy="${py}" r="8" fill="none" opacity=".25"/><path d="M${px},${py-3}l3,3 -3,3 -3,-3Z"/>`;}).join('');
 return`<svg viewBox="0 0 500 320" role="presentation"><circle cx="250" cy="153" r="145" fill="none" stroke="#55554b" stroke-width=".6"/><path class="map-grid" d="${grid}"/><path class="map-coast" d="${paths.join('')}"/><g class="map-pins">${pins}</g></svg><div class="map-controls"><button data-map-turn aria-label="Rotate habitat globe by 60 degrees">TURN GLOBE ↻</button><button data-map-reset aria-label="Recenter habitat globe">RECENTER ⌖</button></div>`;
}
