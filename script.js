
const canvas = document.getElementById("jogo");
const ctx = canvas.getContext("2d");

const pontosTexto = document.getElementById("pontos");
const vidasTexto = document.getElementById("vidas");
const faseTexto = document.getElementById("fase");
const mensagem = document.getElementById("mensagem");
const botao = document.getElementById("reiniciar");

const LARGURA_MUNDO = 2400;
const GRAVIDADE = 0.6;

let pontos = 0;
let vidas = 3;
let faseAtual = 0;
let camera = 0;
let teclas = {};
let gameOver = false;
let venceu = false;
let protecao = 120;
let plataformas = [];
let moedas = [];
let inimigos = [];

const jogador = {
  x: 50,
  y: 350,
  w: 40,
  h: 50,
  vx: 0,
  vy: 0,
  velocidade: 4,
  pulos: 0
};

const fases = [
  {
    nome: "Campo Verde",
    ceu: "#75d7ff",
    chao: "#35a852",
    topo: "#237b32",
    plataformas: [
      [0,440,450,60], [530,440,450,60],
      [1060,440,430,60], [1570,440,350,60],
      [2000,440,400,60],
      [170,350,120,18], [350,290,120,18],
      [650,350,120,18], [820,290,120,18],
      [1120,350,120,18], [1320,290,120,18],
      [1630,350,120,18], [1810,290,120,18],
      [2070,350,120,18], [2250,300,100,18]
    ],
    moedas: [
      [210,315],[390,255],[690,315],[860,255],
      [1160,315],[1360,255],[1670,315],
      [1850,255],[2110,315],[2290,265]
    ],
    inimigos: [300,700,1200,1700,2100]
  },
  {
    nome: "Vale de Lava",
    ceu: "#39213e",
    chao: "#ed542e",
    topo: "#ff9a43",
    plataformas: [
      [0,440,280,60], [370,440,260,60],
      [720,440,260,60], [1080,440,250,60],
      [1430,440,300,60], [1830,440,250,60],
      [2180,440,220,60],
      [140,350,100,18], [400,310,100,18],
      [610,260,100,18], [800,340,100,18],
      [1050,280,100,18], [1190,340,100,18],
      [1460,340,100,18], [1660,280,100,18],
      [1870,340,100,18], [2220,350,100,18]
    ],
    moedas: [
      [180,315],[440,275],[650,225],[840,305],
      [1090,245],[1230,305],[1500,305],
      [1700,245],[1910,305],[2260,315]
    ],
    inimigos: [420,800,1160,1500,1900,2240]
  },
  {
    nome: "Castelo Final",
    ceu: "#20203d",
    chao: "#85859a",
    topo: "#b8b8cc",
    plataformas: [
      [0,440,350,60], [430,440,300,60],
      [810,440,300,60], [1190,440,300,60],
      [1570,440,300,60], [1950,440,450,60],
      [120,350,100,18], [310,285,100,18],
      [500,350,100,18], [690,280,100,18],
      [880,350,100,18], [1070,280,100,18],
      [1260,350,100,18], [1450,280,100,18],
      [1640,350,100,18], [1830,280,100,18],
      [2040,350,100,18], [2220,285,100,18]
    ],
    moedas: [
      [160,315],[350,250],[540,315],[730,245],
      [920,315],[1110,245],[1300,315],[1490,245],
      [1680,315],[1870,245],[2080,315],[2260,250]
    ],
    inimigos: [500,900,1300,1680,2100,2300]
  }
];

function atualizarPainel() {
  pontosTexto.textContent = "Pontos: " + pontos;
  vidasTexto.textContent = "Vidas: " + vidas;
  faseTexto.textContent = "Fase: " + (faseAtual + 1);
}

function carregarFase(numero) {
  faseAtual = numero;
  const f = fases[faseAtual];

  plataformas = f.plataformas.map(p => ({
    x: p[0], y: p[1], w: p[2], h: p[3]
  }));

  moedas = f.moedas.map(m => ({
    x: m[0], y: m[1], coletada: false
  }));

  inimigos = f.inimigos.map((x, i) => ({
    x: x,
    y: 410,
    w: 30,
    h: 30,
    inicio: x,
    direcao: i % 2 === 0 ? 1 : -1,
    vivo: true
  }));

  jogador.x = 50;
  jogador.y = 350;
  jogador.vx = 0;
  jogador.vy = 0;
  jogador.pulos = 0;

  camera = 0;
  protecao = 120;
  gameOver = false;
  venceu = false;

  mensagem.textContent =
    "Fase " + (faseAtual + 1) + ": " + f.nome;

  atualizarPainel();
}

function reiniciarFase() {
  // Reinicia a fase atual, sem voltar à primeira.
  vidas = 3;
  carregarFase(faseAtual);
}

function colide(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

function perderVida() {
  if (protecao > 0 || gameOver || venceu) return;

  vidas--;
  atualizarPainel();

  if (vidas <= 0) {
    vidas = 0;
    gameOver = true;
    mensagem.textContent =
      "Fim de jogo! Aperte R para repetir esta fase.";
    atualizarPainel();
    return;
  }

  // Respawn no início da fase em que o jogador está.
  jogador.x = Math.max(50, camera + 50);
  jogador.y = 350;
  jogador.vx = 0;
  jogador.vy = 0;
  jogador.pulos = 0;
  protecao = 120;

  mensagem.textContent =
    "Você perdeu uma vida! Continue na fase " + (faseAtual + 1) + ".";
}

function pular() {
  if (gameOver) {
    reiniciarFase();
    return;
  }

  if (venceu) {
    pontos = 0;
    vidas = 3;
    carregarFase(0);
    return;
  }

  if (jogador.pulos < 2) {
    jogador.vy = jogador.pulos === 0 ? -12 : -10;
    jogador.pulos++;
  }
}

document.addEventListener("keydown", function(e) {
  const tecla = e.key.toLowerCase();

  if ([" ", "arrowup", "arrowleft", "arrowright"].includes(tecla)) {
    e.preventDefault();
  }

  if (!teclas[tecla]) {
    if (e.code === "Space" || tecla === "w" || tecla === "arrowup") {
      pular();
    }
  }

  if (tecla === "r") {
    if (gameOver) {
      reiniciarFase();
    } else if (venceu) {
      pontos = 0;
      vidas = 3;
      carregarFase(0);
    }
  }

  teclas[tecla] = true;
});

document.addEventListener("keyup", function(e) {
  teclas[e.key.toLowerCase()] = false;
});

botao.addEventListener("click", reiniciarFase);

function atualizar() {
  if (gameOver || venceu) return;

  if (protecao > 0) protecao--;

  jogador.vx = 0;

  if (teclas["arrowright"] || teclas["d"]) {
    jogador.vx = jogador.velocidade;
  }

  if (teclas["arrowleft"] || teclas["a"]) {
    jogador.vx = -jogador.velocidade;
  }

  jogador.x += jogador.vx;
  jogador.x = Math.max(0, Math.min(LARGURA_MUNDO - jogador.w, jogador.x));

  const peAnterior = jogador.y + jogador.h;

  jogador.vy += GRAVIDADE;
  jogador.vy = Math.min(jogador.vy, 14);
  jogador.y += jogador.vy;

  jogador.pulos = Math.min(jogador.pulos, 2);

  // Chão e plataformas
  for (const p of plataformas) {
    const peAtual = jogador.y + jogador.h;
    const horizontal =
      jogador.x + jogador.w > p.x &&
      jogador.x < p.x + p.w;

    if (
      horizontal &&
      jogador.vy >= 0 &&
      peAnterior <= p.y &&
      peAtual >= p.y
    ) {
      jogador.y = p.y - jogador.h;
      jogador.vy = 0;
      jogador.pulos = 0;
    }
  }

  if (jogador.y > canvas.height + 70) {
    perderVida();
    return;
  }

  // Coletar moedas
  for (const m of moedas) {
    if (m.coletada) continue;

    if (colide(jogador, {
      x: m.x - 10, y: m.y - 10, w: 20, h: 20
    })) {
      m.coletada = true;
      pontos += 10;
      atualizarPainel();
    }
  }

  // Inimigos
  for (const inimigo of inimigos) {
    if (!inimigo.vivo) continue;

    inimigo.x += inimigo.direcao * 1.4;

    if (inimigo.x > inimigo.inicio + 45) inimigo.direcao = -1;
    if (inimigo.x < inimigo.inicio - 45) inimigo.direcao = 1;

    if (colide(jogador, inimigo)) {
      const peAntes = jogador.y + jogador.h - jogador.vy;

      if (jogador.vy > 0 && peAntes <= inimigo.y + 8) {
        inimigo.vivo = false;
        jogador.vy = -9;
        jogador.pulos = 1;
        pontos += 20;
        atualizarPainel();
      } else if (protecao <= 0) {
        perderVida();
        return;
      }
    }
  }

  // Câmera acompanha o jogador
  camera = jogador.x - canvas.width / 2;
  camera = Math.max(0, Math.min(LARGURA_MUNDO - canvas.width, camera));

  // Portal para a próxima fase
  if (jogador.x >= LARGURA_MUNDO - 65) {
    if (faseAtual < fases.length - 1) {
      carregarFase(faseAtual + 1);
    } else {
      venceu = true;
      mensagem.textContent =
        "Parabéns! Você completou as três fases!";
    }
  }
}

function desenhar() {
  const f = fases[faseAtual];

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = f.ceu;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Nuvens na primeira fase
  if (faseAtual === 0) {
    ctx.fillStyle = "white";

    for (let i = 0; i < 8; i++) {
      const x = ((i * 170 - camera * 0.25) % 1100 + 1100) % 1100;
      const y = 70 + (i % 3) * 35;

      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.arc(x + 22, y - 8, 24, 0, Math.PI * 2);
      ctx.arc(x + 45, y, 18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.save();
  ctx.translate(-camera, 0);

  // Plataformas
  for (const p of plataformas) {
    ctx.fillStyle = f.chao;
    ctx.fillRect(p.x, p.y, p.w, p.h);

    ctx.fillStyle = f.topo;
    ctx.fillRect(p.x, p.y, p.w, 7);
  }

  // Moedas
  for (const m of moedas) {
    if (m.coletada) continue;

    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(m.x, m.y, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ff9800";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Inimigos
  for (const e of inimigos) {
    if (!e.vivo) continue;

    ctx.fillStyle = faseAtual === 1 ? "#ff4b27" : "#9635a8";
    ctx.fillRect(e.x, e.y, e.w, e.h);

    ctx.fillStyle = "white";
    ctx.fillRect(e.x + 5, e.y + 6, 6, 7);
    ctx.fillRect(e.x + 19, e.y + 6, 6, 7);

    ctx.fillStyle = "black";
    ctx.fillRect(e.x + 7, e.y + 8, 3, 4);
    ctx.fillRect(e.x + 21, e.y + 8, 3, 4);
  }

  // Portal de saída
  ctx.fillStyle = "#24243d";
  ctx.fillRect(LARGURA_MUNDO - 70, 340, 45, 100);

  ctx.fillStyle = "#51f5d8";
  ctx.fillRect(LARGURA_MUNDO - 63, 350, 31, 90);

  // Personagem
  if (!(protecao > 0 && Math.floor(protecao / 6) % 2 === 0)) {
    ctx.fillStyle = "#e83f4f";
    ctx.fillRect(jogador.x, jogador.y, jogador.w, jogador.h);

    ctx.fillStyle = "#ffd0a0";
    ctx.fillRect(jogador.x + 5, jogador.y + 4, 30, 17);

    ctx.fillStyle = "#111";
    ctx.fillRect(jogador.x + 11, jogador.y + 9, 4, 5);
    ctx.fillRect(jogador.x + 25, jogador.y + 9, 4, 5);

    ctx.fillStyle = "#2455d6";
    ctx.fillRect(jogador.x + 3, jogador.y + 23, 34, 15);

    ctx.fillStyle = "#43291d";
    ctx.fillRect(jogador.x, jogador.y + 39, 17, 9);
    ctx.fillRect(jogador.x + 23, jogador.y + 39, 17, 9);
  }

  ctx.restore();

  // Tela final
  if (gameOver || venceu) {
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = venceu ? "#ffe347" : "#ff6464";
    ctx.font = "bold 36px Arial";

    ctx.fillText(
      venceu ? "VOCÊ VENCEU!" : "FIM DE JOGO",
      canvas.width / 2,
      210
    );

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";

    ctx.fillText(
      venceu ? "Você completou as três fases!" :
      "Você está na fase " + (faseAtual + 1),
      canvas.width / 2,
      255
    );

    ctx.fillText(
      "Aperte R para continuar",
      canvas.width / 2,
      295
    );

    ctx.textAlign = "left";
  }
}

function loop() {
  atualizar();
  desenhar();
  requestAnimationFrame(loop);
}

carregarFase(0);
loop();
