window.FFCV_P_setupFileMenu = function setupFileMenu(options) {
  const {
    menuRoot,
    button,
    dropdown,
    folderInput,
    filesInput,
    onOpenDropdown,
    onCloseDropdown
  } = options;

  let open = false;

  function _setOpen(next) {
    open = next;
    dropdown.hidden = !open;
    if (open) onOpenDropdown();
    else onCloseDropdown();
  }

  function _toggle() {
    _setOpen(!open);
  }

  button.addEventListener('click', (e) => {
    e.preventDefault();
    _toggle();
  });

  document.addEventListener('click', (e) => {
    if (!open) return;
    if (!(e.target instanceof Node)) return;
    if (menuRoot.contains(e.target)) return;
    _setOpen(false);
  });

  dropdown.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute('data-action');
    if (!action) return;
    if (action === 'open-folder') folderInput.click();
    if (action === 'open-files') filesInput.click();
    _setOpen(false);
  });

  window.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') {
      _setOpen(false);
      e.preventDefault();
    }
  });

  _setOpen(false);
};
