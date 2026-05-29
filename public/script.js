const paletteColors = {
    mixed: ['#F1C40F', '#E67E22', '#16A085', '#2980B9', '#D35400'],
    warm: ['#FF5733', '#C70039', '#900C3F', '#581845', '#FFC300'],
    cool: ['#3498DB', '#2ECC71', '#1ABC9C', '#E74C3C', '#8E44AD'],
    sunrise: ['#FF5F6D', '#FFC371', '#FF9A8B', '#FF6A88', '#FFB19A'],
    sunset: ['#FF4E50', '#FC913A', '#F9D423', '#EDE574', '#E1F5C4'],
    forest: ['#004d00', '#336600', '#4d9900', '#66cc00', '#b3ff66'],
    ocean: ['#005f99', '#33ccff', '#66d9ff', '#b3ecff', '#e6f9ff'],
    pastel: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF'],
    neon: ['#FF6EC7', '#FFD700', '#FF4500', '#7FFF00', '#7FFFD4'],
    earth: ['#A0522D', '#CD853F', '#DEB887', '#F5DEB3', '#FFF8DC'],
    galaxy: ['#2E2B5F', '#3626A7', '#4B3CF7', '#7055F1', '#9278F1'],
    candy: ['#FF6347', '#FFD700', '#FF69B4', '#FF1493', '#FF4500'],
};

const shapeTypes = [
    'circle',
    'rectangle',
    'triangle',
    'hexagon',
    'rhombus',
    'star',
    'spiral',
    'ellipse',
    'pentagon',
    'heart',
    'diamond',
    'cross',
    'arrow',
    'parallelogram',
    'trapezoid',
    'wave',
    'zigzag',
];

const fallbackGenerators = [
    {
        id: 'shapes',
        name: 'Shapes',
        description: 'Layered geometric shapes with randomized size, position, and palette color.',
        category: 'geometry',
        parameters: [{ id: 'shapes' }, { id: 'shapeTypes' }],
    },
];

const state = {
    generators: fallbackGenerators,
    previewUrl: null,
};

const elements = {
    form: document.getElementById('wallpaperForm'),
    generatorSelect: document.getElementById('generationType'),
    generatorDescription: document.getElementById('generatorDescription'),
    generatorCategory: document.getElementById('generatorCategory'),
    resolutionPreset: document.getElementById('resolutionPreset'),
    width: document.getElementById('width'),
    height: document.getElementById('height'),
    colorPalette: document.getElementById('colorPalette'),
    paletteSwatches: document.getElementById('paletteSwatches'),
    densityRange: document.getElementById('densityRange'),
    shapes: document.getElementById('shapes'),
    shapeTypeGroup: document.getElementById('shapeTypeGroup'),
    shapeTypeOptions: document.getElementById('shapeTypeOptions'),
    seed: document.getElementById('seed'),
    randomSeedButton: document.getElementById('randomSeedButton'),
    formError: document.getElementById('formError'),
    generateButton: document.getElementById('generateButton'),
    generateButtonText: document.getElementById('generateButtonText'),
    previewTitle: document.getElementById('previewTitle'),
    preview: document.getElementById('preview'),
    emptyState: document.getElementById('emptyState'),
    downloadLink: document.getElementById('downloadLink'),
    statusGenerator: document.getElementById('statusGenerator'),
    statusResolution: document.getElementById('statusResolution'),
    statusPalette: document.getElementById('statusPalette'),
    statusSeed: document.getElementById('statusSeed'),
    statusTime: document.getElementById('statusTime'),
};

function titleCase(value) {
    return value
        .split(/[-\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getSelectedGenerator() {
    return state.generators.find((generator) => generator.id === elements.generatorSelect.value) || state.generators[0];
}

function generatorHasParameter(generator, parameterId) {
    return Boolean(generator.parameters?.some((parameter) => parameter.id === parameterId));
}

function setError(message) {
    elements.formError.textContent = message || '';
}

function setLoading(isLoading) {
    elements.generateButton.disabled = isLoading;
    elements.generateButton.classList.toggle('is-loading', isLoading);
    elements.generateButtonText.textContent = isLoading ? 'Generating' : 'Generate';
}

function updateSwatches() {
    const colors = paletteColors[elements.colorPalette.value] || paletteColors.mixed;
    elements.paletteSwatches.replaceChildren(
        ...colors.map((color) => {
            const swatch = document.createElement('span');
            swatch.style.backgroundColor = color;
            return swatch;
        })
    );
}

function renderShapeOptions() {
    const selectedDefaults = new Set(['circle', 'rectangle', 'triangle', 'hexagon', 'star', 'spiral']);

    elements.shapeTypeOptions.replaceChildren(
        ...shapeTypes.map((shapeType) => {
            const label = document.createElement('label');
            label.className = 'shape-option';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.name = 'shapeTypes';
            input.value = shapeType;
            input.checked = selectedDefaults.has(shapeType);

            const text = document.createElement('span');
            text.textContent = titleCase(shapeType);

            label.append(input, text);
            return label;
        })
    );
}

function renderGeneratorOptions() {
    elements.generatorSelect.replaceChildren(
        ...state.generators.map((generator) => {
            const option = document.createElement('option');
            option.value = generator.id;
            option.textContent = generator.name;
            return option;
        })
    );
}

function syncGeneratorControls() {
    const generator = getSelectedGenerator();
    const supportsShapeTypes = generatorHasParameter(generator, 'shapeTypes');
    const densityParameter = generator.parameters?.find((parameter) => parameter.id === 'shapes');

    elements.generatorDescription.textContent = generator.description || '';
    elements.generatorCategory.textContent = generator.category || 'generator';
    elements.shapeTypeGroup.hidden = !supportsShapeTypes;

    if (densityParameter?.max) {
        elements.densityRange.max = Math.min(Number(densityParameter.max), 500);
        elements.shapes.max = densityParameter.max;
    }

    if (densityParameter?.defaultValue && document.activeElement !== elements.shapes) {
        elements.shapes.value = densityParameter.defaultValue;
        elements.densityRange.value = Math.min(densityParameter.defaultValue, elements.densityRange.max);
    }

    elements.statusGenerator.textContent = generator.name;
}

function syncResolutionPreset() {
    const value = elements.resolutionPreset.value;

    if (value === 'custom') {
        return;
    }

    const [width, height] = value.split('x');
    elements.width.value = width;
    elements.height.value = height;
    updateStatus();
}

function syncCustomResolutionState() {
    const current = `${elements.width.value}x${elements.height.value}`;
    const matchingPreset = Array.from(elements.resolutionPreset.options).find((option) => option.value === current);
    elements.resolutionPreset.value = matchingPreset ? matchingPreset.value : 'custom';
    updateStatus();
}

function syncDensityInputs(source) {
    if (source === 'range') {
        elements.shapes.value = elements.densityRange.value;
    } else {
        const value = Math.max(1, Math.min(Number(elements.shapes.value || 1), Number(elements.shapes.max || 5000)));
        elements.densityRange.value = Math.min(value, Number(elements.densityRange.max));
    }
}

function generateSeed() {
    const randomValues = new Uint32Array(2);
    crypto.getRandomValues(randomValues);
    return Array.from(randomValues, (value) => value.toString(36)).join('-');
}

function validateForm() {
    const width = Number(elements.width.value);
    const height = Number(elements.height.value);
    const shapes = Number(elements.shapes.value);
    const selectedShapeTypes = getSelectedShapeTypes();

    if (!Number.isInteger(width) || width < 128 || width > 7680) {
        return 'Width must be between 128 and 7680 pixels.';
    }

    if (!Number.isInteger(height) || height < 128 || height > 4320) {
        return 'Height must be between 128 and 4320 pixels.';
    }

    if (!Number.isInteger(shapes) || shapes < 1 || shapes > 5000) {
        return 'Detail must be between 1 and 5000.';
    }

    if (!elements.shapeTypeGroup.hidden && selectedShapeTypes.length === 0) {
        return 'Select at least one shape type.';
    }

    if (elements.seed.value.length > 128) {
        return 'Seed must be 128 characters or fewer.';
    }

    return '';
}

function getSelectedShapeTypes() {
    return Array.from(elements.shapeTypeOptions.querySelectorAll('input[type="checkbox"]:checked')).map(
        (input) => input.value
    );
}

function createRequestBody() {
    const params = new URLSearchParams();
    params.set('width', elements.width.value);
    params.set('height', elements.height.value);
    params.set('shapes', elements.shapes.value);
    params.set('colorPalette', elements.colorPalette.value);
    params.set('generationType', elements.generatorSelect.value);

    if (elements.seed.value.trim()) {
        params.set('seed', elements.seed.value.trim());
    }

    const selectedShapeTypes = getSelectedShapeTypes();
    const shapeValues = selectedShapeTypes.length > 0 ? selectedShapeTypes : ['circle', 'rectangle'];
    shapeValues.forEach((shapeType) => params.append('shapeTypes', shapeType));

    return params;
}

function revokePreviewUrl() {
    if (state.previewUrl) {
        URL.revokeObjectURL(state.previewUrl);
        state.previewUrl = null;
    }
}

function updateDownload(blobUrl) {
    const generator = getSelectedGenerator();
    const seed = elements.seed.value.trim() || 'auto';
    const filename = `${generator.id}_${elements.width.value}x${elements.height.value}_${seed}.png`;

    elements.downloadLink.href = blobUrl;
    elements.downloadLink.download = filename.replace(/[^a-zA-Z0-9._-]+/g, '-');
    elements.downloadLink.classList.remove('is-disabled');
    elements.downloadLink.setAttribute('aria-disabled', 'false');
}

function updateStatus(elapsedMs) {
    const generator = getSelectedGenerator();
    elements.statusGenerator.textContent = generator.name;
    elements.statusResolution.textContent = `${elements.width.value || '-'} x ${elements.height.value || '-'}`;
    elements.statusPalette.textContent =
        elements.colorPalette.options[elements.colorPalette.selectedIndex]?.textContent || elements.colorPalette.value;
    elements.statusSeed.textContent = elements.seed.value.trim() || 'Auto';

    if (elapsedMs !== undefined) {
        elements.statusTime.textContent = `${(elapsedMs / 1000).toFixed(2)}s`;
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
        setError(validationError);
        return;
    }

    const startedAt = performance.now();
    const generator = getSelectedGenerator();
    setLoading(true);
    elements.previewTitle.textContent = `Generating ${generator.name}`;

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: createRequestBody(),
        });

        const contentType = response.headers.get('content-type') || '';

        if (!response.ok) {
            if (contentType.includes('application/json')) {
                const errorPayload = await response.json();
                throw new Error(errorPayload.details?.join(' ') || errorPayload.error || 'Generation failed.');
            }

            throw new Error(await response.text());
        }

        const blob = await response.blob();
        revokePreviewUrl();
        state.previewUrl = URL.createObjectURL(blob);

        elements.preview.src = state.previewUrl;
        elements.preview.hidden = false;
        elements.emptyState.hidden = true;
        elements.previewTitle.textContent = generator.name;
        updateDownload(state.previewUrl);
        updateStatus(performance.now() - startedAt);
    } catch (error) {
        setError(error.message || 'Generation failed.');
        elements.previewTitle.textContent = 'Generation failed';
    } finally {
        setLoading(false);
    }
}

async function loadGenerators() {
    try {
        const response = await fetch('/api/generators');

        if (!response.ok) {
            throw new Error('Generator metadata request failed.');
        }

        const data = await response.json();
        state.generators = data.generators?.length ? data.generators : fallbackGenerators;
    } catch (error) {
        setError('Using local generator defaults because metadata could not load.');
    }

    renderGeneratorOptions();
    syncGeneratorControls();
    updateStatus();
}

function bindEvents() {
    elements.form.addEventListener('submit', handleSubmit);
    elements.generatorSelect.addEventListener('change', () => {
        syncGeneratorControls();
        updateStatus();
    });
    elements.resolutionPreset.addEventListener('change', syncResolutionPreset);
    elements.width.addEventListener('input', syncCustomResolutionState);
    elements.height.addEventListener('input', syncCustomResolutionState);
    elements.colorPalette.addEventListener('change', () => {
        updateSwatches();
        updateStatus();
    });
    elements.densityRange.addEventListener('input', () => syncDensityInputs('range'));
    elements.shapes.addEventListener('input', () => syncDensityInputs('number'));
    elements.seed.addEventListener('input', () => updateStatus());
    elements.randomSeedButton.addEventListener('click', () => {
        elements.seed.value = generateSeed();
        updateStatus();
    });
    window.addEventListener('beforeunload', revokePreviewUrl);
}

function init() {
    renderShapeOptions();
    updateSwatches();
    bindEvents();
    loadGenerators();
}

init();
