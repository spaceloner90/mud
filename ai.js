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
        const myItems = this.game.getItemsByHolder(this.character.id).map(i => {
            const desc = (i.description || "").replace(/\n/g, " ");
            return `[ID: ${i.id}] ${i.name} (${desc})`;
        }).join('\n- ');
        const inventoryText = myItems ? `You are holding:\n- ${myItems}` : "You are holding nothing.";

        // Add Room Context
        const room = this.game.world[this.character.currentRoomId];
        const roomName = room ? room.name : "Unknown";
        const roomDesc = room ? room.description : "You are in a void.";

        // Other characters in the room (excluding self)
        const others = this.game.getCharactersInRoom(this.character.currentRoomId)
            .filter(c => c.id !== this.character.id)
            .map(c => `${c.name} (${c.description})`)
            .join('\n- ');

        const otherCharsText = others ? `Characters here:\n- ${others}` : "You are alone.";

        // Visible Items
        const visibleItems = this.game.getItemsByHolder(this.character.currentRoomId)
            .filter(i => !i.isHidden) // visible only
            .map(i => {
                const desc = (i.description || "").replace(/\n/g, " ");
                return `[ID: ${i.id}] ${i.name} (${desc})`;
            })
            .join('\n- ');
        const itemsText = visibleItems ? `Items here:\n- ${visibleItems}` : "No items visible.";

        return `
You are playing the role of an NPC in a fantasy text adventure game.
Your Name: ${this.character.name}
Your Description: ${this.character.description}
Secret Motivation: ${this.character.secret || "None"}

Current Environment:
Location: ${roomName}
Description: ${roomDesc}
${otherCharsText}
${itemsText}

${inventoryText}

Global Game History:
${eventsText}

WORLD LORE:
WORLD LORE:
${this.getLoreContext()}

Instructions:
1. You have been prompted to speak/act by the Game Director.
2. Respond naturally to the recent events.
3. Your personality is PARAMOUNT.
4. Output a JSON ARRAY of actions to perform in order.
5. Allowed Actions:
   - {"action": "say", "content": "..."}
   - {"action": "emote", "content": "..."} (e.g., "shrugs", "nods at You")
   - {"action": "give", "item": "item_id", "target": "recipient name"}
   - {"action": "wait"} (Use if you decide to do nothing)
6. You can combine actions (e.g., say something then emote).
7. Keep responses short and conversational.
8. When emoting about the player, refer to them as "You".

Response (JSON Array):
`;
    }

    async callGemini(prompt) {
        if (this.game.verboseLogging) {
            console.log(`[AI Agent] System Prompt:\n${prompt}`);
        }

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

            if (this.game.verboseLogging) {
                console.log(`[AI Agent] Raw Response:\n${JSON.stringify(data, null, 2)}`);
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

        // Filter out 'wait' if there are other actions
        const hasRealAction = actions.some(a => a.action !== 'wait');
        if (hasRealAction) {
            actions = actions.filter(a => a.action !== 'wait');
        }

        actions.forEach(result => {
            if (result.action === 'say') {
                this.game.npcSay(this.character.id, result.content);
            } else if (result.action === 'emote') {
                this.game.npcEmote(this.character.id, result.content);
            } else if (result.action === 'give') {
                this.game.npcGive(this.character.id, result.item, result.target);
            } else if (result.action === 'wait') {
                console.log(`[AI Agent] ${this.character.name} decided to wait.`);
            } else {
                console.log(`[AI Agent] ${this.character.name} decided to do nothing (invalid action: ${result.action})`);
            }
        });
    }

    getLoreContext() {
        if (!this.character.knowledge || !this.game.lore) return "No specific lore known.";

        const knownLore = this.character.knowledge.map(key => {
            if (this.game.lore[key]) {
                return `[KNOWLEDGE - ${key}]: ${this.game.lore[key]}`;
            }
            return null;
        }).filter(k => k !== null);

        if (knownLore.length === 0) return "No specific lore known.";
        return knownLore.join('\\n');
    }
}
