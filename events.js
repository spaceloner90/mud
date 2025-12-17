class GameEvent {
    constructor(type, description, sourceId) {
        this.type = type; // 'say', 'enter', 'leave', 'action'
        this.description = description;
        this.sourceId = sourceId;
        this.timestamp = Date.now();
    }
}
