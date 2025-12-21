// Helper to load scenario data
async function loadScenarioData(game, id) {
    game.printImmediate("Loading scenario data...", "system-msg");

    try {
        // Fetch all data in parallel with cache busting
        const timestamp = Date.now();
        const [data, rooms, chars, items, lore] = await Promise.all([
            fetch(`scenarios/${id}/data.json?t=${timestamp}`).then(r => r.json()),
            fetch(`scenarios/${id}/rooms.json?t=${timestamp}`).then(r => r.json()),
            fetch(`scenarios/${id}/characters.json?t=${timestamp}`).then(r => r.json()),
            fetch(`scenarios/${id}/items.json?t=${timestamp}`).then(r => r.json()),
            fetch(`scenarios/${id}/lore.json?t=${timestamp}`).then(r => r.json())
        ]);

        // 1. Hydrate Rooms
        game.world = {};
        rooms.forEach(r => {
            game.world[r.id] = new Room(r.id, r.name, r.description, r.exits, r.hiddenExits);
        });

        // 2. Hydrate Characters
        game.characters = {};
        chars.forEach(c => {
            // Character(id, name, description, currentRoomId, color, secret = '', knowledge = [])
            let secret = c.secret;
            if (Array.isArray(secret)) {
                secret = secret.join('\n');
            }
            const char = new Character(c.id, c.name, c.description, c.roomId, c.color, secret);
            char.knowledge = c.knowledge || [];
            game.characters[c.id] = char;
        });

        // 3. Hydrate Items
        game.itemsData = [];
        items.forEach(i => {
            // Item(id, name, description, holderId = null, isHidden = false, isStatic = false, staticMessage = '')
            game.itemsData.push(new Item(i.id, i.name, i.description, i.startLocation, i.isSecret, i.isStatic, i.staticMessage));
        });

        // 4. Load Lore
        game.lore = lore;

        // 5. Hydrate Secrets
        const secretsRaw = data.secrets || {};
        const secrets = {};

        Object.values(secretsRaw).forEach(s => {
            const secret = new Secret(s.id, s.description, s.resolved, s.onReveal);
            secrets[secret.id] = secret;
        });

        // Initialize Secrets in Coordinator
        game.coordinator = new AICoordinator(game, secrets);

        // Initialize AI Agents
        game.initAgents();

        // 6. Load Mechanical Triggers
        game.triggers = data.triggers || [];

        // 7. Set Solution on Game State
        // If data.solution exists (narrative or object), store it. Otherwise undefined.
        game.solution = data.solution;
        game.outroText = data.outroText;
        game.tickMessage = data.tickMessage;

        return data;
    } catch (err) {
        console.error("Failed to load scenario:", err);
        game.printImmediate("Error loading scenario data: " + err.message, "error-msg");
        throw err;
    }
}

const scenarios = {
    1: {
        id: 1,
        title: "The Missing Signet Ring",
        description: "A mystery in the village of Oakhaven.",
        setup: async (game) => {
            try {
                const data = await loadScenarioData(game, 1);

                // Set Start Room
                game.currentRoom = game.world['square'];

                // Show Intro Text
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
                // Error handled in loadScenarioData
            }
        }
    },
    2: {
        id: 2,
        title: "The Manor Murder",
        description: "A classic whodunit in a storm-swept manor.",
        setup: async (game) => {
            try {
                const data = await loadScenarioData(game, 2);

                // Set Start Room
                game.currentRoom = game.world['foyer'];

                // Show Intro Text
                game.printImmediate(data.introText, 'intro-text');
                game.printImmediate('<br>-----------------------<br>');
                game.printImmediate('Type "help" for commands.');

                // Perform initial Look
                game.look();

                // Initial Greeting from Constable Reggie
                setTimeout(() => {
                    const reggie = game.characters['reggie'];
                    // Only start if Reggie is in Foyer and Player is in Foyer
                    if (reggie && reggie.currentRoomId === 'foyer' && game.currentRoom.id === 'foyer') {
                        game.npcSay(reggie.id, "Inspector! Thank goodness you've arrived. The storm is getting worse by the minute.");
                        setTimeout(() => {
                            // Check again before continuing
                            if (game.currentRoom.id === 'foyer') {
                                game.npcSay(reggie.id, "I've secured the scene as best I can, but frankly, I'm out of my depth. The body is in the Library.");
                                setTimeout(() => {
                                    // Check one last time
                                    if (game.currentRoom.id === 'foyer') {
                                        game.npcSay(reggie.id, "I can brief you on the suspects if you wish. Just ask. And also let me know when you are ready to SOLVE the case.");
                                    }
                                }, 1500);
                            }
                        }, 1500);
                    }
                }, 1000);
            } catch (err) {
                // Error handled in loadScenarioData
            }
        }
    }
};
