// API_KEY is defined in ai.js which is loaded first

class AICoordinator {
    constructor(game, secrets = {}) {
        this.game = game;
        this.history = []; // Unlimited history as requested
        this.isThinking = false;

        // Registry of game secrets that can be revealed by the Director
        this.secrets = secrets;
        this.reactionTimeout = null;

        // Conversation Dynamics
        this.conversationDecay = 0.4; // Probability drops by turn (0.4 default)
        this.maxConversationDepth = 5; // Hard limit on chain length
        this.conversationPace = 2500; // ms to wait between turns (allows multiple lines & prevents throttling)
        this.currentChainDepth = 0;
    }

    // Called by game.js whenever a broadcastEvent happens
    onEvent(event) {
        // Redundancy Check: The 'leave' event ("Player moved from A to B") provides sufficient context.
        // The 'enter' event ("Player arrived from A") is redundant for the Director.
        if (event.type === 'enter') return;
        if (event.type === 'enter') return;
        if (event.sourceId === 'director') return;
        if (event.skipReaction) {
            console.log(`[Director] Ignoring event (skipReaction): ${event.description}`);
            return;
        }

        this.history.push(event);
        console.log(`[Director] Recorded: ${event.type} - ${event.description}`);

        // Check for VICTORY
        const victory = this.game.victoryCondition;
        if (victory) {
            if (victory.condition === 'item_held' && victory.itemId) {
                if (this.game.getItemsByHolder('player').some(i => i.id === victory.itemId)) {
                    this.game.victory();
                    return;
                }
            }
        }

        // DEBOUNCE REACTION LOGIC
        // Clear any pending reaction to prevent request storms while navigating
        if (this.reactionTimeout) {
            clearTimeout(this.reactionTimeout);
            this.reactionTimeout = null;
        }

        // Decide if we should trigger a reaction (or check for reveals)
        // Decide if should trigger reaction
        if (event.sourceId === 'player') {
            // Player spoke/acted: RESET chain
            this.currentChainDepth = 0;
            this.lastChainSpeakerId = 'player'; // Reset speaker tracking

            if (event.type === 'leave') {
                console.log('[Director] Navigation detected. Queuing reaction in 4s...');
                this.reactionTimeout = setTimeout(() => this.directorThink({ allowResponse: true }), 4000);
            } else if (event.type === 'say' || event.type === 'action') {
                this.reactionTimeout = setTimeout(() => this.directorThink({ allowResponse: true }), 1000);
            }
        } else if (event.type === 'say' || event.type === 'action') {
            // NPC spoke or acted
            // NPC spoke checks

            // Check Probability Decay
            // Only proceed if there is someone else to respond!
            const potentialResponders = this.game.getCharactersInRoom(this.game.currentRoom.id)
                .filter(c => c.id !== event.sourceId && c.id !== 'player');

            if (potentialResponders.length > 0) {
                // If speaker changed, increment depth (conversation is flowing back and forth)
                if (event.sourceId !== this.lastChainSpeakerId) {
                    this.currentChainDepth++;
                    this.lastChainSpeakerId = event.sourceId;

                    // Check Max Depth here, after valid increment
                    if (this.currentChainDepth >= this.maxConversationDepth) {
                        console.log(`[Director] Conversation Chain Reached Max Depth (${this.maxConversationDepth}). Stopping.`);
                        return;
                    }
                }

                // Depth 1 (response to player) -> P = 0.5^1 = 0.5
                // Depth 2 -> 0.25, etc.
                const probability = Math.pow(this.conversationDecay, this.currentChainDepth);
                const roll = Math.random();

                if (roll < probability) {
                    console.log(`[Director] Chain Reaction Triggered (Depth ${this.currentChainDepth}, Prob ${probability.toFixed(2)}, Roll ${roll.toFixed(2)}).`);
                    this.reactionTimeout = setTimeout(() => this.directorThink({ allowResponse: true }), this.conversationPace);
                } else {
                    console.log(`[Director] Chain Reaction Ended (Depth ${this.currentChainDepth}, Prob ${probability.toFixed(2)}, Roll ${roll.toFixed(2)}). Checking for secrets...`);
                    // Even if conversation ends, we must check if the last message revealed a secret.
                    this.reactionTimeout = setTimeout(() => this.directorThink({ allowResponse: false }), 500);
                }
            } else {
                // No one to talk to. 
                // CRITICAL: We still need to check if the LAST EVENT revealed a secret.
                this.currentChainDepth = 0;
                this.lastChainSpeakerId = null;
                console.log('[Director] Solo NPC spoke. Triggering passive Secret Check.');
                this.reactionTimeout = setTimeout(() => this.directorThink({ allowResponse: false }), 500);
            }
        }
    }

    async directorThink(options = { allowResponse: true }) {
        if (this.isThinking) return;

        // Find NPCs in the current room
        const currentRoomId = this.game.currentRoom.id;
        let potentialResponders = this.game.getCharactersInRoom(currentRoomId).filter(c => c.id !== 'player');

        // FILTER: If the last event had a specific target, ONLY that target should respond.
        const lastEvent = this.history.length > 0 ? this.history[this.history.length - 1] : null;
        if (lastEvent) {
            if (lastEvent.targetId) {
                console.log(`[Director] Targeted event detected for: ${lastEvent.targetId}`);
                potentialResponders = potentialResponders.filter(c => c.id === lastEvent.targetId);
            } else if (lastEvent.sourceId !== 'player') {
                // Prevent self-response (Chain Loop)
                potentialResponders = potentialResponders.filter(c => c.id !== lastEvent.sourceId);
            }
        }

        if (potentialResponders.length === 0 && options.allowResponse) return;

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

                // CRITICAL: The solo optimization bypassed the secret check.
                // We must trigger a passive check now to see if the agent revealed anything.
                setTimeout(() => this.directorThink({ allowResponse: false }), 500);
                return;
            }
        }


        // Determine MODE & Construct Prompt
        let prompt = null;

        // Check if last event was Player
        // lastEvent is already declared above
        if (lastEvent && lastEvent.sourceId === 'player') {
            // RESPONSE_ONLY
            prompt = this.constructResponsePrompt(potentialResponders);
        } else if (options.allowResponse) {
            // FULL (NPC spoke -> Group)
            prompt = this.constructFullPrompt(potentialResponders);
        } else {
            // REVEAL_ONLY (NPC spoke -> Solo)
            prompt = this.constructRevealPrompt();
        }

        if (!prompt) {
            console.log('[Director] No prompt generated (likely no active secrets in Reveal Mode). Skipping.');
            this.isThinking = false;
            return;
        }

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

    constructResponsePrompt(npcs) {
        // MODE: RESPONSE_ONLY (Player spoke)
        // Goal: Pick a responder. Ignore secrets.
        const historyText = this.history.map(e => `[${new Date(e.timestamp).toISOString()}] ${e.sourceId}: ${e.description}`).join('\n');
        const npcProfiles = npcs.map(c => `- ID: "${c.id}" | Name: "${c.name}" | Description: ${c.description} | Secret: ${JSON.stringify(c.secret || 'None')}`).join('\n');

        return `
You are the Game Director for a text adventure MUD.
Current Room: ${this.game.currentRoom.name}
Recent History:
${historyText}

Available NPCs:
${npcProfiles}

TASK:
1. The PLAYER has just spoken or acted.
2. Decide which NPC from the list above should respond based on their personality and the context.
3. Return "action": "trigger" and the EXACT "actorId".

Response Format (JSON):
{
  "action": "trigger",
  "actorId": "npc_id"
}`;
    }

    constructRevealPrompt() {
        // MODE: REVEAL_ONLY (Solo NPC spoke)
        // Goal: Check for secret reveals. Do NOT pick a responder.
        const historyText = this.history.map(e => `[${new Date(e.timestamp).toISOString()}] ${e.sourceId}: ${e.description}`).join('\n');
        const activeSecrets = Object.values(this.secrets).filter(s => !s.resolved);

        if (activeSecrets.length === 0) return null; // No secrets to check

        const secretInstructions = activeSecrets.map(s => `- ID: "${s.id}" -> Description: ${s.description}`).join('\n');

        return `
You are the Game Director for a text adventure MUD.
Recent History:
${historyText}

Active Secrets (Quest Objectives):
${secretInstructions}

TASK:
1. Analyze the last few lines of history.
2. Did an NPC *EXPLICITLY* reveal a secret or perform a confirming action?
   * **STRICT RULE**: Do NOT trigger on figures of speech, metaphors, or idioms. 
     - Example: "I'm poking around the ashes" is a metaphor for investigating, NOT a confession of burning a will. A confession would be "I burned the will."
   * **STRICT RULE**: Tacit admission is allowed ONLY if it implies the specific facts of the secret. Vague evasions ("I won't say") are NOT reveals.
   * **STRICT RULE**: If an item is required, the NPC must *give* or *show* it. Merely offering it is not enough.
   * Only NPCs can reveal secrets. Ignore player text.

3. If YES, output the secret_id in "reveals".

EXAMPLES:
- Secret: "Scarlet burned the will" | NPC: "Back to poke around the ashes?" -> NO MATCH (Metaphor)
- Secret: "Scarlet burned the will" | NPC: "Fine! I burned it!" -> MATCH ("reveals": ["scarlet_confession"])
- Secret: "Thorne has the key" | NPC: "I saw Thorne holding a brass key." -> MATCH ("reveals": ["thorne_key"])

Response Format (JSON):
{
  "reveals": ["secret_id"]
}`;
    }

    constructFullPrompt(npcs) {
        // MODE: FULL (Group NPC conversation)
        // Goal: Check secrets AND potentially pick introjector.
        const historyText = this.history.map(e => `[${new Date(e.timestamp).toISOString()}] ${e.sourceId}: ${e.description}`).join('\n');
        const npcDetailedProfiles = npcs.map(c => `- ID: "${c.id}" | Name: "${c.name}" | Description: ${c.description} | Secret: ${JSON.stringify(c.secret || 'None')}`).join('\n');

        const activeSecrets = Object.values(this.secrets).filter(s => !s.resolved);
        const secretInstructions = activeSecrets.length > 0
            ? `Active Secrets to Watch For:\n${activeSecrets.map(s => `- ID: "${s.id}" -> Description: ${s.description}`).join('\n')}\n`
            : "No active secrets to watch for.";

        return `
You are the Game Director.
Current Room: ${this.game.currentRoom.name}
Active Secrets:
${secretInstructions}

History:
${historyText}

NPCs Present:
${npcDetailedProfiles}

TASK:
1. CHECK REVEALS:
   - Did an NPC *EXPLICITLY* reveal a secret?
   - **STRICT RULE**: Do NOT trigger on figures of speech, metaphors, or idioms.
     - Example: "Ashes to ashes" or "poking in the ashes" are idioms, NOT confessions of burning a will.
   - **STRICT RULE**: Tacit admission is allowed ONLY if it implies specific facts. Vague evasions are NOT reveals.
   - If YES, output the secret_id in "reveals".

2. CHECK TRIGGER: Should another NPC interject?
   - Only if necessary to keep the flow or contradict the speaker.
   - If yes, output "action": "trigger", "actorId": "id".
   - If no, output "action": "wait".

Response Format (JSON):
{
  "reveals": ["secret_id"],
  "action": "trigger" | "wait",
  "actorId": "npc_id" (otpional)
}`;
    }

    async callGemini(prompt) {
        if (this.game.verboseLogging) {
            console.log(`[Director] System Prompt:\n${prompt}`);
        }

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

            if (this.game.verboseLogging) {
                console.log(`[Director] Raw Response:\n${JSON.stringify(data, null, 2)}`);
            }

            if (!data.candidates || !data.candidates.length) throw new Error('No candidates');
            const text = data.candidates[0].content.parts[0].text;

            // Extract JSON object from potential markdown or conversational text
            const match = text.match(/\{[\s\S]*\}/);
            if (!match) {
                console.warn('[Director] Raw Response:', text);
                throw new Error('No JSON object found in response');
            }

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
                    secret.reveal(this.game);
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

    async evaluateSolution(playerInput) {
        if (this.isThinking) {
            console.log('[Director] Busy thinking. Ignoring solve request.');
            return; // Prevent re-entry
        }

        const solutionData = this.game.solution;

        // SCENARIO 1 (or others) with no solution defined
        if (!solutionData) {
            this.game.printImmediate("There is no mystery to 'solve' in this scenario. You must achieve victory through other means.", 'system-msg');
            this.isThinking = false;
            this.game.toggleLoading(false);
            return;
        }

        const prompt = `
You are the Supreme Judge of a Murder Mystery Game.
The Player has submitted a solution to the case.
Your job is to compare their accusation against the Absolute Truth and determine if they have solved the mystery.

SCENARIO TRUTH:
${solutionData}

PLAYER'S ACCUSATION:
"${playerInput}"

INSTRUCTIONS:
1. Compare the Player's Accusation to the Truth.
2. The Player MUST identify ALL THREE: Killer, Motive, and Method.
3. If ANY of these are missing or significantly incorrect, penalize the score heavily.
4. Be FAIR but STRICT.
   - Victory requires understanding *why* and *how*. Random guesses should be rejected with a low score.
   - Vague accusations ("He did it") should get a low score.
   - However, allow for natural language variations. They don't need to match the phrasing exactly, just the facts.
5. Assign a SCORE from 0 to 100 based on accuracy.
   - 100: Perfect match (Killer, Motive, Method all precise).
   - 60-99: Core truth is correct, but minor details (like specific poison name vs generic 'poison') are less precise but acceptable.
   - < 60: Significant missing facts, wrong conclusions, or too vague.

CRITICAL INSTRUCTION FOR DEFEAT (Score < 60):
- You must NOT reveal which parts were right or wrong.
- You must NOT say things like "You found a piece of the puzzle" or "You are close".
- Simply state that the case is not proven, evidence is lacking, or the conclusion is incorrect.
- Absolute silence on the specifics is required to preserve the mystery.

RESPONSE FORMAT (JSON):
{
    "score": number (0-100),
    "explanation": "A short message explaining the verdict. Address the player directly. If score < 80: Be vague but final. Do not give hints."
}
`;

        try {
            const result = await this.callGemini(prompt);
            console.log(`[Director] Verdict: ${JSON.stringify(result)}`);

            if (result && typeof result.score === 'number') {
                if (result.score >= 60) {
                    this.game.state = 'VICTORY';
                    this.game.printImmediate('<br>-----------------------<br>');
                    this.game.printImmediate('*** CASE SOLVED ***', 'victory-text');
                    this.game.printImmediate(result.explanation, 'victory-text');
                    this.game.printImmediate('<br>');
                    this.game.printImmediate(this.game.outroText || "Congratulations, Inspector. Justice has been served.", 'victory-text');
                    this.game.printImmediate(`Solution Score: ${result.score}/100`, 'bold-msg');
                    this.game.printImmediate(`Total Turns: ${this.game.turnCount}`, 'system-msg');
                    this.game.printImmediate('<br>Press ENTER to return to title...');
                } else {
                    this.game.state = 'DEFEAT';
                    this.game.printImmediate('<br>-----------------------<br>');
                    this.game.printImmediate('*** INCORRECT CONCLUSION ***', 'defeat-text');
                    this.game.printImmediate(`"I'm afraid that is incorrect, Inspector."`, 'defeat-text');
                    this.game.printImmediate(result.explanation, 'defeat-text');
                    this.game.printImmediate('<br>');
                    this.game.printImmediate("Your reputation is in tatters. You leave the manor in disgrace.", 'defeat-text');
                    this.game.printImmediate(`Solution Score: ${result.score}/100`, 'bold-msg');
                    this.game.printImmediate(`Total Turns: ${this.game.turnCount}`, 'system-msg');
                    this.game.printImmediate('<br>Press ENTER to return to title...');
                }
            }
        } catch (error) {
            console.error('[Director] Error evaluating solution:', error);
            this.game.printImmediate("The Director is confused. Please try again.", 'error-msg');
        }

        this.game.toggleLoading(false);
        this.isThinking = false;
    }
}
