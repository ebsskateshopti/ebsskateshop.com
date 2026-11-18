/* todos os dados editáveis vêm de js/dados.js (painel admin). Com ?previa na URL, usa o rascunho salvo no navegador. */
const DADOS = (() => { let d = window.DADOS; try { if (/[?&]previa/.test(location.search)) { const r = localStorage.getItem("ebs-rascunho"); if (r) d = JSON.parse(r); } } catch (_) {} return d; })();
const STORE = DADOS.loja;
const pend = t => `<mark class="pend">${t}</mark>`;
const zapUrl = msg => `https://wa.me/${STORE.ddd ? "55" + STORE.ddd + STORE.fone : ""}${msg ? "?text=" + encodeURIComponent(msg) : ""}`;

const CATEGORIAS = DADOS.categorias.map(c => ({ ...c, subs: c.subs.map(s => s.slice()) }));
const catPor = Object.fromEntries(CATEGORIAS.map(c => [c.slug, c]));
const PRODUTOS = DADOS.produtos.map(r => ({ ...r, tamanhos: r.tamanhos !== undefined ? r.tamanhos : ((catPor[r.cat] && catPor[r.cat].tamanhos) || null) }));
/* Produtos sem foto ficam escondidos do site. Para mostrá-los de novo, troque para true. */
const MOSTRAR_SEM_FOTO = false;
if (!MOSTRAR_SEM_FOTO) { for (let i = PRODUTOS.length - 1; i >= 0; i--) if (!PRODUTOS[i].img) PRODUTOS.splice(i, 1); }
/* Abas de marca sem produto ficam escondidas. Para mostrá-las de novo, troque para false. */
const ESCONDER_SUBCATEGORIAS_VAZIAS = true;
if (ESCONDER_SUBCATEGORIAS_VAZIAS) CATEGORIAS.forEach(c => { c.subs = c.subs.filter(([s]) => PRODUTOS.some(p => p.sub === s)); });
/* Categorias sem produto ficam escondidas (Roupas e Parafusos reaparecem quando tiverem produto). Para mostrá-las como "Em breve", troque para false. */
const ESCONDER_CATEGORIAS_VAZIAS = true;
if (ESCONDER_CATEGORIAS_VAZIAS) {
  for (let i = CATEGORIAS.length - 1; i >= 0; i--) if (!PRODUTOS.some(p => p.cat === CATEGORIAS[i].slug)) CATEGORIAS.splice(i, 1);
}
const PROMOCOES = PRODUTOS.filter(p => p.promo);

const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const $ = s => document.querySelector(s);
const esc = s => s.replace(/[&<>"']/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[ch]));
const marcar = t => esc(t).replace(/\*(.+?)\*/g, '<span class="marca">$1</span>');

/* ---------- carrinho (persistido neste navegador) ---------- */
const KEY = "ebs-carrinho";
let carrinho = [];
try { carrinho = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { carrinho = []; }
const salvar = () => { try { localStorage.setItem(KEY, JSON.stringify(carrinho)); } catch (e) {} };

function adicionar(id, tamanho) {
  const i = carrinho.findIndex(x => x.id === id && x.tamanho === tamanho);
  if (i >= 0) carrinho[i].qtd++; else carrinho.push({ id, tamanho, qtd: 1 });
  salvar(); atualizarCarrinho();
  toast("Adicionado ao carrinho");
}
function mudarQtd(i, delta) {
  carrinho[i].qtd += delta;
  if (carrinho[i].qtd < 1) carrinho.splice(i, 1);
  salvar(); atualizarCarrinho();
}
function remover(i) { carrinho.splice(i, 1); salvar(); atualizarCarrinho(); }

function atualizarCarrinho() {
  const total = carrinho.reduce((a, x) => a + x.qtd, 0);
  const badge = $("#contador");
  badge.hidden = total === 0; badge.textContent = total;
  renderCarrinho();
}

function renderCarrinho() {
  const lista = $("#lista-carrinho");
  const cta = $("#cta-carrinho");
  if (!carrinho.length) {
    lista.innerHTML = `<p class="empty">Seu carrinho está vazio.</p>`;
    cta.hidden = true; return;
  }
  cta.hidden = false;
  let soma = 0, consultar = false;
  lista.innerHTML = carrinho.map((x, i) => {
    const p = PRODUTOS.find(p => p.id === x.id);
    if (!p) return "";
    if (p.preco == null) consultar = true; else soma += p.preco * x.qtd;
    return `<div class="cart-line">
      <div>
        <h4>${esc(p.nome)}</h4>
        ${x.tamanho ? `<small>Tamanho ${esc(x.tamanho)}</small>` : ""}
        <small>${p.preco == null ? "Preço a consultar" : brl(p.preco)}</small>
        <div class="qty">
          <button aria-label="Diminuir" data-acao="qtd" data-i="${i}" data-d="-1">−</button>
          <span>${x.qtd}</span>
          <button aria-label="Aumentar" data-acao="qtd" data-i="${i}" data-d="1">+</button>
        </div>
      </div>
      <div><button class="rm" data-acao="rem" data-i="${i}">remover</button></div>
    </div>`;
  }).join("");
  $("#total").textContent = soma > 0 || !consultar ? brl(soma) : "A consultar";
  $("#nota-total").textContent = consultar ? "Alguns itens têm preço a consultar. O total final sai na confirmação." : "";
}

function mensagemPedido() {
  let soma = 0, consultar = false;
  const linhas = carrinho.map(x => {
    const p = PRODUTOS.find(p => p.id === x.id);
    if (p.preco == null) consultar = true; else soma += p.preco * x.qtd;
    return `- ${x.qtd}x ${p.nome}${x.tamanho ? ` (tam. ${x.tamanho})` : ""}${p.preco != null ? ` — ${brl(p.preco * x.qtd)}` : ""}`;
  });
  let msg = `Fala, EBS! Quero fazer este pedido:\n${linhas.join("\n")}`;
  if (soma > 0) msg += `\nTotal: ${brl(soma)}${consultar ? " (+ itens a consultar)" : ""}`;
  return msg;
}

$("#enviar-pedido").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = zapUrl(mensagemPedido());
  a.target = "_blank"; a.rel = "noopener noreferrer";
  document.body.appendChild(a); a.click(); a.remove();
});

/* ---------- produtos ---------- */
const ICO_CARRINHO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2.5l2 11h10l2-8H7"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/></svg>`;
const ICO_ZAP = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8.3 18.8z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-.8.8c-1-.4-1.8-1.2-2.2-2.2l.8-.8-1-2z"/></svg>`;
function cardProduto(p) {
  const opcoes = p.tamanhos ? `<select aria-label="Tamanho de ${esc(p.nome)}">
      <option value="" selected disabled>Escolha o tamanho</option>${p.tamanhos.map(t => `<option>${t}</option>`).join("")}</select>` : "";
  const preco = p.preco == null
    ? `<p class="preco consulte">Consulte o preço no WhatsApp</p>`
    : `<p class="preco">${brl(p.preco)}</p>`;
  return `<article class="card">
    <a class="card-link" href="#/p/${p.id}" tabindex="-1" aria-hidden="true"><div class="img${p.img ? " tem-foto" : ""}" aria-hidden="true">${p.novo ? `<b class="selo">Novo</b>` : ""}${p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy">` : GLIFO}</div></a>
    <h4><a class="card-link" href="#/p/${p.id}">${esc(p.nome)}</a></h4>
    <div class="card-corpo">
      ${preco}
      ${opcoes}
      <div class="card-btns">
        <button class="btn btn-comprar" data-acao="comprar" data-id="${p.id}" data-t="${!!p.tamanhos}">Comprar agora</button>
        <button class="btn btn-carrinho" data-acao="add" data-id="${p.id}" data-t="${!!p.tamanhos}" aria-label="Adicionar ${esc(p.nome)} ao carrinho">${ICO_CARRINHO}</button>
      </div>
      <button class="btn btn-zap-card" data-acao="zapc" data-id="${p.id}">${ICO_ZAP}<span>Consulte-nos pelo WhatsApp</span></button>
    </div>
  </article>`;
}
function exigirTamanho(sel) {
  if (!sel || sel.value) return true;
  toast("Escolha o tamanho primeiro"); sel.focus(); sel.classList.add("erro"); setTimeout(() => sel.classList.remove("erro"), 1800);
  return false;
}
function adicionarDoCard(id, temTamanho, btn) {
  const sel = temTamanho ? btn.closest(".card").querySelector("select") : null;
  if (!exigirTamanho(sel)) return false;
  adicionar(id, sel ? sel.value : undefined);
  btn.classList.add("added"); setTimeout(() => btn.classList.remove("added"), 1400);
  return true;
}

/* ---------- roteamento por hash ---------- */
const views = ["home", "catalogo", "produto", "contato"];
function mostrar(nome) {
  views.forEach(v => document.getElementById(`v-${v}`).hidden = v !== nome);
  if (nome === "home") { $("#slides").scrollLeft = 0; marcarSlide(0); }
}

function renderCatalogo(titulo, filtro, subAtual, linkBase) {
  mostrar("catalogo");
  $("#titulo-catalogo").textContent = titulo;
  $("#bc-atual").textContent = titulo;
  const subs = filtro.subs;
  $("#subcats").innerHTML = subs ? subs.map(([s, n]) =>
    `<a class="chip ${s === subAtual ? "on" : ""}" href="#/c/${filtro.slug}/${s}">${esc(n)}</a>`).join("") : "";
  const lista = PRODUTOS.filter(p => filtro.slug === "promocoes" ? PROMOCOES.includes(p)
    : (subAtual ? p.sub === subAtual : p.cat === filtro.slug));
  $("#grid-produtos").innerHTML = lista.map(cardProduto).join("") || `<p class="empty">Ainda não tem produto aqui. <a href="${zapUrl()}" target="_blank" rel="noopener noreferrer">Chama no WhatsApp</a> e vê o que tem na loja.</p>`;
}

let rotaAtual = "";
function rota(p) {
  const h = (typeof p === "string" ? p : location.hash).replace(/^#/, "") || "/";
  rotaAtual = "#" + h;
  document.title = TITULO_PADRAO;
  const partes = h.split("/").filter(Boolean);
  window.scrollTo({ top: 0 });
  marcarNav(); marcarHoje();
  if (partes[0] === "c" && partes[1]) {
    const cat = CATEGORIAS.find(c => c.slug === partes[1]);
    if (!cat) return mostrar("home");
    const sub = partes[2] ? cat.subs.find(s => s[0] === partes[2]) : null;
    if (partes[2] && !sub) return mostrar("home");
    return renderCatalogo(sub ? sub[1] : cat.nome, { slug: cat.slug, subs: cat.subs }, sub ? sub[0] : null);
  }
  if (partes[0] === "p" && partes[1]) return renderProduto(decodeURIComponent(partes[1]));
  if (partes[0] === "promocoes") return renderCatalogo("Quinta da Oferta", { slug: "promocoes", subs: null }, null);
  if (partes[0] === "contato") return mostrar("contato");
  mostrar("home");
}

function renderTiles() {
  $("#tiles").innerHTML = CATEGORIAS.map((c, i) => {
    const n = PRODUTOS.filter(p => p.cat === c.slug).length;
    const f = FOTO_CAT[c.slug];
    const est = f ? ` style="background-image:linear-gradient(rgba(0,0,0,.05),rgba(0,0,0,.8)),url('${f}')"` : "";
    return `<a class="tile${i === 0 ? " destaque" : ""}${f ? " foto" : ""}" href="#/c/${c.slug}"${est}><h3>${esc(c.nome)}</h3>${i === 0 ? `<i class="ebs-mark" aria-hidden="true"></i>` : ""}<span>${n ? "Ver todos os produtos" : "Em breve"}</span></a>`;
  }).join("");
  /* última capa ocupa o espaço que sobraria vazio na grade */
  const n = CATEGORIAS.length, r = (n - 1 - 4) > 0 ? (n - 1 - 4) % 3 : 0;
  $("#tiles").style.setProperty("--span-d", r ? 1 + (3 - r) : 1);
  $("#tiles").style.setProperty("--span-m", (n - 1) % 2 ? 2 : 1);
}
function montarMenu() {
  const l = (h, t, extra = "") => `<a href="${h}"${extra}>${esc(t)}</a>`;
  $("#menu-nav").innerHTML = l("#/", "Início") + (PROMOCOES.length ? l("#/promocoes", "Quinta da Oferta") : "") +
    CATEGORIAS.map(c => c.subs.length > 1
      ? `<details><summary>${esc(c.nome)}</summary><ul><li>${l("#/c/" + c.slug, "Ver tudo")}</li>${c.subs.map(([s, n]) => `<li>${l("#/c/" + c.slug + "/" + s, n)}</li>`).join("")}</ul></details>`
      : l("#/c/" + c.slug, c.nome)).join("") +
    l("#encontrar", "Como nos encontrar", ' data-acao="enc"') + l("#/contato", "Contato e horários");
}
/* endereço, telefone, mapa e foto da fachada: tudo sai de STORE e FOTOS */
const ICONES_INFO = [
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H10l-5 4v-4H4z"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/></svg>`];
function aplicarConteudo() {
  const T = DADOS.tema || {}, root = document.documentElement.style;
  if (T.acc) root.setProperty("--acc", T.acc);
  if (T.fundo) { root.setProperty("--asfalto", T.fundo); const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = T.fundo; }
  if (T.cartao) root.setProperty("--grafite", T.cartao);
  document.querySelectorAll("[data-txt]").forEach(e => { const t = DADOS.textos[e.dataset.txt]; if (t != null) e.textContent = t; });
  const info = $("#info-faixa");
  if (info) { const L = (DADOS.textos.info || []).filter(i => i.titulo || i.texto); info.innerHTML = L.map((i, k) => `<p>${ICONES_INFO[k % 2]}<span>${i.titulo ? `<b>${esc(i.titulo)}</b> ` : ""}${esc(i.texto || "")}</span></p>`).join(""); info.parentElement.hidden = !L.length; }
  document.querySelectorAll("dl[data-horarios]").forEach(dl => { dl.innerHTML = (STORE.horarios || []).map(h => `<div data-dias="${esc(h.dias)}"><dt>${esc(h.rotulo)}</dt><dd>${esc(h.texto)}</dd></div>`).join(""); });
  const mi = $("#img-marcas"); if (mi && DADOS.imagens.marcas) mi.src = DADOS.imagens.marcas;
  $("#sec-marcas").hidden = !DADOS.imagens.marcas;
  document.title = `${STORE.nome} | ${DADOS.textos.slogan || ""}`.replace(/ \| $/, "");
}
function aplicarLoja() {
  const loc = [STORE.endereco, STORE.cidade].filter(Boolean).join(", ");
  const q = loc || "EBS Skateshop";
  const endHtml = (STORE.endereco ? esc(STORE.endereco) : pend("endereço a confirmar")) + "<br>" + (STORE.cidade ? esc(STORE.cidade) : pend("cidade a confirmar"));
  const f = STORE.fone, foneTxt = `${STORE.ddd ? "(" + STORE.ddd + ") " : ""}${f.slice(0, 5)}-${f.slice(5)}`;
  document.querySelectorAll("[data-end]").forEach(e => e.innerHTML = endHtml);
  document.querySelectorAll("[data-fone]").forEach(e => { e.innerHTML = STORE.ddd ? foneTxt : `${pend("DDD")} ${foneTxt}`; e.href = zapUrl("Fala, EBS!"); });
  document.querySelectorAll("[data-zap]").forEach(e => e.href = zapUrl(e.dataset.zap));
  document.querySelectorAll("[data-rota]").forEach(e => e.href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(q));
  document.querySelectorAll("[data-maps]").forEach(e => e.href = STORE.mapsUrl || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q));
  if (!FOTOS.fachada) document.querySelectorAll(".mapa-cartao, .fachada-ph").forEach(e => { e.hidden = true; });
  if (FOTOS.fachada) document.querySelectorAll("[data-fachada]").forEach(e => e.innerHTML = `<img src="${esc(FOTOS.fachada)}" alt="Fachada da EBS Skateshop">`);
}

/* ---------- menu, carrinho e toast ---------- */
function abrir(id) {
  $("#scrim").classList.add("on");
  const el = document.getElementById(id);
  el.removeAttribute("inert"); el.classList.add("on"); el.setAttribute("aria-hidden", "false");
  (el.querySelector("input") || el.querySelector("button")).focus({ preventScroll: true });
}
function fechar() {
  $("#scrim").classList.remove("on");
  ["menu", "carrinho", "busca"].forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove("on"); el.setAttribute("aria-hidden", "true"); el.setAttribute("inert", "");
  });
  $("#abrir-menu").setAttribute("aria-expanded", "false");
}
$("#abrir-menu").addEventListener("click", () => { abrir("menu"); $("#abrir-menu").setAttribute("aria-expanded", "true"); });
$("#fechar-menu").addEventListener("click", fechar);
$("#abrir-carrinho").addEventListener("click", () => abrir("carrinho"));
$("#fechar-carrinho").addEventListener("click", fechar);
$("#scrim").addEventListener("click", fechar);
document.querySelectorAll(".menu a").forEach(a => a.addEventListener("click", fechar));
document.addEventListener("keydown", e => { if (e.key === "Escape") fechar(); });

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("on"), 1600);
}


/* ---------- logo e fotos ---------- */
const LOGO = DADOS.imagens.logo;
const EBS_LETRAS = DADOS.imagens.letras;
const FOTOS = { fachada: DADOS.imagens.fachada };
const FOTO_CAT = Object.fromEntries(CATEGORIAS.filter(c => c.capa).map(c => [c.slug, c.capa]));

/* ---------- carrossel ----------
   *palavra* vira o destaque manuscrito. Para foto de fundo, preencha img no slide. */
const SLIDES = DADOS.slides.map(s => ({ ...s, cta: (s.cta || []).filter(c => !(c[1] === "#/promocoes" && !PROMOCOES.length)).map(([t, l]) => [t, l.startsWith("zap:") ? zapUrl(l.slice(4)) : l]) }));

let slideAtual = 0, carTimer = null;
const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function linkCta(t, h, primario, claro) {
  const ext = h.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : "";
  const cls = claro ? (primario ? "btn-escuro" : "btn-escuro-linha") : (primario ? "btn-red" : "btn-linha");
  return `<a class="btn ${cls}" href="${h}"${ext}>${esc(t)}</a>`;
}

function renderCarrossel() {
  const el = $("#slides");
  el.innerHTML = SLIDES.map((s, i) => {
    const claro = false;
    const foto = s.img ? ` style="background-image:linear-gradient(90deg,rgba(14,15,13,.92),rgba(14,15,13,.45)),url('${s.img}')"` : "";
    const visual = s.visual === "logo"
      ? `<img class="logo-big" alt="Logo da EBS Skateshop" src="${LOGO}">`
      : s.grande ? `<div class="big" aria-hidden="true">${esc(s.grande)}</div>` : "";
    return `<div class="slide ${s.tema}${s.img ? " s-foto" : ""}" role="group" aria-roledescription="slide" aria-label="${i + 1} de ${SLIDES.length}"${foto}>
      <div class="slide-in">
        <div>
          <h2>${marcar(s.titulo)}</h2>${s.marca ? `<span class="slogan">${esc(s.marca)}</span>` : ""}
          <p>${esc(s.texto)}</p>
          <div class="ctas">${s.cta.map(([t, h], j) => linkCta(t, h, j === 0, claro)).join("")}</div>
        </div>
        ${visual}
      </div>
    </div>`;
  }).join("");
  $("#dots").innerHTML = SLIDES.map((_, i) => `<button aria-label="Ir para o slide ${i + 1}" data-i="${i}"></button>`).join("");
  document.querySelectorAll(".logo-img").forEach(img => img.src = LOGO);
  marcarSlide(0);
}
function marcarSlide(i) {
  slideAtual = i;
  document.querySelectorAll("#dots button").forEach((b, j) => b.setAttribute("aria-current", j === i ? "true" : "false"));
}
function irPara(i) {
  const el = $("#slides");
  if (!el.clientWidth) return;
  const n = SLIDES.length;
  i = (i + n) % n;
  el.scrollTo({ left: i * el.clientWidth, behavior: reduzMovimento ? "auto" : "smooth" });
  marcarSlide(i);
}
function iniciarAuto() {
  if (reduzMovimento) return;
  pararAuto();
  carTimer = setInterval(() => irPara(slideAtual + 1), 6500);
}
function pararAuto() { clearInterval(carTimer); carTimer = null; }

$("#car-ant").addEventListener("click", () => { irPara(slideAtual - 1); pararAuto(); });
$("#car-prox").addEventListener("click", () => { irPara(slideAtual + 1); pararAuto(); });
$("#dots").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { irPara(+b.dataset.i); pararAuto(); } });
$("#slides").addEventListener("scroll", () => {
  const el = $("#slides");
  if (!el.clientWidth) return;
  const i = Math.round(el.scrollLeft / el.clientWidth);
  if (i !== slideAtual) marcarSlide(i);
}, { passive: true });
const carEl = document.querySelector(".carrossel");
carEl.addEventListener("mouseenter", pararAuto);
carEl.addEventListener("mouseleave", iniciarAuto);
carEl.addEventListener("focusin", pararAuto);
carEl.addEventListener("touchstart", pararAuto, { passive: true });

/* ---------- prateleiras da home (só produtos reais) ---------- */
const GLIFO = `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" aria-hidden="true"><circle cx="32" cy="32" r="24"/><circle cx="32" cy="32" r="6" fill="currentColor"/><path d="M32 8v18M32 38v18M8 32h18M38 32h18"/></svg>`;
function cardPrat(p) {
  return `<div class="pcard">${cardProduto(p)}</div>`;
}
function renderPrateleiras() {
  const sel = (t, cats) => [t, PRODUTOS.filter(p => cats.includes(p.cat))];
  const grupos = [sel("Skates e shapes", ["skates-montados", "shapes"]), sel("Trucks, rodas e peças", ["trucks", "rodas", "rolamentos", "parafusos-e-acessorios"]),
    sel("Tênis e roupas", ["tenis", "roupas"]), sel("Proteção", ["protecao"])].filter(([, l]) => l.length);
  $("#sec-prat").hidden = !grupos.length;
  $("#prateleiras").innerHTML = grupos.map(([t, lista]) => `<div class="prat">
    <div class="prat-head"><h2>${t}</h2><div class="arrows">
      <button data-dir="-1" aria-label="Ver anteriores de ${t}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
      <button data-dir="1" aria-label="Ver próximos de ${t}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg></button>
    </div></div>
    <div class="trilho">${lista.map(cardPrat).join("")}</div></div>`).join("");
  ajustarSetas();
}
function renderQuinta() {
  $("#sec-quinta").hidden = !PROMOCOES.length;
  $("#trilho-quinta").innerHTML = PROMOCOES.map(cardPrat).join("");
}
function ajustarSetas() {
  document.querySelectorAll(".prat").forEach(b => { b.querySelector(".arrows").hidden = b.querySelector(".trilho").scrollWidth <= b.querySelector(".trilho").clientWidth + 2; });
}
$("#prateleiras").addEventListener("click", e => {
  const b = e.target.closest("button[data-dir]"); if (!b) return;
  const t = b.closest(".prat").querySelector(".trilho");
  t.scrollBy({ left: +b.dataset.dir * t.clientWidth * .9, behavior: reduzMovimento ? "auto" : "smooth" });
});
window.addEventListener("resize", ajustarSetas);


/* ---------- página de produto ---------- */
const TITULO_PADRAO = document.title;
function abrirZap(msg) {
  const a = document.createElement("a");
  a.href = zapUrl(msg);
  a.target = "_blank"; a.rel = "noopener noreferrer";
  document.body.appendChild(a); a.click(); a.remove();
}
function renderProduto(id) {
  const p = PRODUTOS.find(x => x.id === id);
  if (!p) return mostrar("home");
  mostrar("produto");
  document.title = `${p.nome} | EBS Skateshop`;
  const cat = CATEGORIAS.find(c => c.slug === p.cat);
  const sub = cat && cat.subs.find(s => s[0] === p.sub);
  const preco = p.preco == null
    ? `<p class="prod-preco consulte">Consulte o preço no WhatsApp</p>`
    : `<p class="prod-preco">${brl(p.preco)}</p>`;
  const tam = p.tamanhos ? `<label class="prod-label" for="tp-${p.id}">Tamanho</label><select id="tp-${p.id}"><option value="" selected disabled>Escolha o tamanho</option>${p.tamanhos.map(t => `<option>${esc(t)}</option>`).join("")}</select>` : "";
  const ficha = p.ficha ? `<h2 class="prod-sub">Ficha técnica</h2><ul class="prod-ficha">${p.ficha.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
  let rel = PRODUTOS.filter(x => x.id !== p.id && x.img && x.sub === p.sub);
  rel = rel.concat(PRODUTOS.filter(x => x.id !== p.id && x.img && x.cat === p.cat && x.sub !== p.sub)).slice(0, 4);
  $("#produto-conteudo").innerHTML = `
    <p class="breadcrumb"><a href="#/">Início</a> / ${cat ? `<a href="#/c/${p.cat}">${esc(cat.nome)}</a>` : ""}${sub ? ` / <a href="#/c/${p.cat}/${p.sub}">${esc(sub[1])}</a>` : ""} / ${esc(p.nome)}</p>
    <div class="prod">
      <div class="prod-img${p.img ? " tem-foto" : ""}">${p.img ? `<img src="${esc(p.img)}" alt="${esc(p.nome)}">` : GLIFO}</div>
      <div class="prod-info">
        <h1 class="prod-titulo">${esc(p.nome)}</h1>
        ${preco}
        <p class="prod-desc">${esc(p.desc)}</p>
        ${tam}
        <div class="prod-acoes">
          <button class="btn btn-comprar-p" data-acao="comprarp" data-id="${p.id}">Comprar agora</button>
          <button class="btn btn-add-p" data-acao="addp" data-id="${p.id}">Adicionar ao carrinho</button>
          <button class="btn btn-zap-card" data-acao="zapp" data-id="${p.id}">${ICO_ZAP}<span>Consulte-nos pelo WhatsApp</span></button>
        </div>
        <p class="note">Pagamento, retirada e entrega são combinados pelo WhatsApp.</p>
        ${ficha}
      </div>
    </div>
    ${rel.length ? `<h2 class="rel-titulo">Você também pode gostar</h2><div class="rel">${rel.map(cardPrat).join("")}</div>` : ""}`;
}

/* ---------- busca ---------- */
const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
function resultadosBusca(q) {
  const termos = norm(q).split(/\s+/).filter(Boolean);
  if (!termos.length) return null;
  const cats = [];
  CATEGORIAS.forEach(c => {
    if (termos.every(t => norm(c.nome).includes(t))) cats.push([c.nome, `#/c/${c.slug}`]);
    c.subs.forEach(([s, n]) => { if (s !== c.slug && termos.every(t => norm(`${c.nome} ${n}`).includes(t))) cats.push([`${c.nome}: ${n}`, `#/c/${c.slug}/${s}`]); });
  });
  const prods = PRODUTOS.map(p => {
    const cat = CATEGORIAS.find(c => c.slug === p.cat), sub = cat && cat.subs.find(s => s[0] === p.sub);
    const alvo = norm([p.nome, p.desc, cat && cat.nome, sub && sub[1], (p.ficha || []).join(" ")].join(" "));
    return { p, ok: termos.every(t => alvo.includes(t)), peso: (norm(p.nome).includes(termos[0]) ? 0 : 2) + (p.img ? 0 : 4) };
  }).filter(x => x.ok).sort((a, b) => a.peso - b.peso).map(x => x.p);
  return { cats: cats.slice(0, 5), prods: prods.slice(0, 8), total: prods.length };
}
function renderBusca(q) {
  const corpo = $("#busca-corpo");
  const r = resultadosBusca(q);
  if (!r) {
    corpo.innerHTML = `<h3>Categorias</h3><div class="chips-busca">${CATEGORIAS.map(c => `<a class="chip" href="#/c/${c.slug}">${esc(c.nome)}</a>`).join("")}</div>`;
    return;
  }
  if (!r.cats.length && !r.prods.length) {
    corpo.innerHTML = `<p class="busca-vazio">Nada encontrado para “${esc(q)}”. <a href="${zapUrl("Fala, EBS! Vocês têm " + q + "?")}" target="_blank" rel="noopener noreferrer">Pergunte no WhatsApp</a>.</p>`;
    return;
  }
  corpo.innerHTML =
    (r.cats.length ? `<h3>Categorias</h3><div class="chips-busca">${r.cats.map(([n, h]) => `<a class="chip" href="${h}">${esc(n)}</a>`).join("")}</div>` : "") +
    (r.prods.length ? `<h3>Produtos</h3>${r.prods.map(p => {
      const c = CATEGORIAS.find(x => x.slug === p.cat);
      return `<a class="res" href="#/p/${p.id}"><span class="res-img">${p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy">` : GLIFO}</span><span class="res-txt"><b>${esc(p.nome)}</b><small>${esc(c ? c.nome : "")} · ${p.preco == null ? "Consulte no WhatsApp" : brl(p.preco)}</small></span></a>`;
    }).join("")}` : "");
}
$("#abrir-busca").addEventListener("click", () => { abrir("busca"); $("#busca-input").select(); renderBusca($("#busca-input").value); });
$("#fechar-busca").addEventListener("click", fechar);
$("#busca-input").addEventListener("input", e => renderBusca(e.target.value));
$("#busca-input").addEventListener("keydown", e => {
  if (e.key === "Enter") { const l = $("#busca-corpo .res, #busca-corpo .chip"); if (l) l.click(); }
});

/* ---------- navegação do topo e horário de hoje ---------- */
function montarNav() {
  const itens = [...CATEGORIAS.map(c => [c.curto || c.nome, `#/c/${c.slug}`]), ...(PROMOCOES.length ? [["Oferta", "#/promocoes"]] : []), ["Contato", "#/contato"]];
  $("#nav-inline").innerHTML = itens.map(([n, h]) => `<a href="${h}">${esc(n)}</a>`).join("");
}
function marcarNav() {
  const h = rotaAtual || "#/";
  document.querySelectorAll("#nav-inline a").forEach(a => {
    const href = a.getAttribute("href");
    if (h === href || h.startsWith(href + "/")) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
  });
}
function marcarHoje() {
  const d = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(new Date().toLocaleString("en-US", { timeZone: "America/Belem", weekday: "short" }));
  document.querySelectorAll("dl [data-dias]").forEach(r => { r.dataset.hoje = r.dataset.dias.split(",").includes(String(d)); });
}
document.addEventListener("click", e => {
  const l = e.target.closest("a[href]");
  if (l && !e.defaultPrevented && e.button === 0 && !(e.metaKey || e.ctrlKey || e.shiftKey)) {
    const href = l.getAttribute("href");
    if (href.startsWith("#/")) {
      e.preventDefault(); fechar();
      try { history.pushState(null, "", href); } catch (_) {}
      rota(href); return;
    }
    if (l.target === "_blank") {
      e.preventDefault();
      const w = window.open(l.href, "_blank");
      if (w) { try { w.opener = null; } catch (_) {} } else { location.href = l.href; }
      return;
    }
  }
  const b = e.target.closest("[data-acao]"); if (!b) return;
  const a = b.dataset.acao;
  if (a === "qtd") mudarQtd(+b.dataset.i, +b.dataset.d);
  else if (a === "rem") remover(+b.dataset.i);
  else if (a === "add") adicionarDoCard(b.dataset.id, b.dataset.t === "true", b);
  else if (a === "comprar") { if (adicionarDoCard(b.dataset.id, b.dataset.t === "true", b)) abrir("carrinho"); }
  else if (a === "zapc") {
    const p = PRODUTOS.find(x => x.id === b.dataset.id), sel = b.closest(".card").querySelector("select");
    abrirZap(`Fala, EBS! Tenho interesse neste produto: ${p.nome}${sel && sel.value ? ` (tam. ${sel.value})` : ""}${p.preco != null ? ` — ${brl(p.preco)}` : ""}. Ele está disponível?`);
  }
  else if (a === "comprarp") {
    const sel = document.getElementById("tp-" + b.dataset.id);
    if (!exigirTamanho(sel)) return;
    adicionar(b.dataset.id, sel ? sel.value : undefined); abrir("carrinho");
  }
  else if (a === "addp") {
    const sel = document.getElementById("tp-" + b.dataset.id);
    if (!exigirTamanho(sel)) return;
    adicionar(b.dataset.id, sel ? sel.value : undefined);
    b.classList.add("added"); b.textContent = "Adicionado ✓";
    setTimeout(() => { b.classList.remove("added"); b.textContent = "Adicionar ao carrinho"; }, 1400);
  }
  else if (a === "zapp") {
    const p = PRODUTOS.find(x => x.id === b.dataset.id), sel = document.getElementById("tp-" + b.dataset.id);
    abrirZap(`Fala, EBS! Tenho interesse neste produto: ${p.nome}${sel && sel.value ? ` (tam. ${sel.value})` : ""}${p.preco != null ? ` — ${brl(p.preco)}` : ""}. Ele está disponível?`);
  }
  else if (a === "enc") { e.preventDefault(); fechar(); document.getElementById("encontrar").scrollIntoView({ behavior: reduzMovimento ? "auto" : "smooth" }); }
});
aplicarConteudo();
document.documentElement.style.setProperty("--ebs", `url("${EBS_LETRAS}")`);
montarNav();
montarMenu();
aplicarLoja();
window.addEventListener("hashchange", rota);
window.addEventListener("popstate", () => rota());
renderCarrossel();
iniciarAuto();
renderTiles();
renderPrateleiras();
renderQuinta();
atualizarCarrinho();

/* todos os cartões visíveis ficam com a mesma altura; a foto absorve a diferença */
function igualarCards() {
  const cards = [...document.querySelectorAll(".view:not([hidden]) .card")];
  cards.forEach(c => { c.style.minHeight = ""; });
  if (!cards.length) return;
  const w = cards[0].getBoundingClientRect().width;
  const h = Math.max(alturaReferencia(w), ...cards.map(c => c.getBoundingClientRect().height));
  if (h) cards.forEach(c => { c.style.minHeight = h + "px"; });
}
/* altura de um cartão "completo" (com seletor e preço a consultar): vale para todas as páginas */
function alturaReferencia(w) {
  const ref = PRODUTOS.find(p => p.tamanhos && p.preco == null) || PRODUTOS.find(p => p.tamanhos);
  if (!ref || !w) return 0;
  const d = document.createElement("div");
  d.style.cssText = `position:absolute;visibility:hidden;left:-9999px;top:0;width:${w}px`;
  d.innerHTML = cardProduto(ref); document.body.appendChild(d);
  const h = d.firstElementChild.getBoundingClientRect().height; d.remove(); return h;
}
let igualarPendente = false;
const pedirIgualar = () => { if (igualarPendente) return; igualarPendente = true; requestAnimationFrame(() => { igualarPendente = false; igualarCards(); }); };
new MutationObserver(pedirIgualar).observe(document.querySelector("main"), { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
window.addEventListener("resize", pedirIgualar);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(pedirIgualar);
rota();
pedirIgualar();
