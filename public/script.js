document.getElementById('wallpaperForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    // Get the button element
    const generateButton = this.querySelector('button[type="submit"]');
    
    // Disable the generate button and show loading feedback
    generateButton.disabled = true;
    generateButton.innerText = 'Generating...';
    
    // Optionally, you could add a loading spinner
    const spinner = document.createElement('div');
    spinner.classList.add('loading-spinner');
    generateButton.appendChild(spinner); // Add spinner to the button

    const formData = new FormData(this);
    const params = new URLSearchParams(formData);

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            body: params
        });

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Display the preview
        const preview = document.getElementById('preview');
        preview.src = url;
        preview.classList.remove('hidden');

        // Update the download link
        const downloadLink = document.getElementById('downloadLink');
        downloadLink.href = url;
        downloadLink.classList.remove('hidden');
        downloadLink.innerText = 'Download Wallpaper';
    } catch (error) {
        console.error('Error generating wallpaper:', error);

        // Optionally reset the preview to a default error image
        const preview = document.getElementById('preview');
        preview.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAB5ElEQVR4nO3bvWsUQRgA4O9p8T3TgqEQ0ET0Dj2AkQFgaVFRMQ8QFVUVYHkIV/AKD5A5AekE1DTkJfqQQ+Cb0ApRI0gtSt6yICJBpMRH8tcb4PTeZzRzRncM+fsfV/mZ2dnZnaOY+u9XVXffJghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhDAnUHoLPH8gvBT4C1QWg28Dvg70FlBR4INDrIToKbA24Hfgv4E14I0PDIW0Nvgj0MvB5QHWgjRkc4c1ePZBcHsAZDzA4fA2dOYdx8rQZbP3A/v7AjRvAT4YDjE/FqCFB96SzoKR+DpSBymPsQUyBFIcb0o4K7Yq0t+rLHG4r5p2NQkTmdA2ADrkTeBCA/gZspgNAQNgBW+JOzCTzRoAFPNStIeFGeCGRfgk+RDehvQ68DeqOvgY5V7gA/It8J0DvhH1H/zAjln4c0DOgPaFHoP0LPXrCE4DXrIvoHpHTi3YL+rKoLmUwDfB1AdoYQRvL6s5AFm5PeoL2m+nboNyD9ttOofGmG4Ha/6U5B9bTAc5Ht92KfpHS1zHk+aTSgffCKlDdqPF1GdnLJpwHNCmZH0dkYO6JZkfbNLfh5KQkExDwL9bTfEeIXf8FF+Wn1oEX/Sjoc0F74JQfZ5Q/DPieEGGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQ6T8D+RRCNdR5EKEAAAAASUVORK5CYII=';
        preview.classList.remove('hidden');
    } finally {
        // Remove spinner
        if (spinner) {
            spinner.remove();
        }
        
        // Re-enable the button after generation is complete
        generateButton.disabled = false;
        generateButton.innerText = 'Generate Wallpaper';
    }
});

// CRT Effect with Noise (No Flickering)
function applyCRTEffect() {
    const body = document.body;

    function createNoise() {
        const noiseElement = document.createElement('div');
        noiseElement.classList.add('crt-noise');
        body.appendChild(noiseElement);
    }

    // Start Noise Effect
    createNoise();
}

// Add CRT effect when the page loads
window.onload = applyCRTEffect;
