// == CONFIGURAÇÕES PRINCIPAIS == //
const CONFIG = {
  apiEndpoint: "https://scripts.dataharley.online/api.php?Pergunta=",
  delayEntreQuestoes: 20000,      // 20 segundos entre questões (parecer humano)
  delayAntesEnvio: 5000,          // 5 segundos antes de enviar
  tentativasMaximas: 1,           // Não refaz questões
  timeoutAPI: 10000               // 10 segundos timeout para API
};

// == SISTEMA DE VERIFICAÇÃO == //
const relatorio = {
  inicio: new Date(),
  totalQuestoes: 0,
  respondidas: 0,
  erros: 0,
  detalhes: []
};

// == FUNÇÃO PRINCIPAL == //
async function responderQuestionario() {
  try {
    // 1. Validação do ambiente
    if (!validarAmbienteMoodle()) return;

    // 2. Identificação das questões
    const questoes = identificarQuestoesMoodle();
    relatorio.totalQuestoes = questoes.length;

    if (questoes.length === 0) {
      showToast("Nenhuma questão encontrada!", "error", 5000);
      return;
    }

    showToast(`🔍 Encontradas ${questoes.length} questões. Iniciando...`, "info", 5000);

    // 3. Processamento rigoroso
    for (const [index, questao] of questoes.entries()) {
      await processarQuestaoComIA(questao, index);
      
      // Delay humanizado entre questões
      if (index < questoes.length - 1) {
        await delay(CONFIG.delayEntreQuestoes + Math.random() * 5000);
      }
    }

    // 4. Relatório final
    exibirRelatorioIA();
    showToast("✅ Processo concluído com respostas baseadas na IA!", "success", 8000);

  } catch (erro) {
    console.error("Erro no processamento:", erro);
    showToast("❌ Ocorreu um erro - Verifique o console", "error", 8000);
  }
}

// == FUNÇÕES DE PROCESSAMENTO == //

async function processarQuestaoComIA(questao, index) {
  const registro = {
    questao: "",
    status: "",
    tempo: 0
  };

  const inicio = new Date();

  try {
    // 1. Extração precisa dos dados
    const { pergunta, alternativas } = extrairDadosMoodle(questao);
    registro.questao = pergunta.substring(0, 100) + (pergunta.length > 100 ? "..." : "");

    showToast(`🧠 Consultando IA: Questão ${index+1}...`, "info", 3000);

    // 2. Consulta à IA com timeout
    const respostaIA = await Promise.race([
      consultarIA(pergunta, alternativas),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout na API")), CONFIG.timeoutAPI)
    ]);

    // 3. Processamento rigoroso da resposta
    const alternativaCorreta = processarRespostaIA(respostaIA, alternativas);
    
    if (!alternativaCorreta) {
      throw new Error("IA não retornou resposta válida");
    }

    // 4. Seleção segura
    await selecionarResposta(alternativaCorreta);
    registro.status = "✅ Respondida pela IA";
    relatorio.respondidas++;

  } catch (erro) {
    console.error(`Erro na questão ${index+1}:`, erro);
    registro.status = `❌ ${erro.message}`;
    relatorio.erros++;
  } finally {
    registro.tempo = Math.round((new Date() - inicio) / 1000);
    relatorio.detalhes.push(registro);
  }
}

// == FUNÇÕES ESPECÍFICAS MOODLE == //

function validarAmbienteMoodle() {
  if (!document.querySelector('.que.multichoice')) {
    showToast("⚠️ Ambiente Moodle não detectado", "error", 5000);
    return false;
  }
  return true;
}

function identificarQuestoesMoodle() {
  return Array.from(document.querySelectorAll('.que.multichoice'))
    .filter(q => !q.querySelector('.state')?.textContent.includes('Completo'));
}

function extrairDadosMoodle(container) {
  const pergunta = container.querySelector('.qtext')?.textContent.trim() || "";
  
  const alternativas = Array.from(container.querySelectorAll('.answer input[type="radio"]'))
    .map(input => ({
      elemento: input,
      texto: input.closest('.answer')?.textContent.trim() || "",
      valor: input.value
    }))
    .filter(alt => alt.texto.length > 0);

  return { pergunta, alternativas };
}

// == FUNÇÕES DE IA == //

async function consultarIA(pergunta, alternativas) {
  const prompt = `ANÁLISE DE QUESTÃO MOODLE - FORMATO EXATO

  **INSTRUÇÕES:**
  1. Analise a pergunta abaixo
  2. Responda APENAS com o texto EXATO de uma das alternativas fornecidas
  3. Não invente respostas

  **PERGUNTA:**
  ${pergunta}

  **ALTERNATIVAS DISPONÍVEIS:**
  ${alternativas.map(alt => `- ${alt.texto}`).join('\n')}

  **RESPOSTA (TEXTO EXATO DA ALTERNATIVA CORRETA):**`;

  const response = await fetch(`${CONFIG.apiEndpoint}${encodeURIComponent(prompt)}`);
  const data = await response.json();
  
  return data.resposta;
}

function processarRespostaIA(respostaIA, alternativas) {
  if (!respostaIA) return null;

  // Busca exata (case insensitive)
  const alternativaExata = alternativas.find(alt => 
    alt.texto.toLowerCase() === respostaIA.toLowerCase()
  );

  if (alternativaExata) return alternativaExata;

  // Busca por similaridade estrita
  let melhorAlternativa = null;
  let maiorSimilaridade = 0;

  alternativas.forEach(alt => {
    const similaridade = calcularSimilaridade(respostaIA, alt.texto);
    if (similaridade > maiorSimilaridade && similaridade > 0.9) {
      maiorSimilaridade = similaridade;
      melhorAlternativa = alt;
    }
  });

  return melhorAlternativa;
}

function calcularSimilaridade(str1, str2) {
  const normalize = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const tokens1 = new Set(normalize(str1).split(/\W+/));
  const tokens2 = new Set(normalize(str2).split(/\W+/));
  const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
  return intersection.size / Math.max(tokens1.size, tokens2.size);
}

// == FUNÇÕES DE INTERAÇÃO == //

async function selecionarResposta(alternativa) {
  // Clica no container pai (compatibilidade Moodle)
  const container = alternativa.elemento.closest('.answer');
  if (container) {
    container.click();
    await delay(1000);
  }

  // Dispara eventos necessários
  alternativa.elemento.click();
  alternativa.elemento.dispatchEvent(new Event('change', { bubbles: true }));

  // Verificação final
  await delay(2000);
  if (!alternativa.elemento.checked) {
    throw new Error("Falha ao selecionar alternativa");
  }
}

// == UTILITÁRIOS == //

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function exibirRelatorioIA() {
  console.group("📊 RELATÓRIO BASEADO EM IA");
  console.log(`⏱ Tempo total: ${Math.round((new Date() - relatorio.inicio)/1000)}s`);
  console.log(`📚 Questões: ${relatorio.totalQuestoes}`);
  console.log(`✅ Respondidas: ${relatorio.respondidas}`);
  console.log(`❌ Erros: ${relatorio.erros}`);
  
  console.groupCollapsed("🔍 Detalhes");
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

// == INICIALIZAÇÃO == //
setTimeout(() => {
  showToast("🔍 Iniciando processamento rigoroso...", "info", 3000);
  setTimeout(responderQuestionario, 3000);
}, 2000);
