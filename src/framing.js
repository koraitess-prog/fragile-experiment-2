// The projection rectangle is independent of the information page's layout.
// Layout can settle immediately; the rendered sculpture reaches it continuously.
export function interpolateFrame(from,to,seconds,duration=1.2){
 const t=Math.max(0,Math.min(1,seconds/duration)),u=t*t*(3-2*t);
 return {height:from.height+(to.height-from.height)*u,top:from.top+(to.top-from.top)*u};
}
