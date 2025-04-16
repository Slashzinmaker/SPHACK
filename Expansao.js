// == CONFIGURAÇÃO PRINCIPAL == //
const CONFIG = {
  apiEndpoint: "https://scripts.dataharley.online/api.php?Pergunta=",
  timeoutAPI: 10000,              // 10 segundos timeout para API
  defaultMinTime: 15000,          // 15 segundos mínimo por tarefa
  defaultMaxTime: 30000           // 30 segundos máximo por tarefa
};

// == ELEMENTOS DA INTERFACE == //
let menuInterface;
let tempoMinimoInput;
let tempoMaximoInput;

// == VARIÁVEIS DE CONTROLE == //
let tarefasDisponiveis = [];
let tempoMinimo = CONFIG.defaultMinTime;
let tempoMaximo = CONFIG.defaultMaxTime;

// == FUNÇÃO PRINCIPAL - INICIALIZAÇÃO == //
function iniciarScript() {
  if (!validarAmbienteMoodle()) return;
  
  // Remover interface anterior se existir
  if (document.getElementById('auto-task-menu')) {
    document.getElementById('auto-task-menu').remove();
  }

  // Identificar tarefas disponíveis
  tarefasDisponiveis = identificarTarefas();
  
  if (tarefasDisponiveis.length === 0) {
    showToast("Nenhuma tarefa encontrada!", "error", 5000);
    return;
  }

  // Criar interface
  criarInterfaceSelecao();
}

// == FUNÇÕES DE INTERFACE == //

function criarInterfaceSelecao() {
  // Criar container principal
  menuInterface = document.createElement('div');
  menuInterface.id = 'auto-task-menu';
  menuInterface.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(0,0,0,0.3);
    z-index: 99999;
    max-width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    font-family: Arial, sans-serif;
  `;

  // Título
  const titulo = document.createElement('h3');
  titulo.textContent = 'Seletor de Tarefas Automático';
  titulo.style.marginTop = '0';
  menuInterface.appendChild(titulo);

  // Controles de tempo
  const tempoContainer = document.createElement('div');
  tempoContainer.style.margin = '15px 0';
  
  const tempoLabel = document.createElement('label');
  tempoLabel.textContent = 'Tempo por tarefa (segundos): ';
  tempoLabel.style.marginRight = '10px';
  tempoContainer.appendChild(tempoLabel);

  const minLabel = document.createElement('span');
  minLabel.textContent = 'Mín:';
  minLabel.style.margin = '0 5px';
  tempoContainer.appendChild(minLabel);

  tempoMinimoInput = document.createElement('input');
  tempoMinimoInput.type = 'number';
  tempoMinimoInput.value = CONFIG.defaultMinTime / 1000;
  tempoMinimoInput.min = '5';
  tempoMinimoInput.max = '120';
  tempoMinimoInput.style.width = '50px';
  tempoContainer.appendChild(tempoMinimoInput);

  const maxLabel = document.createElement('span');
  maxLabel.textContent = 'Máx:';
  maxLabel.style.margin = '0 5px';
  tempoContainer.appendChild(maxLabel);

  tempoMaximoInput = document.createElement('input');
  tempoMaximoInput.type = 'number';
  tempoMaximoInput.value = CONFIG.defaultMaxTime / 1000;
  tempoMaximoInput.min = '10';
  tempoMaximoInput.max = '180';
  tempoMaximoInput.style.width = '50px';
  tempoContainer.appendChild(tempoMaximoInput);

  menuInterface.appendChild(tempoContainer);

  // Lista de tarefas
  const listaTarefas = document.createElement('div');
  listaTarefas.style.margin = '15px 0';
  
  tarefasDisponiveis.forEach((tarefa, index) => {
    const container = document.createElement('div');
    container.style.marginBottom = '10px';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `task-${index}`;
    checkbox.checked = true;
    checkbox.style.marginRight = '10px';
    
    const label = document.createElement('label');
    label.htmlFor = `task-${index}`;
    label.textContent = `${tarefa.tipo}: ${tarefa.titulo.substring(0, 50)}${tarefa.titulo.length > 50 ? '...' : ''}`;
    
    container.appendChild(checkbox);
    container.appendChild(label);
    listaTarefas.appendChild(container);
  });

  menuInterface.appendChild(listaTarefas);

  // Botões de ação
  const botoesContainer = document.createElement('div');
  botoesContainer.style.display = 'flex';
  botoesContainer.style.justifyContent = 'space-between';
  botoesContainer.style.marginTop = '20px';

  const btnSelecionadas = document.createElement('button');
  btnSelecionadas.textContent = 'Fazer Tarefas Selecionadas';
  btnSelecionadas.style.padding = '10px 15px';
  btnSelecionadas.style.background = '#4CAF50';
  btnSelecionadas.style.color = 'white';
  btnSelecionadas.style.border = 'none';
  btnSelecionadas.style.borderRadius = '5px';
  btnSelecionadas.style.cursor = 'pointer';
  btnSelecionadas.onclick = () => {
    tempoMinimo = tempoMinimoInput.value * 1000;
    tempoMaximo = tempoMaximoInput.value * 1000;
    executarTarefasSelecionadas();
  };

  const btnTodas = document.createElement('button');
  btnTodas.textContent = 'Fazer Todas Tarefas';
  btnTodas.style.padding = '10px 15px';
  btnTodas.style.background = '#2196F3';
  btnTodas.style.color = 'white';
  btnTodas.style.border = 'none';
  btnTodas.style.borderRadius = '5px';
  btnTodas.style.cursor = 'pointer';
  btnTodas.onclick = () => {
    tempoMinimo = tempoMinimoInput.value * 1000;
    tempoMaximo = tempoMaximoInput.value * 1000;
    executarTodasTarefas();
  };

  botoesContainer.appendChild(btnSelecionadas);
  botoesContainer.appendChild(btnTodas);
  menuInterface.appendChild(botoesContainer);

  // Botão de fechar
  const btnFechar = document.createElement('button');
  btnFechar.textContent = 'Fechar';
  btnFechar.style.marginTop = '15px';
  btnFechar.style.padding = '8px 12px';
  btnFechar.style.background = '#f44336';
  btnFechar.style.color = 'white';
  btnFechar.style.border = 'none';
  btnFechar.style.borderRadius = '5px';
  btnFechar.style.cursor = 'pointer';
  btnFechar.onclick = () => menuInterface.remove();
  menuInterface.appendChild(btnFechar);

  // Adicionar ao documento
  document.body.appendChild(menuInterface);

  // Overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 99998;
  `;
  overlay.id = 'auto-task-overlay';
  overlay.onclick = () => {
    menuInterface.remove();
    overlay.remove();
  };
  document.body.appendChild(overlay);
}

// == FUNÇÕES DE EXECUÇÃO == //

async function executarTarefasSelecionadas() {
  // Fechar menu
  document.getElementById('auto-task-menu').remove();
  document.getElementById('auto-task-overlay').remove();

  // Obter tarefas selecionadas
  const tarefasSelecionadas = [];
  
  tarefasDisponiveis.forEach((tarefa, index) => {
    const checkbox = document.getElementById(`task-${index}`);
    if (checkbox && checkbox.checked) {
      tarefasSelecionadas.push(tarefa);
    }
  });

  if (tarefasSelecionadas.length === 0) {
    showToast("Nenhuma tarefa selecionada!", "warning", 3000);
    return;
  }

  // Executar tarefas
  await executarTarefas(tarefasSelecionadas);
}

async function executarTodasTarefas() {
  // Fechar menu
  document.getElementById('auto-task-menu').remove();
  document.getElementById('auto-task-overlay').remove();

  // Executar todas as tarefas
  await executarTarefas(tarefasDisponiveis);
}

async function executarTarefas(tarefas) {
  showToast(`⏳ Iniciando ${tarefas.length} tarefas...`, "info", 3000);

  for (const [index, tarefa] of tarefas.entries()) {
    const inicio = new Date();
    
    try {
      showToast(`🔍 Processando tarefa ${index+1}/${tarefas.length}...`, "info", 2000);

      // Tempo mínimo de processamento
      const tempoProcessamento = Math.floor(
        Math.random() * (tempoMaximo - tempoMinimo) + tempoMinimo
      );
      
      // Executar ação conforme o tipo de tarefa
      if (tarefa.tipo === 'Questionário') {
        await responderQuestionario(tarefa.url, tempoProcessamento);
      } else {
        await marcarTarefaComoConcluida(tarefa.url, tempoProcessamento);
      }

      showToast(`✅ Tarefa ${index+1} concluída!`, "success", 2000);

    } catch (erro) {
      console.error(`Erro na tarefa ${index+1}:`, erro);
      showToast(`⚠️ Erro na tarefa ${index+1}`, "error", 3000);
    }

    // Aguardar tempo restante se necessário
    const tempoDecorrido = new Date() - inicio;
    if (tempoDecorrido < tempoMinimo) {
      const tempoRestante = tempoMinimo - tempoDecorrido;
      await delay(tempoRestante);
    }

    // Delay entre tarefas
    if (index < tarefas.length - 1) {
      const delayEntreTarefas = Math.floor(Math.random() * 5000) + 5000; // 5-10 segundos
      await delay(delayEntreTarefas);
    }
  }

  showToast("🎉 Todas tarefas concluídas!", "success", 5000);
}

// == FUNÇÕES ESPECÍFICAS == //

function identificarTarefas() {
  const tarefas = [];
  
  // Identificar questionários
  document.querySelectorAll('li.activity.modtype_quiz').forEach(quiz => {
    const link = quiz.querySelector('a.aalink');
    if (link) {
      tarefas.push({
        tipo: 'Questionário',
        titulo: link.textContent.trim(),
        url: link.href
      });
    }
  });

  // Identificar tarefas simples
  document.querySelectorAll('li.activity.modtype_resource').forEach(resource => {
    const link = resource.querySelector('a.aalink');
    if (link) {
      tarefas.push({
        tipo: 'Material',
        titulo: link.textContent.trim(),
        url: link.href
      });
    }
  });

  return tarefas;
}

async function responderQuestionario(url, tempoProcessamento) {
  const inicio = new Date();
  
  try {
    // 1. Acessar questionário
    const response = await fetch(url, { credentials: 'include' });
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 2. Extrair dados
    const pergunta = doc.querySelector('.qtext')?.textContent.trim() || "";
    const alternativas = Array.from(doc.querySelectorAll('.answer input[type="radio"]'))
      .map(input => ({
        elemento: input,
        texto: input.closest('.answer')?.textContent.trim() || "",
        valor: input.value
      }))
      .filter(alt => alt.texto.length > 0);

    if (!pergunta || alternativas.length === 0) {
      throw new Error("Dados da questão não encontrados");
    }

    // 3. Consultar IA
    const respostaIA = await consultarIA(pergunta, alternativas);
    const alternativaCorreta = processarRespostaIA(respostaIA, alternativas);
    
    if (!alternativaCorreta) {
      throw new Error("Resposta da IA inválida");
    }

    // 4. Selecionar resposta
    await selecionarResposta(alternativaCorreta);

    // 5. Aguardar tempo mínimo
    const tempoDecorrido = new Date() - inicio;
    if (tempoDecorrido < tempoProcessamento) {
      await delay(tempoProcessamento - tempoDecorrido);
    }

  } catch (erro) {
    throw erro;
  }
}

async function marcarTarefaComoConcluida(url, tempoProcessamento) {
  const inicio = new Date();
  
  try {
    // Simular acesso à tarefa
    await fetch(url, { credentials: 'include' });
    
    // Aguardar tempo mínimo
    const tempoDecorrido = new Date() - inicio;
    if (tempoDecorrido < tempoProcessamento) {
      await delay(tempoProcessamento - tempoDecorrido);
    }
  } catch (erro) {
    throw erro;
  }
}

// == FUNÇÕES UTILITÁRIAS == //

function validarAmbienteMoodle() {
  return !!document.querySelector('.que.multichoice') || 
         !!document.querySelector('li.activity.modtype_quiz');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showToast(mensagem, tipo = "info", duracao = 4000) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    background: ${{
      info: "#17a2b8",
      success: "#28a745",
      warning: "#ffc107",
      error: "#dc3545"
    }[tipo]};
    color: white;
    border-radius: 4px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: Arial, sans-serif;
    font-size: 14px;
    max-width: 300px;
    animation: toastIn 0.4s ease-out;
  `;
  toast.textContent = mensagem;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastOut 0.4s ease-in forwards";
    setTimeout(() => toast.remove(), 400);
  }, duracao);

  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes toastIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes toastOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
      }
    `;
    document.head.appendChild(style);
  }
}

// == INICIALIZAÇÃO == //
iniciarScript();
