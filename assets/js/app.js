
// ---- TASK MODAL LOGIC ----
export function initTaskModal(onComplete) {
  buildTaskModal();
  let activeTaskId=null,activeTaskUrl=null;
  let timerInterval=null,tabOpenedAt=null;
  let visibilityHandler=null,reportingTaskId=null;
  let requiredMs=30000;
  let activeTimeMs=0,mouseEvents=0,scrollEvents=0,focusLosses=0;
  let isPageActive=true,activeTrackInterval=null;

  async function getFingerprint(){
    try{
      const FP=await import('https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@4/+esm');
      const fp=await FP.load(); const r=await fp.get(); return r.visitorId;
    }catch{return null;}
  }

  function startTracking(){
    mouseEvents=0;scrollEvents=0;focusLosses=0;activeTimeMs=0;isPageActive=!document.hidden;
    clearInterval(activeTrackInterval);
    activeTrackInterval=setInterval(()=>{if(isPageActive&&!document.hidden)activeTimeMs+=250;},250);
    let lm=0,ls=0;
    const onM=()=>{const n=Date.now();if(n-lm>500){mouseEvents++;lm=n;}};
    const onS=()=>{const n=Date.now();if(n-ls>500){scrollEvents++;ls=n;}};
    const onV=()=>{if(document.hidden){isPageActive=false;focusLosses++;}else{isPageActive=true;}};
    const onBlur=()=>{isPageActive=false;};
    const onFocus=()=>{isPageActive=true;};
    document.addEventListener('mousemove',onM,{passive:true});
    document.addEventListener('touchmove',onM,{passive:true});
    document.addEventListener('click',onM,{passive:true});
    document.addEventListener('scroll',onS,{passive:true});
    window.addEventListener('scroll',onS,{passive:true});
    document.addEventListener('visibilitychange',onV);
    window.addEventListener('blur',onBlur);
    window.addEventListener('focus',onFocus);
    window._nbCleanup=()=>{
      clearInterval(activeTrackInterval);
      document.removeEventListener('mousemove',onM);
      document.removeEventListener('touchmove',onM);
      document.removeEventListener('click',onM);
      document.removeEventListener('scroll',onS);
      window.removeEventListener('scroll',onS);
      document.removeEventListener('visibilitychange',onV);
      window.removeEventListener('blur',onBlur);
      window.removeEventListener('focus',onFocus);
    };
  }
  function stopTracking(){if(window._nbCleanup){window._nbCleanup();window._nbCleanup=null;}}

  window.openTaskModal=async(taskId)=>{
    activeTaskId=taskId;
    clearInterval(timerInterval);removeVis();stopTracking();resetModal();
    const {data:task}=await supabase.from('tasks').select('*').eq('id',taskId).single();
    if(!task){toast('Task not found','error');return;}
    activeTaskUrl=task.target;
    const isD=task.platform==='discord';
    document.getElementById('tm-title').textContent=isD?'Join Discord Server':`${task.type} on ${task.platform}`;
    document.getElementById('tm-sub').textContent=task.description||task.target;
    document.getElementById('fs2-title').textContent=isD?'Stay in the server':'Stay on the page';
    document.getElementById('fs2-desc').textContent=isD?'Join and remain during the timer.':'Complete the action. Stay active on the page.';
    const {data,error}=await supabase.rpc('start_task',{p_task_id:taskId});
    if(error||data?.error){toast(data?.error||error.message,'error');return;}
    if(data.resumed&&data.link_clicked_at){
      const elapsed=Date.now()-new Date(data.link_clicked_at).getTime();
      requiredMs=data.required_ms||30000;
      const rem=requiredMs-elapsed;
      document.getElementById('tm-open-btn').style.display='none';
      document.getElementById('tm-submit-btn').style.display='inline-flex';
      document.getElementById('tm-timer-row').style.display='block';
      rem<=0?unlockSubmit():runTimer(rem);
      setStep(rem<=0?3:2);
    }
    document.getElementById('task-modal').classList.add('open');
  };

  // Send beacon to reset timer when tab closes mid-task
  function sendAbandonBeacon(taskId){
    if(!taskId) return;
    // sendBeacon works even as the page unloads
    // We pass the JWT so the edge function can auth the user
    supabase.auth.getSession().then(({data:{session}})=>{
      if(!session) return;
      const url='https://slufbzzfofzptwjefzmu.supabase.co/functions/v1/task-abandon';
      const blob=new Blob([JSON.stringify({task_id:taskId})],{type:'application/json'});
      // sendBeacon doesn't support custom headers, so we append token as query param
      // Edge function reads Authorization header — use fetch with keepalive instead
      fetch(url,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
        body:JSON.stringify({task_id:taskId}),
        keepalive:true  // key: browser sends this even if page is closing
      }).catch(()=>{});
    });
  }

  // Register tab-close / navigation handlers
  function registerAbandonHandlers(){
    const handler=(e)=>{ sendAbandonBeacon(activeTaskId); };
    window.addEventListener('pagehide',handler);
    window.addEventListener('beforeunload',handler);
    window._nbAbandonCleanup=()=>{
      window.removeEventListener('pagehide',handler);
      window.removeEventListener('beforeunload',handler);
    };
  }
  function unregisterAbandonHandlers(){
    if(window._nbAbandonCleanup){window._nbAbandonCleanup();window._nbAbandonCleanup=null;}
  }

  window.closeTaskModal=()=>{
    document.getElementById('task-modal').classList.remove('open');
    clearInterval(timerInterval);removeVis();stopTracking();
    unregisterAbandonHandlers();
    activeTaskId=null;activeTaskUrl=null;
  };

  window.openTaskLink=async()=>{
    const btn=document.getElementById('tm-open-btn');
    btn.disabled=true;btn.textContent='Opening...';
    const fp=await getFingerprint();
    const {data,error}=await supabase.rpc('record_link_click',{p_task_id:activeTaskId,p_fingerprint:fp||null,p_ip_hash:null});
    if(error||data?.error){
      document.getElementById('tm-err').textContent=data?.error||error.message;
      btn.disabled=false;btn.textContent='Open link';return;
    }
    requiredMs=data.required_ms||30000;
    const url=activeTaskUrl.startsWith('http')?activeTaskUrl:'https://'+activeTaskUrl;
    window.open(url,'_blank');
    tabOpenedAt=Date.now();
    btn.style.display='none';
    document.getElementById('tm-submit-btn').style.display='inline-flex';
    document.getElementById('tm-timer-row').style.display='block';
    setStep(2);startTracking();runTimer(requiredMs);setTimeout(setupVis,800);
    registerAbandonHandlers();
  };

  function runTimer(remainingMs){
    document.getElementById('tm-submit-btn').disabled=true;
    document.getElementById('tab-warning').style.display='none';
    let ms=Math.max(0,remainingMs);const total=requiredMs;
    document.getElementById('timer-label').innerHTML=`Stay active on the task page... <span id="timer-count">${Math.ceil(ms/1000)}</span>s`;
    document.getElementById('timer-bar').style.width=((total-ms)/total*100)+'%';
    clearInterval(timerInterval);
    timerInterval=setInterval(()=>{
      ms-=250;
      document.getElementById('timer-bar').style.width=Math.min(100,(total-ms)/total*100)+'%';
      const el=document.getElementById('timer-count');if(el)el.textContent=Math.max(0,Math.ceil(ms/1000));
      if(ms<=0){clearInterval(timerInterval);unlockSubmit();}
    },250);
  }

  function unlockSubmit(){
    document.getElementById('tm-submit-btn').disabled=false;
    document.getElementById('timer-label').innerHTML='Time complete - claim your points!';
    document.getElementById('timer-bar').style.width='100%';setStep(3);
  }

  function setupVis(){
    removeVis();let firstIgnored=false;
    visibilityHandler=()=>{
      if(document.hidden){if(!firstIgnored){firstIgnored=true;return;}document.getElementById('tab-warning').style.display='block';}
      else{firstIgnored=true;}
    };
    document.addEventListener('visibilitychange',visibilityHandler);
  }
  function removeVis(){if(visibilityHandler){document.removeEventListener('visibilitychange',visibilityHandler);visibilityHandler=null;}}

  function setStep(a){
    for(let i=1;i<=3;i++)document.getElementById('fs-'+i).className='flow-step'+(i<a?' flow-step-done':i===a?' flow-step-active':'');
  }

  function resetModal(){
    document.getElementById('tm-err').textContent='';
    document.getElementById('tab-warning').style.display='none';
    document.getElementById('tm-timer-row').style.display='none';
    document.getElementById('tm-open-btn').style.display='inline-flex';
    document.getElementById('tm-open-btn').disabled=false;
    document.getElementById('tm-open-btn').textContent='Open link';
    document.getElementById('tm-submit-btn').style.display='none';
    document.getElementById('tm-submit-btn').disabled=true;
    document.getElementById('tm-submit-btn').textContent='Claim points';
    document.getElementById('timer-bar').style.width='0%';setStep(1);
  }

  window.submitTask=async()=>{
    const btn=document.getElementById('tm-submit-btn');
    btn.disabled=true;btn.textContent='Verifying...';stopTracking();
    const {data,error}=await supabase.rpc('submit_task',{
      p_task_id:activeTaskId,p_active_time_ms:activeTimeMs,
      p_mouse_events:mouseEvents,p_scroll_events:scrollEvents,p_focus_losses:focusLosses
    });
    if(error||data?.error){
      document.getElementById('tm-err').textContent=data?.error||error.message;
      btn.disabled=false;btn.textContent='Claim points';return;
    }
    unregisterAbandonHandlers();
    window.closeTaskModal();
    const msg=data.reputation_multiplier<1.0
      ?`+${data.points_earned} pts! Build reputation to earn full rewards.`
      :`+${data.points_earned} points earned!`;
    toast(msg,'success');
    if(onComplete)onComplete(data.points_earned);
  };

  window.openReport=(taskId)=>{
    reportingTaskId=taskId;
    document.getElementById('report-err').textContent='';
    document.getElementById('report-modal').classList.add('open');
  };

  window.submitReport=async()=>{
    const reason=document.getElementById('report-reason').value;
    const {data,error}=await supabase.rpc('report_task',{p_task_id:reportingTaskId,p_reason:reason});
    if(error||data?.error){document.getElementById('report-err').textContent=data?.error||error.message;return;}
    document.getElementById('report-modal').classList.remove('open');
    toast('Reported. Thank you - you earned +2 reputation.','success');
  };
}
