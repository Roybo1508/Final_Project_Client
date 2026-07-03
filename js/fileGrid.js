const FILE_ICONS = {
  image:    `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect stroke="#3b7ef4" x="3" y="3" width="18" height="18" rx="2"/><circle stroke="#3b7ef4" cx="8.5" cy="8.5" r="1.5"/><polyline stroke="#3b7ef4" points="21 15 16 10 5 21"/></svg>`,
  video:    `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect stroke="#e07030" x="2" y="4" width="20" height="16" rx="2"/><polygon stroke="#e07030" points="10 8 16 12 10 16 10 8"/></svg>`,
  audio:    `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="#8b5cf6" d="M9 18V5l12-2v13"/><circle stroke="#8b5cf6" cx="6" cy="18" r="3"/><circle stroke="#8b5cf6" cx="18" cy="16" r="3"/></svg>`,
  document: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="#22c55e" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline stroke="#22c55e" points="14 2 14 8 20 8"/><line stroke="#22c55e" x1="16" y1="13" x2="8" y2="13"/><line stroke="#22c55e" x1="16" y1="17" x2="8" y2="17"/></svg>`,
  other:    `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="#7a84a0" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline stroke="#7a84a0" points="14 2 14 8 20 8"/></svg>`,
};

const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

function getFileIcon(type) {
  return FILE_ICONS[type] || FILE_ICONS.other;
}

function formatFileSize(sizeKB) {
  if (sizeKB >= 1024) return `${(sizeKB / 1024).toFixed(1)} MB`;
  return `${sizeKB} KB`;
}

function renderFileCard(file) {
  const card = document.createElement('div');
  card.className = 'file-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${file.fileName}, ${formatFileSize(file.fileSizeKB)}. Click to download`);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'card-delete-btn';
  deleteBtn.innerHTML = TRASH_ICON;
  deleteBtn.setAttribute('aria-label', `Delete ${file.fileName}`);
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    confirmDeleteFile(file);
  });
  card.appendChild(deleteBtn);

  const iconEl = document.createElement('div');
  iconEl.className = 'file-card-icon';
  iconEl.innerHTML = getFileIcon(file.fileType);

  const infoEl = document.createElement('div');
  infoEl.className = 'file-card-info';

  const nameEl = document.createElement('div');
  nameEl.className = 'file-card-name';
  nameEl.textContent = file.fileName;
  nameEl.setAttribute('title', file.fileName);

  const metaEl = document.createElement('div');
  metaEl.className = 'file-card-meta';
  metaEl.textContent = formatFileSize(file.fileSizeKB);

  infoEl.appendChild(nameEl);
  infoEl.appendChild(metaEl);
  card.appendChild(iconEl);
  card.appendChild(infoEl);

  const handleOpen = () => downloadFile(file._id);
  card.addEventListener('click', handleOpen);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpen();
    }
  });

  return card;
}

function renderPhotoGrid(imageFiles) {
  const grid = document.createElement('div');
  grid.className = 'photo-grid';
  grid.setAttribute('aria-label', 'Photos');

  imageFiles.forEach((file) => {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${file.fileName}. Click to download`);

    const img = document.createElement('img');
    img.className = 'photo-card-img';
    img.src = file.fileData;
    img.alt = file.fileName;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'card-delete-btn';
    deleteBtn.innerHTML = TRASH_ICON;
    deleteBtn.setAttribute('aria-label', `Delete ${file.fileName}`);
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      confirmDeleteFile(file);
    });

    card.appendChild(img);
    card.appendChild(deleteBtn);

    card.addEventListener('click', () => downloadFile(file._id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        downloadFile(file._id);
      }
    });

    grid.appendChild(card);
  });

  return grid;
}

function renderFileGrid(files) {
  const grid = document.createElement('div');
  grid.className = 'file-grid';
  grid.id = 'fileGrid';

  files.forEach((file) => grid.appendChild(renderFileCard(file)));
  return grid;
}
