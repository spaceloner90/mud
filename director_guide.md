# AI Director Guide

The **AICoordinator** (Director) is the brain of the game's reactive storytelling. It manages NPC turns, decides who speaks, and unlocks game progress based on conversation context.

## 1. Core Responsibilities
- **Turn Management**: Monitors the event log (`history`). When the player speaks or acts, the Director decides if an NPC should respond.
- **Context Injection**: Updates the AI Prompt with global history, current room state, and relevant secrets.
- **State Control**: Can trigger "reveals" (unlocking exits/items) based on what NPCs say.

## 2. Secrets Registry
Secrets are defined in `coordinator.js` in `this.secrets`. They serve as the "Quest Logic" for the AI.

### Structure
```javascript
'secret_id': {
    id: 'secret_id',
    description: 'Natural language description of the fact (e.g., "The key is under the mat").',
    resolved: false, // Automatically set to true after reveal
    revealFunc: () => { ... } // Function to execute the game state change
}
```

## 3. AI-Driven Reveal System
Unlike traditional MUDs that use hardcoded keyword matching (e.g., `if (text.includes("key")) unlock()`), this system uses the LLM's understanding.

1.  **Prompting**: The Director is given a list of `Active Secrets` (unresolved).
2.  **Instruction**: "If an NPC has explicitly revealed information matching an Active Secret... output its ID."
3.  **Execution**: The Director returns a JSON object with a `reveals` array.
    ```json
    {
      "action": "trigger",
      "actorId": "ghost",
      "reveals": ["grove_path"]
    }
    ```
4.  **Result**: The game executes `revealFunc` for `grove_path`, unlocking the East exit.

## 4. Prompt Logic
The Director prompt is constructed dynamically:
1.  **Role**: "You are a Dungeon Master."
2.  **Context**: History of recent events (Player said X, NPC said Y).
3.  **Secrets**: "Watch for these specific facts being mentioned."
4.  **Decision**:
    - `wait`: Player is addressing someone else or no response needed.
    - `trigger`: Choosing the best NPC to reply.

## 5. Adding New Secrets
To add a new puzzle solution:
1.  Add the secret to `coordinator.js` secrets registry.
2.  Give the corresponding Character (in `characters.js`) the private knowledge in their `secret` field so they *know* it.
3.  The Director will automatically detect when they generally *say* it.
