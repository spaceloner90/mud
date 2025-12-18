class GameEvent {
    constructor(type, description, sourceId) {
        this.type = type; // 'say', 'enter', 'leave', 'action'
        this.description = description;
        this.sourceId = sourceId;
        this.timestamp = Date.now();
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
        this.memory = []; // Short-term memory of events
    }

    observe(event) {
        this.memory.push(event);
        // Keep memory size manageable (e.g., last 50 events)
        if (this.memory.length > 50) {
            this.memory.shift();
        }
        console.log(`%c[NPC ${this.name}] Observed:`, `color: ${this.color}; font-weight: bold;`, event.description);

        // Notify AI Agent if one is attached
        if (this.aiAgent) {
            this.aiAgent.notify(event);
        }
    }
}

class Item {
    constructor(id, name, description, holderId = null, isHidden = false) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.holderId = holderId; // 'player', 'room_id', or 'character_id'
        this.isHidden = isHidden;
    }
}
