// ============================================================
// NEXT BOOST — motion.js
// Small, tasteful interaction polish. No-ops entirely under
// prefers-reduced-motion. Everything here is progressive
// enhancement — pages work identically without it.
// ============================================================

const reduceMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// ---- Magnetic buttons: subtle pull toward cursor on primary CTAs ----
function initMagnetic() {
  if (reduceMotion()) return;
  document.querySelectorAll('[data-magnetic]').forEach((btn) => {
    let raf = null;
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.25;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// ---- Card tilt: gentle 3D tilt following pointer, capped low ----
function initTilt() {
  if (reduceMotion()) return;
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    let raf = null;
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform =
          `perspective(600px) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 4).toFixed(2)}deg)`;
      });
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ---- Animated counters: count up when scrolled into view ----
function initCounters() {
  const els = document.querySelectorAll('[data-count-to]');
  if (!els.length) return;
  const animate = (el) => {
    const target = Number(el.getAttribute('data-count-to')) || 0;
    if (reduceMotion()) { el.textContent = target.toLocaleString(); return; }
    const dur = 900;
    const start = performance.now();
    const from = 0;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (target - from) * eased).toLocaleString();
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (!('IntersectionObserver' in window)) { els.forEach(animate); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); }
    });
  }, { threshold: 0.4 });
  els.forEach((el) => io.observe(el));
}

export function initMotion() {
  initMagnetic();
  initTilt();
  initCounters();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMotion);
  } else {
    initMotion();
  }
}
