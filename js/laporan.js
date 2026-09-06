// ===== Laporan =====
const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function monthKey(y, m) { return y + '-' + String(m + 1).padStart(2, '0'); }

async function renderLaporan() {
  if (currentPage !== 'laporan') return;

  const today = todayStr();
  const now = new Date();
  const allTxs = await getAll('transaksi');
  const txs = allTxs || [];

  const txsToday = [];
  const txsMonth = [];
  txs.forEach((t) => {
    if (t.tanggal === today) txsToday.push(t);
    const mk = monthKey(new Date(t.tanggal).getFullYear(), new Date(t.tanggal).getMonth());
    if (mk === monthKey(now.getFullYear(), now.getMonth())) txsMonth.push(t);
  });

  const omzetToday = txsToday.reduce((s, t) => s + t.total, 0);
  const omzetMonth = txsMonth.reduce((s, t) => s + t.total, 0);
  const pembeliToday = txsToday.length;
  const pembeliMonth = txsMonth.length;

  // Produk terlaris
  const countMap = {};
  txsMonth.forEach((t) => (t.items || []).forEach((i) => {
    countMap[i.nama] = (countMap[i.nama] || 0) + i.qty;
  }));
  const terlaris = Object.entries(countMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Grafik 7 hari
  const days7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    days7.push({ key: todayStrOf(d), label: d.getDate() + '/' + (d.getMonth() + 1), total: 0, pembeli: 0 });
  }
  txs.forEach((t) => {
    const day = days7.find((x) => x.key === t.tanggal);
    if (day) { day.total += t.total; day.pembeli++; }
  });
  const maxDay = Math.max(...days7.map((x) => x.total), 1);
  const BAR_MAX = 80;

  let html = `<div class="page-header">
    <h2 class="page-title">Laporan</h2>
    <span class="page-date">${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}</span>
  </div>`;

  // Stat cards
  html += `<div class="stat-grid">
    <div class="stat stat-green"><div class="stat-l">Omzet Hari Ini</div><div class="stat-v">${rupiah(omzetToday)}</div></div>
    <div class="stat stat-blue"><div class="stat-l">Pembeli Hari Ini</div><div class="stat-v">${pembeliToday}</div></div>
    <div class="stat stat-green"><div class="stat-l">Omzet Bulan Ini</div><div class="stat-v">${rupiah(omzetMonth)}</div></div>
    <div class="stat stat-blue"><div class="stat-l">Pembeli Bulan Ini</div><div class="stat-v">${pembeliMonth}</div></div>
  </div>`;

  // Grafik
  html += `<div class="lap-section">
    <div class="lap-title">7 Hari Terakhir</div>
    <div class="bar-chart">`;
  for (const d of days7) {
    const h = d.total > 0 ? Math.max(8, (d.total / maxDay) * BAR_MAX) : 3;
    html += `<div class="bar-col">
      <span class="lbl">${d.label}</span>
      <div class="bar-area"><div class="bar" style="height:${h}px"></div><div class="bar-info">${d.pembeli}</div></div>
    </div>`;
  }
  html += `</div><div class="bar-note">Angka kecil = jumlah pembeli per hari</div></div>`;

  // Terlaris
  html += `<div class="lap-section">
    <div class="lap-title">Produk Terlaris</div>`;
  if (terlaris.length === 0) {
    html += `<div class="pos-empty">Belum ada penjualan.</div>`;
  } else {
    html += `<div class="terlaris-list">`;
    terlaris.forEach(([nama, qty], i) => {
      html += `<div class="terlaris-item">
        <span class="terlaris-rank">${i + 1}</span>
        <span class="terlaris-nama">${esc(nama)}</span>
        <span class="terlaris-qty">${qty} pc</span>
      </div>`;
    });
    html += `</div>`;
  }
  html += `</div>`;

  // Riwayat
  html += `<div class="lap-section">
    <div class="lap-title">Riwayat Transaksi</div>`;
  const recent = [...txs].sort((a, b) => (b.waktu || '').localeCompare(a.waktu || '')).slice(0, 10);
  if (recent.length === 0) {
    html += `<div class="pos-empty">Belum ada transaksi.</div>`;
  } else {
    html += `<div class="riwayat-list">`;
    recent.forEach((t) => {
      const waktu = t.waktu ? new Date(t.waktu).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : t.tanggal;
      html += `<div class="riwayat-item">
        <div class="riwayat-left">
          <div class="riwayat-waktu">${waktu}</div>
          <div class="riwayat-detail">${(t.items || []).length} item</div>
        </div>
        <div class="riwayat-total">${rupiah(t.total)}</div>
      </div>`;
    });
    html += `</div>`;
  }
  html += `</div>`;

  setViewKeepFab('laporan', html);
}
