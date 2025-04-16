// == CONFIGURAÇÕES PRINCIPAIS == //
const CONFIG = {
  apiEndpoint: "https://scripts.dataharley.online/api.php?Pergunta=",
  delayMinimo: 15000,             // 15 segundos MÍNIMOS por questão
  delayMaximo: 25000,             // 25 segundos MÁXIMOS por questão
  tentativasMaximas: 2,           // Número de tentativas por questão
  thresholdSimilaridade: 0.85,    // Exige 85% de correspondência
  modoSeguro: true                // Só envia quando tem alta confiança
};

// == BANCO DE RESPOSTAS CONHECIDAS == //
const BANCO_RESPOSTAS = {
  "combinação perfeita entre Ethos, Pathos e Logos": "Um anúncio que usa estatísticas sobre pobreza, a história de uma família necessitada e a credibilidade de uma ONG renomada.",
  // Adicione mais perguntas e respostas conhecidas aqui
};

// == SISTEMA DE RELATÓRIO == //
const relatorio = {
  inicio: new Date(),
  totalQuestoes: 0,
  respondidas: 0,
  precisas: 0,
  revisoesNecessarias: 0,
  detalhes: []
};

// == FUNÇÃO PRINCIPAL == //
async function responderQuestionario() {
  try {
    // 1. Pré-verificação do ambiente
    if (!validarAmbiente()) return;
    
    // 2. Identificação das questões
    const questoes = identificarQuestoes();
    relatorio.totalQuestoes = questoes.length;
    
    if (questoes.length === 0) {
      showToast("Nenhuma questão encontrada!", "error", 5000);
      return;
    }

    showToast(`🔍 Encontradas ${questoes.length} questões. Iniciando...`, "info", 5000);

    // 3. Processamento com timing inteligente
    for (const [index, questao] of questoes.entries()) {
      const tempoInicioQuestao = new Date();
      
      await processarQuestao(questao, index);
      
      // Delay adaptativo entre questões
      const tempoProcessamento = new Date() - tempoInicioQuestao;
      const delayNecessario = Math.max(
        CONFIG.delayMinimo - tempoProcessamento, 
        5000
      );
      
      if (index < questoes.length - 1) {
        showToast(`⏳ Preparando próxima questão (aguarde ${Math.round(delayNecessario/1000)}s)...`, "warning", 3000);
        await delayAleatorio(delayNecessario, CONFIG.delayMaximo);
      }
    }

    // 4. Relatório final
    exibirRelatorioCompleto();
    showToast("🎉 Processo concluído com segurança!", "success", 8000);

  } catch (erro) {
    console.error("Erro no processamento principal:", erro);
    showToast("❌ Ocorreu um erro crítico - Verifique o console", "error", 8000);
  }
}

// == FUNÇÕES DE PROCESSAMENTO == //

async function processarQuestao(questao, index) {
  let resultado = {
    questao: "",
    status: "",
    tentativas: 0,
    tempo: 0
  };

  const tempoInicio = new Date();
  
  try {
    // 1. Extração dos dados
    const { pergunta, alternativas } = extrairDadosQuestao(questao);
    resultado.questao = pergunta.substring(0, 80) + (pergunta.length > 80 ? "..." : "");
    
    // 2. Verificação do banco de respostas
    let respostaCorreta = verificarBancoRespostas(pergunta);
    
    // 3. Consulta à IA se necessário
    if (!respostaCorreta && CONFIG.modoSeguro) {
      showToast(`🤖 Analisando questão ${index+1} com IA...`, "info", 4000);
      respostaCorreta = await consultarIAcomContexto(pergunta, alternativas);
      await delayAleatorio(3000, 5000); // Delay pós-consulta
    }

    // 4. Validação e seleção
    if (respostaCorreta) {
      const alternativa = encontrarMelhorAlternativa(respostaCorreta, alternativas);
      
      if (alternativa) {
        await selecionarAlternativa(alternativa);
        resultado.status = "✅ Resposta precisa";
        relatorio.precisas++;
      } else {
        resultado.status = "⚠️ Resposta não encontrada";
        relatorio.revisoesNecessarias++;
      }
    } else {
      resultado.status = "🔍 Necessita revisão manual";
      relatorio.revisoesNecessarias++;
    }

    relatorio.respondidas++;
    
  } catch (erro) {
    console.error(`Erro na questão ${index+1}:`, erro);
    resultado.status = `❌ Erro: ${erro.message}`;
  } finally {
    resultado.tempo = Math.round((new Date() - tempoInicio)/1000);
    resultado.tentativas++;
    relatorio.detalhes.push(resultado);
    
    showToast(
      `#${index+1} ${resultado.status} (${resultado.tempo}s)`, 
      resultado.status.includes("✅") ? "success" : "warning", 
      4000
    );
  }
}

// == FUNÇÕES AUXILIARES AVANÇADAS == //

function validarAmbiente() {
  if (!document.querySelector('.que.multichoice')) {
    showToast("⚠️ Página não reconhecida como questionário", "error", 5000);
    return false;
  }
  
  if (document.querySelector('#mod_quiz_navblock .thispage')) {
    showToast("⚠️ Conclua a tentativa atual antes", "warning", 5000);
    return false;
  }
  
  return true;
}

function identificarQuestoes() {
  return Array.from(document.querySelectorAll('.que.multichoice'))
    .filter(q => !q.querySelector('.state')?.textContent.includes('Completo'));
}

function extrairDadosQuestao(container) {
  const pergunta = container.querySelector('.qtext')?.textContent.trim() || "Pergunta não identificada";
  
  const alternativas = Array.from(container.querySelectorAll('.answer input[type="radio"]'))
    .map(input => ({
      elemento: input,
      texto: input.closest('.answer')?.textContent.trim() || "",
      valor: input.value
    }))
    .filter(alt => alt.texto.length > 0);

  return { pergunta, alternativas };
}

function verificarBancoRespostas(pergunta) {
  const perguntaNormalizada = pergunta.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "");

  for (const [key, value] of Object.entries(BANCO_RESPOSTAS)) {
    const keyNormalizada = key.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "");

    if (perguntaNormalizada.includes(keyNormalizada) || 
        calcularSimilaridade(perguntaNormalizada, keyNormalizada) > 0.9) {
      return value;
    }
  }
  return null;
}

async function consultarIAcomContexto(pergunta, alternativas) {
  try {
    const prompt = `ANÁLISE DE QUESTÃO - MODO SEGURO\n\n` +
      `Responda APENAS com o texto EXATO da alternativa correta dentre estas opções:\n\n` +
      alternativas.map((alt, i) => `[${i+1}] ${alt.texto}`).join('\n') + 
      `\n\nPergunta: ${pergunta}\n\nResposta:`;
    
    const response = await fetch(`${CONFIG.apiEndpoint}${encodeURIComponent(prompt)}`);
    const data = await response.json();
    
    return data.resposta;
  } catch (error) {
    console.error("Erro na consulta à IA:", error);
    return null;
  }
}

function encontrarMelhorAlternativa(resposta, alternativas) {
  // 1. Busca exata
  const exata = alternativas.find(alt => 
    alt.texto.toLowerCase() === resposta.toLowerCase()
  );
  if (exata) return exata;

  // 2. Busca por inclusão
  const inclusao = alternativas.find(alt => 
    alt.texto.toLowerCase().includes(resposta.toLowerCase()) ||
    resposta.toLowerCase().includes(alt.texto.toLowerCase())
  );
  if (inclusao) return inclusao;

  // 3. Similaridade avançada
  let melhorAlt = null;
  let melhorPontuacao = 0;

  alternativas.forEach(alt => {
    const pontuacao = calcularSimilaridade(resposta, alt.texto);
    if (pontuacao > melhorPontuacao && pontuacao >= CONFIG.thresholdSimilaridade) {
      melhorPontuacao = pontuacao;
      melhorAlt = alt;
    }
  });

  return melhorAlt;
}

function calcularSimilaridade(str1, str2) {
  const set1 = new Set(str1.toLowerCase().split(/\W+/));
  const set2 = new Set(str2.toLowerCase().split(/\W+/));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  return intersection.size / Math.max(set1.size, set2.size);
}

async function selecionarAlternativa(alternativa) {
  // Clica no container pai para garantir registro
  const container = alternativa.elemento.closest('.answer');
  if (container) {
    container.click();
    await delayAleatorio(500, 1000);
  }

  // Dispara eventos necessários
  alternativa.elemento.click();
  alternativa.elemento.dispatchEvent(new Event('change', { bubbles: true }));
  alternativa.elemento.dispatchEvent(new Event('click', { bubbles: true }));
  
  // Verificação final
  await delayAleatorio(2000, 3000);
  if (!alternativa.elemento.checked) {
    throw new Error("Alternativa não foi marcada corretamente");
  }
}

function delayAleatorio(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// == RELATÓRIO E INTERFACE == //

function exibirRelatorioCompleto() {
  console.group("📊 RELATÓRIO DETALHADO - MOODLE EXPANSÃO");
  console.log(`⏱ Tempo total: ${Math.round((new Date() - relatorio.inicio)/1000)}s`);
  console.log(`📝 Questões encontradas: ${relatorio.totalQuestoes}`);
  console.log(`✅ Respondidas com precisão: ${relatorio.precisas}`);
  console.log(`⚠️ Necessitam revisão: ${relatorio.revisoesNecessarias}`);
  
  console.groupCollapsed("🔍 Detalhes por questão");
  relatorio.detalhes.forEach((item, i) => {
    console.log(
      `#${i+1} (${item.tempo}s) ${item.status}\n` +
      `"${item.questao}"\n` +
      "―".repeat(80)
    );
  });
  console.groupEnd();
  console.groupEnd();
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

// == INICIALIZAÇÃO SEGURA == //
setTimeout(() => {
  showToast("🔍 Iniciando processamento seguro...", "info", 3000);
  setTimeout(responderQuestionario, 3000);
}, 2000);
