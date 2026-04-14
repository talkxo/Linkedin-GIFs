/**
 * matrix.js — Interactive 2D mood matrix with drag-and-drop
 * Handles pointer events, quadrant detection, trail rendering,
 * coordinate normalization, and visual feedback.
 */

import { clamp } from '../utils/animate.js';

/** Quadrant configuration */
const QUADRANTS = {
  tl: { name: 'burnout', color: '#ff4d6a', cssVar: '--accent-burnout' },
  tr: { name: 'hustle',  color: '#ff9f43', cssVar: '--accent-hustle' },
  bl: { name: 'quiet',   color: '#6c5ce7', cssVar: '--accent-quiet' },
  br: { name: 'flow',    color: '#00cec9', cssVar: '--accent-flow' },
};

export class Matrix {
  /**
   * @param {Object} opts
   * @param {HTMLElement} opts.container - #matrix-container
   * @param {HTMLElement} opts.dot - #vibe-dot
   * @param {HTMLCanvasElement} opts.trailCanvas - #trail-canvas
   * @param {HTMLElement} opts.gradient - #matrix-gradient
   * @param {function} opts.onDrag - Called during drag with { energy, outlook, quadrant }
   * @param {function} opts.onRelease - Called on release with { energy, outlook, quadrant }
   */
  constructor({ container, dot, trailCanvas, gradient, onDrag, onRelease }) {
    this.container = container;
    this.dot = dot;
    this.trailCanvas = trailCanvas;
    this.trailCtx = trailCanvas.getContext('2d');
    this.gradient = gradient;
    this.onDrag = onDrag;
    this.onRelease = onRelease;

    this.isDragging = false;
    this.position = { x: 0.5, y: 0.5 }; // Normalized 0-1
    this.currentQuadrant = null;
    this.trail = [];
    this.trailRafId = null;

    this._init();
  }

  _init() {
    this._resizeTrailCanvas();

    // Pointer events (unified mouse + touch)
    this.dot.addEventListener('pointerdown', this._onPointerDown);
    this.container.addEventListener('pointerdown', this._onContainerClick);
    window.addEventListener('pointermove', this._onPointerMove, { passive: false });
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerUp);
    window.addEventListener('resize', () => this._resizeTrailCanvas(), { passive: true });

    // Keyboard support
    this.dot.addEventListener('keydown', this._onKeyDown);

    // Initial quadrant
    this._updateQuadrant();
    this._startTrailLoop();
  }

  _resizeTrailCanvas() {
    const rect = this.container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.trailCanvas.width = rect.width * dpr;
    this.trailCanvas.height = rect.height * dpr;
    this.trailCtx.scale(dpr, dpr);
    this.containerRect = rect;
  }

  /** Convert page coordinates to normalized 0-1 position */
  _pageToNorm(pageX, pageY) {
    const rect = this.container.getBoundingClientRect();
    return {
      x: clamp((pageX - rect.left) / rect.width, 0, 1),
      y: clamp((pageY - rect.top) / rect.height, 0, 1),
    };
  }

  /** Update dot DOM position from normalized coords */
  _updateDotPosition() {
    this.dot.style.left = `${this.position.x * 100}%`;
    this.dot.style.top = `${this.position.y * 100}%`;
  }

  /** Detect which quadrant the dot is in and update visuals */
  _updateQuadrant() {
    const { x, y } = this.position;
    let key;
    if (x < 0.5 && y < 0.5) key = 'tl';
    else if (x >= 0.5 && y < 0.5) key = 'tr';
    else if (x < 0.5 && y >= 0.5) key = 'bl';
    else key = 'br';

    const q = QUADRANTS[key];

    if (this.currentQuadrant !== q.name) {
      this.currentQuadrant = q.name;

      // Update CSS custom property for theming
      document.documentElement.style.setProperty('--q-color', q.color);

      // Update gradient background
      this.gradient.style.background = `radial-gradient(
        circle at ${x * 100}% ${y * 100}%,
        ${q.color}18 0%,
        ${q.color}08 30%,
        transparent 70%
      )`;

      // Activate matching quadrant label
      document.querySelectorAll('.quadrant-label').forEach(el => {
        el.classList.toggle('active', el.dataset.quadrant === q.name);
      });
    } else {
      // Just update gradient position
      const q2 = QUADRANTS[key];
      this.gradient.style.background = `radial-gradient(
        circle at ${x * 100}% ${y * 100}%,
        ${q2.color}18 0%,
        ${q2.color}08 30%,
        transparent 70%
      )`;
    }

    return q.name;
  }

  /** Get normalized energy (x: 0=low, 100=high) and outlook (y: 0=chaos, 100=zen) */
  getCoords() {
    return {
      energy: Math.round(this.position.x * 100),
      outlook: Math.round((1 - this.position.y) * 100), // Invert Y: top=chaos(0), bottom=zen(100)
      quadrant: this.currentQuadrant,
    };
  }

  /* ---- Pointer Event Handlers ---- */

  _onPointerDown = (e) => {
    e.preventDefault();
    this.isDragging = true;
    this.dot.classList.add('dragging');
    this.dot.setPointerCapture(e.pointerId);
    this.trail = [];
  };

  _onContainerClick = (e) => {
    if (e.target === this.dot || this.dot.contains(e.target)) return;

    // Clicking directly on the matrix: teleport dot
    const norm = this._pageToNorm(e.clientX, e.clientY);
    this.position = norm;
    this._updateDotPosition();
    this._updateQuadrant();

    // Add bounce animation
    this.dot.classList.add('released');
    setTimeout(() => this.dot.classList.remove('released'), 500);

    const coords = this.getCoords();
    this.onDrag?.(coords);
    this.onRelease?.(coords);
  };

  _onPointerMove = (e) => {
    if (!this.isDragging) return;
    e.preventDefault();

    const norm = this._pageToNorm(e.clientX, e.clientY);
    this.position = norm;

    // Add to trail
    const rect = this.container.getBoundingClientRect();
    this.trail.push({
      x: norm.x * rect.width,
      y: norm.y * rect.height,
      time: performance.now(),
      opacity: 0.5,
    });

    // Keep trail manageable
    if (this.trail.length > 30) this.trail.shift();

    this._updateDotPosition();
    const quadrant = this._updateQuadrant();
    this.onDrag?.(this.getCoords());
  };

  _onPointerUp = (e) => {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.dot.classList.remove('dragging');
    this.dot.classList.add('released');
    setTimeout(() => this.dot.classList.remove('released'), 500);

    this.onRelease?.(this.getCoords());
  };

  _onKeyDown = (e) => {
    const step = e.shiftKey ? 0.1 : 0.03;
    let moved = false;

    switch (e.key) {
      case 'ArrowLeft':  this.position.x = clamp(this.position.x - step, 0, 1); moved = true; break;
      case 'ArrowRight': this.position.x = clamp(this.position.x + step, 0, 1); moved = true; break;
      case 'ArrowUp':    this.position.y = clamp(this.position.y - step, 0, 1); moved = true; break;
      case 'ArrowDown':  this.position.y = clamp(this.position.y + step, 0, 1); moved = true; break;
      case 'Enter':
      case ' ':
        this.onRelease?.(this.getCoords());
        return;
      default: return;
    }

    if (moved) {
      e.preventDefault();
      this._updateDotPosition();
      this._updateQuadrant();
      this.onDrag?.(this.getCoords());
    }
  };

  /* ---- Trail Rendering ---- */

  _startTrailLoop() {
    const render = () => {
      const rect = this.container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const ctx = this.trailCtx;

      ctx.clearRect(0, 0, w, h);

      const now = performance.now();
      const fadeMs = 600;

      // Draw fading trail
      for (let i = this.trail.length - 1; i >= 0; i--) {
        const p = this.trail[i];
        const age = now - p.time;

        if (age > fadeMs) {
          this.trail.splice(i, 1);
          continue;
        }

        const alpha = (1 - age / fadeMs) * 0.35;
        const size = 3 + (1 - age / fadeMs) * 3;
        const style = getComputedStyle(document.documentElement).getPropertyValue('--q-color').trim();

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = (style || '#818cf8').replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        // Fallback for hex
        if (!ctx.fillStyle.includes('rgba')) {
          ctx.fillStyle = `rgba(129, 140, 248, ${alpha})`;
        }
        ctx.fill();
      }

      this.trailRafId = requestAnimationFrame(render);
    };

    this.trailRafId = requestAnimationFrame(render);
  }

  destroy() {
    cancelAnimationFrame(this.trailRafId);
    this.dot.removeEventListener('pointerdown', this._onPointerDown);
    this.container.removeEventListener('pointerdown', this._onContainerClick);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerUp);
    this.dot.removeEventListener('keydown', this._onKeyDown);
  }
}
