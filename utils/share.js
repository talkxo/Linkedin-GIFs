/**
 * share.js — LinkedIn share URL builder
 */

/**
 * Opens a LinkedIn share dialog with the caption and GIF URL.
 * @param {string} caption - AI-generated caption
 * @param {string} gifUrl - URL of the current GIF
 */
export function shareToLinkedIn(caption, gifUrl) {
  const text = `${caption}\n\n${gifUrl}\n\n🎯 Find your corporate vibe → ${window.location.href}`;
  const encodedText = encodeURIComponent(text);
  const shareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodedText}`;
  window.open(shareUrl, '_blank', 'noopener,noreferrer');
}
