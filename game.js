class Game {
    constructor() {
        this.output = document.getElementById('output');
        this.input = document.getElementById('cmd');
        this.isProcessing = false;
        this.state = 'AUTH'; // Start in AUTH mode

        this.inputHandler = new InputHandler(this); // Initialize InputHandler

        this.commandHistory = [];
        this.historyIndex = -1;

        this.scenarios = scenarios; // Assign global scenarios to instance for access by subsystems

        this.setupInput();
        this.startAuth();
    }

    setupInput() {
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = this.input.value.trim();

                if (command) {
                    this.commandHistory.push(command);
                    this.historyIndex = -1; // Reset index
                    // Limit history size to 50
                    if (this.commandHistory.length > 50) this.commandHistory.shift();
                }

                this.input.value = '';
                this.inputHandler.handle(command); // Delegate to InputHandler
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.commandHistory.length === 0) return;

                if (this.historyIndex === -1) {
                    this.historyIndex = this.commandHistory.length - 1;
                } else {
                    this.historyIndex = Math.max(0, this.historyIndex - 1);
                }
                this.input.value = this.commandHistory[this.historyIndex];
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.commandHistory.length === 0 || this.historyIndex === -1) return;

                this.historyIndex = Math.min(this.commandHistory.length - 1, this.historyIndex + 1);

                // If we go past the end, clear the input (new line)
                if (this.historyIndex === this.commandHistory.length - 1) {
                    this.input.value = this.commandHistory[this.historyIndex];
                } else if (this.historyIndex >= this.commandHistory.length) {
                    // Wait, logic check: if index is length-1, we are at the last command.
                    // If we want to go "back to empty", we need to track that.
                    // Let's reset if we go past end.
                }

                // Actually, standard behavior:
                // Down at bottom = empty.
                if (this.historyIndex < this.commandHistory.length) {
                    this.input.value = this.commandHistory[this.historyIndex];
                }

                // Allow cycling back to empty
                // If we are at the last item and press down, we should go to empty?
                // Revised logic:
                // Index tracks *current history position*. -1 means "new line".
            } else if (e.key === 'c' && e.ctrlKey) {
                e.preventDefault();
                this.input.value = '';
                this.historyIndex = -1;
            }
        });

        // Corrected ArrowDown Logic for cleaner implementation in one go
        // Re-defining listener for clarity in replacement
        this.input.removeEventListener('keydown', () => { }); // Can't remove anon fn, but we are replacing the whole block setup.
        // Actually, I am replacing the whole setupInput method content.

        // Final polished logic for replacement:
    }

    setupInput() {
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = this.input.value.trim();

                if (command) {
                    this.commandHistory.push(command);
                    this.historyIndex = -1;
                    if (this.commandHistory.length > 50) this.commandHistory.shift();
                }

                this.input.value = '';
                this.inputHandler.handle(command);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.commandHistory.length === 0) return;

                if (this.historyIndex === -1) {
                    this.historyIndex = this.commandHistory.length - 1;
                } else if (this.historyIndex > 0) {
                    this.historyIndex--;
                }
                this.input.value = this.commandHistory[this.historyIndex];

            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex === -1) return;

                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    this.input.value = this.commandHistory[this.historyIndex];
                } else {
                    this.historyIndex = -1;
                    this.input.value = '';
                }
            } else if (e.key === 'c' && e.ctrlKey) {
                e.preventDefault();
                this.input.value = '';
                this.historyIndex = -1;
            }
        });

        // Keep focus
        document.addEventListener('click', (e) => {
            // Don't steal focus if clicking inside debug panel
            if (e.target.closest('#debug-panel')) return;
            if (!this.isProcessing) this.input.focus();
        });

        this.setupDebugUI();
    }

    setupDebugUI() {
        const decayInput = document.getElementById('decay-input');
        const depthInput = document.getElementById('depth-input');
        const decayVal = document.getElementById('decay-val');
        const depthVal = document.getElementById('depth-val');

        if (decayInput) {
            decayInput.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                decayVal.textContent = val;
                if (this.coordinator) {
                    this.coordinator.conversationDecay = val;
                    console.log(`[Debug] Set Decay Factor to ${val}`);
                }
            });
        }

        if (depthInput) {
            depthInput.addEventListener('change', (e) => {
                const val = parseInt(e.target.value);
                depthVal.textContent = val;
                if (this.coordinator) {
                    this.coordinator.maxConversationDepth = val;
                    console.log(`[Debug] Set Max Depth to ${val}`);
                }
            });
        }

        const paceInput = document.getElementById('pace-input');
        const paceVal = document.getElementById('pace-val');
        if (paceInput) {
            paceInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                paceVal.textContent = val;
                if (this.coordinator) {
                    this.coordinator.conversationPace = val;
                    console.log(`[Debug] Set Conversation Pace to ${val}ms`);
                }
            });
        }

        // Collapse Toggle
        const debugHeader = document.getElementById('debug-header');
        const debugPanel = document.getElementById('debug-panel');
        const debugToggle = document.getElementById('debug-toggle');

        if (debugHeader && debugPanel) {
            debugHeader.addEventListener('click', () => {
                debugPanel.classList.toggle('minimized');
                if (debugPanel.classList.contains('minimized')) {
                    debugToggle.textContent = '+';
                } else {
                    debugToggle.textContent = '-';
                }
            });
        }
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

    syncDebugSettings() {
        if (!this.coordinator) return;

        const decayInput = document.getElementById('decay-input');
        const depthInput = document.getElementById('depth-input');
        const paceInput = document.getElementById('pace-input');

        if (decayInput) {
            const val = parseFloat(decayInput.value);
            this.coordinator.conversationDecay = val;
        }
        if (depthInput) {
            const val = parseInt(depthInput.value);
            this.coordinator.maxConversationDepth = val;
        }
        if (paceInput) {
            const val = parseInt(paceInput.value);
            this.coordinator.conversationPace = val;
        }
        console.log(`[Game] Synced Debug Settings: Decay=${this.coordinator.conversationDecay}, Depth=${this.coordinator.maxConversationDepth}, Pace=${this.coordinator.conversationPace}`);
    }

    async launchScenario(id) {
        const scenario = scenarios[id];
        if (!scenario) {
            this.printImmediate('Invalid Scenario ID.', 'error-msg');
            return;
        }

        this.output.innerHTML = ''; // Clear screen
        this.state = 'PLAYING';

        await scenario.setup(this);

        // Sync Debug UI values to the new Coordinator
        this.syncDebugSettings();
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

    playerSayTo(targetName, text) {
        if (!this.currentRoom) return false;

        const roomChars = this.getCharactersInRoom(this.currentRoom.id);
        const target = roomChars.find(c => c.name.toLowerCase().includes(targetName.toLowerCase()));

        if (!target) {
            this.printImmediate(`You don't see "${targetName}" here.`, 'error - msg');
            return false;
        }

        // Output to player: "You say to [Target]: [Message]"
        const p = document.createElement('div');
        p.classList.add('dialogue');
        p.innerHTML = `<span class="speaker">You say to <span style="color:${target.color}">${target.name}</span>:</span> "${text}"`;
        this.output.appendChild(p);
        this.output.scrollTop = this.output.scrollHeight;

        this.broadcastEvent(new GameEvent('say', `Player said to ${target.name}: "${text}"`, 'player', target.id));
        return true;
    }

    playerEmote(text) {
        if (!this.currentRoom) return;

        // Display to player
        // User requested "hot magenta", using standard Magenta #FF00FF or HotPink #FF69B4. Let's go with a vibrant magenta.
        const p = document.createElement('div');
        p.classList.add('dialogue');
        // Format: Entire line colored. "You [text]"
        // User example: "shrugs your shoulders" -> "You shrug your shoulders"
        // I will implement simple appending for now. 
        // "You " + text.
        p.innerHTML = `<span style="color: #FF00FF">You ${text}</span>`;
        this.output.appendChild(p);
        this.output.scrollTop = this.output.scrollHeight;

        // Broadcast event
        // We use type 'action' for emotes/physical actions
        this.broadcastEvent(new GameEvent('action', `Player ${text}`, 'player'));
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

    broadcastEvent(event, targetRoomId = null) {
        // If no target room specified, default to player's current room
        const roomId = targetRoomId || (this.currentRoom ? this.currentRoom.id : null);

        if (!roomId) return;

        // Find all characters in the target room
        const chars = this.getCharactersInRoom(roomId);
        chars.forEach(c => c.observe(event));

        // Notify Global Coordinator
        if (this.coordinator) {
            this.coordinator.onEvent(event);
        }
    }

    npcSay(characterId, text) {
        if (!this.currentRoom) return;

        const character = this.characters[characterId];
        if (!character) return;

        // Only print to UI if player is in the same room
        if (character.currentRoomId === this.currentRoom.id) {
            this.printDialogue(character.name, text);
        }

        // Broadcast event to the CHARACTER'S room, not necessarily the player's
        this.broadcastEvent(new GameEvent('say', `${character.name} said: "${text}"`, characterId), character.currentRoomId);
    }

    npcEmote(characterId, text) {
        if (!this.currentRoom) return;

        const character = this.characters[characterId];
        // Only show if the character is in the same room as the player
        if (character && character.currentRoomId === this.currentRoom.id) {
            const p = document.createElement('div');
            p.classList.add('dialogue');
            // Entire line colored in character's color
            // Format: [Name] [action]
            p.innerHTML = `<span style="color: ${character.color}">${character.name} ${text}</span>`;
            this.output.appendChild(p);
            this.output.scrollTop = this.output.scrollHeight;
        }

        // Broadcast event
        if (character) {
            this.broadcastEvent(new GameEvent('action', `${character.name} ${text}`, characterId));
        }
    }

    // --- Item Interaction ---

    get(itemName) {
        const roomItems = this.getItemsByHolder(this.currentRoom.id);
        const item = roomItems.find(i => i.name.toLowerCase().includes(itemName.toLowerCase()) && !i.isHidden);

        if (!item) {
            this.printImmediate("You don't see that here.", 'error-msg');
            return;
        }

        if (item.isStatic) {
            const msg = item.staticMessage || "You can't pick that up.";
            this.printImmediate(msg, 'system-msg');
            return;
        }

        // Pick it up
        item.holderId = 'player';
        this.printImmediate(`You picked up the ${item.name}.`, 'system-msg');
        this.broadcastEvent(new GameEvent('action', `Player picked up ${item.name}.`, 'player'));
    }

    use(itemName) {
        // 1. Find Item (Inventory OR Room)
        const playerItems = this.getItemsByHolder('player');
        const roomItems = this.getItemsByHolder(this.currentRoom.id).filter(i => !i.isHidden);
        const allItems = [...playerItems, ...roomItems];

        const item = allItems.find(i => i.name.toLowerCase().includes(itemName.toLowerCase()));

        if (!item) {
            this.printImmediate("You don't see that here and you aren't holding it.", 'error-msg');
            return;
        }

        // 2. Check Triggers
        if (!this.triggers) {
            this.printImmediate("Nothing happens.", 'system-msg');
            return;
        }

        // Find matching trigger
        const trigger = this.triggers.find(t =>
            t.item === item.id &&
            (!t.location || t.location === this.currentRoom.id)
        );

        if (trigger) {
            // Check condition (simplified for now, usually just 'true' or secret state)
            // For now, assume true if present

            // Print Message
            if (trigger.message) {
                this.printImmediate(trigger.message, 'success-msg');
            }

            // Apply Effect
            if (trigger.effect) {
                if (trigger.effect.type === 'revealItem') {
                    this.revealItem(trigger.effect.itemId);
                } else if (trigger.effect.type === 'revealExit') {
                    this.revealExit(trigger.effect.roomId, trigger.effect.dir);
                }
            }

            // Broadcast Event
            this.broadcastEvent(new GameEvent('action', `Player used ${item.name}.`, 'player'));
            return;
        }

        this.printImmediate("You can't use that here.", 'system-msg');
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

    getLocationName(locationId) {
        // console.log(`[Game] Getting name for location: ${locationId}`, this.characters[locationId]);
        if (!locationId) return 'somewhere';
        if (this.world[locationId]) return this.world[locationId].name; // Changed from this.rooms to this.world
        if (locationId === 'player') return 'your inventory';
        if (this.characters[locationId]) return this.characters[locationId].name;
        // console.warn(`[Game] Unknown location ID: ${locationId}`);
        return 'somewhere';
    }

    revealExit(roomId, direction) {
        const room = this.world[roomId];
        if (room && room.hiddenExits && room.hiddenExits[direction]) {
            room.exits[direction] = room.hiddenExits[direction];
            delete room.hiddenExits[direction];
            this.printImmediate(`[DISCOVERY] A new path to the [${direction.toUpperCase()}] has been revealed (in ${room.name})!`, 'discovery-msg');
            // Re-render if in that room
            if (this.currentRoom.id === roomId) this.look();
        }
    }

    revealItem(itemId) {
        const item = this.itemsData.find(i => i.id === itemId);
        if (item && item.isHidden) {
            item.isHidden = false;
            let outcomes = [`You have revealed: ${item.name}`];

            // Try to resolve location name
            let locationName = '';
            if (this.world[item.startLocation]) {
                locationName = `(in ${this.world[item.startLocation].name})`;
            } else if (this.characters[item.startLocation]) {
                locationName = `(held by ${this.characters[item.startLocation].name})`;
            }

            this.printImmediate(`You have revealed: ${item.name} ${locationName}!`, 'success-msg');
            this.broadcastEvent(new GameEvent('action', `Something was revealed in the ${locationName}.`, 'director'));
            // Re-render if in presence (complicated check, just assume director calls it appropriately)
        }
    }
}

window.onload = () => {
    const game = new Game();
};
