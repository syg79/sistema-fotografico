/**
 * Configuração da API do Google Maps
 * Sistema Fotográfico
 */

// IMPORTANTE: Substitua 'YOUR_GOOGLE_MAPS_API_KEY_HERE' pela sua chave real da API do Google Maps
// Para obter uma chave da API:
// 1. Acesse: https://console.cloud.google.com/
// 2. Crie um novo projeto ou selecione um existente
// 3. Ative a API "Places API" e "Maps JavaScript API"
// 4. Crie uma chave de API em "Credenciais"
// 5. Configure as restrições de API para maior segurança

// Permite sobrescrever a chave sem expor segredos no código:
// - Defina window.GOOGLE_MAPS_API_KEY ou window.GMAPS_API_KEY antes de carregar este arquivo
// - Ou salve em localStorage: localStorage.setItem('GMAPS_API_KEY', '<SUA_CHAVE>')
const __gmapKeyOverride = (typeof window !== 'undefined')
  ? (window.GOOGLE_MAPS_API_KEY || window.GMAPS_API_KEY || (window.localStorage ? window.localStorage.getItem('GMAPS_API_KEY') : null))
  : null;

const GOOGLE_MAPS_CONFIG = {
    // Sua chave da API do Google Maps (mesmo projeto das planilhas)
    apiKey: __gmapKeyOverride || 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
    
    // Configurações da API
    libraries: ['places'],
    language: 'pt-BR',
    region: 'BR',
    
    // Configurações do Autocomplete
    autocompleteOptions: {
        componentRestrictions: { country: 'br' },
        fields: ['address_components', 'formatted_address', 'geometry'],
        types: ['address']
    },
    
    // Configurações de debug
    debug: true, // Ativado para diagnóstico - mude para false em produção
    
    // Timeout para carregamento da API (em milissegundos) - aumentado para 30 segundos
    loadTimeout: 30000
};

// Exporta a configuração
if (typeof window !== 'undefined') {
    window.GOOGLE_MAPS_CONFIG = GOOGLE_MAPS_CONFIG;
    // Evitar log de segredos: apenas indica se override está ativo
    if (GOOGLE_MAPS_CONFIG.debug) {
        console.log('[Maps Config] API Key override ativo?', Boolean(__gmapKeyOverride));
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GOOGLE_MAPS_CONFIG;
}