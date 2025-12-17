// API_KEY will be set by game.js after validation

class AIAgent {
    constructor(character, game) {
        this.character = character;
        this.game = game;
        this.isThinking = false;
        // No more setInterval loop
    }

    // Called whenever the character observes an event
    notify(event) {
        // PASSIVE MODE: Agents do not trigger themselves anymore.
        // The Global Coordinator handles the decision to think.
    }

    // Triggered by the Global Coordinator.
    // We ignore the passed global history to prevent data leakage.
    async forceThink() {
        this.isThinking = true;
        this.toggleLoading(true);
        // console.log removed as per user request

        // Use ONLY local memory
        const prompt = this.constructPrompt(this.character.memory);

        try {
            const action = await this.callGemini(prompt);
            this.executeAction(action);
        } catch (error) {
            console.error(`[AI ${this.character.name}] Error:`, error);
        }

        this.toggleLoading(false);
        this.isThinking = false;
    }

    toggleLoading(show) {
        const el = document.getElementById('loading-indicator');
        if (el) {
            if (show) el.classList.remove('hidden');
            else el.classList.add('hidden');
        }
    }

    constructPrompt(history) {
        // Use the last 50 events from global history to keep context manageable but deep
        const recentHistory = history.slice(-50);
        const eventsText = recentHistory.map(e => `[${new Date(e.timestamp).toISOString()}] ${e.sourceId}: ${e.description}`).join('\n');

        // Add Inventory Context
        const myItems = getItemsByHolder(this.character.id).map(i => i.name).join(', ');
        const inventoryText = myItems ? `You are holding: ${myItems}` : "You are holding nothing.";

        return `
You are playing the role of an NPC in a fantasy text adventure game.
Your Name: ${this.character.name}
Your Description: ${this.character.description}
Secret Motivation: ${this.character.secret || "None"}
Current Location: ${this.character.currentRoomId}
${inventoryText}

Global Game History:
${eventsText}

Instructions:
1. You have been prompted to speak/act by the Game Director.
2. Respond naturally to the recent events.
3. Your personality is PARAMOUNT.
4. Output a JSON ARRAY of actions to perform in order.
5. Allowed Actions:
   - {"action": "say", "content": "..."}
   - {"action": "give", "item": "item name", "target": "recipient name"}
   - {"action": "wait"} (Use if you decide to do nothing)
6. You can combine actions (e.g., say something then give an item).
7. Keep responses short and conversational.

Response (JSON Array):
`;
    }

    async callGemini(prompt) {
        // Using gemini-2.0-flash-exp as requested
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('No candidates returned');
            }

            const text = data.candidates[0].content.parts[0].text;
            // Clean up markdown code blocks if present
            const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            // Ensure we have a valid structure (array or object)
            const result = JSON.parse(jsonText);

            // Normalize to array
            return Array.isArray(result) ? result : [result];
        } catch (error) {
            throw error; // Let think() handle it
        }
    }

    executeAction(actions) {
        if (!actions || !Array.isArray(actions)) return;

        actions.forEach(result => {
            if (result.action === 'say') {
                this.game.npcSay(this.character.id, result.content);
            } else if (result.action === 'give') {
                this.game.npcGive(this.character.id, result.item, result.target);
            }
        });
    }
}
