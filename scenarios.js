const scenarios = {
    1: {
        id: 1,
        title: "The Missing Signet Ring",
        description: "A mystery in the village of Oakhaven.",
        setup: async (game) => {
            game.printImmediate("Loading scenario data...", "system-msg");

            try {
                // Fetch all data in parallel
                const [data, rooms, chars, items, lore] = await Promise.all([
                    fetch('scenarios/1/data.json').then(r => r.json()),
                    fetch('scenarios/1/rooms.json').then(r => r.json()),
                    fetch('scenarios/1/characters.json').then(r => r.json()),
                    fetch('scenarios/1/items.json').then(r => r.json()),
                    fetch('scenarios/1/lore.json').then(r => r.json())
                ]);

                // 1. Hydrate Rooms
                game.world = {};
                rooms.forEach(r => {
                    // Room(id, name, description, exits = {}, hiddenExits = {})
                    game.world[r.id] = new Room(r.id, r.name, r.description, r.exits, r.hiddenExits);
                });

                // 2. Hydrate Characters
                game.characters = {};
                chars.forEach(c => {
                    // Character(id, name, description, currentRoomId, color, secret = '')
                    game.characters[c.id] = new Character(c.id, c.name, c.description, c.roomId, c.color, c.secret);
                });

                // 3. Hydrate Items
                game.itemsData = [];
                items.forEach(i => {
                    // Item(id, name, description, holderId = null, isHidden = false)
                    game.itemsData.push(new Item(i.id, i.name, i.description, i.startLocation, i.isSecret));
                });

                // 4. Load Lore
                game.lore = lore;

                // 5. Hydrate Secrets (Transform JSON declarative effects into functions)
                const secrets = data.secrets;
                Object.values(secrets).forEach(secret => {
                    if (secret.onReveal) {
                        const effect = secret.onReveal;
                        if (effect.type === 'revealExit') {
                            secret.revealFunc = (game) => game.revealExit(effect.roomId, effect.dir);
                        } else if (effect.type === 'revealItem') {
                            secret.revealFunc = (game) => game.revealItem(effect.itemId);
                        }
                    }
                });

                // Initialize Secrets in Coordinator
                game.coordinator = new AICoordinator(game, secrets);

                // Initialize AI Agents
                game.initAgents();

                // Set Start Room
                game.currentRoom = game.world['square'];

                // Show Intro Text (from data.json)
                game.printImmediate(data.introText, 'intro-text');
                game.printImmediate('<br>-----------------------<br>');
                game.printImmediate('Type "help" for commands.');

                // Perform initial Look
                game.look();

                // Initial Greeting
                setTimeout(() => {
                    const crier = game.characters['crier'];
                    if (crier && crier.currentRoomId === 'square') {
                        game.printDialogue(crier.name, "Welcome to our humble village, traveller. Beware the spirits!");
                    }
                }, 1000);

            } catch (err) {
                console.error("Failed to load scenario:", err);
                game.printImmediate("Error loading scenario data. Check console.", "error-msg");
            }
        }
    }
};
