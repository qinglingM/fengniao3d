import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {P} from './model.js';

const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const metal=(color,extra={})=>new T.MeshStandardMaterial({color,metalness:0.65,roughness:0.5,...extra});
export function createMachine(scene) {
  const root=new T.Group(); scene.add(root);
  const modules={};
  for(const name of ['shell','drive','wings','tail','sensor']) {
    const group=new T.Group();group.name=name;root.add(group);modules[name]=group;
  }
  const mats={
    graphite:metal('#343b3b'), carbon:metal('#242b2c',{metalness:0.32,roughness:0.64}),
    silver:metal('#b9b9ad'), bright:metal('#e6e4d8'), bronze:metal('#a78b5f'),
    accent:metal('#e4623f',{metalness:0.25}), black:metal('#171f21'),
    membrane:metal('#c7c6b5',{transparent:true,opacity:0.4,metalness:0.1,side:T.DoubleSide,depthWrite:false}),
  };
  Object.entries(mats).forEach(([name,mat])=>{mat.name=name;});
  const unitCylinder=new T.CylinderGeometry(1,1,1,12);
  const sphereGeo=new T.SphereGeometry(1,20,12);
  function mesh(parent,geo,mat,pos,scale) {
    const m=new T.Mesh(geo,mat.clone());
    if(pos)m.position.copy(pos);if(scale)m.scale.copy(scale);
    m.castShadow=true;m.receiveShadow=true;parent.add(m);
    return m;
  }
  function ball(parent,pos,r,mat=mats.silver){return mesh(parent,sphereGeo,mat,pos,V(r,r,r));}
  function rod(parent,a,b,r,mat=mats.silver) {
    const m=mesh(parent,unitCylinder,mat);
    fitRod(m,a,b,r);return m;
  }
  function fitRod(m,a,b,r) {
    m.position.copy(a).add(b).multiplyScalar(.5);
    const d=V().subVectors(b,a);
    m.scale.set(r,d.length(),r);m.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());
  }
  function curve(parent,points,r,mat=mats.silver) {
    const path=new T.CatmullRomCurve3(points);
    return mesh(parent,new T.TubeGeometry(path,30,r,7,false),mat);
  }
  function bolt(parent,pos,r=1.15) {
    const m=mesh(parent,new T.CylinderGeometry(r,r,.8,6),mats.graphite,pos);
    m.rotation.x=Math.PI/2;
    rod(parent,pos.clone().add(V(-r*.45,0,.48)),pos.clone().add(V(r*.45,0,.48)),.13,mats.silver);
  }
  function gear(parent,r,teeth,thickness,pos,mat=mats.silver) {
    const s=new T.Shape();
    for(let i=0;i<teeth*4;i++) {
      const a=i/(teeth*4)*Math.PI*2,rr=r*(i%4===1||i%4===2?1.08:.91);
      const x=Math.cos(a)*rr,y=Math.sin(a)*rr;
      i?s.lineTo(x,y):s.moveTo(x,y);
    }
    s.closePath();
    const hole=new T.Path();hole.absarc(0,0,r*.29,0,Math.PI*2,true);s.holes.push(hole);
    const m=mesh(parent,new T.ExtrudeGeometry(s,{depth:thickness,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.12,bevelThickness:.1}),mat,pos);
    for(let a=0;a<Math.PI*2;a+=Math.PI/3) {
      rod(m,V(Math.cos(a)*r*.32,Math.sin(a)*r*.32,thickness+.12),V(Math.cos(a)*r*.74,Math.sin(a)*r*.74,thickness+.12),.23,mats.graphite);
    }
    return m;
  }
  function outline(parent,geo,mat=mats.graphite,threshold=35) {
    const lines=new T.LineSegments(new T.EdgesGeometry(geo,threshold),new T.LineBasicMaterial({color:mat.color,transparent:true,opacity:.32}));
    parent.add(lines);return lines;
  }

  // Open ribbed chassis. Longitudinal axis is z, all sizes in mm.
  const shell=modules.shell;
  const bodyZ=[-39,-29,-17,-4,10,23,32];
  bodyZ.forEach((z,i)=>{
    const rx=[3,8,11.3,13.3,13.1,10.4,6.3][i],ry=[5,10,15,18,17,13,8][i];
    const pts=[];
    for(let j=0;j<=48;j++){const a=j/48*Math.PI*2;pts.push(V(rx*Math.cos(a),ry*Math.sin(a)-2,z));}
    curve(shell,pts,.72,mats.bronze);
    for(const side of [-1,1])bolt(shell,V(side*rx,0,z),.85);
  });
  for(let a=0;a<Math.PI*2;a+=Math.PI/3) {
    curve(shell,bodyZ.map((z,i)=>{
      const rx=[3,8,11.3,13.3,13.1,10.4,6.3][i],ry=[5,10,15,18,17,13,8][i];
      return V(rx*Math.cos(a),ry*Math.sin(a)-2,z);
    }),.6,mats.graphite);
  }
  // Layered ventral armour leaves the working mechanism visible.
  for(let i=0;i<5;i++) {
    const z=-27+i*10;
    const plate=mesh(shell,new T.SphereGeometry(1,24,12,0,Math.PI*2,Math.PI*.48,Math.PI*.42),i%2?mats.graphite:mats.bright,V(0,-2,z),V(10.5+Math.sin(i/4*Math.PI)*2,15,8));
    plate.rotation.x=.13;
  }
  const dorsal=curve(shell,[V(0,10,-34),V(0,18,-15),V(0,20,7),V(0,14,27)],1.7,mats.bright);
  // Rear energy cell and wrapped cable: architectural detail, no invented telemetry.
  const cell=mesh(modules.drive,new T.CylinderGeometry(5.7,5.7,22,24),mats.graphite,V(0,-1,-22));cell.rotation.x=Math.PI/2;
  for(const z of [-32,-12]){const ring=mesh(modules.drive,new T.TorusGeometry(5.8,.55,6,28),mats.bronze,V(0,-1,z));}
  curve(modules.drive,[V(5,-1,-25),V(7,-4,-13),V(5,-7,0),V(8,-12,8)],.45,mats.accent);

  // Head: nested sensor pod, eye lenses and a long tapered probe.
  const sensor=modules.sensor;
  const neck=mesh(sensor,sphereGeo,mats.bronze,V(0,13,30),V(5.5,10,7.5));
  const head=mesh(sensor,sphereGeo,mats.graphite,V(0,22,40),V(10.2,11.5,13));
  const hood=mesh(sensor,new T.SphereGeometry(1,28,18,0,Math.PI*2,0,Math.PI*.53),mats.bright,V(0,24.5,39),V(10.6,10.1,12.8));
  for(const side of [-1,1]) {
    const lens=mesh(sensor,new T.CylinderGeometry(3.2,3.6,1.8,24),mats.bronze,V(side*9.1,24,44));lens.rotation.z=Math.PI/2;
    const eye=mesh(sensor,sphereGeo,mats.black,V(side*10.2,24,44),V(1,2.55,2.55));
    ball(sensor,V(side*10.75,24.8,44.8),.55,mats.accent);
    curve(sensor,[V(side*7.8,17,43),V(side*8.8,17,38),V(side*7,19,32)],.38,mats.bronze);
  }
  const beak=mesh(sensor,new T.ConeGeometry(2.1,35,12),mats.graphite,V(0,23.5,67));beak.rotation.x=Math.PI/2;
  curve(sensor,[V(0,23.5,51),V(0,23.7,67),V(0,23.5,83)],.24,mats.bronze);
  // Structural cheek plates and neck rings.
  for(let z=29;z<36;z+=2.3)mesh(sensor,new T.TorusGeometry(5.5,.45,6,24),mats.bronze,V(0,15,z));

  const drive=modules.drive;
  const plate=mesh(drive,new T.BoxGeometry(24,28,1.2),mats.bright,V(0,-3,8));
  for(const x of [-10,10])for(const y of [-15,9])bolt(drive,V(x,y,9),1);
  const mainGear=gear(drive,7.2,48,1.2,V(0,-12,11),mats.bronze);
  const motorGear=gear(drive,1.8,12,1.2,V(9,-12,11),mats.graphite);
  const motor=mesh(drive,new T.CylinderGeometry(4.5,4.5,14,24),mats.graphite,V(9,-12,0));motor.rotation.x=Math.PI/2;
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;rod(drive,V(9+4.6*Math.cos(a),-12+4.6*Math.sin(a),-6),V(9+4.6*Math.cos(a),-12+4.6*Math.sin(a),5),.22,mats.silver);}
  // The visible crank is on the final gear axis, one offset pin, one exact rod.
  const crankArm=rod(drive,V(0,-12,14),V(0,-12+P.crankRadius,14),.8,mats.accent);
  const crankPin=ball(drive,V(0,-12+P.crankRadius,15),1.25,mats.graphite);
  const connectingRod=rod(drive,V(0,-8.2,15),V(0,9.8,15),.6,mats.bright);
  const sliderPin=ball(drive,V(0,9.8,15),1.3,mats.accent);
  for(const x of [-4,4])rod(drive,V(x,-3,13),V(x,22,13),.5,mats.graphite);
  const yoke=new T.Group();drive.add(yoke);
  mesh(yoke,new T.BoxGeometry(14,2.4,2),mats.graphite,V(0,0,13.4));
  for(const side of [-1,1]) {
    mesh(yoke,new T.BoxGeometry(1.1,25,1.6),mats.bronze,V(side*7.1,0,12));
    for(let i=-5;i<=5;i++) {
      mesh(yoke,new T.BoxGeometry(.8,1.05,1.6),mats.bright,V(side*7.8,i*Math.PI*.75,12));
    }
    const block=mesh(yoke,new T.BoxGeometry(2.8,3.4,2),mats.bright,V(side*4,0,13));
  }
  const rootGears=[];
  for(const side of [-1,1]) {
    rootGears.push(gear(drive,4.5,12,1.5,V(side*12,8,11.5),mats.accent));
    rod(drive,V(side*12,8,6),V(side*12,8,17),1.1,mats.graphite);
    bolt(drive,V(side*12,8,17),1.6);
    rod(shell,V(side*12,8,6),V(side*8,-6,-1),1,mats.silver);
  }

  // Wings have a rigid root spar, a cam-controlled pitch bearing and separate vanes.
  const wingPivots=[],pitchPivots=[];
  const featherBases=[];
  for(const side of [-1,1]) {
    const pivot=new T.Group();modules.wings.add(pivot);pivot.position.set(side*12,8,12);wingPivots.push(pivot);
    const pitch=new T.Group();pivot.add(pitch);pitch.scale.x=side;pitchPivots.push(pitch);
    mesh(pitch,new T.CylinderGeometry(2.7,2.7,9,18),mats.bronze,V(4.5,0,0)).rotation.z=Math.PI/2;
    const membraneShape=new T.Shape();
    membraneShape.moveTo(5,0);membraneShape.bezierCurveTo(25,-9,62,-7,98,20);membraneShape.bezierCurveTo(90,30,42,34,11,15);membraneShape.closePath();
    const membraneGeo=new T.ShapeGeometry(membraneShape,32);membraneGeo.rotateX(-Math.PI/2);
    mesh(pitch,membraneGeo,mats.membrane,V(0,.15,0));
    curve(pitch,[V(5,0,0),V(27,0,8),V(59,0,5),V(98,0,-20)],1.1,mats.bronze);
    curve(pitch,[V(5,0,0),V(35,0,-13),V(64,0,-25),V(93,0,-27)],.65,mats.silver);
    for(let i=0;i<11;i++) {
      const f=i/10;
      const start=V(12+f*41,0,4-f*9);
      const tip=V(41+f*57,0,-27+Math.sin(f*Math.PI)*-8+f*7);
      const d=tip.clone().sub(start),normal=V(-d.z,0,d.x).normalize();
      const width=3.4+Math.sin(f*Math.PI)*1.9;
      const s=new T.Shape();
      const left=start.clone().addScaledVector(normal,width*.42);
      const right=start.clone().addScaledVector(normal,-width*.5);
      const mid=start.clone().addScaledVector(d,.62);
      s.moveTo(left.x,-left.z);
      s.quadraticCurveTo(mid.x+normal.x*width,-mid.z-normal.z*width,tip.x,-tip.z);
      s.quadraticCurveTo(mid.x-normal.x*width*.9,-mid.z+normal.z*width*.9,right.x,-right.z);
      s.closePath();
      const geo=new T.ExtrudeGeometry(s,{depth:.38,bevelEnabled:true,bevelSize:.18,bevelThickness:.1,bevelSegments:1,steps:1,curveSegments:12});
      geo.rotateX(-Math.PI/2);
      const feather=mesh(pitch,geo,i%3===0?mats.silver:mats.graphite,V(0,.28+i*.045,0));
      featherBases.push({m:feather,i,side});
      curve(pitch,[start.clone().add(V(0,.85,0)),mid.clone().add(V(0,.85,0)),tip.clone().add(V(0,.85,0))],.17,mats.bronze);
      // Fasteners on individual vanes catch light without a texture.
      ball(pitch,start.clone().addScaledVector(d,.1).add(V(0,1,0)),.52,mats.bronze);
    }
    for(let j=0;j<5;j++) {
      curve(pitch,[V(5+j*5,1,-1-j*1.2),V(17+j*7,1,-12-j*2),V(31+j*8,1,-26-j*.7)],.23,mats.bright);
    }
    rod(pitch,V(5,0,0),V(29,0,-13),.85,mats.graphite);
  }

  // Tail fan is a separately explorable passive stabilizer.
  const tailPivot=new T.Group();modules.tail.add(tailPivot);tailPivot.position.set(0,-3,-35);
  rod(tailPivot,V(0,0,0),V(0,-1,-21),1.9,mats.bronze);
  for(let i=-3;i<=3;i++) {
    const len=37-Math.abs(i)*2.2;
    const s=new T.Shape();s.moveTo(i*.5,0);s.quadraticCurveTo(i*4+3,len*.53,i*5,len);s.quadraticCurveTo(i*4-3,len*.58,i*.5-1,0);s.closePath();
    const geo=new T.ExtrudeGeometry(s,{depth:.55,bevelEnabled:true,bevelSize:.2,bevelThickness:.1,steps:1,bevelSegments:1});geo.rotateX(-Math.PI/2);
    mesh(tailPivot,geo,i%2?mats.graphite:mats.silver,V(0,.4+Math.abs(i)*.25,0));
    curve(tailPivot,[V(i*.5,1,0),V(i*2.8,1,-len*.5),V(i*5,1,-len+.5)],.22,mats.bronze);
  }
  // Fine landing claws, folded below the abdominal keel.
  for(const side of [-1,1]) {
    curve(shell,[V(side*5,-13,-9),V(side*7,-23,-3),V(side*4,-24,7)],.58,mats.graphite);
    for(let i=-1;i<=1;i++)curve(shell,[V(side*4,-24,7),V(side*4+i*2.1,-24.5,11),V(side*4+i*2.7,-23.5,13)],.3,mats.bronze);
  }

  // Batch static hardware by material, keeping every moving part independent.
  const moving=new Set([mainGear,motorGear,crankArm,crankPin,connectingRod,sliderPin,...rootGears,...featherBases.map(f=>f.m)]);
  function batchStatic(parent) {
    [...parent.children].forEach(child=>{if(child.children.length)batchStatic(child);});
    const buckets=new Map();
    for(const child of [...parent.children]) {
      if(!child.isMesh||child.children.length||moving.has(child))continue;
      const key=child.material.name;
      if(!buckets.has(key))buckets.set(key,[]);
      buckets.get(key).push(child);
    }
    for(const group of buckets.values()) {
      if(group.length<2)continue;
      const geometries=group.map(m=>{m.updateMatrix();return m.geometry.clone().applyMatrix4(m.matrix);});
      const geo=mergeGeometries(geometries,false);
      geometries.forEach(g=>g.dispose());
      if(!geo)continue;
      const merged=new T.Mesh(geo,group[0].material);merged.castShadow=true;merged.receiveShadow=true;
      group.forEach(m=>parent.remove(m));parent.add(merged);
    }
  }
  batchStatic(root);
  const originals=[];
  root.traverse(o=>{
    if(o.isMesh){o.material.userData={originalOpacity:o.material.opacity,originalColor:o.material.color.clone()};originals.push(o);}
  });
  let lastVisual='';
  function update(state,opts) {
    const p=V(state.crank.y,-12+state.crank.x,15),b=V(0,-12+state.slider,15);
    mainGear.rotation.z=-state.phase;motorGear.rotation.z=state.phase*P.gearRatio;
    fitRod(crankArm,V(0,-12,14),p.clone().setZ(14),.8);
    crankPin.position.copy(p);fitRod(connectingRod,p,b,.6);sliderPin.position.copy(b);
    yoke.position.y=-12+state.slider;
    rootGears[0].rotation.z=state.flap;rootGears[1].rotation.z=-state.flap;
    wingPivots[0].rotation.z=state.flap;wingPivots[1].rotation.z=-state.flap;
    pitchPivots[0].rotation.x=state.feather;pitchPivots[1].rotation.x=state.feather;
    tailPivot.rotation.x=state.tail;
    const ex=opts.explode;
    shell.position.set(0,ex*28,-ex*3);
    sensor.position.set(0,ex*15,ex*25);
    modules.tail.position.set(0,-ex*8,-ex*30);
    modules.wings.position.set(0,ex*8,0);
    wingPivots.forEach((w,i)=>w.position.x=(i===0?-1:1)*(12+ex*32));
    featherBases.forEach(({m,i})=>{m.position.y=.28+i*.045+ex*(i*.55+1.2);});
    const key=`${opts.system}|${opts.xray}`;
    if(key!==lastVisual) {
      for(const [name,g] of Object.entries(modules)) {
        const focused=opts.system==='all'||opts.system===name;
        g.visible=opts.system!=='drive'||name==='drive';
        g.traverse(o=>{
          if(!o.isMesh)return;
          const mat=o.material,original=mat.userData;
          let opacity=original.originalOpacity;
          if(!focused)opacity*=.13;
          if(opts.xray&&name==='shell')opacity*=.15;
          const transparent=opacity<1;
          if(mat.transparent!==transparent){mat.transparent=transparent;mat.needsUpdate=true;}
          mat.opacity=opacity;mat.depthWrite=opacity>.6;
          o.castShadow=opacity>.5;
          mat.color.copy(original.originalColor);
        });
      }
      lastVisual=key;
    }
    root.updateMatrixWorld(true);
  }
  const anchors={
    sensor:()=>modules.sensor.localToWorld(V(0,24,45)),
    wings:()=>wingPivots[1].localToWorld(V(49,0,-12)),
    drive:()=>modules.drive.localToWorld(V(0,-7,16)),
    tail:()=>modules.tail.localToWorld(V(0,-4,-63)),
  };
  return {root,modules,update,anchors};
}
