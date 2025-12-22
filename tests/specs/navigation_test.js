// Test: Navigation Command
// Objective: Verify movement for Player and NPCs, checking visibility of events across rooms.

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

// Mock Rooms
const roomA = new Room('room_a', 'Room A', 'First Room.', { 'east': 'room_b' });
const roomB = new Room('room_b', 'Room B', 'Second Room.', { 'west': 'room_a' });
game.world = {
    'room_a': roomA,
    'room_b': roomB
};
game.currentRoom = game.world['room_a'];

// Mock NPCs
// NPC1 in Room A (with player)
const npc1 = new Character('npc1', 'Alice', 'Alice in A.', 'room_a', '#AABBCC');
// NPC2 in Room B (separate)
const npc2 = new Character('npc2', 'Bob', 'Bob in B.', 'room_b', '#DDEEFF');

game.characters = { 'npc1': npc1, 'npc2': npc2 };
game.itemsData = [];

// Mock Scenario Role
game.currentScenario = { playerRole: 'Tester' };

// Set State
game.state = 'PLAYING';

// ------------------------------------------
// TEST 1: Player moves A -> B
// ------------------------------------------
console.log('  2. Executing: "move east" (A -> B)...');
outputLog.length = 0;
// Player is "Tester (Player Character)"
game.inputHandler.handle('east');
// OR game.move('east') directly. Input handler calls simple move.

// A. Verify Output (Player sees B description)
if (!outputLog.some(l => l === '<div class="room-title">Room B</div>')) {
    throw new Error('Nav A->B failed: Player did not see Room B title. Log: ' + JSON.stringify(outputLog));
}
// NPC2 is in Room B, so player should see NPC2 now
if (!outputLog.some(l => l === '<div class="room-chars">Also here: <span style="color:#DDEEFF">Bob</span></div>')) {
    throw new Error('Nav A->B failed: Player did not see Bob in Room B. Log: ' + JSON.stringify(outputLog));
}

// B. Verify Memory (NPC1 in Room A - saw player leave)
// "Tester (Player Character) left towards east (Room B)."
const expectedMem1 = 'Tester (Player Character) left towards east (Room B).';
const mem1 = npc1.memory.find(e => e.type === 'leave' && e.description === expectedMem1);
if (!mem1) throw new Error(`NPC1 (A) missed player leaving. Memory: ${JSON.stringify(npc1.memory)}`);

// C. Verify Memory (NPC2 in Room B - saw player arrive)
// "Tester (Player Character) arrived in Room B from the west (Room A)."
const expectedMem2 = 'Tester (Player Character) arrived in Room B from the west (Room A).';
const mem2 = npc2.memory.find(e => e.type === 'enter' && e.description === expectedMem2);
if (!mem2) throw new Error(`NPC2 (B) missed player arrival. Memory: ${JSON.stringify(npc2.memory)}`);


// ------------------------------------------
// TEST 2: Player moves B -> A
// ------------------------------------------
// Player is now in B.
console.log('  3. Executing: "move west" (B -> A)...');
outputLog.length = 0;
game.inputHandler.handle('west');

// A. Verify Output (Player sees A description)
if (!outputLog.some(l => l === '<div class="room-title">Room A</div>')) {
    throw new Error('Nav B->A failed: Player did not see Room A title.');
}

// B. Verify Memory (NPC2 in B - saw player leave)
const expectedMem3 = 'Tester (Player Character) left towards west (Room A).';
const mem3 = npc2.memory.find(e => e.type === 'leave' && e.description === expectedMem3);
if (!mem3) throw new Error(`NPC2 (B) missed player leaving. Memory: ${JSON.stringify(npc2.memory)}`);

// C. Verify Memory (NPC1 in A - saw player arrive)
const expectedMem4 = 'Tester (Player Character) arrived in Room A from the east (Room B).';
const mem4 = npc1.memory.find(e => e.type === 'enter' && e.description === expectedMem4);
if (!mem4) throw new Error(`NPC1 (A) missed player arrival. Memory: ${JSON.stringify(npc1.memory)}`);


// ------------------------------------------
// TEST 3: NPC1 moves A -> B
// ------------------------------------------
// Player is in A. NPC1 is in A.
console.log('  4. NPC1 moves A -> B...');
game.move('east', 'npc1');

// A. Verify Player Output (Player saw NPC1 leave)
// Broadcast LEAVE to source room (A). Player is in A.
// Event: "Alice left towards east (Room B)."
// BUT wait, move() does NOT print to UI for NPCs leaving/entering unless player is there.
// broadcastEvent logic:
//   if (sourceId === 'player') { add to memory }
//   // Character logic: if char in room, add to memory.
//   // UI Logic is handled by whom?
// Let's check: game.broadcastEvent -> 
//   if (currentRoom.id === this.currentRoom?.id) { this.printImmediate ... }
//
// So if Player is in A, and NPC1 leaves A, Player *should* see the message.
// The event text is the message.
const expectedMsgLeave = 'Alice left towards east (Room B).';
// broadcastEvent wraps it in default div? Usually system-msg or similar?
// Actually GameEvent doesn't specify class usually, just `dialogue` or similar.
// Wait, broadcastEvent implementation:
//   const p = document.createElement('div'); p.classList.add('event-log'); p.innerText = event.description;
// So class is 'event-log'.
if (!outputLog.some(l => l === `<div class="system-msg">${expectedMsgLeave}</div>`)) {
    throw new Error(`Nav NPC1->B failed: Player (in A) didn't see exit msg. Log: ${JSON.stringify(outputLog)}`);
}

// B. Verify Memory (NPC1 - logged their own move?)
// NOTE: Character.observe explicitly SUppRESSES self-leave events!
// So we should check if they remember ARRIVING (enter event).
const expectedMsgEnter = 'Alice arrived in Room B from the west (Room A).';
const mem5 = npc1.memory.find(e => e.type === 'enter' && e.sourceId === 'npc1' && e.description === expectedMsgEnter);
if (!mem5) throw new Error('NPC1 did not remember arriving in B (Self Enter).');

// C. Verify Memory (NPC2 in B - saw NPC1 arrive)
// Player is in A, so Player does NOT see arrival in B.
// But NPC2 is in B.
const mem6 = npc2.memory.find(e => e.type === 'enter' && e.description === expectedMsgEnter);
if (!mem6) throw new Error('NPC2 (in B) did not remember Alice arriving.');


// ------------------------------------------
// TEST 4: NPC2 moves B -> A
// ------------------------------------------
// Player is in A. NPC2 is in B.
// NPC2 moves B -> A.
console.log('  5. NPC2 moves B -> A...');
game.move('west', 'npc2');

// A. Verify Player Output (Player saw NPC2 arrive in A)
const expectedMsgArrive = 'Bob arrived in Room A from the east (Room B).';
if (!outputLog.some(l => l === `<div class="system-msg">${expectedMsgArrive}</div>`)) {
    throw new Error(`Nav NPC2->A failed: Player (in A) didn't see arrival msg. Log: ${JSON.stringify(outputLog)}`);
}

// B. Verify Memory (NPC1 in B - saw NPC2 leave B?)
// NPC1 is now in B (from Test 3). NPC2 leaves B.
// So NPC1 should remember Bob leaving.
const expectedMsgLeaveBob = 'Bob left towards west (Room A).';
const mem7 = npc1.memory.find(e => e.type === 'leave' && e.description === expectedMsgLeaveBob);
if (!mem7) throw new Error('NPC1 (in B) did not remember Bob leaving.');

console.log('  Success: Navigation verified.');
