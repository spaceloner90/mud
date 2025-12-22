class GameEvent {
    constructor(type, description, sourceId, targetId = null, options = {}) {
        this.type = type; // 'say', 'enter', 'leave', 'action'
        this.description = description;
        this.sourceId = sourceId;
        this.targetId = targetId; // Specific addressee (optional)
        this.timestamp = Date.now();
        this.skipReaction = options.skipReaction || false;
    }
}

class Room {
    constructor(id, name, description, exits = {}, hiddenExits = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.exits = exits; // map of direction -> roomId
        this.hiddenExits = hiddenExits; // Exits revealed by Director
    }
}

class Character {
    constructor(id, name, description, currentRoomId, color, secret = '') {
        this.id = id;
        this.name = name;
        this.description = description;
        this.currentRoomId = currentRoomId;
        this.color = color || '#FFFFFF'; // Default to white if missing
        this.secret = secret; // Hidden from player, known to AI
        this.knowledge = []; // List of lore keys this character knows
        this.memory = []; // Short-term memory of events
    }

    observe(event) {
        // Suppress "leave" events for the mover themselves to avoid double-logging state changes covering the same move.
        // They will rely on the subsequent "enter" event which now contains full context.
        if (event.type === 'leave' && event.sourceId === this.id) {
            return;
        }

        this.memory.push(event);
        // Keep memory size manageable (e.g., last 50 events)
        if (this.memory.length > 50) {
            this.memory.shift();
        }
        // console.log(`%c[NPC ${this.name}] Observed:`, `color: ${this.color}; font-weight: bold;`, event.description);

        // Notify AI Agent if one is attached
        if (this.aiAgent) {
            this.aiAgent.notify(event);
        }
    }
}

class Item {
    constructor(id, name, description, holderId = null, isHidden = false, isStatic = false, staticMessage = '') {
        this.id = id;
        this.name = name;
        this.description = description;
        this.holderId = holderId; // 'player', 'room_id', or 'character_id'
        this.isHidden = isHidden;
        this.isStatic = isStatic; // e.g. furniture, bodies
        this.staticMessage = staticMessage;
    }
}

class Secret {
    constructor(id, description, resolved = false, onReveal = null) {
        this.id = id;
        this.description = description;
        this.resolved = resolved;
        this.onReveal = onReveal; // { type: 'revealItem'|'revealExit', ... }
    }

    reveal(game) {
        if (this.resolved) return;
        this.resolved = true;

        if (this.onReveal) {
            const effect = this.onReveal;
            if (effect.type === 'revealItem') {
                game.revealItem(effect.itemId);
            } else if (effect.type === 'revealExit') {
                game.revealExit(effect.roomId, effect.dir);
            }
        }
    }
}
