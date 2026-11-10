import {createMachine} from './machine.js';
import {createStage} from './stage.js';
import {solve,P,TAU,DEG,TOUR,TOUR_DURATION,tourAt,mix,armPose} from './model.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={phase:.62,frequency:.6,speed:1,playing:!reduced,system:'all',xray:false,labels:true,explode:0,view:'hero',tour:!reduced};
let stage,machine,frame=solve(state.phase),last=performance.now(),lastInput=last,tourStart=last,tourIndex=-1;
let actualExplode=0,frames=0,fpsStart=last,fps=60,lowFpsWindows=0,manualQuality=false,chartRect=null;
let lastPanelTime=0,suspendedCapture=false,rafId=0;
const chart=$('#wave-chart'),ctx=chart.getContext('2d');
const callouts=$$('.callout');
const systemNames={all:'Assembly',drive:'Drive',arms:'Arms',hull:'Hull',manifold:'Manifold'};

function fillRange(el,value,min=Number(el.min),max=Number(el.max)) {el.style.setProperty('--fill',`${(value-min)/(max-min)*100}%`);}
function buttons(selector,attribute,value){$$(selector).forEach(b=>{const on=b.dataset[attribute]===String(value);b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});}
function syncControls(){
  $('#frequency').value=state.frequency;$('#frequency-value').textContent=state.frequency.toFixed(1);fillRange($('#frequency'),state.frequency);
  $('#explode').value=state.explode*100;$('#explode-value').textContent=`${Math.round(state.explode*100)}%`;fillRange($('#explode'),state.explode*100);
  $('#xray').setAttribute('aria-checked',String(state.xray));$('#labels').setAttribute('aria-checked',String(state.labels));
  buttons('[data-speed]','speed',state.speed);buttons('[data-view]','view',state.view);buttons('[data-system]','system',state.system);
  $('#speed-value').textContent=state.speed===1?'1×':`1/${Math.round(1/state.speed)}×`;
  $('#play').setAttribute('aria-label',state.playing?'Pause simulation':'Resume simulation');
  $('#play-icon').setAttribute('d',state.playing?'M5 4v10M12 4v10':'M5 3 14 9 5 15Z');
  $('#play-icon').setAttribute('fill',state.playing?'none':'currentColor');
  $('#tour').setAttribute('aria-pressed',String(state.tour));$('#tour-label').textContent=state.tour?'Tour running':'Start tour';
  $('#tour-cursor').style.display=state.tour?'flex':'none';$('#callouts').style.opacity=state.labels?'1':'0';
}
function takeControl(){
  if(suspendedCapture){suspendedCapture=false;last=performance.now();fpsStart=last;frames=0;}
  lastInput=performance.now();
  if(state.tour){state.tour=false;$('#stage-message').textContent='';syncControls();}
}
function selectView(view,instant=false){state.view=view;stage?.setView(view,instant,state.system==='all'?state.explode:0);buttons('[data-view]','view',view);}
function startTour(){
  state.tour=true;state.playing=true;tourStart=performance.now();tourIndex=-1;state.frequency=.6;state.speed=1;syncControls();
}
function reset(){
  takeControl();Object.assign(state,{phase:.62,frequency:.6,speed:1,playing:!reduced,system:'all',xray:false,labels:true,explode:0});
  selectView('hero');syncControls();
  $('#stage-message').textContent='';
}

function drawChart(s){
  const w=chart.clientWidth,h=chart.clientHeight;
  const dpr=Math.min(devicePixelRatio,2);
  if(!chartRect||chartRect.w!==w||chartRect.h!==h||chartRect.dpr!==dpr){chart.width=w*dpr;chart.height=h*dpr;chartRect={w,h,dpr};}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const top=8,bottom=h-8,mid=(top+bottom)/2,scale=(bottom-top)/120;
  ctx.strokeStyle='#d6dacb';ctx.lineWidth=.6;ctx.setLineDash([2,4]);
  for(const a of [-45,0,45]){ctx.beginPath();ctx.moveTo(0,mid-a*scale);ctx.lineTo(w,mid-a*scale);ctx.stroke();}
  ctx.setLineDash([]);
  const plot=(key,color)=>{
    ctx.beginPath();for(let i=0;i<=120;i++){
      const f=solve(i/120*TAU,s.frequency),x=i/120*w,y=mid-(key==='rootAngle'?armPose(f.phase,0,0).bend:armPose(f.phase,0,5).bend)*DEG*scale;
      i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    }ctx.strokeStyle=color;ctx.lineWidth=1.2;ctx.stroke();
  };
  plot('jointAngle','#9aa68b');plot('rootAngle','#df623e');
  const x=s.phase/TAU*w;
  ctx.strokeStyle='#afb8a1';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x,top-5);ctx.lineTo(x,bottom+5);ctx.stroke();
  for(const [key,color] of [['rootAngle','#df623e'],['jointAngle','#9aa68b']]){
    const y=mid-(key==='rootAngle'?armPose(s.phase,0,0).bend:armPose(s.phase,0,5).bend)*DEG*scale;ctx.beginPath();ctx.arc(x,y,2.4,0,TAU);ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#f3f2ed';ctx.lineWidth=1;ctx.stroke();
  }
}
function updatePanels(s){
  $('#flap-value').innerHTML=`${(armPose(s.phase,0,0).bend*DEG).toFixed(1)}<span>°</span>`;
  $('#pitch-value').innerHTML=`${(armPose(s.phase,0,5).bend*DEG).toFixed(1)}<span>°</span>`;
  $('#slider-value').innerHTML=`${s.displacement.toFixed(2)} <small>mm</small>`;
  $('#rpm-value').innerHTML=`${s.motorRpm.toLocaleString('en-US',{maximumFractionDigits:0})} <small>rpm</small>`;
  const deg=s.phase*DEG;
  $('#phase-value').textContent=`${Math.round(deg).toString().padStart(3,'0')}°`;
  $('#phase').value=deg;fillRange($('#phase'),deg);
  $('#stroke-label').textContent=Math.sin(s.phase)>0?'Curl':'Extend';
  drawChart(s);
  const k=6.4,cx=57,cy=72;
  const px=cx+s.crank.x*k,py=cy+s.crank.y*k,bx=cx+s.slider*k;
  $('#diagram-crank').setAttribute('d',`M${cx} ${cy}L${px} ${py}`);
  $('#diagram-rod').setAttribute('d',`M${px} ${py}L${bx} ${cy}`);
  $('#diagram-pin').setAttribute('cx',px);$('#diagram-pin').setAttribute('cy',py);
  $('#diagram-slider').setAttribute('transform',`translate(${bx},${cy})`);
}
function updateLabels(){
  if(!state.labels||!machine)return;
  for(const el of callouts){
    const key=el.dataset.anchor,p=stage.project(machine.anchors[key]());
    const relevant=state.system==='all'||key===state.system||(state.system==='hull'&&key==='drive');
    el.style.left=`${p.x}px`;el.style.top=`${p.y}px`;el.style.opacity=p.visible&&relevant?'1':'0';
  }
}
function refreshFrame(){
  frame=solve(state.phase,state.frequency);
  machine?.update(frame,{...state,explode:actualExplode});
  stage?.draw();updatePanels(frame);updateLabels();
}
function updateTour(now){
  const beat=tourAt((now-tourStart)/1000);
  state.phase=beat.phase;
  if(beat.index!==tourIndex){
    tourIndex=beat.index;state.system=beat.system;state.xray=beat.xray;state.explode=beat.explode;
    selectView(beat.view);syncControls();
    $('#stage-message').textContent=beat.detail;
    const target=beat.index===0?'#tour':beat.index===1?'#xray':beat.index===2?'[data-system="arms"]':beat.index===3?'#explode':beat.index===4?'[data-view="top"]':'[data-view="hero"]';
    const r=$(target).getBoundingClientRect();
    $('#tour-cursor').style.left=`${r.x+r.width*.6}px`;$('#tour-cursor').style.top=`${r.y+r.height*.5}px`;
  }
  $('#tour-cursor').classList.toggle('pressing',beat.local-TOUR[beat.index].at>1&&beat.local-TOUR[beat.index].at<1.5);
}
function animate(now){
  rafId=requestAnimationFrame(animate);
  if(suspendedCapture)return;
  const dt=Math.min(.05,(now-last)/1000);last=now;
  const dialogOpen=$('#about-dialog').open;
  if(!dialogOpen){
    if(!state.tour&&!reduced&&now-lastInput>25000)startTour();
    if(state.tour)updateTour(now);
    else if(state.playing)state.phase+=dt*TAU*state.frequency*state.speed;
  }
  actualExplode=mix(actualExplode,state.explode,1-Math.exp(-dt*5));
  frame=solve(state.phase,state.frequency);machine.update(frame,{...state,explode:actualExplode});
  stage.draw();updateLabels();
  if(now-lastPanelTime>(stage.quality==='low'?65:32)) {updatePanels(frame);lastPanelTime=now;}
  frames++;
  if(now-fpsStart>1600){
    fps=Math.round(frames*1000/(now-fpsStart));frames=0;fpsStart=now;
    $('#performance').textContent=`${fps} fps · Local simulation`;
    document.documentElement.dataset.drawCalls=String(stage.renderer.info.render.calls);
    document.documentElement.dataset.triangles=String(stage.renderer.info.render.triangles);
    if(fps<30)lowFpsWindows++;else lowFpsWindows=0;
    if(!manualQuality&&lowFpsWindows>=2&&stage.quality!=='low'){stage.setQuality('low');$('#quality').textContent='Quality: Light';}
  }
}

// Every physical input hands the console back to the visitor.
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#tour'))takeControl();},{passive:true});
document.addEventListener('wheel',()=>takeControl(),{passive:true});
document.addEventListener('pointermove',e=>{if(e.buttons)lastInput=performance.now();},{passive:true});
$('#frequency').addEventListener('input',e=>{takeControl();state.frequency=Number(e.target.value);syncControls();refreshFrame();});
$('#explode').addEventListener('input',e=>{takeControl();state.explode=Number(e.target.value)/100;if(state.system==='all'&&state.view==='hero')stage?.setView('hero',false,state.explode);syncControls();});
$('#phase').addEventListener('input',e=>{takeControl();state.playing=false;state.phase=Number(e.target.value)/DEG;syncControls();refreshFrame();});
$$('[data-speed]').forEach(b=>b.addEventListener('click',()=>{takeControl();state.speed=Number(b.dataset.speed);syncControls();}));
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>{takeControl();selectView(b.dataset.view);syncControls();}));
$$('[data-system]').forEach(b=>b.addEventListener('click',()=>{
  takeControl();state.system=b.dataset.system;
  if(state.system==='drive')selectView('detail');
  else if(state.system==='arms')selectView('top');
  else selectView('hero');
  if(state.system==='drive')state.xray=true;
  $('#stage-message').textContent=state.system==='all'?'':`Focus · ${systemNames[state.system]}`;
  syncControls();
}));
$('#xray').addEventListener('click',()=>{state.xray=!state.xray;syncControls();});
$('#labels').addEventListener('click',()=>{state.labels=!state.labels;syncControls();});
$('#play').addEventListener('click',()=>{takeControl();state.playing=!state.playing;syncControls();});
$('#reset').addEventListener('click',reset);
$('#tour').addEventListener('click',()=>{if(state.tour)takeControl();else startTour();});
$('#about-button').addEventListener('click',()=>{takeControl();$('#about-dialog').showModal();});
$('#close-about').addEventListener('click',()=>{$('#about-dialog').close();lastInput=performance.now();});
$('#about-dialog').addEventListener('click',e=>{if(e.target===$('#about-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.x||e.clientX>r.right||e.clientY<r.y||e.clientY>r.bottom)e.target.close();}});
$('#about-dialog').addEventListener('close',()=>{lastInput=performance.now();last=performance.now();});
$('#quality').addEventListener('click',()=>{
  takeControl();manualQuality=true;const q=stage.quality==='high'?'low':'high';stage.setQuality(q);$('#quality').textContent=`Quality: ${q==='low'?'Light':'Fine'}`;
});
document.addEventListener('keydown',e=>{
  if(e.target instanceof HTMLInputElement||$('#about-dialog').open)return;
  takeControl();
  if(e.code==='Space'){e.preventDefault();state.playing=!state.playing;syncControls();}
  if(e.key.toLowerCase()==='r')reset();
  if(e.key.toLowerCase()==='h'){document.body.classList.toggle('panels-hidden');stage?.resize();}
});
document.addEventListener('visibilitychange',()=>{last=performance.now();fpsStart=last;frames=0;});

async function init(){
  try {
    stage=createStage($('#scene'));machine=createMachine(stage.scene);
    machine.update(frame,state);syncControls();updatePanels(frame);stage.draw();
    await stage.warm();
    for(const visual of [{system:'all',xray:true},{system:'arms',xray:true}]){
      machine.update(frame,{...state,...visual});await stage.warm();
    }
    machine.update(frame,state);stage.draw();$('#loading').classList.add('loaded');
    last=performance.now();tourStart=last;lastInput=last;
    rafId=requestAnimationFrame(animate);
    new ResizeObserver(()=>{stage.draw();updateLabels();}).observe($('#stage'));
    // A deterministic rendering surface for frame capture and the article's review workflow.
    window.study={
      getState:()=>({...state,model:{...frame},actualExplode,fps,quality:stage.quality,drawCalls:stage.renderer.info.render.calls,triangles:stage.renderer.info.render.triangles}),
      renderAt(t,overrides={}) {
        suspendedCapture=true;
        const beat=tourAt(t);
        Object.assign(state,{phase:beat.phase,system:beat.system,xray:beat.xray,explode:beat.explode,view:beat.view,tour:false},overrides);
        actualExplode=state.explode;frame=solve(state.phase,state.frequency);
        machine.update(frame,state);stage.setView(state.view,true,state.system==='all'?state.explode:0);syncControls();updatePanels(frame);
        $('#stage-message').textContent=beat.detail;stage.draw();updateLabels();
        return {t,beat:beat.name,phase:frame.phase,system:state.system};
      },
      resume(){suspendedCapture=false;last=performance.now();lastInput=last;},
      tour:TOUR,parameters:P,
    };
    document.documentElement.dataset.ready='true';
    const query=new URLSearchParams(location.search);
    if(query.has('frame')) {
      const overrides={playing:false};
      if(query.has('phase'))overrides.phase=Number(query.get('phase'))/DEG;
      if(query.has('view')&&['hero','front','side','top','detail'].includes(query.get('view')))overrides.view=query.get('view');
      if(query.has('system')&&['all','drive','hull','arms','manifold'].includes(query.get('system')))overrides.system=query.get('system');
      if(query.has('explode'))overrides.explode=Math.max(0,Math.min(1,Number(query.get('explode'))));
      window.study.renderAt(Number(query.get('frame'))||0,overrides);
      $('#performance').textContent='Deterministic frame';
    }
  }catch(error){
    console.error(error);$('#loading').innerHTML='<span></span> Unable to start the 3D view. Please use a browser with WebGL support.';
    $('#performance').textContent='3D view unavailable';
  }
}
init();
