const scenarios = {
    1: {
        id: 1,
        title: "The Missing Signet Ring",
        description: "A mystery in the village of Oakhaven.",
        introText: "You are a Royal Courier sent from the Capital to track down Lady Elara, who is suspected of ensuring the disappearance of the Royal Signet Ring.<br>Your pursuit has led you to the sleepy village of Oakhaven, where her trail has gone cold.<br>Find her, and retrieve the Ring at all costs.",
        setup: (game) => {
            game.currentRoom = world['square'];
            game.look();
            // Initial Greeting
            setTimeout(() => {
                const crier = getCharactersInRoom('square').find(c => c.id === 'crier');
                if (crier) {
                    game.printDialogue(crier.name, "Welcome to our humble village, traveller. Beware the spirits!");
                }
            }, 1000);
        }
    }
};

class Game {
    constructor() {
        this.output = document.getElementById('output');
        this.input = document.getElementById('cmd');
        this.isProcessing = false;
        this.state = 'AUTH'; // Start in AUTH mode

        this.setupInput();
        this.startAuth();
    }

    setupInput() {
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = this.input.value.trim();
                this.input.value = '';
                this.handleInput(command);
            }
        });

        // Keep focus
        document.addEventListener('click', () => {
            if (!this.isProcessing) this.input.focus();
        });
    }

    async startAuth() {
        await this.print('INITIALIZING SYSTEM...', 'system-msg', 20);
        this.printImmediate('Authentication Required.', 'error-msg');
        this.printImmediate('Please enter your Google Gemini API Key:', 'system-msg');
        this.input.focus();
    }

    async validateKey(key) {
        console.log('Validating key:', key);
        this.toggleLoading(true);
        this.printImmediate('Validating Key...', 'system-msg');

        try {
            // Test request
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "ping" }] }]
                })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`API Error: ${text}`);
            }

            window.API_KEY = key;
            this.printImmediate('Access Granted.', 'discovery-msg');
            await new Promise(r => setTimeout(r, 500));
            this.start();

        } catch (e) {
            console.error('Validation failed:', e);
            this.printImmediate(`Authentication Failed: ${e.message}`, 'error-msg');
            this.printImmediate('Please enter your Google Gemini API Key:', 'system-msg');
        } finally {
            this.toggleLoading(false);
            this.input.focus();
        }
    }

    async print(text, className = '', delay = 20) {
        const p = document.createElement('div');
        if (className) p.classList.add(className);
        this.output.appendChild(p);

        // Typewriter effect
        for (let i = 0; i < text.length; i++) {
            p.textContent += text[i];
            this.output.scrollTop = this.output.scrollHeight;
            if (delay > 0) await new Promise(r => setTimeout(r, delay));
        }
    }

    printImmediate(text, className = '') {
        const p = document.createElement('div');
        if (className) p.classList.add(className);
        p.innerHTML = text; // Changed to innerHTML to support colored ASCII
        this.output.appendChild(p);
        this.output.scrollTop = this.output.scrollHeight;
    }

    async start() {
        this.output.innerHTML = ''; // Clear auth text
        this.printImmediate('Connection Established.');
        this.printImmediate('-----------------------');
        this.showMenu();

        // Initialize AI components now that we have the key
        const coordinator = new AICoordinator(this);
        this.coordinator = coordinator;

        // Initialize AI Agents
        Object.values(characters).forEach(char => {
            const agent = new AIAgent(char, this);
            char.aiAgent = agent;
        });

        this.state = 'MENU';
    }

    showMenu() {
        this.printImmediate('MUD ENGINE v1.0', 'system-msg');
        this.printImmediate('Select a Scenario:', 'system-msg');
        Object.values(scenarios).forEach(s => {
            this.printImmediate(`[${s.id}] ${s.title} - ${s.description}`, 'menu-item');
        });
    }

    launchScenario(id) {
        const scenario = scenarios[id];
        if (!scenario) {
            this.printImmediate('Invalid Scenario ID.', 'error-msg');
            return;
        }

        this.output.innerHTML = ''; // Clear screen
        this.state = 'PLAYING';

        this.printImmediate(scenario.introText, 'intro-text');
        this.printImmediate('<br>-----------------------<br>');
        this.printImmediate('Type "help" for commands.');

        scenario.setup(this);
    }

    printDialogue(speaker, text) {
        const p = document.createElement('div');
        p.classList.add('dialogue');

        // Check if speaker corresponds to a known character to get their color
        // This is a bit inefficient (searching on every speak) but fine for this scale
        const character = Object.values(characters).find(c => c.name === speaker);
        const colorStyle = character ? `style="color: ${character.color}"` : '';

        p.innerHTML = `<span class="speaker" ${colorStyle}>${speaker}:</span> "${text}"`;
        this.output.appendChild(p);
        this.output.scrollTop = this.output.scrollHeight;
    }

    async victory() {
        this.state = 'VICTORY'; // Special state waiting for input

        await this.print('MISSION ACCOMPLISHED', 'system-msg', 50);
        await new Promise(r => setTimeout(r, 500));

        this.printImmediate('<br>-----------------------<br>');
        this.printImmediate('You have retrieved the Signet Ring.', 'victory-text');
        this.printImmediate('The Kingdom is safe once more.', 'victory-text');
        this.printImmediate('<br>');
        this.printImmediate('Press ENTER to return to Main Menu...', 'system-msg');
    }

    handleInput(command) {
        console.log(`[Input] State: ${this.state}, Command: ${command}`);

        if (this.state === 'VICTORY') {
            window.location.reload();
            return;
        }

        if (!command) return;

        // Don't echo the full key if in AUTH mode to keep log clean
        if (this.state === 'AUTH') {
            this.printImmediate(`> [HIDDEN KEY]`, 'input-echo');
            this.validateKey(command);
            return;
        }

        this.printImmediate(`> ${command}`, 'input-echo');

        if (this.state === 'MENU') {
            const selection = parseInt(command);
            if (scenarios[selection]) {
                this.launchScenario(selection);
            } else {
                this.printImmediate('Invalid option. Please type the number of the scenario.', 'error-msg');
            }
            return;
        }

        if (this.state === 'PLAYING') {
            this.handleGameInput(command);
        }
    }

    handleGameInput(command) {
        const parts = command.toLowerCase().split(' ');
        const verb = parts[0];
        const noun = parts[1]; // optional

        switch (verb) {
            case 'help':
                const topic = parts[1];
                if (topic) {
                    switch (topic) {
                        case 'give':
                            this.printImmediate('Syntax: give [item] [character]', 'system-msg');
                            this.printImmediate('Transfer an item from your inventory to another character.', 'system-msg');
                            break;
                        case 'look':
                        case 'l':
                            this.printImmediate('Syntax: look [target]', 'system-msg');
                            this.printImmediate('Describes the current room, or a specific character/item.', 'system-msg');
                            break;
                        case 'say':
                            this.printImmediate('Syntax: say [message]', 'system-msg');
                            this.printImmediate('Speak to other characters in the room.', 'system-msg');
                            break;
                        case 'inventory':
                        case 'inv':
                            this.printImmediate('Syntax: inventory', 'system-msg');
                            this.printImmediate('Lists items you are currently holding.', 'system-msg');
                            break;
                        case 'move':
                        case 'n': case 's': case 'e': case 'w':
                            this.printImmediate('Syntax: n, s, e, w', 'system-msg');
                            this.printImmediate('Move in the specified compass direction.', 'system-msg');
                            break;
                        default:
                            this.printImmediate(`No help available for "${topic}".`, 'error-msg');
                    }
                } else {
                    this.printImmediate('COMMANDS: help, look (l), inventory (inv), give, say, n, s, e, w', 'system-msg');
                    this.printImmediate('Type "help [command]" for more info.', 'system-msg');
                }
                break;
            case 'l':
            case 'look':
                this.look(parts.slice(1).join(' ')); // Pass all remaining parts as arguments
                break;
            case 'say':
                const speech = parts.slice(1).join(' ');
                if (speech) {
                    this.printDialogue('You', speech);
                    // Broadcast speech event with audience context
                    const othersInRoom = getCharactersInRoom(this.currentRoom.id).map(c => c.name).join(', ');
                    const audience = othersInRoom ? ` to ${othersInRoom}` : ' to no one';
                    this.broadcastEvent(new GameEvent('say', `Player said"${speech}"${audience}`, 'player'));
                } else {
                    this.printImmediate('What do you want to say?', 'error-msg');
                }
                break;
            case 'n':
            case 'north':
                this.move('north');
                break;
            case 's':
            case 'south':
                this.move('south');
                break;
            case 'e':
            case 'east':
                this.move('east');
                break;
            case 'w':
            case 'west':
                this.move('west');
                break;
            case 'debug':
                const targetName = parts.slice(1).join(' ').toLowerCase();
                if (!targetName) {
                    this.printImmediate('Usage: debug <character_name>', 'error-msg');
                    break;
                }
                if (targetName === 'director') {
                    this.printImmediate('--- DEBUG: Director (Global History) ---', 'system-msg');
                    if (this.coordinator && this.coordinator.history) {
                        this.printImmediate(`History (${this.coordinator.history.length} events):`);
                        this.coordinator.history.forEach((h, i) => {
                            this.printImmediate(`[${i}] ${new Date(h.timestamp).toLocaleTimeString()} [${h.sourceId}]: ${h.description}`, 'debug-log');
                        });
                    } else {
                        this.printImmediate('Coordinator not initialized or no history.', 'error-msg');
                    }
                    this.printImmediate('--- END DEBUG ---', 'system-msg');
                    break;
                }

                const debugChar = Object.values(characters).find(c => c.name.toLowerCase().includes(targetName));
                if (debugChar) {
                    this.printImmediate(`--- DEBUG: ${debugChar.name} (ID: ${debugChar.id}) ---`, 'system-msg');
                    this.printImmediate(`Color: <span style="color:${debugChar.color}">${debugChar.color}</span>`);
                    this.printImmediate(`Room: ${debugChar.currentRoomId}`);
                    this.printImmediate(`Description: ${debugChar.description}`);
                    this.printImmediate(`Memory (${debugChar.memory.length} events):`);
                    debugChar.memory.forEach((m, i) => {
                        this.printImmediate(`[${i}] ${new Date(m.timestamp).toLocaleTimeString()} - ${m.description}`, 'debug-log');
                    });
                    this.printImmediate('--- END DEBUG ---', 'system-msg');
                } else {
                    this.printImmediate(`Character not found: "${targetName}"`, 'error-msg');
                }
                break;
            case 'give':
                if (parts.length < 3) {
                    this.printImmediate('Usage: give [item] [character]', 'error-msg');
                    break;
                }

                // Complex parsing: "give [item] [character]"
                // We need to find a split point where the left part is an item in inventory
                // and the right part is a character in the room.
                let itemToGive = null;
                let recipient = null;

                const playerItems = getItemsByHolder('player');
                const roomChars = getCharactersInRoom(this.currentRoom.id);

                // Try all split points
                const eventWords = parts.slice(1);
                // Ensure we leave at least one word for the character
                for (let i = 1; i < eventWords.length; i++) {
                    const itemCheck = eventWords.slice(0, i).join(' ').toLowerCase();
                    const charCheck = eventWords.slice(i).join(' ').toLowerCase();

                    // Check if player has this item
                    const foundItem = playerItems.find(it => it.name.toLowerCase().includes(itemCheck));
                    // Check if char is in room
                    const foundChar = roomChars.find(c => c.name.toLowerCase().includes(charCheck));

                    if (foundItem && foundChar) {
                        itemToGive = foundItem;
                        recipient = foundChar;
                        break; // Found a valid match
                    }
                }

                if (!itemToGive) {
                    this.printImmediate("You don't have that item.", 'error-msg');
                } else if (!recipient) {
                    this.printImmediate("You don't see them here.", 'error-msg');
                } else {
                    // Execute Give
                    itemToGive.holderId = recipient.id;
                    this.printImmediate(`You gave the ${itemToGive.name} to ${recipient.name}.`, 'system-msg');

                    // Specific event type for finer control if needed,
                    // but 'action' ensures the coordinator picks it up.
                    this.broadcastEvent(new GameEvent('action', `Player gave ${itemToGive.name} to ${recipient.name}.`, 'player'));
                }
                break;
            case 'inv':
            case 'inventory':
                const myItems = getItemsByHolder('player');
                if (myItems.length === 0) {
                    this.printImmediate("You are not carrying anything.", 'system-msg');
                } else {
                    this.printImmediate("You are carrying:", 'system-msg');
                    myItems.forEach(item => {
                        this.printImmediate(`- ${item.name}`, 'item-name');
                    });
                }
                break;
            default:
                this.printImmediate(`Unknown command: "${verb}". Type "help" for a list of commands.`, 'error-msg');
        }
    }

    look(target = '') {
        if (!this.currentRoom) return;

        // If looking at a specific target
        if (target) {
            const lowerTarget = target.toLowerCase();

            // 1. Check Characters in Room
            const roomChars = getCharactersInRoom(this.currentRoom.id);
            const foundChar = roomChars.find(c => c.name.toLowerCase().includes(lowerTarget));
            if (foundChar) {
                this.printImmediate(`<span style="color:${foundChar.color}">${foundChar.name}</span>`, 'char-name');
                this.printImmediate(foundChar.description);

                // Show items held by character
                const charItems = getItemsByHolder(foundChar.id);
                if (charItems.length > 0) {
                    const itemNames = charItems.map(i => `<span class="item-name">${i.name}</span>`).join(', ');
                    this.printImmediate(`Holding: ${itemNames}`, 'room-items');
                }
                return;
            }

            // 2. Check Items in Room
            const roomItems = getItemsByHolder(this.currentRoom.id).filter(i => !i.isHidden);
            const foundRoomItem = roomItems.find(i => i.name.toLowerCase().includes(lowerTarget));
            if (foundRoomItem) {
                this.printImmediate(foundRoomItem.name, 'item-name');
                this.printImmediate(foundRoomItem.description);
                return;
            }

            // 3. Check Items in Player Inventory
            const playerItems = getItemsByHolder('player');
            const foundPlayerItem = playerItems.find(i => i.name.toLowerCase().includes(lowerTarget));
            if (foundPlayerItem) {
                this.printImmediate(foundPlayerItem.name, 'item-name');
                this.printImmediate(foundPlayerItem.description);
                return;
            }

            this.printImmediate("You don't see that here.", 'error-msg');
            return;
        }

        // Standard Room Look
        this.printImmediate(this.currentRoom.name, 'room-title');
        this.printImmediate(this.currentRoom.description);

        // List Characters
        const chars = getCharactersInRoom(this.currentRoom.id);
        if (chars.length > 0) {
            const charNames = chars.map(c => `<span style="color:${c.color}">${c.name}</span>`).join(', ');
            this.printImmediate(`Also here: ${charNames}`, 'room-chars');
        }

        // List Items
        const visibleItems = getItemsByHolder(this.currentRoom.id).filter(i => !i.isHidden);
        if (visibleItems.length > 0) {
            const itemNames = visibleItems.map(i => `<span class="item-name">${i.name}</span>`).join(', ');
            this.printImmediate(`Visible items: ${itemNames}`, 'room-items');
        }

        const exits = Object.keys(this.currentRoom.exits).join(', ').toUpperCase();
        this.printImmediate(`Exits: [${exits}]`, 'room-exits');
    }

    move(direction) {
        if (this.currentRoom.exits[direction]) {
            const nextRoomId = this.currentRoom.exits[direction];

            const prevRoomName = this.currentRoom.name;
            const nextRoomName = world[nextRoomId].name;

            // Broadcast leave event to current room
            this.broadcastEvent(new GameEvent('leave', `Player moved from ${prevRoomName} to ${nextRoomName}.`, 'player'));

            this.currentRoom = world[nextRoomId];

            // Broadcast enter event to new room
            this.broadcastEvent(new GameEvent('enter', `Player arrived from ${prevRoomName}.`, 'player'));

            this.look();
        } else {
            this.printImmediate("You can't go that way.", 'error-msg');
        }
    }

    broadcastEvent(event) {
        // Find all characters in the current room
        const chars = getCharactersInRoom(this.currentRoom.id);
        chars.forEach(c => c.observe(event));

        // Notify Global Coordinator
        if (this.coordinator) {
            this.coordinator.onEvent(event);
        }
    }

    npcSay(characterId, text) {
        if (!this.currentRoom) return;

        const character = characters[characterId];
        // Only show if the character is in the same room as the player
        if (character && character.currentRoomId === this.currentRoom.id) {
            this.printDialogue(character.name, text);
        }

        // Broadcast that they spoke (so other NPCs hear it too!)
        if (character) {
            this.broadcastEvent(new GameEvent('say', `${character.name} said: "${text}"`, characterId));
        }
    }

    npcGive(characterId, itemName, targetName) {
        const npc = characters[characterId];
        if (!npc) return;

        // Verify NPC has item
        const npcItems = getItemsByHolder(characterId);
        const item = npcItems.find(i => i.name.toLowerCase().includes(itemName.toLowerCase()));

        if (!item) {
            console.warn(`[NPC ${npc.name}] Tried to give '${itemName}' but doesn't have it.`);
            return;
        }

        // Verify Recipient
        let recipient = null;
        if (targetName.toLowerCase() === 'player' || targetName.toLowerCase() === 'me' || targetName.toLowerCase().includes('player')) {
            // Check if player is in same room
            if (this.currentRoom.id === npc.currentRoomId) {
                recipient = { id: 'player', name: 'You' };
            }
        } else {
            const roomChars = getCharactersInRoom(npc.currentRoomId);
            recipient = roomChars.find(c => c.name.toLowerCase().includes(targetName.toLowerCase()));
        }

        if (!recipient) {
            console.warn(`[NPC ${npc.name}] Tried to give to '${targetName}' but they are not here.`);
            return;
        }

        // Execute
        item.holderId = recipient.id;

        // Output if visible
        if (this.currentRoom.id === npc.currentRoomId) {
            this.printImmediate(`${npc.name} gives ${item.name} to ${recipient.name}.`, 'system-msg');
        }

        // Broadcast
        this.broadcastEvent(new GameEvent('action', `${npc.name} gave ${item.name} to ${recipient.name}.`, characterId));
    }

    toggleLoading(show) {
        const el = document.getElementById('loading-indicator');
        if (el) {
            if (show) el.classList.remove('hidden');
            else el.classList.add('hidden');
        }
    }

    revealExit(roomId, direction) {
        const room = world[roomId];
        if (room && room.hiddenExits && room.hiddenExits[direction]) {
            room.exits[direction] = room.hiddenExits[direction];
            delete room.hiddenExits[direction];
            this.printImmediate(`[DISCOVERY] A new path to the [${direction.toUpperCase()}] has been revealed!`, 'discovery-msg');
            // Re-render if in that room
            if (this.currentRoom.id === roomId) this.look();
        }
    }

    revealItem(itemId) {
        const item = itemsData.find(i => i.id === itemId);
        if (item && item.isHidden) {
            item.isHidden = false;
            this.printImmediate(`[DISCOVERY] You noticed something new: ${item.name}!`, 'discovery-msg');
            // Re-render if in presence (complicated check, just assume director calls it appropriately)
        }
    }
}

window.onload = () => {
    const game = new Game();
};
