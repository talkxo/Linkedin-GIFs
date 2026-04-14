// File: /api/get-vibe.js (Vercel Serverless Function)

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { energy, outlook } = req.body;

    // Validate env vars
    if (!process.env.OPENROUTER_API_KEY || !process.env.GIPHY_API_KEY) {
        console.error('Missing API keys in environment variables');
        return res.status(500).json({ error: 'Server misconfigured.' });
    }

    try {
        // 1. Call OpenRouter
        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "liquid/lfm-2.5-1.2b-thinking:free",
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: `You translate work moods into GIF search terms. The user's mood is: Energy: ${energy}% (0=low, 100=high), Outlook: ${outlook}% (0=chaotic, 100=zen).
Output a JSON object with exactly two keys:
- "search_query": a Giphy search string, max 6 words, MUST include "office" or "work" and imply a human facial expression or reaction.
- "caption": a funny, relatable 1-sentence LinkedIn caption about work life. Keep it under 15 words.
Output ONLY valid JSON. No markdown, no explanation, no extra text.`
                    }
                ]
            })
        });

        if (!aiResponse.ok) {
            console.error('OpenRouter error:', aiResponse.status, await aiResponse.text());
            throw new Error(`OpenRouter returned ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const rawContent = aiData.choices?.[0]?.message?.content || '';

        // Strip thinking tags, markdown fences, and whitespace
        let parsedAI;
        try {
            const cleaned = rawContent
                .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .trim();
            parsedAI = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error('Failed to parse AI response:', rawContent);
            // Fallback so the user still gets GIFs
            parsedAI = {
                search_query: 'office worker reaction face',
                caption: 'Just another day in corporate paradise.'
            };
        }

        // 2. Call Giphy
        const giphyResponse = await fetch(
            `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${encodeURIComponent(parsedAI.search_query)}&limit=15&rating=g`
        );

        if (!giphyResponse.ok) {
            console.error('Giphy error:', giphyResponse.status);
            throw new Error(`Giphy returned ${giphyResponse.status}`);
        }

        const giphyData = await giphyResponse.json();

        return res.status(200).json({
            caption: parsedAI.caption,
            gifs: giphyData.data
        });

    } catch (error) {
        console.error("API Pipeline Error:", error);
        return res.status(500).json({ error: "Failed to generate vibe." });
    }
}