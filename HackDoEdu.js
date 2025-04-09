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

async function verificarPaginas() {
    console.log('Script Feito Por Eduardo Safra');
    
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 9999;';
    
    const spinner = document.createElement('div');
    spinner.style.cssText = 'border: 16px solid #f3f3f3; border-radius: 50%; border-top: 16px solid #3498db; width: 120px; height: 120px; animation: spin 2s linear infinite; margin-bottom: 20px;';
    
    const title = document.createElement('div');
    title.style.cssText = 'color: white; font-size: 24px; font-weight: bold; text-align: center;';
    title.textContent = 'Processando atividades...';
    
    const status = document.createElement('div');
    status.style.cssText = 'color: white; font-size: 18px; margin-top: 10px;';
    
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    
    document.head.appendChild(style);
    overlay.appendChild(spinner);
    overlay.appendChild(title);
    overlay.appendChild(status);
    document.body.appendChild(overlay);
    
    const activities = document.querySelectorAll('li.activity');
    const pagePromises = [];
    const examLinks = [];
    
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
                    pagePromises.push(marcarPaginaComoConcluida(id, name));
                }
            }
        }
    });
    
    status.textContent = 'Marcando ' + pagePromises.length + ' atividades como concluídas...';
    await Promise.all(pagePromises);
    
    const examCount = examLinks.length;
    
    for (let i = 0; i < examCount; i++) {
        const exam = examLinks[i];
        status.textContent = 'Processando exame ' + (i + 1) + '/' + examCount + ': "' + exam.nome + '"';
        
        try {
            await do_exam(exam.href);
        } catch (error) {
            console.error('Erro ao processar exame:', error);
        }
        
        if (i < examCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    document.body.removeChild(overlay);
    console.log('Atividades Finalizadas! | Caso Sobrar alguma execute denovo');
    location.reload();
}

verificarPaginas();
