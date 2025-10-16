(function(){
  const selectors = [
    '#endereco',
    'input[name="endereco"]',
    '#bairro',
    'input[name="bairro"]',
    '#cep',
    'input[name="cep"]'
  ];

  function initAutocomplete() {
    if (!window.google || !google.maps || !google.maps.places) {
      console.warn('Google Maps Places não disponível.');
      return;
    }

    const addressInput = document.querySelector('#endereco, input[name="endereco"]');
    if (!addressInput) return;

    const autocomplete = new google.maps.places.Autocomplete(addressInput, {
      types: ['address'],
      componentRestrictions: { country: ['br'] },
      fields: ['address_components','geometry','formatted_address']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place || !place.address_components) return;

      const getComponent = (type) => {
        const comp = place.address_components.find(c => c.types.includes(type));
        return comp ? comp.long_name : '';
      };

      const street = `${getComponent('route')} ${getComponent('street_number')}`.trim();
      const neighborhood = getComponent('sublocality') || getComponent('political') || getComponent('neighborhood');
      const city = getComponent('administrative_area_level_2');
      const state = getComponent('administrative_area_level_1');
      const postal = getComponent('postal_code');

      // Preencher campos se existirem
      const enderecoEl = document.querySelector('#endereco, input[name="endereco"]');
      if (enderecoEl && street) enderecoEl.value = street;

      const bairroEl = document.querySelector('#bairro, input[name="bairro"]');
      if (bairroEl && neighborhood) bairroEl.value = neighborhood;

      const cepEl = document.querySelector('#cep, input[name="cep"]');
      if (cepEl && postal) cepEl.value = postal;

      // Disparar eventos de mudança
      [enderecoEl, bairroEl, cepEl].forEach(el => {
        if (el) el.dispatchEvent(new Event('change'));
      });

      // Armazenar coordenadas em data attributes
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        addressInput.dataset.lat = lat;
        addressInput.dataset.lng = lng;
      }
    });
  }

  function tryInit() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAutocomplete);
    } else {
      initAutocomplete();
    }
  }

  if (window.googleMapsLoaded) {
    tryInit();
  } else {
    document.addEventListener('googleMapsReady', tryInit);
  }
})();