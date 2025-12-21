# AI Director Guide

The **AICoordinator** (Director) is the brain of the game's reactive storytelling. It manages NPC turns, decides who speaks, and unlocks game progress based on conversation context.

## 1. Core Responsibilities
- **Turn Management**: Monitors the event log (`history`). When the player speaks or acts, the Director decides if an NPC should respond.
- **Context Injection**: Updates the AI Prompt with global history, current room state, and relevant secrets.
- **State Control**: Can trigger "reveals" (unlocking exits/items) based on what NPCs say.

## 2. Secrets Registry
Secrets are defined in each scenario's `data.json` file. They serve as the "Quest Logic" for the AI.

### Structure (`models.js` & `data.json`)
```javascript
{
    "secret_id": {
        "id": "secret_id",
        "description": "Natural language description (e.g., 'The safe in the study is locked').",
        "resolved": false, // Handled automatically by Secret class
        "onReveal": {
            "type": "revealItem", // or 'revealExit'
            "itemId": "journal"   // or 'roomId' & 'dir'
        }
    }
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
4.  **Result**: The Coordinator calls `secret.reveal(game)`, which acts on the `onReveal` data (e.g. unlocking the East exit).

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
1.  Add the secret to `scenarios/<id>/data.json` under `secrets`.
2.  Define the `onReveal` effect (`revealItem` or `revealExit`).
3.  Give the corresponding Character (in `characters.json`) the private knowledge in their `secret` field so they *know* it.
4.  The Director will automatically detect when they generally *say* it.
