function hashSeed(seed) {
    const seedText = String(seed);
    let hash = 1779033703 ^ seedText.length;

    for (let i = 0; i < seedText.length; i++) {
        hash = Math.imul(hash ^ seedText.charCodeAt(i), 3432918353);
        hash = (hash << 13) | (hash >>> 19);
    }

    return () => {
        hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
        hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
        return (hash ^= hash >>> 16) >>> 0;
    };
}

function createSeededRandom(seed) {
    const seedFactory = hashSeed(seed);
    let state = seedFactory();

    return () => {
        state += 0x6D2B79F5;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

function createRandomSeed() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function withSeededMathRandom(seed, task) {
    if (!seed) {
        return task();
    }

    const originalRandom = Math.random;
    Math.random = createSeededRandom(seed);

    try {
        return await task();
    } finally {
        Math.random = originalRandom;
    }
}

module.exports = {
    createRandomSeed,
    createSeededRandom,
    withSeededMathRandom,
};

