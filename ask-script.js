// ─── Audio Setup ───
const audio = document.getElementById("bgMusic");
let audioContext = null;
let analyser = null;
let dataArray = null;
let audioStarted = false;

function initAudio() {
    if (audioStarted) return;
    audioStarted = true;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    dataArray = new Uint8Array(analyser.frequencyBinCount);

    audio.volume = 0.15;

    // Seamless: resume from where the other page left off
    const savedTime = sessionStorage.getItem("musicTime");
    if (savedTime) {
        audio.currentTime = parseFloat(savedTime);
    }

    audio.play().catch(() => {});
}

// Save playback position before navigating away
window.addEventListener("beforeunload", () => {
    if (audio) {
        sessionStorage.setItem("musicTime", audio.currentTime);
    }
});

// Auto-start audio on this page (user already interacted on index.html)
initAudio();

// ─── Wave Canvas Background ───
const waveCanvas = document.getElementById("waveCanvas");
const wCtx = waveCanvas.getContext("2d");

function resizeWaveCanvas() {
    waveCanvas.width = window.innerWidth;
    waveCanvas.height = window.innerHeight;
}
resizeWaveCanvas();
window.addEventListener("resize", resizeWaveCanvas);

// Smooth wave animation driven by audio frequencies
let wavePhase = 0;

function drawWaveBackground() {
    const w = waveCanvas.width;
    const h = waveCanvas.height;

    // Get audio data
    let bands = new Uint8Array(128);
    let energy = 0;
    if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        bands = dataArray;
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        energy = sum / dataArray.length / 255;
    }

    // Clear
    wCtx.clearRect(0, 0, w, h);

    // Draw 5 layered waves, each reacting to different frequency ranges
    const waveConfigs = [
        { color: "rgba(180, 220, 255, 0.35)", freqStart: 0,  freqEnd: 20,  amplitude: 60, speed: 0.4,  yOffset: 0.25 },
        { color: "rgba(137, 196, 244, 0.30)", freqStart: 20, freqEnd: 40,  amplitude: 50, speed: 0.6,  yOffset: 0.40 },
        { color: "rgba(100, 175, 240, 0.25)", freqStart: 40, freqEnd: 60,  amplitude: 45, speed: 0.8,  yOffset: 0.55 },
        { color: "rgba(70, 150, 230, 0.20)",  freqStart: 60, freqEnd: 80,  amplitude: 40, speed: 1.0,  yOffset: 0.70 },
        { color: "rgba(50, 130, 220, 0.18)",  freqStart: 80, freqEnd: 100, amplitude: 35, speed: 1.3,  yOffset: 0.85 },
    ];

    waveConfigs.forEach((cfg) => {
        // Get average energy for this frequency range
        let bandEnergy = 0;
        let count = 0;
        for (let i = cfg.freqStart; i < cfg.freqEnd && i < bands.length; i++) {
            bandEnergy += bands[i];
            count++;
        }
        bandEnergy = count > 0 ? bandEnergy / count / 255 : 0;

        const dynamicAmplitude = cfg.amplitude + bandEnergy * 80;
        const baseY = h * cfg.yOffset;

        wCtx.beginPath();
        wCtx.moveTo(0, h);

        for (let x = 0; x <= w; x += 3) {
            const t = x / w;
            const y = baseY +
                Math.sin(t * Math.PI * 3 + wavePhase * cfg.speed) * dynamicAmplitude * 0.5 +
                Math.sin(t * Math.PI * 5 + wavePhase * cfg.speed * 0.7) * dynamicAmplitude * 0.3 +
                Math.sin(t * Math.PI * 1.5 + wavePhase * cfg.speed * 1.3) * dynamicAmplitude * 0.2;
            wCtx.lineTo(x, y);
        }

        wCtx.lineTo(w, h);
        wCtx.closePath();
        wCtx.fillStyle = cfg.color;
        wCtx.fill();
    });

    wavePhase += 0.015 + energy * 0.03;
    requestAnimationFrame(drawWaveBackground);
}

drawWaveBackground();

// ─── Page Elements ───
const envelope = document.getElementById("envelope-container");
const letter = document.getElementById("letter-container");
const noBtn = document.querySelector(".no-btn");
const yesBtn = document.querySelector(".btn[alt='Yes']");

const title = document.getElementById("letter-title");
const catImg = document.getElementById("letter-cat");
const buttons = document.getElementById("letter-buttons");
const finalText = document.getElementById("final-text");

// Click Envelope

envelope.addEventListener("click", () => {
    envelope.style.display = "none";
    letter.style.display = "flex";

    setTimeout(() => {
        document.querySelector(".letter-window").classList.add("open");
    }, 50);
});

// Logic to move the NO btn

noBtn.addEventListener("mouseover", () => {
    const min = 200;
    const max = 200;

    const distance = Math.random() * (max - min) + min;
    const angle = Math.random() * Math.PI * 2;

    const moveX = Math.cos(angle) * distance;
    const moveY = Math.sin(angle) * distance;

    noBtn.style.transition = "transform 0.3s ease";
    noBtn.style.transform = `translate(${moveX}px, ${moveY}px)`;
});

// YES is clicked

yesBtn.addEventListener("click", () => {
    title.textContent = "Yippeeee!";

    catImg.src = "ask-assets/cat_dance.gif";

    document.querySelector(".letter-window").classList.add("final");

    buttons.style.display = "none";

    finalText.style.display = "block";
});
