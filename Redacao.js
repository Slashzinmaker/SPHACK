async function hackMUITextarea(textareaElement, textToInsert) {
    // Tenta encontrar manipuladores de eventos React no textarea
    const reactHandlers = Object.keys(textareaElement)
        .filter(key => key.startsWith('__reactEventHandlers$') || 
                      key.includes('reactProps') || 
                      key.includes('reactFiber'));
    
    if (reactHandlers.length > 0) {
        for (const handlerKey of reactHandlers) {
            const handler = textareaElement[handlerKey];
            if (handler && typeof handler.onChange === 'function') {
                console.log('[DEBUG] Manipulador onChange encontrado em:', handlerKey);
                const fakeEvent = {
                    target: { value: textToInsert },
                    currentTarget: { value: textToInsert },
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                handler.onChange(fakeEvent);
                
                setTimeout(() => {
                    if (textareaElement.value === textToInsert) {
                        console.log('[SUCCESS] tudo norma');
                    } else {
                        console.log('[ERROR] Falha ao inserir texto. Valor atual:', textareaElement.value);
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
            console.log('[DEBUG] Valor após InputEvent:', textareaElement.value);
        }, 50);
    } catch (error) {
        console.error('[ERROR] Erro no método InputEvent:', error);
    }

    // Método alternativo 2: Usa execCommand (deprecated)
    setTimeout(() => {
        if (textareaElement.value !== textToInsert) {
            try {
                textareaElement.focus();
                textareaElement.select();
                document.designMode = 'off';
                document.execCommand('insertText', false, textToInsert);
                console.log('[DEBUG] Valor após execCommand:', textareaElement.value);
            } catch (error) {
                console.error('[ERROR] Erro no método execCommand:', error);
            }
        }
    }, 150);

    // Método alternativo 3: Usa InputEvent diretamente
    setTimeout(() => {
        if (textareaElement.value !== textToInsert) {
            console.log('[DEBUG] Tentando método InputEvent');
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
                console.log('[DEBUG] Valor após InputEvent:', textareaElement.value);
            } catch (error) {
                console.error('[ERROR] Erro no método InputEvent:', error);
            }
        }
    }, 250);

    // Verificação final
    setTimeout(() => {
        console.log('[DEBUG] Verificação final - valor do textarea:', textareaElement.value);
        if (textareaElement.value === textToInsert) {
            console.log('[SUCCESS] Texto inserido com sucesso!');
        } else {
            console.log('[ERROR] Falha ao inserir texto. Valor atual:', textareaElement.value);
        }
    }, 500);

    return true;
}

async function get_ai_response(prompt) {
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
                        temperature: 1,
                        topP: 0.95,
                        topK: 40,
                        maxOutputTokens: 8192
                    }
                })
            }
        );

        if (!response.ok) throw new Error(`Erro na API do Gemini: ${response.status}`);

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
            throw new Error('Resposta inválida da API do Gemini');
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('[ERROR] Falha ao obter resposta da IA:', error);
        throw error;
    }
}

async function verificarRedacao() {
    const redacaoElement = document.querySelector('p.MuiTypography-root.MuiTypography-body1.css-m576f2');
    
    if (redacaoElement && redacaoElement.innerText.includes('Redação')) {
        // Mensagem de créditos
        const encodedMessage = 'W0lORk9dIHNjcmlwdCBmZWl0byBwb3IgbWFyY29zMTBwYyB8IGRpc2NvcmQuZ2cvcGxhdGZvcm1kZXN0cm95ZXIgf';
        const encodedPart2 = 'CBzZSB2b2NlIHBhZ291IHBvciBpc3NvIHZvY2UgZm9pIGVuZ2FuYWRv';
        const fullMessage = atob(encodedMessage + encodedPart2);
        alert(fullMessage);

        // Obtém ID da atividade da URL
        const url = new URL(window.location.href);
        const pathParts = url.pathname.split('/');
        const activityId = pathParts.includes('atividade') ? 
            pathParts[pathParts.indexOf('atividade') + 1] : null;
        console.log('[DEBUG] ID DA REDAÇÃO:', activityId);

        // Coleta informações da redação
        const coletanea = document.querySelector('.css-1pvvm3t').textContent;
        const enunciado = document.querySelector('.ql-align-justify').innerHTML;
        const generoTextual = document.querySelector('.css-1cq7p20').innerHTML;
        const criteriosAvaliacao = document.querySelector('.ql-editor').innerHTML;
        
        const redacaoInfo = {
            coletanea: coletanea,
            enunciado: enunciado,
            generoTextual: generoTextual,
            criteriosAvaliacao: criteriosAvaliacao
        };

        // Prompt para a IA
        const prompt = `
        Usando as informações a seguir sobre uma tarefa de redação, você precisa me fornecer:
        1. Um título para a redação
        2. O texto completo da redação
        
        **Formate sua resposta exatamente assim:**
        TITULO: [Título da redação]
        
        TEXTO: [Texto da redação]
        
        Informações da redação: ${JSON.stringify(redacaoInfo)}`;

        alert('[INFO] Gerando redação com IA...');
        const aiResponse = await get_ai_response(prompt);

        // Valida o formato da resposta
        if (!aiResponse.includes('TITULO:') || !aiResponse.includes('TEXTO:')) {
            throw new Error('Formato de resposta da IA inválido. A resposta não contém \'TITULO:\' ou \'TEXTO:\'.');
        }

        // Extrai título e texto da resposta
        const titulo = aiResponse.split('TITULO:')[1].split('TEXTO:')[0].trim();
        const texto = aiResponse.split('TEXTO:')[1].trim();

        // Prompt para humanizar a redação
        const humanizePrompt = `
        Reescreva o seguinte texto acadêmico em português para que pareça escrito por um estudante humano, não por IA.
        
        Regras importantes:
        1. Mantenha o conteúdo e os argumentos principais intactos
        2. Adicione pequenas imperfeições naturais como ocasionais repetições de palavras ou construções frasais variadas
        3. Use linguagem mais natural e menos robótica, com algumas expressões coloquiais
        4. Varie o comprimento das frases para criar um ritmo mais natural
        5. Preserve os parágrafos e a estrutura geral
        6. Mantenha todas as referências e exemplos usados, apenas reescrevendo-os de forma mais natural
        7. Ocasionalmente adicione palavras como "tipo", "bem", "na real" para dar um tom mais humano
        8. Evite linguagem artificial ou muito técnica que um estudante normalmente não usaria
        
        Texto para reescrever:
        ${texto}`;

        alert('[INFO] Humanizando redação...');
        const humanizedText = await get_ai_response(humanizePrompt);

        console.log('Redação Gerada:', aiResponse);
        console.log('Redação Humanizada:', humanizedText);
        console.log('[DEBUG] Iniciando inserção de título e texto');

        // Insere o texto nos campos do formulário
        const firstTextarea = document.querySelector('textarea').value;
        const titleInserted = await hackMUITextarea(firstTextarea, titulo);

        setTimeout(async () => {
            const allTextareas = document.querySelectorAll('textarea');
            const lastTextarea = allTextareas[allTextareas.length - 1].value;
            const textInserted = await hackMUITextarea(lastTextarea, humanizedText);

            setTimeout(() => {
                alert('[SUCESSO] Redação inserida com sucesso!');
            }, 1000);
        }, 1000);
    } else {
        alert('[ERROR] Você precisa usar o script em uma redação >:(');
    }
}

// Executa a função principal
verificarRedacao();
console.log('Hello World!');
