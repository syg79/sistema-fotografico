document.addEventListener('DOMContentLoaded', async () => {
    // Basic class structure for the registry page
    class RegistroServicos {
        constructor(api, writer) {
            this.api = api;
            this.writer = writer;
            this.servicos = [];
            this.fotografo = this.getFotografoFromURL();
            this.init();
        }

        getFotografoFromURL() {
            const params = new URLSearchParams(window.location.search);
            return params.get('fotografo') || 'Fotografo Teste'; // Fallback for testing
        }

        async init() {
            if (document.getElementById('nomeUsuario')) {
                document.getElementById('nomeUsuario').textContent = this.fotografo;
            }
            await this.carregarServicos();
            this.configurarEventos();
        }

        async carregarServicos() {
            try {
                const registros = await this.api.getSolicitacoes();
                this.servicos = registros.filter(reg => 
                    (reg['Fotografo'] || '').toLowerCase() === this.fotografo.toLowerCase() &&
                    ['agendado', 'em andamento', 'realizado', 'cancelado'].includes((reg['Status'] || '').toLowerCase())
                ).map(this.normalizarServico);
                
                this.renderizarServicos();
            } catch (error) {
                console.error("Erro ao carregar serviços:", error);
                alert("Não foi possível carregar os serviços.");
            }
        }
        
        normalizarServico(reg) {
            return {
                id: reg['Record ID'] || reg['ID Solicitacao'],
                cliente: reg['Nome Cliente'] || '-',
                endereco: reg['Endereco do Imovel'] || '-',
                data: reg['Data do agendamento'] || reg['Data Agendamento'] || '-',
                hora: reg['Horario da Sessao'] || '-',
                status: reg['Status'] || 'Pendente'
            };
        }

        renderizarServicos() {
            const container = document.getElementById('listaServicos');
            if (!container) return;

            if (this.servicos.length === 0) {
                document.getElementById('semServicos').style.display = 'block';
                container.innerHTML = '';
                return;
            }

            document.getElementById('semServicos').style.display = 'none';
            container.innerHTML = this.servicos.map(servico => `
                <div class="card servico-card servico-${servico.status.toLowerCase()}">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-4">
                                <h5 class="card-title mb-1">${servico.cliente}</h5>
                                <p class="card-text text-muted small">${servico.endereco}</p>
                            </div>
                            <div class="col-md-3">
                                <i class="fas fa-calendar-alt me-1"></i> ${servico.data} <br>
                                <i class="fas fa-clock me-1"></i> ${servico.hora}
                            </div>
                            <div class="col-md-3">
                                <span class="badge bg-primary">${servico.status}</span>
                            </div>
                            <div class="col-md-2 text-end">
                                <button class="btn btn-success btn-sm btn-registrar" data-id="${servico.id}">
                                    <i class="fas fa-edit me-1"></i> Registrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        configurarEventos() {
            const container = document.getElementById('listaServicos');
            container.addEventListener('click', e => {
                if (e.target.classList.contains('btn-registrar')) {
                    const id = e.target.getAttribute('data-id');
                    this.abrirModalRegistro(id);
                }
            });

            document.getElementById('btnSalvarRegistro').addEventListener('click', () => this.salvarRegistro());
        }

        abrirModalRegistro(id) {
            const servico = this.servicos.find(s => s.id === id);
            if (!servico) return;

            document.getElementById('servicoId').value = id;
            document.getElementById('infoCliente').textContent = servico.cliente;
            document.getElementById('infoEndereco').textContent = servico.endereco;
            document.getElementById('infoDataHora').textContent = `${servico.data} ${servico.hora}`;
            
            const modal = new bootstrap.Modal(document.getElementById('modalRegistro'));
            modal.show();
        }

        async salvarRegistro() {
            const id = document.getElementById('servicoId').value;
            const status = document.getElementById('statusServico').value;
            const observacoes = document.getElementById('observacoesServico').value;
            const btn = document.getElementById('btnSalvarRegistro');

            if (!id || !status) {
                alert('Por favor, selecione um status.');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Salvando...';

            try {
                if (status === 'Realizado') {
                    await this.writer.gerarCodigoVitrine(id, 'Realizado');
                    alert('Serviço registrado como "Realizado" e código vitrine gerado!');
                } else {
                    await this.writer.atualizarStatus(id, status, { 'Observacao para o Fotografo': observacoes });
                    alert('Status do serviço atualizado com sucesso!');
                }
                
                bootstrap.Modal.getInstance(document.getElementById('modalRegistro')).hide();
                await this.carregarServicos();

            } catch (error) {
                console.error("Erro ao salvar registro:", error);
                alert(`Erro ao salvar: ${error.message}`);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-save me-1"></i>Salvar Registro';
            }
        }
    }

    // Aguardar APIs e inicializar
    Promise.all([
        new Promise(res => { let i = 0; const int = setInterval(() => { if(window.googleSheetsAPI || i++ > 10) { clearInterval(int); res(); }}, 200); }),
        new Promise(res => { let i = 0; const int = setInterval(() => { if(window.googleSheetsWriter || i++ > 10) { clearInterval(int); res(); }}, 200); })
    ]).then(() => {
        if (!window.googleSheetsAPI || !window.googleSheetsWriter) {
            alert("Erro crítico: As APIs de leitura ou escrita não foram carregadas.");
            return;
        }
        new RegistroServicos(window.googleSheetsAPI, window.googleSheetsWriter);
    });
});
