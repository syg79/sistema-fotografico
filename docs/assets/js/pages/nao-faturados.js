document.addEventListener('DOMContentLoaded', async () => {
    class NaoFaturados {
        constructor(api) {
            this.api = api;
            this.servicos = [];
            this.init();
        }

        async init() {
            await this.carregarServicos();
        }

        async carregarServicos() {
            this.mostrarLoading(true);
            try {
                const registros = await this.api.getSolicitacoes();
                this.servicos = registros
                    .filter(reg => (reg['Status'] || '').toLowerCase() === 'editado')
                    .map(this.normalizarServico);

                // Sort by date descending
                this.servicos.sort((a, b) => (b.dataEditado || '').localeCompare(a.dataEditado || ''));
                
                this.renderServicos();
                this.atualizarEstatisticas();
            } catch (error) {
                console.error("Erro ao carregar serviços não faturados:", error);
                this.mostrarErro("Não foi possível carregar os serviços.");
            } finally {
                this.mostrarLoading(false);
            }
        }
        
        normalizarServico(reg) {
            return {
                id: reg['Record ID'] || reg['ID Solicitacao'],
                cliente: reg['Nome Cliente'] || '-',
                endereco: reg['Endereco do Imovel'] || '-',
                dataEditado: reg['Data Edicao'] || new Date().toISOString().split('T')[0], // Assuming a 'Data Edicao' field
                codigoVitrine: reg['Código Vitrine'] || 'N/A',
                fotografo: reg['Fotografo'] || '-',
                valor: reg['Valor'] || 'R$ 0,00' // Assuming a 'Valor' field
            };
        }

        renderServicos() {
            const container = document.getElementById('listaRealizados');
            if (!container) return;

            if (this.servicos.length === 0) {
                document.getElementById('semRealizados').style.display = 'block';
                container.innerHTML = '';
                return;
            }

            document.getElementById('semRealizados').style.display = 'none';
            container.innerHTML = this.servicos.map(servico => `
                <div class="card realizados-card mb-3">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-1"><strong>${servico.codigoVitrine}</strong></div>
                            <div class="col-md-3">
                                <h6 class="card-title mb-1">${servico.cliente}</h6>
                                <p class="card-text text-muted small">${servico.endereco}</p>
                            </div>
                            <div class="col-md-2">
                                <i class="fas fa-user me-1"></i> ${servico.fotografo}
                            </div>
                            <div class="col-md-2">
                                <i class="fas fa-calendar-check me-1"></i> ${servico.dataEditado}
                            </div>
                            <div class="col-md-2">
                                <strong>Valor:</strong> ${servico.valor}
                            </div>
                            <div class="col-md-2 text-end">
                                <button class="btn btn-info btn-sm" data-id="${servico.id}">
                                    <i class="fas fa-file-invoice-dollar me-1"></i> Faturar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        atualizarEstatisticas() {
            document.getElementById('totalRealizados').textContent = this.servicos.length;
            // Other stats can be calculated here if needed
        }

        mostrarLoading(mostrar) {
            document.getElementById('loadingRealizados').style.display = mostrar ? 'block' : 'none';
        }

        mostrarErro(mensagem) {
            const semDados = document.getElementById('semRealizados');
            semDados.style.display = 'block';
            semDados.innerHTML = `<i class="fas fa-exclamation-triangle fa-3x mb-3"></i><h5>Erro</h5><p>${mensagem}</p>`;
        }
    }

    new Promise(res => { 
        let i = 0; 
        const int = setInterval(() => { 
            if(window.googleSheetsAPI || i++ > 10) { 
                clearInterval(int); 
                res(); 
            }
        }, 200); 
    }).then(() => {
        if (!window.googleSheetsAPI) {
            alert("Erro crítico: A API de leitura não foi carregada.");
            return;
        }
        new NaoFaturados(window.googleSheetsAPI);
    });
});
