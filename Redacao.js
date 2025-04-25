// ==================== TOAST SYSTEM ====================
function showToast(message, type = 'info', duration = 5000) {
    const toastContainer = document.getElementById('toast-container') || (() => {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 8px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
        return container;
    })();

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: #333;
        color: white;
        padding: 12px 16px;
        border-radius: 4px;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        opacity: 0;
        transform: translateX(20px);
        transition: all 0.3s ease;
        max-width: 300px;
        position: relative;
        overflow: hidden;
    `;

    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        width: 100%;
        background: #6c5ce7;
        transform-origin: left;
    `;

    toast.textContent = message;
    toast.appendChild(progressBar);
    toastContainer.appendChild(toast);

    // Animação de entrada
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 10);

    // Animação da barra de progresso
    progressBar.style.animation = `progressBar ${duration}ms linear forwards`;

    // Remover após a duração
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);

    // Adicionar estilos dinamicamente (apenas uma vez)
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes progressBar {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
            }
            
            .toast-success { background: #28a745 !important; }
            .toast-error { background: #dc3545 !important; }
            .toast-warning { background: #ffc107 !important; color: #000 !important; }
            .toast-info { background: #17a2b8 !important; }
            
            .toast-success div { background: #218838 !important; }
            .toast-error div { background: #c82333 !important; }
            .toast-warning div { background: #e0a800 !important; }
            .toast-info div { background: #138496 !important; }
        `;
        document.head.appendChild(style);
    }

    // Adicionar classe de tipo
    if (type !== 'info') {
        toast.classList.add(`toast-${type}`);
    }
}

// ==================== MAIN FUNCTIONS ====================
async function hackMUITextarea(textareaElement, textToInsert) {
    showToast('Inserindo texto no campo...', 'info', 3000);

    // Tenta encontrar manipuladores de eventos React no textarea
    const reactHandlers = Object.keys(textareaElement)
        .filter(key => key.startsWith('__reactEventHandlers$') || 
                      key.includes('reactProps') || 
                      key.includes('reactFiber'));
    
    if (reactHandlers.length > 0) {
        for (const handlerKey of reactHandlers) {
            const handler = textareaElement[handlerKey];
            if (handler && typeof handler.onChange === 'function') {
                showToast('Usando método React para inserção...', 'info', 2000);
                const fakeEvent = {
                    target: { value: textToInsert },
                    currentTarget: { value: textToInsert },
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                handler.onChange(fakeEvent);
                
                setTimeout(() => {
                    if (textareaElement.value === textToInsert) {
                        showToast('Texto inserido com sucesso!', 'success');
                    } else {
                        showToast('Falha ao inserir texto', 'error');
                    }
                }, 100);
                
                return true;
            }
        }
    }

    // Método alternativo 1: Simula eventos de input
    try {
        textareaElement.value = '';
        textareaElement.dispatchEvent(new Event('input', { bubbles: true }));
        
        setTimeout(() => {
            textareaElement.value = textToInsert;
            textareaElement.dispatchEvent(new Event('input', { bubbles: true }));
            textareaElement.dispatchEvent(new Event('change', { bubbles: true }));
            textareaElement.dispatchEvent(new Event('blur', { bubbles: true }));
            showToast('Texto inserido via eventos nativos', 'success');
        }, 50);
    } catch (error) {
        showToast('Erro no método de eventos nativos', 'error');
    }

    // Método alternativo 2: Usa execCommand (deprecated)
    setTimeout(() => {
        if (textareaElement.value !== textToInsert) {
            try {
                textareaElement.focus();
                textareaElement.select();
                document.designMode = 'off';
                document.execCommand('insertText', false, textToInsert);
                showToast('Texto inserido via execCommand', 'success');
            } catch (error) {
                showToast('Erro no método execCommand', 'error');
            }
        }
    }, 150);

    // Método alternativo 3: Usa InputEvent diretamente
    setTimeout(() => {
        if (textareaElement.value !== textToInsert) {
            try {
                textareaElement.focus();
                textareaElement.value = '';
                const inputEvent = new InputEvent('input', {
                    bubbles: true,
                    data: textToInsert,
                    inputType: 'insertText'
                });
                textareaElement.value = textToInsert;
                textareaElement.dispatchEvent(inputEvent);
                showToast('Texto inserido via InputEvent', 'success');
            } catch (error) {
                showToast('Erro no método InputEvent', 'error');
            }
        }
    }, 250);

    return true;
}

async function get_ai_response(prompt) {
    showToast('Solicitando resposta da IA...', 'info');
    
    const apiKey = 'AIzaSyBmQYkaY_EUy4fM6PVj8l0H6QrzuD5ZWus';
    const model = 'gemini-1.5-flash';
    
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7, // Reduzido para mais consistência
                        topP: 0.9,
                        topK: 30,
                        maxOutputTokens: 8192
                    }
                })
            }
        );

        if (!response.ok) throw new Error(`Erro na API: ${response.status}`);

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
            throw new Error('Resposta inválida da API');
        }

        showToast('Resposta da IA recebida!', 'success');
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        showToast('Falha ao obter resposta da IA', 'error');
        throw error;
    }
}

async function verificarRedacao() {
    const redacaoElement = document.querySelector('p.MuiTypography-root.MuiTypography-body1.css-m576f2');
    
    if (redacaoElement && redacaoElement.innerText.includes('Redação')) {
        // Mensagem de créditos
        showToast('Script por marcos10pc | discord.gg/platformdestroyer', 'info', 4000);

        // Obtém ID da atividade da URL
        const url = new URL(window.location.href);
        const pathParts = url.pathname.split('/');
        const activityId = pathParts.includes('atividade') ? 
            pathParts[pathParts.indexOf('atividade') + 1] : null;

        // Coleta informações da redação
        const coletanea = document.querySelector('.css-1pvvm3t')?.textContent || '';
        const enunciado = document.querySelector('.ql-align-justify')?.innerHTML || '';
        const generoTextual = document.querySelector('.css-1cq7p20')?.innerHTML || '';
        const criteriosAvaliacao = document.querySelector('.ql-editor')?.innerHTML || '';
        
        const redacaoInfo = {
            coletanea: coletanea,
            enunciado: enunciado,
            generoTextual: generoTextual,
            criteriosAvaliacao: criteriosAvaliacao
        };

        // Prompt otimizado para redação nota 1000
        const prompt = `
        Você é um especialista em redação acadêmica com experiência em correção de ENEM e vestibulares. 
        Sua tarefa é criar uma redação exemplar que atenda perfeitamente aos critérios de avaliação fornecidos.

        **Instruções específicas:**
        1. Analise cuidadosamente o gênero textual, a coletânea e os critérios de avaliação
        2. Estruture a redação com:
           - Introdução clara com tese bem definida
           - 2-3 parágrafos de desenvolvimento com argumentação sólida
           - Conclusão que retome a tese e proponha solução (se aplicável)
        3. Utilize:
           - Linguagem formal e culta, mas natural
           - Coesão e coerência impecáveis
           - Repertório sociocultural pertinente
           - Proposta de intervenção detalhada (se necessário)

        **Formato obrigatório da resposta:**
        TITULO: [Título criativo e relevante]
        
        TEXTO: [Texto completo da redação com 25-30 linhas]

        **Dados da redação:**
        ${JSON.stringify(redacaoInfo, null, 2)}

        **Dicas para nota máxima:**
        - Use conectivos variados (não obstante, outrossim, todavia, etc.)
        - Cite autores, filósofos ou dados estatísticos quando possível
        - Mantenha uniformidade no nível de formalidade
        - Evide repetições de palavras e ideias`;

        showToast('Gerando redação nota 1000...', 'info');

        try {
            const aiResponse = await get_ai_response(prompt);

            // Valida o formato da resposta
            if (!aiResponse.includes('TITULO:') || !aiResponse.includes('TEXTO:')) {
                throw new Error('Formato de resposta inválido');
            }

            // Extrai título e texto da resposta
            const titulo = aiResponse.split('TITULO:')[1].split('TEXTO:')[0].trim();
            const texto = aiResponse.split('TEXTO:')[1].trim();

            // Prompt para humanizar mantendo a qualidade
            showToast('Otimizando redação...', 'info');
            const refinePrompt = `
            Aprimorar a seguinte redação mantendo seu potencial de nota máxima, mas adicionando:
            1. Naturalidade de escrita humana
            2. Pequenas variações gramaticais aceitáveis
            3. Elementos de autoria (como expressões idiomáticas sutis)
            4. Progressão discursiva mais orgânica

            Mantenha:
            - A estrutura argumentativa
            - O nível vocabular
            - Os elementos de repertório
            - A proposta de intervenção (se aplicável)

            Texto para refinar:
            ${texto}`;

            const refinedText = await get_ai_response(refinePrompt);

            // Verificação final de qualidade
            const qualityCheckPrompt = `
            Analise esta redação conforme os critérios:
            1. Atendimento ao tema e gênero
            2. Estrutura argumentativa
            3. Coesão e coerência
            4. Repertório sociocultural
            5. Gramática e norma culta
            6. Proposta de intervenção (se aplicável)

            Dê uma estimativa de nota (0-1000) e sugira 3 melhorias pontuais se não for perfeita.

            Texto:
            ${refinedText}

            Critérios originais:
            ${redacaoInfo.criteriosAvaliacao}`;

            const qualityReport = await get_ai_response(qualityCheckPrompt);
            console.log('Relatório de qualidade:', qualityReport);

            // Insere o texto nos campos do formulário
            const textareas = document.querySelectorAll('textarea');
            if (textareas.length < 2) {
                throw new Error('Campos de texto não encontrados');
            }

            await hackMUITextarea(textareas[0], titulo);
            
            setTimeout(async () => {
                await hackMUITextarea(textareas[1], refinedText);
                showToast('Redação nota 1000 inserida com sucesso!', 'success', 3000);
                
                // Adiciona dicas de revisão
                setTimeout(() => {
                    showToast('Dica: Revise os conectivos e citações antes de enviar', 'info', 5000);
                }, 3500);
            }, 1000);

        } catch (error) {
            showToast(`Erro: ${error.message}`, 'error');
        }
    } else {
        showToast('Use este script em uma página de redação!', 'error', 3000);
    }
}

// ==================== EXECUÇÃO ====================
// Adiciona um pequeno delay para garantir que a página esteja carregada
setTimeout(() => {
    verificarRedacao();
}, 500);
