import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createMachine} from './machine.js';
import {solve,TAU} from './model.js';
test('eight ten-joint arms remain finite, clear the floor and return to their starting pose',()=>{
 const m=createMachine(new T.Scene());assert.equal(m.arms.length,8);assert.equal(m.joints.length,80);
 const opts={system:'all',xray:false,explode:0};const points=[];
 for(let i=0;i<=24;i++){
  m.update(solve(i/24*TAU),opts);
  const bounds=new T.Box3().setFromObject(m.root);
  assert.ok(bounds.min.y>-85,`floor collision at ${i}: ${bounds.min.y}`);
  for(const n of [...bounds.min.toArray(),...bounds.max.toArray()])assert.ok(Number.isFinite(n));
  const tip=m.joints[9].g.getWorldPosition(new T.Vector3());
  if(i===0||i===24)points.push(tip);
 }
 assert.ok(points[0].distanceTo(points[1])<1e-8);
 m.update(solve(1),{...opts,explode:1});
 for(const g of Object.values(m.modules))assert.ok(g.visible);
 m.update(solve(1),{...opts,system:'drive',xray:true});
 assert.equal(m.modules.arms.visible,false);assert.equal(m.modules.drive.visible,true);
});
