const API_BASE_URL = 'https://final-project-server-rdim.onrender.com/api';

const state = {
  role:       'user',
  activeView: 'my-files',
  viewMode:   'grid',
  breadcrumbs: ['Home', 'My Files'],
  currentUser: null,
  userFiles: [],
  filesLoading: false,
  searchQuery: '',
  adminUsers: [],
  allFiles: [],
  isLoading: false,
  userFolders: [],
  currentFolderId: null,
  folderBreadcrumb: [],
  currentFolderFolders: [],
};

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

// API helper functions
async function apiCall(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }
    return data;
  } catch (error) {
    showToast(error.message || 'Network error', 'error');
    throw error;
  }
}

async function loadAdminUsers() {
  try {
    state.isLoading = true;
    const data = await apiCall('/users');
    state.adminUsers = data.users.map(user => ({
      _id: user._id,
      initial: user.username?.charAt(0).toUpperCase() || 'U',
      name: user.username,
      role: user.role || 'Standard User',
      storage: '0 GB',
      storagePercent: 0,
      status: 'active',
      colorClass: getColorForInitial(user.username?.charAt(0) || 'U')
    }));
    state.isLoading = false;
  } catch (error) {
    state.isLoading = false;
    showToast('Failed to load users', 'error');
  }
}

async function loadAllFiles() {
  try {
    const data = await apiCall('/files/admin/all');
    state.allFiles = data.files;
  } catch (error) {
    showToast('Failed to load files', 'error');
  }
}

function buildFilesQuery() {
  const params = new URLSearchParams({ userId: state.currentUser.id });
  if (state.activeView === 'photos') {
    params.set('fileType', 'image');
    params.set('includeData', 'true');
  }
  if (state.activeView === 'recent') {
    params.set('sortBy', 'createdAt');
    params.set('order', 'desc');
  }
  if (state.searchQuery) {
    params.set('search', state.searchQuery);
  }
  return params.toString();
}

async function loadUserFiles() {
  if (!state.currentUser) return;
  state.filesLoading = true;
  renderContent();
  try {
    const data = await apiCall(`/files?${buildFilesQuery()}`);
    state.userFiles = data.files;
  } catch (error) {
    state.userFiles = [];
  } finally {
    state.filesLoading = false;
    renderContent();
  }
}

async function downloadFile(fileId) {
  try {
    const data = await apiCall(`/files/${fileId}/download`);
    const link = document.createElement('a');
    link.href = data.fileData;
    link.download = data.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast(`Downloading "${data.fileName}"`, 'success');
  } catch (error) {
    // apiCall already surfaces the error via toast
  }
}

function confirmDeleteFile(file) {
  showConfirmModal({
    title: 'Delete File',
    message: `Are you sure you want to delete <strong>${file.fileName}</strong>? This cannot be undone.`,
    confirmText: 'Delete',
    danger: true,
    onConfirm: async () => {
      try {
        await apiCall(`/files/${file._id}`, 'DELETE');
        closeAppModal();
        showToast('File deleted', 'success');
        await refreshCurrentView();
      } catch (error) {
        closeAppModal();
      }
    }
  });
}

function mimeToFileType(mime) {
  if (!mime) return 'other';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  const docTypes = ['application/pdf', 'application/msword', 'text/', 'application/vnd'];
  if (docTypes.some((t) => mime.startsWith(t))) return 'document';
  return 'other';
}

function handleFileUpload(file) {
  if (!file) return;

  if (file.size > MAX_FILE_SIZE_BYTES) {
    showToast('File is too large. Maximum size is 2 MB.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      showToast(`Uploading "${file.name}"…`, 'info');
      await apiCall('/files/upload', 'POST', {
        userId: state.currentUser.id,
        fileName: file.name,
        fileType: mimeToFileType(file.type),
        fileSizeKB: Math.max(1, Math.round(file.size / 1024)),
        fileData: reader.result,
        folderId: state.currentFolderId || null
      });
      showToast('File uploaded successfully', 'success');
      await loadUserFiles();
    } catch (error) {
      // apiCall already surfaces the error via toast
    }
  };
  reader.onerror = () => showToast('Could not read the file', 'error');
  reader.readAsDataURL(file);
}

const VIEW_TITLES = {
  'home':             'My Files',
  'my-files':         'My Files',
  'photos':           'Photos',
  'recent':           'Recent',
  'server-dashboard': 'Server Dashboard',
  'user-management':  'User Management',
  'all-files':        'All Files',
  'storage-backup':   'Storage & Backup',
  'security-logs':    'Security & Logs',
};

const SEARCH_PLACEHOLDERS = {
  'photos': 'Search in Photos...',
  'recent': 'Search in Recent...',
};

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function getBreadcrumbs(view) {
  const map = {
    'home':             ['Home', 'My Files'],
    'my-files':         ['Home', 'My Files'],
    'photos':           ['Home', 'Photos'],
    'recent':           ['Home', 'Recent'],
    'server-dashboard': ['Home', 'Server Dashboard'],
    'user-management':  ['Home', 'User Management'],
    'all-files':        ['Home', 'All Files'],
    'storage-backup':   ['Home', 'Storage & Backup'],
    'security-logs':    ['Home', 'Security & Logs'],
  };
  return map[view] || ['Home'];
}

function buildBreadcrumbHTML(crumbs) {
  return crumbs.map((crumb, i) => {
    if (i < crumbs.length - 1) {
      return `<span class="breadcrumb-link" data-view="${getCrumbView(crumb)}">${crumb}</span><span class="breadcrumb-sep" aria-hidden="true">›</span>`;
    }
    return `<span class="breadcrumb-current" aria-current="page">${crumb}</span>`;
  }).join('');
}

function getCrumbView(crumbText) {
  const map = { 'Home': 'home', 'My Files': 'my-files', 'Photos': 'photos', 'Recent': 'recent' };
  return map[crumbText] || 'home';
}

function isFilesView(view) {
  return ['home', 'my-files', 'recent', 'photos'].includes(view);
}

function renderContent(searchQuery) {
  const main = document.getElementById('mainContent');
  const searchInput = document.getElementById('searchInput');
  const { activeView, role, breadcrumbs, viewMode } = state;
  const isAdmin = role === 'admin';

  searchInput.placeholder = SEARCH_PLACEHOLDERS[activeView] || 'Search files...';

  const title = VIEW_TITLES[activeView] || 'My Files';
  const crumbsHTML = buildBreadcrumbHTML(breadcrumbs);

  const toolbarHTML = `
    <div class="content-toolbar">
      ${state.currentFolderId ? `
      <button class="btn-back" id="backBtn" aria-label="Go back to parent folder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Back
      </button>
      ` : ''}
      <button class="btn-upload" id="uploadBtn" aria-label="Upload files">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
        </svg>
        Upload
      </button>
      <button class="btn-new-folder" id="newFolderBtn" aria-label="Create new folder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
        </svg>
        New Folder
      </button>
      <div class="view-toggle" role="group" aria-label="View mode">
        <button class="view-btn ${viewMode === 'grid' ? 'active' : ''}" id="gridViewBtn" aria-label="Grid view" aria-pressed="${viewMode === 'grid'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
        </button>
        <button class="view-btn ${viewMode === 'list' ? 'active' : ''}" id="listViewBtn" aria-label="List view" aria-pressed="${viewMode === 'list'}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6"  x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  const emptyStateHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p class="empty-state-title">${title}</p>
      <p class="empty-state-body">This section is not yet available in this preview.</p>
    </div>
  `;

  main.innerHTML = `
    <div class="content-header">
      <h1 class="content-title">${title}</h1>
      <nav class="breadcrumb" aria-label="Breadcrumb">${crumbsHTML}</nav>
    </div>
    ${isFilesView(activeView) ? toolbarHTML : ''}
    <div id="gridContainer"></div>
  `;

  if (!isFilesView(activeView)) {
    const container = document.getElementById('gridContainer');
    if (activeView === 'server-dashboard') {
      container.appendChild(renderServerDashboard());
    } else if (activeView === 'user-management') {
      container.appendChild(renderUserManagement());
    } else if (activeView === 'all-files') {
      container.appendChild(renderAllFiles());
    } else if (activeView === 'storage-backup') {
      container.appendChild(renderStorageBackup());
    } else if (activeView === 'security-logs') {
      container.appendChild(renderSecurityLogs());
    } else {
      container.innerHTML = emptyStateHTML;
    }
    return;
  }

  const container = document.getElementById('gridContainer');

  if (isAdmin) {
    document.querySelector('.app-shell').classList.add('admin-mode');
  } else {
    document.querySelector('.app-shell').classList.remove('admin-mode');
  }

  // Folders only apply to the file-browsing views (not Photos).
  const foldersToShow = (activeView === 'photos') ? [] : (state.currentFolderFolders || []);

  if (state.filesLoading) {
    container.innerHTML = `
      <div class="files-loading">
        <div class="spinner" aria-hidden="true"></div>
        <p>Loading your files…</p>
      </div>
    `;
  } else if (state.userFiles.length === 0 && foldersToShow.length === 0) {
    const emptyMsg = state.searchQuery
      ? `No files match "${state.searchQuery}"`
      : (activeView === 'photos' ? 'No photos yet. Upload an image to get started.' : 'No files yet. Upload your first file.');
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <p class="empty-state-title">${VIEW_TITLES[activeView] || 'My Files'}</p>
        <p class="empty-state-body">${emptyMsg}</p>
      </div>
    `;
  } else if (activeView === 'photos') {
    container.appendChild(renderPhotoGrid(state.userFiles));
  } else {
    const grid = renderFileGrid(state.userFiles, foldersToShow);
    if (viewMode === 'list') grid.classList.add('list-view');
    container.appendChild(grid);
  }

  const fileInput = document.getElementById('fileUploadInput');
  document.getElementById('uploadBtn').addEventListener('click', () => fileInput.click());

  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', goBack);
  }

  const newFolderBtn = document.getElementById('newFolderBtn');
  if (newFolderBtn) {
    newFolderBtn.addEventListener('click', () => openFolderModal('create'));
  }

  document.getElementById('gridViewBtn').addEventListener('click', () => {
    state.viewMode = 'grid';
    renderContent();
  });

  document.getElementById('listViewBtn').addEventListener('click', () => {
    state.viewMode = 'list';
    renderContent();
  });

  main.querySelectorAll('.breadcrumb-link').forEach((link) => {
    link.addEventListener('click', () => {
      const view = link.dataset.view;
      if (view) navigateTo(view);
    });
  });
}

async function navigateTo(view) {
  state.activeView  = view;
  state.breadcrumbs = getBreadcrumbs(view);
  state.searchQuery = '';
  document.getElementById('searchInput').value = '';
  updateActiveNav(view);

  if (isFilesView(view)) {
    if (view === 'my-files') {
      await loadRootFolders();
    }
    await loadUserFiles();
    return;
  }

  if (view === 'user-management') {
    await loadAdminUsers();
  }
  if (view === 'all-files') {
    await loadAllFiles();
  }

  renderContent();
}

function updateActiveNav(viewId) {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.view === viewId);
  });
}

async function switchRole(role) {
  if (role === 'admin' && !isAdminUser()) {
    showToast('You do not have admin access', 'error');
    return;
  }
  state.role = role;
  const isAdmin = role === 'admin';
  const userInitial = (state.currentUser?.username || 'U').charAt(0).toUpperCase();

  document.getElementById('userRoleBtn').classList.toggle('active', !isAdmin);
  document.getElementById('adminRoleBtn').classList.toggle('active', isAdmin);
  document.getElementById('adminSection').classList.toggle('visible', isAdmin);
  document.getElementById('statusBar').classList.toggle('visible', isAdmin);

  document.getElementById('sidebarAvatar').textContent   = isAdmin ? 'A' : userInitial;
  document.getElementById('sidebarUserName').textContent = isAdmin ? 'Admin' : (state.currentUser?.username || 'User');
  document.getElementById('sidebarUserRole').textContent = isAdmin ? 'Root Access' : 'Standard User';
  document.getElementById('topbarAvatar').textContent    = isAdmin ? 'A' : userInitial;

  state.activeView  = isAdmin ? 'home' : 'my-files';
  state.breadcrumbs = getBreadcrumbs(state.activeView);
  updateActiveNav(state.activeView);

  if (isAdmin) {
    await loadAdminUsers();
    renderContent();
  } else {
    await loadRootFolders();
    await loadUserFiles();
  }
}

document.getElementById('mainNav').addEventListener('click', (e) => {
  const item = e.target.closest('.nav-item');
  if (!item) return;
  e.preventDefault();
  navigateTo(item.dataset.view);
});

document.getElementById('adminSection').addEventListener('click', (e) => {
  const item = e.target.closest('.nav-item');
  if (!item) return;
  e.preventDefault();
  navigateTo(item.dataset.view);
});

document.getElementById('userRoleBtn').addEventListener('click', () => switchRole('user'));
document.getElementById('adminRoleBtn').addEventListener('click', () => switchRole('admin'));

let searchTimeout;
document.getElementById('searchInput').addEventListener('input', (e) => {
  state.searchQuery = e.target.value.trim();
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (isFilesView(state.activeView)) {
      loadUserFiles();
    }
  }, 300);
});

document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.target.value = '';
    state.searchQuery = '';
    if (isFilesView(state.activeView)) loadUserFiles();
  }
});

document.getElementById('fileUploadInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  handleFileUpload(file);
  e.target.value = '';
});

document.getElementById('logoutBtn').addEventListener('click', logout);

// ---- Authentication ----

const authScreen  = document.getElementById('authScreen');
const appShell    = document.getElementById('appShell');
let authMode = 'login';

function showAuthMessage(text, type) {
  const el = document.getElementById('authMessage');
  el.textContent = text;
  el.className = `auth-message ${type}`;
  el.hidden = false;
}

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === 'register';
  document.getElementById('loginTab').classList.toggle('active', !isRegister);
  document.getElementById('registerTab').classList.toggle('active', isRegister);
  document.getElementById('authSubmit').textContent = isRegister ? 'Create Account' : 'Log In';
  document.getElementById('authMessage').hidden = true;
}

function showAuthScreen() {
  authScreen.hidden = false;
  appShell.hidden = true;
}

function isAdminUser() {
  return state.currentUser?.role === 'Admin';
}

function enterApp() {
  authScreen.hidden = true;
  appShell.hidden = false;
  document.getElementById('simulateRole').hidden = !isAdminUser();
  switchRole('user');
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;
  const submitBtn = document.getElementById('authSubmit');

  if (!username || !password) {
    showAuthMessage('Please fill in all fields.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Please wait…';

  try {
    const endpoint = authMode === 'register' ? '/users/register' : '/users/login';
    const data = await apiCall(endpoint, 'POST', { username, password });
    const user = { id: data.user.id, username: data.user.username, role: data.user.role };
    state.currentUser = user;
    localStorage.setItem('mycloudUser', JSON.stringify(user));
    enterApp();
  } catch (error) {
    // apiCall shows a toast; also surface inline
    showAuthMessage(error.message || 'Something went wrong.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = authMode === 'register' ? 'Create Account' : 'Log In';
  }
}

function logout() {
  localStorage.removeItem('mycloudUser');
  state.currentUser = null;
  state.userFiles = [];
  document.getElementById('authForm').reset();
  setAuthMode('login');
  showAuthScreen();
}

// ---- Share Functions ----
function openShareModal(file) {
  const shareOverlay = document.getElementById('shareModalOverlay');
  const shareForm = document.getElementById('shareForm');
  const fileNameDisplay = document.getElementById('shareFileName');
  const shareEmail = document.getElementById('shareEmail');
  const sharePasswordCheckbox = document.getElementById('sharePasswordCheckbox');
  const sharePasswordInput = document.getElementById('sharePasswordInput');
  const shareExpirationCheckbox = document.getElementById('shareExpirationCheckbox');
  const shareExpirationDays = document.getElementById('shareExpirationDays');

  fileNameDisplay.textContent = file.fileName;
  shareEmail.value = '';
  sharePasswordCheckbox.checked = false;
  sharePasswordInput.hidden = true;
  sharePasswordInput.value = '';
  shareExpirationCheckbox.checked = false;
  shareExpirationDays.hidden = true;

  shareOverlay.hidden = false;

  const passwordToggle = (e) => {
    sharePasswordInput.hidden = !sharePasswordCheckbox.checked;
    if (!sharePasswordCheckbox.checked) sharePasswordInput.value = '';
  };

  const expirationToggle = (e) => {
    shareExpirationDays.hidden = !shareExpirationCheckbox.checked;
  };

  sharePasswordCheckbox.removeEventListener('change', passwordToggle);
  shareExpirationCheckbox.removeEventListener('change', expirationToggle);
  sharePasswordCheckbox.addEventListener('change', passwordToggle);
  shareExpirationCheckbox.addEventListener('change', expirationToggle);

  shareForm.onsubmit = async (e) => {
    e.preventDefault();
    const recipientEmail = shareEmail.value.trim();
    const password = sharePasswordCheckbox.checked ? sharePasswordInput.value : null;
    const expirationDays = shareExpirationCheckbox.checked ? shareExpirationDays.value : null;

    if (!recipientEmail) {
      showToast('Please enter a recipient email', 'error');
      return;
    }

    if (sharePasswordCheckbox.checked && !password) {
      showToast('Please enter a password', 'error');
      return;
    }

    try {
      const response = await apiCall(`/files/${file._id}/share`, 'POST', {
        recipientEmail,
        password: password || undefined,
        expirationDays: expirationDays || undefined,
        senderName: state.currentUser?.username || 'Someone'
      });

      showToast(`File shared! Email sent to ${recipientEmail}`, 'success');
      closeShareModal();
    } catch (error) {
      showToast(error.message || 'Failed to share file', 'error');
    }
  };
}

function closeShareModal() {
  const shareOverlay = document.getElementById('shareModalOverlay');
  shareOverlay.hidden = true;
  document.getElementById('shareForm').reset();
}

// ---- Folder Management Functions ----
async function loadUserFolders() {
  try {
    const res = await apiCall(`/folders?userId=${state.currentUser.id}`);
    if (res.success) {
      state.userFolders = res.folders || [];
    }
  } catch (err) {
    console.error('Error loading folders:', err);
  }
}

async function loadRootFolders() {
  try {
    await loadUserFolders();
    state.currentFolderFolders = state.userFolders.filter(f => !f.parentFolderId);
  } catch (err) {
    console.error('Error loading root folders:', err);
  }
}

async function loadFolderContents(folderId) {
  // Root has no folder document — there is no /folders/root route.
  // Fall back to the dedicated root loaders instead of a broken request.
  if (!folderId) {
    state.currentFolderId = null;
    state.folderBreadcrumb = [];
    await loadRootFolders();
    await loadUserFiles();
    return;
  }

  // Show the loading spinner immediately so opening a folder feels responsive
  // instead of freezing on the previous view until the request returns.
  state.filesLoading = true;
  state.currentFolderId = folderId;
  renderContent();

  try {
    const res = await apiCall(`/folders/${folderId}?userId=${state.currentUser.id}`);
    if (res.success) {
      state.userFiles = res.files || [];
      state.currentFolderFolders = res.subfolders || [];
      // Backend doesn't return a full path; show at least the current folder name.
      state.folderBreadcrumb = res.breadcrumb
        || (res.folder ? [{ id: res.folder._id, name: res.folder.folderName }] : []);
    }
  } catch (err) {
    console.error('Error loading folder contents:', err);
  } finally {
    // Clear the loading flag BEFORE rendering, otherwise renderContent draws the
    // spinner again instead of the folder's files. Apply the folder breadcrumb
    // after renderContent so it isn't overwritten by the static breadcrumb.
    state.filesLoading = false;
    renderContent();
    updateFolderBreadcrumb();
  }
}

async function navigateToFolder(folderId) {
  await loadFolderContents(folderId);
}

// Refresh whatever the user is currently looking at — root or inside a folder.
// Avoids calling loadFolderContents(null), which hits a non-existent /folders/root route.
async function refreshCurrentView() {
  if (state.currentFolderId) {
    await loadFolderContents(state.currentFolderId);
  } else {
    await loadRootFolders();
    await loadUserFiles();
  }
}

async function goBack() {
  if (state.folderBreadcrumb && state.folderBreadcrumb.length > 0) {
    // Go back to parent folder
    const parentFolder = state.folderBreadcrumb[state.folderBreadcrumb.length - 1];
    await navigateToFolder(parentFolder.id);
  } else {
    // Go back to root
    await navigateToFolder(null);
  }
}

function updateFolderBreadcrumb() {
  const breadcrumbEl = document.querySelector('.breadcrumb');
  if (!breadcrumbEl) return;

  let html = '<span class="breadcrumb-link" onclick="navigateToFolder(null)">Home</span><span class="breadcrumb-sep"›</span>';

  if (state.folderBreadcrumb && state.folderBreadcrumb.length > 0) {
    state.folderBreadcrumb.forEach((item, idx) => {
      html += `<span class="breadcrumb-link" onclick="navigateToFolder('${item.id}')">${item.name}</span>`;
      if (idx < state.folderBreadcrumb.length - 1) html += '<span class="breadcrumb-sep">›</span>';
    });
  } else {
    html += '<span class="breadcrumb-current">My Files</span>';
  }

  breadcrumbEl.innerHTML = html;
}

async function createNewFolder(folderName, parentFolderId) {
  try {
    const res = await apiCall('/folders', 'POST', {
      userId: state.currentUser.id,
      folderName,
      parentFolderId: parentFolderId || null
    });

    if (res.success) {
      showToast('Folder created successfully!', 'success');
      closeFolderModal();
      await refreshCurrentView();
    } else {
      showToast(res.message || 'Failed to create folder', 'error');
    }
  } catch (err) {
    showToast('Error creating folder: ' + err.message, 'error');
  }
}

async function renameFolder(folderId, newName) {
  try {
    const res = await apiCall(`/folders/${folderId}?userId=${state.currentUser.id}`, 'PATCH', {
      folderName: newName
    });

    if (res.success) {
      showToast('Folder renamed successfully!', 'success');
      closeFolderModal();
      await refreshCurrentView();
    } else {
      showToast(res.message || 'Failed to rename folder', 'error');
    }
  } catch (err) {
    showToast('Error renaming folder: ' + err.message, 'error');
  }
}

async function deleteFolder(folder) {
  // Accept either a folder object (preferred) or a bare id for backward compatibility.
  const folderId = (folder && typeof folder === 'object') ? folder._id : folder;
  const folderName = (folder && typeof folder === 'object') ? folder.folderName : 'this folder';
  const itemCount = (folder && typeof folder === 'object' && folder.itemCount) || 0;

  const message = itemCount > 0
    ? `Deleting <strong>${folderName}</strong> will permanently delete the <strong>${itemCount} item${itemCount === 1 ? '' : 's'}</strong> inside it (files and subfolders). This cannot be undone.`
    : `Delete the empty folder <strong>${folderName}</strong>? This cannot be undone.`;

  showConfirmModal({
    title: 'Delete Folder',
    message,
    confirmText: itemCount > 0 ? `Delete folder + ${itemCount} item${itemCount === 1 ? '' : 's'}` : 'Delete folder',
    danger: true,
    onConfirm: async () => {
      try {
        const res = await apiCall(`/folders/${folderId}?userId=${state.currentUser.id}`, 'DELETE');
        closeAppModal();
        if (res.success) {
          showToast('Folder deleted', 'success');
          await refreshCurrentView();
        }
      } catch (err) {
        closeAppModal();
      }
    }
  });
}

async function moveFileToFolder(fileId, targetFolderId) {
  try {
    const res = await apiCall(`/files/${fileId}/move`, 'POST', {
      userId: state.currentUser.id,
      folderId: targetFolderId || null
    });

    if (res.success) {
      const dest = targetFolderId
        ? (state.userFolders.find(f => f._id === targetFolderId)?.folderName || 'folder')
        : 'Root';
      showToast(`File moved to ${dest}`, 'success');
      closeMoveModal();
      // Refresh so the source view drops the file AND folder item counts update.
      await refreshCurrentView();
    } else {
      showToast(res.message || 'Failed to move file', 'error');
    }
  } catch (err) {
    showToast('Error moving file: ' + err.message, 'error');
  }
}

function openFolderModal(type, folderData = null) {
  const modal = document.getElementById('folderModal');
  const modalTitle = document.getElementById('folderModalTitle');
  const folderNameInput = document.getElementById('folderNameInput');
  const submitBtn = document.getElementById('folderModalSubmit');

  folderNameInput.value = '';

  if (type === 'create') {
    modalTitle.textContent = 'Create New Folder';
    submitBtn.textContent = 'Create';
    submitBtn.onclick = () => {
      const name = folderNameInput.value.trim();
      if (name) createNewFolder(name, state.currentFolderId);
    };
  } else if (type === 'rename' && folderData) {
    modalTitle.textContent = 'Rename Folder';
    folderNameInput.value = folderData.folderName;
    submitBtn.textContent = 'Rename';
    submitBtn.onclick = () => {
      const name = folderNameInput.value.trim();
      if (name) renameFolder(folderData._id, name);
    };
  }

  modal.hidden = false;
}

function closeFolderModal() {
  const modal = document.getElementById('folderModal');
  if (modal) modal.hidden = true;
}

function openMoveModal(file) {
  const modal = document.getElementById('moveModal');
  const modalTitle = document.getElementById('moveModalTitle');
  const folderList = document.getElementById('moveModalFolders');
  const fileNameDisplay = document.getElementById('moveFileName');

  fileNameDisplay.textContent = file.fileName;
  modalTitle.textContent = `Move "${file.fileName}"`;

  // Clear previous options
  folderList.innerHTML = '';

  // Add "Root" option
  const rootOption = document.createElement('div');
  rootOption.className = 'folder-option';
  rootOption.textContent = '📁 Root';
  rootOption.addEventListener('click', async () => {
    await moveFileToFolder(file._id, null);
    closeMoveModal();
  });
  folderList.appendChild(rootOption);

  // Add current folders
  if (state.userFolders && state.userFolders.length > 0) {
    state.userFolders.forEach(folder => {
      const option = document.createElement('div');
      option.className = 'folder-option';
      option.textContent = `📁 ${folder.folderName}`;
      option.addEventListener('click', async () => {
        await moveFileToFolder(file._id, folder._id);
        closeMoveModal();
      });
      folderList.appendChild(option);
    });
  }

  modal.hidden = false;
}

function closeMoveModal() {
  const modal = document.getElementById('moveModal');
  if (modal) modal.hidden = true;
}

document.getElementById('loginTab').addEventListener('click', () => setAuthMode('login'));
document.getElementById('registerTab').addEventListener('click', () => setAuthMode('register'));
document.getElementById('authForm').addEventListener('submit', handleAuthSubmit);

document.getElementById('shareModalClose').addEventListener('click', closeShareModal);
document.getElementById('shareCancel').addEventListener('click', closeShareModal);
document.getElementById('shareModalOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'shareModalOverlay') closeShareModal();
});

// ---- Init: restore session or show login ----
(async () => {
  const saved = localStorage.getItem('mycloudUser');
  if (saved) {
    try {
      state.currentUser = JSON.parse(saved);
      enterApp();
      return;
    } catch (e) {
      localStorage.removeItem('mycloudUser');
    }
  }
  showAuthScreen();
})();
