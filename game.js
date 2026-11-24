(() => {
  "use strict";

  const canvas = document.getElementById("arena");
  const ctx = canvas.getContext("2d");
  const scoreElement = document.getElementById("score");
  const livesElement = document.getElementById("lives");
  const remainingElement = document.getElementById("remaining");
  const messageElement = document.getElementById("message");
  const restartButton = document.getElementById("restart");

  const width = canvas.width;
  const height = canvas.height;
  const target = 20;
  const fruitColors = [
    ["#ff8aa1", "#e84f77"],
    ["#ffd36f", "#e99b38"],
    ["#aeeb75", "#67b84f"],
    ["#9ec7ff", "#638dd8"],
    ["#d2b5ff", "#9a78d8"],
  ];

  let fruits = [];
  let particles = [];
  let score = 0;
  let lives = 3;
  let spawnTimer = 0;
  let elapsed = 0;
  let lastTime = 0;
  let state = "ready";
  let pointerActive = false;

  const bucket = {
    x: width / 2,
    y: 478,
    width: 150,
    height: 42,
    speed: 420,
  };

  const keys = new Set();

  function randomFruit() {
    const radius = 17 + Math.random() * 7;
    const palette = fruitColors[Math.floor(Math.random() * fruitColors.length)];
    return {
      x: radius + 25 + Math.random() * (width - radius * 2 - 50),
      y: -radius,
      radius,
      speed: 145 + Math.random() * 95 + score * 2.2,
      sway: 18 + Math.random() * 18,
      phase: Math.random() * Math.PI * 2,
      palette,
      rotation: Math.random() * Math.PI,
    };
  }

  function resetGame() {
    fruits = [];
    particles = [];
    score = 0;
    lives = 3;
    spawnTimer = 0.25;
    elapsed = 0;
    bucket.x = width / 2;
    state = "running";
    restartButton.hidden = true;
    messageElement.textContent = "左右に動いてフルーツを受け止めよう";
    updateHud();
  }

  function updateHud() {
    scoreElement.textContent = String(score);
    livesElement.textContent = "♥".repeat(lives) || "なし";
    remainingElement.textContent = `残り ${Math.max(target - score, 0)}`;
  }

  function endGame(nextState) {
    state = nextState;
    restartButton.hidden = false;
    if (nextState === "won") {
      messageElement.textContent = "クリア！ 星の果実をすべて集めました";
    } else {
      messageElement.textContent = "ゲームオーバー。もう一度挑戦しよう";
    }
  }

  function spawnBurst(x, y, color) {
    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * (50 + Math.random() * 90),
        vy: Math.sin(angle) * (50 + Math.random() * 90),
        life: 0.55 + Math.random() * 0.35,
        maxLife: 0.9,
        color,
      });
    }
  }

  function update(dt) {
    elapsed += dt;

    if (state !== "running") return;

    let direction = 0;
    if (keys.has("ArrowLeft") || keys.has("a")) direction -= 1;
    if (keys.has("ArrowRight") || keys.has("d")) direction += 1;
    bucket.x += direction * bucket.speed * dt;
    bucket.x = Math.max(
      bucket.width / 2,
      Math.min(width - bucket.width / 2, bucket.x),
    );

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      fruits.push(randomFruit());
      const difficulty = 1 - score / target;
      spawnTimer = 0.72 + difficulty * 0.42 + Math.random() * 0.35;
    }

    const bucketLeft = bucket.x - bucket.width / 2;
    const bucketRight = bucket.x + bucket.width / 2;
    const bucketTop = bucket.y - 16;

    for (let i = fruits.length - 1; i >= 0; i -= 1) {
      const fruit = fruits[i];
      fruit.y += fruit.speed * dt;
      fruit.x += Math.sin(elapsed * 1.8 + fruit.phase) * fruit.sway * dt;
      fruit.rotation += dt * 0.8;

      const caught =
        fruit.y + fruit.radius >= bucketTop &&
        fruit.y - fruit.radius <= bucket.y + bucket.height &&
        fruit.x + fruit.radius >= bucketLeft &&
        fruit.x - fruit.radius <= bucketRight;

      if (caught) {
        score += 1;
        spawnBurst(fruit.x, bucketTop, fruit.palette[0]);
        fruits.splice(i, 1);
        updateHud();
        if (score >= target) endGame("won");
      } else if (fruit.y - fruit.radius > height) {
        fruits.splice(i, 1);
        lives -= 1;
        updateHud();
        if (lives <= 0) endGame("lost");
      }
    }

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 180 * dt;
      if (particle.life <= 0) particles.splice(i, 1);
    }
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#17243a");
    sky.addColorStop(0.62, "#263b50");
    sky.addColorStop(1, "#9d846c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255, 240, 190, 0.78)";
    ctx.beginPath();
    ctx.arc(810, 92, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#17243a";
    ctx.beginPath();
    ctx.arc(795, 82, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(220, 231, 225, 0.12)";
    for (let i = 0; i < 18; i += 1) {
      const x = (i * 137 + 48) % width;
      const y = 30 + ((i * 71) % 230);
      ctx.beginPath();
      ctx.arc(x, y, i % 3 === 0 ? 1.5 : 1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#1d342f";
    ctx.beginPath();
    ctx.moveTo(0, 455);
    for (let x = 0; x <= width; x += 80) {
      ctx.lineTo(x, 430 - Math.sin(x * 0.018) * 18);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#142723";
    ctx.fillRect(0, 520, width, 20);
  }

  function drawFruit(fruit) {
    ctx.save();
    ctx.translate(fruit.x, fruit.y);
    ctx.rotate(fruit.rotation);
    ctx.shadowBlur = 14;
    ctx.shadowColor = fruit.palette[0];
    ctx.fillStyle = fruit.palette[0];
    ctx.beginPath();
    ctx.arc(0, 2, fruit.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = fruit.palette[1];
    ctx.beginPath();
    ctx.ellipse(
      -fruit.radius * 0.45,
      fruit.radius * 0.1,
      fruit.radius * 0.32,
      fruit.radius * 0.54,
      -0.45,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.fillStyle = "#8fd3a2";
    ctx.beginPath();
    ctx.ellipse(fruit.radius * 0.38, -fruit.radius * 0.72, 7, 3.5, -0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#6e4b38";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -fruit.radius);
    ctx.quadraticCurveTo(2, -fruit.radius - 9, 8, -fruit.radius - 11);
    ctx.stroke();
    ctx.restore();
  }

  function drawBucket() {
    ctx.save();
    ctx.translate(bucket.x, bucket.y);
    ctx.shadowBlur = 16;
    ctx.shadowColor = "rgba(167, 242, 220, 0.32)";

    ctx.fillStyle = "#b7c6ca";
    ctx.beginPath();
    ctx.moveTo(-bucket.width / 2, -13);
    ctx.quadraticCurveTo(-bucket.width * 0.42, 20, -bucket.width * 0.31, 23);
    ctx.lineTo(bucket.width * 0.31, 23);
    ctx.quadraticCurveTo(bucket.width * 0.42, 20, bucket.width / 2, -13);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#6d8589";
    ctx.beginPath();
    ctx.moveTo(-bucket.width / 2 + 10, 1);
    ctx.quadraticCurveTo(0, 16, bucket.width / 2 - 10, 1);
    ctx.lineTo(bucket.width * 0.31, 23);
    ctx.quadraticCurveTo(0, 34, -bucket.width * 0.31, 23);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#d5fff2";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-bucket.width / 2, -13);
    ctx.quadraticCurveTo(0, 0, bucket.width / 2, -13);
    ctx.stroke();

    ctx.restore();
  }

  function drawParticles() {
    for (const particle of particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawOverlay() {
    if (state === "running") return;

    ctx.fillStyle = "rgba(10, 16, 28, 0.58)";
    ctx.fillRect(0, 0, width, height);

    const isReady = state === "ready";
    const isWon = state === "won";
    ctx.textAlign = "center";
    ctx.fillStyle = "#eff8f5";
    ctx.font = "800 42px 'Yu Gothic', sans-serif";
    ctx.fillText(
      isReady ? "フルーツキャッチ" : isWon ? "クリア！" : "ゲームオーバー",
      width / 2,
      height / 2 - 20,
    );
    ctx.fillStyle = "#b8cbd0";
    ctx.font = "500 16px 'Yu Gothic', sans-serif";
    ctx.fillText(
      isReady ? "クリックまたは Space でスタート" : "ボタンでもう一度挑戦",
      width / 2,
      height / 2 + 24,
    );
  }

  function draw() {
    drawBackground();
    for (const fruit of fruits) drawFruit(fruit);
    drawParticles();
    drawBucket();
    drawOverlay();
  }

  function loop(time) {
    const dt = Math.min((time - lastTime) / 1000 || 0, 0.033);
    lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function canvasX(event) {
    const rect = canvas.getBoundingClientRect();
    return ((event.clientX - rect.left) / rect.width) * width;
  }

  function moveToPointer(event) {
    bucket.x = Math.max(
      bucket.width / 2,
      Math.min(width - bucket.width / 2, canvasX(event)),
    );
  }

  canvas.addEventListener("pointerdown", (event) => {
    pointerActive = true;
    canvas.setPointerCapture(event.pointerId);
    moveToPointer(event);
    if (state === "ready") resetGame();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (pointerActive) moveToPointer(event);
  });

  canvas.addEventListener("pointerup", (event) => {
    pointerActive = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  });

  window.addEventListener("keydown", (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (["ArrowLeft", "ArrowRight", "a", "d", " ", "Enter"].includes(key)) {
      event.preventDefault();
    }
    keys.add(key);
    if ((key === " " || key === "Enter") && state !== "running") {
      resetGame();
    }
  });

  window.addEventListener("keyup", (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    keys.delete(key);
  });

  restartButton.addEventListener("click", resetGame);

  updateHud();
  draw();
  requestAnimationFrame(loop);
})();
