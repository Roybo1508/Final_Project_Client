const ROLE_OPTIONS = ['Standard User', 'Admin', 'Moderator', 'Viewer'];

const AVATAR_COLORS = {
  'D': 'color-purple', 'd': 'color-purple',
  'A': 'color-indigo', 'a': 'color-indigo',
  'R': 'color-blue',   'r': 'color-blue',
  'V': 'color-violet', 'v': 'color-violet',
  'M': 'color-pink',   'm': 'color-pink',
};

function getColorForInitial(initial) {
  const code = initial.charCodeAt(0);
  const colors = ['color-purple', 'color-indigo', 'color-blue', 'color-violet', 'color-pink'];
  return colors[code % colors.length];
}

function generateInitial(name) {
  return name?.charAt(0).toUpperCase() || '?';
}

function validateUserForm(data) {
  const errors = [];
  const name = data.name || data.username;
  if (!name?.trim()) errors.push('Name is required');
  if (!data.email?.trim()) errors.push('Email is required');
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Invalid email format');
  return { valid: errors.length === 0, errors };
}

function createFormGroup(label, inputType, name, value = '', options = []) {
  const group = document.createElement('div');
  group.className = 'form-group';

  const labelEl = document.createElement('label');
  labelEl.className = 'form-label';
  labelEl.textContent = label;

  let inputEl;
  if (inputType === 'select') {
    inputEl = document.createElement('select');
    inputEl.name = name;
    inputEl.className = 'form-input';
    options.forEach((opt) => {
      const optEl = document.createElement('option');
      optEl.value = opt;
      optEl.textContent = opt;
      optEl.selected = opt === value;
      inputEl.appendChild(optEl);
    });
  } else if (inputType === 'readonly') {
    inputEl = document.createElement('div');
    inputEl.className = 'form-readonly';
    inputEl.textContent = value;
  } else {
    inputEl = document.createElement('input');
    inputEl.type = inputType;
    inputEl.name = name;
    inputEl.className = 'form-input';
    inputEl.value = value;
    inputEl.placeholder = label;
  }

  group.appendChild(labelEl);
  group.appendChild(inputEl);
  return group;
}

function displayFormErrors(modal, errors) {
  const existing = modal.querySelector('.form-errors');
  if (existing) existing.remove();

  if (errors.length > 0) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-errors';
    const errorList = document.createElement('ul');
    errors.forEach((err) => {
      const li = document.createElement('li');
      li.textContent = err;
      errorList.appendChild(li);
    });
    errorDiv.appendChild(errorList);
    const modalHeader = modal.querySelector('.modal-header');
    modalHeader.parentNode.insertBefore(errorDiv, modalHeader.nextSibling);
  }
}

function closeUserModal() {
  const overlay = document.getElementById('authModalOverlay');
  overlay.classList.remove('open');
  setTimeout(() => {
    const modal = overlay.querySelector('.modal');
    modal.innerHTML = '';
  }, 200);
}

function renderAddUserModal() {
  const overlay = document.getElementById('authModalOverlay');
  const modal = overlay.querySelector('.modal');

  modal.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">Add New User</h3>
      <button class="modal-close" id="addUserClose" aria-label="Close modal">
        ${makeSvg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>')}
      </button>
    </div>
    <div class="modal-body"></div>
    <div class="modal-footer-row">
      <button class="btn-cancel" id="addUserCancel">Cancel</button>
      <button class="btn-primary" id="addUserCreate">Create User</button>
    </div>
  `;

  const body = modal.querySelector('.modal-body');
  const formGroup1 = createFormGroup('Name', 'text', 'name', '');
  const formGroup2 = createFormGroup('Email', 'email', 'email', '');
  const formGroup3 = createFormGroup('Role', 'select', 'role', 'Standard User', ROLE_OPTIONS);

  const previewDiv = document.createElement('div');
  previewDiv.style.marginTop = '12px';
  previewDiv.className = 'avatar-preview-row';
  previewDiv.innerHTML = '<span>Avatar:</span><div class="avatar-preview" id="avatarPreview"></div>';

  body.appendChild(formGroup1);
  body.appendChild(formGroup2);
  body.appendChild(formGroup3);
  body.appendChild(previewDiv);

  const nameInput = formGroup1.querySelector('input');
  const emailInput = formGroup2.querySelector('input');
  const roleSelect = formGroup3.querySelector('select');
  const avatarPreview = document.getElementById('avatarPreview');

  const updateAvatar = () => {
    const initial = generateInitial(nameInput.value);
    const color = getColorForInitial(initial);
    avatarPreview.innerHTML = `<div class="user-row-avatar ${color}">${initial}</div>`;
  };

  nameInput.addEventListener('input', updateAvatar);
  updateAvatar();

  document.getElementById('addUserClose').addEventListener('click', closeUserModal);
  document.getElementById('addUserCancel').addEventListener('click', closeUserModal);

  document.getElementById('addUserCreate').addEventListener('click', async () => {
    const newUser = {
      username: nameInput.value.trim(),
      email: emailInput.value.trim(),
      password: 'TempPassword123!' // Temporary default password
    };

    const { valid, errors } = validateUserForm(newUser);
    if (!valid) {
      displayFormErrors(modal, errors);
      return;
    }

    try {
      await apiCall('/users/register', 'POST', newUser);
      closeUserModal();
      await loadAdminUsers();
      renderContent();
      showToast('User added successfully', 'success');
    } catch (error) {
      displayFormErrors(modal, [error.message]);
    }
  });

  overlay.classList.add('open');
}

function renderEditUserModal(userIndex) {
  const user = state.adminUsers[userIndex];
  const overlay = document.getElementById('authModalOverlay');
  const modal = overlay.querySelector('.modal');

  modal.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">Edit User</h3>
      <button class="modal-close" id="editUserClose" aria-label="Close modal">
        ${makeSvg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>')}
      </button>
    </div>
    <div class="modal-body"></div>
    <div class="modal-footer-row">
      <button class="btn-cancel" id="editUserCancel">Cancel</button>
      <button class="btn-primary" id="editUserSave">Save Changes</button>
    </div>
  `;

  const body = modal.querySelector('.modal-body');
  const formGroup1 = createFormGroup('Name', 'text', 'name', user.name);
  const formGroup2 = createFormGroup('Email', 'email', 'email', user.email);
  const formGroup3 = createFormGroup('Role', 'select', 'role', user.role, ROLE_OPTIONS);
  const formGroup4 = createFormGroup('Storage Used', 'readonly', 'storage', user.storage);

  const previewDiv = document.createElement('div');
  previewDiv.style.marginTop = '12px';
  previewDiv.className = 'avatar-preview-row';
  previewDiv.innerHTML = '<span>Avatar:</span><div class="avatar-preview" id="avatarPreview"></div>';

  body.appendChild(formGroup1);
  body.appendChild(formGroup2);
  body.appendChild(formGroup3);
  body.appendChild(formGroup4);
  body.appendChild(previewDiv);

  const nameInput = formGroup1.querySelector('input');
  const emailInput = formGroup2.querySelector('input');
  const roleSelect = formGroup3.querySelector('select');
  const avatarPreview = document.getElementById('avatarPreview');

  const updateAvatar = () => {
    const initial = generateInitial(nameInput.value);
    const color = getColorForInitial(initial);
    avatarPreview.innerHTML = `<div class="user-row-avatar ${color}">${initial}</div>`;
  };

  nameInput.addEventListener('input', updateAvatar);
  updateAvatar();

  document.getElementById('editUserClose').addEventListener('click', closeUserModal);
  document.getElementById('editUserCancel').addEventListener('click', closeUserModal);

  document.getElementById('editUserSave').addEventListener('click', async () => {
    const updatedUser = {
      username: nameInput.value.trim(),
      email: emailInput.value.trim(),
    };

    const { valid, errors } = validateUserForm(updatedUser);
    if (!valid) {
      displayFormErrors(modal, errors);
      return;
    }

    try {
      const userId = state.adminUsers[userIndex]._id;
      await apiCall(`/users/${userId}`, 'PUT', updatedUser);
      closeUserModal();
      await loadAdminUsers();
      renderContent();
      showToast('User updated successfully', 'success');
    } catch (error) {
      displayFormErrors(modal, [error.message]);
    }
  });

  overlay.classList.add('open');
}

function renderDeleteConfirmModal(userIndex) {
  const user = state.adminUsers[userIndex];
  const overlay = document.getElementById('authModalOverlay');
  const modal = overlay.querySelector('.modal');

  modal.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">Delete User</h3>
      <button class="modal-close" id="deleteUserClose" aria-label="Close modal">
        ${makeSvg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>')}
      </button>
    </div>
    <div class="modal-body">
      <p style="color: var(--text-primary); margin-bottom: 12px;">Are you sure you want to delete <strong>${user.name}</strong>?</p>
      <p style="color: var(--text-muted); font-size: 11px;">This action cannot be undone.</p>
    </div>
    <div class="modal-footer-row">
      <button class="btn-cancel" id="deleteUserCancel">Cancel</button>
      <button class="btn-danger" id="deleteUserConfirm">Delete User</button>
    </div>
  `;

  document.getElementById('deleteUserClose').addEventListener('click', closeUserModal);
  document.getElementById('deleteUserCancel').addEventListener('click', closeUserModal);

  document.getElementById('deleteUserConfirm').addEventListener('click', async () => {
    try {
      const userId = state.adminUsers[userIndex]._id;
      await apiCall(`/users/${userId}`, 'DELETE');
      closeUserModal();
      await loadAdminUsers();
      renderContent();
      showToast('User deleted successfully', 'success');
    } catch (error) {
      closeUserModal();
      showToast(error.message || 'Failed to delete user', 'error');
    }
  });

  overlay.classList.add('open');
}

const STORAGE_TYPES = [
  { label: 'Images',    used: '180 GB', percent: 40, typeClass: 'images'    },
  { label: 'Videos',    used: '120 GB', percent: 27, typeClass: 'videos'    },
  { label: 'Documents', used: '85 GB',  percent: 19, typeClass: 'documents' },
  { label: 'Audio',     used: '42 GB',  percent: 9,  typeClass: 'audio'     },
  { label: 'Other',     used: '23 GB',  percent: 5,  typeClass: 'other'     },
];

const ACTIVITY_LOG = [
  { type: 'success', text: 'User login: david@mycloud.com',              time: '2 min ago'   },
  { type: 'success', text: 'File upload: One Pager.docx (2.4 MB)',       time: '8 min ago'   },
  { type: 'warning', text: 'Failed login attempt from 192.168.1.42',     time: '47 min ago'  },
  { type: 'success', text: 'Storage backup completed',                   time: '1 hour ago'  },
  { type: 'success', text: 'New user registered: vova@example.com',      time: '3 hours ago' },
];

const SECURITY_EVENTS = [
  { type: 'success', text: 'Successful login: david@mycloud.com',          time: '2 min ago'   },
  { type: 'danger',  text: 'Failed login attempt: unknown@evil.com',       time: '47 min ago'  },
  { type: 'info',    text: 'New device detected: iPhone 14 (Vova K)',      time: '4 hours ago' },
  { type: 'success', text: 'Password changed: alex@example.com',           time: '2 hours ago' },
  { type: 'success', text: 'Two-factor auth enabled: roee@example.com',    time: '1 day ago'   },
];

function makeSvg(path, extra) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

const ICONS = {
  plus:       makeSvg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),
  edit:       makeSvg('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
  trash:      makeSvg('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>'),
  x:          makeSvg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
  check:      makeSvg('<polyline points="20 6 9 17 4 12"/>'),
  shield:     makeSvg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
  info:       makeSvg('<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'),
  alert:      makeSvg('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
  database:   makeSvg('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>'),
  refresh:    makeSvg('<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>'),
};

function renderServerDashboard() {
  const view = document.createElement('div');
  view.className = 'admin-view';

  const metricsGrid = document.createElement('div');
  metricsGrid.className = 'admin-metrics-grid';

  const metrics = [
    { label: 'Server Status', value: 'Online',  extra: 'status-dot online',  extraText: 'All systems normal' },
    { label: 'CPU Usage',     value: '42%',     extra: '',                    extraText: '4 cores active'      },
    { label: 'Memory',        value: '61%',     extra: '',                    extraText: '9.8 GB / 16 GB'      },
    { label: 'Uptime',        value: '99.9%',   extra: '',                    extraText: '127 days'            },
    { label: 'Connections',   value: '24',      extra: '',                    extraText: 'Active now'          },
    { label: 'Req / min',     value: '142',     extra: '',                    extraText: 'Last 5 min avg'      },
  ];

  metrics.forEach((m) => {
    const card = document.createElement('div');
    card.className = 'admin-metric-card';

    const labelEl = document.createElement('span');
    labelEl.className = 'metric-label';
    labelEl.textContent = m.label;

    const valueEl = document.createElement('span');
    valueEl.className = m.label === 'Server Status' ? 'metric-value metric-online' : 'metric-value';
    valueEl.textContent = m.value;

    const row = document.createElement('div');
    row.className = 'metric-status-row';

    if (m.extra) {
      const dot = document.createElement('span');
      dot.className = `status-dot ${m.extra.split(' ')[1]}`;
      row.appendChild(dot);
    }

    const extraText = document.createElement('span');
    extraText.className = 'status-dot-text';
    extraText.textContent = m.extraText;
    row.appendChild(extraText);

    card.appendChild(labelEl);
    card.appendChild(valueEl);
    card.appendChild(row);
    metricsGrid.appendChild(card);
  });

  const activitySection = document.createElement('div');
  activitySection.className = 'admin-section';

  const header = document.createElement('div');
  header.className = 'admin-section-header';
  const title = document.createElement('h3');
  title.className = 'admin-section-title';
  title.textContent = 'Recent Activity';
  header.appendChild(title);
  activitySection.appendChild(header);

  const logList = document.createElement('ul');
  logList.className = 'activity-log';

  ACTIVITY_LOG.forEach((ev) => {
    const li = document.createElement('li');
    li.className = 'activity-item';

    const dot = document.createElement('span');
    dot.className = `activity-dot activity-dot-${ev.type}`;
    dot.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.className = 'activity-text';
    text.textContent = ev.text;

    const time = document.createElement('span');
    time.className = 'activity-time';
    time.textContent = ev.time;

    li.appendChild(dot);
    li.appendChild(text);
    li.appendChild(time);
    logList.appendChild(li);
  });

  activitySection.appendChild(logList);
  view.appendChild(metricsGrid);
  view.appendChild(activitySection);
  return view;
}

function renderUserManagement() {
  const view = document.createElement('div');
  view.className = 'admin-view';

  const sectionHeader = document.createElement('div');
  sectionHeader.className = 'admin-section-header';

  const title = document.createElement('h3');
  title.className = 'admin-section-title';
  title.textContent = `All Users (${state.adminUsers.length})`;

  const addBtn = document.createElement('button');
  addBtn.className = 'admin-section-action';
  addBtn.innerHTML = ICONS.plus + 'Add User';
  addBtn.addEventListener('click', () => renderAddUserModal());

  sectionHeader.appendChild(title);
  sectionHeader.appendChild(addBtn);

  const table = document.createElement('div');
  table.className = 'user-table';
  table.setAttribute('role', 'table');
  table.setAttribute('aria-label', 'User list');

  const tableHeader = document.createElement('div');
  tableHeader.className = 'user-table-header';
  tableHeader.setAttribute('role', 'row');
  tableHeader.innerHTML = `
    <span>User</span>
    <span class="col-role">Role</span>
    <span class="col-storage">Storage used</span>
    <span>Status</span>
    <span></span>
  `;
  table.appendChild(tableHeader);

  state.adminUsers.forEach((user, index) => {
    const row = document.createElement('div');
    row.className = 'user-row';
    row.setAttribute('role', 'row');

    const identity = document.createElement('div');
    identity.className = 'user-row-identity';

    const avatar = document.createElement('div');
    avatar.className = `user-row-avatar ${user.colorClass}`;
    avatar.textContent = user.initial;
    avatar.setAttribute('aria-hidden', 'true');

    const nameBlock = document.createElement('div');
    const nameEl = document.createElement('div');
    nameEl.className = 'user-row-name';
    nameEl.textContent = user.name;
    const emailEl = document.createElement('div');
    emailEl.className = 'user-row-email';
    emailEl.textContent = user.email;
    nameBlock.appendChild(nameEl);
    nameBlock.appendChild(emailEl);

    identity.appendChild(avatar);
    identity.appendChild(nameBlock);

    const roleCell = document.createElement('div');
    roleCell.className = 'user-row-cell col-role';
    roleCell.textContent = user.role;

    const storageCell = document.createElement('div');
    storageCell.className = 'user-row-cell col-storage';
    storageCell.textContent = user.storage;

    const statusBadge = document.createElement('div');
    statusBadge.className = `user-status-badge ${user.status}`;
    statusBadge.textContent = user.status === 'active' ? 'Active' : 'Away';

    const actions = document.createElement('div');
    actions.className = 'user-row-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'user-action-btn';
    editBtn.innerHTML = ICONS.edit;
    editBtn.setAttribute('aria-label', `Edit ${user.name}`);
    editBtn.addEventListener('click', () => renderEditUserModal(index));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'user-action-btn danger';
    deleteBtn.innerHTML = ICONS.trash;
    deleteBtn.setAttribute('aria-label', `Remove ${user.name}`);
    deleteBtn.addEventListener('click', () => renderDeleteConfirmModal(index));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    row.appendChild(identity);
    row.appendChild(roleCell);
    row.appendChild(storageCell);
    row.appendChild(statusBadge);
    row.appendChild(actions);
    table.appendChild(row);
  });

  view.appendChild(sectionHeader);
  view.appendChild(table);
  return view;
}

function renderStorageBackup() {
  const view = document.createElement('div');
  view.className = 'admin-view';

  const overviewCard = document.createElement('div');
  overviewCard.className = 'storage-overview-card';

  const overviewRow = document.createElement('div');
  overviewRow.className = 'storage-overview-row';
  const overviewTitle = document.createElement('span');
  overviewTitle.className = 'storage-overview-title';
  overviewTitle.textContent = 'Total Storage Used';
  const overviewText = document.createElement('span');
  overviewText.className = 'storage-overview-text';
  overviewText.textContent = '450 GB / 1 TB — 45%';
  overviewRow.appendChild(overviewTitle);
  overviewRow.appendChild(overviewText);

  const mainBar = document.createElement('div');
  mainBar.className = 'storage-main-bar';
  const mainFill = document.createElement('div');
  mainFill.className = 'storage-main-fill';
  mainFill.style.setProperty('--bar-w', '45%');
  mainBar.appendChild(mainFill);

  overviewCard.appendChild(overviewRow);
  overviewCard.appendChild(mainBar);

  const breakdownSection = document.createElement('div');
  breakdownSection.className = 'admin-section';
  const breakdownTitle = document.createElement('h3');
  breakdownTitle.className = 'admin-section-title';
  breakdownTitle.textContent = 'Breakdown by type';
  breakdownSection.appendChild(breakdownTitle);

  const breakdownList = document.createElement('div');
  breakdownList.className = 'storage-breakdown';

  STORAGE_TYPES.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'storage-breakdown-row';

    const dot = document.createElement('span');
    dot.className = `storage-type-dot ${item.typeClass}`;
    dot.setAttribute('aria-hidden', 'true');

    const name = document.createElement('span');
    name.className = 'storage-type-name';
    name.textContent = item.label;

    const bar = document.createElement('div');
    bar.className = 'storage-type-bar';
    const fill = document.createElement('div');
    fill.className = `storage-type-fill ${item.typeClass}`;
    fill.style.setProperty('--bar-w', `${item.percent}%`);
    bar.appendChild(fill);

    const meta = document.createElement('span');
    meta.className = 'storage-type-meta';
    meta.textContent = `${item.used} · ${item.percent}%`;

    row.appendChild(dot);
    row.appendChild(name);
    row.appendChild(bar);
    row.appendChild(meta);
    breakdownList.appendChild(row);
  });

  breakdownSection.appendChild(breakdownList);

  const backupSection = document.createElement('div');
  backupSection.className = 'admin-section';
  const backupTitle = document.createElement('h3');
  backupTitle.className = 'admin-section-title';
  backupTitle.textContent = 'Backup';
  backupSection.appendChild(backupTitle);

  const backupCard = document.createElement('div');
  backupCard.className = 'backup-card';

  const backupIcon = document.createElement('div');
  backupIcon.className = 'backup-icon';
  backupIcon.innerHTML = ICONS.database;

  const backupInfo = document.createElement('div');
  backupInfo.className = 'backup-info';
  const backupLabel = document.createElement('div');
  backupLabel.className = 'backup-label';
  backupLabel.textContent = 'Automatic backup';
  const backupTime = document.createElement('div');
  backupTime.className = 'backup-time';
  backupTime.textContent = 'Last run: Today at 03:00 AM · Next: Tomorrow 03:00 AM';
  backupInfo.appendChild(backupLabel);
  backupInfo.appendChild(backupTime);

  const backupStatus = document.createElement('div');
  backupStatus.className = 'backup-status';
  backupStatus.innerHTML = ICONS.check + ' Completed';

  const runBtn = document.createElement('button');
  runBtn.className = 'admin-section-action';
  runBtn.innerHTML = ICONS.refresh + 'Run now';
  runBtn.addEventListener('click', () => showToast('Backup started', 'success'));

  backupCard.appendChild(backupIcon);
  backupCard.appendChild(backupInfo);
  backupCard.appendChild(backupStatus);
  backupCard.appendChild(runBtn);
  backupSection.appendChild(backupCard);

  view.appendChild(overviewCard);
  view.appendChild(breakdownSection);
  view.appendChild(backupSection);
  return view;
}

function renderSecurityLogs() {
  const view = document.createElement('div');
  view.className = 'admin-view';

  const eventsSection = document.createElement('div');
  eventsSection.className = 'admin-section';
  const eventsTitle = document.createElement('h3');
  eventsTitle.className = 'admin-section-title';
  eventsTitle.textContent = 'Security Events';
  eventsSection.appendChild(eventsTitle);

  const eventsList = document.createElement('ul');
  eventsList.className = 'security-events-list';

  const EVENT_ICONS = {
    success: ICONS.check,
    danger:  ICONS.alert,
    info:    ICONS.info,
    warning: ICONS.alert,
  };

  SECURITY_EVENTS.forEach((ev) => {
    const li = document.createElement('li');
    li.className = 'security-event-row';

    const iconWrap = document.createElement('div');
    iconWrap.className = `security-event-icon ${ev.type}`;
    iconWrap.innerHTML = EVENT_ICONS[ev.type] || ICONS.info;

    const text = document.createElement('span');
    text.className = 'security-event-text';
    text.textContent = ev.text;

    const time = document.createElement('span');
    time.className = 'security-event-time';
    time.textContent = ev.time;

    li.appendChild(iconWrap);
    li.appendChild(text);
    li.appendChild(time);
    eventsList.appendChild(li);
  });

  eventsSection.appendChild(eventsList);
  view.appendChild(eventsSection);
  return view;
}
