"""Convert the already-licensed app font to Three.js outline data.
Build-time only: fonttools is not needed by the website.
"""
from pathlib import Path
import json
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen

root=Path(__file__).resolve().parents[1]
font=TTFont(root/'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-300-normal.woff')
glyph_set=font.getGlyphSet()

class OutlinePen(BasePen):
    def __init__(self):
        super().__init__(glyph_set); self.tokens=[]
    def emit(self,command,*points):
        self.tokens.append(command)
        self.tokens.extend(str(round(v,3)) for p in points for v in p)
    def _moveTo(self,p): self.emit('m',p)
    def _lineTo(self,p): self.emit('l',p)
    def _qCurveToOne(self,p1,p2): self.emit('q',p2,p1)
    def _curveToOne(self,p1,p2,p3): self.emit('b',p3,p1,p2)
    def _closePath(self): pass
    def _endPath(self): pass

glyphs={}
for code,name in font.getBestCmap().items():
    if not 32<=code<127: continue
    pen=OutlinePen();glyph_set[name].draw(pen)
    glyphs[chr(code)]={'ha':font['hmtx'][name][0],'o':' '.join(pen.tokens)}
data={'familyName':'IBM Plex Mono','resolution':font['head'].unitsPerEm,
      'ascender':font['hhea'].ascent,'descender':font['hhea'].descent,
      'underlineThickness':font['post'].underlineThickness,
      'boundingBox':{'yMin':font['head'].yMin,'yMax':font['head'].yMax},'glyphs':glyphs}
out=root/'public/fonts/ibm-plex-mono-light-outline.json';out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(data,separators=(',',':')),encoding='utf-8')
print(f'{len(glyphs)} glyphs, {out.stat().st_size} bytes')
