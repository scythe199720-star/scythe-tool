const imageInput = document.getElementById('imageInput');
const videoInput = document.getElementById('videoInput');
const logoInput = document.getElementById('logoInput');
const watermarkText = document.getElementById('watermarkText');
const textColor = document.getElementById('textColor');
const fontSizeInput = document.getElementById('fontSizeInput');
const positionSelect = document.getElementById('positionSelect');
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const batchContainer = document.getElementById('batchPreviewContainer');
const videoPreview = document.getElementById('videoPreview');
const videoLoading = document.getElementById('videoLoading');
const renderProgress = document.getElementById('renderProgress');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const toggleSwitch = document.querySelector('#checkbox');

let originalFiles = [];
let logoImage = null;
const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

// Dark Mode Logic
toggleSwitch.addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
});

// Load Logo
logoInput.onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
        logoImage = new Image();
        logoImage.onload = processAll;
        logoImage.src = ev.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
};

// Handle Images
imageInput.onchange = (e) => {
    videoPreview.style.display = 'none';
    originalFiles = Array.from(e.target.files);
    processAll();
};

// Handle Video
videoInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    batchContainer.innerHTML = '';
    videoLoading.style.display = 'block';
    
    if (!ffmpeg.isLoaded()) await ffmpeg.load();
    
    const name = 'input_video.mp4';
    ffmpeg.FS('writeFile', name, await fetchFile(file));
    
    const text = watermarkText.value || "SCYTHE PROJECT";
    const color = textColor.value.replace('#', '0x');
    const size = fontSizeInput.value;
    
    // Command FFmpeg sederhana untuk teks watermark
    await ffmpeg.run(
        '-i', name,
        '-vf', `drawtext=text='${text}':x=w-tw-20:y=h-th-20:fontsize=${size}:fontcolor=${color}@0.5`,
        '-preset', 'ultrafast',
        'output.mp4'
    );
    
    const data = ffmpeg.FS('readFile', 'output.mp4');
    videoPreview.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    videoPreview.style.display = 'block';
    videoLoading.style.display = 'none';
    downloadAllBtn.style.display = 'block';
};

// Sync settings
[watermarkText, textColor, fontSizeInput, positionSelect].forEach(el => {
    el.oninput = processAll;
});

async function processAll() {
    if (originalFiles.length === 0) return;
    batchContainer.innerHTML = '';
    downloadAllBtn.style.display = 'block';

    for (const file of originalFiles) {
        await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    drawWatermark();
                    const resultImg = document.createElement('img');
                    resultImg.src = canvas.toDataURL('image/png');
                    resultImg.className = 'batch-result';
                    batchContainer.appendChild(resultImg);
                    resolve();
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
}

function drawWatermark() {
    const pos = positionSelect.value;
    let x = pos.includes('right') ? canvas.width - 50 : pos.includes('left') ? 50 : canvas.width / 2;
    let y = pos.includes('bottom') ? canvas.height - 50 : pos.includes('top') ? 100 : canvas.height / 2;

    if (logoImage) {
        const lW = canvas.width * 0.15;
        const lH = (logoImage.height / logoImage.width) * lW;
        ctx.globalAlpha = 0.5;
        ctx.drawImage(logoImage, x - (pos.includes('right') ? lW : 0), y - lH, lW, lH);
    }

    ctx.globalAlpha = 0.5;
    ctx.fillStyle = textColor.value;
    ctx.font = `bold ${fontSizeInput.value}px Arial`;
    ctx.textAlign = pos.includes('right') ? "right" : pos.includes('left') ? "left" : "center";
    ctx.fillText(watermarkText.value || "SCYTHE PROJECT", x, y);
    ctx.globalAlpha = 1.0;
}

downloadAllBtn.onclick = () => {
    // Download Images
    document.querySelectorAll('.batch-result').forEach((img, i) => {
        const a = document.createElement('a');
        a.download = `scythe_img_${i+1}.png`;
        a.href = img.src;
        a.click();
    });
    // Download Video if exists
    if (videoPreview.src) {
        const a = document.createElement('a');
        a.download = `scythe_video.mp4`;
        a.href = videoPreview.src;
        a.click();
    }
};
