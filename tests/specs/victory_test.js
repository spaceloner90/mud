// Test: Victory Condition (Mock)
// Objective: Verify that obtaining the specific Victory Item triggers the Victory State.
// This test uses a self-contained mock scenario, independent of real game data.

// Helper to spy on output
const outputLog = [];
let game = new Game(); // Global game instance

// Override printImmediate
game.printImmediate = (text) => {
    // console.log(`[GAME OUT] ${text}`);
    outputLog.push(text);
};

// 1. Setup Mock Scenario
console.log('  1. Setting up Mock Scenario...');

// Mock Room
game.world = {
    'mock_room': new Room('mock_room', 'Mock Room', 'A white void.', {})
};
game.currentRoom = game.world['mock_room'];

// Mock Characters (empty for now)
game.characters = {};

// Mock Item: The Victory McGuffin
const mcguffin = new Item(
    'victory_mcguffin',    // id
    'The McGuffin',        // name
    'Key to victory.',     // description
    'mock_room',           // startLocation (In the room)
    false,                 // isHidden
    false,                 // isStatic
    ''                     // staticMessage
);
game.itemsData = [mcguffin];

// Mock Victory Condition
// Note: 'condition' property is required by Coordinator logic
game.victoryCondition = {
    condition: 'item_held',
    itemId: 'victory_mcguffin'
};

// Setup Coordinator (CRITICAL: It handles the victory check)
console.log('  1b. Setting up AI Coordinator...');
game.coordinator = new AICoordinator(game);

// Set State
game.state = 'PLAYING';

// 2. Simulate Finding the Ring using Engine Command
console.log('  2. Acquiring Victory Item via game.get()...');

// Ensure item is in the room
if (mcguffin.holderId !== 'mock_room') {
    throw new Error('Setup Error: Item should be in mock_room');
}

// Execute 'get' command
game.get('McGuffin');

// 3. Assert Victory
console.log('  3. Checking for Victory...');

// Check log for success message just in case
const pickupMsg = outputLog.find(l => l.includes('You picked up'));
if (!pickupMsg) {
    console.error('Output Log:', outputLog);
    throw new Error('Action failed: Player did not pick up the item.');
}

if (game.state !== 'VICTORY') {
    console.error('Final State:', game.state);
    throw new Error(`Expected state VICTORY, got ${game.state}. Check coordinator logic.`);
}

console.log('  Success: Mock Victory Condition triggered.');
