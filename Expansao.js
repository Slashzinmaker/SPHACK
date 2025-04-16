// == Configurações == //
const DATAHARLEY_API = "https://scripts.dataharley.online/api.php?Pergunta=";
const DELAY_ENTRE_QUESTOES = 3000; // 3 segundos

// == Função Principal == //
async function responderTodasQuestoes() {
    showToast("🔍 Iniciando busca por questões...", "info");
    
    // Encontra todas as seções de "Pause e responda"
    const secoesPause = Array.from(document.querySelectorAll('h2')).filter(h2 => 
        h2.textContent.includes("Pause e responda")
    );

    if (secoesPause.length === 0) {
        showToast("Nenhuma questão encontrada!", "error");
        return;
    }

    for (const [index, secao] of secoesPause.entries()) {
        const containerQuestao = secao.closest('.que.multichoice') || secao.nextElementSibling;
        
        if (!containerQuestao) continue;

        try {
            const { pergunta, alternativas } = extrairQuestao(containerQuestao);
            showToast(`📝 Processando questão ${index + 1}...`, "warning");

            const respostaIA = await consultarDataHarley(pergunta);
            if (!respostaIA) throw new Error("IA não retornou resposta");

            const alternativaCorreta = encontrarMelhorAlternativa(respostaIA, alternativas);
            if (!alternativaCorreta) throw new Error("Alternativa não identificada");

            await selecionarAlternativa(alternativaCorreta);
            showToast(`✅ Selecionado: "${alternativaCorreta.texto}"`, "success");

        } catch (error) {
            showToast(`❌ Erro: ${error.message}`, "error");
        }

        await new Promise(resolve => setTimeout(resolve, DELAY_ENTRE_QUESTOES));
    }

    showToast("🎉 Todas questões respondidas!", "success");
}

// == Funções Auxiliares == //

// Extrai texto da pergunta e alternativas
function extrairQuestao(container) {
    const pergunta = container.querySelector('.qtext')?.textContent.trim() || 
                     "Pergunta não identificada";
    
    const alternativas = Array.from(container.querySelectorAll('.answer label')).map(label => {
        const input = label.previousElementSibling;
        return {
            elemento: input,
            texto: label.textContent.trim(),
            valor: input.value
        };
    });

    return { pergunta, alternativas };
}

// Consulta a API DataHarley
async function consultarDataHarley(pergunta) {
    try {
        const response = await fetch(`${DATAHARLEY_API}${encodeURIComponent(pergunta)}`);
        const data = await response.json();
        return data.resposta;
    } catch (error) {
        console.error("Erro na API:", error);
        return null;
    }
}

// Encontra a alternativa que melhor corresponde à resposta da IA
function encontrarMelhorAlternativa(respostaIA, alternativas) {
    let melhorAlternativa = null;
    let maiorSimilaridade = 0;

    alternativas.forEach(alt => {
        const similaridade = calcularSimilaridade(respostaIA, alt.texto);
        if (similaridade > maiorSimilaridade) {
            maiorSimilaridade = similaridade;
            melhorAlternativa = alt;
        }
    });

    return melhorAlternidade >= 0.4 ? melhorAlternativa : null; // Threshold mínimo de 40%
}

// Calcula similaridade entre strings
function calcularSimilaridade(str1, str2) {
    const palavras1 = str1.toLowerCase().split(/\s+/);
    const palavras2 = str2.toLowerCase().split(/\s+/);
    const palavrasComuns = palavras1.filter(palavra => palavras2.includes(palavra));
    return palavrasComuns.length / Math.max(palavras1.length, palavras2.length);
}

// Seleciona a alternativa no DOM
async function selecionarAlternativa(alternativa) {
    alternativa.elemento.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simula evento de change se necessário
    const event = new Event('change', { bubbles: true });
    alternativa.elemento.dispatchEvent(event);
}

// Exibe notificações
function showToast(mensagem, tipo = "info", duracao = 3000) {
    const toast = document.createElement('div');
    toast.style = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        background: ${tipo === "error" ? "#dc3545" : tipo === "success" ? "#28a745" : "#17a2b8"};
        color: white;
        border-radius: 4px;
        z-index: 9999;
        animation: fadeIn 0.3s;
    `;
    toast.textContent = mensagem;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), duracao);
}

// == Inicialização == //
(function() {
    // Adiciona estilo CSS para os toasts
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    // Inicia após 2 segundos (tempo para carregar a página)
    setTimeout(responderTodasQuestoes, 2000);
})();
