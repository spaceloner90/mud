class Item {
    constructor(id, name, description, holderId, isHidden = false) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.holderId = holderId; // can be a roomId or characterId
        this.isHidden = isHidden;
    }
}

const itemsData = [
    new Item(
        'hammer',
        'Heavy Hammer',
        'Grum\'s favorite forging hammer. It feels heavy with purpose.',
        'ghost' // Held by Ghost
    ),
    new Item(
        'shield',
        'Iron Shield',
        'A sturdy shield bearing the village crest. A symbol of protection.',
        'grum' // Held by Grum
    ),
    new Item(
        'ticket',
        'Wagon Ticket',
        'A stamped parchment granting passage on the next supply wagon.',
        'innkeeper' // Held by Bartholomew
    ),
    new Item(
        'locket',
        'Family Locket',
        'A silver locket containing a portrait of the King. Proof of identity.',
        'noble' // Held by Elara
    ),
    new Item(
        'signet_ring',
        'Royal Signet Ring',
        'A heavy gold ring bearing the crest of the King.',
        'shopkeeper', // Held by Silas
        true // Hidden!
    ),
    new Item(
        'duckie',
        'Rubber Duckie',
        'A bright yellow rubber duckie. It squeaks if you squeeze it.',
        'player'
    ),
    new Item(
        'bell',
        'Brass Bell',
        'The Town Crier\'s trusty bell. It is polished to a shine.',
        'crier'
    ),
    new Item(
        'tankard',
        'Empty Tankard',
        'A wooden tankard stained with ale. It smells faintly of hops.',
        'tavern'
    ),
    new Item(
        'horseshoe',
        'Rusty Horseshoe',
        'A discarded piece of iron. Legends say it brings good luck.',
        'blacksmith'
    ),
    new Item(
        'apple',
        'Red Apple',
        'A shiny red apple. It looks crisp and delicious.',
        'store'
    )
];

const items = {};
itemsData.forEach(item => {
    items[item.id] = item;
});

function getItemsByHolder(holderId) {
    return itemsData.filter(item => item.holderId === holderId);
}
