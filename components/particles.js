/**
 * particles.js — Ambient background particle system
 * Lightweight canvas-based floating particles with mouse parallax.
 * Color-shifts to match the active quadrant.
 */

const MAX_PARTICLES = 45;
const PARTICLE_SPEED = 0.15;
const PARALLAX_FACTOR = 0.02;
const CONNECT_DISTANCE = 120;

export class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: 0, y: 0 };
    this.color = { r: 129, g: 140, b: 248 }; // --accent-primary
    this.targetColor = { ...this.color };
    this.rafId = null;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this._handleResize = this._resize.bind(this);
    this._handleMouse = this._onMouseMove.bind(this);

    this._init();
  }

  _init() {
    window.addEventListener('resize', this._handleResize, { passive: true });
    window.addEventListener('mousemove', this._handleMouse, { passive: true });
    this._resize();
    this._spawn();
    this._loop();
  }

  _resize() {
    const { innerWidth: w, innerHeight: h } = window;
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.scale(this.dpr, this.dpr);
    this.w = w;
    this.h = h;
  }

  _spawn() {
    this.particles = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: (Math.random() - 0.5) * PARTICLE_SPEED * 2,
        vy: (Math.random() - 0.5) * PARTICLE_SPEED * 2,
        size: 1.5 + Math.random() * 2,
        opacity: 0.15 + Math.random() * 0.25,
      });
    }
  }

  _onMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  /** Update the particle color to match the active quadrant */
  setQuadrantColor(quadrant) {
    const colors = {
      burnout: { r: 255, g: 77, b: 106 },
      hustle:  { r: 255, g: 159, b: 67 },
      quiet:   { r: 108, g: 92, b: 231 },
      flow:    { r: 0, g: 206, b: 201 },
    };
    this.targetColor = colors[quadrant] || { r: 129, g: 140, b: 248 };
  }

  _loop = () => {
    const { ctx, w, h, particles, mouse, dpr } = this;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Lerp color toward target
    this.color.r += (this.targetColor.r - this.color.r) * 0.03;
    this.color.g += (this.targetColor.g - this.color.g) * 0.03;
    this.color.b += (this.targetColor.b - this.color.b) * 0.03;

    const { r, g, b } = this.color;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Parallax offset from mouse
      const dx = (mouse.x - w / 2) * PARALLAX_FACTOR;
      const dy = (mouse.y - h / 2) * PARALLAX_FACTOR;

      p.x += p.vx + dx * 0.01;
      p.y += p.vy + dy * 0.01;

      // Wrap around edges
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${p.opacity})`;
      ctx.fill();

      // Connect nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < CONNECT_DISTANCE) {
          const lineOpacity = (1 - dist / CONNECT_DISTANCE) * 0.08;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${lineOpacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    this.rafId = requestAnimationFrame(this._loop);
  };

  destroy() {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this._handleResize);
    window.removeEventListener('mousemove', this._handleMouse);
  }
}
