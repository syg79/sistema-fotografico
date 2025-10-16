(function(){
  try {
    const key = (typeof window !== 'undefined' ? (window.GOOGLE_MAPS_API_KEY || (window.localStorage ? window.localStorage.getItem('GOOGLE_MAPS_API_KEY') : null)) : null);

    if (!key || key === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      console.warn('Google Maps API key não configurada. Defina window.GOOGLE_MAPS_API_KEY ou localStorage.GOOGLE_MAPS_API_KEY para habilitar Autocomplete.');
      return;
    }

    if (document.getElementById('google-maps-js')) {
      return; // Já carregado
    }

    window.initMapsAPI = function() {
      window.googleMapsLoaded = true;
      document.dispatchEvent(new Event('googleMapsReady'));
      console.log('🗺️ Google Maps API carregada (Places)');
    };

    const script = document.createElement('script');
    script.id = 'google-maps-js';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&language=pt-BR&callback=initMapsAPI`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  } catch (err) {
    console.error('Erro ao inicializar Google Maps Config:', err);
  }
})();