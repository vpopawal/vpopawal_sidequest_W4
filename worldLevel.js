/*
WorldLevel.js (Example 5)

WorldLevel wraps ONE level object from levels.json and provides:
- Theme colours (background/platform/blob)
- Physics parameters that influence the player (gravity, jump velocity)
- Spawn position for the player (start)
- An array of Platform instances
- A couple of helpers to size the canvas to fit the geometry

This is directly inspired by your original blob sketch’s responsibilities: 
- parse JSON
- map platforms array
- apply theme + physics
- infer canvas size

Expected JSON shape for each level (from your provided file): 
{
  "name": "Intro Steps",
  "gravity": 0.65,
  "jumpV": -11.0,
  "theme": { "bg":"...", "platform":"...", "blob":"..." },
  "start": { "x":80, "y":220, "r":26 },
  "platforms": [ {x,y,w,h}, ... ]
}
*/
class Spike {
  constructor(x, y, width, height, speed) {
    this.x = x;
    this.baseY = y;
    this.width = width;
    this.height = height;
    this.currentHeight = 0;
    this.speed = speed;
    this.movingUp = random() < 0.5;
    this.maxHeight = height;
  }

  update() {
    if (this.movingUp) {
      this.currentHeight += this.speed;
      if (this.currentHeight >= this.maxHeight) {
        this.currentHeight = this.maxHeight;
        this.movingUp = false;
      }
    } else {
      this.currentHeight -= this.speed;
      if (this.currentHeight <= 0) {
        this.currentHeight = 0;
        if (random() < 0.02) this.movingUp = true;
      }
    }
  }

  draw() {
    if (this.currentHeight > 0) {
      fill("#a8f1a8ff");
      triangle(
        this.x,
        this.baseY,
        this.x + this.width / 2,
        this.baseY - this.currentHeight,
        this.x + this.width,
        this.baseY,
      );
    }
  }

  hitsPlayer(player) {
    const px = player.x - player.r;
    const py = player.y - player.r;
    const pw = player.r * 2;
    const ph = player.r * 2;

    const sx = this.x;
    const sy = this.baseY - this.currentHeight;
    const sw = this.width;
    const sh = this.currentHeight;

    return px < sx + sw && px + pw > sx && py < sy + sh && py + ph > sy;
  }
}

class WorldLevel {
  constructor(levelJson) {
    this.name = levelJson.name || "Level";

    this.theme = Object.assign(
      { bg: "#F0F0F0", platform: "#C8C8C8", blob: "#1478FF" },
      levelJson.theme || {},
    );

    this.gravity = levelJson.gravity ?? 0.65;
    this.jumpV = levelJson.jumpV ?? -11;

    this.start = {
      x: levelJson.start?.x ?? 80,
      y: levelJson.start?.y ?? 180,
      r: levelJson.start?.r ?? 26,
    };

    // Platforms from JSON
    this.platforms = (levelJson.platforms || []).map((p) => new Platform(p));

    // Generate spikes for the level
    this.generateSpikes();
  }

  generateSpikes() {
    this.spikes = [];

    // Only floating platforms (not the ground)
    const floatingPlatforms = this.platforms.filter((p) => p.y < 300);

    for (let p of floatingPlatforms) {
      const spikeCount = floor(random(1, 3)); // 1–2 spikes per platform
      for (let i = 0; i < spikeCount; i++) {
        const spikeWidth = 20;
        const spikeHeight = 40;
        const spikeX = random(p.x, p.x + p.w - spikeWidth);
        const spikeY = p.y; // top of the platform
        const speed = random(0.8, 3);
        this.spikes.push(
          new Spike(spikeX, spikeY, spikeWidth, spikeHeight, speed),
        );
      }
    }
  }

  inferWidth(defaultW = 640) {
    if (!this.platforms.length) return defaultW;
    return max(this.platforms.map((p) => p.x + p.w));
  }

  inferHeight(defaultH = 360) {
    if (!this.platforms.length) return defaultH;
    return max(this.platforms.map((p) => p.y + p.h));
  }

  drawWorld() {
    background(this.theme.bg);

    // Draw platforms
    for (let p of this.platforms) {
      p.draw(this.theme.platform);
    }

    // Draw spikes and check collisions
    for (let s of this.spikes) {
      s.update();
      s.draw();
      if (s.hitsPlayer(player)) {
        player.spawnFromLevel(this);
      }
    }
  }
}
