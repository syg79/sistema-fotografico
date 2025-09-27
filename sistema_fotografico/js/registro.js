/**
 * Sistema de Registro de Serviços - Fotógrafos
 * Versão: 1.0
 */

class SistemaRegistro {
    constructor() {
        this.fotografoLogado = null;
        this.servicos = [];
        this.servicoAtual = null;
        this.cronometro = {
            iniciado: false,
            pausado: false,
            tempoInicio: null,
            tempoDecorrido: 0,
            intervalo: null
        };
        this.fotosUpload = [];
        
        this.init();
    }

    init() {
        this.verificarLogin();
        this.configurarEventos();
    }

    verificarLogin() {
        const fotografoSalvo = localStorage.getItem('fotografo_logado');
        if (fotografoSalvo) {
            this.fotografoLogado = JSON.parse(fotografoSalvo);
            this.mostrarAreaPrincipal();
            this.carregarDados();
        }
    }

    configurarEventos() {
        // Login
        document.getElementById('formLogin').addEventListener('submit', (e) => {
            e.preventDefault();
            this.realizarLogin();
        });

        // Filtros
        document.getElementById('filtroStatus').addEventListener('change', () => {
            this.aplicarFiltros();
        });

        document.getElementById('filtroData').addEventListener('change', () => {
            this.aplicarFiltros();
        });

        document.getElementById('buscaRapida').addEventListener('input', () => {
            this.aplicarFiltros();
        });

        // Modal de registro
        document.getElementById('statusServico').addEventListener('change', (e) => {
            this.toggleCamposReagendamento(e.target.value === 'Reagendar');
        });

        // Cronômetro
        document.getElementById('btnIniciar').addEventListener('click', () => {
            this.iniciarCronometro();
        });

        document.getElementById('btnPausar').addEventListener('click', () => {
            this.pausarCronometro();
        });

        document.getElementById('btnParar').addEventListener('click', () => {
            this.pararCronometro();
        });

        // Upload de fotos
        this.configurarUploadFotos();

        // Salvar registro
        document.getElementById('btnSalvarRegistro').addEventListener('click', () => {
            this.salvarRegistro();
        });
    }

    async realizarLogin() {
        const codigo = document.getElementById('codigoFotografo').value;
        const senha = document.getElementById('senhaFotografo').value;

        if (!codigo || !senha) {
            this.mostrarMensagem('Por favor, preencha todos os campos.', 'warning');
            return;
        }

        this.mostrarLoading('Verificando credenciais...');

        try {
            const fotografo = await this.validarCredenciais(codigo, senha);
            
            if (fotografo) {
                this.fotografoLogado = fotografo;
                localStorage.setItem('fotografo_logado', JSON.stringify(fotografo));
                
                this.mostrarAreaPrincipal();
                this.carregarDados();
                this.mostrarMensagem(`Bem-vindo, ${fotografo.nome}!`, 'success');
            } else {
                this.mostrarMensagem('Credenciais inválidas. Tente novamente.', 'error');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            this.mostrarMensagem('Erro ao fazer login. Tente novamente.', 'error');
        } finally {
            this.esconderLoading();
        }
    }

    async validarCredenciais(codigo, senha) {
        // Simulação - em produção, fazer chamada para API Tadabase
        return new Promise((resolve) => {
            setTimeout(() => {
                const fotografos = [
                    { id: 1, codigo: 'FOTO001', senha: '123456', nome: 'João Silva', email: 'joao@foto.com' },
                    { id: 2, codigo: 'FOTO002', senha: '123456', nome: 'Maria Santos', email: 'maria@foto.com' },
                    { id: 3, codigo: 'FOTO003', senha: '123456', nome: 'Pedro Costa', email: 'pedro@foto.com' }
                ];

                const fotografo = fotografos.find(f => f.codigo === codigo && f.senha === senha);
                resolve(fotografo || null);
            }, 1000);
        });
    }

    mostrarAreaPrincipal() {
        document.getElementById('telaLogin').style.display = 'none';
        document.getElementById('areaPrincipal').style.display = 'block';
        document.getElementById('usuarioLogado').style.display = 'block';
        document.getElementById('nomeUsuario').textContent = this.fotografoLogado.nome;
    }

    logout() {
        localStorage.removeItem('fotografo_logado');
        this.fotografoLogado = null;
        this.pararCronometro();
        
        document.getElementById('telaLogin').style.display = 'block';
        document.getElementById('areaPrincipal').style.display = 'none';
        document.getElementById('usuarioLogado').style.display = 'none';
        
        document.getElementById('formLogin').reset();
        this.mostrarMensagem('Logout realizado com sucesso.', 'info');
    }

    async carregarDados() {
        if (!this.fotografoLogado) return;

        try {
            this.mostrarLoading('Carregando serviços...');
            
            this.servicos = await this.buscarServicosFotografo(this.fotografoLogado.id);
            
            this.atualizarEstatisticas();
            this.aplicarFiltros();
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.mostrarMensagem('Erro ao carregar serviços.', 'error');
        } finally {
            this.esconderLoading();
        }
    }

    async buscarServicosFotografo(fotografoId) {
        // Simulação - em produção, fazer chamada para API Tadabase
        return new Promise((resolve) => {
            setTimeout(() => {
                const hoje = new Date();
                const servicos = [
                    {
                        id: 1,
                        cliente: 'João Silva',
                        endereco: 'Rua das Flores, 123 - Centro',
                        data: new Date(hoje.getTime() - 1 * 24 * 60 * 60 * 1000), // Ontem
                        horario: '09:00',
                        status: 'Realizado',
                        tipo: 'Residencial',
                        servicos: ['Fotos', 'Vídeo'],
                        contato: '(11) 99999-1111',
                        observacoes: 'Serviço realizado com sucesso.',
                        fotografoId: fotografoId,
                        tempoExecucao: '02:30:00',
                        horaFinalizacao: '11:30'
                    },
                    {
                        id: 2,
                        cliente: 'Maria Santos',
                        endereco: 'Av. Principal, 456 - Jardins',
                        data: hoje,
                        horario: '14:00',
                        status: 'Agendado',
                        tipo: 'Apartamento',
                        servicos: ['Fotos', 'Drone'],
                        contato: '(11) 99999-2222',
                        observacoes: 'Apartamento no 15º andar.',
                        fotografoId: fotografoId
                    },
                    {
                        id: 3,
                        cliente: 'Pedro Costa',
                        endereco: 'Rua do Comércio, 789 - Vila Nova',
                        data: new Date(hoje.getTime() + 1 * 24 * 60 * 60 * 1000), // Amanhã
                        horario: '10:30',
                        status: 'Agendado',
                        tipo: 'Comercial',
                        servicos: ['Fotos'],
                        contato: '(11) 99999-3333',
                        observacoes: 'Loja fechada. Chegar 15min antes.',
                        fotografoId: fotografoId
                    },
                    {
                        id: 4,
                        cliente: 'Ana Oliveira',
                        endereco: 'Rua das Palmeiras, 321 - Bela Vista',
                        data: new Date(hoje.getTime() - 2 * 24 * 60 * 60 * 1000), // Anteontem
                        horario: '16:00',
                        status: 'Cancelado',
                        tipo: 'Casa',
                        servicos: ['Fotos', 'Vídeo', 'Drone'],
                        contato: '(11) 99999-4444',
                        observacoes: 'Cliente cancelou por motivos pessoais.',
                        fotografoId: fotografoId,
                        motivoCancelamento: 'Cliente não estava no local'
                    }
                ];

                resolve(servicos);
            }, 500);
        });
    }

    atualizarEstatisticas() {
        const total = this.servicos.length;
        const realizados = this.servicos.filter(s => s.status === 'Realizado').length;
        const pendentes = this.servicos.filter(s => ['Agendado', 'Em Andamento'].includes(s.status)).length;
        const cancelados = this.servicos.filter(s => s.status === 'Cancelado').length;

        document.getElementById('totalServicos').textContent = total;
        document.getElementById('servicosRealizados').textContent = realizados;
        document.getElementById('servicosPendentes').textContent = pendentes;
        document.getElementById('servicosCancelados').textContent = cancelados;
    }

    aplicarFiltros() {
        const filtroStatus = document.getElementById('filtroStatus').value;
        const filtroData = document.getElementById('filtroData').value;
        const buscaRapida = document.getElementById('buscaRapida').value.toLowerCase();

        let servicosFiltrados = [...this.servicos];

        // Filtro por status
        if (filtroStatus) {
            servicosFiltrados = servicosFiltrados.filter(s => s.status === filtroStatus);
        }

        // Filtro por data
        const hoje = new Date();
        switch (filtroData) {
            case 'hoje':
                servicosFiltrados = servicosFiltrados.filter(s => 
                    this.isSameDay(s.data, hoje)
                );
                break;
            case 'semana':
                const inicioSemana = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
                servicosFiltrados = servicosFiltrados.filter(s => 
                    s.data >= inicioSemana && s.data <= hoje
                );
                break;
            case 'mes':
                const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                servicosFiltrados = servicosFiltrados.filter(s => 
                    s.data >= inicioMes && s.data <= hoje
                );
                break;
        }

        // Busca rápida
        if (buscaRapida) {
            servicosFiltrados = servicosFiltrados.filter(s => 
                s.cliente.toLowerCase().includes(buscaRapida) ||
                s.endereco.toLowerCase().includes(buscaRapida) ||
                s.tipo.toLowerCase().includes(buscaRapida)
            );
        }

        this.renderizarServicos(servicosFiltrados);
    }

    renderizarServicos(servicos) {
        const container = document.getElementById('listaServicos');
        const semServicos = document.getElementById('semServicos');

        if (servicos.length === 0) {
            container.innerHTML = '';
            semServicos.style.display = 'block';
            document.getElementById('totalFiltrados').textContent = '0 serviços';
            return;
        }

        semServicos.style.display = 'none';
        document.getElementById('totalFiltrados').textContent = `${servicos.length} serviço${servicos.length !== 1 ? 's' : ''}`;

        // Ordenar por data (mais recentes primeiro)
        servicos.sort((a, b) => b.data - a.data);

        container.innerHTML = servicos.map(servico => {
            const statusClass = this.getStatusClass(servico.status);
            const statusColor = this.getStatusColor(servico.status);
            
            return `
                <div class="card servico-card ${statusClass}">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h6 class="card-title mb-0">
                                        <i class="fas fa-user me-2"></i>${servico.cliente}
                                    </h6>
                                    <span class="badge ${statusColor}">${servico.status}</span>
                                </div>
                                
                                <div class="info-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>${servico.endereco}</span>
                                </div>
                                
                                <div class="info-item">
                                    <i class="fas fa-calendar"></i>
                                    <span>${this.formatarData(servico.data)} às ${servico.horario}</span>
                                </div>
                                
                                <div class="info-item">
                                    <i class="fas fa-home"></i>
                                    <span>${servico.tipo}</span>
                                </div>
                                
                                <div class="info-item">
                                    <i class="fas fa-camera"></i>
                                    <span>${servico.servicos.join(', ')}</span>
                                </div>
                                
                                ${servico.tempoExecucao ? `
                                    <div class="info-item">
                                        <i class="fas fa-stopwatch"></i>
                                        <span>Tempo: ${servico.tempoExecucao}</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="col-md-4 text-end">
                                <div class="status-actions">
                                    ${this.gerarBotoesAcao(servico)}
                                </div>
                            </div>
                        </div>
                        
                        ${servico.observacoes ? `
                            <div class="mt-2 p-2 bg-light rounded">
                                <small><strong>Observações:</strong> ${servico.observacoes}</small>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    gerarBotoesAcao(servico) {
        let botoes = '';

        switch (servico.status) {
            case 'Agendado':
                botoes = `
                    <button class="btn btn-success btn-sm" onclick="sistemaRegistro.iniciarServico(${servico.id})">
                        <i class="fas fa-play me-1"></i>Iniciar
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="sistemaRegistro.reagendarServico(${servico.id})">
                        <i class="fas fa-calendar-alt me-1"></i>Reagendar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="sistemaRegistro.cancelarServico(${servico.id})">
                        <i class="fas fa-times me-1"></i>Cancelar
                    </button>
                `;
                break;
            case 'Em Andamento':
                botoes = `
                    <button class="btn btn-primary btn-sm" onclick="sistemaRegistro.finalizarServico(${servico.id})">
                        <i class="fas fa-check me-1"></i>Finalizar
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="sistemaRegistro.pausarServico(${servico.id})">
                        <i class="fas fa-pause me-1"></i>Pausar
                    </button>
                `;
                break;
            case 'Realizado':
            case 'Cancelado':
                botoes = `
                    <button class="btn btn-outline-info btn-sm" onclick="sistemaRegistro.visualizarRegistro(${servico.id})">
                        <i class="fas fa-eye me-1"></i>Ver Detalhes
                    </button>
                `;
                break;
        }

        return botoes;
    }

    iniciarServico(servicoId) {
        const servico = this.servicos.find(s => s.id === servicoId);
        if (!servico) return;

        this.servicoAtual = servico;
        this.preencherModalRegistro(servico);
        
        // Definir status como "Em Andamento"
        document.getElementById('statusServico').value = 'Em Andamento';
        
        new bootstrap.Modal(document.getElementById('modalRegistro')).show();
    }

    finalizarServico(servicoId) {
        const servico = this.servicos.find(s => s.id === servicoId);
        if (!servico) return;

        this.servicoAtual = servico;
        this.preencherModalRegistro(servico);
        
        // Definir status como "Realizado"
        document.getElementById('statusServico').value = 'Realizado';
        
        new bootstrap.Modal(document.getElementById('modalRegistro')).show();
    }

    reagendarServico(servicoId) {
        const servico = this.servicos.find(s => s.id === servicoId);
        if (!servico) return;

        this.servicoAtual = servico;
        this.preencherModalRegistro(servico);
        
        // Definir status como "Reagendar"
        document.getElementById('statusServico').value = 'Reagendar';
        this.toggleCamposReagendamento(true);
        
        new bootstrap.Modal(document.getElementById('modalRegistro')).show();
    }

    cancelarServico(servicoId) {
        const servico = this.servicos.find(s => s.id === servicoId);
        if (!servico) return;

        if (confirm(`Tem certeza que deseja cancelar o serviço para ${servico.cliente}?`)) {
            this.servicoAtual = servico;
            this.preencherModalRegistro(servico);
            
            // Definir status como "Cancelado"
            document.getElementById('statusServico').value = 'Cancelado';
            
            new bootstrap.Modal(document.getElementById('modalRegistro')).show();
        }
    }

    preencherModalRegistro(servico) {
        document.getElementById('servicoId').value = servico.id;
        document.getElementById('infoCliente').textContent = servico.cliente;
        document.getElementById('infoEndereco').textContent = servico.endereco;
        document.getElementById('infoDataHora').textContent = `${this.formatarData(servico.data)} às ${servico.horario}`;
        document.getElementById('infoServicos').textContent = servico.servicos.join(', ');
        
        // Gerar checklist baseado nos serviços
        this.gerarChecklist(servico.servicos);
        
        // Limpar campos
        document.getElementById('statusServico').value = '';
        document.getElementById('horaFinalizacao').value = '';
        document.getElementById('observacoesServico').value = '';
        this.toggleCamposReagendamento(false);
        
        // Resetar cronômetro
        this.resetarCronometro();
        
        // Limpar fotos
        this.fotosUpload = [];
        document.getElementById('previewFotos').innerHTML = '';
    }

    gerarChecklist(servicos) {
        const container = document.getElementById('checklistAtividades');
        const atividades = {
            'Fotos': [
                'Configurar equipamento fotográfico',
                'Verificar iluminação dos ambientes',
                'Fotografar todos os cômodos',
                'Capturar detalhes importantes',
                'Verificar qualidade das fotos'
            ],
            'Vídeo': [
                'Configurar equipamento de vídeo',
                'Planejar roteiro de gravação',
                'Gravar tour completo',
                'Verificar áudio e estabilização',
                'Revisar material gravado'
            ],
            'Drone': [
                'Verificar condições climáticas',
                'Configurar drone e câmera',
                'Capturar vista aérea da propriedade',
                'Fotografar entorno e localização',
                'Verificar qualidade das imagens aéreas'
            ],
            'Planta': [
                'Medir dimensões dos ambientes',
                'Esboçar layout da propriedade',
                'Verificar medidas com cliente',
                'Documentar características especiais'
            ]
        };

        let checklistHTML = '';
        servicos.forEach(servico => {
            if (atividades[servico]) {
                checklistHTML += `<h6 class="mt-3 mb-2"><i class="fas fa-camera me-2"></i>${servico}</h6>`;
                atividades[servico].forEach((atividade, index) => {
                    checklistHTML += `
                        <div class="checklist-item">
                            <input type="checkbox" id="atividade_${servico}_${index}" 
                                   onchange="sistemaRegistro.atualizarProgresso()">
                            <label for="atividade_${servico}_${index}">${atividade}</label>
                        </div>
                    `;
                });
            }
        });

        container.innerHTML = checklistHTML;
    }

    atualizarProgresso() {
        const checkboxes = document.querySelectorAll('#checklistAtividades input[type="checkbox"]');
        const marcados = document.querySelectorAll('#checklistAtividades input[type="checkbox"]:checked');
        
        const progresso = checkboxes.length > 0 ? (marcados.length / checkboxes.length) * 100 : 0;
        
        // Atualizar anel de progresso
        const circle = document.querySelector('.progress-ring-circle');
        const circumference = 2 * Math.PI * 25; // raio = 25
        const offset = circumference - (progresso / 100) * circumference;
        
        circle.style.strokeDashoffset = offset;
        
        // Mudar cor baseada no progresso
        if (progresso === 100) {
            circle.style.stroke = '#28a745'; // Verde
        } else if (progresso >= 50) {
            circle.style.stroke = '#ffc107'; // Amarelo
        } else {
            circle.style.stroke = '#007bff'; // Azul
        }
    }

    toggleCamposReagendamento(mostrar) {
        const campos = document.getElementById('camposReagendamento');
        campos.style.display = mostrar ? 'block' : 'none';
        
        if (mostrar) {
            // Definir data mínima como amanhã
            const amanha = new Date();
            amanha.setDate(amanha.getDate() + 1);
            document.getElementById('novaData').min = amanha.toISOString().split('T')[0];
        }
    }

    // Cronômetro
    iniciarCronometro() {
        if (!this.cronometro.iniciado) {
            this.cronometro.tempoInicio = Date.now() - this.cronometro.tempoDecorrido;
            this.cronometro.iniciado = true;
        }
        
        this.cronometro.pausado = false;
        
        this.cronometro.intervalo = setInterval(() => {
            this.cronometro.tempoDecorrido = Date.now() - this.cronometro.tempoInicio;
            this.atualizarDisplayCronometro();
        }, 1000);
        
        document.getElementById('btnIniciar').disabled = true;
        document.getElementById('btnPausar').disabled = false;
        document.getElementById('btnParar').disabled = false;
    }

    pausarCronometro() {
        this.cronometro.pausado = true;
        clearInterval(this.cronometro.intervalo);
        
        document.getElementById('btnIniciar').disabled = false;
        document.getElementById('btnPausar').disabled = true;
    }

    pararCronometro() {
        this.cronometro.pausado = false;
        this.cronometro.iniciado = false;
        clearInterval(this.cronometro.intervalo);
        
        // Definir hora de finalização automaticamente
        const agora = new Date();
        document.getElementById('horaFinalizacao').value = 
            agora.toTimeString().slice(0, 5);
        
        document.getElementById('btnIniciar').disabled = false;
        document.getElementById('btnPausar').disabled = true;
        document.getElementById('btnParar').disabled = true;
    }

    resetarCronometro() {
        clearInterval(this.cronometro.intervalo);
        this.cronometro = {
            iniciado: false,
            pausado: false,
            tempoInicio: null,
            tempoDecorrido: 0,
            intervalo: null
        };
        
        document.getElementById('tempoExecucao').textContent = '00:00:00';
        document.getElementById('btnIniciar').disabled = false;
        document.getElementById('btnPausar').disabled = true;
        document.getElementById('btnParar').disabled = true;
        
        // Resetar anel de progresso
        const circle = document.querySelector('.progress-ring-circle');
        circle.style.strokeDashoffset = 157;
        circle.style.stroke = '#007bff';
    }

    atualizarDisplayCronometro() {
        const horas = Math.floor(this.cronometro.tempoDecorrido / (1000 * 60 * 60));
        const minutos = Math.floor((this.cronometro.tempoDecorrido % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((this.cronometro.tempoDecorrido % (1000 * 60)) / 1000);
        
        const display = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
        document.getElementById('tempoExecucao').textContent = display;
    }

    // Upload de fotos
    configurarUploadFotos() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fotosServico');

        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            this.processarArquivos(files);
        });

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.processarArquivos(files);
        });
    }

    processarArquivos(files) {
        const maxFiles = 10;
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (this.fotosUpload.length + files.length > maxFiles) {
            this.mostrarMensagem(`Máximo de ${maxFiles} fotos permitidas.`, 'warning');
            return;
        }

        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                this.mostrarMensagem(`${file.name} não é uma imagem válida.`, 'warning');
                return;
            }

            if (file.size > maxSize) {
                this.mostrarMensagem(`${file.name} é muito grande. Máximo 5MB.`, 'warning');
                return;
            }

            this.fotosUpload.push(file);
            this.adicionarPreviewFoto(file);
        });
    }

    adicionarPreviewFoto(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.createElement('div');
            preview.className = 'd-inline-block position-relative m-1';
            preview.innerHTML = `
                <img src="${e.target.result}" class="foto-preview" alt="Preview">
                <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0" 
                        onclick="sistemaRegistro.removerFoto('${file.name}')" 
                        style="transform: translate(50%, -50%);">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            document.getElementById('previewFotos').appendChild(preview);
        };
        reader.readAsDataURL(file);
    }

    removerFoto(nomeArquivo) {
        this.fotosUpload = this.fotosUpload.filter(f => f.name !== nomeArquivo);
        
        // Remover preview
        const previews = document.querySelectorAll('#previewFotos .position-relative');
        previews.forEach(preview => {
            const img = preview.querySelector('img');
            if (img && img.alt === 'Preview') {
                preview.remove();
            }
        });
    }

    async salvarRegistro() {
        const form = document.getElementById('formRegistro');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const dados = {
            servicoId: document.getElementById('servicoId').value,
            status: document.getElementById('statusServico').value,
            horaFinalizacao: document.getElementById('horaFinalizacao').value,
            observacoes: document.getElementById('observacoesServico').value,
            tempoExecucao: document.getElementById('tempoExecucao').textContent,
            fotos: this.fotosUpload
        };

        // Dados específicos para reagendamento
        if (dados.status === 'Reagendar') {
            dados.novaData = document.getElementById('novaData').value;
            dados.novoHorario = document.getElementById('novoHorario').value;
            dados.motivoReagendamento = document.getElementById('motivoReagendamento').value;
        }

        try {
            this.mostrarLoading('Salvando registro...');

            // Simular salvamento
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Atualizar serviço local
            const servico = this.servicos.find(s => s.id == dados.servicoId);
            if (servico) {
                servico.status = dados.status;
                servico.observacoes = dados.observacoes;
                servico.tempoExecucao = dados.tempoExecucao;
                servico.horaFinalizacao = dados.horaFinalizacao;
                
                if (dados.status === 'Reagendar') {
                    servico.novaData = dados.novaData;
                    servico.novoHorario = dados.novoHorario;
                    servico.motivoReagendamento = dados.motivoReagendamento;
                }
            }

            // Fechar modal
            bootstrap.Modal.getInstance(document.getElementById('modalRegistro')).hide();

            // Atualizar interface
            this.atualizarEstatisticas();
            this.aplicarFiltros();

            this.mostrarMensagem('Registro salvo com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao salvar registro:', error);
            this.mostrarMensagem('Erro ao salvar registro.', 'error');
        } finally {
            this.esconderLoading();
        }
    }

    visualizarRegistro(servicoId) {
        const servico = this.servicos.find(s => s.id === servicoId);
        if (!servico) return;

        const content = document.getElementById('visualizarRegistroContent');
        content.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="fas fa-user me-2"></i>Cliente</h6>
                    <p>${servico.cliente}</p>
                    
                    <h6><i class="fas fa-calendar me-2"></i>Data e Horário</h6>
                    <p>${this.formatarData(servico.data)} às ${servico.horario}</p>
                    
                    <h6><i class="fas fa-camera me-2"></i>Serviços</h6>
                    <p>${servico.servicos.join(', ')}</p>
                    
                    <h6><i class="fas fa-flag me-2"></i>Status</h6>
                    <p><span class="badge ${this.getStatusColor(servico.status)}">${servico.status}</span></p>
                </div>
                
                <div class="col-md-6">
                    <h6><i class="fas fa-map-marker-alt me-2"></i>Endereço</h6>
                    <p>${servico.endereco}</p>
                    
                    ${servico.tempoExecucao ? `
                        <h6><i class="fas fa-stopwatch me-2"></i>Tempo de Execução</h6>
                        <p>${servico.tempoExecucao}</p>
                    ` : ''}
                    
                    ${servico.horaFinalizacao ? `
                        <h6><i class="fas fa-clock me-2"></i>Hora de Finalização</h6>
                        <p>${servico.horaFinalizacao}</p>
                    ` : ''}
                </div>
            </div>
            
            ${servico.observacoes ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <h6><i class="fas fa-sticky-note me-2"></i>Observações</h6>
                        <div class="alert alert-info">
                            ${servico.observacoes}
                        </div>
                    </div>
                </div>
            ` : ''}
            
            ${servico.motivoReagendamento ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <h6><i class="fas fa-exclamation-triangle me-2"></i>Motivo do Reagendamento</h6>
                        <div class="alert alert-warning">
                            ${servico.motivoReagendamento}
                        </div>
                    </div>
                </div>
            ` : ''}
        `;

        new bootstrap.Modal(document.getElementById('modalVisualizarRegistro')).show();
    }

    // Métodos utilitários
    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    formatarData(data) {
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    getStatusClass(status) {
        const classes = {
            'Realizado': 'servico-realizado',
            'Agendado': 'servico-pendente',
            'Em Andamento': 'servico-pendente',
            'Cancelado': 'servico-cancelado'
        };
        return classes[status] || '';
    }

    getStatusColor(status) {
        const cores = {
            'Agendado': 'bg-warning text-dark',
            'Em Andamento': 'bg-info',
            'Realizado': 'bg-success',
            'Cancelado': 'bg-danger',
            'Reagendar': 'bg-secondary'
        };
        return cores[status] || 'bg-secondary';
    }

    mostrarMensagem(mensagem, tipo) {
        if (window.mostrarMensagem) {
            window.mostrarMensagem(mensagem, tipo);
        } else {
            alert(mensagem);
        }
    }

    mostrarLoading(mensagem) {
        if (window.mostrarLoading) {
            window.mostrarLoading(mensagem);
        }
    }

    esconderLoading() {
        if (window.esconderLoading) {
            window.esconderLoading();
        }
    }
}

// Funções globais
function atualizarDados() {
    if (sistemaRegistro) {
        sistemaRegistro.carregarDados();
    }
}

function logout() {
    if (sistemaRegistro) {
        sistemaRegistro.logout();
    }
}

// Inicializar sistema
let sistemaRegistro;
document.addEventListener('DOMContentLoaded', function() {
    sistemaRegistro = new SistemaRegistro();
});