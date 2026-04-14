import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      open: true,
    },
    build: {
      outDir: 'dist',
      minify: 'esbuild',
    },
    plugins: [
      // Dev-only API proxy — mimics the Vercel serverless function locally
      {
        name: 'vibe-api-proxy',
        configureServer(server) {
          server.middlewares.use('/api/get-vibe', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            // Parse JSON body
            let body = '';
            for await (const chunk of req) body += chunk;
            const { energy, outlook } = JSON.parse(body);

            try {
              // 1. Call OpenRouter
              const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'liquid/lfm-2.5-1.2b-thinking:free',
                  response_format: { type: 'json_object' },
                  messages: [
                    {
                      role: 'system',
                      content: `You translate work moods into GIF search terms. The user's current mood is: Energy: ${energy}% (0=low, 100=high), Outlook: ${outlook}% (0=chaotic, 100=zen).
Output a JSON object with exactly two keys:
- "search_query": a Giphy search string, max 6 words, MUST include "office" or "work" and imply a human facial expression or reaction.
- "caption": a funny, relatable 1-sentence LinkedIn caption about work life. Keep it under 15 words.
Output ONLY valid JSON, no markdown, no explanation.`,
                    },
                  ],
                }),
              });

              const aiData = await aiRes.json();
              let parsedAI;

              try {
                const content = aiData.choices?.[0]?.message?.content || '';
                // Strip any markdown fencing or thinking tags the model might add
                const cleaned = content
                  .replace(/```json\s*/gi, '')
                  .replace(/```\s*/g, '')
                  .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
                  .trim();
                parsedAI = JSON.parse(cleaned);
              } catch (parseErr) {
                console.error('[API] Failed to parse AI response:', aiData.choices?.[0]?.message?.content);
                // Fallback
                parsedAI = {
                  search_query: 'office worker reaction face',
                  caption: 'Just another day in corporate paradise.',
                };
              }

              // 2. Call Giphy
              const giphyRes = await fetch(
                `https://api.giphy.com/v1/gifs/search?api_key=${env.GIPHY_API_KEY}&q=${encodeURIComponent(parsedAI.search_query)}&limit=15&rating=g`
              );
              const giphyData = await giphyRes.json();

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                caption: parsedAI.caption,
                gifs: giphyData.data,
              }));
            } catch (err) {
              console.error('[API] Pipeline error:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to generate vibe.' }));
            }
          });
        },
      },
    ],
  };
});
