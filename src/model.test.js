import test from 'node:test';
import assert from 'node:assert/strict';
import {P,TAU,solve,tourAt} from './model.js';
const close=(a,b,epsilon=1e-9)=>assert.ok(Math.abs(a-b)<epsilon,`${a} ≠ ${b}`);
test('slider-crank closes at every sample over a complete cycle',()=>{
  for(let i=0;i<=720;i++) {
    const s=solve(i/720*TAU);
    close(Math.hypot(s.slider-s.crank.x,s.crank.y),P.rodLength);
    assert.ok(Number.isFinite(s.angularVelocity));
  }
});
test('stroke and wing sweep match the hand calculation',()=>{
  close(solve(0).slider-solve(Math.PI).slider,7.6);
  close(solve(0).flap-solve(Math.PI).flap,7.6/4.5);
  close(solve(0).motorRpm,6720);
  close(solve(0).cycleMs,1000/28);
});
test('periodic poses and analytical velocity match finite differences',()=>{
  for(let t=0;t<TAU;t+=0.037) {
    const a=solve(t), b=solve(t+TAU);
    close(a.flap,b.flap);
    close(a.feather,b.feather);
    const d=1e-6;
    close(a.angularVelocity,(solve(t+d).flap-solve(t-d).flap)/(2*d)*TAU*28,1e-5);
  }
});
test('tour is deterministic and looped with a continuous phase',()=>{
  assert.deepEqual(tourAt(13),tourAt(13));
  assert.equal(tourAt(1).index,tourAt(35).index);
  close(tourAt(34.001).phase-tourAt(33.999).phase,TAU*28*0.025*0.002);
});
