import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {mix,smooth} from './model.js';

export const VIEWS={
  hero:{position:[260,220,300],target:[0,5,0]},
  front:{position:[0,120,430],target:[0,4,4]},
  side:{position:[430,125,0],target:[0,4,8]},
  top:{position:[0,460,12],target:[0,0,5]},
  detail:{position:[110,100,165],target:[0,25,0]},
};
export function createStage(canvas) {
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.17;
  renderer.setClearColor('#f3f2ed',0);
  const scene=new T.Scene();
  const camera=new T.PerspectiveCamera(34,1,.1,2500);
  camera.position.set(...VIEWS.hero.position);
  const controls=new OrbitControls(camera,canvas);
  controls.target.set(...VIEWS.hero.target);
  controls.enableDamping=true;controls.dampingFactor=.09;
  controls.minDistance=110;controls.maxDistance=850;
  controls.maxPolarAngle=Math.PI*.86;controls.enablePan=false;
  const pmrem=new T.PMREMGenerator(renderer);
  const room=new RoomEnvironment();
  const env=pmrem.fromScene(room,.03);scene.environment=env.texture;scene.environmentIntensity=.65;
  room.dispose();pmrem.dispose();
  const hemi=new T.HemisphereLight('#fff9ec','#777b75',2.1);scene.add(hemi);
  const key=new T.DirectionalLight('#fff5df',3.4);key.position.set(-80,180,110);key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-150;key.shadow.camera.right=150;key.shadow.camera.top=145;key.shadow.camera.bottom=-145;
  key.shadow.camera.near=1;key.shadow.camera.far=550;key.shadow.normalBias=.45;key.shadow.bias=-.0002;
  key.shadow.radius=4;scene.add(key);
  const fill=new T.DirectionalLight('#d8e7f0',1.7);fill.position.set(110,70,-120);scene.add(fill);
  const floor=new T.Mesh(new T.PlaneGeometry(2000,2000),new T.ShadowMaterial({color:'#656658',opacity:.12}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-85;floor.receiveShadow=true;scene.add(floor);
  // A subtle specimen stage provides a spatial reference without a visible box.
  const points=[];
  for(let i=0;i<120;i++) {
    const a=i/120*Math.PI*2;
    if(i%3!==0)points.push(new T.Vector3(Math.cos(a)*90,-84.9,Math.sin(a)*90));
  }
  const lineGeo=new T.BufferGeometry().setFromPoints(points);
  const ring=new T.Points(lineGeo,new T.PointsMaterial({color:'#b2b1a6',size:.8,sizeAttenuation:true}));scene.add(ring);
  let transition=null;
  let quality='high';
  function resize(){
    const rect=canvas.parentElement.getBoundingClientRect();
    renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();
  }
  function setView(name,instant=false,explosion=0) {
    const v=VIEWS[name]||VIEWS.hero;
    const mobile=canvas.clientWidth<600;
    const aspectFit=mobile?1:Math.max(1,1.3/camera.aspect);
    const factor=(mobile&&name!=='detail'?(name==='hero'?1.65:1.35):aspectFit)*(name==='hero'?1+explosion*.34:1);
    const position=new T.Vector3(...v.position).multiplyScalar(factor);
    const target=new T.Vector3(...v.target);
    if(instant){camera.position.copy(position);controls.target.copy(target);controls.update();transition=null;}
    else transition={from:camera.position.clone(),to:position,fromTarget:controls.target.clone(),toTarget:target,start:performance.now()};
  }
  controls.addEventListener('start',()=>{transition=null;});
  function draw(){
    if(transition){
      const t=Math.min(1,(performance.now()-transition.start)/1000),e=smooth(t);
      camera.position.lerpVectors(transition.from,transition.to,e);
      controls.target.lerpVectors(transition.fromTarget,transition.toTarget,e);
      if(t===1)transition=null;
    }
    controls.update();renderer.render(scene,camera);
  }
  function setQuality(value){
    quality=value;
    const dpr=value==='low'?1:Math.min(window.devicePixelRatio,1.75);
    renderer.setPixelRatio(dpr);renderer.shadowMap.enabled=value!=='low';
    resize();
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);
  resize();setView('hero',true);
  return {scene,camera,renderer,controls,draw,resize,setView,setQuality,get quality(){return quality;},
    async warm(){await renderer.compileAsync(scene,camera);},
    project(v){v.project(camera);return {x:(v.x*.5+.5)*canvas.clientWidth,y:(-v.y*.5+.5)*canvas.clientHeight,visible:v.z<1&&v.z>-1};}
  };
}
