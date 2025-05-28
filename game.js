// game.js

const canvas = document.getElementById("myCanvas");
const ctx    = canvas.getContext("2d");

// Spillvariabler
let ball, paddle, blocks, lives, score;
let animationId;

// Tastatur- og mus-kontroll (uendret)
let rightPressed = false;
let leftPressed  = false;
document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") rightPressed = true;
  if (e.key === "ArrowLeft")  leftPressed  = true;
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowRight") rightPressed = false;
  if (e.key === "ArrowLeft")  leftPressed  = false;
});
canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  if (x > 0 && x < canvas.width) {
    paddle.x = x - paddle.width/2;
    if (window.__currentState) window.__currentState.paddle_x = paddle.x;
  }
});

// Hjelpe­funksjon: opprett blokkene
function initBlocks() {
  const cols=5, rows=3, bw=75, bh=20, pad=10, offT=30, offL=30;
  blocks = [];
  for (let c=0; c<cols; c++) {
    for (let r=0; r<rows; r++) {
      blocks.push({
        x: offL + c*(bw+pad),
        y: offT + r*(bh+pad),
        width: bw, height: bh, broken: false
      });
    }
  }
}

// Reset-spill: ball, paddle, liv, poeng
function resetGame(fullReset = false) {
  // Ved første start eller fullReset=true, nullstill score
  if (fullReset) {
    score = 0;
    lives = 3;
  }
  // Ballen startposisjon og hastighet
  ball = {
    x: canvas.width/2,
    y: canvas.height - 30,
    dx: 2,
    dy: -2,
    radius: 10
  };
  // Paddle startposisjon
  paddle = {
    width: 75,
    height: 10,
    x: (canvas.width - 75)/2
  };
  initBlocks();

  // Vis stats
  document.getElementById("lives").textContent = lives;
  document.getElementById("score").textContent = score;

  // Lagre umiddelbart
  window.__currentState = {
    ball_x: ball.x,
    ball_y: ball.y,
    paddle_x: paddle.x,
    lives, score
  };
  window.__saveState();
}

// Tegn alt
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Ball
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
  // Paddle
  ctx.beginPath();
  ctx.rect(paddle.x, canvas.height-paddle.height, paddle.width, paddle.height);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
  // Blokker
  blocks.forEach(b => {
    if (!b.broken) {
      ctx.beginPath();
      ctx.rect(b.x, b.y, b.width, b.height);
      ctx.fillStyle = "#0095DD";
      ctx.fill();
      ctx.closePath();
    }
  });
}

// Hoved­update­sløyfe
function update() {
  // Ballbevegelse
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Vegg-collisions
  if (ball.x + ball.dx < ball.radius || ball.x + ball.dx > canvas.width-ball.radius) {
    ball.dx = -ball.dx;
  }
  if (ball.y + ball.dy < ball.radius) {
    ball.dy = -ball.dy;
  }
  // Gulv-collision -> mist liv
  else if (ball.y + ball.dy > canvas.height-ball.radius) {
    if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
      ball.dy = -ball.dy;
    } else {
      lives--;
      document.getElementById("lives").textContent = lives;
      if (lives === 0) {
        cancelAnimationFrame(animationId);
        alert("GAME OVER");
        // Full nullstilling
        resetGame(true);
        return; // stopp update
      } else {
        // Reset ball & paddle, men behold score
        resetGame(false);
      }
    }
  }

  // Kollisjon med blokker
  blocks.forEach(b => {
    if (!b.broken &&
        ball.x > b.x && ball.x < b.x + b.width &&
        ball.y > b.y && ball.y < b.y + b.height) {
      ball.dy = -ball.dy;
      b.broken = true;
      score += 10;
      document.getElementById("score").textContent = score;
    }
  });

  // Paddle-bevegelse via tastatur
  if (rightPressed && paddle.x < canvas.width - paddle.width) {
    paddle.x += 7;
  } else if (leftPressed && paddle.x > 0) {
    paddle.x -= 7;
  }

  // Tegn alt
  draw();

  // Oppdater og lagre state
  window.__currentState = {
    ball_x:   ball.x,
    ball_y:   ball.y,
    paddle_x: paddle.x,
    lives, score
  };
  window.__saveState();

  // Neste frame
  animationId = requestAnimationFrame(update);
}

// Når spillet starter fra integration.js
window.startGame = () => {
  // Hvis vi har persistert state, bruk den
  if (window.__persistState) {
    const S = window.__persistState;
    ball   = { x:S.ball_x, y:S.ball_y, dx:2, dy:-2, radius:10 };
    paddle = { width:75, height:10, x:S.paddle_x };
    lives  = S.lives;
    score  = S.score;
    initBlocks();
  } else {
    // Første gang
    resetGame(true);
  }
  update();
};
