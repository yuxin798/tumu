(()=>{'use strict';
if(document.getElementById('ai-guide'))return;
const base=new URL('.',document.currentScript.src);
const root=document.createElement('aside');root.id='ai-guide';root.setAttribute('aria-label','AI智能讲解');
root.innerHTML=`<section id="ai-panel" hidden aria-label="钢筋质量检测讲解"><header><div class="ai-heading"><b class="ai-note">♫</b><div><h2>AI钢筋监测</h2><small>语音讲解 · 同步字幕</small></div></div><button id="ai-close" aria-label="收起并暂停讲解">×</button></header><div id="ai-status">▥　准备讲解</div><div id="ai-captions" role="region" aria-label="同步讲解文字" tabindex="0"></div><input id="ai-progress" type="range" min="0" max="100" value="0" step="0.01" aria-label="讲解播放进度"><div id="ai-controls"><button id="ai-play">播放</button><button id="ai-replay">重播</button><span id="ai-time">00:00 / 00:41</span></div><p id="ai-error" role="status" hidden></p></section><button id="ai-avatar" aria-label="点击播放AI讲解" aria-expanded="false" aria-controls="ai-panel" aria-pressed="false"><img alt="橘黄帽智能管家" width="240" height="320"><span class="ai-avatar-label"><strong>钢筋监测助手</strong><small id="ai-avatar-status">点击开始讲解</small></span></button>`;
document.body.append(root);
const $=id=>root.querySelector('#'+id),audio=new Audio(new URL('narration.wav',base));audio.preload='none';
$('ai-avatar').querySelector('img').src=new URL('assistant.webp',base);
const cues=window.AI_GUIDE_CUES||[];
const lines=cues.map(c=>{const p=document.createElement('p');p.textContent=c.text;$('ai-captions').append(p);return p;});
let active=-1,raf=0,manualUntil=0;
const fmt=s=>{s=Math.max(0,Math.floor(s||0));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
function sync(force=false){const t=audio.currentTime,d=audio.duration;let i=cues.findIndex(c=>t>=c.start&&t<c.end);if(i<0){for(let n=0;n<cues.length;n++)if(t>=cues[n].start)i=n;}if(i!==active||force){active=i;lines.forEach((p,n)=>{p.classList.toggle('active',n===i);if(n===i)p.setAttribute('aria-current','true');else p.removeAttribute('aria-current');});if(i>=0&&!$('ai-panel').hidden&&(force||Date.now()>manualUntil)){const box=$('ai-captions'),p=lines[i];box.scrollTo({top:Math.max(0,p.offsetTop-box.clientHeight/2+p.clientHeight/2),behavior:force?'auto':'smooth'});}}if(Number.isFinite(d)&&d>0){$('ai-progress').max=d;$('ai-progress').value=t;}$('ai-time').textContent=fmt(t)+' / '+fmt(Number.isFinite(d)?d:40.56);}
function tick(){sync();if(!audio.paused)raf=requestAnimationFrame(tick);}
function open(){$('ai-panel').hidden=false;$('ai-avatar').setAttribute('aria-expanded','true');sync(true);placeBubble();}
function close(){audio.pause();$('ai-panel').hidden=true;$('ai-avatar').setAttribute('aria-expanded','false');$('ai-avatar').focus();}
async function play(){open();$('ai-error').hidden=true;if(audio.ended)audio.currentTime=0;try{await audio.play();}catch(e){$('ai-error').textContent='暂时无法播放，请确认 ai-guide 文件夹与网页放在一起后重试。';$('ai-error').hidden=false;}}
$('ai-avatar').onclick=e=>{if(Date.now()<suppressClickUntil&&e.detail!==0)return;if($('ai-panel').hidden||audio.paused)play();else audio.pause();};
$('ai-play').onclick=()=>audio.paused?play():audio.pause();$('ai-replay').textContent='重新播放';$('ai-replay').onclick=()=>{audio.currentTime=0;sync(true);play();};$('ai-close').onclick=close;
$('ai-progress').oninput=e=>{if(Number.isFinite(audio.duration)){audio.currentTime=Number(e.target.value);sync(true);}};
$('ai-captions').addEventListener('wheel',()=>manualUntil=Date.now()+3500,{passive:true});
// Drag only the mascot; moving it never starts or pauses audio.
let drag=null,suppressClickUntil=0;
const avatar=$('ai-avatar');avatar.title='点击播放或暂停，拖动移动位置';
function placeBubble(){const r=root.getBoundingClientRect(),panel=$('ai-panel');const width=Math.min(410,innerWidth-16);panel.style.width=width+'px';panel.style.left=Math.max(8-r.left,Math.min(r.width-width,innerWidth-8-r.left-width))+'px';const h=panel.offsetHeight||440;let top=r.height+12;if(r.top+top+h>innerHeight-8)top=r.top>=h+12?-h-12:8-r.top;panel.style.top=top+'px';}
function clampPosition(x,y){const r=root.getBoundingClientRect();root.style.right='auto';root.style.bottom='auto';root.style.left=Math.max(8,Math.min(x,innerWidth-r.width-8))+'px';root.style.top=Math.max(8,Math.min(y,innerHeight-r.height-8))+'px';placeBubble();}
avatar.addEventListener('pointerdown',e=>{if(e.button!==0)return;const r=root.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top,moved:false};if(avatar.setPointerCapture)avatar.setPointerCapture(e.pointerId);});
avatar.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>6)drag.moved=true;if(drag.moved){e.preventDefault();clampPosition(drag.left+dx,drag.top+dy);}});
function endDrag(e){if(!drag||e.pointerId!==drag.id)return;if(drag.moved)suppressClickUntil=Date.now()+500;drag=null;}
avatar.addEventListener('pointerup',endDrag);avatar.addEventListener('pointercancel',endDrag);avatar.addEventListener('lostpointercapture',()=>{drag=null;});
avatar.addEventListener('dragstart',e=>e.preventDefault());
window.addEventListener('resize',()=>{const r=root.getBoundingClientRect();clampPosition(r.left,r.top);});
placeBubble();
root.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
audio.addEventListener('play',()=>{$('ai-play').textContent='暂停讲解';$('ai-status').textContent='▥　正在讲解';$('ai-avatar-status').textContent='正在讲解 · 点击暂停';$('ai-avatar').setAttribute('aria-pressed','true');cancelAnimationFrame(raf);tick();});
audio.addEventListener('pause',()=>{$('ai-play').textContent=audio.ended?'再听一遍':'继续讲解';$('ai-status').textContent=audio.ended?'讲解结束':'讲解已暂停';$('ai-avatar-status').textContent=audio.ended?'点击重新播放':'已暂停 · 点击继续';$('ai-avatar').setAttribute('aria-pressed','false');cancelAnimationFrame(raf);sync();});
audio.addEventListener('ended',()=>{$('ai-play').textContent='再听一遍';$('ai-status').textContent='讲解结束';$('ai-avatar-status').textContent='点击重新播放';sync();});
['loadedmetadata','timeupdate','seeked'].forEach(e=>audio.addEventListener(e,()=>sync()));
audio.addEventListener('error',()=>{$('ai-error').hidden=false;$('ai-error').textContent='音频加载失败，请检查 ai-guide/narration.wav 是否完整。';});
document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.pause();});
window.addEventListener('pagehide',()=>audio.pause());sync();
})();
