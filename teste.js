// HackDoEduAI.js - Versão com DeepSeek Chat via OpenRouter
(async function() {
    // Configurações
    const OPENROUTER_API_KEY = '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';
    const MODEL = 'deepseek/deepseek-chat-v3-0324';
    
    // Função para analisar perguntas com IA
    async function analyzeQuestion(questionText) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'https://github.com/Slashzinmaker/SPHACK',
                    'X-Title': 'HackDoEduAI'
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [{
                        role: "system",
                        content: "Você é um assistente educacional especializado em responder questões escolares de forma precisa e concisa. Responda em português brasileiro."
                    }, {
                        role: "user",
                        content: questionText
                    }],
                    max_tokens: 300
                })
            });
            
            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Erro ao consultar IA:', error);
            return null;
        }
    }

    // Função para responder questões
    function answerQuestion(questionElement, answer) {
        // Verifica se é questão de múltipla escolha
        const radioInputs = questionElement.querySelectorAll('input[type="radio"]');
        if (radioInputs.length > 0) {
            // Encontra a opção que melhor corresponde à resposta
            const options = questionElement.querySelectorAll('.MuiBox-root.css-10zfeld');
            for (const opt of options) {
                const optionText = opt.textContent.trim().toLowerCase();
                if (optionText.includes(answer.substring(0, 15).toLowerCase())) {
                    opt.querySelector('input').click();
                    return true;
                }
            }
            return false;
        }
        
        // Verifica se é questão de texto
        const textInput = questionElement.querySelector('input[type="text"], textarea');
        if (textInput) {
            textInput.value = answer;
            return true;
        }
        
        // Verifica se é questão de seleção (dropdown)
        const selectInput = questionElement.querySelector('div[role="button"][aria-haspopup="listbox"]');
        if (selectInput) {
            selectInput.click();
            setTimeout(() => {
                const options = document.querySelectorAll('ul[role="listbox"] li');
                for (const opt of options) {
                    if (opt.textContent.includes(answer.substring(0, 15))) {
                        opt.click();
                        return true;
                    }
                }
            }, 500);
        }
        
        return false;
    }

    // Função principal
    async function autoAnswer() {
        // Mostrar loading
        const loading = document.createElement('div');
        loading.style.position = 'fixed';
        loading.style.top = '20px';
        loading.style.right = '20px';
        loading.style.backgroundColor = '#6200ea';
        loading.style.color = 'white';
        loading.style.padding = '10px 20px';
        loading.style.borderRadius = '5px';
        loading.style.zIndex = '9999';
        loading.textContent = 'Analisando questões com IA...';
        document.body.appendChild(loading);
        
        try {
            // Identificar todas as questões na página
            const questions = document.querySelectorAll('[questao]');
            let answeredCount = 0;
            
            for (const question of questions) {
                try {
                    // Extrair texto da pergunta
                    const questionText = question.querySelector('.ql-editor')?.innerText || 
                                        question.querySelector('.MuiTypography-body1')?.innerText || '';
                    
                    if (!questionText.trim()) continue;
                    
                    // Analisar com IA
                    const answer = await analyzeQuestion(questionText);
                    
                    if (answer) {
                        // Tentar responder a questão
                        if (answerQuestion(question, answer)) {
                            answeredCount++;
                        }
                    }
                } catch (error) {
                    console.error('Erro ao processar questão:', error);
                }
                
                // Pequeno delay entre questões para evitar rate limit
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            loading.textContent = `Respostas preenchidas: ${answeredCount}/${questions.length}`;
            setTimeout(() => loading.remove(), 3000);
        } catch (error) {
            console.error('Erro no autoAnswer:', error);
            loading.textContent = 'Erro ao processar questões';
            loading.style.backgroundColor = '#d32f2f';
            setTimeout(() => loading.remove(), 3000);
        }
    }

    // Iniciar
    autoAnswer();
})();
