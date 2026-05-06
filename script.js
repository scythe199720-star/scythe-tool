const imageInput = document.getElementById('imageInput');
const logoInput = document.getElementById('logoInput');
const watermarkText = document.getElementById('watermarkText');
const textColor = document.getElementById('textColor');
const fontSizeInput = document.getElementById('fontSizeInput');
const positionSelect = document.getElementById('positionSelect');
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const batchContainer = document.getElementById('batchPreviewContainer');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const toggleSwitch = document.querySelector('#checkbox');

let originalFiles = [];
let logoImage = null;

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log(err));
}

// Dark Mode Logic
toggleSwitch.addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    gsap.from(".container", { duration: 0.4, opacity: 0.8 });
});

if (localStorage.getItem('theme') === 'dark') {
    toggleSwitch.checked = true;
    document.documentElement.setAttribute('data-theme', 'dark');
}

// Logo Loader
logoInput.onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
        logoImage = new Image();
        logoImage.onload = processAll;
        logoImage.src = ev.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
};

imageInput.onchange = (e) => {
    originalFiles = Array.from(e.target.files);
    processAll();
};

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
                    gsap.from(resultImg, { scale: 0.5, opacity: 0, duration: 0.3 });
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
    document.querySelectorAll('.batch-result').forEach((img, i) => {
        const a = document.createElement('a');
        a.download = `scythe_${i+1}.png`;
        a.href = img.src;
        a.click();
    });
};
