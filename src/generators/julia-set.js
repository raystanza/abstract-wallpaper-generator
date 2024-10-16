const { getRandomPaletteColor } = require('../utils');

function drawJuliaSet(ctx, width, height, shapes, shapeTypes, colorPalette) {
    const imageData = ctx.createImageData(width, height);
    const maxIterations = 100;

    // Define the viewport in the complex plane
    const xmin = -1.5;
    const xmax = 1.5;
    const ymin = -1;
    const ymax = 1;

    // Julia constant c (you can allow user to input these values)
    const cRe = -0.7;
    const cIm = 0.27015;

    for (let px = 0; px < width; px++) {
        for (let py = 0; py < height; py++) {
            // Map pixel to complex plane
            let x = xmin + (xmax - xmin) * px / width;
            let y = ymin + (ymax - ymin) * py / height;

            let iteration = 0;

            while (x * x + y * y <= 4 && iteration < maxIterations) {
                const xTemp = x * x - y * y + cRe;
                y = 2 * x * y + cIm;
                x = xTemp;
                iteration++;
            }

            // Set pixel color based on iteration count
            const index = (py * width + px) * 4;
            if (iteration === maxIterations) {
                // Inside the Julia set: color it black
                imageData.data[index] = 0;
                imageData.data[index + 1] = 0;
                imageData.data[index + 2] = 0;
                imageData.data[index + 3] = 255;
            } else {
                // Outside the Julia set: color it based on iteration
                const hue = (iteration / maxIterations) * 360;
                const [r, g, b] = hslToRgb(hue / 360, 1, 0.5);
                imageData.data[index] = r;
                imageData.data[index + 1] = g;
                imageData.data[index + 2] = b;
                imageData.data[index + 3] = 255;
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
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

module.exports = drawJuliaSet;
