// ============================================================
// NEXT BOOST — app.js
// Shared app shell: auth guard, nav, theme, daily bonus, notifs
// ============================================================
import { supabase, go, toast, esc } from './shared.js';

// ---- THEMES ----
export const THEMES = {
  'dark-orange': { accent:'#E8621A', accentDk:'#C4430A', accentLt:'#F5843A', bg:'#0e0b09', surface:'#171210', surface2:'#211a16', surface3:'#2c221c', border:'#3a2a22', border2:'#4a3628' },
  'dark-purple': { accent:'#7c3aed', accentDk:'#5b21b6', accentLt:'#a855f7', bg:'#0d0a14', surface:'#130f1e', surface2:'#1c1630', surface3:'#271f40', border:'#32285a', border2:'#3e3270' },
  'dark-blue':   { accent:'#0ea5e9', accentDk:'#0369a1', accentLt:'#38bdf8', bg:'#090d14', surface:'#0d1320', surface2:'#131c2e', surface3:'#1a2840', border:'#1e3050', border2:'#243860' },
  'dark-green':  { accent:'#22c55e', accentDk:'#15803d', accentLt:'#4ade80', bg:'#090e0b', surface:'#0d1510', surface2:'#121f17', surface3:'#172a1e', border:'#1e3826', border2:'#264830' },
  'midnight':    { accent:'#94a3b8', accentDk:'#64748b', accentLt:'#cbd5e1', bg:'#06070a', surface:'#0c0e14', surface2:'#111420', surface3:'#16192c', border:'#1e2238', border2:'#262b44' },
};

export function applyTheme(themeKey, customAccent = null) {
  const t = THEMES[themeKey] || THEMES['dark-orange'];
  const r = document.documentElement;
  r.style.setProperty('--bg', t.bg);
  r.style.setProperty('--surface', t.surface);
  r.style.setProperty('--surface2', t.surface2);
  r.style.setProperty('--surface3', t.surface3);
  r.style.setProperty('--border', t.border);
  r.style.setProperty('--border2', t.border2);
  const acc = (customAccent && /^#[0-9A-Fa-f]{6}$/.test(customAccent)) ? customAccent : null;
  r.style.setProperty('--orange',    acc || t.accent);
  r.style.setProperty('--orange-dk', acc || t.accentDk);
  r.style.setProperty('--orange-lt', acc || t.accentLt);
}

// ---- AUTH GUARD + PROFILE LOAD ----
export async function initApp(currentPage = '') {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { go('/login/'); return null; }

  const [pRes, uRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', session.user.id).single(),
    supabase.auth.getUser()
  ]);
  if (pRes.error) { go('/login/'); return null; }

  const profile = pRes.data;
  const email = uRes.data?.user?.email || '';

  // Apply saved theme immediately
  applyTheme(profile.theme || 'dark-orange', profile.accent_color || null);

  // Render shell
  renderShell(profile, currentPage);

  return { profile, email, session };
}

// ---- RENDER APP SHELL ----
function renderShell(profile, currentPage) {
  const ini = (profile.display_name || profile.username || 'U')[0].toUpperCase();

  // NAV
  const nav = document.getElementById('main-nav');
  if (nav) {
    nav.innerHTML = `
      <a class="nav-logo" href="/"><img src="/assets/img/logo.png" alt="Next Boost" style="height:36px"/></a>
      <div class="nav-links" style="gap:8px">
        <button class="notif-btn" id="notif-btn" onclick="toggleNotifs()" title="Notifications">
          🔔<span class="notif-dot" id="notif-dot" style="display:none"></span>
        </button>
        <div class="pts-pill" id="nav-pts-pill">⚡ <span id="nav-pts">${profile.points}</span> pts</div>
        <button class="daily-pill" id="daily-pill" onclick="claimBonus()">
          <span class="dp-icon">🎁</span>
          <div style="display:flex;flex-direction:column;line-height:1.2">
            <span class="dp-label" id="dp-label">Daily bonus</span>
            <span class="dp-pts" id="dp-pts">+15 pts</span>
          </div>
          <span class="dp-streak" id="dp-streak" style="display:none"></span>
        </button>
      </div>`;
  }

  // SIDEBAR
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar) {
    const links = [
      { href: '/earn/',        icon: '⚡', label: 'Earn Points',  page: 'earn' },
      { href: '/completed/',   icon: '✅', label: 'Completed',    page: 'completed' },
      { href: '/post-task/',   icon: '📤', label: 'Post a Task',  page: 'post-task' },
      { href: '/my-tasks/',    icon: '📋', label: 'My Tasks',     page: 'my-tasks' },
    ];
    const links2 = [
      { href: '/leaderboard/', icon: '🏆', label: 'Leaderboard', page: 'leaderboard' },
      { href: '/achievements/',icon: '🎖️', label: 'Achievements', page: 'achievements' },
      { href: '/referral/',    icon: '🤝', label: 'Referral',     page: 'referral' },
    ];
    const links3 = [
      { href: '/profile/',     icon: '👤', label: 'Profile',      page: 'profile' },
      { href: '/settings/',    icon: '⚙️', label: 'Settings',     page: 'settings' },
      ...(profile.is_admin ? [{ href: '/admin/', icon: '🛡️', label: 'Admin', page: 'admin' }] : []),
    ];

    const renderLinks = (arr) => arr.map(l => `
      <a href="${l.href}" class="sidebar-link ${currentPage === l.page ? 'active' : ''}">
        <span class="sidebar-icon">${l.icon}</span>${l.label}
      </a>`).join('');

    sidebar.innerHTML = `
      <span class="sidebar-section-label">Earn</span>
      ${renderLinks(links)}
      <span class="sidebar-section-label">Explore</span>
      ${renderLinks(links2)}
      <span class="sidebar-section-label">Account</span>
      ${renderLinks(links3)}
      <a href="/profile/" class="sidebar-user" style="margin-top:auto">
        <div class="avatar" style="width:32px;height:32px;font-size:0.85rem;background:${profile.avatar_color||'#E8621A'};border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0">${ini}</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">${esc(profile.display_name||profile.username)}</div>
          <div class="sidebar-user-pts">⚡ ${profile.points} pts</div>
        </div>
      </a>`;
  }

  // MOBILE BOTTOM NAV
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileNav) {
    mobileNav.innerHTML = `
      <div class="mobile-nav-inner">
        <a href="/earn/"        class="mobile-nav-item ${currentPage==='earn'?'active':''}"><span class="mn-icon">⚡</span>Earn</a>
        <a href="/post-task/"   class="mobile-nav-item ${currentPage==='post-task'?'active':''}"><span class="mn-icon">📤</span>Post</a>
        <a href="/leaderboard/" class="mobile-nav-item ${currentPage==='leaderboard'?'active':''}"><span class="mn-icon">🏆</span>Top</a>
        <a href="/profile/"     class="mobile-nav-item ${currentPage==='profile'?'active':''}"><span class="mn-icon">👤</span>Profile</a>
        <a href="/settings/"    class="mobile-nav-item ${currentPage==='settings'?'active':''}"><span class="mn-icon">⚙️</span>More</a>
      </div>`;
  }

  // Load bonus + notifs
  checkDailyBonus(profile);
  loadNotifCount();
}

// ---- DAILY BONUS ----
async function checkDailyBonus(profile) {
  const { data } = await supabase.rpc('check_daily_bonus');
  if (!data) return;
  const pill = document.getElementById('daily-pill');
  const streak = document.getElementById('dp-streak');
  const pts = document.getElementById('dp-pts');
  const label = document.getElementById('dp-label');
  if (!pill) return;

  const total = 15 + (data.streak_bonus || 0);
  pts.textContent = data.streak_bonus > 0 ? `+${total} pts` : '+15 pts';
  if (data.streak > 1) { streak.textContent = `🔥${data.streak}`; streak.style.display = 'inline-flex'; }

  if (data.claimed_today) {
    pill.disabled = true;
    pill.classList.add('claimed');
    label.textContent = 'Come back tomorrow';
    pts.textContent = 'Claimed ✓';
  } else {
    pill.classList.add('ready');
  }
}

window.claimBonus = async () => {
  const pill = document.getElementById('daily-pill');
  if (pill) { pill.disabled = true; }
  const { data, error } = await supabase.rpc('claim_daily_bonus');
  if (error || data?.error) {
    toast(data?.error || error.message, 'error');
    if (pill && !data?.error?.includes('Already')) pill.disabled = false;
    return;
  }
  const label = document.getElementById('dp-label');
  const pts = document.getElementById('dp-pts');
  const streak = document.getElementById('dp-streak');
  if (label) label.textContent = 'Come back tomorrow';
  if (pts) pts.textContent = 'Claimed ✓';
  if (streak && data.streak > 1) { streak.textContent = `🔥${data.streak}`; streak.style.display = 'inline-flex'; }
  const msg = data.streak_bonus > 0
    ? `+${data.points_earned} pts! 🔥 ${data.streak} day streak bonus!`
    : `+${data.points_earned} pts daily bonus! 🎁`;
  toast(msg, 'success');
  // Update nav pts
  const navPts = document.getElementById('nav-pts');
  if (navPts) navPts.textContent = parseInt(navPts.textContent) + data.points_earned;
};

// ---- NOTIFICATIONS ----
async function loadNotifCount() {
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);
  const dot = document.getElementById('notif-dot');
  if (dot) dot.style.display = count > 0 ? 'block' : 'none';
}

window.toggleNotifs = async () => {
  let panel = document.getElementById('notif-panel');
  let backdrop = document.getElementById('notif-backdrop');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'notif-panel';
    panel.className = 'notif-panel';
    panel.innerHTML = `
      <div class="notif-header">
        <span>Notifications</span>
        <button class="notif-clear" onclick="clearAllNotifs()">Mark all read</button>
      </div>
      <div id="notif-list"><div class="notif-empty">Loading…</div></div>`;
    document.body.appendChild(panel);
    backdrop = document.createElement('div');
    backdrop.id = 'notif-backdrop';
    backdrop.style.cssText = 'position:fixed;inset:0;z-index:149';
    backdrop.onclick = () => closeNotifs();
    document.body.appendChild(backdrop);
  }
  const open = panel.style.display === 'block';
  panel.style.display = open ? 'none' : 'block';
  backdrop.style.display = open ? 'none' : 'block';
  if (!open) {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20);
    const list = document.getElementById('notif-list');
    if (!data || !data.length) { list.innerHTML = '<div class="notif-empty">No notifications yet</div>'; }
    else list.innerHTML = data.map(n => `
      <div class="notif-item ${n.is_read ? '' : 'notif-unread'}">
        <div class="notif-title">${esc(n.title)}</div>
        <div class="notif-body">${esc(n.body)}</div>
      </div>`).join('');
    supabase.rpc('mark_notifications_read').then(() => {
      const dot = document.getElementById('notif-dot');
      if (dot) dot.style.display = 'none';
    });
  }
};

window.clearAllNotifs = async () => {
  await supabase.rpc('mark_notifications_read');
  const dot = document.getElementById('notif-dot');
  if (dot) dot.style.display = 'none';
  closeNotifs();
};

window.closeNotifs = () => {
  const p = document.getElementById('notif-panel');
  const b = document.getElementById('notif-backdrop');
  if (p) p.style.display = 'none';
  if (b) b.style.display = 'none';
};

// ---- SIGN OUT ----
window.doSignOut = async () => { await supabase.auth.signOut(); go('/'); };

// ---- UPDATE NAV POINTS ----
export function updateNavPoints(pts) {
  const el = document.getElementById('nav-pts');
  if (el) el.textContent = pts;
  const su = document.querySelector('.sidebar-user-pts');
  if (su) su.textContent = `⚡ ${pts} pts`;
}

// ---- ONBOARDING ----
export async function checkOnboarding(profile) {
  if (localStorage.getItem('nb_onboarded')) return;
  if (profile.tasks_completed > 0 || profile.tasks_posted > 0) {
    localStorage.setItem('nb_onboarded', '1'); return;
  }
  showOnboarding();
}

const ONBOARDING_STEPS = [
  { icon:'🎉', title:'Welcome to Next Boost!', desc:'You got 100 free points just for joining. Here\'s how to use them.' },
  { icon:'⚡', title:'Complete tasks, earn points', desc:'Browse the Earn tab and complete tasks — follow, like, view or join. Each task rewards you with points instantly after a 30-second timer.' },
  { icon:'📤', title:'Post tasks to grow your account', desc:'Spend points to post your own task. Other users will complete it and your followers, views or members will grow.' },
  { icon:'🎁', title:'Come back every day', desc:'Claim your daily bonus for free points. Build a streak to earn bonus rewards. Check the leaderboard to see how you rank!' },
];

let onboardStep = 0;
function showOnboarding() {
  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';
  overlay.id = 'onboarding';
  overlay.innerHTML = buildOnboardingHTML(0);
  document.body.appendChild(overlay);
}

function buildOnboardingHTML(step) {
  const s = ONBOARDING_STEPS[step];
  const dots = ONBOARDING_STEPS.map((_,i) => `<div class="onboarding-dot ${i===step?'active':''}"></div>`).join('');
  const isLast = step === ONBOARDING_STEPS.length - 1;
  return `
    <div class="onboarding-card">
      <div class="onboarding-steps">${dots}</div>
      <div class="onboarding-icon">${s.icon}</div>
      <h2 class="onboarding-title">${s.title}</h2>
      <p class="onboarding-desc">${s.desc}</p>
      <div style="display:flex;gap:10px;justify-content:center">
        ${step > 0 ? `<button class="btn btn-ghost" onclick="prevOnboard()">Back</button>` : ''}
        <button class="btn btn-primary" onclick="${isLast ? 'finishOnboard()' : 'nextOnboard()'}">${isLast ? 'Get started! 🚀' : 'Next →'}</button>
      </div>
    </div>`;
}

window.nextOnboard = () => {
  onboardStep++;
  const el = document.getElementById('onboarding');
  if (el) el.innerHTML = buildOnboardingHTML(onboardStep);
};
window.prevOnboard = () => {
  onboardStep--;
  const el = document.getElementById('onboarding');
  if (el) el.innerHTML = buildOnboardingHTML(onboardStep);
};
window.finishOnboard = () => {
  localStorage.setItem('nb_onboarded', '1');
  const el = document.getElementById('onboarding');
  if (el) el.remove();
};

// ---- TASK MODAL (shared) ----
export function buildTaskModal() {
  if (document.getElementById('task-modal')) return;
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="modal-overlay" id="task-modal">
      <div class="modal" style="max-width:480px">
        <h2 id="tm-title">Complete task</h2>
        <p class="modal-sub" id="tm-sub"></p>
        <div class="task-flow-box">
          <div class="flow-step" id="fs-1"><div class="flow-num">1</div><div><strong>Open the link</strong><p>Opens in a new tab</p></div></div>
          <div class="flow-step" id="fs-2"><div class="flow-num">2</div><div><strong id="fs2-title">Stay for 30 seconds</strong><p id="fs2-desc">Complete the action. Don't switch tabs.</p></div></div>
          <div class="flow-step" id="fs-3"><div class="flow-num">3</div><div><strong>Come back &amp; claim</strong><p>Return here to collect your points</p></div></div>
        </div>
        <div id="tab-warning" class="alert alert-error" style="display:none;margin-top:14px;font-size:0.83rem">
          ⚠️ You left this tab before 30 seconds — timer reset. Open the link again.
        </div>
        <div id="tm-timer-row" style="display:none;margin:18px 0 4px">
          <div class="timer-bar-wrap"><div class="timer-bar" id="timer-bar"></div></div>
          <p class="timer-label" id="timer-label">Stay on the task page… <span id="timer-count">30</span>s remaining</p>
        </div>
        <div class="modal-footer" style="margin-top:20px">
          <button class="btn btn-ghost" onclick="window.closeTaskModal()">Cancel</button>
          <button class="btn btn-primary" id="tm-open-btn" onclick="window.openTaskLink()">Open link ↗</button>
          <button class="btn btn-primary" id="tm-submit-btn" style="display:none" disabled onclick="window.submitTask()">Claim points</button>
        </div>
        <div class="error-msg" id="tm-err"></div>
      </div>
    </div>
    <div class="modal-overlay" id="report-modal">
      <div class="modal" style="max-width:400px">
        <h2>Report task</h2>
        <p class="modal-sub">Why are you reporting this task?</p>
        <div class="form-group">
          <label for="report-reason">Reason</label>
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

// ---- TASK MODAL LOGIC ----
export function initTaskModal(onComplete) {
  buildTaskModal();
  let activeTaskId = null, activeTaskUrl = null;
  let timerInterval = null, tabOpenedAt = null;
  let visibilityHandler = null, timerAborted = false;
  let reportingTaskId = null;

  window.openTaskModal = async (taskId) => {
    activeTaskId = taskId; timerAborted = false;
    clearInterval(timerInterval); removeVis();
    resetModal();
    const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
    if (!task) { toast('Task not found', 'error'); return; }
    activeTaskUrl = task.target;
    const isDiscord = task.platform === 'discord';
    document.getElementById('tm-title').textContent = isDiscord ? 'Join Discord Server' : `${task.type} on ${task.platform}`;
    document.getElementById('tm-sub').textContent = task.description || task.target;
    document.getElementById('fs2-title').textContent = isDiscord ? 'Stay in the server for 30s' : 'Stay for 30 seconds';
    document.getElementById('fs2-desc').textContent = isDiscord ? 'Join the server and wait.' : 'Complete the action. Don\'t switch tabs.';
    const { data, error } = await supabase.rpc('start_task', { p_task_id: taskId });
    if (error || data?.error) { toast(data?.error || error.message, 'error'); return; }
    if (data.resumed && data.link_clicked_at) {
      const elapsed = (Date.now() - new Date(data.link_clicked_at).getTime()) / 1000;
      document.getElementById('tm-open-btn').style.display = 'none';
      document.getElementById('tm-submit-btn').style.display = 'inline-flex';
      document.getElementById('tm-timer-row').style.display = 'block';
      elapsed >= 30 ? unlockSubmit() : runTimer(30 - elapsed);
      setStep(elapsed >= 30 ? 3 : 2);
    }
    document.getElementById('task-modal').classList.add('open');
  };

  window.closeTaskModal = () => {
    document.getElementById('task-modal').classList.remove('open');
    clearInterval(timerInterval); removeVis();
    activeTaskId = null; activeTaskUrl = null;
  };

  window.openTaskLink = async () => {
    const btn = document.getElementById('tm-open-btn');
    btn.disabled = true; btn.textContent = 'Opening…';
    const { data, error } = await supabase.rpc('record_link_click', { p_task_id: activeTaskId });
    if (error || data?.error) { document.getElementById('tm-err').textContent = data?.error || error.message; btn.disabled = false; btn.textContent = 'Open link ↗'; return; }
    const url = activeTaskUrl.startsWith('http') ? activeTaskUrl : 'https://' + activeTaskUrl;
    window.open(url, '_blank');
    tabOpenedAt = Date.now();
    btn.style.display = 'none';
    document.getElementById('tm-submit-btn').style.display = 'inline-flex';
    document.getElementById('tm-timer-row').style.display = 'block';
    setStep(2); runTimer(30);
    setTimeout(setupVis, 800);
  };

  function runTimer(remaining) {
    document.getElementById('tm-submit-btn').disabled = true;
    document.getElementById('tab-warning').style.display = 'none';
    let secs = Math.max(0, remaining);
    document.getElementById('timer-label').innerHTML = `Stay on the task page… <span id="timer-count">${Math.ceil(secs)}</span>s remaining`;
    document.getElementById('timer-bar').style.width = ((30 - secs) / 30 * 100) + '%';
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      secs -= 0.25;
      document.getElementById('timer-bar').style.width = Math.min(100, (30 - secs) / 30 * 100) + '%';
      const el = document.getElementById('timer-count');
      if (el) el.textContent = Math.max(0, Math.ceil(secs));
      if (secs <= 0) { clearInterval(timerInterval); if (!timerAborted) unlockSubmit(); }
    }, 250);
  }

  function unlockSubmit() {
    document.getElementById('tm-submit-btn').disabled = false;
    document.getElementById('timer-label').innerHTML = '✓ Time complete — claim your points!';
    document.getElementById('timer-bar').style.width = '100%';
    setStep(3);
  }

  function setupVis() {
    removeVis();
    let firstIgnored = false;
    visibilityHandler = () => {
      if (document.hidden) {
        if (!firstIgnored) { firstIgnored = true; return; }
        const elapsed = (Date.now() - tabOpenedAt) / 1000;
        if (elapsed < 28) {
          timerAborted = true; clearInterval(timerInterval);
          document.getElementById('tab-warning').style.display = 'block';
          document.getElementById('tm-submit-btn').disabled = true;
          const btn = document.getElementById('tm-open-btn');
          btn.style.display = 'inline-flex'; btn.disabled = false; btn.textContent = 'Open link again ↗';
          document.getElementById('timer-bar').style.width = '0%';
          document.getElementById('timer-label').textContent = 'Timer reset.';
          setStep(1); timerAborted = false;
        }
      } else { firstIgnored = true; }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
  }

  function removeVis() {
    if (visibilityHandler) { document.removeEventListener('visibilitychange', visibilityHandler); visibilityHandler = null; }
  }

  function setStep(active) {
    for (let i = 1; i <= 3; i++)
      document.getElementById('fs-' + i).className = 'flow-step' + (i < active ? ' flow-step-done' : i === active ? ' flow-step-active' : '');
  }

  function resetModal() {
    document.getElementById('tm-err').textContent = '';
    document.getElementById('tab-warning').style.display = 'none';
    document.getElementById('tm-timer-row').style.display = 'none';
    document.getElementById('tm-open-btn').style.display = 'inline-flex';
    document.getElementById('tm-open-btn').disabled = false;
    document.getElementById('tm-open-btn').textContent = 'Open link ↗';
    document.getElementById('tm-submit-btn').style.display = 'none';
    document.getElementById('tm-submit-btn').disabled = true;
    document.getElementById('tm-submit-btn').textContent = 'Claim points';
    document.getElementById('timer-bar').style.width = '0%';
    setStep(1);
  }

  window.submitTask = async () => {
    const btn = document.getElementById('tm-submit-btn');
    btn.disabled = true; btn.textContent = 'Claiming…';
    const { data, error } = await supabase.rpc('submit_task', { p_task_id: activeTaskId });
    if (error || data?.error) { document.getElementById('tm-err').textContent = data?.error || error.message; btn.disabled = false; btn.textContent = 'Claim points'; return; }
    window.closeTaskModal();
    toast(`+${data.points_earned} points earned! 🎉`, 'success');
    if (onComplete) onComplete(data.points_earned);
  };

  window.openReport = (taskId) => {
    reportingTaskId = taskId;
    document.getElementById('report-err').textContent = '';
    document.getElementById('report-modal').classList.add('open');
  };

  window.submitReport = async () => {
    const reason = document.getElementById('report-reason').value;
    const { data, error } = await supabase.rpc('report_task', { p_task_id: reportingTaskId, p_reason: reason });
    if (error || data?.error) { document.getElementById('report-err').textContent = data?.error || error.message; return; }
    document.getElementById('report-modal').classList.remove('open');
    toast('Reported. Thank you.', '');
  };
}
