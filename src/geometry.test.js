import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createMachine} from './machine.js';
import {solve,TAU} from './model.js';

test('assembled wings remain mirror-symmetric and clear the studio floor for a full cycle',()=>{
  const scene=new T.Scene(),machine=createMachine(scene);
  const opts={system:'all',xray:false,explode:0};
  const [left,right]=machine.modules.wings.children;
  const bounds=new T.Box3();
  let minimumY=Infinity;
  for(let i=0;i<=72;i++) {
    machine.update(solve(i/72*TAU),opts);
    const a=left.children[0].localToWorld(new T.Vector3(98,0,-20));
    const b=right.children[0].localToWorld(new T.Vector3(98,0,-20));
    assert.ok(Math.abs(a.x+b.x)<1e-8,'wing tips must mirror across the sagittal plane');
    assert.ok(Math.abs(a.y-b.y)<1e-8,'wing tips must have equal height');
    assert.ok(Math.abs(a.z-b.z)<1e-8,'wing tips must have equal longitudinal position');
    bounds.setFromObject(machine.root);
    for(const n of [...bounds.min.toArray(),...bounds.max.toArray()])assert.ok(Number.isFinite(n));
    minimumY=Math.min(minimumY,bounds.min.y);
  }
  assert.ok(minimumY> -85,`geometry crosses the floor: minimum y=${minimumY}`);
});
