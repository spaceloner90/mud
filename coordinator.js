// API_KEY is defined in ai.js which is loaded first

class AICoordinator {
    constructor(game, secrets = {}) {
        this.game = game;
        this.history = []; // Unlimited history as requested
        this.isThinking = false;

        // Registry of game secrets that can be revealed by the Director
        this.secrets = secrets;
        this.reactionTimeout = null;
    }

    // Called by game.js whenever a broadcastEvent happens
    onEvent(event) {
        // Redundancy Check: The 'leave' event ("Player moved from A to B") provides sufficient context.
        // The 'enter' event ("Player arrived from A") is redundant for the Director.
        if (event.type === 'enter') return;

        this.history.push(event);
        console.log(`[Director] Recorded: ${event.type} - ${event.description}`);

        // Check for VICTORY
        if (this.game.getItemsByHolder('player').some(i => i.id === 'signet_ring')) {
            this.game.victory();
            return;
        }

        // DEBOUNCE REACTION LOGIC
        // Clear any pending reaction to prevent request storms while navigating
        if (this.reactionTimeout) {
            clearTimeout(this.reactionTimeout);
            this.reactionTimeout = null;
        }

        // Decide if we should trigger a reaction (or check for reveals)
        if (event.sourceId === 'player') {
            if (event.type === 'leave') {
                // Navigation: Wait 4s to ensure player settles in the room
                console.log('[Director] Navigation detected. Queuing reaction in 4s...');
                this.reactionTimeout = setTimeout(() => this.directorThink({ allowResponse: true }), 4000);
            } else if (event.type === 'say' || event.type === 'action') {
                // Action/Speech: Wait 1s (debounced)
                this.reactionTimeout = setTimeout(() => this.directorThink({ allowResponse: true }), 1000);
            }
        } else if (event.type === 'say') {
            // NPC spoke: Check for reveals (passive), short delay
            this.reactionTimeout = setTimeout(() => this.directorThink({ allowResponse: false }), 500);
        }
    }

    async directorThink(options = { allowResponse: true }) {
        if (this.isThinking) return;

        // Find NPCs in the current room
        const currentRoomId = this.game.currentRoom.id;
        const potentialResponders = this.game.getCharactersInRoom(currentRoomId).filter(c => c.id !== 'player');

        if (potentialResponders.length === 0) return;

        // Only block UI for full thinking, not passive checks
        const showLoading = options.allowResponse;

        console.log(`[Director] Deciding reaction (${options.allowResponse ? 'Full' : 'Reveal Only'}) for candidates: ${potentialResponders.map(c => c.name).join(', ')}`);

        this.isThinking = true;
        if (showLoading) this.game.toggleLoading(true);

        // OPTIMIZATION: If there is only one NPC, skip the Director LLM and trigger them directly.
        // The Agent will decide based on the global history if they should speak or wait.
        if (options.allowResponse && potentialResponders.length === 1) {
            const soloAgent = potentialResponders[0];
            console.log(`[Director] Solo agent optimization: Triggering ${soloAgent.name} directly.`);
            if (soloAgent.aiAgent) {
                if (showLoading) this.game.toggleLoading(true);
                // We must yield to let the UI update the spinner before the blocking await, 
                // though forceThink is async so it should be fine.
                await soloAgent.aiAgent.forceThink();
                if (showLoading) this.game.toggleLoading(false);
                this.isThinking = false;
                return;
            }
        }

        const prompt = this.constructDirectorPrompt(potentialResponders, options.allowResponse);

        try {
            const decision = await this.callGemini(prompt);
            console.log(`[Director] Decision: ${JSON.stringify(decision)}`);
            this.executeDirectorDecision(decision);
        } catch (error) {
            console.error('[Director] Error:', error);
        }

        if (showLoading) this.game.toggleLoading(false);
        this.isThinking = false;
    }

    constructDirectorPrompt(npcs, allowResponse) {
        const historyText = this.history.map(e => `[${new Date(e.timestamp).toISOString()}] ${e.sourceId}: ${e.description}`).join('\n');
        const npcProfiles = npcs.map(c => `- ${c.name} (ID: ${c.id}): ${c.description} [Secret: ${c.secret || 'None'}]`).join('\n');

        // Filter for unresolved secrets
        const activeSecrets = Object.values(this.secrets).filter(s => !s.resolved);
        const secretInstructions = activeSecrets.length > 0
            ? `Active Secrets to Watch For:\n${activeSecrets.map(s => `- ID: "${s.id}" -> Description: ${s.description}`).join('\n')}\n`
            : "No active secrets to watch for.";

        return `
You are the Game Director for a text adventure MUD.
Your goal is to manage the NPCs in the current room and decide WHO should respond to the recent events.
You primarily act as a "Dungeon Master", ensuring the plot moves forward.

Current Room: ${this.game.currentRoom.name} - ${this.game.currentRoom.description}
NPCs Present:
${npcProfiles}

Global Game History:
${historyText}

WORLD KNOWLEDGE (Director Eyes Only):
${this.game.lore ? this.game.lore.common : ''}

${secretInstructions}

Instructions:
1. Analyze the history and the latest event.
2. CHECK FOR SECRETS: If the last message was an NPC revealing an "Active Secret", output its ID in "reveals".
   - WARNING: Do NOT reveal if the NPC is merely negotiating or asking for an item. Only reveal if they actually disclose the fact (e.g., "The path is East").
   - Do NOT count player promises as reveals.
${allowResponse ?
                `3. Decide if ONE of the NPCs should speak or act.
   - If the PLAYER spoke, someone should usually reply.
   - If an NPC spoke, ONLY reply if ANOTHER NPC should interject.
   - CRITICAL: Do NOT select the same actor who just spoke (${this.history.length > 0 ? this.history[this.history.length - 1].sourceId : 'none'}). Stop the chain.
4. If NO response is needed (or the NPC just finished a thought), return: {"action": "wait", "reveals": [...]}.
5. If an NPC should speak, return their ID.`
                :
                `3. PASSIVE MODE: Do NOT trigger any new dialogue.
4. Return {"action": "wait", "reveals": [...]}.`
            }
6. DO NOT generate the dialogue.

Response Format (JSON):
{
  "action": "trigger",
  "actorId": "EXACT_ID_FROM_LIST",
  "reveals": ["secret_id_1"] 
}
OR
{
  "action": "wait",
  "reveals": ["secret_id_1"]
}

IMPORTANT: Output ONLY valid JSON.
`;
    }

    async callGemini(prompt) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });
            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();
            if (!data.candidates || !data.candidates.length) throw new Error('No candidates');
            const text = data.candidates[0].content.parts[0].text;

            // Extract JSON object from potential markdown or conversational text
            const match = text.match(/\{[\s\S]*\}/);
            if (!match) throw new Error('No JSON object found in response');

            return JSON.parse(match[0]);
        } catch (error) {
            throw error;
        }
    }

    executeDirectorDecision(decision) {
        // Handle Reveals
        if (decision.reveals && Array.isArray(decision.reveals)) {
            decision.reveals.forEach(secretId => {
                const secret = this.secrets[secretId];
                if (secret && !secret.resolved) {
                    console.log(`[Director] Revealing Secret: ${secretId}`);
                    secret.revealFunc(this.game);
                    secret.resolved = true;
                }
            });
        }

        // Handle Trigger
        if (decision.action === 'trigger' && decision.actorId) {
            const character = this.game.characters[decision.actorId];
            if (character && character.aiAgent) {
                console.log(`[Director] Triggering ${character.name} to speak...`);
                // Do NOT pass global history. Use local agent memory.
                character.aiAgent.forceThink();
            } else {
                console.warn(`[Director] Trigger failed for ID: ${decision.actorId}. Character found: ${!!character}, AI Agent attached: ${!!(character && character.aiAgent)}`);
            }
        }
    }
}
