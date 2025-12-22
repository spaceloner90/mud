// Test: Look Command
// Objective: Verify look output for Room, NPC, Ground Items, Inventory Items, and hidden NPC Items.

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
const itemGround = new Item('ground_rock', 'Ground Rock', 'Rock on floor.', 'test_room');
const itemPlayer = new Item('player_key', 'Player Key', 'Key in pocket.', 'player');
const itemNPC = new Item('npc_sword', 'NPC Sword', 'Sword in hand.', 'npc_observer');

game.itemsData = [itemGround, itemPlayer, itemNPC];

// Mock Scenario Role
game.currentScenario = { playerRole: 'Tester' };

// Set State
game.state = 'PLAYING';

// ------------------------------------------
// TEST 1: Look (Room)
// ------------------------------------------
console.log('  2. Executing: "look"...');
outputLog.length = 0; // Clear log
game.inputHandler.handle('look');

// Verify Room Title
if (!outputLog.some(l => l === '<div class="room-title">Test Room</div>')) throw new Error('Look failed: Room Title missing. Log: ' + JSON.stringify(outputLog));
// Verify Room Description
if (!outputLog.some(l => l === '<div>A white void.</div>')) throw new Error('Look failed: Room Desc missing');
// Verify NPC Presence (Also here: ...)
if (!outputLog.some(l => l === '<div class="room-chars">Also here: <span style="color:#FFFFFF">Observer</span></div>')) throw new Error('Look failed: NPC missing. Log: ' + JSON.stringify(outputLog));
// Verify Ground Item (Visible items: ...)
if (!outputLog.some(l => l === '<div class="room-items">Visible items: <span class="item-name">Ground Rock</span></div>')) throw new Error('Look failed: Ground Item missing');


// ------------------------------------------
// TEST 2: Look NPC
// ------------------------------------------
console.log('  3. Executing: "look Observer"...');
outputLog.length = 0;
game.inputHandler.handle('look Observer');

// Verify NPC Name
if (!outputLog.some(l => l === '<div class="char-name"><span style="color:#FFFFFF">Observer</span></div>')) throw new Error(`Look NPC failed: Name missing. Log: ${JSON.stringify(outputLog)}`);
// Verify NPC Description
if (!outputLog.some(l => l === '<div>A silent watcher.</div>')) throw new Error('Look NPC failed: Desc missing');
// Verify NPC Item (Holding: ...)
if (!outputLog.some(l => l === '<div class="room-items">Holding: <span class="item-name">NPC Sword</span></div>')) {
    throw new Error(`Look NPC failed: Held item missing. Log: ${JSON.stringify(outputLog)}`);
}

// ------------------------------------------
// TEST 3: Look Item (Ground)
// ------------------------------------------
console.log('  4. Executing: "look Ground Rock"...');
outputLog.length = 0;
game.inputHandler.handle('look Ground Rock');

// Verify Item Name
if (!outputLog.some(l => l === '<div class="item-name">Ground Rock</div>')) throw new Error('Look Ground Item failed: Name missing');
// Verify Item Desc
if (!outputLog.some(l => l === '<div>Rock on floor.</div>')) throw new Error('Look Ground Item failed: Desc missing');

// ------------------------------------------
// TEST 4: Look Item (Inventory)
// ------------------------------------------
console.log('  5. Executing: "look Player Key"...');
outputLog.length = 0;
game.inputHandler.handle('look Player Key');

// Verify Item Name
if (!outputLog.some(l => l === '<div class="item-name">Player Key</div>')) throw new Error('Look Inv Item failed: Name missing');
// Verify Item Desc
if (!outputLog.some(l => l === '<div>Key in pocket.</div>')) throw new Error('Look Inv Item failed: Desc missing');

// ------------------------------------------
// TEST 5: Look Item in NPC Inventory (Should fail)
// ------------------------------------------
console.log('  6. Executing: "look NPC Sword"...');
outputLog.length = 0;
game.inputHandler.handle('look NPC Sword');

// Expected: "You don't see that here."
const expectedError = '<div class="error-msg">You don\'t see that here.</div>';
const foundError = outputLog.some(l => l === expectedError);

if (!foundError) {
    throw new Error(`Look NPC Item failed. It should be invisible to direct look.\nLog: ${JSON.stringify(outputLog)}`);
}

console.log('  Success: Look command verified.');
