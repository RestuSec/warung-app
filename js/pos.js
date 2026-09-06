// ===== Format & util =====
function rupiah(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function todayStrOf(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ===== Ikon SVG (stroke, currentColor) =====
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/>',
  pos: '<path d="M6 7h12l1 13H5L6 7z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
  stok: '<path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
  laporan: '<line x1="6" y1="20" x2="6" y2="14"/><line x1="12" y1="20" x2="12" y2="8"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="4" y1="20" x2="20" y2="20"/>',
  atur: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  export: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  restore: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  backup: '<path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><path d="M12 13V3m0 0l-4 4m4-4l4 4"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
};

function icon(name, cls) {
  return `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

function setViewKeepFab(name, html) {
  const c = document.getElementById('pageContainer');
  c.innerHTML = html;
  mountAnim(c);
}

// ===== State =====
const state = {
  produk: [],
  cart: new Map(),
};

// ===== DB helpers =====
async function loadProduk() {
  let prods = await getAll('produk');
  for (const p of prods) {
    if (Array.isArray(p.hargaList)) continue;
    const list = [];
    if (p.hargaEcer) list.push(p.hargaEcer);
    if (p.hargaGrosir && p.hargaGrosir !== p.hargaEcer) list.push(p.hargaGrosir);
    if (list.length === 0) list.push(0);
    p.hargaList = list;
    if (p.kategori && !p.supplier) p.supplier = p.kategori;
    delete p.hargaEcer; delete p.hargaGrosir; delete p.kategori;
    await put('produk', p);
  }
  state.produk = prods;
  window.dispatchEvent(new Event('produk-loaded'));
}

// ===== Helper harga (satu produk bisa punya banyak harga) =====
function hargaList(p) { return (Array.isArray(p.hargaList) && p.hargaList.length) ? p.hargaList : [0]; }
function hargaStr(p) {
  const l = hargaList(p).filter((h) => h > 0).sort((a, b) => a - b);
  if (l.length === 0) return rupiah(0);
  return l.length > 1 ? rupiah(l[0]) + '–' + rupiah(l[l.length - 1]) : rupiah(l[0]);
}
function cartKey(id, h) { return id + '_' + h; }
function cartQty(id) { let q = 0; state.cart.forEach((c) => { if (c.id === id) q += c.qty; }); return q; }
function cartTotal(id) { let t = 0; state.cart.forEach((c) => { if (c.id === id) t += c.harga * c.qty; }); return t; }

async function refreshAll() {
  await loadProduk();
  renderAll();
}

function renderAll() {
  if (currentPage === 'pos') renderPOS();
  else if (currentPage === 'stok') renderStok();
  else if (currentPage === 'laporan') renderLaporan();
  else if (currentPage === 'pengaturan') renderPengaturan();
}

// ===== POS render =====
let filter = '';

function renderPOS() {
  const kw = filter.toLowerCase();
  const list = state.produk.filter((p) => !kw || p.nama.toLowerCase().includes(kw));

  let grand = 0, count = 0;
  state.cart.forEach((c) => { grand += c.harga * c.qty; count += c.qty; });

  let html = `<div class="pos-wrap">
    <aside class="bill-panel" id="billPanel">${renderBillInner()}</aside>
    <section class="prod-panel">`;

  if (count > 0) {
    html += `<div class="totals">
      <div class="totals-inner">
        <div class="totals-left">
          <span class="count" id="countLabel">${count} item</span>
          <span class="grand-num" id="grandTotal">${rupiah(grand)}</span>
        </div>
        <button class="btn-bayar" id="btnBayar" onclick="bayar()">Bayar</button>
      </div>
    </div>`;
  }

  if (list.length === 0) {
    html += `<div class="pos-empty">Produk tidak ditemukan.<br><small>Ketik kata lain atau tambah produk baru.</small></div>`;
  } else {
    html += `<div class="pos-topbar">
      <button class="quick-chip${modeCepat ? ' on' : ''}" onclick="toggleCepat()">
        <span class="dot"></span>Mode Cepat ${modeCepat ? 'Menyala' : 'Mati'}</button>
      <span class="topbar-hint">${modeCepat ? 'Tap produk = langsung masuk keranjang' : 'Tap produk = pilih harga dulu'}</span>
    </div>`;
    html += `<div class="pos-list">`;
    for (const p of list) {
      const qty = cartQty(p.id);
      const multi = hargaList(p).length > 1;
      const inputHtml = multi
        ? `<button class="qty-pick" onclick="tapProduk(${p.id})">Pilih varian</button>`
        : `<input class="qty" type="number" min="0" value="${qty || ''}" onclick="event.stopPropagation()"
            oninput="setQty(${p.id}, this.value)" placeholder="0">`;
      html += `<div class="pos-row${qty > 0 ? ' has-item' : ''}">
        <div class="info" onclick="tapProduk(${p.id})">
          <p class="p-name">${esc(p.nama)}</p>
          <div class="p-meta">
            <span class="p-price">${hargaStr(p)}</span>
            ${multi ? `<span class="var-chip">${hargaList(p).length} harga</span>` : ''}
            ${stokBadge(p)} ${expBadge(p)}
          </div>
        </div>
        ${inputHtml}
        <div class="line-total" id="lt-${p.id}">${qty > 0 ? rupiah(cartTotal(p.id)) : ''}</div>
      </div>`;
    }
    html += `</div>`;
  }

  html += `</section></div>`;
  setView('pos', html);
}

// ===== Panel bayar (kiri saat landscape / miring) =====
function renderBillInner() {
  if (state.cart.size === 0) {
    return `<div class="bill-head">Kasir</div>
      <div class="bill-empty">Belum ada item.<br><small>Tap produk di sebelah kanan.</small></div>`;
  }
  let grand = 0;
  let itemsHtml = '';
  state.cart.forEach((c) => {
    grand += c.harga * c.qty;
    itemsHtml += `<div class="bill-row">
      <span>${esc(c.nama)} <em class="q">x${c.qty} @${rupiah(c.harga)}</em></span>
      <b>${rupiah(c.harga * c.qty)}</b>
    </div>`;
  });

  const nominals = [
    { label: 'Uang Pas', value: grand, accent: true },
    { label: '10.000', value: 10000 },
    { label: '20.000', value: 20000 },
    { label: '50.000', value: 50000 },
    { label: '100.000', value: 100000 },
  ];
  let nomHtml = '<div class="nom-grid">';
  for (const n of nominals) {
    nomHtml += `<button class="nom-btn${n.accent ? ' nom-pas' : ''}" onclick="pilihNominal(${n.value}, ${grand})">${n.label}</button>`;
  }
  nomHtml += `<button class="nom-btn" onclick="openUangKeypad()">Lainnya</button></div>`;

  return `<div class="bill-head">Kasir</div>
    <div class="bill-items">${itemsHtml}</div>
    <div class="bill-total-row"><span>Total</span><b>${rupiah(grand)}</b></div>
    ${nomHtml}
    <div class="bill-kembalian" id="kembalianArea"></div>`;
}

function updateBill() {
  const bp = document.getElementById('billPanel');
  if (bp) bp.innerHTML = renderBillInner();
}

function stokBadge(p) {
  if (p.stok <= 0) return `<span class="stok-badge stok-habis">Habis</span>`;
  if (p.stok <= 5) return `<span class="stok-badge stok-min">Sisa ${p.stok}</span>`;
  return `<span class="stok-badge stok-aman">${p.stok}</span>`;
}

function expBadge(p) {
  if (!p.exp) return '';
  if (p.exp < todayStr()) return `<span class="exp-badge">Exp</span>`;
  const days = Math.ceil((new Date(p.exp) - new Date()) / 86400000);
  if (days <= 3) return `<span class="exp-badge exp-soon">${days}hr</span>`;
  return '';
}

// ===== Cart ops =====
function setQty(id, v) {
  const q = parseInt(v, 10);
  const p = state.produk.find((x) => x.id === id);
  if (!p) return;
  const h = hargaList(p)[0];
  const key = cartKey(id, h);
  if (!q || q <= 0) state.cart.delete(key);
  else state.cart.set(key, { id, nama: p.nama, harga: h, qty: q });
  updateRow(id);
  updateTotals();
}

function updateRow(id) {
  const lt = document.getElementById('lt-' + id);
  const row = lt ? lt.closest('.pos-row') : null;
  const qty = cartQty(id);
  if (lt) lt.textContent = qty > 0 ? rupiah(cartTotal(id)) : '';
  if (row) {
    row.classList.toggle('has-item', qty > 0);
    if (qty > 0) {
      row.classList.remove('pop-row');
      void row.offsetWidth;
      row.classList.add('pop-row');
    }
  }
}

function updateTotals() {
  let grand = 0, count = 0;
  state.cart.forEach((c) => { grand += c.harga * c.qty; count += c.qty; });
  const gt = document.getElementById('grandTotal');
  const bb = document.getElementById('btnBayar');
  const cl = document.getElementById('countLabel');
  if (gt) {
    gt.textContent = rupiah(grand);
    gt.classList.remove('on-bump');
    void gt.offsetWidth;
    gt.classList.add('on-bump');
  }
  if (bb) bb.textContent = 'Bayar';
  if (cl) cl.textContent = count + ' item';
  updateBill();
  // kalau keranjang kosong, re-render supaya totals bar ilang
  if (count === 0 && document.querySelector('.totals')) renderPOS();
}

// ===== Mode cepat: tap produk = tambah 1, tanpa popup =====
let modeCepat = false;
function toggleCepat() { modeCepat = !modeCepat; renderPOS(); }

function addCepat(id) {
  const p = state.produk.find((x) => x.id === id);
  if (!p || p.stok === 0) return;
  let h = null;
  state.cart.forEach((c) => { if (c.id === id) h = c.harga; });
  if (h === null) {
    const hs = hargaList(p).filter((x) => x > 0);
    if (hs.length === 0) return;
    h = hs[0];
  }
  const key = cartKey(id, h);
  const ex = state.cart.get(key);
  state.cart.set(key, { id, nama: p.nama, harga: h, qty: (ex ? ex.qty : 0) + 1 });
  updateRow(id);
  updateTotals();
}

function tapProduk(id) {
  if (modeCepat) addCepat(id);
  else openPricePopup(id);
}

// ===== Harga popup: pilih varian dulu, kalau satu langsung qty =====
let popupId = null;
let popupHarga = null;
let popupQty = 1;

function openPricePopup(id) {
  const p = state.produk.find((x) => x.id === id);
  if (!p) return;
  popupId = id;
  const hs = hargaList(p);
  if (hs.length > 1) popupHarga = null;
  else {
    popupHarga = hs[0];
    const ex = state.cart.get(cartKey(id, hs[0]));
    popupQty = ex ? ex.qty : 1;
  }
  renderPricePopup();
}

function renderPricePopup() {
  const p = state.produk.find((x) => x.id === popupId);
  let html = `<div class="modal-bg" onclick="closeModal()">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-head">
        <h3>${esc(p.nama)}</h3>
        <button class="modal-close" onclick="closeModal()">${icon('close')}</button>
      </div>`;

  if (popupHarga === null) {
    html += `<div class="opt-grid">`;
    for (const h of hargaList(p).filter((x) => x > 0)) {
      const ex = state.cart.get(cartKey(popupId, h));
      html += `<button class="opt" onclick="pickHarga(${h})">
        <b>${rupiah(h)}</b><span>${ex ? 'Di keranjang x' + ex.qty : 'Pilih'}</span>
      </button>`;
    }
    html += `</div>`;
  } else {
    const sub = popupHarga * popupQty;
    html += `<div class="popup-harga">${rupiah(popupHarga)}</div>
      <div class="qty-stepper">
        <button class="stepper-btn" onclick="stepQty(-1)">−</button>
        <span class="qv">${popupQty}</span>
        <button class="stepper-btn" onclick="stepQty(1)">+</button>
      </div>
      <div class="popup-sub">${rupiah(sub)}</div>
      <button class="btn btn-primary btn-block" onclick="confirmHarga()">Tambah</button>`;
    if (hargaList(p).length > 1) {
      html += `<button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openPricePopup(${popupId})">Ganti harga</button>`;
    }
  }

  html += `</div></div>`;
  document.getElementById('modalHost').innerHTML = html;
}

function pickHarga(h) {
  popupHarga = h;
  const ex = state.cart.get(cartKey(popupId, h));
  popupQty = ex ? ex.qty : 1;
  renderPricePopup();
}
function stepQty(d) { popupQty = Math.max(1, popupQty + d); renderPricePopup(); }

function confirmHarga() {
  state.cart.set(cartKey(popupId, popupHarga), {
    id: popupId,
    nama: state.produk.find((x) => x.id === popupId).nama,
    harga: popupHarga, qty: popupQty,
  });
  closeModal();
  renderPOS();
  updateBill();
}

// ===== Bayar — alur simpel: pilih nominal, gak perlu ketik =====
function grandOfCurrent() {
  let g = 0;
  state.cart.forEach((c) => { g += c.harga * c.qty; });
  return g;
}

function bayar() {
  if (state.cart.size === 0) return;
  openBayarModal();
}

function openBayarModal() {
  let grand = 0;
  state.cart.forEach((c) => { grand += c.harga * c.qty; });

  // hitung ringkasan
  let summaryHtml = '';
  state.cart.forEach((c) => {
    summaryHtml += `<div class="bayar-row"><span>${esc(c.nama)} x${c.qty}</span><span>${rupiah(c.harga * c.qty)}</span></div>`;
  });

  // nominal cepat: uang pas + beberapa pecahan umum
  const nominals = [
    { label: 'Uang Pas', value: grand, accent: true },
    { label: '10.000', value: 10000 },
    { label: '20.000', value: 20000 },
    { label: '50.000', value: 50000 },
    { label: '100.000', value: 100000 },
  ];

  let nomHtml = '<div class="nom-grid">';
  for (const n of nominals) {
    nomHtml += `<button class="nom-btn${n.accent ? ' nom-pas' : ''}" onclick="pilihNominal(${n.value}, ${grand})">${n.label}</button>`;
  }
  nomHtml += `<button class="nom-btn" onclick="openUangKeypad()">Lainnya</button>`;
  nomHtml += '</div>';

  let html = `<div class="modal-bg" onclick="closeModal()">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-head">
        <h3>Bayar</h3>
        <button class="modal-close" onclick="closeModal()">${icon('close')}</button>
      </div>
      <div class="bayar-total">${rupiah(grand)}</div>
      <div class="bayar-summary">${summaryHtml}</div>
      ${nomHtml}
      <div class="bayar-kembalian" id="kembalianArea"></div>
    </div></div>`;
  document.getElementById('modalHost').innerHTML = html;
}

function pilihNominal(val, grand) {
  const change = val - grand;
  if (change < 0) {
    document.getElementById('kembalianArea').innerHTML =
      `<div class="kurang">Kurang ${rupiah(-change)}</div>`;
    return;
  }
  document.getElementById('kembalianArea').innerHTML =
    `<div class="kembalian-info">Kembalian: <b>${rupiah(change)}</b></div>
     <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="selesaiBayar(${grand}, ${val})">Selesai</button>`;
}

// ===== Uang diterima: keypad Rupiah =====
let paidRaw = 0;

function openUangKeypad() {
  const grand = grandOfCurrent();
  paidRaw = 0;
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '1000', '0', 'del'];
  let pad = '';
  for (const k of keys) {
    const label = k === 'del' ? '⌫' : k === '1000' ? '1.000' : k;
    const cb = k === 'del' ? `paidHapus()` : k === '1000' ? `paidTambah(1000)` : `paidKey('${k}')`;
    pad += `<button class="uang-key${k === 'del' ? ' op' : ''}" onclick="${cb}">${label}</button>`;
  }
  document.getElementById('modalHost').innerHTML = `<div class="modal-bg" onclick="closeModal()">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-head">
        <h3>Uang Diterima</h3>
        <button class="modal-close" onclick="closeModal()">${icon('close')}</button>
      </div>
      <div class="uang-total">Total: <b>${rupiah(grand)}</b></div>
      <div class="uang-display" id="uangDisplay">Rp 0</div>
      <div class="uang-kembali" id="uangKembali"></div>
      <div class="uang-pad">${pad}</div>
      <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="paidSelesai()">Selesai</button>
    </div></div>`;
  paidPreview();
}

function paidKey(k) {
  if (paidRaw.toString().length >= 10) return;
  paidRaw = parseInt(paidRaw + k, 10);
  paidRender();
}
function paidTambah(n) { paidRaw += n; paidRender(); }
function paidHapus() { paidRaw = Math.floor(paidRaw / 10); paidRender(); }

function paidRender() {
  document.getElementById('uangDisplay').textContent = 'Rp ' + paidRaw.toLocaleString('id-ID');
  paidPreview();
}

function paidPreview() {
  const grand = grandOfCurrent();
  const change = paidRaw - grand;
  const el = document.getElementById('uangKembali');
  if (paidRaw === 0) el.innerHTML = '';
  else if (change >= 0) el.innerHTML = `Kembalian: <b>${rupiah(change)}</b>`;
  else el.innerHTML = `<span class="kurang">Kurang ${rupiah(-change)}</span>`;
}

function paidSelesai() {
  const grand = grandOfCurrent();
  if (paidRaw < grand) return alert('Uang kurang ' + rupiah(grand - paidRaw));
  selesaiBayar(grand, paidRaw);
}

async function selesaiBayar(grand, paid) {
  const change = paid - grand;
  if (change < 0) { alert('Uang kurang ' + rupiah(-change)); return; }
  const items = [...state.cart.values()].map((c) => ({
    nama: c.nama, harga: c.harga, qty: c.qty, sub: c.harga * c.qty,
  }));

  await add('transaksi', {
    tanggal: todayStr(),
    waktu: new Date().toISOString(),
    total: grand,
    dibayar: paid,
    kembalian: change,
    items,
  });

  // kurangi stok
  for (const c of state.cart.values()) {
    const p = state.produk.find((x) => x.id === c.id);
    if (p && p.stok != null) {
      p.stok = Math.max(0, p.stok - c.qty);
      await put('produk', p);
    }
  }

  state.cart.clear();
  closeModal();
  await loadProduk();
  renderPOS();

  // tampilan sukses singkat
  const host = document.getElementById('modalHost');
  host.innerHTML = `<div class="modal-bg">
    <div class="modal modal-success" onclick="closeModal()">
      <div class="success-icon">${icon('check')}</div>
      <div class="success-title">Transaksi Selesai</div>
      <div class="success-sub">${change > 0 ? 'Kembalian: ' + rupiah(change) : 'Uang pas'}</div>
    </div></div>`;
  setTimeout(closeModal, 1800);
}

// ===== Stok halaman =====
function renderStok() {
  const sorted = [...state.produk].sort((a, b) => (a.stok ?? 0) - (b.stok ?? 0));
  let html = `<div class="page-header">
    <h2 class="page-title">Stok & Expired</h2>
  </div>`;

  if (sorted.length === 0) {
    html += `<div class="pos-empty">Belum ada produk.</div>`;
  } else {
    html += `<div class="stok-list">`;
    for (const p of sorted) {
      const expInfo = expBadge(p);
      const stokColor = (p.stok <= 0) ? 'stok-habis' : (p.stok <= 5 ? 'stok-min' : 'stok-aman');
      html += `<div class="stok-card">
        <div class="stok-card-top">
          <span class="stok-nama">${esc(p.nama)}</span>
          <span class="stok-val ${stokColor}">${p.stok != null ? p.stok : '-'}</span>
        </div>
        <div class="stok-card-bottom">
          <span>${hargaStr(p)}</span>
          ${p.supplier ? '<span>' + esc(p.supplier) + '</span>' : ''}
          ${expInfo ? expInfo : ''}
        </div>
      </div>`;
    }
    html += `</div>`;
  }
  setView('stok', html);
}

// ===== Produk CRUD =====
let formHarga = [];

function showFab(ctx) {
  const host = document.getElementById('pageContainer');
  const old = document.getElementById('fab');
  if (old) old.remove();
  if (ctx === 'pos') {
    const b = document.createElement('button');
    b.id = 'fab';
    b.className = 'fab';
    b.innerHTML = icon('plus');
    b.onclick = () => openProdukForm();
    host.appendChild(b);
  }
}

function polaRupiah(el) {
  const num = parseInt(el.value.replace(/\D/g, ''), 10) || 0;
  el.value = num ? num.toLocaleString('id-ID') : '';
}

function hargaRowsHtml() {
  return formHarga.map((h, i) => `<div class="harga-row">
    <input class="harga-in" type="text" inputmode="numeric" value="${h || ''}" placeholder="Harga ${i + 1} (Rp)"
      oninput="polaRupiah(this)">
    ${formHarga.length > 1 ? `<button class="harga-del" onclick="hapusHarga(${i})">${icon('trash')}</button>` : ''}
  </div>`).join('');
}
function bacaHargaInputs() {
  const ins = document.querySelectorAll('.harga-in');
  if (ins.length) formHarga = [...ins].map((i) => parseInt(i.value.replace(/\D/g, ''), 10) || 0);
}
function tambahHarga() {
  bacaHargaInputs();
  formHarga.push(0);
  const el = document.getElementById('f-harga-rows');
  if (el) el.innerHTML = hargaRowsHtml();
}
function hapusHarga(i) {
  if (formHarga.length > 1) {
    bacaHargaInputs();
    formHarga.splice(i, 1);
    const el = document.getElementById('f-harga-rows');
    if (el) el.innerHTML = hargaRowsHtml();
  }
}

function openProdukForm(p) {
  p = p || {};
  formHarga = (p.hargaList && p.hargaList.length) ? p.hargaList.map(Number) : [Number(p.hargaEcer) || 0];
  const suppliers = [...new Set(state.produk.map((x) => x.supplier).filter(Boolean))];
  const supOptions = suppliers.map((s) => `<option value="${esc(s)}">`).join('');
  let html = `<div class="modal-bg" onclick="closeModal()">
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-head">
        <h3>${p.id ? 'Ubah Produk' : 'Tambah Produk'}</h3>
        <button class="modal-close" onclick="closeModal()">${icon('close')}</button>
      </div>
      <div class="form-field"><label>Nama produk</label><input id="f-nama" value="${esc(p.nama || '')}"></div>
      <div class="form-field"><label>Supplier</label><input id="f-sup" list="supList" value="${esc(p.supplier || '')}" placeholder="Asal barang"><datalist id="supList">${supOptions}</datalist></div>
      <div class="form-field"><label>Harga (bisa banyak)</label>
        <div id="f-harga-rows">${hargaRowsHtml()}</div>
        <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="tambahHarga()">+ Tambah harga</button>
      </div>
      <div class="form-field"><label>Stok</label><input id="f-stok" type="number" value="${p.stok ?? ''}"></div>
      <div class="form-field"><label>Kadaluarsa (opsional)</label><input id="f-exp" type="date" value="${p.exp || ''}"></div>
      <button class="btn btn-primary btn-block" onclick="simpanProduk('${p.id || ''}')">Simpan</button>
    </div></div>`;
  document.getElementById('modalHost').innerHTML = html;
}

async function simpanProduk(id) {
  const nama = document.getElementById('f-nama').value.trim();
  if (!nama) return alert('Nama produk wajib diisi.');
  const hargaArr = [...document.querySelectorAll('.harga-in')]
    .map((i) => parseInt(i.value.replace(/\D/g, ''), 10) || 0)
    .filter((h) => h > 0);
  if (hargaArr.length === 0) return alert('Isi minimal satu harga.');
  const data = {
    nama,
    hargaList: hargaArr,
    supplier: document.getElementById('f-sup').value.trim(),
    stok: document.getElementById('f-stok').value === '' ? null : (parseInt(document.getElementById('f-stok').value, 10) || 0),
    exp: document.getElementById('f-exp').value,
  };
  if (id) { data.id = Number(id); await put('produk', data); }
  else await add('produk', data);
  closeModal();
  await loadProduk();
  renderAll();
}

async function hapusProduk(id) {
  if (!confirm('Hapus produk ini?')) return;
  await remove('produk', id);
  [...state.cart.keys()].forEach((k) => { if (k.startsWith(id + '_')) state.cart.delete(k); });
  await loadProduk();
  renderAll();
}

// ===== view util =====
function setView(name, html) {
  const c = document.getElementById('pageContainer');
  c.innerHTML = html;
  showFab(name);
  mountAnim(c);
}

function mountAnim(c) {
  c.classList.remove('mount');
  void c.offsetWidth;
  c.classList.add('mount');
}

function closeModal() {
  const host = document.getElementById('modalHost');
  host.innerHTML = '';
}
