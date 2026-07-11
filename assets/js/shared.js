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
    redirectTo: 'https://boost.nexosites.xyz/confirm-email/'
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

// ---- RANK SYSTEM ----
// Tiers are based on lifetime points. Extend this array to add more tiers later.
export const RANKS = [
  { key: 'bronze',   name: 'Bronze',   icon: '🥉', min: 0,     color: '#cd7f32' },
  { key: 'silver',   name: 'Silver',   icon: '🥈', min: 250,   color: '#c0c0c0' },
  { key: 'gold',     name: 'Gold',     icon: '🥇', min: 750,   color: '#ffd700' },
  { key: 'diamond',  name: 'Diamond',  icon: '💎', min: 1500,  color: '#7dd3fc' },
  { key: 'ruby',     name: 'Ruby',     icon: '♦️', min: 3000,  color: '#e0115f' },
  { key: 'emerald',  name: 'Emerald',  icon: '🟢', min: 6000,  color: '#50c878' },
  { key: 'sapphire', name: 'Sapphire', icon: '🔷', min: 12000, color: '#0f52ba' },
  { key: 'legend',   name: 'Legend',   icon: '👑', min: 25000, color: '#f59e0b' },
];

// Returns the rank tier for a given points total, plus progress info toward the next tier.
export function getRank(points) {
  points = points || 0;
  let current = RANKS[0];
  let next = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (points >= RANKS[i].min) current = RANKS[i];
    else { next = RANKS[i]; break; }
  }
  const progress = next
    ? Math.max(0, Math.min(100, Math.round(((points - current.min) / (next.min - current.min)) * 100)))
    : 100;
  return {
    ...current,
    next,
    pointsToNext: next ? next.min - points : 0,
    progress,
  };
}
