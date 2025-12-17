class Character {
    constructor(id, name, description, currentRoomId, color, secret = '') {
        this.id = id;
        this.name = name;
        this.description = description;
        this.currentRoomId = currentRoomId;
        this.color = color || '#FFFFFF'; // Default to white if missing
        this.secret = secret; // Hidden from player, known to AI
        this.memory = []; // Short-term memory of events
    }

    observe(event) {
        this.memory.push(event);
        // Keep memory size manageable (e.g., last 50 events)
        if (this.memory.length > 50) {
            this.memory.shift();
        }
        console.log(`%c[NPC ${this.name}] Observed:`, `color: ${this.color}; font-weight: bold;`, event.description);

        // Notify AI Agent if one is attached (we'll attach it in game.js)
        if (this.aiAgent) {
            this.aiAgent.notify(event);
        }
    }
}

const charactersData = [
    new Character(
        'crier',
        'Town Crier',
        'A short, stout man in a frayed uniform that was once bright red. He clutches his brass bell as if it were a weapon. He looks anxious, sweat beading on his brow as he keeps glancing fearfully towards the dark forest line.',
        'square',
        '#FF4500'
    ),
    new Character(
        'ghost',
        'Lost Spirit',
        'A translucent figure flickering in and out of existence like a dying candle. It clutches a hammer tightly to its chest. Its face is a mask of eternal sorrow, and it seems to be searching for something it can never find.',
        'clearing',
        '#00FFFF', // Cyan
        'It knows the path to the Ancient Grove leads east. It will reveal this ONLY if investigating the "duckie" or receiving kind actions. It is suspicious of mere words and empty promises; it wants proof of kindness.'
    ),
    new Character(
        'innkeeper',
        'Bartholomew the Innkeeper',
        'A burly man with a stained apron and a friendly smile that doesn\'t quite reach his eyes. His hands are restless, constantly wiping the counter. He is terrified of the raids and mutters under his breath about needing "real protection" for his supply wagons.',
        'tavern',
        '#CD853F'
    ),
    new Character(
        'grum',
        'Grum the Blacksmith',
        'A massive man with soot-stained skin and muscles like coiled ropes. His forge is cold, and he paces frantically, checking his empty tool rack repeatedly. He looks defeated, like a warrior who has lost his sword.',
        'blacksmith',
        '#708090'
    ),
    new Character(
        'shopkeeper',
        'Silas the Shopkeeper',
        'A wizened old man with thick spectacles that magnify his worried eyes. He stands hunched behind the counter, starting at every creak of the floorboards. "Lady Elara ran into the woods," he whispers, wringing his hands. "I fear for her safety."',
        'store',
        '#DAA520'
    ),
    new Character(
        'noble',
        'Lady Elara',
        'A noblewoman in a travel-stained purple dress that has seen better days. Her expensive jewelry looks out of place in the dirt. She is shivering against an ancient tree, eyes wide with terror. She needs a way out of this forest before the shadows take her.',
        'grove',
        '#9370DB',
        'She knows Silas has the Signet Ring hidden under his counter. She will reveal this ONLY if she has the Ticket or is truly convinced escape is imminent. She is desperate but not foolish; she won\'t trust vague assurances.'
    ),
    new Character(
        'pomp',
        'Madam Pomp',
        'A wealthy traveler in extravagant, albeit muddy, finery. She holds a scented handkerchief to her nose and looks at the rustic goods with undisguised disdain. She seems personally offended by the dust.',
        'store',
        '#C71585'
    ),
    new Character(
        'tom',
        'Old Tom',
        'An elderly man with a wild white beard, staring deeply into his mug as if it holds the secrets of the universe. He sways slightly on his stool and mutters about "the great cosmic joke."',
        'tavern',
        '#8A2BE2'
    )
];

const characters = {};
charactersData.forEach(char => {
    characters[char.id] = char;
});

function getCharactersInRoom(roomId) {
    return charactersData.filter(char => char.currentRoomId === roomId);
}
