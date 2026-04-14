/**
 * share.js — LinkedIn share utility
 * Downloads the GIF for manual upload and opens LinkedIn compose with caption.
 */

const APP_URL = 'https://linkedin-gifs.vercel.app/';

/**
 * Downloads the GIF so the user can attach it to their LinkedIn post,
 * then opens LinkedIn compose with the caption pre-filled.
 * @param {string} caption - AI-generated caption
 * @param {string} gifUrl - URL of the current GIF
 */
export async function shareToLinkedIn(caption, gifUrl) {
  // 1. Download GIF for the user to attach
  try {
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = 'my-work-vibe.gif';
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (e) {
    // If download fails, open GIF in new tab for manual save
    window.open(gifUrl, '_blank');
  }

  // 2. Open LinkedIn compose with caption only (no ugly raw URL)
  const text = `${caption}\n\n🎯 Find your corporate vibe → ${APP_URL}`;
  const shareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;

  // Small delay so the download initiates first
  setTimeout(() => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }, 500);
}
