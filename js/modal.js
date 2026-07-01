const MODAL_USERS = [
  { initial: 'A', name: 'Alex',  colorClass: 'color-indigo' },
  { initial: 'R', name: 'Roee',  colorClass: 'color-blue'   },
  { initial: 'V', name: 'Vova',  colorClass: 'color-violet' },
  { initial: 'M', name: 'Mom',   colorClass: 'color-pink'   },
];

const authModalOverlay = document.getElementById('authModalOverlay');
const modalUserList    = document.getElementById('modalUserList');
const modalFolderChip  = document.getElementById('modalFolderChip');

function renderAuthModal(folderName) {
  modalFolderChip.textContent = folderName;
  modalUserList.innerHTML = '';

  MODAL_USERS.forEach((user) => {
    const li = document.createElement('li');
    li.className = 'modal-user-row';

    const avatar = document.createElement('div');
    avatar.className = `modal-user-avatar ${user.colorClass}`;
    avatar.textContent = user.initial;
    avatar.setAttribute('aria-hidden', 'true');

    const nameEl = document.createElement('span');
    nameEl.className = 'modal-user-name';
    nameEl.textContent = user.name;

    const label = document.createElement('label');
    label.className = 'toggle-switch';
    label.setAttribute('aria-label', `Grant access to ${user.name}`);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';

    const slider = document.createElement('span');
    slider.className = 'toggle-slider';

    label.appendChild(checkbox);
    label.appendChild(slider);

    li.appendChild(avatar);
    li.appendChild(nameEl);
    li.appendChild(label);
    modalUserList.appendChild(li);
  });

  authModalOverlay.classList.add('open');
}

function closeAuthModal() {
  authModalOverlay.classList.remove('open');
}

document.getElementById('modalClose').addEventListener('click', closeAuthModal);

authModalOverlay.addEventListener('click', (e) => {
  if (e.target === authModalOverlay) closeAuthModal();
});

document.getElementById('modalDone').addEventListener('click', () => {
  closeAuthModal();
  showToast('Access permissions updated', 'success');
});
