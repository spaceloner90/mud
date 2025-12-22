const fs = require('fs');
const path = require('path');

// Mock localStorage
const localStorage = {
    _data: {},
    getItem: (key) => localStorage._data[key] || null,
    setItem: (key, val) => localStorage._data[key] = val,
    removeItem: (key) => delete localStorage._data[key],
    clear: () => localStorage._data = {}
};

// Mock Element for Output/Input
class MockElement {
    constructor(id) {
        this.id = id;
        this.classList = {
            add: (cls) => { },
            remove: (cls) => { },
            contains: (cls) => false,
            toggle: (cls) => { }
        };
        this.value = '0'; // Default to '0' to avoid NaN in parseInt
        this.textContent = '';
        this.innerHTML = '';
        this.scrollTop = 0;
        this.scrollHeight = 100;
        this.children = [];
    }

    addEventListener(event, callback) { }
    removeEventListener(event, callback) { }
    appendChild(child) { this.children.push(child); }
    focus() { }
    closest() { return null; }
}

// Mock Document
const document = {
    getElementById: (id) => new MockElement(id),
    createElement: (tag) => new MockElement('created_' + tag),
    addEventListener: () => { }
};

// Mock Window
const window = {
    API_KEY: 'TEST_KEY',
    onload: null,
    localStorage: localStorage
};

// Mock Fetch
// Intercepts requests to local 'scenarios/...' and reads file system
const fetch = async (url, options) => {
    // console.log(`[TEST] Fetching: ${url}`);

    // Parse URL (e.g. scenarios/1/data.json?t=...)
    let cleanUrl = url.split('?')[0];

    // Safety check: prevent reading outside workspace
    // Assuming run from root
    if (cleanUrl.startsWith('scenarios/')) {
        const filePath = path.join(__dirname, '..', cleanUrl);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return {
                ok: true,
                json: async () => JSON.parse(content),
                text: async () => content
            };
        } catch (err) {
            console.error(`[TEST] Failed to read file: ${filePath}`);
            return { ok: false, status: 404, statusText: 'Not Found' };
        }
    }

    // Mock generic API calls (Gemini)
    if (url.includes('generativelanguage.googleapis.com')) {
        return {
            ok: true,
            json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ action: 'wait' }) }] } }] })
        };
    }

    return { ok: false, status: 404 };
};

// Expose globals for the game scripts
global.document = document;
global.window = window;
global.localStorage = localStorage;
global.fetch = fetch;
global.API_KEY = 'TEST_KEY';
global.HTMLElement = MockElement; // For instanceof checks if any
