const cv = document.getElementById("c");
const ctx = cv.getContext("2d");
const W = 320, H = 180, WORLD = 1650;
const NOMBRE = "PROFE"; // cambia por el nombre de tu profe

const foto = new Image();
let fotoOk = false;
foto.onload = () => (fotoOk = true);
foto.src = "/static/profe.png";

const R = (x, y, w, h) => ({ x, y, w, h });
const suelo = [R(0, 150, 500, 30), R(560, 150, 400, 30), R(1020, 150, 640, 30)];
const ladrillos = [[120, 115, 64], [230, 85, 64], [600, 110, 80], [720, 80, 64],
                   [850, 110, 64], [1100, 115, 80], [1250, 90, 64]].map(a => R(a[0], a[1], a[2], 12));
const solidos = [...suelo, ...ladrillos];
const CEREZAS = [[140, 100], [160, 100], [250, 70], [620, 94], [740, 64],
                 [870, 94], [1120, 100], [1270, 74], [1400, 130], [1450, 130]];
const RANGOS = [[300, 500], [700, 950], [1150, 1500]];
const META = R(1600, 100, 6, 50);

const choca = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

let g, t = 0, teclas = {}, guardado = false;

function nuevo() {
  guardado = false;
  g = {
    x: 30, y: 100, vx: 0, vy: 0, tierra: false, dir: 1, pts: 0, vidas: 3, estado: "juego",
    cerezas: CEREZAS.map(c => [...c]),
    enem: RANGOS.map(([a, b]) => ({ x: a + 20, y: 136, vx: 0.6, a, b })),
  };
}

function golpe() {
  g.vidas--;
  if (g.vidas <= 0) g.estado = "fin";
  else { g.x = 30; g.y = 100; g.vy = 0; }
}

function paso() {
  const der = teclas.arrowright || teclas.d || teclas.der;
  const izq = teclas.arrowleft || teclas.a || teclas.izq;
  const ax = (der ? 1 : 0) - (izq ? 1 : 0);
  g.vx = ax * 2;
  if (ax) g.dir = ax;
  if ((teclas[" "] || teclas.arrowup || teclas.w || teclas.saltar) && g.tierra) g.vy = -7.2;
  g.vy = Math.min(g.vy + 0.4, 8);

  g.x = Math.max(0, Math.min(WORLD - 14, g.x + g.vx));
  const r = { x: Math.floor(g.x), y: Math.floor(g.y), w: 14, h: 22 };
  for (const s of solidos) {
    if (choca(r, s)) {
      if (g.vx > 0) r.x = s.x - r.w;
      else if (g.vx < 0) r.x = s.x + s.w;
      g.x = r.x;
    }
  }
  g.y += g.vy;
  r.y = Math.floor(g.y);
  for (const s of solidos) {
    if (choca(r, s)) {
      if (g.vy > 0) r.y = s.y - r.h;
      else if (g.vy < 0) r.y = s.y + s.h;
      g.vy = 0;
      g.y = r.y;
    }
  }
  g.tierra = solidos.some(s => choca({ ...r, y: r.y + 1 }, s));
  if (g.y > H + 40) golpe();

  g.cerezas = g.cerezas.filter(c => {
    if (choca(r, R(c[0], c[1], 8, 8))) { g.pts += 10; return false; }
    return true;
  });

  for (const e of [...g.enem]) {
    e.x += e.vx;
    if (e.x < e.a || e.x > e.b - 16) e.vx *= -1;
    const er = R(e.x, e.y, 16, 14);
    if (choca(r, er)) {
      if (g.vy > 0 && r.y + r.h - er.y < 10) {
        g.enem.splice(g.enem.indexOf(e), 1);
        g.vy = -5;
        g.pts += 50;
      } else { golpe(); break; }
    }
  }
  if (choca(r, META)) { g.pts += 100; g.estado = "gana"; }
}

/* ---------- dibujo ---------- */
const rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
const poly = (c, pts) => {
  ctx.fillStyle = c; ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath(); ctx.fill();
};
const circ = (c, x, y, r) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
function texto(s, x, y, size = 10, c = "#fff") {
  ctx.font = `bold ${size}px monospace`;
  ctx.fillStyle = "#141428"; ctx.fillText(s, x + 1, y + 1);
  ctx.fillStyle = c; ctx.fillText(s, x, y);
}

function dibujar() {
  const px0 = Math.floor(g.x), py = Math.floor(g.y);
  const cam = Math.max(0, Math.min(WORLD - W, px0 + 7 - W / 2));

  for (let i = 0; i < 6; i++) rect(`rgb(${70 + i * 14},${150 + i * 12},240)`, 0, i * 30, W, 30);
  for (let i = 0; i < 8; i++) {
    const x = ((i * 170 - cam * 0.2) % (W + 80) + W + 80) % (W + 80) - 40;
    const y = 18 + (i * 37) % 60;
    rect("#ffe1c8", x, y, 50, 6); rect("#ffebd7", x + 8, y - 4, 30, 4);
  }
  for (let i = -1; i < 5; i++) {
    const bx = i * 220 - (cam * 0.5) % 220;
    poly("#6e7896", [[bx, 150], [bx + 60, 100], [bx + 120, 150]]);
    poly("#f0f0fa", [[bx + 49, 111], [bx + 60, 100], [bx + 71, 111]]);
  }
  for (const s of suelo) {
    const sx = s.x - cam;
    rect("#6e4628", sx, s.y, s.w, s.h);
    rect("#32aa46", sx, s.y, s.w, 5);
    for (let tx = s.x; tx < s.x + s.w; tx += 14)
      poly("#1e823c", [[tx - cam, s.y], [tx - cam + 4, s.y - 8], [tx - cam + 8, s.y]]);
  }
  for (const b of ladrillos)
    for (let bx = b.x; bx < b.x + b.w; bx += 16) {
      rect("#783228", bx - cam, b.y, 16, 12);
      rect("#c85a46", bx - cam + 1, b.y + 1, 14, 10);
    }
  for (const c of g.cerezas) {
    const cx = c[0] - cam, cy = c[1] + Math.sin(t / 10 + c[0]) * 2;
    ctx.strokeStyle = "#288c3c"; ctx.beginPath();
    ctx.moveTo(cx + 3, cy); ctx.lineTo(cx + 5, cy - 6); ctx.stroke();
    circ("#dc1e32", cx + 1, cy + 5, 3); circ("#dc1e32", cx + 6, cy + 5, 3);
  }
  for (const e of g.enem) {
    const ex = e.x - cam;
    ctx.fillStyle = "#3cbe50"; ctx.beginPath(); ctx.ellipse(ex + 8, e.y + 7, 8, 7, 0, 0, 7); ctx.fill();
    rect("#fff", ex + 3, e.y + 4, 3, 3); rect("#fff", ex + 10, e.y + 4, 3, 3);
  }
  rect("#e6e6e6", META.x - cam, META.y, 3, META.h);
  poly("#e6283c", [[META.x - cam + 3, META.y], [META.x - cam + 19, META.y + 6], [META.x - cam + 3, META.y + 12]]);

  // personaje
  const px = px0 - cam, anim = g.vx && g.tierra ? Math.floor(t / 6) % 2 : 0;
  rect("#3c5ac8", px + 1, py + 12, 12, 7);
  rect("#28283c", px + 1 + anim * 2, py + 19, 5, 3);
  rect("#28283c", px + 8 - anim * 2, py + 19, 5, 3);
  if (fotoOk) {
    ctx.save();
    ctx.translate(px + 7, 0);
    ctx.scale(g.dir, 1);
    ctx.drawImage(foto, -9, py - 6, 18, 18);
    ctx.restore();
  } else {
    rect("#f0be96", px, py, 14, 13); rect("#5a3220", px, py, 14, 4);
    rect("#141414", px + 3, py + 6, 2, 2); rect("#141414", px + 9, py + 6, 2, 2);
  }
  ctx.textAlign = "center"; texto(NOMBRE, px + 7, py - 10, 8); ctx.textAlign = "left";

  texto("SCORE  " + g.pts, 8, 14);
  texto("VIDAS  " + "<3 ".repeat(g.vidas), 8, 26, 10, "#ff788c");

  if (g.estado !== "juego") {
    rect("#141428", 40, 60, 240, 56);
    ctx.textAlign = "center";
    texto(g.estado === "gana" ? "¡LLEGASTE A LA META!" : "GAME OVER", 160, 84, 16);
    texto("Pulsa R o toca la pantalla", 160, 104, 9);
    ctx.textAlign = "left";
  }
}

/* ---------- ranking (habla con Python) ---------- */
function pintarRanking(lista) {
  const ranking = document.getElementById("ranking");
  ranking.replaceChildren();
  if (!lista.length) {
    const item = document.createElement("li");
    item.textContent = "Aún nadie";
    ranking.append(item);
    return;
  }
  for (const resultado of lista) {
    const item = document.createElement("li");
    item.textContent = `${resultado.nombre} — ${resultado.puntos}`;
    ranking.append(item);
  }
}
function cargarRanking() {
  fetch("/ranking").then(r => r.json()).then(pintarRanking);
}
function guardarPuntaje() {
  guardado = true;
  const nombre = prompt("Tu nombre para el ranking:") || "Anónimo";
  fetch("/ranking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, puntos: g.pts }),
  }).then(r => r.json()).then(pintarRanking);
}

/* ---------- controles ---------- */
addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  teclas[k] = true;
  if (k === "r") nuevo();
  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
});
addEventListener("keyup", e => (teclas[e.key.toLowerCase()] = false));
["izq", "der", "saltar"].forEach(id => {
  const b = document.getElementById(id);
  const on = e => { e.preventDefault(); teclas[id] = true; };
  const off = e => { e.preventDefault(); teclas[id] = false; };
  b.addEventListener("touchstart", on); b.addEventListener("touchend", off);
  b.addEventListener("mousedown", on); b.addEventListener("mouseup", off);
  b.addEventListener("mouseleave", off);
});
cv.addEventListener("click", () => { if (g.estado !== "juego") nuevo(); });

/* ---------- bucle principal ---------- */
nuevo();
cargarRanking();
setInterval(() => {
  t++;
  if (g.estado === "juego") paso();
  else if (!guardado && g.pts > 0) guardarPuntaje();
  dibujar();
}, 1000 / 60);