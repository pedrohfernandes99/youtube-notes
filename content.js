// ============================================================
// YouTube Focus — Content Script (Etapa 03: painel + notas)
// ============================================================

// ---------- 1. Utilitários ----------
function getVideoId() {
    return new URL(window.location.href).searchParams.get('v');
  }
  
  function getVideo() {
    return document.querySelector('video');
  }
  
  function formatTime(totalSeconds) {
    const s = Math.floor(totalSeconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? h + ':' + pad(m) + ':' + pad(sec) : m + ':' + pad(sec);
  }
  
  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
  
  function seekTo(seconds) {
    const v = getVideo();
    if (v) {
      v.currentTime = seconds;
      v.play();
    }
  }
  
  // ---------- 2. Estado ----------
  let currentVideoId = null;
  let notesCache = [];
  
  // ---------- 3. Injetar botão + painel ----------
  function injectUI() {
    const btn = document.createElement('button');
    btn.id = 'yt-notes-btn';
    btn.textContent = '📝';
    btn.title = 'Abrir painel de notas';
    btn.addEventListener('click', togglePanel);
    document.body.appendChild(btn);
  
    const panel = document.createElement('div');
    panel.id = 'ytn-panel';
    panel.innerHTML =
      '<div class="ytn-header">' +
      '  <span>📝 Minhas Notas</span>' +
      '  <button id="ytn-close" title="Fechar">✖</button>' +
      '</div>' +
      '<div class="ytn-toolbar">' +
      '  <button id="ytn-add">＋ Nova nota</button>' +
      '  <button id="ytn-export">⬇ Exportar .md</button>' +
      '</div>' +
      '<div id="ytn-new-note" class="ytn-new-note" style="display:none">' +
      '  <span id="ytn-new-time">0:00</span>' +
      '  <textarea id="ytn-new-text" placeholder="O que aconteceu neste momento?"></textarea>' +
      '  <div class="ytn-new-actions">' +
      '    <button id="ytn-save-note">Salvar</button>' +
      '    <button id="ytn-cancel-note">Cancelar</button>' +
      '  </div>' +
      '</div>' +
      '<div id="ytn-notes-list"></div>';
    document.body.appendChild(panel);
  
    document.getElementById('ytn-close').addEventListener('click', togglePanel);
    document.getElementById('ytn-add').addEventListener('click', openNewNoteForm);
    document.getElementById('ytn-export').addEventListener('click', exportMarkdown);
    document.getElementById('ytn-save-note').addEventListener('click', saveNewNote);
    document.getElementById('ytn-cancel-note').addEventListener('click', closeNewNoteForm);
  }
  
  // ---------- 4. Painel: abrir/fechar ----------
  function togglePanel() {
    const p = document.getElementById('ytn-panel');
    const open = p.classList.toggle('ytn-open');
    document.body.classList.toggle('ytn-panel-open', open);
    if (open) loadNotes(currentVideoId);
  }
  
  // ---------- 5. Notas ----------
  function loadNotes(videoId) {
    if (!videoId) return;
    const key = 'notes_' + videoId;
    chrome.storage.local.get([key], (res) => {
      notesCache = res[key] || [];
      renderNotes(notesCache);
    });
  }
  
  function renderNotes(notes) {
    const list = document.getElementById('ytn-notes-list');
    list.innerHTML = '';
    if (!notes.length) {
      list.innerHTML = '<p class="ytn-empty">Nenhuma nota ainda. Clique em "＋ Nova nota".</p>';
      return;
    }
    notes.sort((a, b) => a.time - b.time);
    notes.forEach((n, i) => {
      const div = document.createElement('div');
      div.className = 'ytn-note';
      div.innerHTML =
        '<div class="ytn-note-head">' +
        '  <button class="ytn-jump" data-time="' + n.time + '">' + formatTime(n.time) + '</button>' +
        '  <button class="ytn-del" data-index="' + i + '" title="Apagar">🗑</button>' +
        '</div>' +
        '<p>' + escapeHtml(n.text) + '</p>';
      list.appendChild(div);
    });
    list.querySelectorAll('.ytn-jump').forEach((b) => {
      b.addEventListener('click', () => seekTo(parseFloat(b.dataset.time)));
    });
    list.querySelectorAll('.ytn-del').forEach((b) => {
      b.addEventListener('click', () => deleteNote(parseInt(b.dataset.index)));
    });
  }
  
  function openNewNoteForm() {
    const v = getVideo();
    if (!v) return;
    document.getElementById('ytn-new-time').textContent = formatTime(v.currentTime);
    document.getElementById('ytn-new-text').value = '';
    document.getElementById('ytn-new-note').style.display = 'block';
    document.getElementById('ytn-new-text').focus();
  }
  
  function closeNewNoteForm() {
    document.getElementById('ytn-new-note').style.display = 'none';
  }
  
  function saveNewNote() {
    const text = document.getElementById('ytn-new-text').value.trim();
    if (!text || !currentVideoId) return;
    const v = getVideo();
    const note = { time: v ? v.currentTime : 0, text: text, createdAt: Date.now() };
    const key = 'notes_' + currentVideoId;
    chrome.storage.local.get([key], (res) => {
      const notes = res[key] || [];
      notes.push(note);
      chrome.storage.local.set({ [key]: notes }, () => {
        notesCache = notes;
        renderNotes(notes);
        closeNewNoteForm();
      });
    });
  }
  
  function deleteNote(index) {
    if (!currentVideoId) return;
    const key = 'notes_' + currentVideoId;
    chrome.storage.local.get([key], (res) => {
      const notes = res[key] || [];
      notes.splice(index, 1);
      chrome.storage.local.set({ [key]: notes }, () => {
        notesCache = notes;
        renderNotes(notes);
      });
    });
  }
  
  // ---------- 6. Exportar Markdown ----------
  function exportMarkdown() {
    if (!notesCache.length) {
      alert('Não há notas para exportar.');
      return;
    }
    const title = document.title.replace(' - YouTube', '').trim();
    let md = '# Notas: ' + title + '\n\n' + window.location.href + '\n\n';
    notesCache.slice().sort((a, b) => a.time - b.time).forEach((n) => {
      md += '## ' + formatTime(n.time) + '\n\n' + n.text + '\n\n';
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'notas-' + currentVideoId + '.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }
  
  // ---------- 7. Detecção de troca de vídeo (YouTube é SPA) ----------
  function checkVideoChange() {
    const id = getVideoId();
    if (id && id !== currentVideoId) {
      currentVideoId = id;
      notesCache = [];
      const list = document.getElementById('ytn-notes-list');
      if (list) list.innerHTML = '';
      if (document.getElementById('ytn-panel').classList.contains('ytn-open')) {
        loadNotes(id);
      }
    }
  }
  
  document.addEventListener('yt-navigate-finish', () => setTimeout(checkVideoChange, 500));
  setInterval(checkVideoChange, 1000);
  
  // ---------- 8. Inicialização ----------
  function init() {
    if (document.getElementById('yt-notes-btn')) return;
    injectUI();
    checkVideoChange();
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }