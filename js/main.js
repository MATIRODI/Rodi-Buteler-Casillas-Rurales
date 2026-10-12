/* Rodi-Buteler Casillas Rurales
 *
 * PRECIOS Y DATOS: editá solo este bloque.
 * Si cambiás el precio de una casilla, cambialo también en index.html
 * (texto de la tarjeta y bloque "application/ld+json") para que Google lo vea igual.
 */
const CONFIG = {
  whatsapp: '5493516508433',
  precioKm: 3500,
  casillas: [
    { id: 'casilla-4-camas',  nombre: 'Casilla 4 camas',             precio: 300000, foto: 'img/casilla-4-camas-exterior-th.webp',  incluye: [] },
    { id: 'casilla-6-camas',  nombre: 'Casilla 6 camas',             precio: 350000, foto: 'img/casilla-6-camas-exterior-th.webp',  incluye: ['mesa'] },
    { id: 'casilla-comedor',  nombre: 'Casilla dormitorio + comedor', precio: 400000, foto: 'img/casilla-comedor-exterior-th.webp', incluye: ['mesa'] },
    { id: 'casilla-con-bano', nombre: 'Casilla con baño y aire',     precio: 480000, foto: 'img/casilla-con-bano-exterior-th.webp', incluye: ['colchon', 'aire'] },
    { id: 'casilla-7-metros', nombre: 'Casilla grande 7 m',          precio: 450000, foto: 'img/casilla-7-metros-lateral-th.webp',  incluye: [] },
    { id: 'oficina-movil',    nombre: 'Oficina móvil',               precio: 250000, foto: 'img/oficina-movil-frente-th.webp',      incluye: [] },
  ],
  // precio por mes, por unidad
  comodidades: [
    { id: 'colchon',  nombre: 'Colchones',            singular: 'colchón',  plural: 'colchones',  precio: 6000,  max: 8 },
    { id: 'mesa',     nombre: 'Mesa',                 singular: 'mesa',     plural: 'mesas',      precio: 8000,  max: 2 },
    { id: 'silla',    nombre: 'Sillas',               singular: 'silla',    plural: 'sillas',     precio: 2500,  max: 8 },
    { id: 'heladera', nombre: 'Heladera con freezer', singular: 'heladera', plural: 'heladeras',  precio: 30000, max: 2 },
    { id: 'aire',     nombre: 'Aire acondicionado',   singular: 'aire acondicionado', plural: 'equipos de aire', precio: 55000, max: 2 },
  ],
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = n => '$' + Math.round(n).toLocaleString('es-AR');

const state = {
  casilla: CONFIG.casillas[1].id,
  qty: Object.fromEntries(CONFIG.comodidades.map(c => [c.id, 0])),
  km: 30,
  retiro: true,
};

/* ---------- precios en tarjetas (una sola fuente: CONFIG) ---------- */
$$('[data-price-of]').forEach(el => {
  const c = CONFIG.casillas.find(x => x.id === el.dataset.priceOf);
  if (c) el.textContent = money(c.precio);
});

/* ---------- menú móvil ---------- */
const toggle = $('.nav-toggle');
const nav = $('#nav');
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
});
nav.addEventListener('click', e => {
  if (e.target.closest('a')) { toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }
});

/* ---------- WhatsApp con mensaje ---------- */
const waLink = msg => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
$$('.js-wa').forEach(a => {
  a.href = waLink(a.dataset.msg || 'Hola, quiero consultar por el alquiler de una casilla rural.');
  a.target = '_blank';
  a.rel = 'noopener';
});

/* ---------- cotizador ---------- */
const pick = $('#pick-unit');
pick.innerHTML = CONFIG.casillas.map(c => `
  <label>
    <input type="radio" name="casilla" value="${c.id}"${c.id === state.casilla ? ' checked' : ''}>
    <img src="${c.foto}" width="240" height="180" alt="" loading="lazy">
    <span><span class="p-name">${c.nombre}</span><span class="p-price">${money(c.precio)} por mes</span></span>
  </label>`).join('');

const extras = $('#extras');
extras.innerHTML = CONFIG.comodidades.map(x => `
  <div class="extra" data-extra="${x.id}">
    <div>
      <span class="x-name">${x.nombre}</span>
      <span class="x-price">${money(x.precio)} por mes${x.max > 1 ? ' c/u' : ''}</span>
    </div>
    <div class="stepper" role="group" aria-label="Cantidad de ${x.plural}">
      <button type="button" data-step="-1" aria-label="Quitar ${x.singular}">−</button>
      <output aria-live="polite">0</output>
      <button type="button" data-step="1" aria-label="Agregar ${x.singular}">+</button>
    </div>
  </div>`).join('');

const kmInput = $('#km');
const kmRange = $('#km-range');
const sendBtn = $('#send-quote');

function currentUnit() { return CONFIG.casillas.find(c => c.id === state.casilla); }

function render() {
  const unit = currentUnit();

  // comodidades: incluido / cantidades
  CONFIG.comodidades.forEach(x => {
    const row = $(`[data-extra="${x.id}"]`, extras);
    const inc = unit.incluye.includes(x.id);
    if (inc) state.qty[x.id] = 0;
    row.classList.toggle('is-included', inc);
    const name = $('.x-name', row);
    name.innerHTML = x.nombre + (inc ? '<span class="x-inc">Incluido</span>' : '');
    const q = state.qty[x.id];
    $('output', row).textContent = q;
    $('[data-step="-1"]', row).disabled = inc || q <= 0;
    $('[data-step="1"]', row).disabled = inc || q >= x.max;
  });

  // costo mensual
  const rows = [[unit.nombre, unit.precio]];
  let monthly = unit.precio;
  CONFIG.comodidades.forEach(x => {
    const q = state.qty[x.id];
    if (!q) return;
    const sub = q * x.precio;
    monthly += sub;
    rows.push([`${q} ${q === 1 ? x.singular : x.plural}`, sub]);
  });
  $('#lines-monthly').innerHTML = rows.map(([t, v]) => `<tr><td>${cap(t)}</td><td>${money(v)}</td></tr>`).join('');
  $('#total-monthly').textContent = money(monthly);
  $('#bar-total').textContent = money(monthly);

  // pagos únicos
  const flete = state.km * CONFIG.precioKm;
  const fondo = monthly;
  const once = [
    [`Entrega <span class="muted">${state.km} km × ${money(CONFIG.precioKm)}</span>`, flete],
  ];
  if (state.retiro) once.push([`Retiro al finalizar <span class="muted">${state.km} km</span>`, flete]);
  once.push(['Fondo de roturas <span class="muted">1 mes</span>', fondo]);
  $('#lines-once').innerHTML = once.map(([t, v]) => `<tr><td>${t}</td><td>${money(v)}</td></tr>`).join('');

  const first = monthly + fondo + flete;
  $('#total-first').textContent = money(first);

  // mensaje de WhatsApp
  const extrasTxt = rows.slice(1).map(r => r[0]).join(', ') || 'ninguna';
  const msg = [
    'Hola, quiero cotizar el alquiler de una casilla:',
    `• ${unit.nombre} (${money(unit.precio)}/mes)`,
    `• Comodidades: ${extrasTxt}`,
    `• Traslado: ${state.km} km desde Villa Allende${state.retiro ? ', con retiro' : ''}`,
    `• Total mensual estimado: ${money(monthly)}`,
    `• Primer pago estimado: ${money(first)}`,
    '¿Está disponible? Gracias.',
  ].join('\n');
  sendBtn.href = waLink(msg);
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function setKm(v) {
  const n = Math.max(0, Math.min(2000, Math.round(Number(v) || 0)));
  state.km = n;
  kmInput.value = n;
  kmRange.value = Math.min(n, Number(kmRange.max));
  $$('.chips button').forEach(b => b.classList.toggle('on', Number(b.dataset.km) === n));
  render();
}

pick.addEventListener('change', e => {
  if (e.target.name === 'casilla') { state.casilla = e.target.value; render(); }
});
extras.addEventListener('click', e => {
  const btn = e.target.closest('[data-step]');
  if (!btn) return;
  const id = btn.closest('[data-extra]').dataset.extra;
  const x = CONFIG.comodidades.find(c => c.id === id);
  state.qty[id] = Math.max(0, Math.min(x.max, state.qty[id] + Number(btn.dataset.step)));
  render();
});
kmRange.addEventListener('input', () => setKm(kmRange.value));
kmInput.addEventListener('input', () => { if (kmInput.value !== '') setKm(kmInput.value); });
kmInput.addEventListener('blur', () => setKm(kmInput.value));
$('.chips').addEventListener('click', e => { const b = e.target.closest('[data-km]'); if (b) setKm(b.dataset.km); });
$('#retiro').addEventListener('change', e => { state.retiro = e.target.checked; render(); });
$('#quote-form').addEventListener('submit', e => e.preventDefault());

// botón "Cotizar" de cada tarjeta
$$('.js-cotizar').forEach(a => a.addEventListener('click', () => {
  state.casilla = a.dataset.id;
  const r = $(`input[name="casilla"][value="${a.dataset.id}"]`);
  if (r) r.checked = true;
  render();
}));

setKm(state.km);

// barra con el total en celular: visible mientras se completa el formulario
const bar = $('#quote-bar');
if ('IntersectionObserver' in window) {
  const seen = { form: false, receipt: false };
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { seen[en.target === $('#quote-form') ? 'form' : 'receipt'] = en.isIntersecting; });
    const on = seen.form && !seen.receipt;
    bar.classList.toggle('show', on);
    document.body.classList.toggle('bar-on', on && matchMedia('(max-width: 980px)').matches);
  });
  io.observe($('#quote-form'));
  io.observe($('.receipt'));
}

/* ---------- consulta rápida → WhatsApp ---------- */
$('#contact-form').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  if (!f.reportValidity()) return;
  const d = new FormData(f);
  const msg = [
    `Hola, soy ${d.get('nombre').trim()}.`,
    `Necesito una casilla para un trabajo en ${d.get('lugar').trim()}.`,
    d.get('mensaje').trim(),
  ].filter(Boolean).join('\n');
  window.open(waLink(msg), '_blank', 'noopener');
});

/* ---------- galería ---------- */
const lb = $('#lightbox');
const lbImg = $('#lb-img');
let gallery = [];
let gi = 0;

function showPhoto(i) {
  gi = (i + gallery.length) % gallery.length;
  const p = gallery[gi];
  lbImg.src = p.src;
  lbImg.alt = p.alt;
  $('#lb-cap').textContent = p.alt;
  $('#lb-count').textContent = `${gi + 1} / ${gallery.length}`;
}

$$('.unit').forEach(unit => {
  const items = $$('.thumbs button', unit).map(b => ({ src: b.dataset.src, alt: b.dataset.alt }));
  const open = i => { gallery = items; showPhoto(i); lb.showModal(); };
  $('.unit-photo', unit).addEventListener('click', () => open(0));
  $$('.thumbs button', unit).forEach((b, i) => {
    b.addEventListener('click', () => open(i));
    // vista previa al pasar el mouse
    b.addEventListener('mouseenter', () => {
      const main = $('.unit-photo img', unit);
      main.srcset = '';
      main.src = b.dataset.src.replace(/\.webp$/, '-sm.webp');
      $$('.thumbs button', unit).forEach(x => x.classList.toggle('on', x === b));
    });
  });
});

$('.lb-prev').addEventListener('click', () => showPhoto(gi - 1));
$('.lb-next').addEventListener('click', () => showPhoto(gi + 1));
$('.lb-close').addEventListener('click', () => lb.close());
lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
lb.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') showPhoto(gi - 1);
  if (e.key === 'ArrowRight') showPhoto(gi + 1);
});
let tx = null;
lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', e => {
  if (tx === null) return;
  const dx = e.changedTouches[0].clientX - tx;
  if (Math.abs(dx) > 40) showPhoto(gi + (dx < 0 ? 1 : -1));
  tx = null;
});

$('#year').textContent = new Date().getFullYear();
