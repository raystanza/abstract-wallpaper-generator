const { getRandomPaletteColor } = require('../utils');

function drawMandelbrotSet(ctx, width, height, shapes, shapeTypes, colorPalette) {
    const imageData = ctx.createImageData(width, height);
    
    // Randomize maxIterations for more or less detail
    const maxIterations = 500 + Math.floor(Math.random() * 1500); // Between 500 and 2000 iterations
    
    // Randomize the zoom factor more significantly
    const zoomFactor = Math.random() * 10 + 1;  // Random zoom between 1 and 11

    // Array of interesting regions
    const regions = [
        { xCenter: -0.7435, yCenter: 0.1319 },    // Interesting region 1
        { xCenter: 0.001643721971153, yCenter: 0.822467633298876 },  // Interesting region 2
        { xCenter: -1.25066, yCenter: 0.02012 },   // Interesting region 3
        { xCenter: -1.401155, yCenter: 0 },        // Near cusp
        { xCenter: -0.8, yCenter: 0.156 },         // Another region with detail
        { xCenter: -0.77568377, yCenter: 0.13646737 }, // Seahorse valley
        { xCenter: -0.100346289184, yCenter: 0.838186973964 }, // Another interesting edge
        { xCenter: -0.7269, yCenter: 0.1889 },     // Close-up region with fine structure
        { xCenter: -0.748, yCenter: 0.1 },         // Well-known boundary point
        { xCenter: -0.5, yCenter: 0.5 },           // Near the main bulb
        { xCenter: -0.775, yCenter: 0.137 },       // Seahorse tail
        { xCenter: -1.25, yCenter: 0 },            // Near antennae
        { xCenter: -0.745, yCenter: 0.113 },       // Edge of Seahorse valley
        { xCenter: -1.308, yCenter: 0.045 },       // Tip of the antenna
        { xCenter: -1.01, yCenter: 0.31 },         // Interesting edge region
        { xCenter: 0.34, yCenter: 0.05 },          // Near the "needle"
        { xCenter: -1.768, yCenter: 0.004 },       // Interesting far edge
        { xCenter: -1.15, yCenter: 0.27 },         // Around the outer spiral
        { xCenter: -0.75, yCenter: 0.065 },        // Seahorse close-up
        { xCenter: 0.37, yCenter: 0.03 },          // Needle-point zoom
        { xCenter: -0.74529, yCenter: 0.113075 },  // Seahorse head
        { xCenter: -0.775683, yCenter: 0.136467 }, // Seahorse valley zoomed
        { xCenter: -1.76, yCenter: -0.0004 },      // Outer tendril
        { xCenter: 0.001308, yCenter: -0.003 },    // "Valley of the elephants"
        { xCenter: -0.101, yCenter: 0.838 },       // Another edge of the main bulb
        { xCenter: -0.17, yCenter: 1.03 },         // Far zoom above main set
        { xCenter: -0.82, yCenter: 0.201 },        // Further zoom on Seahorse valley
        { xCenter: -1.2, yCenter: -0.35 },         // Another outer spiral
        { xCenter: 0.32, yCenter: 0.06 },          // Close to the needle tip
        { xCenter: -0.74, yCenter: 0.12 },         // Another fine detail region
        { xCenter: -0.72, yCenter: 0.225 },        // Close to interesting boundary points
        { xCenter: -1.99, yCenter: 0 },            // Deep zoom in outer spiral
        { xCenter: 0.285, yCenter: 0.01 },         // Close to the "elephant valley"
        { xCenter: -0.74, yCenter: 0.105 },        // Fine structure on Seahorse valley
        { xCenter: 0.0016, yCenter: 0.822 },       // Another zoom near "valley of elephants"
        { xCenter: -1.4, yCenter: -0.0 },          // Around the antenna
        { xCenter: -0.38, yCenter: 0.67 },         // Zoom into a fine spiral
        { xCenter: -0.8, yCenter: 0.2 },           // More Seahorse valley exploration
        { xCenter: -1.19, yCenter: -0.3 },         // Deep in a spiral arm
        { xCenter: -1.77, yCenter: 0.003 },        // Fine tendrils of the set
        { xCenter: -1.26, yCenter: 0.02 },         // Outer edge spiral
        { xCenter: -1.31, yCenter: 0.02 },         // Further exploration around the antenna
        { xCenter: 0.28, yCenter: 0.01 },          // Interesting boundary point
        { xCenter: -0.89, yCenter: 0.22 },         // Seahorse close-up
        { xCenter: -1.001, yCenter: 0.310 },       // Near outer boundary of main set
    ];

    // Pick a random region from the array
    const randomRegion = regions[Math.floor(Math.random() * regions.length)];
    const { xCenter, yCenter } = randomRegion;

    const rangeX = (3.5 / zoomFactor);
    const rangeY = (2.0 / zoomFactor);
    
    const xmin = xCenter - rangeX / 2;
    const xmax = xCenter + rangeX / 2;
    const ymin = yCenter - rangeY / 2;
    const ymax = yCenter + rangeY / 2;

    // Prepare color for the Mandelbrot set
    const paletteColor = getRandomPaletteColor(colorPalette);
    const rgbColor = hexToRgb(paletteColor);
    
    // Generate a random solid background color for outside the set
    const randomBgColor = {
        r: Math.floor(Math.random() * 256), 
        g: Math.floor(Math.random() * 256), 
        b: Math.floor(Math.random() * 256)
    };

    // Loop through the pixels
    for (let px = 0; px < width; px++) {
        for (let py = 0; py < height; py++) {
            // Map pixel to complex plane
            const x0 = xmin + (xmax - xmin) * px / width;
            const y0 = ymin + (ymax - ymin) * py / height;

            let x = 0;
            let y = 0;
            let iteration = 0;

            while (x * x + y * y <= 4 && iteration < maxIterations) {
                const xTemp = x * x - y * y + x0;
                y = 2 * x * y + y0;
                x = xTemp;
                iteration++;
            }

            // Set pixel color based on iteration count
            const index = (py * width + px) * 4;
            if (iteration === maxIterations) {
                // Inside the Mandelbrot set: use the palette color
                imageData.data[index] = rgbColor.r;
                imageData.data[index + 1] = rgbColor.g;
                imageData.data[index + 2] = rgbColor.b;
                imageData.data[index + 3] = 255;
            } else {
                // Outside the Mandelbrot set: use the random solid background color
                imageData.data[index] = randomBgColor.r;
                imageData.data[index + 1] = randomBgColor.g;
                imageData.data[index + 2] = randomBgColor.b;
                imageData.data[index + 3] = 255;
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

// Helper functions
function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map((char) => char + char).join('');
    }
    const bigint = parseInt(hex, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
    };
}

function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // Achromatic
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

module.exports = drawMandelbrotSet;
