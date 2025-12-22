const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 1. Load Environment (Mocks)
require('./env');

// 2. Load Game Scripts
const loadScript = (filename) => {
    const filePath = path.join(__dirname, '..', filename);
    let code = fs.readFileSync(filePath, 'utf8');

    // PATCH: Expose 'scenarios' globally for test visibility
    if (filename === 'scenarios.js') {
        console.log('[TEST] Patching scenarios.js for global visibility...');
        code = code.replace('const scenarios =', 'global.scenarios =');
    }

    vm.runInThisContext(code, { filename });
};

console.log('[TEST] Loading Game Engine...');
try {
    loadScript('models/models.js'); // Ensure this file exists
    loadScript('ai.js');
    loadScript('input_handler.js');
    loadScript('coordinator.js');
    loadScript('scenarios.js');
    loadScript('game.js');
    console.log('[TEST] Game Engine Loaded.');
} catch (err) {
    console.error('[TEST] Failed to load game scripts:', err);
    process.exit(1);
}

// 3. Helper for Async Test Execution
const runTests = async () => {
    const testDir = path.join(__dirname, 'specs');
    if (!fs.existsSync(testDir)) {
        console.error('[TEST] No specs directory found.');
        return;
    }

    const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.js'));

    // Check for arguments to filter tests
    const specificTest = process.argv[2];
    const filesToRun = specificTest
        ? testFiles.filter(f => f.includes(specificTest))
        : testFiles;

    console.log(`[TEST] Found ${filesToRun.length} test specs (Total available: ${testFiles.length}).`);

    let passed = 0;
    let failed = 0;

    for (const file of filesToRun) {
        console.log(`\n[TEST] Running ${file}...`);
        try {
            const testCode = fs.readFileSync(path.join(testDir, file), 'utf8');
            await vm.runInThisContext(`(async () => {
                try {
                     ${testCode}
                } catch (e) { throw e; }
            })()`, { filename: file });
            console.log(`[PASS] ${file}`);
            passed++;
        } catch (err) {
            console.error(`[FAIL] ${file}`);
            console.error(`Error in ${file}:`);
            console.error(err);
            fs.appendFileSync(path.join(__dirname, 'test_errors.log'), `\n[FAIL] ${file}\n${err.stack || err}\n`);
            failed++;
        }
    }

    console.log('\n---------------------------------------------------');
    console.log(`Tests Completed. Passed: ${passed}, Failed: ${failed}`);
    if (failed > 0) process.exit(1);
};

runTests();
