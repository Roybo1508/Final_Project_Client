const API_BASE_URL = 'https://final-project-server-rdim.onrender.com/api';

const state = {
  role:       'user',
  activeView: 'my-files',
  viewMode:   'grid',
  breadcrumbs: ['Home', 'My Files'],
  adminUsers: [],
  allFiles: [],
  isLoading: false,
};

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
    console.error('API Error:', error);
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
      email: user.email,
      role: 'Standard User',
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

const VIEW_TITLES = {
  'home':             'My Files',
  'my-files':         'My Files',
  'photos':           'Photos',
  'shared':           'Shared with Me',
  'recent':           'Recent',
  'settings':         'Settings',
  'server-dashboard': 'Server Dashboard',
  'user-management':  'User Management',
  'all-files':        'All Files',
  'storage-backup':   'Storage & Backup',
  'security-logs':    'Security & Logs',
  'work-projects':    'Work Projects',
};

const SEARCH_PLACEHOLDERS = {
  'photos':   'Search in Photos...',
  'shared':   'Search in Shared...',
  'recent':   'Search in Recent...',
  'settings': 'Search in Settings...',
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
    'photos':           ['Home', 'My Files', 'Photos'],
    'work-projects':    ['Home', 'My Files', 'Work Projects'],
    'design-assets':    ['Home', 'Shared with Me', 'Design Assets'],
    'shared':           ['Home', 'Shared with Me'],
    'recent':           ['Home', 'Recent'],
    'settings':         ['Home', 'Settings'],
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
  const map = { 'Home': 'home', 'My Files': 'my-files', 'Shared with Me': 'shared', 'Recent': 'recent' };
  return map[crumbText] || 'home';
}

function isFilesView(view) {
  return ['home', 'my-files', 'shared', 'recent', 'photos', 'work-projects', 'design-assets'].includes(view);
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
      <button class="btn-upload" id="uploadBtn" aria-label="Upload files">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
        </svg>
        Upload
      </button>
      <button class="btn-new-folder" id="newFolderBtn" aria-label="Create new folder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
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

  if (activeView === 'photos') {
    container.appendChild(renderPhotoGrid());
  } else {
    const grid = renderFileGrid(activeView, isAdmin, searchQuery);
    if (viewMode === 'list') grid.classList.add('list-view');
    container.appendChild(grid);
  }

  document.getElementById('uploadBtn').addEventListener('click', () => {
    showToast('Upload feature coming soon', 'info');
  });

  document.getElementById('newFolderBtn').addEventListener('click', () => {
    showToast('New folder created', 'success');
  });

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
  updateActiveNav(view);

  // Load admin data if needed
  if (view === 'user-management' && state.adminUsers.length === 0) {
    await loadAdminUsers();
  }
  if (view === 'all-files' && state.allFiles.length === 0) {
    await loadAllFiles();
  }

  renderContent();
}

function navigateToFolder(folder) {
  state.activeView  = folder.id;
  state.breadcrumbs = getBreadcrumbs(folder.id);
  updateActiveNav('my-files');
  renderContent();
}

function updateActiveNav(viewId) {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.view === viewId);
  });
}

async function switchRole(role) {
  state.role = role;
  const isAdmin = role === 'admin';

  document.getElementById('userRoleBtn').classList.toggle('active', !isAdmin);
  document.getElementById('adminRoleBtn').classList.toggle('active', isAdmin);
  document.getElementById('adminSection').classList.toggle('visible', isAdmin);
  document.getElementById('statusBar').classList.toggle('visible', isAdmin);

  document.getElementById('sidebarAvatar').textContent   = isAdmin ? 'A' : 'D';
  document.getElementById('sidebarUserName').textContent = isAdmin ? 'Admin' : 'David';
  document.getElementById('sidebarUserRole').textContent = isAdmin ? 'Root Access' : 'Standard User';
  document.getElementById('topbarAvatar').textContent    = isAdmin ? 'A' : 'D';

  // Load admin data when switching to admin mode
  if (isAdmin) {
    await loadAdminUsers();
  }

  state.activeView  = isAdmin ? 'home' : 'my-files';
  state.breadcrumbs = getBreadcrumbs(state.activeView);
  updateActiveNav(state.activeView);
  renderContent();
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

document.getElementById('topbarAvatar').addEventListener('click', () => {
  showToast('Profile settings coming soon', 'info');
});

document.getElementById('sidebarAvatar').addEventListener('click', () => {
  showToast('Profile settings coming soon', 'info');
});

let searchTimeout;
document.getElementById('searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    renderContent(e.target.value);
  }, 250);
});

document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.target.value = '';
    renderContent();
  }
});

// Initialize the app and load initial content
(async () => {
  renderContent();
})();
