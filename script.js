// ═══════════════════════════════════════════
//  SHARED AUDIO (never interrupted)
// ═══════════════════════════════════════════
var audio = document.getElementById("bgMusic");
var audioContext = null;
var analyser = null;
var dataArray = null;
var audioStarted = false;

function initAudio() {
    if (audioStarted) return;
    audioStarted = true;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    var source = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    dataArray = new Uint8Array(analyser.frequencyBinCount);
    audio.volume = 0.15;
    audio.play().catch(() => {});
}

// Start overlay
var overlay = document.getElementById("startOverlay");
overlay.addEventListener("click", function () {
    initAudio();
    overlay.classList.add("hidden");
    setTimeout(function () { overlay.style.display = "none"; }, 800);
});

// Audio energy helper
var prevEnergy = 0;
function getAudioData() {
    if (!analyser || !dataArray) return { energy: 0, transient: 0, bands: null };
    analyser.getByteFrequencyData(dataArray);

    var sum = 0;
    for (var i = 0; i < dataArray.length; i++) sum += dataArray[i];
    var energy = sum / dataArray.length / 255;

    var transient = Math.max(0, energy - prevEnergy);
    prevEnergy = energy * 0.7 + prevEnergy * 0.3;

    return { energy: energy, transient: transient, bands: dataArray };
}

// ═══════════════════════════════════════════
//  SECTION SWITCHING
// ═══════════════════════════════════════════
var starfieldSection = document.getElementById("starfield-section");
var askSection = document.getElementById("ask-section");
var starfieldRunning = true;

function showAskSection() {
    starfieldRunning = false;
    starfieldSection.style.display = "none";
    askSection.style.display = "flex";
    initWaveCanvas();
    waveRunning = true;
    drawWaveBackground();
}

function showStarfieldSection() {
    waveRunning = false;
    askSection.style.display = "none";
    starfieldSection.style.display = "block";
    starfieldRunning = true;

    // Reset ask page state
    envelopeContainer.style.display = "";
    letterContainer.style.display = "none";
    var lw = document.querySelector(".letter-window");
    lw.classList.remove("open", "final");
    letterTitle.textContent = "Will you be my Valentine?";
    letterCat.src = "ask-assets/cat_heart.gif";
    letterButtons.style.display = "";
    finalText.style.display = "none";
    noBtn.style.transform = "";

    // Re-init starfield canvas in case of resize
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    baseFrame = context.getImageData(0, 0, window.innerWidth, window.innerHeight);
}

// ═══════════════════════════════════════════
//  STARFIELD
// ═══════════════════════════════════════════
var canvas = document.getElementById("starfield");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var context = canvas.getContext("2d");
var stars = 500;
var colorrange = [0, 60, 240];
var starArray = [];

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

for (var i = 0; i < stars; i++) {
    var x = Math.random() * canvas.offsetWidth;
    var y = Math.random() * canvas.offsetHeight;
    var radius = Math.random() * 1.2;
    var hue = colorrange[getRandom(0, colorrange.length - 1)];
    var sat = getRandom(50, 100);
    var starOpacity = Math.random();
    var baseOpacity = starOpacity;
    var baseRadius = radius;
    var freqBand = Math.floor(Math.random() * 128);
    starArray.push({ x: x, y: y, radius: radius, hue: hue, sat: sat, opacity: starOpacity, baseOpacity: baseOpacity, baseRadius: baseRadius, freqBand: freqBand });
}

var frameNumber = 0;
var opacity = 0;
var secondOpacity = 0;
var thirdOpacity = 0;

var baseFrame = context.getImageData(0, 0, window.innerWidth, window.innerHeight);

function drawStars(audioData) {
    for (var i = 0; i < stars; i++) {
        var star = starArray[i];
        var bandValue = audioData.bands ? audioData.bands[star.freqBand] / 255 : 0;
        var transientBoost = audioData.transient * 4;

        var musicOpacity = star.baseOpacity + bandValue * 0.6 + transientBoost;
        var musicRadius = star.baseRadius + bandValue * 1.5 + audioData.transient * 3;

        star.opacity = Math.min(1, musicOpacity);
        star.radius = Math.min(star.baseRadius + 3, musicRadius);

        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, 360);
        context.fillStyle = "hsla(" + star.hue + ", " + star.sat + "%, 88%, " + star.opacity + ")";
        context.fill();
    }
}

function updateStars() {
    for (var i = 0; i < stars; i++) {
        if (Math.random() > 0.99) {
            starArray[i].baseOpacity = Math.random();
        }
    }
}

var button = document.getElementById("valentinesButton");

button.addEventListener("click", function () {
    if (button.textContent === "Click Me! ❤") {
        showAskSection();
    }
});

function drawTextWithLineBreaks(lines, x, y, fontSize, lineHeight) {
    lines.forEach(function (line, index) {
        context.fillText(line, x, y + index * (fontSize + lineHeight));
    });
}

function drawText() {
    var fontSize = Math.min(30, window.innerWidth / 24);
    var lineHeight = 8;

    context.font = fontSize + "px Comic Sans MS";
    context.textAlign = "center";

    context.shadowColor = "rgba(45, 45, 255, 1)";
    context.shadowBlur = 8;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;

    // ─── Message 1: "every day I cannot believe how lucky I am" ───
    if (frameNumber < 250) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        context.fillText("every day I cannot believe how lucky I am", canvas.width / 2, canvas.height / 2);
        opacity = opacity + 0.01;
    }
    if (frameNumber >= 250 && frameNumber < 500) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        context.fillText("every day I cannot believe how lucky I am", canvas.width / 2, canvas.height / 2);
        opacity = opacity - 0.01;
    }

    // ─── Message 2: "do you remember when we looked up at the stars together?" ───
    if (frameNumber == 500) { opacity = 0; }
    if (frameNumber > 500 && frameNumber < 750) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        if (window.innerWidth < 600) {
            drawTextWithLineBreaks(["do you remember when we", "looked up at the stars together?"], canvas.width / 2, canvas.height / 2, fontSize, lineHeight);
        } else {
            context.fillText("do you remember when we looked up at the stars together?", canvas.width / 2, canvas.height / 2);
        }
        opacity = opacity + 0.01;
    }
    if (frameNumber >= 750 && frameNumber < 1000) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        if (window.innerWidth < 600) {
            drawTextWithLineBreaks(["do you remember when we", "looked up at the stars together?"], canvas.width / 2, canvas.height / 2, fontSize, lineHeight);
        } else {
            context.fillText("do you remember when we looked up at the stars together?", canvas.width / 2, canvas.height / 2);
        }
        opacity = opacity - 0.01;
    }

    // ─── Message 3: "finding constellations like Orion in the night sky" ───
    if (frameNumber == 1000) { opacity = 0; }
    if (frameNumber > 1000 && frameNumber < 1250) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        if (window.innerWidth < 600) {
            drawTextWithLineBreaks(["finding constellations like Orion", "in the night sky"], canvas.width / 2, canvas.height / 2, fontSize, lineHeight);
        } else {
            context.fillText("finding constellations like Orion in the night sky", canvas.width / 2, canvas.height / 2);
        }
        opacity = opacity + 0.01;
    }
    if (frameNumber >= 1250 && frameNumber < 1500) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        if (window.innerWidth < 600) {
            drawTextWithLineBreaks(["finding constellations like Orion", "in the night sky"], canvas.width / 2, canvas.height / 2, fontSize, lineHeight);
        } else {
            context.fillText("finding constellations like Orion in the night sky", canvas.width / 2, canvas.height / 2);
        }
        opacity = opacity - 0.01;
    }

    // ─── Message 4: "and even seeing Jupiter shining so bright" ───
    if (frameNumber == 1500) { opacity = 0; }
    if (frameNumber > 1500 && frameNumber < 1750) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        context.fillText("and even seeing Jupiter shining so bright", canvas.width / 2, canvas.height / 2);
        opacity = opacity + 0.01;
    }
    if (frameNumber >= 1750 && frameNumber < 2000) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        context.fillText("and even seeing Jupiter shining so bright", canvas.width / 2, canvas.height / 2);
        opacity = opacity - 0.01;
    }

    // ─── Message 5: "that moment with you was so special" ───
    if (frameNumber == 2000) { opacity = 0; }
    if (frameNumber > 2000 && frameNumber < 2250) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        context.fillText("that moment with you was so special", canvas.width / 2, canvas.height / 2);
        opacity = opacity + 0.01;
    }
    if (frameNumber >= 2250 && frameNumber < 2500) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        context.fillText("that moment with you was so special", canvas.width / 2, canvas.height / 2);
        opacity = opacity - 0.01;
    }

    // ─── Message 6: "standing there, just us and the universe" ───
    if (frameNumber == 2500) { opacity = 0; }
    if (frameNumber > 2500 && frameNumber < 2750) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        context.fillText("standing there, just us and the universe", canvas.width / 2, canvas.height / 2);
        opacity = opacity + 0.01;
    }
    if (frameNumber >= 2750 && frameNumber < 3000) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        context.fillText("standing there, just us and the universe", canvas.width / 2, canvas.height / 2);
        opacity = opacity - 0.01;
    }

    // ─── Message 7: "amongst trillions and trillions of stars, over billions of years" ───
    if (frameNumber == 3000) { opacity = 0; }
    if (frameNumber > 3000 && frameNumber < 3250) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        if (window.innerWidth < 600) {
            drawTextWithLineBreaks(["amongst trillions and trillions of stars,", "over billions of years"], canvas.width / 2, canvas.height / 2, fontSize, lineHeight);
        } else {
            context.fillText("amongst trillions and trillions of stars, over billions of years", canvas.width / 2, canvas.height / 2);
        }
        opacity = opacity + 0.01;
    }
    if (frameNumber >= 3250 && frameNumber < 3500) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        if (window.innerWidth < 600) {
            drawTextWithLineBreaks(["amongst trillions and trillions of stars,", "over billions of years"], canvas.width / 2, canvas.height / 2, fontSize, lineHeight);
        } else {
            context.fillText("amongst trillions and trillions of stars, over billions of years", canvas.width / 2, canvas.height / 2);
        }
        opacity = opacity - 0.01;
    }

    // ─── Message 8: "to be alive, and to get to spend this life with you" ───
    if (frameNumber == 3500) { opacity = 0; }
    if (frameNumber > 3500 && frameNumber < 3750) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        context.fillText("to be alive, and to get to spend this life with you", canvas.width / 2, canvas.height / 2);
        opacity = opacity + 0.01;
    }
    if (frameNumber >= 3750 && frameNumber < 4000) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        context.fillText("to be alive, and to get to spend this life with you", canvas.width / 2, canvas.height / 2);
        opacity = opacity - 0.01;
    }

    // ─── Message 9: "is so incredibly, unfathomably unlikely" ───
    if (frameNumber == 4000) { opacity = 0; }
    if (frameNumber > 4000 && frameNumber < 4250) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        context.fillText("is so incredibly, unfathomably unlikely", canvas.width / 2, canvas.height / 2);
        opacity = opacity + 0.01;
    }
    if (frameNumber >= 4250 && frameNumber < 4500) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        context.fillText("is so incredibly, unfathomably unlikely", canvas.width / 2, canvas.height / 2);
        opacity = opacity - 0.01;
    }

    // ─── Message 10: "and yet here I am to get the impossible chance to get to know you" ───
    if (frameNumber == 4500) { opacity = 0; }
    if (frameNumber > 4500 && frameNumber < 4750) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        if (window.innerWidth < 600) {
            drawTextWithLineBreaks(["and yet here I am to get the impossible", "chance to get to know you"], canvas.width / 2, canvas.height / 2, fontSize, lineHeight);
        } else {
            context.fillText("and yet here I am to get the impossible chance to get to know you", canvas.width / 2, canvas.height / 2);
        }
        opacity = opacity + 0.01;
    }
    if (frameNumber >= 4750 && frameNumber < 5000) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        if (window.innerWidth < 600) {
            drawTextWithLineBreaks(["and yet here I am to get the impossible", "chance to get to know you"], canvas.width / 2, canvas.height / 2, fontSize, lineHeight);
        } else {
            context.fillText("and yet here I am to get the impossible chance to get to know you", canvas.width / 2, canvas.height / 2);
        }
        opacity = opacity - 0.01;
    }

    // ─── Final messages (stay on screen) ───
    if (frameNumber == 5000) { opacity = 0; }
    if (frameNumber > 5000 && frameNumber < 99999) {
        context.fillStyle = "rgba(45, 45, 255, " + opacity + ")";
        if (window.innerWidth < 600) {
            drawTextWithLineBreaks(["I love you so much, more than", "all the time and space in the universe can contain"], canvas.width / 2, canvas.height / 2, fontSize, lineHeight);
        } else {
            context.fillText("I love you so much, more than all the time and space in the universe can contain", canvas.width / 2, canvas.height / 2);
        }
        opacity = opacity + 0.01;
    }

    if (frameNumber >= 5250 && frameNumber < 99999) {
        context.fillStyle = "rgba(45, 45, 255, " + secondOpacity + ")";
        if (window.innerWidth < 600) {
            drawTextWithLineBreaks(["and I can't wait to spend all the time in", "the world to share that love with you!"], canvas.width / 2, (canvas.height / 2 + 60), fontSize, lineHeight);
        } else {
            context.fillText("and I can't wait to spend all the time in the world to share that love with you!", canvas.width / 2, (canvas.height / 2 + 50));
        }
        secondOpacity = secondOpacity + 0.01;
    }

    if (frameNumber >= 5500 && frameNumber < 99999) {
        context.fillStyle = "rgba(45, 45, 255, " + thirdOpacity + ")";
        context.fillText("Happy Valentine's Day <3", canvas.width / 2, (canvas.height / 2 + 120));
        thirdOpacity = thirdOpacity + 0.01;
        button.style.display = "block";
    }

    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
}

function draw() {
    if (!starfieldRunning) return;

    context.putImageData(baseFrame, 0, 0);
    var audioData = getAudioData();
    drawStars(audioData);
    updateStars();
    drawText();

    if (frameNumber < 99999) frameNumber++;
    window.requestAnimationFrame(draw);
}

window.addEventListener("resize", function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    baseFrame = context.getImageData(0, 0, window.innerWidth, window.innerHeight);
});

window.requestAnimationFrame(draw);

// ═══════════════════════════════════════════
//  ASK PAGE (wave canvas + envelope + letter)
// ═══════════════════════════════════════════
var waveCanvas = document.getElementById("waveCanvas");
var wCtx = waveCanvas.getContext("2d");
var waveRunning = false;
var wavePhase = 0;

function initWaveCanvas() {
    waveCanvas.width = window.innerWidth;
    waveCanvas.height = window.innerHeight;
}

function drawWaveBackground() {
    if (!waveRunning) return;

    var w = waveCanvas.width;
    var h = waveCanvas.height;

    var bands = new Uint8Array(128);
    var energy = 0;
    if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        bands = dataArray;
        var sum = 0;
        for (var i = 0; i < dataArray.length; i++) sum += dataArray[i];
        energy = sum / dataArray.length / 255;
    }

    wCtx.clearRect(0, 0, w, h);

    var waveConfigs = [
        { color: "rgba(180, 220, 255, 0.35)", freqStart: 0,  freqEnd: 20,  amplitude: 60, speed: 0.4,  yOffset: 0.25 },
        { color: "rgba(137, 196, 244, 0.30)", freqStart: 20, freqEnd: 40,  amplitude: 50, speed: 0.6,  yOffset: 0.40 },
        { color: "rgba(100, 175, 240, 0.25)", freqStart: 40, freqEnd: 60,  amplitude: 45, speed: 0.8,  yOffset: 0.55 },
        { color: "rgba(70, 150, 230, 0.20)",  freqStart: 60, freqEnd: 80,  amplitude: 40, speed: 1.0,  yOffset: 0.70 },
        { color: "rgba(50, 130, 220, 0.18)",  freqStart: 80, freqEnd: 100, amplitude: 35, speed: 1.3,  yOffset: 0.85 },
    ];

    waveConfigs.forEach(function (cfg) {
        var bandEnergy = 0;
        var count = 0;
        for (var i = cfg.freqStart; i < cfg.freqEnd && i < bands.length; i++) {
            bandEnergy += bands[i];
            count++;
        }
        bandEnergy = count > 0 ? bandEnergy / count / 255 : 0;

        var dynamicAmplitude = cfg.amplitude + bandEnergy * 80;
        var baseY = h * cfg.yOffset;

        wCtx.beginPath();
        wCtx.moveTo(0, h);

        for (var x = 0; x <= w; x += 3) {
            var t = x / w;
            var y = baseY +
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

// ─── Ask page elements ───
var envelopeContainer = document.getElementById("envelope-container");
var letterContainer = document.getElementById("letter-container");
var noBtn = document.querySelector(".no-btn");
var yesBtn = document.querySelector(".btn[alt='Yes']");
var letterTitle = document.getElementById("letter-title");
var letterCat = document.getElementById("letter-cat");
var letterButtons = document.getElementById("letter-buttons");
var finalText = document.getElementById("final-text");
var closeBtn = document.getElementById("closeBtn");

// Envelope click
envelopeContainer.addEventListener("click", function () {
    envelopeContainer.style.display = "none";
    letterContainer.style.display = "flex";
    setTimeout(function () {
        document.querySelector(".letter-window").classList.add("open");
    }, 50);
});

// NO button dodges
noBtn.addEventListener("mouseover", function () {
    var distance = 200;
    var angle = Math.random() * Math.PI * 2;
    var moveX = Math.cos(angle) * distance;
    var moveY = Math.sin(angle) * distance;
    noBtn.style.transition = "transform 0.3s ease";
    noBtn.style.transform = "translate(" + moveX + "px, " + moveY + "px)";
});

// YES click
yesBtn.addEventListener("click", function () {
    letterTitle.textContent = "Yippeeee!";
    letterCat.src = "ask-assets/cat_dance.gif";
    document.querySelector(".letter-window").classList.add("final");
    letterButtons.style.display = "none";
    finalText.style.display = "block";
});

// Close button → back to starfield (no page navigation!)
closeBtn.addEventListener("click", function () {
    showStarfieldSection();
});

// Handle resize for wave canvas
window.addEventListener("resize", function () {
    if (waveRunning) {
        waveCanvas.width = window.innerWidth;
        waveCanvas.height = window.innerHeight;
    }
});
