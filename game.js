class Game {
    constructor() {
        this.output = document.getElementById('output');
        this.input = document.getElementById('cmd');
        this.isProcessing = false;
        this.state = 'AUTH'; // Start in AUTH mode

        this.inputHandler = new InputHandler(this); // Initialize InputHandler

        this.setupInput();
        this.startAuth();
    }

    setupInput() {
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = this.input.value.trim();
                this.input.value = '';
                this.inputHandler.handle(command); // Delegate to InputHandler
            }
        });

        // Keep focus
        document.addEventListener('click', () => {
            if (!this.isProcessing) this.input.focus();
        });
    }

    async startAuth() {
        await this.print('INITIALIZING SYSTEM...', 'system-msg', 20);

        // Check LocalStorage for cached key
        const cachedKey = localStorage.getItem('gemini_api_key');
        if (cachedKey) {
            this.printImmediate('Found cached session key. Authenticating...', 'dim');
            this.validateKey(cachedKey);
            return;
        }

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
            localStorage.setItem('gemini_api_key', key); // Save for next time
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
        // Note: Coordinator is initialized by scenario.setup()

        // Initialize AI Agents for the loaded characters
        this.state = 'MENU';
    }

    initAgents() {
        if (this.characters) {
            Object.values(this.characters).forEach(char => {
                const agent = new AIAgent(char, this);
                char.aiAgent = agent;
            });
        }
    }

    getCharactersInRoom(roomId) {
        return Object.values(this.characters || {}).filter(c => c.currentRoomId === roomId);
    }

    getItemsByHolder(holderId) {
        return (this.itemsData || []).filter(item => item.holderId === holderId);
    }

    showMenu() {
        this.printImmediate('MUD ENGINE v1.0', 'system-msg');
        this.printImmediate('Select a Scenario:', 'system-msg');
        Object.values(scenarios).forEach(s => {
            this.printImmediate(`[${s.id}] ${s.title} - ${s.description}`, 'menu-item');
        });
        this.printImmediate('[X] Clear Cached Data & Reset', 'menu-item'); // Add Reset Option
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
        const character = Object.values(this.characters || {}).find(c => c.name === speaker);
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

    look(target = '') {
        if (!this.currentRoom) return;

        // If looking at a specific target
        if (target) {
            const lowerTarget = target.toLowerCase();

            // 1. Check Characters in Room
            const roomChars = this.getCharactersInRoom(this.currentRoom.id);
            const foundChar = roomChars.find(c => c.name.toLowerCase().includes(lowerTarget));
            if (foundChar) {
                this.printImmediate(`<span style="color:${foundChar.color}">${foundChar.name}</span>`, 'char-name');
                this.printImmediate(foundChar.description);

                // Show items held by character
                const charItems = this.getItemsByHolder(foundChar.id).filter(i => !i.isHidden);
                if (charItems.length > 0) {
                    const itemNames = charItems.map(i => `<span class="item-name">${i.name}</span>`).join(', ');
                    this.printImmediate(`Holding: ${itemNames}`, 'room-items');
                }
                return;
            }

            // 2. Check Items in Room
            const roomItems = this.getItemsByHolder(this.currentRoom.id).filter(i => !i.isHidden);
            const foundRoomItem = roomItems.find(i => i.name.toLowerCase().includes(lowerTarget));
            if (foundRoomItem) {
                this.printImmediate(foundRoomItem.name, 'item-name');
                this.printImmediate(foundRoomItem.description);
                return;
            }

            // 3. Check Items in Player Inventory
            const playerItems = this.getItemsByHolder('player');
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
        const chars = this.getCharactersInRoom(this.currentRoom.id);
        if (chars.length > 0) {
            const charNames = chars.map(c => `<span style="color:${c.color}">${c.name}</span>`).join(', ');
            this.printImmediate(`Also here: ${charNames}`, 'room-chars');
        }

        // List Items
        const visibleItems = this.getItemsByHolder(this.currentRoom.id).filter(i => !i.isHidden);
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
            const nextRoomName = this.world[nextRoomId].name;

            // Broadcast leave event to current room
            this.broadcastEvent(new GameEvent('leave', `Player moved from ${prevRoomName} to ${nextRoomName}.`, 'player'));

            this.currentRoom = this.world[nextRoomId];

            // Broadcast enter event to new room
            this.broadcastEvent(new GameEvent('enter', `Player arrived from ${prevRoomName}.`, 'player'));

            this.look();
        } else {
            this.printImmediate("You can't go that way.", 'error-msg');
        }
    }

    broadcastEvent(event) {
        // Find all characters in the current room
        const chars = this.getCharactersInRoom(this.currentRoom.id);
        chars.forEach(c => c.observe(event));

        // Notify Global Coordinator
        if (this.coordinator) {
            this.coordinator.onEvent(event);
        }
    }

    npcSay(characterId, text) {
        if (!this.currentRoom) return;

        const character = this.characters[characterId];
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
        const npc = this.characters[characterId];
        if (!npc) return;

        // Verify NPC has item
        const npcItems = this.getItemsByHolder(characterId);
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
            const roomChars = this.getCharactersInRoom(npc.currentRoomId);
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
        const room = this.world[roomId];
        if (room && room.hiddenExits && room.hiddenExits[direction]) {
            room.exits[direction] = room.hiddenExits[direction];
            delete room.hiddenExits[direction];
            this.printImmediate(`[DISCOVERY] A new path to the [${direction.toUpperCase()}] has been revealed!`, 'discovery-msg');
            // Re-render if in that room
            if (this.currentRoom.id === roomId) this.look();
        }
    }

    revealItem(itemId) {
        const item = this.itemsData.find(i => i.id === itemId);
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
