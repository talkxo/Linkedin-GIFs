/**
 * animate.js — Spring physics + easing utilities
 * Lightweight, zero-dependency animation primitives.
 */

/** Clamp a value between min and max */
export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/** Linear interpolation */
export const lerp = (a, b, t) => a + (b - a) * t;

/** Map a value from one range to another */
export const mapRange = (value, inMin, inMax, outMin, outMax) =>
  outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);

/**
 * Spring animation using requestAnimationFrame.
 * Returns a cancel function.
 * @param {Object} opts
 * @param {number} opts.from - Start value
 * @param {number} opts.to - Target value
 * @param {number} [opts.stiffness=180] - Spring stiffness
 * @param {number} [opts.damping=12] - Damping factor
 * @param {number} [opts.mass=1] - Mass
 * @param {number} [opts.precision=0.01] - Settlement threshold
 * @param {function} opts.onUpdate - Called each frame with current value
 * @param {function} [opts.onComplete] - Called when settled
 */
export function spring({ from, to, stiffness = 180, damping = 12, mass = 1, precision = 0.01, onUpdate, onComplete }) {
  let value = from;
  let velocity = 0;
  let rafId = null;
  let lastTime = performance.now();

  const tick = (now) => {
    const dt = Math.min((now - lastTime) / 1000, 0.064); // Cap at ~16fps minimum
    lastTime = now;

    const displacement = value - to;
    const springForce = -stiffness * displacement;
    const dampingForce = -damping * velocity;
    const acceleration = (springForce + dampingForce) / mass;

    velocity += acceleration * dt;
    value += velocity * dt;

    onUpdate(value);

    if (Math.abs(velocity) < precision && Math.abs(value - to) < precision) {
      value = to;
      onUpdate(value);
      onComplete?.();
      return;
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
  };
}

/**
 * Animate a value over time with an easing function.
 * Returns a cancel function.
 */
export function tween({ from, to, duration = 400, easing = easeOutExpo, onUpdate, onComplete }) {
  const start = performance.now();
  let rafId = null;

  const tick = (now) => {
    const elapsed = now - start;
    const progress = clamp(elapsed / duration, 0, 1);
    const easedProgress = easing(progress);
    const value = lerp(from, to, easedProgress);

    onUpdate(value);

    if (progress < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      onComplete?.();
    }
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
  };
}

/**
 * Typewriter effect: reveals text character by character.
 * Uses CSS class injection for each character.
 * @param {HTMLElement} el - Target element
 * @param {string} text - Text to reveal
 * @param {number} [charDelay=35] - ms per character
 * @returns {{ cancel: function }} - Cancel handle
 */
export function typewriter(el, text, charDelay = 35) {
  el.innerHTML = '';
  const chars = text.split('');
  let cancelled = false;

  chars.forEach((char, i) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = char === ' ' ? '\u00A0' : char;
    span.style.animationDelay = `${i * charDelay}ms`;
    el.appendChild(span);
  });

  return {
    cancel() {
      cancelled = true;
      el.textContent = text;
    }
  };
}

/** Debounce utility */
export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/* ---- Easing Functions ---- */
export const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
