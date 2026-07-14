// ============================================================
// NEXT BOOST — app.js  (complete rebuild)
// ============================================================
import { supabase, esc } from './shared.js';
import { renderIcons, iconSVG } from '../../src/icons.js';
import '../../src/motion.js';
export { supabase, renderIcons };

function toast(msg, type='', duration=3600, isHtml=false){
  let el=document.getElementById('nb-toast');
  if(!el){el=document.createElement('div');el.id='nb-toast';el.className='toast';document.body.appendChild(el);}
  if(isHtml) el.innerHTML=msg; else el.textContent=msg;
  el.className=`toast show${type?' toast-'+type:''}`;
  clearTimeout(window._toastTimer);
  window._toastTimer=setTimeout(()=>el.classList.remove('show'),duration);
}

// ---- SERVICE WORKER & PWA ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// PWA install prompt — store event for later use
let _deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _deferredInstall = e;
  // Show install button in sidebar if not already installed
  const btn = document.getElementById('pwa-install-btn');
  if (btn) btn.style.display = 'flex';
});

window.promptPWAInstall = async () => {
  if (!_deferredInstall) return;
  _deferredInstall.prompt();
  const { outcome } = await _deferredInstall.userChoice;
  if (outcome === 'accepted') {
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.style.display = 'none';
  }
  _deferredInstall = null;
};

window.addEventListener('appinstalled', () => {
  const btn = document.getElementById('pwa-install-btn');
  if (btn) btn.style.display = 'none';
  _deferredInstall = null;
});

// ---- SCROLL REVEAL ----
// Any element with data-reveal fades/slides in once it enters the viewport.
// Safe no-op on pages that don't use it.
function initScrollReveal(){
  const els = document.querySelectorAll('[data-reveal]');
  if(!els.length) return;
  if(!('IntersectionObserver' in window)){ els.forEach(e=>e.classList.add('revealed')); return; }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){ entry.target.classList.add('revealed'); io.unobserve(entry.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(e=>io.observe(e));
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', initScrollReveal);
else initScrollReveal();

// ---- THEMES ----
export const THEMES={
  'dark-orange':{accent:'#E8621A',accentDk:'#C4430A',accentLt:'#F5843A',bg:'#0e0b09',surface:'#171210',surface2:'#211a16',surface3:'#2c221c',border:'#3a2a22',border2:'#4a3628'},
  'dark-purple':{accent:'#7c3aed',accentDk:'#5b21b6',accentLt:'#a855f7',bg:'#0d0a14',surface:'#130f1e',surface2:'#1c1630',surface3:'#271f40',border:'#32285a',border2:'#3e3270'},
  'dark-blue':  {accent:'#0ea5e9',accentDk:'#0369a1',accentLt:'#38bdf8',bg:'#090d14',surface:'#0d1320',surface2:'#131c2e',surface3:'#1a2840',border:'#1e3050',border2:'#243860'},
  'dark-green': {accent:'#22c55e',accentDk:'#15803d',accentLt:'#4ade80',bg:'#090e0b',surface:'#0d1510',surface2:'#121f17',surface3:'#172a1e',border:'#1e3826',border2:'#264830'},
  'midnight':   {accent:'#94a3b8',accentDk:'#64748b',accentLt:'#cbd5e1',bg:'#06070a',surface:'#0c0e14',surface2:'#111420',surface3:'#16192c',border:'#1e2238',border2:'#262b44'},
  'dark-red':   {accent:'#ef4444',accentDk:'#b91c1c',accentLt:'#f87171',bg:'#110a0a',surface:'#1a0f0f',surface2:'#241515',surface3:'#2e1c1c',border:'#3d2020',border2:'#4d2828'},
  'dark-pink':  {accent:'#ec4899',accentDk:'#be185d',accentLt:'#f472b6',bg:'#110a0f',surface:'#1a0f17',surface2:'#241523',surface3:'#2e1c2f',border:'#3d2040',border2:'#4d2850'},
  'dark-amber': {accent:'#f59e0b',accentDk:'#b45309',accentLt:'#fbbf24',bg:'#0f0d08',surface:'#181408',surface2:'#221c0f',surface3:'#2c2414',border:'#3d3010',border2:'#4d3c14'},
  'dark-teal':  {accent:'#14b8a6',accentDk:'#0f766e',accentLt:'#2dd4bf',bg:'#080f0e',surface:'#0c1714',surface2:'#111f1e',surface3:'#162826',border:'#1a3534',border2:'#204040'},
  'dracula':    {accent:'#bd93f9',accentDk:'#9d6ce9',accentLt:'#cfa8ff',bg:'#0d0d14',surface:'#161622',surface2:'#1e1e2e',surface3:'#282840',border:'#44475a',border2:'#555770'},
  'cyberpunk':  {accent:'#f0e040',accentDk:'#c8b800',accentLt:'#f8ee60',bg:'#080810',surface:'#0e0e1a',surface2:'#141424',surface3:'#1a1a30',border:'#2a2040',border2:'#302850'},
  'ocean':      {accent:'#38bdf8',accentDk:'#0284c7',accentLt:'#7dd3fc',bg:'#060d12',surface:'#0a1520',surface2:'#0f1e2e',surface3:'#14273c',border:'#1a3050',border2:'#203860'},
};

export function applyTheme(themeKey,customAccent=null){
  const t=THEMES[themeKey]||THEMES['dark-orange'];
  const r=document.documentElement;
  r.style.setProperty('--bg',t.bg);r.style.setProperty('--surface',t.surface);
  r.style.setProperty('--surface2',t.surface2);r.style.setProperty('--surface3',t.surface3);
  r.style.setProperty('--border',t.border);r.style.setProperty('--border2',t.border2);
  const acc=(customAccent&&/^#[0-9A-Fa-f]{6}$/.test(customAccent))?customAccent:null;
  const accentColor = acc||t.accent;
  r.style.setProperty('--orange',accentColor);
  r.style.setProperty('--orange-dk',acc||t.accentDk);
  r.style.setProperty('--orange-lt',acc||t.accentLt);
  // Update glow + button shadow to match accent
  r.style.setProperty('--glow',`0 0 32px ${accentColor}26`);
  r.style.setProperty('--btn-shadow',`0 4px 20px ${accentColor}72`);
  r.style.setProperty('--btn-shadow-sm',`0 2px 10px ${accentColor}50`);
}

// ---- AUTH GUARD ----
export async function initApp(currentPage=''){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){window.location.replace('/login/');return null;}
  const [pRes,uRes]=await Promise.all([
    supabase.from('profiles').select('*').eq('id',session.user.id).single(),
    supabase.auth.getUser()
  ]);
  if(pRes.error){window.location.replace('/login/');return null;}
  const profile=pRes.data;
  const email=uRes.data?.user?.email||'';
  // Update last_seen for live user count (fire and forget)
  supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', profile.id).then(() => {});

  applyTheme(profile.theme||'dark-orange',profile.accent_color||null);
  const fontMap={space:'font-space',mono:'font-mono',rounded:'font-rounded'};
  const fc=fontMap[profile.font_choice];
  if(fc) document.body.classList.add(fc);
  if(profile.font_choice==='rounded'){
    const lk=document.createElement('link');lk.rel='stylesheet';
    lk.href='https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap';
    document.head.appendChild(lk);
  }
  if(profile.compact_mode) document.body.classList.add('compact-mode');
  if(profile.custom_bg){document.body.style.backgroundImage=`url('${profile.custom_bg}')`;document.body.classList.add('has-custom-bg');}
  renderShell(profile,currentPage);
  // Run these after shell is fully rendered, non-blocking
  setTimeout(()=>{
    try{ checkDailyBonus(); }catch(e){ console.warn('checkDailyBonus',e); }
    try{ loadNotifCount(); }catch(e){ console.warn('loadNotifCount',e); }
    try{ subscribeNotifs(profile.id); }catch(e){ console.warn('subscribeNotifs',e); }
  }, 0);
  return{profile,email,session};
}

// ---- RENDER SHELL ----
function renderShell(profile,currentPage){
  const ini=(profile.display_name||profile.username||'U')[0].toUpperCase();
  const avatarHtml = profile.avatar_url
    ? `<img src="${profile.avatar_url}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0" alt="avatar"/>`
    : `<div style="width:32px;height:32px;border-radius:50%;background:${profile.avatar_color||'#E8621A'};display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:0.85rem;flex-shrink:0">${ini}</div>`;
  const nav=document.getElementById('main-nav');
  if(nav){
    nav.innerHTML=`
      <a class="nav-logo" href="/"><img src="/assets/img/logo.png" alt="Next Boost" style="height:36px;width:auto;object-fit:contain"/></a>
      <div class="nav-links" style="gap:8px">
        <button class="daily-pill" id="daily-pill" onclick="claimBonus()">
          <span class="dp-icon">${iconSVG('gift',16)}</span>
          <div style="display:flex;flex-direction:column;line-height:1.2">
            <span class="dp-label" id="dp-label">Daily bonus</span>
            <span class="dp-pts" id="dp-pts">+10 pts</span>
          </div>
          <span class="dp-streak" id="dp-streak" style="display:none"></span>
        </button>
        <a href="/store/" class="pts-pill" id="nav-pts-pill" title="Buy more points +" style="text-decoration:none;cursor:pointer">${iconSVG('zap',14)} <span id="nav-pts">${profile.points}</span> pts <span style="font-size:0.7rem;opacity:0.7">+</span></a>
        <button class="notif-btn" id="notif-btn" onclick="toggleNotifs()" title="Notifications">
          ${iconSVG('bell',17)}<span class="notif-dot" id="notif-dot" style="display:none"></span>
        </button>
      </div>`;
  }
  const sidebar=document.getElementById('app-sidebar');
  if(sidebar){
    const L1=[
      {href:'/earn/',icon:'zap',label:'Earn Points',page:'earn'},
      {href:'/completed/',icon:'circle-check',label:'Completed',page:'completed'},
      {href:'/post-task/',icon:'send',label:'Post a Task',page:'post-task'},
      {href:'/my-tasks/',icon:'clipboard',label:'My Tasks',page:'my-tasks'},
      {href:'/store/',icon:'credit-card',label:'Buy Points',page:'store'},
    ];
    const L2=[
      {href:'/leaderboard/',icon:'trophy',label:'Leaderboard',page:'leaderboard'},
      {href:'/achievements/',icon:'award',label:'Achievements',page:'achievements'},
      {href:'/referral/',icon:'users',label:'Referral',page:'referral'},
      {href:'/share/',icon:'sparkles',label:'Share your win',page:'share'},
    ];
    const L3=[
      {href:'/profile/',icon:'user',label:'Profile',page:'profile'},
      {href:'/settings/',icon:'settings',label:'Settings',page:'settings'},
      ...(profile.is_admin?[{href:'/admin/',icon:'shield-check',label:'Admin Panel',page:'admin'}]:[]),
    ];
    const rl=arr=>arr.map(l=>`<a href="${l.href}" class="sidebar-link ${currentPage===l.page?'active':''}"><span class="sidebar-icon">${iconSVG(l.icon,17)}</span>${l.label}</a>`).join('');
    sidebar.innerHTML=`
      <span class="sidebar-section-label">Earn</span>${rl(L1)}
      <span class="sidebar-section-label">Explore</span>${rl(L2)}
      <span class="sidebar-section-label">Account</span>${rl(L3)}
      <a href="/profile/" class="sidebar-user" style="margin-top:auto;text-decoration:none">
        ${avatarHtml}
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">${esc(profile.display_name||profile.username)}</div>
          <div class="sidebar-user-pts">${iconSVG('zap',12)} ${profile.points} pts · <span style="color:var(--orange)">Buy more →</span></div>
        </div>
      </a>
      <button id="pwa-install-btn" onclick="window.promptPWAInstall()" style="display:none;align-items:center;gap:10px;background:rgba(232,98,26,0.1);border:1px solid rgba(232,98,26,0.3);border-radius:var(--radius-sm);padding:10px 14px;color:var(--text);font-family:inherit;font-size:0.82rem;cursor:pointer;width:100%;margin-top:8px;font-weight:600">
        ${iconSVG('download',15)} Install app
      </button>`;
  }
  const mn=document.getElementById('mobile-nav');
  if(mn){
    mn.innerHTML=`<div class="mobile-nav-inner">
      <a href="/earn/"        class="mobile-nav-item ${currentPage==='earn'?'active':''}"><span class="mn-icon">${iconSVG('zap',18)}</span>Earn</a>
      <a href="/post-task/"   class="mobile-nav-item ${currentPage==='post-task'?'active':''}"><span class="mn-icon">${iconSVG('send',18)}</span>Post</a>
      <a href="/leaderboard/" class="mobile-nav-item ${currentPage==='leaderboard'?'active':''}"><span class="mn-icon">${iconSVG('trophy',18)}</span>Top</a>
      <a href="/profile/"     class="mobile-nav-item ${currentPage==='profile'?'active':''}"><span class="mn-icon">${iconSVG('user',18)}</span>Profile</a>
      <a href="/settings/"    class="mobile-nav-item ${currentPage==='settings'?'active':''}"><span class="mn-icon">${iconSVG('settings',18)}</span>More</a>
    </div>`;
  }
}

export function updateNavPoints(pts){
  const el=document.getElementById('nav-pts');
  if(el){
    const from=parseInt(el.textContent)||0;
    const to=pts;
    if(from===to){el.textContent=to;return;}
    const pill=document.getElementById('nav-pts-pill');
    if(pill){pill.classList.remove('pulse');void pill.offsetWidth;pill.classList.add('pulse');}
    const dur=600, steps=30, step=(to-from)/steps;
    let cur=from, i=0;
    const tick=()=>{
      i++; cur+=step;
      el.textContent=Math.round(i===steps?to:cur).toLocaleString();
      if(i<steps) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const su=document.querySelector('.sidebar-user-pts');if(su)su.innerHTML=`${iconSVG('zap',12)} ${pts.toLocaleString()} pts · <span style="color:var(--orange)">Buy more →</span>`;
}

// ---- DAILY BONUS ----
// Streak milestones: day → bonus pts on top of base 10
const STREAK_MILESTONES=[{days:3,bonus:5,label:'3-day'},{days:7,bonus:15,label:'7-day'},{days:14,bonus:30,label:'14-day'},{days:30,bonus:60,label:'30-day'},{days:60,bonus:100,label:'60-day'},{days:100,bonus:150,label:'100-day'}];
function streakBonus(streak){let b=0;STREAK_MILESTONES.forEach(m=>{if(streak>=m.days)b=m.bonus;});return b;}
function nextStreakMilestone(streak){return STREAK_MILESTONES.find(m=>m.days>streak)||null;}

async function checkDailyBonus(){
  const{data}=await supabase.rpc('check_daily_bonus');
  if(!data)return;
  const pill=document.getElementById('daily-pill');
  if(!pill)return;
  const streak=data.streak||0;
  const bonus=streakBonus(streak);
  const total=10+bonus;
  const streakEl=document.getElementById('dp-streak');
  const pts=document.getElementById('dp-pts');
  const label=document.getElementById('dp-label');
  if(pts)pts.textContent=bonus>0?`+${total} pts`:'+10 pts';
  if(streakEl&&streak>1){streakEl.textContent=`🔥${streak}`;streakEl.style.display='inline-flex';}
  if(data.claimed_today){
    pill.disabled=true;pill.classList.add('claimed');
    if(label)label.textContent='Come back tomorrow';
    if(pts)pts.textContent='Claimed';
  }else{
    pill.classList.add('ready');
    const next=nextStreakMilestone(streak);
    if(next&&label){const need=next.days-streak;label.textContent=need===1?`🎯 Tomorrow: ${next.label} streak!`:`Daily bonus · ${need}d to ${next.label}`;}
  }
}

window.claimBonus=async()=>{
  const pill=document.getElementById('daily-pill');
  if(pill)pill.disabled=true;
  const{data,error}=await supabase.rpc('claim_daily_bonus');
  if(error||data?.error){
    toast(data?.error||error.message,'error');
    if(pill&&!data?.error?.includes('Already'))pill.disabled=false;
    return;
  }
  const streak=data.streak||0;
  const bonus=streakBonus(streak);
  const label=document.getElementById('dp-label');
  const pts=document.getElementById('dp-pts');
  if(label)label.textContent='Come back tomorrow';
  if(pts)pts.textContent='Claimed';
  // Check if we just hit a milestone
  const milestone=STREAK_MILESTONES.slice().reverse().find(m=>m.days===streak);
  let msg;
  if(milestone) msg=`🎉 ${milestone.label} streak! +${data.points_earned} pts!`;
  else if(bonus>0) msg=`+${data.points_earned} pts! 🔥 ${streak} day streak!`;
  else msg=`+${data.points_earned} pts daily bonus! 🎁`;
  toast(msg,'success');
  const navPts=document.getElementById('nav-pts');
  if(navPts)navPts.textContent=parseInt(navPts.textContent||'0')+data.points_earned;
};

// ---- NOTIFICATIONS ----
async function loadNotifCount(){
  const{count}=await supabase.from('notifications').select('id',{count:'exact',head:true}).eq('is_read',false);
  const dot=document.getElementById('notif-dot');
  if(dot)dot.style.display=count>0?'block':'none';
}

let _notifChannel=null;
function subscribeNotifs(userId){
  if(!userId||_notifChannel)return;
  _notifChannel=supabase
    .channel('notifications:'+userId)
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`user_id=eq.${userId}`},(payload)=>{
      const n=payload.new;
      const dot=document.getElementById('notif-dot');
      if(dot)dot.style.display='block';
      toast(`${n.title}`,'success');
      const panel=document.getElementById('notif-panel');
      const list=document.getElementById('notif-list');
      if(panel&&panel.style.display==='block'&&list){
        const empty=list.querySelector('.notif-empty');
        if(empty)empty.remove();
        const item=document.createElement('div');
        item.className='notif-item notif-unread';
        item.innerHTML=`<div class="notif-title">${esc(n.title)}</div><div class="notif-body">${esc(n.body)}</div>`;
        list.prepend(item);
      }
    })
    .subscribe();
}
window.toggleNotifs=async()=>{
  let panel=document.getElementById('notif-panel');
  let backdrop=document.getElementById('notif-backdrop');
  if(!panel){
    panel=document.createElement('div');panel.id='notif-panel';panel.className='notif-panel';
    panel.innerHTML=`<div class="notif-header"><span>Notifications</span><button class="notif-clear" onclick="clearAllNotifs()">Mark all read</button></div><div id="notif-list"><div class="notif-empty">Loading...</div></div>`;
    document.body.appendChild(panel);
    backdrop=document.createElement('div');backdrop.id='notif-backdrop';
    backdrop.style.cssText='position:fixed;inset:0;z-index:149';
    backdrop.onclick=()=>closeNotifs();document.body.appendChild(backdrop);
  }
  const open=panel.style.display==='block';
  panel.style.display=open?'none':'block';backdrop.style.display=open?'none':'block';
  if(!open){
    const{data}=await supabase.from('notifications').select('*').order('created_at',{ascending:false}).limit(20);
    const list=document.getElementById('notif-list');
    if(!data||!data.length){list.innerHTML='<div class="notif-empty">No notifications yet</div>';}
    else list.innerHTML=data.map(n=>`<div class="notif-item ${n.is_read?'':'notif-unread'}"><div class="notif-title">${esc(n.title)}</div><div class="notif-body">${esc(n.body)}</div></div>`).join('');
    supabase.rpc('mark_notifications_read').then(()=>{const dot=document.getElementById('notif-dot');if(dot)dot.style.display='none';});
  }
};
window.clearAllNotifs=async()=>{await supabase.rpc('mark_notifications_read');const dot=document.getElementById('notif-dot');if(dot)dot.style.display='none';closeNotifs();};
window.closeNotifs=()=>{const p=document.getElementById('notif-panel');const b=document.getElementById('notif-backdrop');if(p)p.style.display='none';if(b)b.style.display='none';};
window.doSignOut=async()=>{await supabase.auth.signOut();window.location.replace('/');};

// ---- ONBOARDING ----
export function checkOnboarding(profile){
  if(localStorage.getItem('nb_onboarded'))return;
  if(profile.tasks_completed>0||profile.tasks_posted>0){localStorage.setItem('nb_onboarded','1');return;}
  const STEPS=[
    {icon:'sparkles',title:'Welcome to Next Boost!',desc:'You got 50 free points just for joining.'},
    {icon:'zap',title:'Complete tasks, earn points',desc:'Browse the Earn tab and complete tasks to earn points.'},
    {icon:'send',title:'Post tasks to grow',desc:'Spend points to post your own task. Others complete it and you grow.'},
    {icon:'gift',title:'Come back daily',desc:'Claim your daily bonus for free points. Build streaks for bigger rewards!'},
  ];
  let step=0;
  const overlay=document.createElement('div');
  overlay.className='onboarding-overlay';overlay.id='onboarding';
  const build=s=>{
    const st=STEPS[s];
    const dots=STEPS.map((_,i)=>`<div class="onboarding-dot ${i===s?'active':''}"></div>`).join('');
    const last=s===STEPS.length-1;
    overlay.innerHTML=`<div class="onboarding-card">
      <div class="onboarding-steps">${dots}</div>
      <div class="onboarding-icon">${iconSVG(st.icon,32)}</div>
      <h2 class="onboarding-title">${st.title}</h2>
      <p class="onboarding-desc">${st.desc}</p>
      <div style="display:flex;gap:10px;justify-content:center">
        ${s>0?'<button class="btn btn-ghost" onclick="window._ob(-1)">Back</button>':''}
        <button class="btn btn-primary" onclick="${last?'window._obDone()':'window._ob(1)'}">${last?'Get started!':'Next'}</button>
      </div>
    </div>`;
  };
  window._ob=d=>{step+=d;build(step);};
  window._obDone=()=>{localStorage.setItem('nb_onboarded','1');overlay.remove();};
  document.body.appendChild(overlay);build(0);
}

// ---- BUILD TASK MODAL ----
export function buildTaskModal(){
  if(document.getElementById('task-modal'))return;
  const div=document.createElement('div');
  div.innerHTML=`
    <div class="modal-overlay" id="task-modal">
      <div class="modal" style="max-width:480px">
        <h2 id="tm-title">Complete task</h2>
        <p class="modal-sub" id="tm-sub"></p>
        <div class="task-flow-box">
          <div class="flow-step" id="fs-1"><div class="flow-num">1</div><div><strong>Open the link</strong><p>Opens in a new tab</p></div></div>
          <div class="flow-step" id="fs-2"><div class="flow-num">2</div><div><strong id="fs2-title">Stay on the page</strong><p id="fs2-desc">Complete the action. Stay active.</p></div></div>
          <div class="flow-step" id="fs-3"><div class="flow-num">3</div><div><strong>Come back &amp; claim</strong><p>Return here to collect your points</p></div></div>
        </div>
        <div id="tab-warning" class="alert alert-error" style="display:none;margin-top:14px;font-size:0.83rem">You left the tab — stay on the task page for the full duration.</div>
        <div id="tm-timer-row" style="display:none;margin:18px 0 4px">
          <div class="timer-bar-wrap"><div class="timer-bar" id="timer-bar"></div></div>
          <p class="timer-label" id="timer-label">Stay active... <span id="timer-count">30</span>s</p>
        </div>
        <div class="modal-footer" style="margin-top:20px">
          <button class="btn btn-ghost" onclick="window.closeTaskModal()">Cancel</button>
          <button class="btn btn-primary" id="tm-open-btn" onclick="window.openTaskLink()">Open link</button>
          <button class="btn btn-primary" id="tm-submit-btn" style="display:none" disabled onclick="window.submitTask()">Claim points</button>
        </div>
        <div class="error-msg" id="tm-err"></div>
      </div>
    </div>
    <div class="modal-overlay" id="report-modal">
      <div class="modal" style="max-width:400px">
        <h2>Report task</h2><p class="modal-sub">Why are you reporting this task?</p>
        <div class="form-group"><label>Reason</label>
          <select id="report-reason">
            <option value="fake_task">Fake / doesn't work</option>
            <option value="spam">Spam</option>
            <option value="wrong_platform">Wrong platform URL</option>
            <option value="inappropriate">Inappropriate content</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="error-msg" id="report-err"></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="document.getElementById('report-modal').classList.remove('open')">Cancel</button>
          <button class="btn btn-danger" onclick="window.submitReport()">Submit report</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(div);
}

// ---- TASK MODAL LOGIC (full anti-cheat) ----
export function initTaskModal(onComplete){
  buildTaskModal();
  let activeTaskId=null,activeTaskUrl=null,timerInterval=null,tabOpenedAt=null;
  let visibilityHandler=null,reportingTaskId=null,requiredMs=10000;
  let activeTimeMs=0,mouseEvents=0,scrollEvents=0,focusLosses=0;
  let isPageActive=true,activeTrackInterval=null;

  async function getFingerprint(){
    try{const FP=await import('https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@4/+esm');const fp=await FP.load();const r=await fp.get();return r.visitorId;}
    catch{return null;}
  }

  function startTracking(){
    mouseEvents=0;scrollEvents=0;focusLosses=0;activeTimeMs=0;isPageActive=!document.hidden;
    clearInterval(activeTrackInterval);
    activeTrackInterval=setInterval(()=>{if(isPageActive&&!document.hidden)activeTimeMs+=250;},250);
    let lm=0,ls=0;
    const onM=()=>{const n=Date.now();if(n-lm>500){mouseEvents++;lm=n;}};
    const onS=()=>{const n=Date.now();if(n-ls>500){scrollEvents++;ls=n;}};
    const onV=()=>{if(document.hidden){isPageActive=false;focusLosses++;}else isPageActive=true;};
    const onB=()=>{isPageActive=false;};const onF=()=>{isPageActive=true;};
    document.addEventListener('mousemove',onM,{passive:true});
    document.addEventListener('touchmove',onM,{passive:true});
    document.addEventListener('click',onM,{passive:true});
    document.addEventListener('scroll',onS,{passive:true});
    window.addEventListener('scroll',onS,{passive:true});
    document.addEventListener('visibilitychange',onV);
    window.addEventListener('blur',onB);window.addEventListener('focus',onF);
    window._nbCleanup=()=>{
      clearInterval(activeTrackInterval);
      document.removeEventListener('mousemove',onM);document.removeEventListener('touchmove',onM);
      document.removeEventListener('click',onM);document.removeEventListener('scroll',onS);
      window.removeEventListener('scroll',onS);document.removeEventListener('visibilitychange',onV);
      window.removeEventListener('blur',onB);window.removeEventListener('focus',onF);
    };
  }
  function stopTracking(){if(window._nbCleanup){window._nbCleanup();window._nbCleanup=null;}}

  function sendAbandonBeacon(taskId){
    if(!taskId)return;
    supabase.auth.getSession().then(({data:{session}})=>{
      if(!session)return;
      fetch('https://slufbzzfofzptwjefzmu.supabase.co/functions/v1/task-abandon',{
        method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
        body:JSON.stringify({task_id:taskId}),keepalive:true
      }).catch(()=>{});
    });
  }
  function registerAbandon(){
    const h=()=>sendAbandonBeacon(activeTaskId);
    window.addEventListener('pagehide',h);window.addEventListener('beforeunload',h);
    window._nbAbCleanup=()=>{window.removeEventListener('pagehide',h);window.removeEventListener('beforeunload',h);};
  }
  function unregisterAbandon(){if(window._nbAbCleanup){window._nbAbCleanup();window._nbAbCleanup=null;}}

  window.openTaskModal=async(taskId)=>{
    activeTaskId=taskId;clearInterval(timerInterval);removeVis();stopTracking();resetModal();
    const{data:task}=await supabase.from('tasks').select('*').eq('id',taskId).single();
    if(!task){toast('Task not found','error');return;}
    activeTaskUrl=task.target;
    const isD=task.platform==='discord';
    document.getElementById('tm-title').textContent=isD?'Join Discord Server':`${task.type} on ${task.platform}`;
    document.getElementById('tm-sub').textContent=task.description||task.target;
    document.getElementById('fs2-title').textContent=isD?'Stay in the server':'Stay on the page';
    document.getElementById('fs2-desc').textContent=isD?'Join and remain during the timer.':'Complete the action. Stay active.';
    const{data,error}=await supabase.rpc('start_task',{p_task_id:taskId});
    if(error||data?.error){toast(data?.error||error.message,'error');return;}
    if(data.resumed&&data.link_clicked_at){
      const elapsed=Date.now()-new Date(data.link_clicked_at).getTime();
      requiredMs=data.required_ms||10000;const rem=requiredMs-elapsed;
      document.getElementById('tm-open-btn').style.display='none';
      document.getElementById('tm-submit-btn').style.display='inline-flex';
      document.getElementById('tm-timer-row').style.display='block';
      rem<=0?unlockSubmit():runTimer(rem);setStep(rem<=0?3:2);
    }
    document.getElementById('task-modal').classList.add('open');
  };

  window.closeTaskModal=()=>{
    document.getElementById('task-modal').classList.remove('open');
    clearInterval(timerInterval);removeVis();stopTracking();unregisterAbandon();
    activeTaskId=null;activeTaskUrl=null;
  };

  window.openTaskLink=async()=>{
    const btn=document.getElementById('tm-open-btn');
    btn.disabled=true;btn.textContent='Opening...';
    const fp=await getFingerprint();
    const{data,error}=await supabase.rpc('record_link_click',{p_task_id:activeTaskId,p_fingerprint:fp||null,p_ip_hash:null});
    if(error||data?.error){document.getElementById('tm-err').textContent=data?.error||error.message;btn.disabled=false;btn.textContent='Open link';return;}
    requiredMs=data.required_ms||10000;
    const url=activeTaskUrl.startsWith('http')?activeTaskUrl:'https://'+activeTaskUrl;
    window.open(url,'_blank');tabOpenedAt=Date.now();
    btn.style.display='none';
    document.getElementById('tm-submit-btn').style.display='inline-flex';
    document.getElementById('tm-timer-row').style.display='block';
    setStep(2);startTracking();runTimer(requiredMs);setTimeout(setupVis,800);registerAbandon();
  };

  function runTimer(remainingMs){
    document.getElementById('tm-submit-btn').disabled=true;
    document.getElementById('tab-warning').style.display='none';
    let ms=Math.max(0,remainingMs);const total=requiredMs;
    document.getElementById('timer-label').innerHTML=`Stay active... <span id="timer-count">${Math.ceil(ms/1000)}</span>s`;
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
    removeVis();let fi=false;
    visibilityHandler=()=>{
      if(document.hidden){if(!fi){fi=true;return;}document.getElementById('tab-warning').style.display='block';}
      else fi=true;
    };
    document.addEventListener('visibilitychange',visibilityHandler);
  }
  function removeVis(){if(visibilityHandler){document.removeEventListener('visibilitychange',visibilityHandler);visibilityHandler=null;}}

  function setStep(a){for(let i=1;i<=3;i++)document.getElementById('fs-'+i).className='flow-step'+(i<a?' flow-step-done':i===a?' flow-step-active':'');}

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
    const{data,error}=await supabase.rpc('submit_task',{
      p_task_id:activeTaskId,p_active_time_ms:activeTimeMs,
      p_mouse_events:mouseEvents,p_scroll_events:scrollEvents,p_focus_losses:focusLosses
    });
    if(error||data?.error){document.getElementById('tm-err').textContent=data?.error||error.message;btn.disabled=false;btn.textContent='Claim points';return;}
    unregisterAbandon();window.closeTaskModal();
    const msg=(data.reputation_multiplier&&data.reputation_multiplier<1.0)
      ?`+${data.points_earned} pts! Build reputation to earn full rewards.`
      :data.bonus_event
      ?`+${data.points_earned} pts! 🎉 ${data.bonus_event} bonus applied!`
      :`+${data.points_earned} points earned! 🎉`;
    toast(msg,'success');
    // Every 5th completion, nudge them to share
    const tc = (parseInt(localStorage.getItem('nb_tc')||'0'))+1;
    localStorage.setItem('nb_tc', tc);
    if(tc % 5 === 0) setTimeout(()=>toast('🎉 Share your progress! <a href="/share/" style="color:#fff;font-weight:700;text-decoration:underline">Make a card →</a>','info',8000,true),1500);
    if(onComplete)onComplete(data.points_earned);
  };

  window.openReport=(taskId)=>{reportingTaskId=taskId;document.getElementById('report-err').textContent='';document.getElementById('report-modal').classList.add('open');};
  window.submitReport=async()=>{
    const reason=document.getElementById('report-reason').value;
    const{data,error}=await supabase.rpc('report_task',{p_task_id:reportingTaskId,p_reason:reason});
    if(error||data?.error){document.getElementById('report-err').textContent=data?.error||error.message;return;}
    document.getElementById('report-modal').classList.remove('open');
    toast('Reported. Thank you - +2 reputation earned.','success');
  };
}
