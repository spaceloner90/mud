class InputHandler {
    constructor(game) {
        this.game = game;
    }

    handle(command) {
        console.log(`[Input] State: ${this.game.state}, Command: ${command}`);

        if (this.game.state === 'VICTORY') {
            window.location.reload();
            return;
        }

        if (!command) return;

        // Don't echo the full key if in AUTH mode to keep log clean
        if (this.game.state === 'AUTH') {
            this.game.printImmediate(`> [HIDDEN KEY]`, 'input-echo');
            this.game.validateKey(command);
            return;
        }

        this.game.printImmediate(`> ${command}`, 'input-echo');

        if (this.game.state === 'MENU') {
            if (command.toLowerCase() === 'x') {
                localStorage.removeItem('gemini_api_key');
                this.game.printImmediate('Data cleared. Resetting...', 'system-msg');
                setTimeout(() => window.location.reload(), 1000);
                return;
            }

            const selection = parseInt(command);
            if (scenarios[selection]) {
                this.game.launchScenario(selection);
            } else {
                this.game.printImmediate('Invalid option. Please type the number of the scenario.', 'error-msg');
            }
            return;
        }

        if (this.game.state === 'PLAYING') {
            this.handleGameDetails(command);
        }
    }

    handleGameDetails(command) {
        const parts = command.toLowerCase().split(' ');
        const verb = parts[0];

        // Helper to check for command matching
        const isCmd = (v, ...options) => options.includes(v);

        if (isCmd(verb, 'help')) {
            const topic = parts[1];
            if (topic) {
                switch (topic) {
                    case 'give':
                        this.game.printImmediate('Syntax: give [item] [character]', 'system-msg');
                        this.game.printImmediate('Transfer an item from your inventory to another character.', 'system-msg');
                        break;
                    case 'look':
                    case 'l':
                        this.game.printImmediate('Syntax: look [target]', 'system-msg');
                        this.game.printImmediate('Describes the current room, or a specific character/item.', 'system-msg');
                        break;
                    case 'say':
                        this.game.printImmediate('Syntax: say [message]', 'system-msg');
                        this.game.printImmediate('Speak to other characters in the room.', 'system-msg');
                        break;
                    case 'inventory':
                    case 'inv':
                        this.game.printImmediate('Syntax: inventory', 'system-msg');
                        this.game.printImmediate('Lists items you are currently holding.', 'system-msg');
                        break;
                    case 'move':
                    case 'n': case 's': case 'e': case 'w':
                        this.game.printImmediate('Syntax: n, s, e, w', 'system-msg');
                        this.game.printImmediate('Move in the specified compass direction.', 'system-msg');
                        break;
                    default:
                        this.game.printImmediate(`No help available for "${topic}".`, 'error-msg');
                }
            } else {
                this.game.printImmediate('COMMANDS: help, look (l), inventory (inv), give, say, n, s, e, w', 'system-msg');
                this.game.printImmediate('Type "help [command]" for more info.', 'system-msg');
            }
            return;
        }

        if (isCmd(verb, 'l', 'look')) {
            this.game.look(parts.slice(1).join(' '));
            return;
        }

        if (isCmd(verb, 'say')) {
            const speech = parts.slice(1).join(' ');
            if (speech) {
                this.game.printDialogue('You', speech);
                // Broadcast speech event with audience context
                const othersInRoom = this.game.getCharactersInRoom(this.game.currentRoom.id).map(c => c.name).join(', ');
                const audience = othersInRoom ? ` to ${othersInRoom}` : ' to no one';
                this.game.broadcastEvent(new GameEvent('say', `Player said"${speech}"${audience}`, 'player'));
            } else {
                this.game.printImmediate('What do you want to say?', 'error-msg');
            }
            return;
        }

        if (isCmd(verb, 'n', 'north')) { this.game.move('north'); return; }
        if (isCmd(verb, 's', 'south')) { this.game.move('south'); return; }
        if (isCmd(verb, 'e', 'east')) { this.game.move('east'); return; }
        if (isCmd(verb, 'w', 'west')) { this.game.move('west'); return; }

        if (isCmd(verb, 'debug')) {
            const targetName = parts.slice(1).join(' ').toLowerCase();
            if (!targetName) {
                this.game.printImmediate('Usage: debug <character_name>', 'error-msg');
                return;
            }
            if (targetName === 'director') {
                this.game.printImmediate('--- DEBUG: Director (Global History) ---', 'system-msg');
                if (this.game.coordinator && this.game.coordinator.history) {
                    this.game.printImmediate(`History (${this.game.coordinator.history.length} events):`);
                    this.game.coordinator.history.forEach((h, i) => {
                        this.game.printImmediate(`[${i}] ${new Date(h.timestamp).toLocaleTimeString()} [${h.sourceId}]: ${h.description}`, 'debug-log');
                    });
                } else {
                    this.game.printImmediate('Coordinator not initialized or no history.', 'error-msg');
                }
                this.game.printImmediate('--- END DEBUG ---', 'system-msg');
                return;
            }

            const debugChar = Object.values(this.game.characters).find(c => c.name.toLowerCase().includes(targetName));
            if (debugChar) {
                this.game.printImmediate(`--- DEBUG: ${debugChar.name} (ID: ${debugChar.id}) ---`, 'system-msg');
                this.game.printImmediate(`Color: <span style="color:${debugChar.color}">${debugChar.color}</span>`);
                this.game.printImmediate(`Room: ${debugChar.currentRoomId}`);
                this.game.printImmediate(`Description: ${debugChar.description}`);
                this.game.printImmediate(`Memory (${debugChar.memory.length} events):`);
                debugChar.memory.forEach((m, i) => {
                    this.game.printImmediate(`[${i}] ${new Date(m.timestamp).toLocaleTimeString()} - ${m.description}`, 'debug-log');
                });
                this.game.printImmediate('--- END DEBUG ---', 'system-msg');
            } else {
                this.game.printImmediate(`Character not found: "${targetName}"`, 'error-msg');
            }
            return;
        }

        if (isCmd(verb, 'give')) {
            if (parts.length < 3) {
                this.game.printImmediate('Usage: give [item] [character]', 'error-msg');
                return;
            }

            // Complex parsing: "give [item] [character]"
            const playerItems = this.game.getItemsByHolder('player');
            const roomChars = this.game.getCharactersInRoom(this.game.currentRoom.id);

            let itemToGive = null;
            let recipient = null;
            let bestMatchItem = null;

            const eventWords = parts.slice(1);
            for (let i = 1; i < eventWords.length; i++) {
                const itemCheck = eventWords.slice(0, i).join(' ').toLowerCase();
                const charCheck = eventWords.slice(i).join(' ').toLowerCase();

                const foundItem = playerItems.find(it => it.name.toLowerCase().includes(itemCheck));

                if (foundItem) {
                    bestMatchItem = foundItem;
                    const foundChar = roomChars.find(c => c.name.toLowerCase().includes(charCheck));

                    if (foundChar) {
                        itemToGive = foundItem;
                        recipient = foundChar;
                        break;
                    }
                }
            }

            if (itemToGive && recipient) {
                itemToGive.holderId = recipient.id;
                this.game.printImmediate(`You gave the ${itemToGive.name} to ${recipient.name}.`, 'system-msg');
                this.game.broadcastEvent(new GameEvent('action', `Player gave ${itemToGive.name} to ${recipient.name}.`, 'player'));
            } else if (bestMatchItem) {
                this.game.printImmediate("You don't see them here.", 'error-msg');
            } else {
                this.game.printImmediate("You don't have that item.", 'error-msg');
            }
            return;
        }

        if (isCmd(verb, 'inv', 'inventory')) {
            const myItems = this.game.getItemsByHolder('player');
            if (myItems.length === 0) {
                this.game.printImmediate("You are not carrying anything.", 'system-msg');
            } else {
                this.game.printImmediate("You are carrying:", 'system-msg');
                myItems.forEach(item => {
                    this.game.printImmediate(`- ${item.name}`, 'item-name');
                });
            }
            return;
        }

        this.game.printImmediate(`Unknown command: "${verb}". Type "help" for a list of commands.`, 'error-msg');
    }
}
