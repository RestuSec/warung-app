// ===== App: navigasi & init =====
let currentPage = 'pos';

function navigate(page) {
  currentPage = page;
  document.querySelectorAll('#bottomNav button').forEach((b) => {
    b.classList.toggle('active', b.dataset.page === page);
  });
  const fab = document.getElementById('fab');
  if (fab) fab.remove();
  const searchVisible = (page === 'pos');
  document.getElementById('searchBox').classList.toggle('hidden', !searchVisible);

  if (page === 'pos') renderPOS();
  else if (page === 'stok') renderStok();
  else if (page === 'laporan') renderLaporan();
  else if (page === 'pengaturan') renderPengaturan();
  else renderPOS();
}

function initNav() {
  document.querySelectorAll('#bottomNav button').forEach((b) => {
    b.onclick = () => navigate(b.dataset.page);
  });
}

// pencarian real-time → re-render POS
function initSearch() {
  const input = document.getElementById('searchInput');
  input.addEventListener('input', () => {
    filter = input.value.trim();
    if (currentPage === 'pos') renderPOS();
  });
  // enter pada search → fokus/hidden keyboard
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur();
  });
}

// Init
(async function init() {
  try {
    await db();
    await loadProduk();

    // dark mode dari localStorage
    const saved = (() => { try { return localStorage.getItem('theme'); } catch (e) { return null; } })();
    if (saved) toggleDark(saved === 'dark');

    initNav();
    initSearch();
    navigate('pos');

    // seed contoh produk pertama kali
    const prods = await getAll('produk');
    if (prods.length === 0) await seedProduk();
    await loadProduk();
    renderAll();

    // PWA service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  } catch (err) {
    console.error(err);
    document.getElementById('pageContainer').innerHTML =
      `<div class="pos-empty">Terjadi error saat memuat data.<br>${esc(err.message)}</div>`;
  }
})();

// Keyboard: Enter dibawah produk? Tidak perlu.