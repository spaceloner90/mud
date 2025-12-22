// Test: Get Command
// Objective: Verify UI output and NPC memory for player picking up an item.

// Helper to spy on output
const outputLog = [];
let game = new Game();

// Let's refine the spy to capture class for better verification.
const detailedLog = [];

// Override printImmediate to capture output
game.printImmediate = (text, className = '') => {
    // Mimic the class logic roughly for string matching or object inspection
    // game.js: const p = document.createElement('div'); if (className) p.classList.add(className); p.innerHTML = text;
    // We'll store an object or string. Since previous tests check exact HTML, we should match that.

    // Construct HTML string as it would appear in the DOM
    let html = text;
    if (className) {
        html = `<div class="${className}">${text}</div>`;
    } else {
        html = `<div>${text}</div>`;
    }
    outputLog.push(html);
    detailedLog.push({ text, className });
};

// Spy on getItemsByHolder
const originalGetItems = game.getItemsByHolder.bind(game);
game.getItemsByHolder = (id) => {
    const res = originalGetItems(id);
    return res;
};

// 1. Setup Mock Scenario
console.log('  1. Setting up Mock Game...');

// Mock Room
game.world = {
    'test_room': new Room('test_room', 'Test Room', 'A white void.', {})
};
game.currentRoom = game.world['test_room'];

// Mock NPC
const npc = new Character(
    'npc_observer',
    'Observer',
    'A silent watcher.',
    'test_room',
    '#FFFFFF'
);
// Ensure characters object is initialized
game.characters = { 'npc_observer': npc };

// Mock Item
const item = new Item(
    'shiny_rock',
    'Shiny Rock',
    'A small, glittering stone.',
    'test_room', // In the room
    false,
    false,
    ''
);
game.itemsData = [item];

// Mock Scenario Role
game.currentScenario = { playerRole: 'Tester' };

// Set State
game.state = 'PLAYING';

// 2. Execute Command
console.log('  2. Executing: "get Shiny Rock"...');
game.inputHandler.handle('get Shiny Rock');

// 3. Verify Player UI Output
console.log('  3. Verifying Player UI Output...');

// 3a. Verify Item Movement
if (item.holderId !== 'player') {
    throw new Error(`Item was not picked up. Holder is: ${item.holderId}`);
}

// 3b. Verify Message
// Expected: Text="You picked up the Shiny Rock.", Class="system-msg"
const foundMsg = detailedLog.find(l =>
    l.text === "You picked up the Shiny Rock." &&
    l.className === "system-msg"
);

if (!foundMsg) {
    console.log("DEBUG: detailedLog content:", JSON.stringify(detailedLog, null, 2));
    console.log("DEBUG: game.itemsData:", JSON.stringify(game.itemsData, null, 2));
    console.log("DEBUG: currentRoom.id:", game.currentRoom.id);
    throw new Error(`Player UI Output missing expected line.\nLog: ${JSON.stringify(detailedLog, null, 2)}`);
}

// 4. Verify NPC Memory
console.log('  4. Verifying NPC Memory...');
const mem = npc.memory.find(e => e.type === 'action' && e.sourceId === 'player');

if (!mem) {
    throw new Error(`NPC did not record the action. Memory: ${JSON.stringify(npc.memory)}`);
}

// Expected: "Tester (Player Character) picked up Shiny Rock (A small, glittering stone.)."
// Note: description uses replace on newlines.
const expectedMem = "Tester (Player Character) picked up Shiny Rock (A small, glittering stone.).";

if (mem.description !== expectedMem) {
    throw new Error(`Memory description mismatch.\nExpected: ${expectedMem}\nGot: ${mem.description}`);
}

console.log('  Success: Get command verify.');
