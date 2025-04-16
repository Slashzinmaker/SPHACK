// == CONFIGURAÇÕES PRINCIPAIS == //
const CONFIG = {
  apiEndpoint: "https://scripts.dataharley.online/api.php?Pergunta=",
  delayEntreQuestoes: 7000,       // 7 segundos entre questões
  delayAntesEnvio: 4000,          // 4 segundos antes de enviar
  tentativasMaximas: 2,           // Número de tentativas por questão
  thresholdSimilaridade: 0.75     // Exige 75% de correspondência
};

// == SISTEMA DE RELATÓRIO == //
const relatorio = {
  totalQuestoes: 0,
  acertos: 0,
  erros: 0,
  detalhes: []
};

// == FUNÇÃO PRINCIPAL == //
async function responderQuestionario() {
  showToast("🔍 Analisando estrutura da página...", "info", 3000);
  
  // Identifica todas as questões do tipo "Pause e responda"
  const questoes = identificarQuestoesExpansao();
  relatorio.totalQuestoes = questoes.length;
  
  if (questoes.length === 0) {
    showToast("Nenhuma questão encontrada!", "error", 3000);
    return;
  }

  showToast(`Encontradas ${questoes.length} questões`, "success", 2000);

  // Processa cada questão com tratamento de erro
  for (const [index, questao] of questoes.entries()) {
    let tentativa = 1;
    let sucesso = false;
    
    while (tentativa <= CONFIG.tentativasMaximas && !sucesso) {
      try {
        showToast(`📝 Processando questão ${index+1}/${questoes.length} (Tentativa ${tentativa})`, "warning", 3500);
        
        // Extrai dados específicos do formato Expansão
        const { pergunta, alternativas } = extrairDadosQuestaoExpansao(questao);
        
        // Consulta a API com contexto específico
        const respostaIA = await consultarIAcomContexto(pergunta, alternativas);
        if (!respostaIA) throw new Error("IA não retornou resposta válida");
        
        // Encontra a melhor correspondência
        const melhorAlternativa = encontrarMelhorMatchExpansao(respostaIA, alternativas);
        if (!melhorAlternativa) throw new Error("Nenhuma alternativa satisfatória");
        
        // Seleção e verificação robusta
        await selecionarAlternativaExpansao(melhorAlternativa);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayAntesEnvio));
        
        // Verificação final antes do envio
        if (!verificarSelecaoExpansao(melhorAlternativa)) {
          throw new Error("Falha na verificação pós-seleção");
        }
        
        // Registra sucesso
        relatorio.acertos++;
        relatorio.detalhes.push({
          questao: pergunta.substring(0, 100) + (pergunta.length > 100 ? "..." : ""),
          resposta: melhorAlternativa.texto.substring(0, 50) + (melhorAlternativa.texto.length > 50 ? "..." : ""),
          status: "✅ Acerto"
        });
        
        sucesso = true;
        showToast(`✔️ Questão ${index+1} respondida!`, "success", 3000);
        
      } catch (error) {
        console.error(`Erro na tentativa ${tentativa}:`, error);
        relatorio.erros++;
        tentativa++;
        
        if (tentativa > CONFIG.tentativasMaximas) {
          relatorio.detalhes.push({
            questao: "Questão " + (index+1),
            resposta: "N/A",
            status: "❌ Falha após todas tentativas"
          });
          showToast(`⚠️ Questão ${index+1} não respondida`, "error", 3000);
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // Aguarda antes da próxima questão
    if (index < questoes.length - 1) {
      const delayAleatorio = CONFIG.delayEntreQuestoes + Math.floor(Math.random() * 3000);
      await new Promise(resolve => setTimeout(resolve, delayAleatorio));
    }
  }
  
  // Exibe relatório final
  exibirRelatorioFinal();
  showToast("🎉 Processo concluído! Verifique o console para detalhes.", "success", 5000);
}

// == FUNÇÕES ESPECÍFICAS PARA MOODLE EXPANSÃO == //

// Identifica questões no formato Expansão
function identificarQuestoesExpansao() {
  const secoes = Array.from(document.querySelectorAll('h2')).filter(h2 => 
    h2.textContent.includes("Pause e responda")
  );
  
  return secoes.map(secao => {
    const container = secao.closest('.activity') || secao.nextElementSibling;
    return container?.querySelector('.que.multichoice') || container;
  }).filter(Boolean);
}

// Extrai dados do formato específico Expansão
function extrairDadosQuestaoExpansao(container) {
  // Extrai o texto principal da pergunta
  const perguntaElement = container.querySelector('.qtext') || 
                         container.querySelector('.question-text');
  const pergunta = perguntaElement?.textContent.trim() || "Pergunta não identificada";
  
  // Extrai alternativas no formato Expansão
  const alternativas = Array.from(container.querySelectorAll('.answer input[type="radio"]')).map(input => {
    const label = input.closest('.answer')?.querySelector('label') ||
                 document.querySelector(`label[for="${input.id}"]`);
    
    return {
      elemento: input,
      texto: label?.textContent.trim() || "",
      valor: input.value
    };
  }).filter(alt => alt.texto); // Remove alternativas vazias

  return { pergunta, alternativas };
}

// Consulta IA com contexto específico para o Moodle Expansão
async function consultarIAcomContexto(pergunta, alternativas) {
  try {
    showToast("🧠 Consultando IA...", "info", 2000);
    
    // Formata o prompt para o formato Expansão
    const prompt = `ANÁLISE DE QUESTÃO MOODLE EXPANSÃO - FORMATO "PAUSE E RESPONDA"
    
    **INSTRUÇÕES:**
    1. Analise a pergunta e alternativas
    2. Responda APENAS com o número da alternativa correta (1, 2, 3...)
    3. Se não tiver certeza, responda "0"
    
    **PERGUNTA:**
    ${pergunta}
    
    **ALTERNATIVAS:**
    ${alternativas.map((alt, i) => `${i+1}. ${alt.texto}`).join('\n')}
    
    **RESPOSTA (APENAS NÚMERO):**`;
    
    const response = await fetch(`${CONFIG.apiEndpoint}${encodeURIComponent(prompt)}`);
    const data = await response.json();
    
    // Processa resposta da API
    const respostaNumerica = parseInt(data.resposta.match(/\d+/)?.[0] || "0");
    if (respostaNumerica > 0 && respostaNumerica <= alternativas.length) {
      return alternativas[respostaNumerica-1].texto;
    }
    
    return null;
  } catch (error) {
    console.error("Erro na consulta à IA:", error);
    return null;
  }
}

// Algoritmo de matching otimizado para o Expansão
function encontrarMelhorMatchExpansao(respostaIA, alternativas) {
  // Primeiro: busca por correspondência exata
  for (const alt of alternativas) {
    if (respostaIA.toLowerCase() === alt.texto.toLowerCase()) {
      return alt;
    }
  }
  
  // Segundo: busca por inclusão
  for (const alt of alternativas) {
    if (respostaIA.toLowerCase().includes(alt.texto.toLowerCase()) || 
        alt.texto.toLowerCase().includes(respostaIA.toLowerCase())) {
      return alt;
    }
  }
  
  // Terceiro: calcula similaridade avançada
  let melhorAlternativa = null;
  let maiorPontuacao = 0;

  alternativas.forEach(alt => {
    const pontuacao = calcularSimilaridadeAvancada(respostaIA, alt.texto);
    if (pontuacao > maiorPontuacao && pontuacao >= CONFIG.thresholdSimilaridade) {
      maiorPontuacao = pontuacao;
      melhorAlternativa = alt;
    }
  });

  return melhorAlternativa;
}

// Seleção robusta no DOM do Expansão
async function selecionarAlternativaExpansao(alternativa) {
  // Clica no elemento pai (compatibilidade com o formato Expansão)
  const container = alternativa.elemento.closest('.answer') || 
                   alternativa.elemento.parentElement;
  
  if (container) container.click();
  
  // Dispara eventos necessários
  alternativa.elemento.dispatchEvent(new Event('change', { bubbles: true }));
  alternativa.elemento.dispatchEvent(new Event('click', { bubbles: true }));
  
  await new Promise(resolve => setTimeout(resolve, 1500));
}

// Verificação reforçada de seleção
function verificarSelecaoExpansao(alternativa) {
  // Verifica de 3 formas diferentes
  return alternativa.elemento.checked || 
         document.querySelector(`input[type="radio"][value="${alternativa.valor}"]:checked`) ||
         alternativa.elemento.closest('.answer')?.classList.contains('selected');
}

// == FUNÇÕES AUXILIARES AVANÇADAS == //

// Algoritmo de similaridade melhorado
function calcularSimilaridadeAvancada(str1, str2) {
  // Normalização avançada
  const normalize = (str) => {
    return str.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/\b(e|a|o|os|as|do|da|dos|das|de|um|uma)\b/g, "") // Remove stopwords
      .replace(/[^\w\s]/g, ""); // Remove pontuação
  };

  const str1Norm = normalize(str1);
  const str2Norm = normalize(str2);

  // Tokenização
  const tokens1 = new Set(str1Norm.split(/\s+/));
  const tokens2 = new Set(str2Norm.split(/\s+/));

  // Cálculo de interseção
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);

  // Ponderação por tamanho
  const sizeWeight = 1 - Math.abs(tokens1.size - tokens2.size) / Math.max(tokens1.size, tokens2.size);
  
  return (intersection.size / union.size) * 0.7 + sizeWeight * 0.3;
}

// Exibe relatório detalhado no console
function exibirRelatorioFinal() {
  console.group("📊 RELATÓRIO DETALHADO - MOODLE EXPANSÃO");
  console.log(`📝 Total de questões: ${relatorio.totalQuestoes}`);
  console.log(`✅ Acertos: ${relatorio.acertos} (${((relatorio.acertos/relatorio.totalQuestoes)*100}%)`);
  console.log(`❌ Erros: ${relatorio.erros}`);
  
  console.groupCollapsed("🔍 Detalhes por questão");
  relatorio.detalhes.forEach((item, index) => {
    console.log(
      `#${index+1} ${item.status}\n` +
      `Pergunta: ${item.questao}\n` +
      `Resposta: ${item.resposta}\n` +
      "―".repeat(50)
    );
  });
  console.groupEnd();
  
  console.groupEnd();
}

// Sistema de notificações estilizadas
function showToast(mensagem, tipo = "info", duracao = 3000) {
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
    animation: toastIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  `;
  toast.textContent = mensagem;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastOut 0.4s ease-in forwards";
    setTimeout(() => toast.remove(), 400);
  }, duracao);

  // Adiciona estilos de animação se não existirem
  if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes toastIn {
        from { opacity: 0; transform: translateY(20px) scale(0.9); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes toastOut {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to { opacity: 0; transform: translateY(-20px) scale(0.9); }
      }
    `;
    document.head.appendChild(style);
  }
}

// == INICIALIZAÇÃO SEGURA == //
(function() {
  // Verifica se está na página correta
  if (!document.querySelector('h2').textContent.includes("Pause e responda")) {
    showToast("⚠️ Execute apenas em páginas de questionário", "error", 5000);
    return;
  }
  
  // Verifica se já há uma tentativa em andamento
  if (document.querySelector('.mod_quiz-next-nav')) {
    showToast("⚠️ Conclua a tentativa atual antes", "warning", 5000);
    return;
  }
  
  // Inicia após 3 segundos (tempo para carregar tudo)
  setTimeout(() => {
    showToast("🔄 Iniciando processamento...", "info", 2000);
    setTimeout(responderQuestionario, 2000);
  }, 3000);
})();
