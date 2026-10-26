import './styles.css';
import {species,speciesIndex,sourceList} from './data.js';
import {fieldNotes} from './field-notes.js';
import {createTerrainPanel,populationHistoryMarkup} from './terrain-panel.js';
import {thumbnail} from './viewer.js';
import {createWorldViewer} from './world-viewer.js';
const $=s=>document.querySelector(s),params=new URLSearchParams(location.search);
let current=speciesIndex(params.get('species')),viewer=null,mode='animal',loadedModels=null;
const text=(selector,value)=>$(selector).textContent=value;
const terrainPanel=createTerrainPanel($('#terrain-panel'));
const narrowScreen=matchMedia('(max-width:759px)');
function adaptInformation(){
 const mobile=narrowScreen.matches;
 (mobile?$('#mobile-history-slot'):$('.note-population')).append($('#population-history'));
 $('#mobile-history-slot').hidden=!mobile||$('#population-history').hidden;
 if(mode==='world'){
  text('#reveal',mobile?'NEXT ANIMAL':'CLICK FOR NEXT ANIMAL');
  $('#sculpture').setAttribute('aria-label',mobile?`${species[current].title.join(' ')}. Drag to explore habitat regions.`:`${species[current].title.join(' ')}. Earth showing indicative habitat regions. Click or Enter for the next animal. Drag to rotate.`);
 }
 $('#animal-miniature').setAttribute('aria-label',mobile?species[current].title.join(' '):'Next animal');
 $('#animal-miniature').tabIndex=mobile?-1:0;$('#animal-miniature').setAttribute('role',mobile?'img':'button');
}
narrowScreen.addEventListener('change',adaptInformation);
function renderProfile(index){
 current=index;
 if(loadedModels) $('#animal-miniature').innerHTML=thumbnail(loadedModels[index]);
 const s=species[index],notes=fieldNotes[s.id];
 document.title=`${s.title.join(' ')} — FRAGILE Field Atlas`;
 text('#species-name',s.title.join(' '));
 text('#scientific-name',s.scientific);
 text('#mobile-species-name',s.title.join(' '));text('#mobile-status',notes.conservationStatus);
 text('#header-count',`${String(index+1).padStart(2,'0')} / 10`);
 const fewer=notes.population.startsWith('<');
 $('#population-qualifier').hidden=!fewer;text('#population-qualifier',fewer?'Fewer than':'');
 text('#population-value',fewer?notes.population.slice(1):notes.population);
 text('#population-unit',notes.populationScope);
 text('#habitat-region',notes.region);
 text('#habitat-biome',notes.habitat);
 text('#globe-region',notes.region);
 text('#status-label',notes.conservationStatus);
 $('#population-history').hidden=!s.history;$('#population-history').innerHTML=s.history?'<p>Reported estimates</p>'+populationHistoryMarkup(s):'';
 adaptInformation();
 terrainPanel.update(s);
 $('#threats').replaceChildren(...notes.threats.map(threat=>{
  const item=document.createElement('li');item.textContent=threat;return item;
 }));
 document.querySelectorAll('[data-species]').forEach(el=>el.classList.toggle('active',Number(el.dataset.species)===index));
}
function onState(state){const changed=state.species!==current;if(changed)renderProfile(state.species);mode=state.mode;document.body.dataset.mode=mode;if(state.busy&&narrowScreen.matches)window.scrollTo({top:0,behavior:'instant'});$('#field-notes').inert=mode!=='world';$('#field-notes').setAttribute('aria-hidden',String(mode!=='world'));for(const id of ['reveal','previous','next'])$('#'+id).disabled=state.busy;$('#open-index').disabled=state.busy;text('#reveal',mode==='world'?'CLICK FOR NEXT ANIMAL':'REVEAL ITS WORLD ↗');text('#interaction-hint',mode==='world'?'DRAG TO ROTATE':'CLICK TO DISCOVER · DRAG TO ROTATE');text('#journey-caption',mode==='dispersing'?'EVERY LIFE IS PART OF A LARGER WORLD.':mode==='assembling'?'A WORLD TAKES SHAPE.':'RETURNING TO LIFE.');$('#sculpture').setAttribute('aria-label',`${species[current].title.join(' ')}. ${mode==='world'?'Earth showing indicative habitat regions. Click or Enter for the next animal.':'Click or Enter to reveal its world.'} Drag to rotate.`);$('#sculpture').setAttribute('aria-busy',String(state.busy));adaptInformation();if(!state.busy){const url=new URL(location.href);url.searchParams.set('species',species[current].id);url.searchParams.delete('view');history.replaceState({},'',url);text('#announcer',`${species[current].title.join(' ')}. ${mode==='world'?species[current].region+'. Habitat and statistics revealed.':'Animal sculpture.'}`);}}
function select(index){index=(index+species.length)%species.length;viewer?.select(index);}
$('#animal-miniature').addEventListener('click',()=>{if(!narrowScreen.matches)viewer?.reveal();});
$('#reveal').addEventListener('click',()=>viewer?.reveal());$('#previous').addEventListener('click',()=>select(current-1));$('#next').addEventListener('click',()=>select(current+1));$('#reset-view').addEventListener('click',()=>viewer?.reset());
$('#sculpture').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(mode!=='world'||!narrowScreen.matches)viewer?.reveal();}if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();select(current+(e.key==='ArrowRight'?1:-1));}});
$('#open-index').addEventListener('click',()=>$('#collection-dialog').showModal());
document.addEventListener('click',e=>{const b=e.target.closest('[data-species]');if(b){select(Number(b.dataset.species));$('#collection-dialog').close();}if(e.target.closest('[data-close]'))e.target.closest('dialog').close();});
for(const d of document.querySelectorAll('dialog'))d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
$('#open-sources').addEventListener('click',()=>{const s=species[current];$('#collection-dialog').close();$('#source-content').innerHTML=`<p>${s.title.join(' ')} / <i>${s.scientific}</i><br>${s.story}</p><ol class="source-list">${sourceList(s).map(r=>`<li><a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.label} ↗<small>${new URL(r.url).hostname}</small></a></li>`).join('')}</ol><p>${s.note}</p><p>Facts have different scopes and dates and are not live counters. Population measures are not directly comparable between species. Unknown means no reliable total is presented.</p><p>The globe uses public-domain <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">Natural Earth coastlines</a>. Markers show general regions, not exact range boundaries, individual animals or migration routes. Model sizes are fitted to the screen, not a shared scale. Artistic movement is not a biomechanical simulation.</p><p>Terrain: representative regional samples from <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener noreferrer">Mapzen Terrain Tiles</a>. SRTM/GMTED2010 courtesy USGS; ETOPO1 courtesy NOAA. Tiles are sampled to 33 × 33 elevations; the display amplifies vertical relief. These are not complete habitat boundaries or animal locations. <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noopener noreferrer">Data attribution and terms ↗</a></p><p>Research: 25 October 2026. This standalone atlas leaves the original FRAGILE experience unchanged.</p>`;$('#sources-dialog').showModal();});
renderProfile(current);
try{const base=import.meta.env.BASE_URL;const [models,coast]=await Promise.all([Promise.all(species.map(s=>fetch(`${base}models/${s.id}.json`).then(r=>{if(!r.ok)throw Error(`Missing ${s.id} model`);return r.json();}))),fetch(`${base}coastline.geojson`).then(r=>{if(!r.ok)throw Error('Coastline unavailable');return r.json();})]);loadedModels=models;$('#animal-miniature').innerHTML=thumbnail(models[current]);$('#collection-grid').innerHTML=species.map((s,i)=>`<button class="collection-choice ${i===current?'active':''}" data-species="${i}" aria-label="Explore ${s.title.join(' ')}"><span class="tile-number">${String(i+1).padStart(2,'0')} / ${s.code}</span>${thumbnail(models[i])}<span class="tile-name">${s.title.join(' ')}</span></button>`).join('');viewer=createWorldViewer($('#sculpture'),models,species,current,coast,onState);
 if(params.has('qa')){const output=document.createElement('output');output.id='atlas-status';output.className='sr-only';document.body.append(output);setInterval(()=>output.textContent=JSON.stringify(viewer.diagnostics()),150);}
}catch(error){console.error(error);$('#sculpture').innerHTML='<p class="loading-label">The 3D exhibition could not load.<br>Please reload in a WebGL-capable browser.</p>';}
addEventListener('pagehide',e=>{if(!e.persisted)viewer?.dispose();});
