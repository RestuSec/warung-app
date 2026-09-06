const DB_NAME = 'warung-app';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('produk')) {
        const s = db.createObjectStore('produk', { keyPath: 'id', autoIncrement: true });
        s.createIndex('nama', 'nama', { unique: false });
      }
      if (!db.objectStoreNames.contains('transaksi')) {
        const t = db.createObjectStore('transaksi', { keyPath: 'id', autoIncrement: true });
        t.createIndex('tanggal', 'tanggal', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let _db = null;
async function db() {
  if (!_db) _db = await openDB();
  return _db;
}

function tx(store, mode = 'readonly') {
  return db().then((d) => d.transaction(store, mode).objectStore(store));
}

function reqToPromise(r) {
  return new Promise((res, rej) => {
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

function flow(t, fn) {
  return new Promise((res, rej) => {
    const r = fn(t);
    t.transaction.oncomplete = () => res(r.result ?? r);
    t.transaction.onerror = () => rej(t.transaction.error);
  });
}

async function getAll(store) {
  const os = await tx(store);
  return reqToPromise(os.getAll());
}

async function add(store, data) {
  const os = await tx(store, 'readwrite');
  return flow(os, () => os.add(data));
}

async function put(store, data) {
  const os = await tx(store, 'readwrite');
  return flow(os, () => os.put(data));
}

async function remove(store, id) {
  const os = await tx(store, 'readwrite');
  return flow(os, () => os.delete(id));
}

async function clear(store) {
  const os = await tx(store, 'readwrite');
  return flow(os, () => os.clear());
}

async function seedProduk() {
  const existing = await getAll('produk');
  if (existing.length > 0) return;
  const contoh = [
    { nama: 'Kecap Bango', hargaList: [3000, 1000], stok: 40, supplier: 'ABC Pangan', exp: '' },
    { nama: 'Indomie Goreng', hargaList: [3500], stok: 50, supplier: 'Indofood', exp: '' },
    { nama: 'Indomie Soto', hargaList: [3500], stok: 45, supplier: 'Indofood', exp: '' },
    { nama: 'Aqua 600ml', hargaList: [3000], stok: 30, supplier: 'Danone', exp: '' },
    { nama: 'Teh Botol', hargaList: [5000], stok: 20, supplier: 'Sosro', exp: '' },
    { nama: 'Roti Tawar', hargaList: [10000, 6000], stok: 8, supplier: 'Sari Roti', exp: '2026-09-10' },
    { nama: 'Susu UHT', hargaList: [7000], stok: 5, supplier: 'Ultrajaya', exp: '2026-09-08' },
  ];
  for (const p of contoh) await add('produk', p);
}
