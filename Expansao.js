// == Configurações da IA == //
const OPENROUTER_API_KEY = "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";
const AI_MODEL = "openai/gpt-4.1"; // Modelo avançado para respostas precisas
const AI_TEMPERATURE = 0.3; // Reduz aleatoriedade (respostas mais certeiras)
const AI_MAX_TOKENS = 500;
const REQUEST_DELAY = 3000; // Delay entre requisições (evitar bloqueio)

// == Função para consultar IA com análise profunda == //
async function consultarIA(pergunta, opcoes) {
    try {
        showToast('🔍 IA analisando pergunta...', 'info', 2000);

        // Monta o prompt para a IA
        const prompt = `Você é um especialista em educação. Analise a questão e responda com a letra da opção CORRETA.  

**Pergunta:**  
${pergunta}  

**Opções:**  
${opcoes.map((op, i) => `${String.fromCharCode(65 + i)}) ${op.text}`).join('\n')}  

**Instruções:**  
- Responda APENAS com a LETRA (A, B, C...) da opção correta.  
- Se não souber, responda "X" (evite chutes).  
- Ignore opções absurdas ou sem relação.  

**Resposta (APENAS UMA LETRA):**`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.href,
                'X-Title': 'BotEducacional'
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: AI_TEMPERATURE,
                max_tokens: AI_MAX_TOKENS
            })
        });

        if (!response.ok) throw new Error(`Erro na API: ${response.status}`);

        const data = await response.json();
        const respostaIA = data.choices[0].message.content.trim().toUpperCase();

        // Valida se a resposta é uma letra válida
        if (/^[A-Z]$/.test(respostaIA) && respostaIA.charCodeAt(0) - 65 < opcoes.length) {
            return respostaIA;
        } else {
            throw new Error('Resposta inválida da IA');
        }
    } catch (error) {
        console.error('Erro na IA:', error);
        showToast('⚠️ IA falhou, usando lógica alternativa...', 'warning', 2000);
        
        // Fallback 1: Tenta encontrar palavras-chave nas opções
        const palavrasChave = {
            "verdadeiro": ["sim", "correto", "certo", "verdade"],
            "falso": ["não", "incorreto", "errado", "falso"]
        };

        for (const [key, termos] of Object.entries(palavrasChave)) {
            if (termos.some(termo => pergunta.toLowerCase().includes(termo))) {
                const opcaoCorrespondente = opcoes.find(op => 
                    op.text.toLowerCase().includes(key)
                );
                if (opcaoCorrespondente) {
                    return String.fromCharCode(65 + opcoes.indexOf(opcaoCorrespondente));
                }
            }
        }

        // Fallback 2: Opção mais longa (muitas vezes é a correta)
        const opcaoMaisLonga = opcoes.reduce((a, b) => 
            a.text.length > b.text.length ? a : b
        );
        return String.fromCharCode(65 + opcoes.indexOf(opcaoMaisLonga));
    }
}

// == Função Principal para Responder Questões == //
async function responderQuestao(url) {
    try {
        const { questId, questionText, options } = await extrairDadosQuestao(url);
        const respostaIA = await consultarIA(questionText, options);
        const opcaoSelecionada = options[respostaIA.charCodeAt(0) - 65];

        showToast(`✅ IA selecionou: ${respostaIA} (${opcaoSelecionada.text})`, 'success', 3000);

        await enviarResposta(questId, opcaoSelecionada.value);
        return true;
    } catch (error) {
        showToast(`❌ Erro: ${error.message}`, 'error', 3000);
        return false;
    }
}

// == Funções Auxiliares == //
async function extrairDadosQuestao(url) {
    const response = await fetch(url, { credentials: 'include' });
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extrai o texto da pergunta
    const questionText = doc.querySelector('.qtext')?.textContent.trim() || 
                        doc.querySelector('.question')?.textContent.trim() || 
                        "Pergunta não identificada";

    // Extrai as opções de resposta
    const options = [];
    doc.querySelectorAll('.answer input[type="radio"]').forEach((input, index) => {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) {
            options.push({
                name: input.name,
                value: input.value,
                text: label.textContent.trim()
            });
        }
    });

    // Extrai o ID da questão
    const questId = Array.from(doc.querySelectorAll('input[type="hidden"]'))
        .find(input => input.name.includes('sequencecheck'))?.name.split(':')[0];

    if (!questId || options.length === 0) {
        throw new Error("Não foi possível extrair dados da questão.");
    }

    return { questId, questionText, options };
}

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

// == Execução Automática == //
(async () => {
    console.log("🟢 Script Iniciado (IA Ativada)");
    showToast("🔎 Procurando questões pendentes...", "info", 2000);

    const botoesResponder = Array.from(document.querySelectorAll('button.submit'));
    for (const [index, botao] of botoesResponder.entries()) {
        const url = botao.closest('form')?.action || window.location.href;
        showToast(`📝 Processando questão ${index + 1}/${botoesResponder.length}`, "warning", 2000);
        
        await responderQuestao(url);
        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
    }

    showToast("🎉 Todas questões respondidas com IA!", "success", 5000);
})();
