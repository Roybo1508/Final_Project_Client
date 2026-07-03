const appModalOverlay = document.getElementById('authModalOverlay');

function closeAppModal() {
  appModalOverlay.classList.remove('open');
}

appModalOverlay.addEventListener('click', (e) => {
  if (e.target === appModalOverlay) closeAppModal();
});

function showConfirmModal({ title, message, confirmText = 'Confirm', danger = false, onConfirm }) {
  const modal = appModalOverlay.querySelector('.modal');
  const closeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  modal.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">${title}</h3>
      <button class="modal-close" id="confirmModalClose" aria-label="Close modal">${closeIcon}</button>
    </div>
    <div class="modal-body">
      <p class="modal-message">${message}</p>
    </div>
    <div class="modal-footer-row">
      <button class="btn-cancel" id="confirmModalCancel">Cancel</button>
      <button class="${danger ? 'btn-danger' : 'btn-done'}" id="confirmModalConfirm">${confirmText}</button>
    </div>
  `;

  modal.querySelector('#confirmModalClose').addEventListener('click', closeAppModal);
  modal.querySelector('#confirmModalCancel').addEventListener('click', closeAppModal);
  modal.querySelector('#confirmModalConfirm').addEventListener('click', () => onConfirm());

  appModalOverlay.classList.add('open');
}
