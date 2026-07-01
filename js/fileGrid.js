const FILES_DATA = {
  'home': [
    { type: 'folder', name: 'Photos',       meta: '12 items', id: 'photos' },
    { type: 'folder', name: 'Work Projects', meta: '10 items', id: 'work-projects' },
    { type: 'docx',   name: 'One Pager.docx',              meta: '2.4 MB', id: 'one-pager' },
    { type: 'pptx',   name: 'Mockup Presentation.pptx',    meta: '15 MB',  id: 'mockup-pptx' },
    { type: 'xlsx',   name: 'Grades.xlsx',                  meta: '1.2 MB', id: 'grades' },
    { type: 'json',   name: 'Backup.json',                  meta: '4 KB',   id: 'backup' },
  ],
  'my-files': [
    { type: 'folder', name: 'Photos',       meta: '12 items', id: 'photos' },
    { type: 'folder', name: 'Work Projects', meta: '10 items', id: 'work-projects' },
    { type: 'docx',   name: 'One Pager.docx',              meta: '2.4 MB', id: 'one-pager' },
    { type: 'pptx',   name: 'Mockup Presentation.pptx',    meta: '15 MB',  id: 'mockup-pptx' },
    { type: 'xlsx',   name: 'Grades.xlsx',                  meta: '1.2 MB', id: 'grades' },
    { type: 'json',   name: 'Backup.json',                  meta: '4 KB',   id: 'backup' },
  ],
  'shared': [
    { type: 'folder', name: 'Design Assets', meta: '8 items', id: 'design-assets' },
    { type: 'docx',   name: 'Project Brief.docx', meta: '1.1 MB', id: 'project-brief' },
  ],
  'recent': [
    { type: 'pptx', name: 'Mockup Presentation.pptx', meta: '15 MB',  id: 'mockup-pptx-r' },
    { type: 'xlsx', name: 'Grades.xlsx',               meta: '1.2 MB', id: 'grades-r' },
    { type: 'json', name: 'Backup.json',               meta: '4 KB',   id: 'backup-r' },
  ],
};

const FILE_ICONS = {
  folder: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="#5b7fd4" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  docx: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="#3b7ef4" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline stroke="#3b7ef4" points="14 2 14 8 20 8"/><line stroke="#3b7ef4" x1="16" y1="13" x2="8" y2="13"/><line stroke="#3b7ef4" x1="16" y1="17" x2="8" y2="17"/><polyline stroke="#3b7ef4" points="10 9 9 9 8 9"/></svg>`,
  pptx: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="#e07030" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline stroke="#e07030" points="14 2 14 8 20 8"/><rect stroke="#e07030" x="8" y="12" width="8" height="6" rx="1"/></svg>`,
  xlsx: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="#22c55e" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline stroke="#22c55e" points="14 2 14 8 20 8"/><line stroke="#22c55e" x1="8" y1="13" x2="16" y2="13"/><line stroke="#22c55e" x1="8" y1="17" x2="16" y2="17"/><line stroke="#22c55e" x1="12" y1="11" x2="12" y2="19"/></svg>`,
  json: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="#7a84a0" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline stroke="#7a84a0" points="14 2 14 8 20 8"/><line stroke="#7a84a0" x1="16" y1="13" x2="8" y2="13"/><line stroke="#7a84a0" x1="16" y1="17" x2="8" y2="17"/></svg>`,
};

const PHOTO_COUNT = 10;

function getFileIcon(type) {
  return FILE_ICONS[type] || FILE_ICONS.json;
}

function renderFileCard(file, isAdmin) {
  const card = document.createElement('div');
  const typeClass = ['docx', 'pptx', 'xlsx'].includes(file.type) ? file.type : '';
  card.className = `file-card ${typeClass}`.trim();
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${file.name}, ${file.meta}`);

  if (isAdmin) {
    const menuBtn = document.createElement('button');
    menuBtn.className = 'card-menu-btn';
    menuBtn.textContent = '···';
    menuBtn.setAttribute('aria-label', `Options for ${file.name}`);
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (file.type === 'folder') {
        renderAuthModal(file.name);
      } else {
        showToast(`No admin actions available for files`, 'info');
      }
    });
    card.appendChild(menuBtn);
  }

  const iconEl = document.createElement('div');
  iconEl.className = 'file-card-icon';
  iconEl.innerHTML = getFileIcon(file.type);

  const infoEl = document.createElement('div');
  infoEl.className = 'file-card-info';

  const nameEl = document.createElement('div');
  nameEl.className = 'file-card-name';
  nameEl.textContent = file.name;
  nameEl.setAttribute('title', file.name);

  const metaEl = document.createElement('div');
  metaEl.className = 'file-card-meta';
  metaEl.textContent = file.meta;

  infoEl.appendChild(nameEl);
  infoEl.appendChild(metaEl);
  card.appendChild(iconEl);
  card.appendChild(infoEl);

  const handleOpen = () => {
    if (file.type === 'folder') {
      navigateToFolder(file);
    } else {
      showToast(`Opening "${file.name}"`, 'info');
    }
  };

  card.addEventListener('click', handleOpen);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpen();
    }
  });

  return card;
}

function renderPhotoGrid() {
  const grid = document.createElement('div');
  grid.className = 'photo-grid';
  grid.setAttribute('aria-label', 'Photos');

  const photoIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;

  for (let i = 1; i <= PHOTO_COUNT; i++) {
    const card = document.createElement('div');
    card.className = `photo-card photo-${i}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Photo ${i}`);

    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'photo-card-icon';
    iconWrapper.innerHTML = photoIcon;

    const overlay = document.createElement('div');
    overlay.className = 'photo-card-overlay';

    card.appendChild(iconWrapper);
    card.appendChild(overlay);

    card.addEventListener('click', () => showToast(`Photo ${i} selected`, 'info'));

    grid.appendChild(card);
  }

  return grid;
}

function renderFileGrid(viewKey, isAdmin, searchQuery) {
  const files = FILES_DATA[viewKey] || FILES_DATA['my-files'];
  const query = (searchQuery || '').trim().toLowerCase();
  const filtered = query
    ? files.filter((f) => f.name.toLowerCase().includes(query))
    : files;

  const grid = document.createElement('div');
  grid.className = 'file-grid';
  grid.id = 'fileGrid';

  if (isAdmin) {
    grid.closest('.app-shell')?.classList.add('admin-mode');
  }

  if (filtered.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'no-results-msg';
    msg.textContent = `No files match "${searchQuery}"`;
    grid.appendChild(msg);
    return grid;
  }

  filtered.forEach((file) => grid.appendChild(renderFileCard(file, isAdmin)));
  return grid;
}
