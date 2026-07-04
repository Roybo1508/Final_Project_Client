const FILE_ICONS = {
  image:    `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect stroke="#3b7ef4" x="3" y="3" width="18" height="18" rx="2"/><circle stroke="#3b7ef4" cx="8.5" cy="8.5" r="1.5"/><polyline stroke="#3b7ef4" points="21 15 16 10 5 21"/></svg>`,
  video:    `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect stroke="#e07030" x="2" y="4" width="20" height="16" rx="2"/><polygon stroke="#e07030" points="10 8 16 12 10 16 10 8"/></svg>`,
  audio:    `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="#8b5cf6" d="M9 18V5l12-2v13"/><circle stroke="#8b5cf6" cx="6" cy="18" r="3"/><circle stroke="#8b5cf6" cx="18" cy="16" r="3"/></svg>`,
  document: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="#22c55e" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline stroke="#22c55e" points="14 2 14 8 20 8"/><line stroke="#22c55e" x1="16" y1="13" x2="8" y2="13"/><line stroke="#22c55e" x1="16" y1="17" x2="8" y2="17"/></svg>`,
  other:    `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="#7a84a0" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline stroke="#7a84a0" points="14 2 14 8 20 8"/></svg>`,
};

const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

const SHARE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`;

const FOLDER_ICON = `<svg viewBox="0 0 24 24" fill="#fbbf24" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;

const EDIT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;

const MOVE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5 9 2 12 5 15"/><polyline points="9 18 12 21 15 18"/><line x1="2" y1="12" x2="12" y2="12"/><line x1="12" y1="21" x2="12" y2="11"/></svg>`;

function getFileIcon(type) {
  return FILE_ICONS[type] || FILE_ICONS.other;
}

function formatFileSize(sizeKB) {
  if (sizeKB >= 1024) return `${(sizeKB / 1024).toFixed(1)} MB`;
  return `${sizeKB} KB`;
}

function renderFolderCard(folder) {
  const card = document.createElement('div');
  card.className = 'folder-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${folder.folderName} folder with ${folder.itemCount || 0} items`);

  const editBtn = document.createElement('button');
  editBtn.className = 'card-edit-btn';
  editBtn.innerHTML = EDIT_ICON;
  editBtn.setAttribute('aria-label', `Rename ${folder.folderName}`);
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openFolderModal('rename', folder);
  });
  card.appendChild(editBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'card-delete-btn';
  deleteBtn.innerHTML = TRASH_ICON;
  deleteBtn.setAttribute('aria-label', `Delete ${folder.folderName}`);
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteFolder(folder._id);
  });
  card.appendChild(deleteBtn);

  const iconEl = document.createElement('div');
  iconEl.className = 'folder-card-icon';
  iconEl.innerHTML = FOLDER_ICON;

  const infoEl = document.createElement('div');
  infoEl.className = 'folder-card-info';

  const nameEl = document.createElement('div');
  nameEl.className = 'folder-card-name';
  nameEl.textContent = folder.folderName;
  nameEl.setAttribute('title', folder.folderName);

  const countEl = document.createElement('div');
  countEl.className = 'folder-card-count';
  countEl.textContent = `${folder.itemCount || 0} items`;

  infoEl.appendChild(nameEl);
  infoEl.appendChild(countEl);
  card.appendChild(iconEl);
  card.appendChild(infoEl);

  const handleOpen = () => navigateToFolder(folder._id);
  card.addEventListener('click', handleOpen);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpen();
    }
  });

  return card;
}

function renderFileCard(file) {
  const card = document.createElement('div');
  card.className = 'file-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${file.fileName}, ${formatFileSize(file.fileSizeKB)}. Click to download`);

  const moveBtn = document.createElement('button');
  moveBtn.className = 'card-move-btn';
  moveBtn.innerHTML = MOVE_ICON;
  moveBtn.setAttribute('aria-label', `Move ${file.fileName}`);
  moveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openMoveModal(file);
  });
  card.appendChild(moveBtn);

  const shareBtn = document.createElement('button');
  shareBtn.className = 'card-share-btn';
  shareBtn.innerHTML = SHARE_ICON;
  shareBtn.setAttribute('aria-label', `Share ${file.fileName}`);
  shareBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openShareModal(file);
  });
  card.appendChild(shareBtn);

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

    const shareBtn = document.createElement('button');
    shareBtn.className = 'card-share-btn';
    shareBtn.innerHTML = SHARE_ICON;
    shareBtn.setAttribute('aria-label', `Share ${file.fileName}`);
    shareBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openShareModal(file);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'card-delete-btn';
    deleteBtn.innerHTML = TRASH_ICON;
    deleteBtn.setAttribute('aria-label', `Delete ${file.fileName}`);
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      confirmDeleteFile(file);
    });

    card.appendChild(img);
    card.appendChild(shareBtn);
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

function renderFileGrid(files, folders = []) {
  const grid = document.createElement('div');
  grid.className = 'file-grid';
  grid.id = 'fileGrid';

  // Render folders first
  folders.forEach((folder) => grid.appendChild(renderFolderCard(folder)));

  // Then render files
  files.forEach((file) => grid.appendChild(renderFileCard(file)));
  return grid;
}
