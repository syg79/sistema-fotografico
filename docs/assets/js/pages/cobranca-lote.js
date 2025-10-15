document.addEventListener('DOMContentLoaded', async () => {
    class CobrancaLote {
        constructor() {
            this.registros = [];
            this.registrosFiltrados = [];
            this.registrosSelecionados = new Set();
            this.api = null;
            this.writer = null;
            this.init();
        }

        async init() {
            try {
                // Inicializar API e Writer
                this.api = new GoogleSheetsAPI();
                this.writer = new GoogleSheetsWriter();
                
                // Configurar data padrão (mês atual)
                const hoje = new Date();
                const mesAtual = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0');
                document.getElementById('filtroMes').value = mesAtual;
                
                await this.carregarDados();
                this.configurarEventos();
            } catch (error) {
                console.error('Erro ao inicializar:', error);
                this.mostrarErro('Erro ao carregar a página. Verifique a configuração.');
            }
        }

        async carregarDados() {
            this.mostrarLoading(true);
            
            try {
                // Carregar registros
                const solicitacoes = await this.api.getSolicitacoes();
                this.registros = solicitacoes.filter(reg => 
                    reg['Record ID'] && 
                    reg['Nome Cliente'] && 
                    reg['Status'] === 'Realizado' // Apenas registros realizados podem ser faturados
                );

                // Carregar fotógrafos para o filtro
                await this.carregarFotografos();
                
                // Aplicar filtros iniciais
                this.aplicarFiltros();
                
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                this.mostrarErro('Erro ao carregar os dados.');
            } finally {
                this.mostrarLoading(false);
            }
        }

        async carregarFotografos() {
            try {
                const fotografos = await this.api.getFotografos();
                const select = document.getElementById('filtroFotografo');
                
                // Limpar opções existentes (exceto "Todos")
                while (select.children.length > 1) {
                    select.removeChild(select.lastChild);
                }
                
                // Adicionar fotógrafos
                fotografos.forEach(fotografo => {
                    const option = document.createElement('option');
                    option.value = fotografo['Nome'] || fotografo['Fotografo'];
                    option.textContent = fotografo['Nome'] || fotografo['Fotografo'];
                    select.appendChild(option);
                });
            } catch (error) {
                console.warn('Erro ao carregar fotógrafos:', error);
            }
        }

        aplicarFiltros() {
            const filtroMes = document.getElementById('filtroMes').value;
            const filtroStatus = document.getElementById('filtroStatus').value;
            const filtroFotografo = document.getElementById('filtroFotografo').value;

            this.registrosFiltrados = this.registros.filter(registro => {
                // Filtro por mês
                if (filtroMes) {
                    const dataRegistro = this.extrairData(registro);
                    if (dataRegistro) {
                        const mesRegistro = dataRegistro.getFullYear() + '-' + String(dataRegistro.getMonth() + 1).padStart(2, '0');
                        if (mesRegistro !== filtroMes) return false;
                    }
                }

                // Filtro por status de cobrança
                if (filtroStatus) {
                    const statusCobranca = registro['Cobranca'] || 'A faturar';
                    if (statusCobranca !== filtroStatus) return false;
                }

                // Filtro por fotógrafo
                if (filtroFotografo) {
                    const fotografoRegistro = registro['Fotografo'] || '';
                    if (fotografoRegistro !== filtroFotografo) return false;
                }

                return true;
            });

            this.limparSelecao();
            this.renderizarRegistros();
        }

        extrairData(registro) {
            // Tentar extrair data de diferentes campos
            const campos = ['Data do agendamento', 'Data Agendamento', 'Data Realizada', 'Created At'];
            
            for (const campo of campos) {
                const dataStr = registro[campo];
                if (dataStr) {
                    const data = new Date(dataStr);
                    if (!isNaN(data.getTime())) {
                        return data;
                    }
                }
            }
            
            return null;
        }

        renderizarRegistros() {
            const container = document.getElementById('listaRegistros');
            const totalElement = document.getElementById('totalRegistros');
            
            totalElement.textContent = `${this.registrosFiltrados.length} registros encontrados`;

            if (this.registrosFiltrados.length === 0) {
                document.getElementById('semRegistros').style.display = 'block';
                container.innerHTML = '';
                return;
            }

            document.getElementById('semRegistros').style.display = 'none';
            
            container.innerHTML = this.registrosFiltrados.map(registro => {
                const id = registro['Record ID'];
                const cliente = registro['Nome Cliente'] || '-';
                const endereco = registro['Endereco do Imovel'] || '-';
                const fotografo = registro['Fotografo'] || '-';
                const statusCobranca = registro['Cobranca'] || 'A faturar';
                const data = this.extrairData(registro);
                const dataFormatada = data ? data.toLocaleDateString('pt-BR') : '-';
                
                const statusClass = statusCobranca === 'Faturado' ? 'status-faturado' : 'status-a-faturar';
                const statusBadge = statusCobranca === 'Faturado' ? 'bg-success' : 'bg-warning';

                return `
                    <div class="card registro-card ${statusClass}" data-id="${id}">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-1">
                                    <div class="form-check">
                                        <input class="form-check-input registro-checkbox" type="checkbox" 
                                               value="${id}" id="check_${id}">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <h6 class="card-title mb-1">${cliente}</h6>
                                    <p class="card-text text-muted small mb-0">${endereco}</p>
                                </div>
                                <div class="col-md-2">
                                    <small class="text-muted">Fotógrafo:</small><br>
                                    <strong>${fotografo}</strong>
                                </div>
                                <div class="col-md-2">
                                    <small class="text-muted">Data:</small><br>
                                    <strong>${dataFormatada}</strong>
                                </div>
                                <div class="col-md-2">
                                    <span class="badge ${statusBadge}">${statusCobranca}</span>
                                </div>
                                <div class="col-md-1 text-end">
                                    <a href="../operacao/editar-registro.html?id=${id}" 
                                       class="btn btn-outline-primary btn-sm" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Configurar eventos dos checkboxes
            this.configurarCheckboxes();
        }

        configurarCheckboxes() {
            const checkboxes = document.querySelectorAll('.registro-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const id = e.target.value;
                    const card = document.querySelector(`[data-id="${id}"]`);
                    
                    if (e.target.checked) {
                        this.registrosSelecionados.add(id);
                        card.classList.add('selected');
                    } else {
                        this.registrosSelecionados.delete(id);
                        card.classList.remove('selected');
                    }
                    
                    this.atualizarContadorSelecao();
                });
            });
        }

        configurarEventos() {
            // Filtros
            document.getElementById('filtroMes').addEventListener('change', () => this.aplicarFiltros());
            document.getElementById('filtroStatus').addEventListener('change', () => this.aplicarFiltros());
            document.getElementById('filtroFotografo').addEventListener('change', () => this.aplicarFiltros());

            // Modal de confirmação
            document.getElementById('btnConfirmarAlteracao').addEventListener('click', () => this.executarAlteracaoLote());
        }

        selecionarTodos() {
            const checkboxes = document.querySelectorAll('.registro-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
                const id = checkbox.value;
                this.registrosSelecionados.add(id);
                document.querySelector(`[data-id="${id}"]`).classList.add('selected');
            });
            this.atualizarContadorSelecao();
        }

        limparSelecao() {
            const checkboxes = document.querySelectorAll('.registro-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
                const id = checkbox.value;
                this.registrosSelecionados.delete(id);
                const card = document.querySelector(`[data-id="${id}"]`);
                if (card) card.classList.remove('selected');
            });
            this.registrosSelecionados.clear();
            this.atualizarContadorSelecao();
        }

        atualizarContadorSelecao() {
            const contador = this.registrosSelecionados.size;
            const counterElement = document.getElementById('selectionCounter');
            const bulkActions = document.getElementById('bulkActions');
            
            counterElement.textContent = `${contador} registros selecionados`;
            bulkActions.style.display = contador > 0 ? 'block' : 'none';
        }

        alterarStatusLote(novoStatus) {
            if (this.registrosSelecionados.size === 0) {
                alert('Selecione pelo menos um registro.');
                return;
            }

            // Configurar modal de confirmação
            document.getElementById('qtdSelecionados').textContent = this.registrosSelecionados.size;
            document.getElementById('novoStatus').textContent = novoStatus;
            
            // Armazenar o novo status para uso posterior
            this.novoStatusTemp = novoStatus;
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('modalConfirmacao'));
            modal.show();
        }

        async executarAlteracaoLote() {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfirmacao'));
            modal.hide();
            
            this.mostrarLoading(true);
            
            try {
                const registrosParaAtualizar = [];
                
                // Preparar dados para atualização
                for (const id of this.registrosSelecionados) {
                    const registro = this.registros.find(r => r['Record ID'] === id);
                    if (registro) {
                        const registroAtualizado = { ...registro };
                        registroAtualizado['Cobranca'] = this.novoStatusTemp;
                        registrosParaAtualizar.push(registroAtualizado);
                    }
                }

                // Executar atualizações
                for (const registro of registrosParaAtualizar) {
                    await this.writer.updateRecord(registro);
                }

                // Recarregar dados
                await this.carregarDados();
                
                alert(`${registrosParaAtualizar.length} registros foram atualizados com sucesso!`);
                
            } catch (error) {
                console.error('Erro ao atualizar registros:', error);
                alert('Erro ao atualizar os registros. Tente novamente.');
            } finally {
                this.mostrarLoading(false);
            }
        }

        mostrarLoading(mostrar) {
            document.getElementById('loading').style.display = mostrar ? 'block' : 'none';
        }

        mostrarErro(mensagem) {
            alert(mensagem);
        }
    }

    // Funções globais para os botões
    window.aplicarFiltros = () => window.cobrancaLote.aplicarFiltros();
    window.selecionarTodos = () => window.cobrancaLote.selecionarTodos();
    window.limparSelecao = () => window.cobrancaLote.limparSelecao();
    window.alterarStatusLote = (status) => window.cobrancaLote.alterarStatusLote(status);

    // Inicializar
    window.cobrancaLote = new CobrancaLote();
});