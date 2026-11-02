// ============================================================
// popup.js — Carrega e salva os filtros de distração
// ============================================================

const ids = ['hideShorts', 'hideComments', 'hideRecommended', 'hideEndscreen'];

// 1) Ao abrir o popup, marca os checkboxes com o que está salvo
chrome.storage.sync.get(['settings'], (res) => {
  const s = res.settings || {};
  ids.forEach((id) => {
    document.getElementById(id).checked = !!s[id];
  });
});

// 2) Ao marcar/desmarcar, salva no chrome.storage.sync
//    O content.js escuta essa mudança e aplica na hora
ids.forEach((id) => {
  document.getElementById(id).addEventListener('change', () => {
    chrome.storage.sync.get(['settings'], (res) => {
      const s = res.settings || {};
      s[id] = document.getElementById(id).checked;
      chrome.storage.sync.set({ settings: s });
    });
  });
});