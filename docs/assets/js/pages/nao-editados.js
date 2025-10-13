document.addEventListener('DOMContentLoaded', async () => {
    class NaoEditados {
        constructor(api, writer) {
            this.api = api;
            this.writer = writer;
            this.servicos = [];
            this.init();
        }

        async init() {
            await this.carregarServicos();
            this.configurarEventos();
        }

        async carregarServicos() {
            this.mostrarLoading(true);
            try {
                const registros = await this.api.getSolicitacoes();
                this.servicos = registros
                    .filter(reg => (reg['Status'] || '').toLowerCase() === 'realizado')
                    .map(this.normalizarServico);

                // Sort by Codigo Vitrine
                this.servicos.sort((a, b) => {
                    const codA = parseInt(a.codigoVitrine.replace(/\D/g, ''), 10) || 0;
                    const codB = parseInt(b.codigoVitrine.replace(/\D/g, ''), 10) || 0;
                    return codA - codB;
                });
                
                this.renderizarServicos();
            } catch (error) {
                console.error("Erro ao carregar serviços não editados:", error);
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
                dataRealizado: reg['Data Realizado'] || new Date().toISOString().split('T')[0],
                codigoVitrine: reg['Código Vitrine'] || 'N/A',
                fotografo: reg['Fotografo'] || '-'
            };
        }

        renderizarServicos() {
            const container = document.getElementById('listaRealizados'); // The HTML uses this ID
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
                                <i class="fas fa-camera me-1"></i> ${servico.fotografo}
                            </div>
                            <div class="col-md-2">
                                <i class="fas fa-calendar-check me-1"></i> ${servico.dataRealizado}
                            </div>
                            <div class="col-md-2">
                                <a href="#" class="btn btn-sm btn-outline-primary">Ver no Drive</a>
                            </div>
                            <div class="col-md-2 text-end">
                                <button class="btn btn-success btn-sm btn-marcar-editado" data-id="${servico.id}">
                                    <i class="fas fa-check me-1"></i> Marcar como Editado
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        configurarEventos() {
            document.getElementById('listaRealizados').addEventListener('click', e => {
                if (e.target.classList.contains('btn-marcar-editado')) {
                    const id = e.target.getAttribute('data-id');
                    this.marcarComoEditado(id, e.target);
                }
            });
        }

        async marcarComoEditado(id, button) {
            if (!confirm('Tem certeza que deseja marcar este serviço como editado?')) {
                return;
            }

            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Marcando...';

            try {
                await this.writer.marcarEditado(id);
                // Visually remove the item or refresh the list
                button.closest('.realizados-card').remove();
                alert('Serviço marcado como editado com sucesso!');
            } catch (error) {
                console.error('Erro ao marcar como editado:', error);
                alert(`Não foi possível marcar como editado: ${error.message}`);
                button.disabled = false;
                button.innerHTML = '<i class="fas fa-check me-1"></i> Marcar como Editado';
            }
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

    Promise.all([
        new Promise(res => { let i = 0; const int = setInterval(() => { if(window.googleSheetsAPI) { clearInterval(int); res(); }}, 200); }),
        new Promise(res => { let i = 0; const int = setInterval(() => { if(window.googleSheetsWriter) { clearInterval(int); res(); }}, 200); })
    ]).then(() => {
        new NaoEditados(window.googleSheetsAPI, window.googleSheetsWriter);
    });
});
