Project Plan: The "Corporate Vibe Matrix" Lead Magnet
Project Objective: Build an interactive, 4-quadrant mood matrix that translates a user’s current work vibe into a highly contextual, office-related GIF via AI. The tool will drive LinkedIn virality and capture B2B leads for the agency.

Core Tech Stack:

Frontend: React, Vue, or Vanilla JS + CSS (Canvas or custom CSS grid for the matrix).

AI Translation Layer: OpenRouter API (using a fast, free model like meta-llama/llama-3-8b-instruct).

Visual Data Layer: Giphy API (Standard Search endpoint).

Phase 1: UI/UX Design & Prototyping
Goal: Finalize the visual layout and interaction design of the matrix and results panel.

[ ] Task 1.1: Design the 2D Matrix (Left Panel)

Define the axes: X-Axis (Energy: Low to High) and Y-Axis (Outlook: Chaos to Zen).

Design the draggable "Dot" or "Cursor" and the hover/drag states.

Design subtle background color shifts based on which quadrant the dot enters.

[ ] Task 1.2: Design the Results Panel (Right Panel)

Define the container for the looping GIF (ensure uniform aspect ratio/cropping).

Design the AI-generated caption text area (e.g., "Current Status: Surviving on iced coffee").

Design the two primary action buttons: ↻ Nah, next face and in Post to LinkedIn.

[ ] Task 1.3: Design the Lead Capture Flow

Design the subtle "Powered by [Agency]" watermark for the GIF container.

Design the popup modal that triggers on the 3rd interaction (e.g., "Want marketing this engaging? Drop your email.").

Phase 2: Frontend Development (The Grid & UI)
Goal: Build the interactive web app and logic for capturing user coordinates.

[ ] Task 2.1: Build the Interactive Matrix Component

Implement drag-and-drop functionality for the matrix dot.

Write the math logic to convert the dot's final resting position into X/Y percentages (e.g., X: 85%, Y: 20%).

[ ] Task 2.2: Build the Results UI Shell

Create the placeholder loading state (e.g., "Analyzing corporate despair...").

Build the button components and wire them to dummy functions.

[ ] Task 2.3: State Management Setup

Set up state to hold: Current X/Y coords, current AI query, Giphy JSON array, and current GIF index (for the "Next" button).

Phase 3: AI & API Integration (The Brains)
Goal: Connect the frontend to OpenRouter and Giphy, ensuring the "office-only" guardrails are strictly enforced.

[ ] Task 3.1: Configure OpenRouter Logic

Write the backend/serverless function to pass the X/Y coordinates to OpenRouter.

Implement the strict System Prompt instructing the AI to output a JSON object containing:

A 6-word max Giphy search string (must include "office", "work", "desk", or "corporate").

A witty, 1-sentence LinkedIn caption.

[ ] Task 3.2: Configure Giphy API Logic

Take the AI-generated search string and pass it to the Giphy API endpoint.

Fetch an array of the top 15 results (to allow for the "Next" button functionality).

Ensure API parameters include rating=g (SFW) and prioritize human expressions.

[ ] Task 3.3: Wire the "Next Face" Button

Program the ↻ Nah, next face button to iterate through the Giphy JSON array without re-triggering the AI prompt, ensuring instantaneous loading.

[ ] Task 3.4: Set up Vercel Project & Environment Variables
Initialize the project in Vercel.

Navigate to Project Settings > Environment Variables.

Add OPENROUTER_API_KEY and GIPHY_API_KEY so they are securely stored on the server.

[ ] Task 3.5: Build the Serverless API Route
Create an api/get-vibe.js (or .ts) file in the project root.

Write the Node.js logic to handle the incoming POST request, chain the two APIs together, and return the final payload.

Phase 4: Social Sharing & Lead Generation
Goal: Make it shareable and activate the monetization/lead-capture mechanics.

[ ] Task 4.1: Implement LinkedIn Share URL

Format the LinkedIn sharing string so clicking the button opens a new tab with the AI caption and GIF link pre-loaded.

URL Structure: https://www.linkedin.com/feed/?shareActive=true&text=[URL_ENCODED_AI_CAPTION]+[GIF_URL]

[ ] Task 4.2: Implement the "Friction" Counter (Lead Capture)

Set a local session counter that tracks how many times the user clicks "Next Face" or "Post to LinkedIn".

Trigger the Lead Capture Modal exactly on interaction #3.

Connect the email input field to your agency's CRM (HubSpot, Mailchimp, ActiveCampaign, etc.).

Phase 5: QA, Rate Limits, and Launch
Goal: Ensure the app doesn't break under load and looks flawless.

[ ] Task 5.1: Mobile Optimization

Ensure the drag-and-drop matrix works smoothly on touch screens.

[ ] Task 5.2: Edge Case Testing

Test extreme coordinates (0,0 or 100,100) to ensure the AI still returns valid JSON.

Implement fallback error handling (if OpenRouter times out, instantly search Giphy for a generic "technical difficulties" office GIF).

[ ] Task 5.3: API Rate Limit Protections

Implement basic debounce on the drag-and-drop so the API only fires when the user releases the dot, not while they are dragging it.

