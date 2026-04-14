/**
 * results.js — Results panel controller
 * Manages state transitions (empty → loading → success → error),
 * GIF display with reveal animation, typewriter captions, and button actions.
 */

import { typewriter } from '../utils/animate.js';
import { shareToLinkedIn } from '../utils/share.js';

const LOADING_MESSAGES = [
  "Finding your GIF...",
  "Matching mood to GIF...",
  "Scanning the GIF archives...",
  "AI is picking your face...",
  "Almost ready for LinkedIn...",
  "Curating peak relatability...",
  "One sec, this GIF is chef's kiss...",
];

export class Results {
  /**
   * @param {Object} opts
   * @param {function} opts.onInteraction - Called on each button interaction (for lead counter)
   */
  constructor({ onInteraction }) {
    // DOM refs
    this.states = {
      empty: document.getElementById('results-empty'),
      loading: document.getElementById('results-loading'),
      success: document.getElementById('results-success'),
      error: document.getElementById('results-error'),
    };

    this.loadingText = document.getElementById('loading-text');
    this.gifImage = document.getElementById('gif-image');
    this.gifRevealMask = document.getElementById('gif-reveal-mask');
    this.captionText = document.getElementById('caption-text');
    this.gifIndex = document.getElementById('gif-index');
    this.gifTotal = document.getElementById('gif-total');
    this.btnNext = document.getElementById('btn-next');
    this.btnShare = document.getElementById('btn-share');
    this.btnRetry = document.getElementById('btn-retry');
    this.errorMessage = document.getElementById('error-message');

    this.onInteraction = onInteraction;

    // State
    this.gifs = [];
    this.currentIndex = 0;
    this.caption = '';
    this.loadingInterval = null;
    this.typewriterHandle = null;

    this._bindEvents();
  }

  _bindEvents() {
    this.btnNext.addEventListener('click', () => this._onNext());
    this.btnShare.addEventListener('click', () => this._onShare());
    this.btnRetry.addEventListener('click', () => {
      // Retry triggers a custom event the main app listens for
      document.dispatchEvent(new CustomEvent('vibe:retry'));
    });

    // Ripple effect on buttons
    [this.btnNext, this.btnShare, this.btnRetry].forEach(btn => {
      btn.addEventListener('click', (e) => this._ripple(e, btn));
    });
  }

  /** Switch visible state */
  _showState(stateName) {
    Object.entries(this.states).forEach(([key, el]) => {
      el.classList.toggle('active', key === stateName);
    });
  }

  /** Rotate loading messages */
  _startLoadingMessages() {
    let i = Math.floor(Math.random() * LOADING_MESSAGES.length);
    this.loadingText.textContent = LOADING_MESSAGES[i];

    this.loadingInterval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      this.loadingText.style.opacity = '0';
      this.loadingText.style.transform = 'translateY(-4px)';

      setTimeout(() => {
        this.loadingText.textContent = LOADING_MESSAGES[i];
        this.loadingText.style.opacity = '1';
        this.loadingText.style.transform = 'translateY(0)';
      }, 200);
    }, 2200);
  }

  _stopLoadingMessages() {
    clearInterval(this.loadingInterval);
    this.loadingInterval = null;
  }

  /** Show loading state */
  showLoading() {
    this._showState('loading');
    this._startLoadingMessages();
  }

  /**
   * Show success state with GIF + caption.
   * @param {{ caption: string, gifs: Array }} data
   */
  showSuccess(data) {
    this._stopLoadingMessages();
    this.caption = data.caption;
    this.gifs = data.gifs;
    this.currentIndex = 0;

    this.gifTotal.textContent = this.gifs.length;
    this._displayCurrentGif();
    this._showState('success');
  }

  /** Show error state */
  showError(message) {
    this._stopLoadingMessages();
    this.errorMessage.textContent = message || 'Something went wrong. Try again?';
    this._showState('error');
  }

  /** Display the GIF at currentIndex with reveal animation */
  _displayCurrentGif() {
    const gif = this.gifs[this.currentIndex];
    if (!gif) return;

    const url = gif.images?.original?.url || gif.images?.downsized?.url || '';
    this.gifIndex.textContent = this.currentIndex + 1;

    // Reset for new image
    this.gifImage.classList.remove('loaded');
    this.gifImage.src = '';

    // Pre-load image
    const img = new Image();
    img.onload = () => {
      this.gifImage.src = url;
      // Trigger reveal animation
      requestAnimationFrame(() => {
        this.gifImage.classList.add('loaded');
      });
    };
    img.onerror = () => {
      // Skip broken GIF
      if (this.currentIndex < this.gifs.length - 1) {
        this.currentIndex++;
        this._displayCurrentGif();
      }
    };
    img.src = url;

    // Typewriter caption (only on first load, not next-cycling)
    if (this.typewriterHandle) this.typewriterHandle.cancel();
    this.typewriterHandle = typewriter(this.captionText, `"${this.caption}"`, 30);
  }

  /** Next face button */
  _onNext() {
    if (this.gifs.length === 0) return;

    this.currentIndex = (this.currentIndex + 1) % this.gifs.length;
    this._displayCurrentGif();
    this.onInteraction?.('next');

    // Add a subtle scale bounce to the GIF container
    const wrapper = this.gifImage.parentElement;
    wrapper.style.transform = 'scale(0.97)';
    setTimeout(() => {
      wrapper.style.transform = 'scale(1)';
    }, 150);
  }

  /** Share button */
  _onShare() {
    const gif = this.gifs[this.currentIndex];
    const gifUrl = gif?.images?.original?.url || '';
    shareToLinkedIn(this.caption, gifUrl);
    this.onInteraction?.('share');
  }

  /** Button ripple effect */
  _ripple(e, btn) {
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }
}
