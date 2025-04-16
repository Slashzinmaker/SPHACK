// Configurações da API de IA
const OPENROUTER_API_KEY = "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";
const AI_MODEL = "openai/gpt-4.1";
const AI_TEMPERATURE = 0.7;
const AI_MAX_TOKENS = 1000;

// Classe para gerenciar a fila de tarefas com rate limiting
class RateLimitedQueue {
    constructor(delay = 1000) {
        this.queue = [];
        this.processing = false;
        this.delay = delay;
    }

    async enqueue(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                task: task,
                resolve: resolve,
                reject: reject
            });
            
            if (!this.processing) {
                this.processQueue();
            }
        });
    }

    async processQueue() {
        if (this.queue.length === 0) {
            this.processing = false;
            return;
        }
        
        this.processing = true;
        
        const { task, resolve, reject } = this.queue.shift();
        
        try {
            const result = await this.executeWithRetry(task);
            resolve(result);
        } catch (error) {
            reject(error);
        }
        
        setTimeout(() => this.processQueue(), this.delay);
    }

    async executeWithRetry(task, retries = 3, delay = 2000) {
        try {
            return await task();
        } catch (error) {
            if (error.message.includes('429') && retries > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.executeWithRetry(task, retries - 1, delay * 2);
            }
            throw error;
        }
    }
}

// Função para mostrar toasts estilizados com barra de progresso
function showToast(message, type = 'info', duration = 5000) {
    // Criar container se não existir
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
        `;
        document.body.appendChild(container);
        return container;
    })();

    // Criar o toast
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.style.cssText = `
        background: #333;
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        opacity: 0;
        transform: translateX(20px);
        transition: all 0.3s ease;
        max-width: 300px;
        position: relative;
        overflow: hidden;
    `;

    // Barra de progresso
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        height: 4px;
        width: 100%;
        background: #6c5ce7;
        transform-origin: left;
        animation: progress ${duration}ms linear forwards;
    `;

    toast.textContent = message;
    toast.appendChild(progressBar);
    toastContainer.appendChild(toast);

    // Animação de entrada
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    // Remover após duração
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);

    // Inserir estilos globais apenas uma vez
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes progress {
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

    // Adicionar classe conforme tipo
    if (type) {
        toast.classList.add(`toast-${type}`);
    }
}

// Função para consultar a IA
async function consultarIA(pergunta, opcoes) {
    try {
        showToast('Consultando IA para resposta...', 'info', 2000);
        
        const prompt = `Você é um especialista em educação respondendo questões de um sistema de ensino. Analise a questão e as opções fornecidas e responda com a letra da opção correta.

Questão: ${pergunta}

Opções:
${opcoes.map((opcao, index) => `${String.fromCharCode(65 + index)}) ${opcao.text}`).join('\n')}

Responda APENAS com a letra da opção correta (A, B, C, etc.), sem explicações ou outros textos.`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.href,
                'X-Title': 'AutoAprendiz'
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: AI_TEMPERATURE,
                max_tokens: AI_MAX_TOKENS
            })
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        const data = await response.json();
        const respostaIA = data.choices[0].message.content.trim().toUpperCase();
        
        // Validar se a resposta é uma letra válida
        if (/^[A-Z]$/.test(respostaIA) && respostaIA.charCodeAt(0) - 65 < opcoes.length) {
            return respostaIA;
        } else {
            throw new Error('Resposta da IA inválida');
        }
    } catch (error) {
        console.error('Erro ao consultar IA:', error);
        showToast('Falha ao consultar IA, usando fallback...', 'error', 2000);
        // Fallback: seleciona aleatoriamente
        return String.fromCharCode(65 + Math.floor(Math.random() * opcoes.length));
    }
}

// Função para marcar página como concluída
async function marcarPaginaComoConcluida(id) {
    try {
        await fetch('https://expansao.educacao.sp.gov.br/mod/resource/view.php?id=' + id, {
            credentials: 'include',
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/118.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin'
            },
            method: 'GET',
            mode: 'cors'
        });
    } catch (error) {
        console.error('Erro ao marcar página como concluída:', error);
    }
}

// Função principal para realizar o exame
async function do_exam(url) {
    if (!url) return;

    let cmid = '';
    try {
        const urlObj = new URL(url);
        cmid = urlObj.searchParams.get('id');
    } catch (e) {}

    function extractValue(content, regex, errorMsg) {
        const match = content.match(regex);
        if (!match || !match[1]) throw new Error(errorMsg);
        return match[1];
    }

    async function getSessionData() {
        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Erro: ' + response.status);
            
            const html = await response.text();
            
            if (!cmid) {
                try {
                    cmid = extractValue(html, /contextInstanceId":(\d+)/, 'CMID não encontrado');
                } catch (e) {}
            }
            
            const sessKey = extractValue(html, /sesskey":"([^"]+)/, 'Sesskey não encontrado');
            
            return {
                sessKey: sessKey,
                html: html
            };
        } catch (error) {
            throw error;
        }
    }

    async function startAttempt(cmid, sessKey) {
        try {
            const params = new URLSearchParams();
            params.append('cmid', cmid);
            params.append('sesskey', sessKey);
            
            const response = await fetch('https://expansao.educacao.sp.gov.br/mod/quiz/startattempt.php', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString(),
                redirect: 'follow'
            });
            
            if (!response.ok) throw new Error('Erro: ' + response.status);
            
            const redirectUrl = response.url;
            const attemptMatch = redirectUrl.match(/attempt=(\d+)/);
            const attemptId = attemptMatch ? attemptMatch[1] : null;
            
            if (!attemptId) throw new Error('ID da tentativa não encontrado');
            
            return {
                redirectUrl: redirectUrl,
                attemptId: attemptId
            };
        } catch (error) {
            throw error;
        }
    }

    async function getQuestionData(questionUrl) {
        try {
            const response = await fetch(questionUrl, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Erro: ' + response.status);
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const questionData = {
                questId: null,
                seqCheck: null,
                options: [],
                attempt: null,
                sesskey: null,
                formFields: {},
                questionText: ''
            };
            
            // Extrair texto da pergunta
            const questionTextElement = doc.querySelector('.qtext');
            if (questionTextElement) {
                questionData.questionText = questionTextElement.textContent.trim();
            }
            
            const hiddenInputs = doc.querySelectorAll('input[type="hidden"]');
            hiddenInputs.forEach(input => {
                const name = input.getAttribute('name');
                const value = input.getAttribute('value');
                
                if (name && name.includes(':sequencecheck')) {
                    questionData.questId = name.split(':')[0];
                    questionData.seqCheck = value;
                } else if (name === 'attempt') {
                    questionData.attempt = value;
                } else if (name === 'sesskey') {
                    questionData.sesskey = value;
                } else if (name && ['thispage', 'nextpage', 'timeup', 'mdlscrollto', '_qf__mod_quiz_question_form'].includes(name)) {
                    questionData.formFields[name] = value;
                }
            });
            
            // Extrair opções de resposta
            const answerOptions = doc.querySelectorAll('.answer div');
            answerOptions.forEach((div, index) => {
                const input = div.querySelector('input[type="radio"]');
                const label = div.querySelector('label');
                
                if (input && label) {
                    questionData.options.push({
                        name: input.getAttribute('name'),
                        value: input.getAttribute('value'),
                        text: label.textContent.trim()
                    });
                }
            });
            
            if (!questionData.questId || !questionData.attempt || !questionData.sesskey || questionData.options.length === 0) {
                throw new Error('Informações insuficientes na página da questão');
            }
            
            return questionData;
        } catch (error) {
            throw error;
        }
    }

    async function submitAnswer(questionData, cmid) {
        try {
            // Consultar IA para obter a resposta correta
            const respostaIA = await consultarIA(questionData.questionText, questionData.options);
            const selectedOptionIndex = respostaIA.charCodeAt(0) - 65;
            const selectedOption = questionData.options[selectedOptionIndex];
            
            showToast(`IA selecionou: ${respostaIA}`, 'info', 2000);
            
            const formData = new FormData();
            formData.append(questionData.questId + ':1_:sequencecheck', '0');
            formData.append(questionData.questId + ':1_:sequencecheck', '0');
            formData.append(questionData.questId + ':1_:sequencecheck', questionData.seqCheck);
            formData.append(selectedOption.name, selectedOption.value);
            formData.append('thispage', '0');
            formData.append('nextpage', '1');
            formData.append('attempt', questionData.attempt);
            
            Object.entries(questionData.formFields).forEach(([name, value]) => {
                formData.append(name, value);
            });
            
            formData.append('sesskey', questionData.sesskey);
            formData.append('timeup', '1');
            
            const response = await fetch('https://expansao.educacao.sp.gov.br/mod/quiz/processattempt.php?cmid=' + cmid, {
                method: 'POST',
                credentials: 'include',
                body: formData,
                redirect: 'follow'
            });
            
            if (!response.ok) throw new Error('Erro: ' + response.status);
            
            const redirectUrl = response.url;
            
            return {
                redirectUrl: redirectUrl,
                attemptId: questionData.attempt,
                sesskey: questionData.sesskey
            };
        } catch (error) {
            throw error;
        }
    }

    async function finishAttempt(attemptId, cmid, sesskey) {
        try {
            const summaryUrl = 'https://expansao.educacao.sp.gov.br/mod/quiz/summary.php?attempt=' + attemptId + '&cmid=' + cmid;
            const response = await fetch(summaryUrl, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('Erro: ' + response.status);
            
            const params = new URLSearchParams();
            params.append('attempt', attemptId);
            params.append('finishattempt', '1');
            params.append('timeup', '0');
            params.append('timeup', '');
            params.append('cmid', cmid);
            params.append('sesskey', sesskey);
            
            const finishResponse = await fetch('https://expansao.educacao.sp.gov.br/mod/quiz/processattempt.php', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString(),
                redirect: 'follow'
            });
            
            if (!finishResponse.ok) throw new Error('Erro: ' + finishResponse.status);
            
            return finishResponse.url;
        } catch (error) {
            throw error;
        }
    }

    try {
        showToast('Iniciando exame...', 'info', 2000);
        const { sessKey } = await getSessionData();
        const { redirectUrl, attemptId } = await startAttempt(cmid, sessKey);
        const questionData = await getQuestionData(redirectUrl);
        const { attemptId: finalAttemptId, sesskey } = await submitAnswer(questionData, cmid);
        const resultUrl = await finishAttempt(finalAttemptId, cmid, sesskey);
        showToast('Exame concluído com sucesso!', 'success', 3000);
        return resultUrl;
    } catch (error) {
        showToast('Erro ao processar exame: ' + error.message, 'error', 3000);
        throw error;
    }
}

// Função principal para verificar e processar todas as páginas
async function verificarPaginas() {
    console.log('Script Feito Por Eduardo Safra com Integração de IA');
    showToast('Iniciando processamento das atividades...', 'info', 2000);
    
    const activities = document.querySelectorAll('li.activity');
    const pagePromises = [];
    const examLinks = [];
    
    // Contar atividades pendentes
    let pendingActivities = 0;
    activities.forEach(activity => {
        const link = activity.querySelector('a.aalink');
        const completion = activity.querySelector('.completion-dropdown button');
        
        if (link && link.href && (!completion || !completion.classList.contains('btn-success'))) {
            pendingActivities++;
        }
    });
    
    showToast(`Encontradas ${pendingActivities} atividades pendentes`, 'info', 2000);
    
    // Criar fila de processamento
    const queue = new RateLimitedQueue(2000); // 2 segundos entre requisições
    
    activities.forEach(activity => {
        const link = activity.querySelector('a.aalink');
        const completion = activity.querySelector('.completion-dropdown button');
        
        if (link && link.href && (!completion || !completion.classList.contains('btn-success'))) {
            const url = new URL(link.href);
            const id = url.searchParams.get('id');
            const name = link.innerText.trim();
            
            if (id) {
                if (/responda|pause/i.test(name)) {
                    examLinks.push({
                        href: link.href,
                        nome: name
                    });
                } else {
                    pagePromises.push(
                        queue.enqueue(() => 
                            marcarPaginaComoConcluida(id)
                                .then(() => showToast(`Concluído: ${name}`, 'success'))
                                .catch(() => showToast(`Falha ao concluir: ${name}`, 'error'))
                        )
                    );
                }
            }
        }
    });
    
    await Promise.all(pagePromises);
    
    const examCount = examLinks.length;
    
    if (examCount > 0) {
        showToast(`Iniciando ${examCount} exames/atividades com IA...`, 'warning', 2000);
        
        for (let i = 0; i < examCount; i++) {
            const exam = examLinks[i];
            showToast(`Processando (${i+1}/${examCount}): ${exam.nome}`, 'info', 2500);
            
            try {
                await queue.enqueue(() => do_exam(exam.href));
                showToast(`Concluído: ${exam.nome}`, 'success');
            } catch (error) {
                console.error('Erro ao processar exame:', error);
                showToast(`Falha em: ${exam.nome}`, 'error');
            }
            
            if (i < examCount - 1) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }
    
    showToast('Todas atividades processadas com IA!', 'success', 3000);
    console.log('Atividades Finalizadas! | Caso Sobrar alguma execute denovo');
    
    // Recarregar a página após 3 segundos
    setTimeout(() => {
        location.reload();
    }, 3000);
}

// Iniciar o processo
verificarPaginas();
