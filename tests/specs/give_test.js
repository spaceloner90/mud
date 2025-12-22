// Test: Give Command
// Objective: Verify player give (to NPC) and NPC give (to player).

// Helper to spy on output
const outputLog = [];
let game = new Game();

// Override printImmediate to capture output
game.printImmediate = (text, className = '') => {
    // Construct HTML string as it would appear in the DOM
    let html = text;
    if (className) {
        html = `<div class="${className}">${text}</div>`;
    } else {
        html = `<div>${text}</div>`;
    }
    outputLog.push(html);
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

// Mock Items
const itemPlayer = new Item(
    'player_rock',
    'Player Rock',
    'A rock held by player.',
    'player', // Held by player
    false,
    false,
    ''
);

const itemNPC = new Item(
    'npc_rock',
    'NPC Rock',
    'A rock held by NPC.',
    'npc_observer', // Held by NPC
    false,
    false,
    ''
);

game.itemsData = [itemPlayer, itemNPC];

// Mock Scenario Role
game.currentScenario = { playerRole: 'Tester' };

// Set State
game.state = 'PLAYING';

// ------------------------------------------
// TEST 1: Player gives Item to NPC
// ------------------------------------------

// 2. Execute Command
console.log('  2. Executing: "give Player Rock Observer"...');
game.inputHandler.handle('give Player Rock Observer');

// 3. Verify Player UI Output
console.log('  3. Verifying Player UI Output...');
const expectedPlayerUI = '<div class="system-msg">You gave the Player Rock to Observer.</div>';
const foundPlayerUI = outputLog.some(l => l === expectedPlayerUI);

if (!foundPlayerUI) {
    throw new Error(`Player UI Output missing expected line.\nExpected: '${expectedPlayerUI}'\nLog: ${JSON.stringify(outputLog, null, 2)}`);
}

// 4. Verify Item Ownership
if (itemPlayer.holderId !== 'npc_observer') {
    throw new Error(`Item transfer failed. Item holder is still: ${itemPlayer.holderId}`);
}

// 5. Verify NPC Memory
console.log('  5. Verifying NPC Memory...');
// Logic: this.game.broadcastEvent(new GameEvent('action', `${this.game.getPlayerLogName()} gave ${itemToGive.name} (${desc}) to ${recipient.name}.`, 'player'));
const expectedMem1 = 'Tester (Player Character) gave Player Rock (A rock held by player.) to Observer.';
const mem1 = npc.memory.find(e => e.type === 'action' && e.description === expectedMem1);

if (!mem1) {
    throw new Error(`NPC did not record receiving the item.\nExpected: ${expectedMem1}\nMemory: ${JSON.stringify(npc.memory)}`);
}

// ------------------------------------------
// TEST 2: NPC gives Item to Player
// ------------------------------------------

// 6. Execute NPC Give
console.log('  6. Executing NPC Give...');
// Mocking the call the AI Director/Logic would make
game.npcGive('npc_observer', 'NPC Rock', 'player');

// 7. Verify Player UI Output
console.log('  7. Verifying Player UI Output (NPC Give)...');
// npcGive -> printImmediate(`${npc.name} gives ${item.name} to ${recipient.name}.`, 'system-msg');
const expectedMsg2 = '<div class="system-msg">Observer gives NPC Rock to You.</div>';
const foundMsg2 = outputLog.some(l => l === expectedMsg2);

if (!foundMsg2) {
    throw new Error(`Player UI Output (NPC Give) missing expected line.\nExpected: '${expectedMsg2}'\nLog: ${JSON.stringify(outputLog, null, 2)}`);
}

// 8. Verify Item Ownership
if (itemNPC.holderId !== 'player') {
    throw new Error(`NPC Item transfer failed. Item holder is: ${itemNPC.holderId}`);
}

// 9. Verify NPC Memory (Self Action)
console.log('  9. Verifying NPC Memory (Self Give)...');
// Logic: receiverName = recipient.name; -> "You" ? 
// Wait, check npcGive logic:
// if (recipient.id === 'player') { receiverName = this.getPlayerLogName(); }
// So receiverName = "Tester (Player Character)"
// broadcastEvent('action', `${npc.name} gave ${item.name} (${desc}) to ${receiverName}.`, characterId);
const expectedMem2 = 'Observer gave NPC Rock (A rock held by NPC.) to Tester (Player Character).';
const mem2 = npc.memory.find(e => e.type === 'action' && e.description === expectedMem2);

if (!mem2) {
    throw new Error(`NPC did not record giving the item.\nExpected to include: ${expectedMem2}\nActual Memory: ${JSON.stringify(npc.memory)}`);
}

console.log('  Success: Give command verify.');
