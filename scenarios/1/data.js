const SCENARIO_1_DATA = {
    id: 1,
    title: "The Missing Signet Ring",
    description: "A mystery in the village of Oakhaven.",
    introText: "You are a Royal Courier sent from the Capital to track down Lady Elara, who is suspected of ensuring the disappearance of the Royal Signet Ring.<br>Your pursuit has led you to the sleepy village of Oakhaven, where her trail has gone cold.<br>Find her, and retrieve the Ring at all costs.",

    rooms: SCENARIO_1_ROOMS,
    characters: SCENARIO_1_CHARACTERS,
    items: SCENARIO_1_ITEMS,

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
