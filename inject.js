// inject.js — Intercepta fetch, XHR e ytInitialPlayerResponse (Etapa 09)
(function() {
    'use strict';
  
    const AD_KEYS = ['adPlacements', 'adSlots', 'playerAds', 'ssapConfig', 'adBreakHeartbeatParams'];
  
    function cleanData(data) {
      if (!data || typeof data !== 'object') return data;
      for (const key of AD_KEYS) {
        if (data[key]) {
          delete data[key];
        }
      }
      return data;
    }
  
    // 1. Interceptar a definição inicial de ytInitialPlayerResponse
    // O YouTube define essa variável global no HTML. Vamos interceptar a escrita.
    let _ytInitialPlayerResponse = window.ytInitialPlayerResponse;
    Object.defineProperty(window, 'ytInitialPlayerResponse', {
      configurable: true,
      get() {
        return _ytInitialPlayerResponse;
      },
      set(value) {
        _ytInitialPlayerResponse = cleanData(value);
      }
    });
  
    // 2. Interceptar fetch (para chamadas à API do player)
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);
      const url = args[0] instanceof Request ? args[0].url : args[0];
      if (typeof url === 'string' && url.includes('/youtubei/v1/player')) {
        const clone = response.clone();
        try {
          const data = await clone.json();
          const cleaned = cleanData(data);
          return new Response(JSON.stringify(cleaned), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        } catch (e) {
          return response;
        }
      }
      return response;
    };
  
    // 3. Interceptar XMLHttpRequest (método legado)
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      this._url = url;
      return originalOpen.apply(this, arguments);
    };
  
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function() {
      this.addEventListener('load', function() {
        if (this._url && this._url.includes('/youtubei/v1/player')) {
          try {
            const data = JSON.parse(this.responseText);
            const cleaned = cleanData(data);
            Object.defineProperty(this, 'responseText', {
              value: JSON.stringify(cleaned),
              writable: false
            });
          } catch (e) {}
        }
      });
      return originalSend.apply(this, arguments);
    };
  })();