// ============================================================
// popup.js — Filtros de distração + Adblock (Etapa 07)
// ============================================================

const filterIds = ['hideShorts', 'hideComments', 'hideRecommended', 'hideEndscreen'];

// --- 1. Carregar preferências de filtros ---
chrome.storage.sync.get(['settings'], (res) => {
  const s = res.settings || {};
  filterIds.forEach((id) => {
    document.getElementById(id).checked = !!s[id];
  });
});

// --- 2. Salvar preferências de filtros ---
filterIds.forEach((id) => {
  document.getElementById(id).addEventListener('change', () => {
    chrome.storage.sync.get(['settings'], (res) => {
      const s = res.settings || {};
      s[id] = document.getElementById(id).checked;
      chrome.storage.sync.set({ settings: s });
    });
  });
});

// --- 3. Lógica do Adblock (Etapa 07) ---
const adblockCheckbox = document.getElementById('adblockEnabled');

// Carrega o estado salvo (padrão: ligado)
chrome.storage.sync.get(['adblockEnabled'], (res) => {
  const enabled = res.adblockEnabled !== false; // se for undefined, assume true
  adblockCheckbox.checked = enabled;
  updateAdblockRules(enabled);
});

// Escuta o clique no toggle
adblockCheckbox.addEventListener('change', () => {
  const enabled = adblockCheckbox.checked;
  chrome.storage.sync.set({ adblockEnabled: enabled });
  updateAdblockRules(enabled);
});

// Função que liga/desliga a regra estática no Chrome
function updateAdblockRules(enabled) {
  if (enabled) {
    chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: ['youtube_ads']
    });
  } else {
    chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: ['youtube_ads']
    });
  }
}