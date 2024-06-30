document.getElementById('wallpaperForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const formData = new FormData(this);
    const params = new URLSearchParams(formData);

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
});
