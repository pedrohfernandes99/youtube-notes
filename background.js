// background.js — Registra o script no "main world" (Etapa 09)
chrome.runtime.onInstalled.addListener(async () => {
    const scripts = [{
      id: 'main-world-interceptor',
      js: ['inject.js'], // O arquivo que vamos criar/modificar
      matches: ['https://www.youtube.com/*'],
      runAt: 'document_start',
      world: 'MAIN', // Executa no contexto da página, antes do código do YouTube
      allFrames: true
    }];
  
    const ids = scripts.map(s => s.id);
  
    // Remove registro antigo (se existir) para evitar erros
    await chrome.scripting.unregisterContentScripts({ ids }).catch(() => {});
  
    // Registra o novo script
    await chrome.scripting.registerContentScripts(scripts).catch((err) => {
      console.error('Falha ao registrar script no main world:', err);
    });
  });