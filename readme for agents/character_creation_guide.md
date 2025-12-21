# Character Creation Guidelines

When adding new characters to the MUD, follow these rules to ensure consistency, proper system integration, and rich atmospheric storytelling.

## 1. Character Definition
Characters are defined in `scenarios/<id>/characters.json` as an array of objects.

### JSON Structure
```json
{
    "id": "shopkeeper",
    "name": "Silas the Shopkeeper",
    "description": "A hunched figure ensuring the shelves are tidy...",
    "roomId": "shop",
    "color": "#DAA520",
    "secret": "HIDDEN: He knows where the key is...",
    "knowledge": ["shop_history", "town_rumors"]
}
```

## 2. Knowledge & Lore System
The **Lore System** allows granular distribution of world knowledge.
1.  **Define Lore**: In `lore.json`, define key-value pairs for specific topics.
    ```json
    {
        "shop_history": "The shop was built in 1802...",
        "town_rumors": "They say the well is haunted."
    }
    ```
2.  **Assign Knowledge**: In `characters.json`, add the **keys** to the character's `knowledge` array.
3.  **AI Injection**: When the AI constructs the prompt for this character, it will *only* inject the specific lore entries they know. This prevents "omniscient" NPCs.

## 2. Secrets & Reveal Logic
The `secret` field is crucial for the AI Director logic.
- **Hidden**: This text is NEVER shown to the player directly.
- **AI Knowledge**: It is injected into the character's AI prompt as "Secret Motivation".
- **Director Triggers**: If the character reveals this information in dialogue (e.g., "The path is to the East"), the Director AI will detect it and trigger game events (like revealing a hidden exit).

**CRITICAL RULE**: Write secrets in **pure natural language**. Do NOT use tags like `ROLE:`, `SECRET:`, or `MOTIVE:`. These confuse the AI. Write as if you are describing the character's mind to them.

**Example Secret:**
> "You know Silas has the Signet Ring hidden under his counter. You will reveal this if you are given a Ticket to escape."

## 3. Atmospheric Descriptions
Descriptions should be evocative and detailed (2-3 sentences). Avoid simple "It is a X." statements. Include:
- **Physical Traits**: Clothing condition, body type, age.
- **Mannerisms**: Fidgeting, staring, nervous ticks.
- **Emotional Vibe**: Terrified, arrogant, defeated.

**CRITICAL RULE**: Do not include spoken dialogue in the description (e.g., *He whispers "Help me"*). The description is strictly what the player SEES.

**Bad:**
> "A wealthy woman. She says 'Get away from me!'"

**Good:**
> "A wealthy traveler in extravagant, albeit muddy, finery. She holds a scented handkerchief to her nose and looks at the rustic goods with undisguised disdain. She seems personally offended by the dust."

## 4. Color Selection
Every character MUST have a unique, distinctive color for dialogue and logs.

| Role | Color Recommendation | Hex Example |
| :--- | :--- | :--- |
| **Noble/Rich** | Purples, Pinks | `#C71585` (Madam Pomp) |
| **Merchant** | Golds, Ambers | `#DAA520` |
| **Worker** | Greys, Earth Tones | `#708090` |
| **Mystical** | Cyans, Violets | `#00FFFF`, `#8A2BE2` |

## 5. Examples

### Madam Pomp (The Complainer)
```json
{
    "id": "pomp",
    "name": "Madam Pomp",
    "description": "A wealthy traveler in extravagant, albeit muddy, finery. She holds a scented handkerchief to her nose and looks at the rustic goods with undisguised disdain.",
    "roomId": "store",
    "color": "#C71585",
    "secret": "She is secretly looking for her lost pug.",
    "knowledge": ["noble_etiquette", "capital_gossip"]
}
```

### Old Tom (The Philosopher)
```json
{
    "id": "tom",
    "name": "Old Tom",
    "description": "An elderly man with a wild white beard, staring deeply into his mug as if it holds the secrets of the universe.",
    "roomId": "tavern",
    "color": "#8A2BE2",
    "secret": "He saw the ghost yesterday.",
    "knowledge": ["village_history", "ghost_sightings"]
}
```
