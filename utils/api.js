/**
 * api.js — API integration layer
 * Handles OpenRouter + Giphy pipeline via serverless function,
 * with mock mode for local development.
 */

/** Mock mode — set to true to skip real API calls during dev */
const USE_MOCK = false;

const MOCK_CAPTIONS_BY_QUADRANT = {
  burnout: [
    "Current status: pretending this spreadsheet sparks joy.",
    "Alexa, play 'Everybody Hurts' during this standup.",
    "My soul left the chat after the 3rd meeting today.",
    "Running on fumes, coffee, and sheer audacity.",
  ],
  hustle: [
    "Me in every 'quick sync' that's actually an hour long.",
    "This is what peak performance looks like (according to my Jira board).",
    "POV: You just got added to a 47-person Slack channel.",
    "I don't have a work-life balance. I have a work-work balance.",
  ],
  quiet: [
    "My team thinks I'm multitasking. I'm actually dissociating.",
    "Manifesting a 4-day work week with every fiber of my being.",
    "Doing the bare minimum has never felt so luxurious.",
    "Quiet quitting? I prefer 'acting my wage.'",
  ],
  flow: [
    "Just vibing through another 'urgent' email thread.",
    "Living proof that coffee is a personality trait.",
    "Smiling on the outside, crushing deadlines on the inside.",
    "Peak zen. Peak productivity. Peak delusion.",
  ],
};

const FALLBACK_CAPTIONS = [
  "Corporate wellness program? I AM the wellness program.",
  "When the 'optional' meeting has your manager on the invite.",
  "Deadline? I prefer the term 'suggestion from the timeline gods.'",
  "Running on vibes, spite, and whatever's left in the Keurig.",
];

/**
 * Reliable Giphy GIF IDs (office/work themed, verified active).
 * Using the embed URLs which are stable.
 */
const MOCK_GIF_IDS = [
  'JIX9t2j0ZTN9S', 'l1KVaj5UcbHwrBMqI', 'hS6j9pzCDOiMHvLUqa',
  'Ll2fajzk9UWaI', '13CoXDiaCcCoyk', 'jUwpNzg9IcyrK',
  'LmNwrBhejkK9EFP504', 'BPJmthQ3YRwD6QqcVD', 'xTiTnxpQ3ghPiB2Hp6',
  'h3u7w8BR07IHDsnzQw', 'VGG8UY1nEl66Y', 'WRQBXSCnEFJIuxktnw',
  'l0HlBO7eyXzSZkJri', 'lJNoBCvQYp7nq', 'Yl5aO3gdVfsQ0',
];

function buildMockGifs() {
  return MOCK_GIF_IDS.map((id, i) => ({
    id: String(i + 1),
    images: {
      original: {
        url: `https://media.giphy.com/media/${id}/giphy.gif`,
      },
      downsized: {
        url: `https://media.giphy.com/media/${id}/giphy.gif`,
      },
    },
  }));
}

/**
 * Detect quadrant from coordinates
 */
function detectQuadrant(energy, outlook) {
  if (energy < 50 && outlook < 50) return 'quiet';
  if (energy >= 50 && outlook < 50) return 'flow';
  if (energy < 50 && outlook >= 50) return 'burnout';
  return 'hustle';
}

/**
 * Fetches vibe data (caption + GIFs) from server or mock.
 * @param {number} energy - 0-100 energy value
 * @param {number} outlook - 0-100 outlook value (0=Zen, 100=Chaos)
 * @returns {Promise<{ caption: string, gifs: Array }>}
 */
export async function fetchVibe(energy, outlook) {
  if (USE_MOCK) {
    return mockFetchVibe(energy, outlook);
  }

  const response = await fetch('/api/get-vibe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ energy, outlook }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Mock implementation for local dev — simulates network delay.
 */
async function mockFetchVibe(energy, outlook) {
  // Simulate network latency (1-2s)
  await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));

  const quadrant = detectQuadrant(energy, outlook);
  const captions = MOCK_CAPTIONS_BY_QUADRANT[quadrant] || FALLBACK_CAPTIONS;
  const caption = captions[Math.floor(Math.random() * captions.length)];

  // Shuffle GIFs for variety
  const gifs = buildMockGifs().sort(() => Math.random() - 0.5);

  return { caption, gifs };
}
