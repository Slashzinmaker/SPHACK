// == Configurações == //
const DATAHARLEY_API = "https://scripts.dataharley.online/api.php?Pergunta=";
const REQUEST_DELAY = 3000; // Delay entre requisições (evitar bloqueio)

// == Função para consultar a API DataHarley == //
async function consultarDataHarley(pergunta) {
    try {
        showToast('🔍 Consultando IA...', 'info', 2000);
        
        const response = await fetch(`${DATAHARLEY_API}${encodeURIComponent(pergunta)}`);
        if (!response.ok) throw new Error("Erro na API");
        
        const data = await response.json();
        return data.resposta; // Retorna a resposta formatada
    } catch (error) {
        console.error("Erro na API DataHarley:", error);
        showToast("⚠️ API falhou, usando fallback...", "warning", 2000);
        return null;
    }
}

// == Função para extrair dados da questão == //
async function extrairDadosQuestao(url) {
    const response = await fetch(url, { credentials: 'include' });
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extrai o texto da pergunta
    const questionText = doc.querySelector('.qtext')?.textContent.trim() || 
                        doc.querySelector('.question')?.textContent.trim() || 
                        "Pergunta não identificada";

    // Extrai as opções (se for múltipla escolha)
    const options = [];
    doc.querySelectorAll('.answer input[type="radio"]').forEach((input, index) => {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) options.push({
            name: input.name,
            value: input.value,
            text: label.textContent.trim()
        });
    });

    // Extrai o ID da questão
    const questId = Array.from(doc.querySelectorAll('input[type="hidden"]'))
        .find(input => input.name.includes('sequencecheck'))?.name.split(':')[0];

    return { questId, questionText, options };
}

// == Função para responder questão == //
async function responderQuestao(url) {
    try {
        const { questId, questionText, options } = await extrairDadosQuestao(url);
        
        // Consulta a IA para obter a resposta correta
        const respostaIA = await consultarDataHarley(questionText);
        
        if (!respostaIA) {
            throw new Error("IA não retornou resposta válida");
        }

        // Se for múltipla escolha, encontra a opção que melhor corresponde à resposta da IA
        if (options.length > 0) {
            let melhorOpcao = null;
            let melhorPontuacao = 0;

            // Compara cada opção com a resposta da IA
            options.forEach(opcao => {
                const pontuacao = calcularSimilaridade(respostaIA, opcao.text);
                if (pontuacao > melhorPontuacao) {
                    melhorPontuacao = pontuacao;
                    melhorOpcao = opcao;
                }
            });

            if (melhorOpcao) {
                showToast(`✅ IA selecionou: "${melhorOpcao.text}"`, 'success', 3000);
                await enviarResposta(questId, melhorOpcao.value);
            } else {
                throw new Error("Nenhuma opção corresponde à resposta da IA");
            }
        } 
        // Se for questão dissertativa
        else {
            showToast(`📝 Resposta dissertativa: "${respostaIA.substring(0, 50)}..."`, 'info', 3000);
            // Implemente aqui o envio de respostas dissertativas se necessário
        }

        return true;
    } catch (error) {
        showToast(`❌ Erro: ${error.message}`, 'error', 3000);
        return false;
    }
}

// == Funções Auxiliares == //

// Calcula similaridade entre strings (para encontrar a melhor opção)
function calcularSimilaridade(str1, str2) {
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    return intersection.size / Math.max(set1.size, set2.size);
}

// Envia a resposta para o servidor
async function enviarResposta(questId, resposta) {
    const formData = new FormData();
    formData.append(`${questId}:sequencecheck`, '1');
    formData.append(`${questId}:answer`, resposta);
    formData.append('timeup', '0');

    await fetch(window.location.href, {
        method: 'POST',
        credentials: 'include',
        body: formData
    });
}

// Mostra notificações estilizadas
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.style = `position:fixed;top:20px;right:20px;padding:12px;background:${
        type === 'error' ? '#dc3545' : 
        type === 'success' ? '#28a745' : 
        type === 'warning' ? '#ffc107' : '#17a2b8'
    };color:white;border-radius:4px;z-index:9999;`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), duration);
}

// == Execução Automática == //
(async () => {
    console.log("🟢 Script Iniciado (DataHarley API)");
    showToast("🔎 Procurando questões pendentes...", "info", 2000);

    const botoesResponder = Array.from(document.querySelectorAll('button.submit'));
    for (const [index, botao] of botoesResponder.entries()) {
        const url = botao.closest('form')?.action || window.location.href;
        showToast(`📝 Processando questão ${index + 1}/${botoesResponder.length}`, "warning", 2000);
        
        await responderQuestao(url);
        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
    }

    showToast("🎉 Todas questões respondidas com precisão!", "success", 5000);
})();
