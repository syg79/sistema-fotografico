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
      console.warn('Google Maps Places não disponível. Aguarde carregamento da API.');
      return;
    }

    const addressInput = document.querySelector('#endereco, input[name="endereco"]');
    if (!addressInput) {
      console.warn('Campo de endereço não encontrado para Autocomplete (#endereco ou name=endereco).');
      return;
    }

    const autocomplete = new google.maps.places.Autocomplete(addressInput, {
      types: ['address'],
      componentRestrictions: { country: ['br'] },
      fields: ['address_components','geometry','formatted_address']
    });

    console.log('🗺️ Autocomplete inicializado no campo de endereço.');

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place || !place.address_components) {
        console.warn('Place selecionado sem address_components.');
        return;
      }

      const getComponent = (type) => {
        const comp = place.address_components.find(c => c.types.includes(type));
        return comp ? comp.long_name : '';
      };

      const street = `${getComponent('route')} ${getComponent('street_number')}`.trim();
      const neighborhood = getComponent('sublocality') || getComponent('political') || getComponent('neighborhood');
      const city = getComponent('administrative_area_level_2');
      const state = getComponent('administrative_area_level_1');
      const postal = getComponent('postal_code');

      const enderecoEl = document.querySelector('#endereco, input[name="endereco"]');
      const bairroEl = document.querySelector('#bairro, input[name="bairro"]');
      const cepEl = document.querySelector('#cep, input[name="cep"]');

      if (enderecoEl && street) enderecoEl.value = street;
      if (bairroEl && neighborhood) bairroEl.value = neighborhood;
      if (cepEl && postal) cepEl.value = postal;

      [enderecoEl, bairroEl, cepEl].forEach(el => {
        if (el) el.dispatchEvent(new Event('change', { bubbles: true }));
      });

      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        addressInput.dataset.lat = lat;
        addressInput.dataset.lng = lng;
        console.log(`Coordenadas definidas: lat=${lat}, lng=${lng}`);
      }
    });
  }

  function tryInit() {
    if (window.googleMapsLoaded) {
      initAutocomplete();
    } else {
      document.addEventListener('googleMapsReady', initAutocomplete, { once: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }
})();