/**
 * modal.js — Lead capture modal with Loops.so integration
 * Triggers after N interactions, submits email to Loops newsletter,
 * includes rate limiting and error handling.
 */

const LOOPS_ENDPOINT = 'https://app.loops.so/api/newsletter-form/cmhekzzxadmuw050ik5ata346';
const TRIGGER_COUNT = 4;
const SESSION_KEY = 'vibe_interaction_count';
const DISMISSED_KEY = 'vibe_modal_dismissed';
const RATE_LIMIT_KEY = 'loops-form-timestamp';
const RATE_LIMIT_MS = 60000;

export class LeadModal {
  constructor() {
    this.overlay = document.getElementById('lead-modal');
    this.closeBtn = document.getElementById('modal-close');
    this.form = document.getElementById('lead-form');
    this.emailInput = document.getElementById('lead-email');
    this.submitBtn = document.getElementById('modal-submit-btn');
    this.submitText = document.getElementById('modal-submit-text');

    this.count = parseInt(sessionStorage.getItem(SESSION_KEY) || '0', 10);
    this.dismissed = sessionStorage.getItem(DISMISSED_KEY) === 'true';
    this.submitted = false;
    this.submitting = false;

    this._bindEvents();
  }

  _bindEvents() {
    this.closeBtn.addEventListener('click', () => this.hide());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hide();
    });

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._onSubmit();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) this.hide();
    });
  }

  /** Record an interaction and potentially show the modal */
  recordInteraction() {
    if (this.submitted) return;

    this.count++;
    sessionStorage.setItem(SESSION_KEY, this.count.toString());

    if (this.count === TRIGGER_COUNT && !this.dismissed) {
      setTimeout(() => this.show(), 1200);
    }
  }

  show() {
    this.overlay.hidden = false;
    this.overlay.offsetHeight; // Force reflow
    this.overlay.classList.add('visible');
    this.emailInput.focus();
    document.body.style.overflow = 'hidden';
  }

  hide() {
    this.overlay.classList.remove('visible');
    this.dismissed = true;
    sessionStorage.setItem(DISMISSED_KEY, 'true');
    document.body.style.overflow = '';

    setTimeout(() => {
      this.overlay.hidden = true;
    }, 500);
  }

  isVisible() {
    return this.overlay.classList.contains('visible');
  }

  /** Check client-side rate limit (1 signup per 60s) */
  _isRateLimited() {
    const prev = localStorage.getItem(RATE_LIMIT_KEY);
    if (prev && Number(prev) + RATE_LIMIT_MS > Date.now()) {
      return true;
    }
    return false;
  }

  async _onSubmit() {
    const email = this.emailInput.value.trim();
    if (!email || this.submitting) return;

    // Rate limit check
    if (this._isRateLimited()) {
      this._showError('Easy there — try again in a minute.');
      return;
    }

    localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
    this.submitting = true;
    this._showLoading();

    const formBody = `userGroup=&mailingLists=&email=${encodeURIComponent(email)}`;

    try {
      const res = await fetch(LOOPS_ENDPOINT, {
        method: 'POST',
        body: formBody,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (res.ok) {
        this.submitted = true;
        this._showSuccess();
      } else {
        const data = await res.json().catch(() => null);
        const msg = data?.message || res.statusText || 'Something went wrong.';
        this._showError(msg);
        localStorage.setItem(RATE_LIMIT_KEY, '');
      }
    } catch (err) {
      // Cloudflare block or network error
      if (err.message === 'Failed to fetch') {
        this._showError('Too many signups — try again shortly.');
      } else {
        this._showError(err.message || 'Something went wrong.');
      }
      localStorage.setItem(RATE_LIMIT_KEY, '');
    } finally {
      this.submitting = false;
    }
  }

  _showLoading() {
    this.submitBtn.disabled = true;
    this.submitText.textContent = 'Sending...';
    this.emailInput.disabled = true;
  }

  _showSuccess() {
    const card = this.overlay.querySelector('.modal-card');
    card.innerHTML = `
      <div class="modal-emoji" style="animation: float 2.5s ease-in-out infinite;">🎉</div>
      <h2 class="modal-heading">You're in!</h2>
      <p class="modal-desc">We'll be in touch.</p>
      <button class="btn btn-primary" style="margin-top: 8px;" id="modal-success-close">
        <span class="btn-text">Back to GIFs</span>
      </button>
    `;
    card.querySelector('#modal-success-close')
      .addEventListener('click', () => this.hide());

    setTimeout(() => this.hide(), 3500);
  }

  _showError(message) {
    // Reset form to try again
    this.submitBtn.disabled = false;
    this.submitText.textContent = "Let's go";
    this.emailInput.disabled = false;

    // Flash the input border red briefly
    this.emailInput.style.borderColor = 'var(--accent-danger)';
    this.emailInput.style.boxShadow = '0 0 0 3px rgba(255, 107, 107, 0.25)';

    // Show error below input
    let errEl = this.form.querySelector('.modal-error');
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.className = 'modal-error';
      errEl.style.cssText = 'font-size:0.75rem;color:var(--accent-danger);margin-top:var(--space-sm);';
      this.form.appendChild(errEl);
    }
    errEl.textContent = message;

    // Clear error styling after 3s
    setTimeout(() => {
      this.emailInput.style.borderColor = '';
      this.emailInput.style.boxShadow = '';
      if (errEl) errEl.textContent = '';
    }, 3000);
  }
}
