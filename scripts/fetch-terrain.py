"""Decode public Terrarium elevation data into small offline numeric grids.

Data source: Mapzen Terrain Tiles on AWS Open Data.
Source encoding: (R*256 + G + B/256) - 32768 metres.
SRTM/GMTED2010 courtesy USGS; ETOPO1 courtesy NOAA.
This is a general landscape sample, never an animal sighting or range boundary.
"""
from pathlib import Path
from urllib.request import urlopen, Request
from PIL import Image
from io import BytesIO
import math, json, datetime
ROOT=Path(__file__).resolve().parents[1]
SAMPLES=[
 ('rhino','Central Namibia',18,-22,9),
 ('turtle','Maldives reef region',73,3,9),
 ('orangutan','Batang Toru region',99.15,1.6,10),
 ('pangolin','Southern China',110,24,10),
 ('eagle','Mindanao region',125,7,10),
 ('shark','Bahamas region',-78,25,9),
 ('tiger','Sumatra',101,0,10),
 ('saola','Annamite Mountains',105.5,18,10),
 ('manta','Maldives ocean region',73,3,8),
 ('whale','Northeast Pacific',-125,36,8),
]
N=33
for sid,name,lon,lat,z in SAMPLES:
 n=2**z;x=int((lon+180)/360*n);y=int((1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n)
 url=f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
 with urlopen(Request(url,headers={'User-Agent':'FRAGILE-Field-Atlas/1.0'}),timeout=45) as response: raw=response.read()
 im=Image.open(BytesIO(raw)).convert('RGB');values=[]
 for j in range(N):
  row=[]
  for i in range(N):
   r,g,b=im.getpixel((round(i*(im.width-1)/(N-1)),round(j*(im.height-1)/(N-1))))
   row.append(round(r*256+g+b/256-32768,1))
  values.append(row)
 west=x/n*360-180;east=(x+1)/n*360-180
 lat_at=lambda v:math.degrees(math.atan(math.sinh(math.pi*(1-2*v/n))))
 north=lat_at(y);south=lat_at(y+1)
 flat=sum(values,[])
 result={'id':sid,'label':name,'samplePoint':[lon,lat],'zoom':z,'tile':[x,y],
  'bounds':{'west':west,'east':east,'south':south,'north':north},
  'widthKm':round(40075.016686*math.cos(math.radians((north+south)/2))/n,2),
  'rows':N,'columns':N,'elevations':values,'min':min(flat),'max':max(flat),'units':'metres',
  'sourceUrl':url,'source':'Mapzen Terrain Tiles / AWS Open Data',
  'attribution':'Mapzen; SRTM/GMTED2010 courtesy USGS; ETOPO1 courtesy NOAA',
  'licenseUrl':'https://github.com/tilezen/joerd/blob/master/docs/attribution.md',
  'retrieved':datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'scope':'Representative regional tile, not the complete species range or an individual animal location. Heights are sampled; the display exaggerates vertical relief.'}
 (ROOT/'public'/'terrain'/f'{sid}.json').write_text(json.dumps(result,separators=(',',':')),encoding='utf-8')
 print(sid,name,'range',result['min'],result['max'],'m; width',result['widthKm'],'km',flush=True)
