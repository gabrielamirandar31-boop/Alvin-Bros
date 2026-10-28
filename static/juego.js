const cv = document.getElementById("c");
const ctx = cv.getContext("2d");
cv.width = 960;
cv.height = 540;
ctx.scale(3, 3);
ctx.imageSmoothingEnabled = true;
const W = 320, H = 180, WORLD = 1650;

const NOMBRE = "PROFE";
const NOMBRE2 = "MIRANDA";
const FOTO1 = "/static/profe_suave.png";
const FOTO2 = "/static/persona2.png";

function cargar(src) {
  const o = { img: new Image(), ok: false };
  o.img.onload = () => (o.ok = true);
  o.img.src = src;
  return o;
}
const f1 = cargar(FOTO1);
const f2 = cargar(FOTO2);

const R = (x, y, w, h) => ({ x, y, w, h });
const suelo = [R(0, 150, 500, 30), R(540, 150, 420, 30), R(1000, 150, 660, 30)];
const ladrillos = [[120, 115, 64], [230, 85, 64], [600, 110, 80], [720, 80, 64],
                   [850, 110, 64], [1100, 115, 80], [1250, 90, 64]].map(a => R(a[0], a[1], a[2], 12));
const solidos = [...suelo, ...ladrillos];
const CEREZAS = [[140, 100], [160, 100], [250, 70], [620, 94], [740, 64],
                 [870, 94], [1120, 100], [1270, 74], [1400, 130], [1450, 130]];
const RANGOS = [[300, 500], [700, 950], [1150, 1500]];
const SEGUROS = [260, 700, 1100, 1500]; // lugares firmes donde reaparece la persona

const choca = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

let g, t = 0, teclas = {}, guardado = false;

function nuevo() {
  guardado = false;
  g = {
    x: 30, y: 100, vx: 0, vy: 0, tierra: false, dir: 1, pts: 0, vidas: 3,
    invulnerable: 0, estado: "juego",
    n: { x: 260, y: 100, vx: 0, vy: 0, tierra: false, dir: 1 },
    cerezas: CEREZAS.map(c => [...c]),
    enem: RANGOS.map(([a, b]) => ({ x: a + 20, y: 136, vx: 0.6, a, b })),
  };
}

function golpe() {
  g.vidas--;
  if (g.vidas <= 0) {
    g.estado = "fin";
    return;
  }
  g.x = 30;
  g.y = 100;
  g.vx = 0;
  g.vy = 0;
  g.n.x = Math.min(WORLD - 40, Math.max(260, g.n.x));
  g.n.y = 100;
  g.n.vx = 0;
  g.n.vy = 0;
  g.invulnerable = 90;
}

// física compartida: mueve a cualquier personaje y choca con el suelo y ladrillos
function fisica(o) {
  o.x = Math.max(0, Math.min(WORLD - 14, o.x + o.vx));
  const r = { x: Math.floor(o.x), y: Math.floor(o.y), w: 14, h: 22 };
  for (const s of solidos) {
    if (choca(r, s)) {
      if (o.vx > 0) r.x = s.x - r.w;
      else if (o.vx < 0) r.x = s.x + s.w;
      o.x = r.x;
    }
  }
  o.y += o.vy;
  r.y = Math.floor(o.y);
  for (const s of solidos) {
    if (choca(r, s)) {
      if (o.vy > 0) r.y = s.y - r.h;
      else if (o.vy < 0) r.y = s.y + s.h;
      o.vy = 0;
      o.y = r.y;
    }
  }
  o.tierra = solidos.some(s => choca({ ...r, y: r.y + 1 }, s));
  return r;
}

// la persona perseguida: huye del profe y salta los huecos
function moverPersona() {
  const n = g.n;
  const dist = n.x - g.x;
  const ax = Math.abs(dist) < 220 ? (dist >= 0 ? 1 : -1) : 0;
  n.vx = ax * 1.6;
  if (ax) n.dir = ax;
  const pared = solidos.some(s =>
    s.x < n.x + (ax > 0 ? 19 : 0) &&
    s.x + s.w > n.x + (ax > 0 ? 14 : -5) &&
    s.y < n.y + 22 && s.y + s.h > n.y + 5
  );
  if (n.tierra && ax) {
    const sonda = { x: n.x + (ax > 0 ? 18 : -5), y: n.y + 24, w: 1, h: 1 };
    const hueco = !solidos.some(s => choca(sonda, s));
    if (pared || hueco) n.vy = -7.4;
  }
  n.vy = Math.min(n.vy + 0.4, 8);
  fisica(n);
  if (n.y > H + 40) { // se cayó: reaparece adelante
    n.x = SEGUROS.find(v => v > g.x + 100) ?? 1500;
    n.y = 100; n.vy = 0;
  }
}

function paso() {
  if (g.invulnerable > 0) g.invulnerable--;
  const der = teclas.arrowright || teclas.d || teclas.der;
  const izq = teclas.arrowleft || teclas.a || teclas.izq;
  const ax = (der ? 1 : 0) - (izq ? 1 : 0);
  g.vx = ax * 2;
  if (ax) g.dir = ax;
  if ((teclas[" "] || teclas.arrowup || teclas.w || teclas.saltar) && g.tierra) g.vy = -7.2;
  g.vy = Math.min(g.vy + 0.4, 8);
  const r = fisica(g);
  if (g.y > H + 40) {
    golpe();
    return;
  }

  moverPersona();
  const rn = { x: Math.floor(g.n.x), y: Math.floor(g.n.y), w: 14, h: 22 };
  if (choca(r, rn)) { g.pts += 200; g.estado = "gana"; return; }

  g.cerezas = g.cerezas.filter(c => {
    if (choca(r, R(c[0], c[1], 8, 8))) { g.pts += 10; return false; }
    return true;
  });

  for (const e of g.enem) {
    e.x += e.vx;
    if (e.x < e.a || e.x > e.b - 16) e.vx *= -1;
    if (g.invulnerable === 0 && choca(r, R(e.x, e.y, 16, 14))) {
      golpe();
      return;
    }
  }
}

const rect = (color, x, y, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };

  function dibujarPersonaje(personaje, camara, retrato, nombre, esProfe) {
    const x = personaje.x - camara;
    const y = personaje.y;
    const paso = personaje.vx && personaje.tierra ? Math.floor(t / 6) % 2 : 0;
    const chaqueta = esProfe ? "#174897" : "#df8537";
    const luz = esProfe ? "#3d72ce" : "#f4ad58";

    if (esProfe && g.invulnerable > 0 && Math.floor(t / 6) % 2) return;
    rect(chaqueta, x, y + 11, 14, 8);
    rect(luz, x + 1, y + 12, 4, 5);
    rect(luz, x + 9, y + 12, 4, 5);
    if (esProfe) {
      rect("#f4f2e9", x + 5, y + 11, 4, 6);
      rect("#c52d42", x + 6, y + 12, 2, 5);
    }
    rect("#28283c", x + 1 + paso * 2, y + 19, 5, 3);
    rect("#28283c", x + 8 - paso * 2, y + 19, 5, 3);

    if (retrato.ok) {
      ctx.save();
      ctx.translate(x + 7, y);
      ctx.scale(personaje.dir || 1, 1);
      ctx.drawImage(retrato.img, -10, -5, 20, 19);
      ctx.restore();
    } else {
      rect("#e7b28d", x + 2, y, 10, 11);
      rect("#302722", x + 2, y, 10, 3);
    }
    ctx.textAlign = "center";
    ctx.fillStyle = "#141428";
    ctx.font = "bold 7px monospace";
    ctx.fillText(nombre, x + 7, y - 5);
    ctx.textAlign = "left";
  }

  function dibujar() {
    const camara = Math.max(0, Math.min(WORLD - W, g.x - W / 2));
    const cielo = ctx.createLinearGradient(0, 0, 0, H);
    cielo.addColorStop(0, "#56b5f5");
    cielo.addColorStop(1, "#b8e4ff");
    ctx.fillStyle = cielo;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 6; i++) {
      const x = ((i * 170 - camara * 0.25) % (W + 80) + W + 80) % (W + 80) - 40;
      rect("#ffffff", x, 24 + (i % 3) * 13, 38, 6);
      rect("#ffffff", x + 8, 19 + (i % 3) * 13, 22, 5);
    }
    for (let i = -1; i < 8; i++) {
      const x = i * 120 - (camara * 0.45) % 120;
      ctx.fillStyle = "#7692b4";
      ctx.beginPath();
      ctx.moveTo(x, 150);
      ctx.lineTo(x + 60, 94);
      ctx.lineTo(x + 120, 150);
      ctx.fill();
    }

    for (const s of suelo) {
      rect("#725039", s.x - camara, s.y, s.w, s.h);
      rect("#45b85c", s.x - camara, s.y, s.w, 5);
    }
    for (const b of ladrillos) {
      rect("#a94f3f", b.x - camara, b.y, b.w, b.h);
      rect("#d4765b", b.x - camara + 2, b.y + 2, b.w - 4, 3);
    }
    for (const [x, y] of g.cerezas) {
      const flotacion = Math.sin(t / 10 + x) * 2;
      ctx.fillStyle = "#d62947";
      ctx.beginPath();
      ctx.arc(x - camara + 3, y + flotacion + 4, 3, 0, Math.PI * 2);
      ctx.arc(x - camara + 7, y + flotacion + 4, 3, 0, Math.PI * 2);
      ctx.fill();
      rect("#39894b", x - camara + 4, y + flotacion - 1, 2, 4);
    }
    for (const e of g.enem) {
      ctx.fillStyle = "#6b50a4";
      ctx.beginPath();
      ctx.ellipse(e.x - camara + 8, e.y + 8, 8, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      rect("#ffffff", e.x - camara + 4, e.y + 5, 2, 2);
      rect("#ffffff", e.x - camara + 10, e.y + 5, 2, 2);
    }
    dibujarPersonaje(g.n, camara, f2, NOMBRE2, false);
    dibujarPersonaje(g, camara, f1, NOMBRE, true);

    ctx.fillStyle = "#141428";
    ctx.font = "bold 9px monospace";
    ctx.fillText(`PUNTOS ${g.pts}`, 8, 13);
    ctx.fillText(`VIDAS ${"♥ ".repeat(g.vidas)}`, 8, 25);
    ctx.textAlign = "right";
    ctx.fillText(`ATRAPA A ${NOMBRE2}`, W - 8, 13);
    ctx.textAlign = "left";

    if (g.estado !== "juego") {
      rect("rgba(20, 20, 40, 0.88)", 25, 58, 270, 56);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "bold 14px monospace";
      ctx.fillText(g.estado === "gana" ? `¡ATRAPASTE A ${NOMBRE2}!` : "¡SE ACABARON LAS VIDAS!", W / 2, 82);
      ctx.font = "9px monospace";
      ctx.fillText("Pulsa R o toca el juego para reiniciar", W / 2, 101);
      ctx.textAlign = "left";
    }
  }

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

  async function cargarRanking() {
    const estado = document.getElementById("estado-ranking");
    try {
      const respuesta = await fetch("/ranking");
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      pintarRanking(await respuesta.json());
      estado.textContent = "";
    } catch (error) {
      estado.textContent = "No se pudo cargar el ranking.";
      console.error("Error al cargar el ranking:", error);
    }
  }

  async function guardarPuntaje() {
    if (guardado) return;
    guardado = true;
    const estado = document.getElementById("estado-ranking");
    const nombre = (prompt("Tu nombre para el ranking:") || "Anónimo").slice(0, 12);
    try {
      const respuesta = await fetch("/ranking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, puntos: g.pts }),
      });
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      pintarRanking(await respuesta.json());
      estado.textContent = "Puntaje guardado.";
    } catch (error) {
      estado.textContent = "No se pudo guardar el puntaje.";
      console.error("Error al guardar el puntaje:", error);
    }
  }

  function cambiarTecla(evento, presionada) {
    const tecla = evento.key.toLowerCase();
    teclas[tecla] = presionada;
    if (presionada && tecla === "r" && g.estado !== "juego") nuevo();
    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(tecla)) evento.preventDefault();
  }

  addEventListener("keydown", evento => cambiarTecla(evento, true));
  addEventListener("keyup", evento => cambiarTecla(evento, false));
  addEventListener("blur", () => { teclas = {}; });

  for (const [id, tecla] of [["izq", "izq"], ["der", "der"], ["saltar", "saltar"]]) {
    const boton = document.getElementById(id);
    boton.addEventListener("pointerdown", evento => {
      evento.preventDefault();
      teclas[tecla] = true;
      boton.setPointerCapture(evento.pointerId);
    });
    const soltar = evento => {
      evento.preventDefault();
      teclas[tecla] = false;
    };
    boton.addEventListener("pointerup", soltar);
    boton.addEventListener("pointercancel", soltar);
    boton.addEventListener("lostpointercapture", soltar);
  }

  cv.addEventListener("click", () => {
    if (g.estado !== "juego") nuevo();
  });

  nuevo();
  cargarRanking();
  setInterval(() => {
    t++;
    if (g.estado === "juego") paso();
    else if (!guardado) guardarPuntaje();
    dibujar();
  }, 1000 / 60);