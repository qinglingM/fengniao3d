import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {armPose} from './model.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export function createMachine(scene){
 const root=new T.Group();scene.add(root);
 const modules={};for(const n of ['hull','drive','arms','manifold','sensor']){modules[n]=new T.Group();root.add(modules[n]);}
 const material=(color,metalness=.7,roughness=.36)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const mats={white:material('#dcded6',.35),dark:material('#28383b'),steel:material('#9eafb0'),copper:material('#ba6940'),light:material('#70e1cd',.3)};
 Object.entries(mats).forEach(([name,m])=>m.name=name);
 mats.light.emissive=new T.Color('#25ad99');mats.light.emissiveIntensity=.7;
 const sphere=new T.SphereGeometry(1,12,8),cyl=new T.CylinderGeometry(1,1,1,12),box=new T.BoxGeometry(1,1,1);
 function mesh(p,g,m,pos=V(),scale=V(1,1,1)){const o=new T.Mesh(g,m);o.position.copy(pos);o.scale.copy(scale);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
 function rod(p,a,b,r,m){const d=b.clone().sub(a);const o=mesh(p,cyl,m,a.clone().add(b).multiplyScalar(.5),V(r,d.length(),r));o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return o;}
 function ring(p,r,t,pos,m,axis='y'){const o=mesh(p,new T.TorusGeometry(r,t,6,32),m,pos);if(axis==='y')o.rotation.x=Math.PI/2;return o;}
 function cable(p,pts,r,m){return mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(pts),20,r,5,false),m);}
 function bolt(p,pos,r=1){return mesh(p,new T.CylinderGeometry(r,r,.8,6),mats.dark,pos);}
 const rotors=[];
 function gear(p,r,y,teeth){const g=new T.Group();p.add(g);g.position.y=y;ring(g,r-1,1.8,V(),mats.copper);ring(g,r*.35,1.5,V(),mats.steel);for(let i=0;i<teeth;i++){const a=i/teeth*Math.PI*2;const tooth=mesh(g,box,mats.copper,V(Math.cos(a)*r,0,Math.sin(a)*r),V(2,3,2));tooth.rotation.y=-a;}for(let i=0;i<6;i++){const a=i*Math.PI/3;rod(g,V(Math.cos(a)*r*.35,0,Math.sin(a)*r*.35),V(Math.cos(a)*(r-2),0,Math.sin(a)*(r-2)),.9,mats.steel);}rotors.push(g);return g;}
 // Pressure hull: eight separate ceramic petals over a brass rib cage.
 const petals=[];
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,g=new T.Group();modules.hull.add(g);g.rotation.y=a;petals.push(g);
  const geo=new T.SphereGeometry(1,12,14,.09,Math.PI/4-.18,.12,Math.PI*.66);
  mesh(g,geo,mats.white,V(0,25,0),V(31,48,31));
  cable(g,[V(0,65,5),V(0,53,24),V(0,27,32),V(0,1,24)],1.1,mats.copper);
  for(let j=0;j<5;j++){const y=13+j*6;rod(g,V(-3,y,31),V(3,y+1,31),.55,mats.dark);}
  bolt(g,V(0,59,18),1.2);
 }
 for(const y of [0,12,30,48])ring(modules.hull,y===48?26:31,1,V(0,y,0),mats.steel);
 // Central turbine, transmission stack, eight pump cartridges and wiring loom.
 mesh(modules.drive,cyl,mats.dark,V(0,24,0),V(12,49,12));
 for(let i=0;i<12;i++){const a=i*Math.PI/6;rod(modules.drive,V(13*Math.cos(a),3,13*Math.sin(a)),V(13*Math.cos(a),46,13*Math.sin(a)),.7,mats.steel);}
 for(const y of [2,17,36,48])gear(modules.drive,y===17?22:17,y,32);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,x=Math.cos(a),z=Math.sin(a);
  rod(modules.drive,V(x*22,8,z*22),V(x*22,37,z*22),3,mats.dark);
  for(const y of [10,34])ring(modules.drive,3.2,.65,V(x*22,y,z*22),mats.copper);
  cable(modules.drive,[V(x*16,43,z*16),V(x*27,36,z*27),V(x*28,2,z*28),V(x*34,-5,z*34)],.8,mats.copper);
  rod(modules.drive,V(x*12,50,z*12),V(x*12,58,z*12),1,mats.light);
 }
 mesh(modules.drive,sphere,mats.light,V(0,57,0),V(7,7,7));
 // Lower manifold and protective circumferential cage.
 for(const y of [-12,-6,0])ring(modules.manifold,30,1.8,V(0,y,0),mats.dark);
 for(let i=0;i<16;i++){const a=i*Math.PI/8;rod(modules.manifold,V(30*Math.cos(a),-12,30*Math.sin(a)),V(30*Math.cos(a),0,30*Math.sin(a)),.8,mats.copper);}
 mesh(modules.manifold,cyl,mats.steel,V(0,-11,0),V(18,6,18));
 ring(modules.manifold,14,2,V(0,-15,0),mats.light);
 // Three front-facing gimbal optics.
 for(const x of [-15,0,15]){const y=x===0?29:23,z=x===0?33:28;
  mesh(modules.sensor,sphere,mats.dark,V(x,y,z),V(7,7,5));
  ring(modules.sensor,4.8,1,V(x,y,z+4),mats.copper,'z');
  mesh(modules.sensor,sphere,mats.light,V(x,y,z+5),V(3.6,3.6,1.4));
 }
 // Nested joints give each arm continuous articulation; piston ends track the next joint.
 const arms=[],joints=[],pistons=[];
 for(let i=0;i<8;i++){
  const base=new T.Group();modules.arms.add(base);base.rotation.y=i*Math.PI/4;arms.push(base);
  let parent=base;
  for(let j=0;j<10;j++){
   const g=new T.Group();parent.add(g);if(j)g.position.x=17-(j-1)*.85;parent=g;joints.push({g,i,j});
   const r=6.5-j*.48,len=17-j*.85;
   rod(g,V(0,0,-r),V(0,0,r),r*.68,mats.dark);
   for(const side of [-1,1]){
    ring(g,r*.62,.65,V(0,0,side*(r+.2)),mats.copper,'z');
    mesh(g,sphere,mats.steel,V(0,0,side*(r+.3)),V(r*.28,r*.28,.6));
    rod(g,V(1,0,side*r*.62),V(len,0,side*r*.45),.7,mats.steel);
    // Paired suction cups with a recessed dark center and concentric rim.
    for(const f of [.3,.75]){
     const p=V(len*f,-r*.6,side*r*.42);
     rod(g,p.clone().add(V(0,1,0)),p.clone().add(V(0,-1.8,0)),r*.26,mats.dark);
     ring(g,r*.36,.5,p.clone().add(V(0,-2,0)),mats.white);
     mesh(g,cyl,mats.dark,p.clone().add(V(0,-2,0)),V(r*.26,.25,r*.26));
    }
   }
   const armor=mesh(g,new T.CylinderGeometry(r*.68,r*.86,len*.7,6,1,true),mats.white,V(len*.52,1,0));armor.rotation.z=Math.PI/2;
   rod(g,V(2,r*.62,0),V(len-1,r*.5,0),.65,mats.copper);
   mesh(g,box,mats.dark,V(len*.52,r*.79,0),V(len*.35,.65,2));
   mesh(g,box,mats.light,V(len*.52,r*.8+.4,0),V(len*.18,.3,.65));
   if(j<9){const p=rod(g,V(2,r*.6,-r*.7),V(len,r*.6,-r*.7),.6,mats.steel);pistons.push({p,g,r,len,i,j});rod(g,V(2,r*.6,-r*.7),V(len*.58,r*.6,-r*.7),1.1,mats.dark);}
  }
  mesh(parent,new T.ConeGeometry(1.8,7,12),mats.copper,V(11,0,0)).rotation.z=-Math.PI/2;
 }
 // Merge static hardware inside each articulated link, retaining independent joint transforms.
 function batch(p){for(const c of [...p.children])if(c.isGroup)batch(c);const buckets=new Map();for(const c of [...p.children]){if(!c.isMesh||pistons.some(x=>x.p===c))continue;const k=c.material;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(c);}for(const [m,items]of buckets){const geos=items.map(o=>{o.updateMatrix();return o.geometry.clone().applyMatrix4(o.matrix);});const merged=mergeGeometries(geos);geos.forEach(g=>g.dispose());if(merged){items.forEach(o=>p.remove(o));mesh(p,merged,m.clone());}}}
 batch(root);
 // Eight arms share identical link hardware. Instance each link/material across arms.
 const instanceBuckets=new Map();
 for(const {g,j} of joints)for(const o of [...g.children]){
  if(!o.isMesh)continue;
  const key=pistons.some(p=>p.p===o)?'piston':`${j}:${o.material.name}`;
  if(!instanceBuckets.has(key))instanceBuckets.set(key,[]);
  instanceBuckets.get(key).push({o,parent:g});g.remove(o);
 }
 const instances=[];
 for(const items of instanceBuckets.values()){
  const inst=new T.InstancedMesh(items[0].o.geometry,items[0].o.material,items.length);
  inst.instanceMatrix.setUsage(T.DynamicDrawUsage);inst.castShadow=true;inst.receiveShadow=true;inst.frustumCulled=false;
  modules.arms.add(inst);instances.push({inst,items});
 }
 const world=new T.Matrix4();let last='';
 function update(s,opts){
  for(const {g,i,j}of joints){const pose=armPose(s.phase,i,j);g.rotation.z=pose.bend;g.rotation.y=pose.sway;}
  arms.forEach((b,i)=>{const a=i*Math.PI/4;b.position.set(Math.cos(a)*(29+opts.explode*27),-5, -Math.sin(a)*(29+opts.explode*27));});
  for(const {p,r,len,i,j}of pistons){const pose=armPose(s.phase,i,j+1),a=V(2,r*.6,-r*.7),b=V(len-Math.sin(pose.bend)*r*.6,Math.cos(pose.bend)*r*.6,-r*.7),d=b.clone().sub(a);p.position.copy(a).add(b).multiplyScalar(.5);p.scale.set(.6,d.length(),.6);p.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());}
  petals.forEach((g,i)=>{const a=i*Math.PI/4;g.position.set(Math.sin(a)*opts.explode*28,opts.explode*35,Math.cos(a)*opts.explode*28);});
  modules.sensor.position.z=opts.explode*32;modules.manifold.position.y=-opts.explode*30;
  rotors.forEach((g,i)=>{g.rotation.y=s.phase*(i%2?-2:1);g.position.y=[2,17,36,48][i]+opts.explode*i*8;});
  const key=opts.system+'|'+opts.xray;if(key!==last){for(const [name,g]of Object.entries(modules)){g.visible=opts.system==='all'||opts.system===name||(opts.system==='drive'&&name==='hull');g.traverse(o=>{if(o.isMesh){const opacity=name==='hull'&&(opts.xray||opts.system==='drive')?.12:1;o.material.transparent=opacity<1;o.material.opacity=opacity;o.material.depthWrite=opacity===1;o.castShadow=opacity===1;}});}last=key;}
  root.updateMatrixWorld(true);
  for(const {inst,items} of instances){items.forEach(({o,parent},i)=>{o.updateMatrix();world.multiplyMatrices(parent.matrixWorld,o.matrix);inst.setMatrixAt(i,world);});inst.instanceMatrix.needsUpdate=true;inst.computeBoundingBox();}
 }
 const anchors={sensor:()=>modules.sensor.localToWorld(V(15,23,33)),drive:()=>modules.drive.localToWorld(V(0,46,0)),arms:()=>joints[14].g.localToWorld(V(5,0,0)),manifold:()=>modules.manifold.localToWorld(V(12,-14,15))};
 return {root,modules,update,anchors,arms,joints};
}
