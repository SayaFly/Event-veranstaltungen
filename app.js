/**
 * Event-Veranstaltungen – App Logic
 * Manages events with localStorage persistence.
 */

/* ── Utilities ── */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/* ── Storage ── */
const STORAGE_KEY = 'event_veranstaltungen';

function loadEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveEvents(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

/* ── State ── */
let events = loadEvents();
let pendingDeleteId = null;

/* Seed with sample data on first visit */
if (events.length === 0) {
  events = [
    {
      id: generateId(),
      title: 'Berliner Philharmoniker – Sommernacht',
      category: 'Konzert',
      date: '2026-07-15',
      time: '20:00',
      location: 'Waldbühne Berlin',
      description: 'Ein unvergesslicher Abend mit klassischer Musik unter freiem Himmel.',
    },
    {
      id: generateId(),
      title: 'Tech-Konferenz 2026',
      category: 'Konferenz',
      date: '2026-09-03',
      time: '09:00',
      location: 'Messe München',
      description: 'Zukunftsweisende Vorträge zu KI, Cloud-Computing und Web-Technologien.',
    },
    {
      id: generateId(),
      title: 'Stadtmarathon Hamburg',
      category: 'Sport',
      date: '2026-05-24',
      time: '08:30',
      location: 'Hamburg Innenstadt',
      description: 'Laufe durch das Herz Hamburgs – für Anfänger und Profis.',
    },
  ];
  saveEvents(events);
}

/* ── DOM References ── */
const eventsGrid      = document.getElementById('events-grid');
const emptyState      = document.getElementById('empty-state');
const searchInput     = document.getElementById('search-input');
const categoryFilter  = document.getElementById('category-filter');
const openModalBtn    = document.getElementById('open-modal-btn');
const modalOverlay    = document.getElementById('modal-overlay');
const closeModalBtn   = document.getElementById('close-modal-btn');
const cancelBtn       = document.getElementById('cancel-btn');
const eventForm       = document.getElementById('event-form');
const editIdField     = document.getElementById('edit-id');
const titleField      = document.getElementById('event-title');
const dateField       = document.getElementById('event-date');
const timeField       = document.getElementById('event-time');
const locationField   = document.getElementById('event-location');
const descField       = document.getElementById('event-description');
const categoryField   = document.getElementById('event-category');
const modalTitle      = document.getElementById('modal-title');
const titleError      = document.getElementById('title-error');
const dateError       = document.getElementById('date-error');
const confirmOverlay  = document.getElementById('confirm-overlay');
const confirmCancelBtn= document.getElementById('confirm-cancel-btn');
const confirmDeleteBtn= document.getElementById('confirm-delete-btn');

/* ── Toast ── */
function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/* ── Render ── */
function renderEvents() {
  const query    = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  const filtered = events.filter(ev => {
    const matchCat   = !category || ev.category === category;
    const matchQuery = !query
      || ev.title.toLowerCase().includes(query)
      || (ev.location || '').toLowerCase().includes(query)
      || (ev.description || '').toLowerCase().includes(query);
    return matchCat && matchQuery;
  });

  eventsGrid.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  // Sort by date ascending
  filtered.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  filtered.forEach(ev => {
    const card = buildCard(ev);
    eventsGrid.appendChild(card);
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

function buildCard(ev) {
  const article = document.createElement('article');
  article.className = 'event-card';
  article.dataset.id = ev.id;

  article.innerHTML = `
    <div class="card-accent accent-${ev.category}"></div>
    <div class="card-body">
      <span class="card-category cat-${ev.category}">${escapeHtml(ev.category)}</span>
      <h3 class="card-title">${escapeHtml(ev.title)}</h3>
      <div class="card-meta">
        <span>📅 ${escapeHtml(formatDate(ev.date))}${ev.time ? ' · ' + escapeHtml(ev.time) + ' Uhr' : ''}</span>
        ${ev.location ? `<span>📍 ${escapeHtml(ev.location)}</span>` : ''}
      </div>
      ${ev.description ? `<p class="card-desc">${escapeHtml(ev.description)}</p>` : ''}
    </div>
    <div class="card-footer">
      <button class="btn btn-secondary btn-edit" data-id="${ev.id}">✏️ Bearbeiten</button>
      <button class="btn btn-danger btn-delete" data-id="${ev.id}">🗑️ Löschen</button>
    </div>
  `;

  article.querySelector('.btn-edit').addEventListener('click', () => openEditModal(ev.id));
  article.querySelector('.btn-delete').addEventListener('click', () => openConfirm(ev.id));

  return article;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ── Modal helpers ── */
function openModal() {
  modalOverlay.hidden = false;
  titleField.focus();
}

function closeModal() {
  modalOverlay.hidden = true;
  eventForm.reset();
  editIdField.value = '';
  clearErrors();
}

function openAddModal() {
  modalTitle.textContent = 'Neue Veranstaltung';
  document.getElementById('save-btn').textContent = 'Speichern';
  editIdField.value = '';
  eventForm.reset();
  clearErrors();
  openModal();
}

function openEditModal(id) {
  const ev = events.find(e => e.id === id);
  if (!ev) return;

  modalTitle.textContent = 'Veranstaltung bearbeiten';
  document.getElementById('save-btn').textContent = 'Aktualisieren';
  editIdField.value    = ev.id;
  titleField.value     = ev.title;
  dateField.value      = ev.date;
  timeField.value      = ev.time || '';
  locationField.value  = ev.location || '';
  descField.value      = ev.description || '';
  categoryField.value  = ev.category;
  clearErrors();
  openModal();
}

/* ── Validation ── */
function clearErrors() {
  titleError.textContent = '';
  dateError.textContent  = '';
  titleField.classList.remove('invalid');
  dateField.classList.remove('invalid');
}

function validateForm() {
  let valid = true;
  clearErrors();

  if (!titleField.value.trim()) {
    titleError.textContent = 'Bitte einen Titel eingeben.';
    titleField.classList.add('invalid');
    valid = false;
  }

  if (!dateField.value) {
    dateError.textContent = 'Bitte ein Datum wählen.';
    dateField.classList.add('invalid');
    valid = false;
  }

  return valid;
}

/* ── Form submit ── */
eventForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!validateForm()) return;

  const id = editIdField.value;

  const payload = {
    title:       titleField.value.trim(),
    category:    categoryField.value,
    date:        dateField.value,
    time:        timeField.value,
    location:    locationField.value.trim(),
    description: descField.value.trim(),
  };

  if (id) {
    // Edit
    const idx = events.findIndex(ev => ev.id === id);
    if (idx !== -1) {
      events[idx] = { ...events[idx], ...payload };
      showToast('✅ Veranstaltung aktualisiert.');
    }
  } else {
    // Create
    events.push({ id: generateId(), ...payload });
    showToast('🎉 Veranstaltung hinzugefügt.');
  }

  saveEvents(events);
  renderEvents();
  closeModal();
});

/* ── Delete confirm ── */
function openConfirm(id) {
  pendingDeleteId = id;
  confirmOverlay.hidden = false;
}

function closeConfirm() {
  pendingDeleteId = null;
  confirmOverlay.hidden = true;
}

confirmDeleteBtn.addEventListener('click', () => {
  if (!pendingDeleteId) return;
  events = events.filter(ev => ev.id !== pendingDeleteId);
  saveEvents(events);
  renderEvents();
  showToast('🗑️ Veranstaltung gelöscht.');
  closeConfirm();
});

confirmCancelBtn.addEventListener('click', closeConfirm);

/* ── Event Listeners ── */
openModalBtn.addEventListener('click', openAddModal);
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

// Close modals on overlay click
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
confirmOverlay.addEventListener('click', e => { if (e.target === confirmOverlay) closeConfirm(); });

// Close modals on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!modalOverlay.hidden) closeModal();
    if (!confirmOverlay.hidden) closeConfirm();
  }
});

// Search & filter
searchInput.addEventListener('input', renderEvents);
categoryFilter.addEventListener('change', renderEvents);

/* ── Init ── */
renderEvents();
