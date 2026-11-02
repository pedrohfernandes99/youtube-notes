// content.js — Etapa 02: apenas prova que a extensão carrega
console.log('[YouTube Focus] Content script carregado! ✅');

const btn = document.createElement('button');
btn.id = 'yt-notes-btn';
btn.textContent = '📝';
btn.style.cssText = `
  position: fixed; bottom: 20px; right: 20px;
  width: 52px; height: 52px; border-radius: 50%;
  border: none; background: #ff0000; color: #fff;
  font-size: 22px; cursor: pointer;
  box-shadow: 0 2px 10px rgba(0,0,0,0.4);
  z-index: 100001;
`;
btn.addEventListener('click', () => alert('Funcionou! O botão foi clicado.'));
document.body.appendChild(btn);