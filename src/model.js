export const TAU = Math.PI * 2;
export const DEG = 180 / Math.PI;
export const P = Object.freeze({
  crankRadius: 3.8, rodLength: 18, pitchRadius: 4.5,
  wingLength: 98, rootHalfSpan: 12, bodyLength: 94,
  gearRatio: 4, defaultFrequency: 28, featherPitch: 28 / DEG,
});
export const wrap = a => ((a % TAU) + TAU) % TAU;
export const mix = (a,b,t) => a + (b-a)*t;
export const smooth = t => { t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); };

// Ideal kinematics in millimetres. Frequency is a design input, not a flight claim.
export function solve(phase, frequency=P.defaultFrequency) {
  const {crankRadius:r, rodLength:L, pitchRadius:R}=P;
  const c=Math.cos(phase), s=Math.sin(phase);
  const q=Math.sqrt(L*L-r*r*s*s);
  const slider=r*c+q;
  const dx=-r*s-r*r*s*c/q;
  const flap=(slider-L)/R;
  const feather=P.featherPitch*Math.sin(phase+Math.PI/2);
  return {
    phase:wrap(phase), frequency, motorRpm:frequency*60*P.gearRatio,
    crank:{x:r*c,y:r*s}, slider, displacement:slider-L,
    flap, flapDegrees:flap*DEG, feather, featherDegrees:feather*DEG,
    angularVelocity:dx/R*TAU*frequency,
    tail:Math.sin(phase)*3/DEG,
    projectedSpan:2*(P.rootHalfSpan+P.wingLength*Math.cos(flap)),
    stroke:2*r, sweepDegrees:2*r/R*DEG,
    cycleMs:frequency>0?1000/frequency:0,
    downstroke:dx>0,
  };
}

export const TOUR = Object.freeze([
  {at:0, name:'Meet the mechanism', detail:'One crank drives the entire wingbeat cycle.', system:'all', view:'hero', explode:0, xray:false},
  {at:5, name:'Open the frame', detail:'The shell opens to reveal the reduction gears and eccentric crank.', system:'drive', view:'detail', explode:0.65, xray:true},
  {at:11, name:'Follow the wing root', detail:'A 7.6 mm slider stroke produces a 96.8° flap sweep.', system:'wings', view:'front', explode:0.15, xray:true},
  {at:17, name:'Explode the layers', detail:'From membrane to frame, explore each subsystem in place.', system:'all', view:'hero', explode:0.85, xray:false},
  {at:23, name:'A cycle from above', detail:'Flap and pitch stay synchronized to a single phase.', system:'all', view:'top', explode:0, xray:false},
  {at:29, name:'Return to the assembly', detail:'Drag to orbit, or use any control to take over.', system:'all', view:'hero', explode:0, xray:false},
]);
export const TOUR_DURATION=34;
export function tourAt(t) {
  const local=((t%TOUR_DURATION)+TOUR_DURATION)%TOUR_DURATION;
  let index=0;
  TOUR.forEach((beat,i)=>{if(local>=beat.at)index=i;});
  const beat=TOUR[index];
  return {...beat,index,local,progress:local/TOUR_DURATION,phase:0.62+TAU*P.defaultFrequency*0.025*t};
}
