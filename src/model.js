export const TAU = Math.PI * 2;
export const DEG = 180 / Math.PI;
export const P = Object.freeze({
  crankRadius: 3.8, rodLength: 18, pitchRadius: 4.5,
  gearRatio: 4, defaultFrequency: 0.6,
});
export const wrap = a => ((a % TAU) + TAU) % TAU;
export const mix = (a,b,t) => a + (b-a)*t;
export const smooth = t => { t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); };

// Ideal kinematics in millimetres. Ideal pump reference; arm articulation is solved separately below.
export function solve(phase, frequency=P.defaultFrequency) {
  const {crankRadius:r, rodLength:L, pitchRadius:R}=P;
  const c=Math.cos(phase), s=Math.sin(phase);
  const q=Math.sqrt(L*L-r*r*s*s);
  const slider=r*c+q;
  const dx=-r*s-r*r*s*c/q;
  return {
    phase:wrap(phase), frequency, motorRpm:frequency*60*P.gearRatio,
    crank:{x:r*c,y:r*s}, slider, displacement:slider-L,
    angularVelocity:dx/R*TAU*frequency,
    stroke:2*r, sweepDegrees:2*r/R*DEG,
    cycleMs:frequency>0?1000/frequency:0,
    downstroke:dx>0,
  };
}

export const TOUR = Object.freeze([
  {at:0, name:'Meet the mechanism', detail:'Eight articulated arms follow phase-offset curvature waves.', system:'all', view:'hero', explode:0, xray:false},
  {at:5, name:'Open the frame', detail:'Petal armour reveals the turbine, gear stack and eight pump cartridges.', system:'drive', view:'detail', explode:0.65, xray:true},
  {at:11, name:'Follow the articulated arms', detail:'80 joints, telescoping linkages and 320 suction cups.', system:'arms', view:'top', explode:0.15, xray:true},
  {at:17, name:'Explode the layers', detail:'Separate the pressure hull, drive stack, arm roots and manifold.', system:'all', view:'hero', explode:0.85, xray:false},
  {at:23, name:'A cycle from above', detail:'Each arm follows the next with a 45° phase offset.', system:'all', view:'top', explode:0, xray:false},
  {at:29, name:'Return to the assembly', detail:'Drag to orbit, or use any control to take over.', system:'all', view:'hero', explode:0, xray:false},
]);
export const TOUR_DURATION=34;
export function tourAt(t) {
  const local=((t%TOUR_DURATION)+TOUR_DURATION)%TOUR_DURATION;
  let index=0;
  TOUR.forEach((beat,i)=>{if(local>=beat.at)index=i;});
  const beat=TOUR[index];
  return {...beat,index,local,progress:local/TOUR_DURATION,phase:0.62+TAU*P.defaultFrequency*t};
}

// Traveling curvature wave, shared by geometry and telemetry (radians).
export function armPose(phase,arm,joint){
 const wave=phase-arm*Math.PI/4-joint*.48;
 return {bend:(joint===0?-.38:.12)+Math.sin(wave)*(.12+joint*.012),sway:Math.sin(wave+.8)*.055};
}
