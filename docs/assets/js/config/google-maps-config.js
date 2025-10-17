(function(){
  try {
    function getKeyCandidates(){
      const candidates = [];
      if (typeof window !== 'undefined') {
        if (window.GOOGLE_MAPS_API_KEY) candidates.push(window.GOOGLE_MAPS_API_KEY);
        if (window.localStorage) {
          const k1 = window.localStorage.getItem('GOOGLE_MAPS_API_KEY');
          const k2 = window.localStorage.getItem('MAPS_API_KEY');
          if (k1) candidates.push(k1);
          if (k2) candidates.push(k2);
        }
        if (window.CONFIG) {
          const k3 = window.CONFIG.GOOGLE_MAPS_API_KEY;
          const k4 = window.CONFIG.GOOGLE_MAPS && window.CONFIG.GOOGLE_MAPS.API_KEY;
          if (k3) candidates.push(k3);
          if (k4) candidates.push(k4);
        }
      }
      return candidates;
    }

    function resolveKey(){
      // Priorizar CONFIG diretamente
      if (window.CONFIG && window.CONFIG.GOOGLE_MAPS && window.CONFIG.GOOGLE_MAPS.API_KEY) {
        return window.CONFIG.GOOGLE_MAPS.API_KEY;
      }
      const key = getKeyCandidates().find(Boolean);
      return key && key !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE' ? key : null;
    }

    function loadMapsWithKey(apiKey) {
      if (!apiKey) return;
      if (document.getElementById('google-maps-js')) return; // Já carregado
      window.initMapsAPI = function() {
        window.googleMapsLoaded = true;
        document.dispatchEvent(new Event('googleMapsReady'));
        console.log('🗺️ Google Maps API carregada (Places)');
      };
      const script = document.createElement('script');
      script.id = 'google-maps-js';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=pt-BR&callback=initMapsAPI`;
      script.async = true;
      script.defer = true;
      script.onerror = function(){
        console.error('Falha ao carregar Google Maps API. Verifique a chave e permissões de uso.');
      };
      document.head.appendChild(script);
    }

    // Tentar resolver a chave imediatamente
    const initialKey = resolveKey();
    if (initialKey) {
      loadMapsWithKey(initialKey);
    } else {
      // Sem popup: revalidar por alguns segundos para casos em que CONFIG/localStorage sejam definidos depois
      console.warn('Google Maps API key não encontrada no carregamento inicial. Verificando novamente por até 10s.');
      let attempts = 0;
      const maxAttempts = 20; // 20 x 500ms = 10s
      const timer = setInterval(() => {
        const k = resolveKey();
        if (k) {
          clearInterval(timer);
          loadMapsWithKey(k);
        } else if (++attempts >= maxAttempts) {
          clearInterval(timer);
          console.warn('Google Maps API key não encontrada após várias tentativas. Autocomplete ficará desativado.');
        }
      }, 500);
    }
  } catch (err) {
    console.error('Erro ao inicializar Google Maps Config:', err);
  }
})();