const scenarios = {
    1: {
        id: SCENARIO_1_DATA.id,
        title: SCENARIO_1_DATA.title,
        description: SCENARIO_1_DATA.description,
        introText: SCENARIO_1_DATA.introText,
        setup: (game) => {
            // Load World
            game.world = {};
            SCENARIO_1_DATA.rooms.forEach(room => {
                // Clone to prevent mutation of the original data if restarting
                // But for now simple reference or shallow copy is okay since we reload on reset
                game.world[room.id] = room;
            });

            // Load Characters
            game.characters = {};
            SCENARIO_1_DATA.characters.forEach(char => {
                game.characters[char.id] = char;
            });

            // Load Items
            game.itemsData = SCENARIO_1_DATA.items; // Keep array for list filtering

            // Load Lore
            game.lore = SCENARIO_1_LORE;

            // Initialize Secrets in Coordinator
            game.coordinator = new AICoordinator(game, SCENARIO_1_DATA.secrets);

            // Initialize AI Agents
            game.initAgents();

            // Set Start Room
            game.currentRoom = game.world['square'];
            game.look();

            // Initial Greeting
            setTimeout(() => {
                const crier = game.characters['crier'];
                if (crier && crier.currentRoomId === 'square') {
                    game.printDialogue(crier.name, "Welcome to our humble village, traveller. Beware the spirits!");
                }
            }, 1000);
        }
    }
};
