/* Original LasO invitation audio layer. No animation, layout or navigation control. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory;
  else root.LasoInvitationAudio=factory(root,root.document);
})(typeof window==='undefined'?globalThis:window,function(root,doc){
  'use strict';
  const KEY='laso-invitation-muted-v1',BURN_SECONDS=8,VOICE_DELAY_MS=1000;
  const files={match:'audio/match-strike.mp3',fire:'audio/fire-crackle.mp3',thunder:'audio/thunder-crack.mp3'};
  // Owner recording is deliberately absent until supplied. No placeholder voice or 404 request.
  const voiceUrl=root.LasoInvitationAudioConfig?.voiceoverUrl;
  if(typeof voiceUrl==='string'&&voiceUrl)files.voice=voiceUrl;
  const buffers={},active=new Set();let decoder=null,ctx=null,master=null,fireEnvelope=null,duck=null,fire=null;
  let opened=false,flashed=false,stopped=false,muted=false,button=null,voiceTimer=null,openedAt=0;
  try{muted=root.localStorage.getItem(KEY)==='1';}catch(_){/* Storage is optional. */}
  const clock=()=>root.performance.now();
  const safeResume=()=>{try{return Promise.resolve(ctx.resume()).catch(()=>false);}catch(_){return Promise.resolve(false);}};
  function remember(){try{root.localStorage.setItem(KEY,muted?'1':'0');}catch(_){}}
  function updateButton(){if(!button)return;button.textContent=muted?'Sound off':'Sound on';button.setAttribute('aria-pressed',String(muted));button.setAttribute('aria-label',muted?'Unmute invitation sound':'Mute invitation sound');}
  function applyMute(){try{if(master){const t=ctx.currentTime;master.gain.cancelScheduledValues(t);master.gain.setValueAtTime(muted?0:.85,t);}}catch(_){}updateButton();}
  function showButton(){
    if(button)return;
    button=doc.createElement('button');button.id='invitationSoundToggle';button.type='button';
    button.style.cssText='position:fixed;top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));z-index:20;min-width:84px;min-height:44px;padding:10px 12px;border:1px solid #947746;border-radius:8px;background:#131410;color:#f5dfb4;font:12px Arial,sans-serif;cursor:pointer;touch-action:manipulation';
    button.addEventListener('click',()=>{muted=!muted;remember();applyMute();if(!muted&&ctx&&!stopped)safeResume();});
    doc.body.appendChild(button);updateButton();
  }
  function play(name,gainValue,when=ctx.currentTime,output=master){
    if(!buffers[name]||stopped)return null;
    try{
      const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffers[name];gain.gain.value=gainValue;
      source.connect(gain);gain.connect(output);source.onended=()=>{active.delete(source);try{source.disconnect();gain.disconnect();}catch(_){}};
      active.add(source);source.start(when);return source;
    }catch(_){return null;}
  }
  function startFire(reduced){
    if(reduced||!buffers.fire||flashed||stopped)return;
    try{
      const elapsed=(clock()-openedAt)/1000,t=ctx.currentTime;
      const matchDuration=buffers.match?Math.min(.9,buffers.match.duration):0;
      const delay=Math.max(0,matchDuration-elapsed),begins=t+delay;
      fireEnvelope=ctx.createGain();duck=ctx.createGain();fireEnvelope.gain.value=0;duck.gain.value=1;
      fireEnvelope.connect(duck);duck.connect(master);
      fireEnvelope.gain.setValueAtTime(0,begins);
      fireEnvelope.gain.linearRampToValueAtTime(.28,t+Math.max(delay+.01,BURN_SECONDS-elapsed));
      fire=ctx.createBufferSource();fire.buffer=buffers.fire;fire.loop=true;fire.connect(fireEnvelope);active.add(fire);
      fire.onended=()=>{active.delete(fire);try{fire.disconnect();fireEnvelope.disconnect();duck.disconnect();}catch(_){}};
      fire.start(begins);
    }catch(_){/* Unsupported audio cannot affect the invitation. */}
  }
  function startVoice(){
    voiceTimer=null;if(stopped||!ctx||ctx.state!=='running'||!buffers.voice)return;
    // Never deliver a delayed voice cue after a suspended/backgrounded context.
    if(clock()-openedAt>VOICE_DELAY_MS+250)return;
    try{
      const t=ctx.currentTime;if(duck){duck.gain.cancelScheduledValues(t);duck.gain.setValueAtTime(1,t);duck.gain.linearRampToValueAtTime(.2,t+.08);}
      const voice=play('voice',1);
      if(voice){const prior=voice.onended;voice.onended=()=>{prior?.();if(duck&&!flashed&&!stopped){try{const now=ctx.currentTime;duck.gain.cancelScheduledValues(now);duck.gain.setValueAtTime(.2,now);duck.gain.linearRampToValueAtTime(1,now+.3);}catch(_){}}};}
    }catch(_){}
  }
  function open({reducedMotion=false}={}){
    if(opened)return;opened=true;openedAt=clock();showButton();
    try{
      const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio)return;
      ctx=new Audio();master=ctx.createGain();master.connect(ctx.destination);applyMute();
      // The only initial resume is in the Open invitation gesture. Never await it in the animation.
      safeResume().then(()=>{
        if(stopped||ctx.state!=='running'||clock()-openedAt>450)return;
        play('match',.7);startFire(reducedMotion);
      }).catch(()=>{});
      voiceTimer=root.setTimeout(startVoice,VOICE_DELAY_MS);
    }catch(_){/* Audio disabled or unsupported: visual invitation proceeds unchanged. */}
  }
  function flash(){
    if(!opened||flashed||stopped)return;flashed=true;
    try{
      const t=ctx?.currentTime||0;
      if(fire){if(fireEnvelope){fireEnvelope.gain.cancelScheduledValues(t);fireEnvelope.gain.setValueAtTime(0,t);}fire.stop(t);active.delete(fire);fire=null;}
      if(ctx?.state==='running')play('thunder',.65);
    }catch(_){}
  }
  function stop(){
    if(!opened)return;
    stopped=true;if(voiceTimer!==null){root.clearTimeout(voiceTimer);voiceTimer=null;}
    for(const s of active){try{s.stop();s.disconnect();}catch(_){}}active.clear();fire=null;
    try{ctx?.close()?.catch(()=>{});}catch(_){}
  }
  async function preload(){
    try{const Offline=root.OfflineAudioContext||root.webkitOfflineAudioContext;if(!Offline)return;decoder=new Offline(1,1,22050);}catch(_){return;}
    await Promise.all(Object.entries(files).map(async([name,url])=>{
      try{const res=await root.fetch(url,{cache:'force-cache'});if(!res.ok)return;const bytes=await res.arrayBuffer();const buffer=await decoder.decodeAudioData(bytes);if(buffer)buffers[name]=buffer;}catch(_){/* Missing, blocked or invalid assets stay silent. */}
    }));
  }
  // At least one paint precedes preload. No autoplay, AudioContext resume or output node here.
  try{root.requestAnimationFrame(()=>root.requestAnimationFrame(()=>{preload().catch(()=>{});}));}catch(_){}
  root.addEventListener('pagehide',stop);
  doc.addEventListener('visibilitychange',()=>{if(doc.hidden)stop();});
  doc.querySelector('a[href^="sms:"]')?.addEventListener('click',stop);
  return Object.freeze({open,flash,stop});
});
