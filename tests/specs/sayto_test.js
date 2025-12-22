// Test: SayTo Command
// Objective: Verify UI output and NPC memory input for 'sayto' command.

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
console.log('  2. Executing: "sayto Observer Hello World"...');
// NOTE: Changing 'say' to 'sayto' to match expected behavior of targeting
game.inputHandler.handle('sayto Observer Hello World');

// 3. Assert UI Output
console.log('  3. Verifying UI Output...');
// NOTE: playerSayTo appends directly to DOM, it doesn't always use printImmediate.
// We check game.output.children which is mocked by env.js
const children = game.output.children || [];
const allOutput = [
    ...outputLog,
    ...children.map(c => c.innerHTML || c.textContent)
];

// Expected: <span class="speaker">You say to <span style="color:#FFFFFF">Observer</span>:</span> "Hello World"
// Expected Exact HTML: <span class="speaker">You say to <span style="color:#FFFFFF">Observer</span>:</span> "Hello World"
const expectedHTML = `<span class="speaker">You say to <span style="color:#FFFFFF">Observer</span>:</span> "Hello World"`;

const foundExact = allOutput.some(l => l === expectedHTML);

if (!foundExact) {
    throw new Error(`UI Output missing exact expected chat line.\nExpected: ${expectedHTML}\nActual Output: ${JSON.stringify(allOutput, null, 2)}`);
}

// 4. Assert NPC Memory
console.log('  4. Verifying NPC Memory...');
const mem = npc.memory.find(e => e.type === 'say' && e.sourceId === 'player');

if (!mem) {
    throw new Error(`NPC did not record the event. Memory: ${JSON.stringify(npc.memory)}`);
}

if (!mem.description.includes('Tester (Player Character) said to Observer: "Hello World"')) {
    throw new Error(`Memory description mismatch. Got: ${mem.description}`);
}

console.log('  Success: Say command verified.');
