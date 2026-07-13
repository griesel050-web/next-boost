// ============================================================
// NEXT BOOST — icons.js
// Renders <i data-lucide="rocket"></i> placeholders into real Lucide
// SVGs. Use semantic names in HTML (data-lucide="rocket"), not emoji.
// Call renderIcons(root) again after any dynamic innerHTML update
// that inserts new [data-lucide] elements.
// ============================================================
import { createElement } from 'lucide';
import {
  Rocket, CircleCheck, Send, TrendingUp, Zap, Gem, Crown, Medal,
  Search, SlidersHorizontal, Command, ArrowRight, ArrowUpRight, ArrowDown,
  Copy, Undo2, Bell, X, Check, ChevronDown, ChevronRight, ChevronLeft,
  Menu, User, Users, Settings, LogOut, Shield, ShieldCheck, Flag,
  Mail, Lock, Eye, EyeOff, CreditCard, Package, Calendar, Clipboard,
  Star, Heart, Award, Trophy, Sparkles, Flame, Target, Gift, Dice5,
  Globe, Link2, Image, Trash2, Pencil, Download, Upload, RefreshCw,
  AlertTriangle, Info, CircleAlert, MailOpen, MailX, Ban, CircleX,
  LayoutDashboard, BarChart3, PieChart, ListChecks, Megaphone,
  Palette, Ruler, BellRing, Accessibility, Recycle, MousePointerClick,
  Twitch, MessageCircle, Music2, Instagram, Youtube, Twitter, ThumbsUp,
} from 'lucide';

// Semantic name -> Lucide component. Source of truth for data-lucide="name".
export const ICON_MAP = {
  rocket: Rocket, 'circle-check': CircleCheck, send: Send, 'trending-up': TrendingUp,
  zap: Zap, gem: Gem, crown: Crown, medal: Medal,
  search: Search, sliders: SlidersHorizontal, command: Command,
  'arrow-right': ArrowRight, 'arrow-up-right': ArrowUpRight, 'arrow-down': ArrowDown,
  copy: Copy, undo: Undo2, bell: Bell, x: X, check: Check,
  'chevron-down': ChevronDown, 'chevron-right': ChevronRight, 'chevron-left': ChevronLeft,
  menu: Menu, user: User, users: Users, settings: Settings, 'log-out': LogOut,
  shield: Shield, 'shield-check': ShieldCheck, flag: Flag,
  mail: Mail, lock: Lock, eye: Eye, 'eye-off': EyeOff, 'credit-card': CreditCard,
  package: Package, calendar: Calendar, clipboard: Clipboard,
  star: Star, heart: Heart, award: Award, trophy: Trophy, sparkles: Sparkles,
  flame: Flame, target: Target, gift: Gift, dice: Dice5,
  globe: Globe, link: Link2, image: Image, trash: Trash2, pencil: Pencil,
  download: Download, upload: Upload, refresh: RefreshCw,
  'alert-triangle': AlertTriangle, info: Info, 'circle-alert': CircleAlert,
  'mail-open': MailOpen, 'mail-x': MailX, ban: Ban, 'circle-x': CircleX,
  dashboard: LayoutDashboard, 'bar-chart': BarChart3, 'pie-chart': PieChart,
  'list-checks': ListChecks, megaphone: Megaphone,
  palette: Palette, ruler: Ruler, 'bell-ring': BellRing, accessibility: Accessibility,
  recycle: Recycle, 'mouse-click': MousePointerClick, 'thumbs-up': ThumbsUp,
  twitch: Twitch, discord: MessageCircle, tiktok: Music2,
  instagram: Instagram, youtube: Youtube, twitter: Twitter, website: Globe,
};

// Legacy emoji -> semantic name, so dynamic JS strings (task cards,
// notifications, etc.) can call iconSVG('🚀') during migration without
// every call site needing to be rewritten at once.
export const EMOJI_TO_NAME = {
  '🚀': 'rocket', '✅': 'circle-check', '📤': 'send', '📈': 'trending-up',
  '⚡': 'zap', '💠': 'gem', '👑': 'crown', '🥇': 'medal', '🥈': 'medal', '🥉': 'medal',
  '💎': 'gem', '♦️': 'gem', '🟢': 'circle-check', '🔷': 'gem',
  '🔍': 'search', '📊': 'bar-chart', '🎯': 'target', '🔒': 'lock',
  '📧': 'mail', '👤': 'user', '⭐': 'star', '🎉': 'sparkles', '🔥': 'flame',
  '🛡': 'shield-check', '📋': 'clipboard', '📅': 'calendar', '📦': 'package',
  '👥': 'users', '💳': 'credit-card', '📷': 'image', '🏆': 'trophy',
  '🤝': 'users', '🚩': 'flag', '📢': 'megaphone', '🌟': 'sparkles', '🚫': 'ban',
  '✗': 'x', '✕': 'x', '✏': 'pencil', '🎖': 'award', '⬇': 'arrow-down',
  '📌': 'target', '🌱': 'recycle', '✨': 'sparkles', '💵': 'credit-card',
  '🗑': 'trash', '🎁': 'gift', '🎰': 'dice', '📭': 'mail-x', '🏅': 'medal',
  '🎨': 'palette', '📐': 'ruler', '🔔': 'bell-ring', '🖼': 'image',
  '♿': 'accessibility', '📬': 'mail-open', '✉': 'mail', '❌': 'circle-x',
  '📆': 'calendar', '♻': 'recycle', '⚠': 'alert-triangle',
  '🎵': 'tiktok', '📸': 'instagram', '▶️': 'youtube', '💬': 'discord',
  '🌐': 'website', '🐦': 'twitter', '🟣': 'twitch',
};

function makeSVG(Comp, size, thin) {
  return createElement(Comp, {
    width: size, height: size, stroke: 'currentColor',
    'stroke-width': thin ? 1.5 : 1.75,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    class: 'lucide-icon',
  });
}

// For dynamic template-string rendering (e.g. task card innerHTML built in
// app.js). Accepts either a semantic name or a legacy emoji glyph.
export function iconSVG(nameOrEmoji, size = 18) {
  const name = ICON_MAP[nameOrEmoji] ? nameOrEmoji : EMOJI_TO_NAME[nameOrEmoji];
  const Comp = ICON_MAP[name];
  if (!Comp) return '';
  return makeSVG(Comp, size, false).outerHTML;
}

export function renderIcons(root = document) {
  root.querySelectorAll('[data-lucide]').forEach((el) => {
    const name = el.getAttribute('data-lucide');
    const size = Number(el.getAttribute('data-size')) || 18;
    const Comp = ICON_MAP[name];
    if (!Comp) return;
    el.replaceWith(makeSVG(Comp, size, el.hasAttribute('data-thin')));
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderIcons());
  } else {
    renderIcons();
  }
}
