/**
 * main.js — App initialization & orchestration
 * Wires all components together and manages the core flow:
 * drag → API call → display result → share/next.
 */

import './style.css';
import { Matrix } from './components/matrix.js';
import { Results } from './components/results.js';
import { LeadModal } from './components/modal.js';
import { ParticleSystem } from './components/particles.js';
import { fetchVibe } from './utils/api.js';
import { debounce } from './utils/animate.js';

class App {
  constructor() {
    this.matrix = null;
    this.results = null;
    this.modal = null;
    this.particles = null;
    this.isLoading = false;
    this.lastCoords = null;

    this._init();
  }

  _init() {
    // Initialize particle background
    this.particles = new ParticleSystem(
      document.getElementById('particles-canvas')
    );

    // Initialize matrix
    this.matrix = new Matrix({
      container: document.getElementById('matrix-container'),
      dot: document.getElementById('vibe-dot'),
      trailCanvas: document.getElementById('trail-canvas'),
      gradient: document.getElementById('matrix-gradient'),
      onDrag: (coords) => this._onDrag(coords),
      onRelease: (coords) => this._onRelease(coords),
    });

    // Initialize lead modal
    this.modal = new LeadModal();

    // Initialize results panel
    this.results = new Results({
      onInteraction: (type) => {
        this.modal.recordInteraction();
      },
    });

    // Listen for retry events
    document.addEventListener('vibe:retry', () => {
      if (this.lastCoords) {
        this._fetchAndDisplay(this.lastCoords);
      }
    });

    // Wire the mobile "Read My Vibe" button
    const generateBtn = document.getElementById('generate-btn');
    generateBtn.addEventListener('click', () => {
      const coords = this.matrix.getCoords();
      this._onRelease(coords);
    });

    // Add ripple to generate button
    generateBtn.addEventListener('click', (e) => {
      const rect = generateBtn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      generateBtn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });

    console.log('[VibeMatrix] ✨ App initialized');
  }

  /** During drag: update coordinates display + particle colors */
  _onDrag(coords) {
    document.getElementById('coord-x').textContent = coords.energy;
    document.getElementById('coord-y').textContent = coords.outlook;

    // Update particle color to match quadrant
    this.particles.setQuadrantColor(coords.quadrant);
  }

  /** On release: fetch vibe from API */
  _onRelease(coords) {
    if (this.isLoading) return;
    this.lastCoords = coords;
    this._fetchAndDisplay(coords);
  }

  /** Core flow: show loading → fetch → show result or error */
  async _fetchAndDisplay(coords) {
    this.isLoading = true;
    this.results.showLoading();

    // Scroll results into view on mobile
    if (window.innerWidth <= 768) {
      document.getElementById('results-panel').scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }

    try {
      const data = await fetchVibe(coords.energy, coords.outlook);

      if (!data.gifs || data.gifs.length === 0) {
        throw new Error('No GIFs found for your vibe. Try a different spot!');
      }

      this.results.showSuccess(data);
    } catch (err) {
      console.error('[VibeMatrix] Fetch error:', err);
      this.results.showError(err.message || 'Failed to generate vibe. Try again?');
    } finally {
      this.isLoading = false;
    }
  }
}

// Boot the app
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
