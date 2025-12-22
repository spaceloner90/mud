// Test: Say Command
// Objective: Verify UI output and NPC memory input for generic 'say' command.

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

// 2. Execute Command
console.log('  2. Executing: "say Hello World"...');
game.inputHandler.handle('say Hello World');

// 3. Assert UI Output
console.log('  3. Verifying UI Output...');
// NOTE: printDialogue appends directly to DOM.
// We check game.output.children which is mocked by env.js
const children = game.output.children || [];
const allOutput = [
    ...outputLog,
    ...children.map(c => c.innerHTML || c.textContent)
];

// Expected Exact HTML for 'say': <span class="speaker" >You:</span> "Hello World"
// Note the space after class="speaker" due to empty colorStyle in printDialogue template
const expectedHTML = `<span class="speaker" >You:</span> "Hello World"`;

const foundExact = allOutput.some(l => l === expectedHTML);

if (!foundExact) {
    throw new Error(`UI Output missing exact expected chat line.\nExpected: '${expectedHTML}'\nActual Output: ${JSON.stringify(allOutput, null, 2)}`);
}

// 4. Assert NPC Memory
console.log('  4. Verifying NPC Memory...');
const mem = npc.memory.find(e => e.type === 'say' && e.sourceId === 'player');

if (!mem) {
    throw new Error(`NPC did not record the event. Memory: ${JSON.stringify(npc.memory)}`);
}

// Expected Memory: Tester (Player Character) said "Hello World" to the room
// (Based on game.js: `${this.game.getPlayerLogName()} said "${speech}" to the room`)
const expectedMemory = 'Tester (Player Character) said "Hello World" to the room';
if (!mem.description.includes(expectedMemory)) {
    throw new Error(`Memory description mismatch.\nExpected to include: ${expectedMemory}\nGot: ${mem.description}`);
}

console.log('  Success: Say command verified.');
