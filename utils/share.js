/**
 * share.js — LinkedIn share utility
 * Opens LinkedIn compose with caption pre-filled.
 */

const APP_URL = 'https://linkedin-gifs.vercel.app/';

/**
 * Opens LinkedIn compose with the caption pre-filled.
 * The user should have already copied the GIF link via the copy button.
 * @param {string} caption - AI-generated caption
 */
export function shareToLinkedIn(caption) {
  const text = `${caption}\n\n🎯 Find your corporate vibe → ${APP_URL}`;
  const shareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
  window.open(shareUrl, '_blank', 'noopener,noreferrer');
}
