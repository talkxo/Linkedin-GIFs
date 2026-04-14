// File: /api/get-vibe.js (Vercel Serverless Function)

export default async function handler(req, res) {
    // 1. Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { energy, outlook } = req.body;

    try {
        // 2. Call OpenRouter API (Using secure Env Variables)
        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3-8b-instruct", // Free & fast model
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: `You translate work moods. Energy: ${energy}, Outlook: ${outlook}. 
            Output JSON with 'search_query' (under 6 words, must include 'office' or 'work' and imply a human facial expression) 
            and 'caption' (a funny 1-sentence LinkedIn caption).`
                    }
                ]
            })
        });

        const aiData = await aiResponse.json();
        const parsedAI = JSON.parse(aiData.choices[0].message.content);

        // 3. Chain the Giphy API Call instantly
        const giphyResponse = await fetch(
            `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${encodeURIComponent(parsedAI.search_query)}&limit=15&rating=g`
        );
        const giphyData = await giphyResponse.json();

        // 4. Send the perfectly formatted payload back to the frontend
        return res.status(200).json({
            caption: parsedAI.caption,
            gifs: giphyData.data // Array of 15 GIFs for the "Next" button
        });

    } catch (error) {
        console.error("API Pipeline Error:", error);
        return res.status(500).json({ error: "Failed to generate vibe." });
    }
}