# Character Creation Guidelines

When adding new characters to the MUD, follow these rules to ensure consistency, proper system integration, and rich atmospheric storytelling.

## 1. Character Definition
Characters are defined in `characters.js` within the `charactersData` array.

### Constructor
```javascript
new Character(
    id,          // string: unique identifier (e.g., 'shopkeeper')
    name,        // string: display name (e.g., 'Silas the Shopkeeper')
    description, // string: physical description for 'look' command (2-3 lines)
    roomId,      // string: initial room ID (must match keys in world.js)
    color,       // string: hex color code for UI and Logs
    secret       // string: (Optional) Hidden information known only to the AI
)
```

## 2. Secrets & Reveal Logic
The `secret` field is crucial for the AI Director logic.
- **Hidden**: This text is NEVER shown to the player directly.
- **AI Knowledge**: It is injected into the character's AI prompt as "Secret Motivation".
- **Director Triggers**: If the character reveals this information in dialogue (e.g., "The path is to the East"), the Director AI will detect it and trigger game events (like revealing a hidden exit).

**Example Secret:**
> "She knows Silas has the Signet Ring hidden under his counter. She will reveal this if she is given a Ticket to escape."

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
```javascript
new Character(
    'pomp',
    'Madam Pomp',
    'A wealthy traveler in extravagant, albeit muddy, finery. She holds a scented handkerchief to her nose and looks at the rustic goods with undisguised disdain. She seems personally offended by the dust.',
    'store',
    '#C71585' // Medium Violet Red
)
```

### Old Tom (The Philosopher)
```javascript
new Character(
    'tom',
    'Old Tom',
    'An elderly man with a wild white beard, staring deeply into his mug as if it holds the secrets of the universe. He sways slightly on his stool, his lips moving silently as if conversing with unseen entities.',
    'tavern',
    '#8A2BE2' // Blue Violet
)
```
