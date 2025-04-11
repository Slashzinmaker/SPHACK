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
                formFields: {}
            };
            
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
            
            const radioInputs = doc.querySelectorAll('input[type="radio"]');
            radioInputs.forEach(input => {
                const name = input.getAttribute('name');
                const value = input.getAttribute('value');
                
                if (name && name.includes('answer') && value !== '-1') {
                    questionData.options.push({
                        name: name,
                        value: value
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
            const randomOption = Math.floor(Math.random() * questionData.options.length);
            const selectedOption = questionData.options[randomOption];
            
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
        const { sessKey } = await getSessionData();
        const { redirectUrl, attemptId } = await startAttempt(cmid, sessKey);
        const questionData = await getQuestionData(redirectUrl);
        const { attemptId: finalAttemptId, sesskey } = await submitAnswer(questionData, cmid);
        return await finishAttempt(finalAttemptId, cmid, sesskey);
    } catch (error) {
        throw error;
    }
}

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
    } catch (error) {}
}

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

// Função para criar e mostrar toasts estilizados
function showToast(message, type = 'info', duration = 5000) {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <div class="progress">
            <div class="progress-bar"></div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animação de entrada
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Barra de progresso - reinicia animação
    const progressBar = toast.querySelector('.progress-bar');
    progressBar.style.animation = 'none';
    void progressBar.offsetWidth; // força reflow
    progressBar.style.animation = `progressBar ${duration}ms linear forwards`;
    
    // Remover após a duração
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// Função para criar o container de toasts com o estilo especificado
function createToastContainer() {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
    
    // Adicionar estilos CSS conforme seu exemplo
    const style = document.createElement('style');
    style.textContent = `
        #toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .toast {
            position: relative;
            background: #333;
            color: #fff;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
            opacity: 0;
            transform: translateY(-20px);
            transition: opacity 0.3s ease, transform 0.3s ease;
            max-width: 300px;
        }
        
        .toast.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .toast .progress {
            margin-top: 10px;
            height: 4px;
            width: 100%;
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
            overflow: hidden;
        }
        
        .toast .progress-bar {
            height: 100%;
            width: 100%;
            background: #6c5ce7;
        }
        
        @keyframes progressBar {
            from { width: 100%; }
            to { width: 0%; }
        }
        
        /* Cores para diferentes tipos de toast */
        .toast-success .progress-bar {
            background: #28a745;
        }
        
        .toast-error .progress-bar {
            background: #dc3545;
        }
        
        .toast-warning .progress-bar {
            background: #ffc107;
        }
        
        .toast-info .progress-bar {
            background: #17a2b8;
        }
    `;
    document.head.appendChild(style);
    
    return toastContainer;
}

async function verificarPaginas() {
    console.log('Script Feito Por Eduardo Safra');
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
                        marcarPaginaComoConcluida(id, name)
                            .then(() => showToast(`Concluído: ${name}`, 'success'))
                            .catch(() => showToast(`Falha ao concluir: ${name}`, 'error'))
                    );
                }
            }
        }
    });
    
    await Promise.all(pagePromises);
    
    const examCount = examLinks.length;
    
    if (examCount > 0) {
        showToast(`Iniciando ${examCount} exames/atividades...`, 'warning', 2000);
        
        for (let i = 0; i < examCount; i++) {
            const exam = examLinks[i];
            showToast(`Processando (${i+1}/${examCount}): ${exam.nome}`, 'info', 2500);
            
            try {
                await do_exam(exam.href);
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
    
    showToast('Todas atividades processadas!', 'success', 3000);
    console.log('Atividades Finalizadas! | Caso Sobrar alguma execute denovo');
    
    // Recarregar a página após 3 segundos
    setTimeout(() => {
        location.reload();
    }, 3000);
}

verificarPaginas();
