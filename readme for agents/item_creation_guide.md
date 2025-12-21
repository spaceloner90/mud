# Item Creation Guidelines

Items are physical objects in the game world. They are defined in `scenarios/<id>/items.json`.

## 1. JSON Structure
```json
{
    "id": "rusty_key",
    "name": "Rusty Key",
    "description": "An old iron key covered in rust flakes.",
    "startLocation": "dungeon_cell",
    "isSecret": false,
    "isStatic": false,
    "staticMessage": ""
}
```

## 2. Properties defined

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | string | Unique identifier for the item. |
| `name` | string | Display name shown in inventory and room descriptions. |
| `description` | string | Text shown when the player `look`s at the item. |
| `startLocation` | string | The `roomId` where the item starts. |
| `isSecret` | boolean | If `true`, the item is hidden until revealed (e.g., by a search or Director event). |
| `isStatic` | boolean | **NEW**: If `true`, the item CANNOT be picked up (e.g., heavy furniture, bodies). |
| `staticMessage` | string | **NEW**: The message shown when a player tries to `get` a static item. |

## 3. Static Items
Use `isStatic` for items that are important for the narrative or "lookable" details but shouldn't be carried.

**Example: A Corpse**
```json
{
    "id": "corpse",
    "name": "Body of Lord Blackwood",
    "description": "The cold, lifeless body...",
    "startLocation": "library",
    "isStatic": true,
    "staticMessage": "You shouldn't tamper with the crime scene."
}
```
Attempting `get body` will print: "You shouldn't tamper with the crime scene."

**Example: Heavy Furniture**
```json
{
    "id": "grand_piano",
    "name": "Grand Piano",
    "description": "A magnificent Steinway...",
    "startLocation": "ballroom",
    "isStatic": true,
    "staticMessage": "It's far too heavy to move."
}
```
