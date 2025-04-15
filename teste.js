// HackDoEduAI.js - Versão com Toast de Progresso
(async function() {
    // Configurações
    const OPENROUTER_API_KEY = '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';
    const MODEL = 'deepseek/deepseek-chat-v3-0324';
    
    // Função para mostrar toast
    function showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.backgroundColor = isError ? '#d32f2f' : '#6200ea';
        toast.style.color = 'white';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '4px';
        toast.style.zIndex = '99999';
        toast.style.boxShadow = '0 3px 5px rgba(0,0,0,0.2)';
        toast.style.animation = 'fadein 0.5s';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeout 0.5s';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
        
        // Adiciona estilos de animação
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadein {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeout {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(20px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Função para analisar perguntas com IA
    async function analyzeQuestion(questionText, questionNumber, totalQuestions) {
        try {
            showToast(`Processando questão ${questionNumber}/${totalQuestions}...`);
            
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
                        content: "Você é um assistente educacional. Responda questões escolares de forma precisa, concisa e em português brasileiro. Para múltipla escolha, forneça apenas a letra da opção correta."
                    }, {
                        role: "user",
                        content: "Responda estritamente com o conteúdo que deve ser preenchido na resposta. Sem explicações adicionais.\n\n" + questionText
                    }],
                    max_tokens: 150,
                    temperature: 0.3
                })
            });
            
            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Erro ao consultar IA:', error);
            showToast(`Erro na questão ${questionNumber}. Verifique console.`, true);
            return null;
        }
    }

    // Função para responder questões
    function answerQuestion(questionElement, answer, questionNumber) {
        try {
            // Questão de múltipla escolha (radio buttons)
            const radioInputs = questionElement.querySelectorAll('input[type="radio"]');
            if (radioInputs.length > 0) {
                const options = questionElement.querySelectorAll('.MuiBox-root.css-10zfeld, [role="radio"]');
                for (const opt of options) {
                    const optionText = opt.textContent.trim().toLowerCase();
                    if (optionText.startsWith(answer.toLowerCase()) || 
                        optionText.includes(answer.substring(0, 10).toLowerCase())) {
                        const input = opt.querySelector('input') || opt;
                        input.click();
                        showToast(`Questão ${questionNumber}: Opção selecionada`);
                        return true;
                    }
                }
                showToast(`Questão ${questionNumber}: Opção não encontrada`, true);
                return false;
            }
            
            // Questão de texto
            const textInput = questionElement.querySelector('input[type="text"], textarea');
            if (textInput) {
                textInput.value = answer;
                showToast(`Questão ${questionNumber}: Texto preenchido`);
                return true;
            }
            
            // Questão de seleção (dropdown)
            const selectInput = questionElement.querySelector('div[role="button"][aria-haspopup="listbox"]');
            if (selectInput) {
                selectInput.click();
                setTimeout(() => {
                    const options = document.querySelectorAll('ul[role="listbox"] li');
                    for (const opt of options) {
                        if (opt.textContent.includes(answer.substring(0, 15))) {
                            opt.click();
                            showToast(`Questão ${questionNumber}: Seleção feita`);
                            return true;
                        }
                    }
                    showToast(`Questão ${questionNumber}: Opção não encontrada`, true);
                }, 500);
                return true;
            }
            
            showToast(`Questão ${questionNumber}: Tipo não suportado`, true);
            return false;
        } catch (error) {
            console.error(`Erro na questão ${questionNumber}:`, error);
            showToast(`Erro ao responder questão ${questionNumber}`, true);
            return false;
        }
    }

    // Função principal
    async function autoAnswer() {
        showToast('Iniciando análise das questões...');
        
        try {
            const questions = document.querySelectorAll('[questao], .MuiPaper-root.css-b200pa');
            const totalQuestions = questions.length;
            
            if (totalQuestions === 0) {
                showToast('Nenhuma questão encontrada!', true);
                return;
            }
            
            showToast(`Encontradas ${totalQuestions} questões`);
            
            let answeredCount = 0;
            let currentQuestion = 1;
            
            for (const question of questions) {
                try {
                    const questionText = question.querySelector('.ql-editor')?.innerText || 
                                        question.querySelector('.MuiTypography-body1')?.innerText || '';
                    
                    if (!questionText.trim()) {
                        showToast(`Questão ${currentQuestion}: Texto não encontrado`, true);
                        currentQuestion++;
                        continue;
                    }
                    
                    const answer = await analyzeQuestion(questionText, currentQuestion, totalQuestions);
                    
                    if (answer) {
                        if (answerQuestion(question, answer, currentQuestion)) {
                            answeredCount++;
                        }
                    }
                    
                    currentQuestion++;
                    
                    // Delay para evitar rate limit e dar tempo de ver os toasts
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                } catch (error) {
                    console.error(`Erro na questão ${currentQuestion}:`, error);
                    showToast(`Erro na questão ${currentQuestion}`, true);
                    currentQuestion++;
                }
            }
            
            showToast(`Concluído! ${answeredCount}/${totalQuestions} respondidas`);
        } catch (error) {
            console.error('Erro no autoAnswer:', error);
            showToast('Erro no processo. Verifique console.', true);
        }
    }

    // Iniciar
    autoAnswer();
})();
