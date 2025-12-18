const SCENARIO_1_DATA = {
    id: 1,
    title: "The Missing Signet Ring",
    description: "A mystery in the village of Oakhaven.",
    introText: "You are a Royal Courier sent from the Capital to track down Lady Elara, who is suspected of ensuring the disappearance of the Royal Signet Ring.<br>Your pursuit has led you to the sleepy village of Oakhaven, where her trail has gone cold.<br>Find her, and retrieve the Ring at all costs.",

    rooms: [
        new Room(
            'square',
            'Village Square',
            'The heart of the village feels unusually tense. Villagers hurry by, casting nervous glances at the sky where dark clouds gather. A dry fountain stands in the center, its stone basin filled with dead leaves. To the [north] is the road out. To the [west] is the Golden Tankard Tavern. To the [east] is the silent Blacksmith. To the [south] the forest road awaits.',
            { north: 'road_north', west: 'tavern', east: 'blacksmith', south: 'road_south' }
        ),
        new Room(
            'tavern',
            'The Golden Tankard',
            'A warm fire tries to fight the gloom, but the shadows in the corners seem to lengthen. The air smells of stale ale and woodsmoke. Outside the window, a sturdy supply wagon is being prepared for departure, but the horses look nervous and skittish. The exit is [east] to the square.',
            { east: 'square' }
        ),
        new Room(
            'blacksmith',
            'Blacksmith',
            'The forge is cold and silent, a stark contrast to its usual roar. Layers of dust have settled on the heavy iron anvils. A half-finished shield lies forgotten on the workbench, waiting for a master\'s touch that may never come. The way out is [west].',
            { west: 'square' }
        ),
        new Room(
            'road_north',
            'Village Road (North)',
            'The road stretches out towards the distant mountains, winding its way towards the Capital. Freedom lies this way, but the path is blocked by a heavy checkpoint gate. You cannot leave without proper authorization or the Royal Signet Ring. The village square is to the [south]. A general store stands to the [west].',
            { south: 'square', west: 'store' }
        ),
        new Room(
            'road_south',
            'Village Road (South)',
            'The road becomes a dirt path here, rutted by years of wagon wheels. It leads towards the dark, imposing treeline of the forest [south]. The wind howls mournfully through the trees. The village square is [north].',
            { north: 'square', south: 'forest_edge' }
        ),
        new Room(
            'forest_edge',
            'Forest Edge',
            'The trees loom tall and dark here, their branches entangling like skeletal fingers blocking the sky. The air is noticeably cooler and smells of damp earth and decay. A path leads deeper [south] into the dangerous woods, or you can retreat [north] to the safety of the village.',
            { north: 'road_south', south: 'forest_path' }
        ),
        new Room(
            'forest_path',
            'Forest Path',
            'Twisted roots cover the ground, making every step treacherous. You hear strange mutterings and soft weeping coming from the shadows ahead. The path continues [south], or you can turn back [north].',
            { north: 'forest_edge', south: 'clearing' }
        ),
        new Room(
            'store',
            'General Store',
            'Shelves are stocked with supplies, but the atmosphere is heavy with secrets. The scent of dried herbs and old parchment fills the air. The shopkeeper seems busy organizing travel supplies, constantly checking the door. The exit is [east] to the road.',
            { east: 'road_north' }
        ),
        new Room(
            'clearing',
            'Forest Clearing',
            'A small open circle of grass in the deep woods. The air is thick with sadness and a supernatural chill. An ancient stone marker stands here, weathered by centuries of rain. Paths lead [north] back to safety.',
            { north: 'forest_path', west: 'cave_entrance' },
            { east: 'grove' } // Hidden!
        ),
        new Room(
            'grove',
            'Ancient Grove',
            'A place of old magic, untouched by the gloom affecting the rest of the forest. Soft motes of light dance in the air, and the trees here seem to watch you with benevolent eyes. It feels like a sanctuary. Return [west] to the clearing.',
            { west: 'clearing' }
        ),
        new Room(
            'cave_entrance',
            'Cave Entrance',
            'A gaping maw in the rock face, breathing out cold, damp air. Water drips somewhere deep within, echoing endlessly. It looks too dangerous to enter without a light source. You can go back [east].',
            { east: 'clearing' }
        )
    ],

    characters: [
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
    ],

    items: [
        new Item('hammer', 'Heavy Hammer', 'Grum\'s favorite forging hammer. It feels heavy with purpose.', 'ghost'),
        new Item('shield', 'Iron Shield', 'A sturdy shield bearing the village crest. A symbol of protection.', 'grum'),
        new Item('ticket', 'Wagon Ticket', 'A stamped parchment granting passage on the next supply wagon.', 'innkeeper'),
        new Item('locket', 'Family Locket', 'A silver locket containing a portrait of the King. Proof of identity.', 'noble'),
        new Item('signet_ring', 'Royal Signet Ring', 'A heavy gold ring bearing the crest of the King.', 'shopkeeper', true),
        new Item('duckie', 'Rubber Duckie', 'A bright yellow rubber duckie. It squeaks if you squeeze it.', 'player'),
        new Item('bell', 'Brass Bell', 'The Town Crier\'s trusty bell. It is polished to a shine.', 'crier'),
        new Item('tankard', 'Empty Tankard', 'A wooden tankard stained with ale. It smells faintly of hops.', 'tavern'),
        new Item('horseshoe', 'Rusty Horseshoe', 'A discarded piece of iron. Legends say it brings good luck.', 'blacksmith'),
        new Item('apple', 'Red Apple', 'A shiny red apple. It looks crisp and delicious.', 'store')
    ],

    secrets: {
        'grove_path': {
            id: 'grove_path',
            description: 'The path to the Ancient Grove lies East from the Clearing. Known by the Ghost.',
            resolved: false,
            revealFunc: (game) => game.revealExit('clearing', 'east')
        },
        'signet_ring': {
            id: 'signet_ring',
            description: 'Silas is hiding the Royal Signet Ring under the counter. Known by Lady Elara.',
            resolved: false,
            revealFunc: (game) => game.revealItem('signet_ring')
        }
    }
};
