// ============================================================
// NEXT BOOST — shared.js
// Supabase client + auth helpers + UI utilities
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://slufbzzfofzptwjefzmu.supabase.co';
export const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdWZienpmb2Z6cHR3amVmem11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMTk1MDMsImV4cCI6MjA5Nzg5NTUwM30.bM_TxEv6pvouItyW_I8l3zGu3JVqQoAfScuxB5b2hiI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    redirectTo: 'https://boost.nexorealm.org/confirm-email/'
  }
});

// ---- ROUTING HELPERS ----
// Clean URL navigation — always use trailing slash directories
export function go(path) {
  window.location.href = path;
}

// Redirect if not authenticated
export async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    go('/login/');
    return null;
  }
  return session;
}

// Redirect if already authenticated
export async function redirectIfAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) go('/earn/');
}

// ---- USER PROFILE ----
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// ---- NAVIGATION ----
export function renderNav(profile) {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  if (profile) {
    nav.innerHTML = `
      <a class="nav-logo" href="/"><img src="/assets/img/logo.png" alt="Next Boost"/></a>
      <div class="nav-links">
        <span class="nav-pts">⚡ <span id="nav-pts-val">${profile.points}</span> pts</span>
        <a href="/dashboard/" class="btn btn-ghost btn-sm">Dashboard</a>
        <button class="btn btn-ghost btn-sm" id="signout-btn">Sign out</button>
      </div>
    `;
    document.getElementById('signout-btn').addEventListener('click', async () => {
      await supabase.auth.signOut();
      go('/');
    });
  } else {
    nav.innerHTML = `
      <a class="nav-logo" href="/"><img src="/assets/img/logo.png" alt="Next Boost"/></a>
      <div class="nav-links">
        <a href="/login/" class="btn btn-ghost btn-sm">Log in</a>
        <a href="/signup/" class="btn btn-primary btn-sm">Sign up free</a>
      </div>
    `;
  }
}

export function updateNavPoints(pts) {
  const el = document.getElementById('nav-pts-val');
  if (el) el.textContent = pts;
}

// ---- TOAST ----
let toastTimer = null;
export function toast(msg, type = '') {
  let el = document.getElementById('nb-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'nb-toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = `toast show${type ? ' toast-' + type : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3600);
}

// ---- ESCAPE HTML ----
export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---- PLATFORM HELPERS ----
export const PLAT_EMOJI = { tiktok: '🎵', instagram: '📸', youtube: '▶️', discord: '💬', website: '🌐', twitch: '🟣', twitter: '🐦' };
export const PLAT_CLASS = { tiktok: 'plat-tiktok', instagram: 'plat-instagram', youtube: 'plat-youtube', discord: 'plat-discord', website: 'plat-website', twitch: 'plat-twitch', twitter: 'plat-twitter' };
export const TYPE_CLASS  = { follow: 'type-follow', like: 'type-like', view: 'type-view', join: 'type-join', website: 'type-view', retweet: 'type-view' };
export const TYPE_LABEL  = { follow: 'Follow', like: 'Like', view: 'View', join: 'Join', website: 'Visit', retweet: 'Retweet' };

// Platform metadata for social link inputs (settings page, public profile, etc.)
export const SOCIAL_PLATFORMS = [
  { key: 'website',   label: 'Website',     placeholder: 'https://yoursite.com' },
  { key: 'twitter',   label: 'Twitter / X', placeholder: 'https://x.com/yourhandle' },
  { key: 'instagram', label: 'Instagram',   placeholder: 'https://instagram.com/yourhandle' },
  { key: 'tiktok',    label: 'TikTok',      placeholder: 'https://tiktok.com/@yourhandle' },
  { key: 'youtube',   label: 'YouTube',     placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'discord',   label: 'Discord',     placeholder: 'https://discord.gg/yourinvite' },
  { key: 'twitch',    label: 'Twitch',      placeholder: 'https://twitch.tv/yourhandle' },
];

// ---- SUBSCRIPTION TIERS ---- (keep in sync with subscription_tier_info SQL function)
export const SUB_TIERS = {
  pro:   { key: 'pro',   name: 'Pro',   icon: 'zap',   color: '#60a5fa', usd: 4.99,  slots: 10, feeDiscount: 0.50 },
  vip:   { key: 'vip',   name: 'VIP',   icon: 'gem',   color: '#a78bfa', usd: 9.99,  slots: 25, feeDiscount: 0.75 },
  elite: { key: 'elite', name: 'Elite', icon: 'crown', color: '#f59e0b', usd: 19.99, slots: 60, feeDiscount: 1.00 },
};

// ---- RANK SYSTEM ----
// Tiers are based on a composite score (points + tasks completed + trust), not raw points alone —
// grinding out tasks and staying trustworthy both matter, not just accumulating points.
export const RANKS = [
  { key: 'bronze',   name: 'Bronze',   icon: 'medal', min: 0,     color: '#cd7f32' },
  { key: 'silver',   name: 'Silver',   icon: 'medal', min: 400,   color: '#c0c0c0' },
  { key: 'gold',     name: 'Gold',     icon: 'medal', min: 1000,  color: '#ffd700' },
  { key: 'diamond',  name: 'Diamond',  icon: 'gem',   min: 2000,  color: '#7dd3fc' },
  { key: 'ruby',     name: 'Ruby',     icon: 'gem',   min: 4000,  color: '#e0115f' },
  { key: 'emerald',  name: 'Emerald',  icon: 'gem',   min: 8000,  color: '#50c878' },
  { key: 'sapphire', name: 'Sapphire', icon: 'gem',   min: 16000, color: '#0f52ba' },
  { key: 'legend',   name: 'Legend',   icon: 'crown', min: 32000, color: '#f59e0b' },
];

// Composite rank score — mirrors the `compute_rank_score` SQL function, keep both in sync.
export function computeRankScore(input) {
  const points = input?.points || 0;
  const tasksCompleted = input?.tasks_completed || 0;
  const trustScore = input?.trust_score || 0;
  return points + tasksCompleted * 15 + trustScore * 8;
}

// Returns the rank tier for a profile-like object ({points, tasks_completed, trust_score}),
// plus progress info toward the next tier. Also accepts a raw number for convenience.
export function getRank(input) {
  const score = typeof input === 'number' ? input : computeRankScore(input);
  let current = RANKS[0];
  let next = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (score >= RANKS[i].min) current = RANKS[i];
    else { next = RANKS[i]; break; }
  }
  const progress = next
    ? Math.max(0, Math.min(100, Math.round(((score - current.min) / (next.min - current.min)) * 100)))
    : 100;
  return {
    ...current,
    score,
    next,
    pointsToNext: next ? next.min - score : 0,
    progress,
  };
}
