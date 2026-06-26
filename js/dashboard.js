/* ===================================================
   DASHBOARD — JavaScript
=================================================== */

const STORAGE_KEY   = 'wedding_config';
const RSVP_KEY      = 'wedding_rsvps';
const GALLERY_KEY   = 'wedding_gallery_data';

// ─── Supabase Config ───────────────────────────────
const SB_URL  = 'https://hkivsfozrmlwuyivfspn.supabase.co';
const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhraXZzZm96cm1sd3V5aXZmc3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NDU2MDksImV4cCI6MjA5ODAyMTYwOX0.k4W-y7Qa-1kiaXINfyEbpqSqVjlMAKbO8o2lWtHog5Q';
const SB_HEADERS = {
  'apikey': SB_KEY,
  'Authorization': 'Bearer ' + SB_KEY,
  'Content-Type': 'application/json',
};

async function sbFetchRsvps() {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/rsvps?select=*&order=created_at.asc`, { headers: SB_HEADERS });
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

async function sbDeleteRsvp(id) {
  await fetch(`${SB_URL}/rest/v1/rsvps?id=eq.${id}`, { method: 'DELETE', headers: SB_HEADERS });
}

async function sbDeleteAllRsvps() {
  await fetch(`${SB_URL}/rest/v1/rsvps?id=not.is.null`, { method: 'DELETE', headers: SB_HEADERS });
}

const DEFAULTS = {
  person1: 'Mohammed Noufal',
  person2: 'Khadeejathul Kubra CA',
  weddingDate: '2026-07-20',
  ceremonyTime: '11:00',
  ceremonyVenue: 'KH Hall, Kalanad',
  ceremonyAddress: 'Kalanad, Kerala',
  receptionTime: '',
  receptionVenue: 'Walima to be announced',
  receptionAddress: '',
  message: 'Request the pleasure of your presence with family on the auspicious occasion of the marriage of our son.',
  storyQuote: '"And among His signs is that He created for you mates from among yourselves, that you may dwell in tranquility with them, and He has put love and mercy between your hearts."',
  storyText: 'With hearts full of gratitude to Allah, we joyfully invite you to witness and celebrate the Nikah of Mohammed Noufal and Khadeejathul Kubra CA. May this union be filled with blessings, love, and happiness.',
  musicUrl: '',
  musicAutoplay: true,
  musicEnabled: true,
  galleryImages: [],
  themeColor: 'rosegold',
  backgroundPattern: 'floral',
  fontStyle: 'editorial',
  hijri: '',
  phone: '',
  dress: '',
};

// ─── Storage Helpers ───────────────────────────────
function getConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS };
  } catch { return { ...DEFAULTS }; }
}

function saveConfig(patch) {
  const cfg = { ...getConfig(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  showToast('Changes saved ✓');
}

function getRsvps() {
  try { return JSON.parse(localStorage.getItem(RSVP_KEY) || '[]'); }
  catch { return []; }
}

// Cache for async Supabase data used by overview
let _cachedRsvps = [];

// ─── Toast ─────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ─── Navigation ────────────────────────────────────
let currentPanel = 'overview';

function navigate(id) {
  // Panels
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('panel-' + id);
  if (target) target.classList.add('active');

  // Nav items
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-panel="${id}"]`);
  if (navItem) navItem.classList.add('active');

  // Topbar title
  const titles = {
    overview: 'Overview',
    general: 'General Settings',
    music: 'Music Settings',
    rsvp: 'RSVP Manager',
    gallery: 'Gallery',
  };
  document.getElementById('topbar-title').textContent = titles[id] || id;

  currentPanel = id;

  // Panel-specific data loading
  if (id === 'overview') loadOverview();
  if (id === 'rsvp') loadRsvpTable();
  if (id === 'gallery') loadGalleryManager();

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

// ─── Overview Panel ────────────────────────────────
async function loadOverview() {
  const cfg   = getConfig();
  const rsvps = await sbFetchRsvps();
  _cachedRsvps = rsvps;

  const attending = rsvps.filter(r => r.attending === 'yes').length;
  const notGoing  = rsvps.filter(r => r.attending === 'no').length;
  const maybe     = rsvps.filter(r => r.attending === 'maybe').length;
  const totalGuests = rsvps.filter(r => r.attending === 'yes').reduce((a, r) => a + (r.guests || 1), 0);

  setEl('stat-total-rsvp',    rsvps.length);
  setEl('stat-attending',     attending);
  setEl('stat-not-attending', notGoing);
  setEl('stat-total-guests',  totalGuests);

  // Days until wedding
  if (cfg.weddingDate) {
    const diff = Math.max(0, Math.ceil((new Date(cfg.weddingDate + 'T12:00:00') - new Date()) / 86400000));
    setEl('stat-days', diff);
  } else {
    setEl('stat-days', '—');
  }

  // Couple preview
  setEl('overview-couple', (cfg.person1 || '—') + ' & ' + (cfg.person2 || '—'));

  if (cfg.weddingDate) {
    const d = new Date(cfg.weddingDate + 'T12:00:00');
    setEl('overview-date', d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  } else {
    setEl('overview-date', 'Date not set');
  }

  setEl('overview-venue', cfg.ceremonyVenue || '—');
  setEl('overview-music', cfg.musicEnabled && cfg.musicUrl ? '🎵 Music set' : 'No music');
  setEl('overview-gallery', (cfg.galleryImages?.length || 0) + ' photos');
}

// ─── General Settings Panel ────────────────────────
function loadGeneralSettings() {
  const cfg = getConfig();
  setField('f-person1',          cfg.person1);
  setField('f-person2',          cfg.person2);
  setField('f-wedding-date',     cfg.weddingDate);
  setField('f-ceremony-time',    cfg.ceremonyTime);
  setField('f-ceremony-venue',   cfg.ceremonyVenue);
  setField('f-ceremony-address', cfg.ceremonyAddress);
  setField('f-reception-time',   cfg.receptionTime);
  setField('f-reception-venue',  cfg.receptionVenue);
  setField('f-reception-address',cfg.receptionAddress);
  setField('f-message',          cfg.message);
  setField('f-story-quote',      cfg.storyQuote);
  setField('f-story-text',       cfg.storyText);
  setField('f-theme-color',      cfg.themeColor);
  setField('f-bg-pattern',       cfg.backgroundPattern);
  setField('f-font-style',       cfg.fontStyle);
  setField('f-hijri',            cfg.hijri);
  setField('f-phone',            cfg.phone);
  setField('f-dress',            cfg.dress);
}

document.getElementById('form-general').addEventListener('submit', (e) => {
  e.preventDefault();
  saveConfig({
    person1:          getField('f-person1'),
    person2:          getField('f-person2'),
    weddingDate:      getField('f-wedding-date'),
    ceremonyTime:     getField('f-ceremony-time'),
    ceremonyVenue:    getField('f-ceremony-venue'),
    ceremonyAddress:  getField('f-ceremony-address'),
    receptionTime:    getField('f-reception-time'),
    receptionVenue:   getField('f-reception-venue'),
    receptionAddress: getField('f-reception-address'),
    message:          getField('f-message'),
    storyQuote:       getField('f-story-quote'),
    storyText:        getField('f-story-text'),
    themeColor:       getField('f-theme-color'),
    backgroundPattern:getField('f-bg-pattern'),
    fontStyle:        getField('f-font-style'),
    hijri:            getField('f-hijri'),
    phone:            getField('f-phone'),
    dress:            getField('f-dress'),
  });
});

// ─── Music Settings Panel ──────────────────────────
let uploadedMusicUrl = '';

function loadMusicSettings() {
  const cfg = getConfig();
  setToggle('t-music-enabled',  cfg.musicEnabled);
  setToggle('t-music-autoplay', cfg.musicAutoplay);

  if (cfg.musicUrl) {
    showTrackInfo(cfg.musicUrl.split('/').pop() || 'Uploaded track');
    uploadedMusicUrl = cfg.musicUrl;
  }

  // URL input
  const urlInput = document.getElementById('music-url-input');
  if (urlInput && cfg.musicUrl && cfg.musicUrl.startsWith('http')) {
    urlInput.value = cfg.musicUrl;
  }
}

function showTrackInfo(name) {
  const info = document.getElementById('track-info');
  const nameEl = document.getElementById('track-name');
  if (info) info.style.display = 'flex';
  if (nameEl) nameEl.textContent = name;
}

// File upload handler
document.getElementById('music-file-input').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedMusicUrl = e.target.result;
    showTrackInfo(file.name);
    showToast('Music file loaded!');
  };
  reader.readAsDataURL(file);
});

document.getElementById('form-music').addEventListener('submit', (e) => {
  e.preventDefault();
  const urlInput = document.getElementById('music-url-input').value.trim();
  const finalUrl = urlInput || uploadedMusicUrl;

  saveConfig({
    musicUrl:      finalUrl,
    musicEnabled:  getToggle('t-music-enabled'),
    musicAutoplay: getToggle('t-music-autoplay'),
  });
});

document.getElementById('remove-music-btn').addEventListener('click', () => {
  uploadedMusicUrl = '';
  saveConfig({ musicUrl: '' });
  const info = document.getElementById('track-info');
  if (info) info.style.display = 'none';
  document.getElementById('music-url-input').value = '';
  showToast('Music removed');
});

// ─── RSVP Panel ────────────────────────────────────
async function loadRsvpTable() {
  const tbody = document.getElementById('rsvp-tbody');
  const empty = document.getElementById('rsvp-empty');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;opacity:.5;">Loading…</td></tr>';
  empty.style.display = 'none';

  const rsvps = await sbFetchRsvps();
  _cachedRsvps = rsvps;

  if (!rsvps.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = rsvps.map((r) => `
    <tr>
      <td>${r.guests || 1}</td>
      <td><span class="badge badge-${r.attending}">${capitalize(r.attending)}</span></td>
      <td>${r.date || '—'}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteRsvp('${r.id}')">✕</button></td>
    </tr>
  `).join('');

  // Refresh overview stats too
  loadOverviewFromCache(rsvps);
}

async function deleteRsvp(id) {
  await sbDeleteRsvp(id);
  loadRsvpTable();
  showToast('RSVP entry deleted');
}

async function clearAllRsvps() {
  if (!confirm('Clear ALL RSVP entries? This cannot be undone.')) return;
  await sbDeleteAllRsvps();
  loadRsvpTable();
  showToast('All RSVPs cleared');
}

function loadOverviewFromCache(rsvps) {
  const attending   = rsvps.filter(r => r.attending === 'yes').length;
  const notGoing    = rsvps.filter(r => r.attending === 'no').length;
  const totalGuests = rsvps.filter(r => r.attending === 'yes').reduce((a, r) => a + (r.guests || 1), 0);
  setEl('stat-total-rsvp',    rsvps.length);
  setEl('stat-attending',     attending);
  setEl('stat-not-attending', notGoing);
  setEl('stat-total-guests',  totalGuests);
}

async function exportRsvps() {
  const rsvps = await sbFetchRsvps();
  if (!rsvps.length) { showToast('No RSVPs to export'); return; }

  const headers = ['Guests', 'Attending', 'Date'];
  const rows = rsvps.map(r => [r.guests || 1, r.attending, r.date].join(','));
  const csv = [headers.join(','), ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'wedding_rsvps.csv';
  a.click();
}

// ─── Gallery Manager ───────────────────────────────
function loadGalleryManager() {
  const cfg = getConfig();
  const grid = document.getElementById('gallery-manage-grid');
  if (!grid) return;

  grid.innerHTML = '';

  (cfg.galleryImages || []).forEach((src, i) => {
    const item = document.createElement('div');
    item.className = 'gallery-manage-item';
    item.innerHTML = `
      <img src="${src}" alt="Gallery photo">
      <button class="gallery-remove" onclick="removeGalleryImage(${i})" title="Remove">✕</button>
    `;
    grid.appendChild(item);
  });

  // Add button
  const addBtn = document.createElement('div');
  addBtn.className = 'gallery-add-btn';
  addBtn.innerHTML = `
    <span style="font-size:1.5rem">+</span>
    <span>Add Photo</span>
    <input type="file" accept="image/*" multiple onchange="addGalleryImages(this)">
  `;
  grid.appendChild(addBtn);
}

function addGalleryImages(input) {
  const files = Array.from(input.files);
  if (!files.length) return;

  const cfg = getConfig();
  const images = cfg.galleryImages || [];
  let loaded = 0;

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      images.push(e.target.result);
      loaded++;
      if (loaded === files.length) {
        saveConfig({ galleryImages: images });
        loadGalleryManager();
      }
    };
    reader.readAsDataURL(file);
  });
}

function removeGalleryImage(index) {
  const cfg = getConfig();
  const images = [...(cfg.galleryImages || [])];
  images.splice(index, 1);
  saveConfig({ galleryImages: images });
  loadGalleryManager();
}

// ─── Helpers ───────────────────────────────────────
function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setField(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || '';
}

function getField(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function setToggle(id, checked) {
  const el = document.getElementById(id);
  if (el) el.checked = !!checked;
}

function getToggle(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Init ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Sidebar navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigate(item.dataset.panel));
  });

  // Sidebar toggle (mobile)
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Preview button
  document.getElementById('preview-btn').addEventListener('click', () => {
    window.open('https://abdullajamharii-glitch.github.io/noufu-wed/', '_blank');
  });

  // Load initial data for all panels
  loadOverview();
  loadGeneralSettings();
  loadMusicSettings();

  // Auto-refresh RSVP stats every 30 seconds
  setInterval(() => {
    if (currentPanel === 'overview') loadOverview();
    if (currentPanel === 'rsvp') loadRsvpTable();
  }, 30000);

  // Start on overview
  navigate('overview');
});
