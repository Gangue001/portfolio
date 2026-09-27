let mic;
let fft;
let audioStarted = false;

let smoothedLevel = 0;

let cycleSpeed = 0.0005;

let phase = 0;

let stars = [];
let starCount = 220;

const farWave = {
  yRatio: 0.70,
  length: 0.0065,
  amplitudeBase: 11,
  amplitudeAudio: 42,
  frequency: 0.014,
  noiseScale: 0.0035,
  noiseAmp: 9
};

const midWave = {
  yRatio: 0.78,
  length: 0.009,
  amplitudeBase: 17,
  amplitudeAudio: 64,
  frequency: 0.018,
  noiseScale: 0.0055,
  noiseAmp: 12
};

const nearWave = {
  yRatio: 0.87,
  length: 0.012,
  amplitudeBase: 25,
  amplitudeAudio: 88,
  frequency: 0.023,
  noiseScale: 0.0075,
  noiseAmp: 16
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  mic = new p5.AudioIn();
  fft = new p5.FFT(0.88, 256);

  generateStars();
}

async function mousePressed() {
  if (!audioStarted) {
    await userStartAudio();
    mic.start();
    fft.setInput(mic);
    audioStarted = true;

    const hint = document.querySelector(".hint");
    if (hint) hint.textContent = "Microphone enabled";
  }
}

function draw() {
  let level = 0;
  let waveform = new Array(256).fill(0);

  if (audioStarted) {
    level = mic.getLevel();
    waveform = fft.waveform();
  }

  smoothedLevel = lerp(smoothedLevel, level, 0.08);

  phase += cycleSpeed;
  if (phase > 1) phase = 0;

  let cycle = getCycleData(phase);

  drawBackground(cycle);
  drawStars(cycle);
  drawAtmosphere(cycle, smoothedLevel);
  drawOrb(cycle, waveform, smoothedLevel);
  drawSea(cycle, smoothedLevel);
  drawHorizon(cycle);
}

function getCycleData(p) {
  let state;
  let localT;

  if (p < 0.5) {
    state = "sun";
    localT = map(p, 0, 0.5, 0, 1);
  } else {
    state = "moon";
    localT = map(p, 0.5, 1, 0, 1);
  }

  // both sun and moon: left -> right
  let margin = 160;
  let x = lerp(-margin, width + margin, localT);

  // arc path
  let arc = sin(localT * PI);
  let y = lerp(height * 0.34, height * 0.17, pow(arc, 0.95));

  let daylight = 0;
  let nightness = 0;
  let twilight = 0;

  if (state === "sun") {
    daylight = pow(arc, 0.95);
    twilight = 1 - daylight;
    nightness = 0;
  } else {
    nightness = pow(arc, 0.9);
    twilight = 1 - nightness;
    daylight = 0;
  }

  return {
    state,
    localT,
    x,
    y,
    arc,
    daylight,
    nightness,
    twilight
  };
}

function drawBackground(cycle) {
  let day = cycle.daylight;

  let skyTopSunset = color(255, 150, 105);
  let skyMidSunset = color(255, 195, 155);
  let skyBottomSunset = color(248, 221, 192);

  let skyTopNight = color(6, 10, 26);
  let skyMidNight = color(16, 30, 68);
  let skyBottomNight = color(38, 62, 110);

  let seaTopSunset = color(52, 108, 160);
  let seaMidSunset = color(24, 82, 135);
  let seaBottomSunset = color(12, 52, 98);

  let seaTopNight = color(14, 30, 70);
  let seaMidNight = color(8, 20, 44);
  let seaBottomNight = color(3, 10, 24);

  let skyTop = lerpColor(skyTopNight, skyTopSunset, day);
  let skyMid = lerpColor(skyMidNight, skyMidSunset, day);
  let skyBottom = lerpColor(skyBottomNight, skyBottomSunset, day);

  let seaTop = lerpColor(seaTopNight, seaTopSunset, day);
  let seaMid = lerpColor(seaMidNight, seaMidSunset, day);
  let seaBottom = lerpColor(seaBottomNight, seaBottomSunset, day);

  noFill();

  for (let y = 0; y < height / 2; y++) {
    let inter = map(y, 0, height / 2, 0, 1);
    let c;

    if (inter < 0.55) {
      c = lerpColor(skyTop, skyMid, inter / 0.55);
    } else {
      c = lerpColor(skyMid, skyBottom, (inter - 0.55) / 0.45);
    }

    stroke(c);
    line(0, y, width, y);
  }

  for (let y = height / 2; y < height; y++) {
    let inter = map(y, height / 2, height, 0, 1);
    let c;

    if (inter < 0.45) {
      c = lerpColor(seaTop, seaMid, inter / 0.45);
    } else {
      c = lerpColor(seaMid, seaBottom, (inter - 0.45) / 0.55);
    }

    stroke(c);
    line(0, y, width, y);
  }
}

function drawStars(cycle) {
  let nightAmount = cycle.nightness;

  for (let i = 0; i < stars.length; i++) {
    stars[i].draw(nightAmount);
  }
}

function drawAtmosphere(cycle, level) {
  let sunGlow = color(255, 184, 120, 12 + cycle.daylight * 22);
  let moonGlow = color(210, 228, 255, 10 + cycle.nightness * 18);
  let glowColor = cycle.state === "sun" ? sunGlow : moonGlow;

  let outerSize = 220 + level * 1400;
  let innerSize = 120 + level * 700;

  noStroke();

  fill(red(glowColor), green(glowColor), blue(glowColor), alpha(glowColor) * 0.7);
  circle(cycle.x, cycle.y, outerSize);

  fill(red(glowColor), green(glowColor), blue(glowColor), alpha(glowColor));
  circle(cycle.x, cycle.y, innerSize);
}

function drawOrb(cycle, waveform, level) {
  let orbColor;

  if (cycle.state === "sun") {
    orbColor = color(255, 210, 126);
  } else {
    orbColor = color(220, 232, 255);
  }

  let outerGlowAlpha = cycle.state === "sun" ? 20 + level * 120 : 16 + level * 90;
  let innerGlowAlpha = cycle.state === "sun" ? 30 + level * 160 : 24 + level * 120;

  noStroke();
  fill(red(orbColor), green(orbColor), blue(orbColor), outerGlowAlpha);
  circle(cycle.x, cycle.y, 170 + level * 1200);

  fill(red(orbColor), green(orbColor), blue(orbColor), innerGlowAlpha);
  circle(cycle.x, cycle.y, 106 + level * 620);

  push();
  translate(cycle.x, cycle.y);

  // outer waveform ring
  stroke(red(orbColor), green(orbColor), blue(orbColor), 150);
  strokeWeight(1.2);
  noFill();
  beginShape();
  for (let i = 0; i < waveform.length; i++) {
    let angle = map(i, 0, waveform.length, 0, TWO_PI);
    let radius = 56 + waveform[i] * 42 + level * 170;
    let x = cos(angle) * radius;
    let y = sin(angle) * radius;
    curveVertex(x, y);
  }
  endShape(CLOSE);

  // inner main ring
  stroke(red(orbColor), green(orbColor), blue(orbColor), 235);
  strokeWeight(2.1);
  beginShape();
  for (let i = 0; i < waveform.length; i++) {
    let angle = map(i, 0, waveform.length, 0, TWO_PI);
    let radius = 42 + waveform[i] * 24 + level * 105;
    let x = cos(angle) * radius;
    let y = sin(angle) * radius;
    curveVertex(x, y);
  }
  endShape(CLOSE);

  pop();
}

function drawSea(cycle, level) {
  let day = cycle.daylight;

  let farColNight = color(88, 145, 220, 24);
  let farColDay = color(145, 210, 255, 38);

  let midColNight = color(44, 104, 176, 62);
  let midColDay = color(92, 165, 225, 86);

  let nearColNight = color(18, 70, 136, 150);
  let nearColDay = color(38, 102, 175, 172);

  let farCol = lerpColor(farColNight, farColDay, day);
  let midCol = lerpColor(midColNight, midColDay, day);
  let nearCol = lerpColor(nearColNight, nearColDay, day);

  drawWaveLayer(farWave, farCol, level);
  drawWaveLayer(midWave, midCol, level);
  drawWaveLayer(nearWave, nearCol, level);
}

function drawWaveLayer(wave, col, level) {
  fill(col);
  noStroke();

  const baseY = height * wave.yRatio;
  const amplitude = wave.amplitudeBase + level * wave.amplitudeAudio;
  const increment = frameCount * wave.frequency;

  beginShape();
  vertex(0, height);

  for (let i = -20; i <= width + 20; i += 12) {
    const sinePart = sin(i * wave.length + increment) * amplitude;
    const noisePart = map(
      noise(i * wave.noiseScale, frameCount * 0.004),
      0,
      1,
      -wave.noiseAmp,
      wave.noiseAmp
    );

    const y = baseY + sinePart + noisePart;
    curveVertex(i, y);
  }

  vertex(width, height);
  vertex(0, height);
  endShape(CLOSE);
}

function drawHorizon(cycle) {
  let alpha = 14 + cycle.daylight * 10 + cycle.nightness * 4;
  stroke(255, 255, 255, alpha);
  strokeWeight(1.1);
  line(0, height / 2, width, height / 2);
}

function generateStars() {
  stars = [];

  for (let i = 0; i < starCount; i++) {
    stars.push(new Star());
  }
}

class Star {
  constructor() {
    this.x = random(width);
    this.y = random(height * 0.05, height * 0.48);
    this.size = random(0.25, 2.8);
    this.t = random(TAU);
    this.speed = random(0.03, 0.08);
    this.brightness = random(0.55, 1);
  }

  draw(nightAmount) {
    this.t += this.speed;

    let scale = max(0.15, this.size + sin(this.t) * 0.8);
    let alpha = map(nightAmount, 0, 1, 0, 210) * this.brightness;

    noStroke();
    fill(255, alpha);
    ellipse(this.x, this.y, scale, scale);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateStars();
}