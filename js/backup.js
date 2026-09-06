// ===== Pengaturan: export, backup, restore, dark mode =====
function renderPengaturan() {
  let html = `<h2 class="page-title">⚙️ Pengaturan</h2>
    <p class="page-sub">Kelola data warung kamu.</p>
    <div class="set-list">
      <div class="set-row">
        <div><div class="t">Mode Gelap</div><div class="s">Tampilan gelap</div></div>
        <label class="switch"><input type="checkbox" id="darkToggle" ${document.body.dataset.theme === 'dark' ? 'checked' : ''} onchange="toggleDark(this.checked)"><span class="sl"></span></label>
      </div>
      <div class="set-row" onclick="eksportProdukCSV()">
        <div class="set-l"><span class="set-ic">${icon('export')}</span><div><div class="t">Export Produk (CSV)</div><div class="s">Simpan daftar produk ke file</div></div></div>
        <span class="set-arrow">›</span>
      </div>
      <div class="set-row" onclick="eksportTransaksiCSV()">
        <div class="set-l"><span class="set-ic">${icon('export')}</span><div><div class="t">Export Transaksi (CSV)</div><div class="s">Simpan riwayat penjualan</div></div></div>
        <span class="set-arrow">›</span>
      </div>
      <div class="set-row" onclick="downloadBackup()">
        <div class="set-l"><span class="set-ic">${icon('backup')}</span><div><div class="t">Backup Data</div><div class="s">Simpan seluruh data ke file</div></div></div>
        <span class="set-arrow">›</span>
      </div>
      <div class="set-row" onclick="restoreBackup()">
        <div class="set-l"><span class="set-ic">${icon('restore')}</span><div><div class="t">Restore Data</div><div class="s">Kembalikan data dari backup</div></div></div>
        <span class="set-arrow">›</span>
      </div>
    </div>
    <div class="section-title">Data Contoh</div>
    <button class="btn btn-danger-ghost btn-block" onclick="hapusSemua()">${icon('trash', 'btn-ic')} Hapus Semua Data</button>`;
  setViewKeepFab('pengaturan', html);
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
}

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return '"' + s.replace(/"/g, '""') + '"';
}

async function eksportProdukCSV() {
  const prods = await getAll('produk');
  let csv = 'Nama;Harga;Stok;Supplier;Kadaluarsa\n';
  for (const p of prods) {
    csv += [csvEscape(p.nama), (p.hargaList || [])[0] ?? '', p.stok, csvEscape(p.supplier), p.exp].join(';') + '\n';
  }
  downloadFile('produk-' + todayStr() + '.csv', '\uFEFF' + csv, 'text/csv;charset=utf-8');
}

async function eksportTransaksiCSV() {
  const txs = await getAll('transaksi');
  let csv = 'Tanggal;Waktu;Item;Total;Dibayar;Kembalian\n';
  for (const t of txs.sort((a, b) => (b.waktu || '').localeCompare(a.waktu || ''))) {
    csv += [t.tanggal, t.waktu || '', t.items.length, t.total, t.dibayar, t.kembalian].join(';') + '\n';
  }
  downloadFile('transaksi-' + todayStr() + '.csv', '\uFEFF' + csv, 'text/csv;charset=utf-8');
}

async function downloadBackup() {
  const data = JSON.stringify({ produk: state.produk, transaksi: await getAll('transaksi') }, null, 2);
  downloadFile('backup-warung-' + todayStr() + '.json', data, 'application/json');
}

function restoreBackup() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      await clear('produk');
      await clear('transaksi');
      for (const p of (data.produk || [])) {
        await put('produk', p);
      }
      for (const t of (data.transaksi || [])) {
        await put('transaksi', t);
      }
      await refreshAll();
      alert('Data berhasil dipulihkan!');
    } catch (err) {
      alert('Gagal restore: ' + err.message);
    }
  };
  input.click();
}

async function hapusSemua() {
  if (!confirm('Hapus SEMUA data? Ini tidak bisa dibatalkan! (Disarankan backup dulu)')) return;
  if (!confirm('Yakin sekali? Lanjutkan menghapus semua produk & transaksi?')) return;
  await clear('produk');
  await clear('transaksi');
  await loadProduk();
  renderAll();
  alert('Semua data dihapus.');
}

function toggleDark(on) {
  document.body.dataset.theme = on ? 'dark' : 'light';
  try { localStorage.setItem('theme', on ? 'dark' : 'light'); } catch (e) {}
}
