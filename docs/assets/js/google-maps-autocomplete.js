/**
 * Google Maps Places Autocomplete Integration
 * Sistema Fotográfico - Preenchimento automático de endereços
 */

class GoogleMapsAutocomplete {
    constructor() {
        // Carrega configurações do arquivo de config
        this.config = window.GOOGLE_MAPS_CONFIG || {
            apiKey: 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
            libraries: ['places'],
            language: 'pt-BR',
            region: 'BR',
            autocompleteOptions: {
                componentRestrictions: { country: 'br' },
                fields: ['address_components', 'formatted_address', 'geometry'],
                types: ['address']
            },
            debug: false,
            loadTimeout: 10000
        };
        
        this.isApiLoaded = false;
        this.autocompleteInstances = [];
        this.loadTimeout = null;
        this.init();
    }

    /**
     * Inicializa o sistema de autocomplete
     */
    init() {
        // Carrega a API do Google Maps se ainda não foi carregada
        if (!window.google || !window.google.maps) {
            this.loadGoogleMapsAPI();
        } else {
            this.isApiLoaded = true;
            // Logs adicionais sobre estado da API
            this.logApiInfo();
            // Verificar disponibilidade da biblioteca Places/Autocomplete
            this.checkPlacesAvailability();
            this.setupAutocomplete();
        }
    }

    /**
     * Carrega a API do Google Maps dinamicamente
     */
    loadGoogleMapsAPI() {
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
            console.log('Script do Google Maps já existe, aguardando carregamento...');
            return; // API já está sendo carregada
        }

        console.log('Iniciando carregamento da API do Google Maps...');
        console.log('Chave da API definida?', Boolean(this.config.apiKey));
        console.log('Timeout configurado:', this.config.loadTimeout + 'ms');
    
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${this.config.apiKey}&libraries=${this.config.libraries.join(',')}&language=${this.config.language}&region=${this.config.region}&callback=initGoogleMapsAutocomplete`;
        script.async = true;
        script.defer = true;
    
        // Evitar log do URL completo (contém a chave)
        console.log('Bibliotecas:', this.config.libraries);
        console.log('Idioma/Região:', this.config.language, this.config.region);

        // Handler global para falhas de autenticação da API do Google Maps
        window.gm_authFailure = () => {
            console.error('❌ Falha de autenticação da API do Google Maps (gm_authFailure).');
            console.error('Verifique: chave de API válida, restrições de domínio/IP, faturamento ativo e APIs necessárias (Maps JavaScript API e Places API (New)).');
        };
        
        // Callback global para quando a API carregar
        window.initGoogleMapsAutocomplete = () => {
            clearTimeout(this.loadTimeout);
            this.isApiLoaded = true;
            // Log do estado pós-carregamento
            this.logApiInfo();
            this.checkPlacesAvailability();
            this.setupAutocomplete();
            console.log('✅ Google Maps API carregada com sucesso');
        };

        // Timeout para carregamento da API
        this.loadTimeout = setTimeout(() => {
            console.error('❌ Timeout ao carregar a API do Google Maps.');
            console.error('Possíveis causas:');
            console.error('1. Conexão lenta com a internet');
            console.error('2. Bloqueador de anúncios ativo');
            console.error('3. Firewall ou antivírus bloqueando');
            console.error('4. Problemas de DNS');
            console.error('Chave da API definida?', Boolean(this.config.apiKey));
        }, this.config.loadTimeout);

        script.onerror = (error) => {
            console.error('❌ Erro ao carregar script da API do Google Maps:', error);
            console.error('Verifique sua conexão e configurações de bloqueio');
            clearTimeout(this.loadTimeout);
        };

        script.onload = () => {
            console.log('📄 Script do Google Maps carregado, aguardando inicialização...');
        };

        document.head.appendChild(script);
        console.log('📄 Script adicionado ao DOM');
    }

    /**
     * Configura o autocomplete para todos os campos de endereço encontrados
     */
    setupAutocomplete() {
        // Mapeamento de campos de endereço por página
        const addressFieldMappings = {
            // Novos Pedidos
            'endereco': {
                autocompleteField: 'endereco',
                fields: {
                    street: 'endereco',
                    neighborhood: 'bairro',
                    postalCode: 'cep'
                }
            },
            // Editar Registro (operação)
            'endereco': {
                autocompleteField: 'endereco',
                fields: {
                    street: 'endereco'
                }
            },
            // Editar Registro (agendamentos)
            'enderecoImovel': {
                autocompleteField: 'enderecoImovel',
                fields: {
                    street: 'enderecoImovel',
                    neighborhood: 'bairroLocalidade'
                }
            }
        };

        // Configura autocomplete para cada campo encontrado
        Object.keys(addressFieldMappings).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                this.setupFieldAutocomplete(field, addressFieldMappings[fieldId]);
            }
        });
    }

    /**
     * Configura autocomplete para um campo específico
     */
    setupFieldAutocomplete(inputElement, mapping) {
        if (!inputElement || !this.isApiLoaded) return;

        if (!(window.google && window.google.maps && window.google.maps.places && window.google.maps.places.Autocomplete)) {
            console.error(`❌ Autocomplete indisponível ao configurar campo "${inputElement.id}".`);
            return;
        }

        try {
            console.log('🛠️ Configurando Autocomplete para campo:', inputElement.id, 'com opções:', this.config.autocompleteOptions, 'mapeamento:', mapping);
            const autocomplete = new google.maps.places.Autocomplete(inputElement, this.config.autocompleteOptions);

            // Listener para quando um endereço é selecionado
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                this.fillAddressFields(place, mapping);
            });

            // Armazena a instância para possível cleanup posterior
            this.autocompleteInstances.push({
                autocomplete: autocomplete,
                element: inputElement,
                mapping: mapping
            });

            if (this.config.debug) {
                console.log(`Google Maps Autocomplete configurado para: ${inputElement.id}`);
            }

        } catch (error) {
            console.error('Erro ao configurar autocomplete:', error);
        }
    }

    /**
     * Preenche os campos de endereço com base na seleção do usuário
     */
    fillAddressFields(place, mapping) {
        if (!place.address_components) {
            console.warn('Nenhum componente de endereço encontrado');
            return;
        }

        // Limpa os campos antes de preencher
        Object.values(mapping.fields).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && fieldId !== mapping.autocompleteField) {
                field.value = '';
            }
        });

        // Preenche os campos com base nos componentes do endereço
        place.address_components.forEach(component => {
            const type = component.types[0];
            
            switch (type) {
                case 'route': // Rua
                case 'street_number': // Número
                    this.fillField(mapping.fields.street, this.formatStreetAddress(place.address_components));
                    break;
                    
                case 'sublocality_level_1': // Bairro
                case 'political':
                    if (component.types.includes('sublocality')) {
                        this.fillField(mapping.fields.neighborhood, component.long_name);
                    }
                    break;
                    
                case 'administrative_area_level_2': // Cidade
                    this.fillField(mapping.fields.city, component.long_name);
                    break;
                    
                case 'administrative_area_level_1': // Estado
                    this.fillField(mapping.fields.state, component.short_name);
                    break;
                    
                case 'postal_code': // CEP
                    this.fillField(mapping.fields.postalCode, component.long_name);
                    break;
            }
        });

        // Se o campo principal for um textarea, usa o endereço formatado completo
        const mainField = document.getElementById(mapping.autocompleteField);
        if (mainField && mainField.tagName.toLowerCase() === 'textarea') {
            mainField.value = place.formatted_address || mainField.value;
        }

        if (this.config.debug) {
            console.log('Campos de endereço preenchidos automaticamente', place);
        }
    }

    /**
     * Formata o endereço da rua (rua + número)
     */
    formatStreetAddress(components) {
        let street = '';
        let number = '';

        components.forEach(component => {
            if (component.types.includes('route')) {
                street = component.long_name;
            }
            if (component.types.includes('street_number')) {
                number = component.long_name;
            }
        });

        return number ? `${street}, ${number}` : street;
    }

    /**
     * Preenche um campo específico se ele existir
     */
    fillField(fieldId, value) {
        if (!fieldId || !value) return;
        
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
            
            // Dispara evento de mudança para compatibilidade com outros scripts
            const event = new Event('change', { bubbles: true });
            field.dispatchEvent(event);
        }
    }

    /**
     * Remove todas as instâncias de autocomplete (cleanup)
     */
    destroy() {
        this.autocompleteInstances.forEach(instance => {
            if (instance.autocomplete && instance.autocomplete.unbindAll) {
                instance.autocomplete.unbindAll();
            }
        });
        this.autocompleteInstances = [];
    }

    /**
     * Recarrega o autocomplete (útil para conteúdo dinâmico)
     */
    reload() {
        this.destroy();
        if (this.isApiLoaded) {
            this.setupAutocomplete();
        }
    }

    // Logs e verificações adicionais da API
    logApiInfo() {
        const hasGoogle = !!window.google;
        const hasMaps = !!(window.google && window.google.maps);
        const hasPlaces = !!(window.google && window.google.maps && window.google.maps.places);
        const hasAutocomplete = !!(window.google && window.google.maps && window.google.maps.places && window.google.maps.places.Autocomplete);

        console.log('🔎 Estado da API do Google:', {
            hasGoogle, hasMaps, hasPlaces, hasAutocomplete,
            librariesConfigured: this.config.libraries,
            options: this.config.autocompleteOptions
        });

        if (!hasPlaces || !hasAutocomplete) {
            console.warn('⚠️ Biblioteca Places/Autocomplete indisponível. Certifique-se de que a Places API (New) está habilitada no projeto e que o parâmetro "libraries=places" está presente na URL de carregamento.');
        }
    }

    checkPlacesAvailability() {
        if (!(window.google && window.google.maps && window.google.maps.places && window.google.maps.places.Autocomplete)) {
            console.error('❌ Places Autocomplete não disponível. Possíveis causas: API não habilitada (Places API (New)), chave inválida, restrições incorretas, ou bloqueios de rede.');
        }
    }
}

// Inicialização automática quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se há campos de endereço na página antes de inicializar
    const addressFields = ['endereco', 'enderecoImovel'];
    const hasAddressFields = addressFields.some(fieldId => document.getElementById(fieldId));
    
    if (hasAddressFields) {
        window.googleMapsAutocomplete = new GoogleMapsAutocomplete();
        if (window.GOOGLE_MAPS_CONFIG && window.GOOGLE_MAPS_CONFIG.debug) {
            console.log('Google Maps Autocomplete inicializado');
        }
    }
});

// Exporta a classe para uso em outros scripts se necessário
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleMapsAutocomplete;
}