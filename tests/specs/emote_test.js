// Test: Emote Command
// Objective: Verify UI output and NPC memory for player and NPC emotes.

// Helper to spy on output
const outputLog = [];
let game = new Game();

// Override printImmediate to capture output
game.printImmediate = (text) => {
    outputLog.push(text);
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

// Mock Scenario Role
game.currentScenario = { playerRole: 'Tester' };

// Set State
game.state = 'PLAYING';

// 2. Player Emote
console.log('  2. Executing: "emote shrugs"...');
game.inputHandler.handle('emote shrugs');

// 3. Verify Player UI Output
console.log('  3. Verifying Player UI Output...');
// Refresh children list as it's modified in place on the DOM object
const playerChildren = game.output.children || [];
const allOutputPlayer = [
    ...outputLog,
    ...playerChildren.map(c => c.innerHTML || c.textContent)
];

// Expected Exact HTML: <span style="color: #FF00FF">You shrugs</span>
const expectedPlayerHTML = `<span style="color: #FF00FF">You shrugs</span>`;
const foundPlayerExact = allOutputPlayer.some(l => l === expectedPlayerHTML);

if (!foundPlayerExact) {
    throw new Error(`Player UI Output missing exact expected line.\nExpected: '${expectedPlayerHTML}'\nActual Output: ${JSON.stringify(allOutputPlayer, null, 2)}`);
}

// 4. Verify NPC Memory (Player Emote)
console.log('  4. Verifying NPC Memory (Player Emote)...');
const memPlayer = npc.memory.find(e => e.type === 'action' && e.sourceId === 'player');

if (!memPlayer) {
    throw new Error(`NPC did not record the player emote. Memory: ${JSON.stringify(npc.memory)}`);
}

// Memory: "Tester (Player Character) shrugs"
const expectedPlayerMem = 'Tester (Player Character) shrugs';
if (!memPlayer.description.includes(expectedPlayerMem)) {
    throw new Error(`Memory description mismatch.\nExpected to include: ${expectedPlayerMem}\nGot: ${memPlayer.description}`);
}

// 5. NPC Emote
console.log('  5. NPC Emotes...');
const npcAction = "nods slowly";
game.npcEmote(npc.id, npcAction);

// 6. Verify NPC UI Output
console.log('  6. Verifying NPC UI Output...');
// Refresh children list
const npcChildren = game.output.children || [];
const allOutputNPC = [
    ...npcChildren.map(c => c.innerHTML || c.textContent)
];

// Expected Exact HTML: <span style="color: #FFFFFF">Observer nods slowly</span>
const expectedNpcHTML = `<span style="color: #FFFFFF">Observer nods slowly</span>`;
const foundNpcExact = allOutputNPC.some(l => l === expectedNpcHTML);

if (!foundNpcExact) {
    throw new Error(`NPC UI Output missing exact expected line.\nExpected: '${expectedNpcHTML}'\nActual Output: ${JSON.stringify(allOutputNPC, null, 2)}`);
}

// 7. Verify NPC Memory (Self Emote)
console.log('  7. Verifying NPC Memory (Self Emote)...');
const memNPC = npc.memory.find(e => e.type === 'action' && e.sourceId === npc.id && e.description.includes(npcAction));

if (!memNPC) {
    throw new Error(`NPC did not record their own emote. Memory: ${JSON.stringify(npc.memory)}`);
}

console.log('  Success: Emote command verify.');
