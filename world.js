class Room {
    constructor(id, name, description, exits = {}, hiddenExits = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.exits = exits; // map of direction -> roomId
        this.hiddenExits = hiddenExits; // Exits revealed by Director
    }
}

const worldData = [
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
];

// Index for easy lookup
const world = {};
worldData.forEach(room => {
    world[room.id] = room;
});
