(function() {
    // Configurações do overlay
    const config = {
        position: 'fixed',
        width: '450px',
        maxHeight: '600px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        textColor: '#ffffff',
        accentColor: '#4CAF50',
        fontSize: '14px',
        zIndex: '999999'
    };

    // Criar overlay
    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'network-inspector';
        overlay.style.position = config.position;
        overlay.style.top = '10px';
        overlay.style.right = '10px';
        overlay.style.width = config.width;
        overlay.style.maxHeight = config.maxHeight;
        overlay.style.overflowY = 'auto';
        overlay.style.background = config.backgroundColor;
        overlay.style.color = config.textColor;
        overlay.style.padding = '10px';
        overlay.style.borderRadius = '8px';
        overlay.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        overlay.style.zIndex = config.zIndex;
        overlay.style.fontFamily = 'Roboto, Arial, sans-serif';
        overlay.style.fontSize = config.fontSize;
        overlay.style.lineHeight = '1.5';

        overlay.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="margin: 0; color: ${config.accentColor};">📡 Network Inspector</h3>
                <button id="clear-logs" style="background: ${config.accentColor}; border: none; color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Limpar</button>
            </div>
            <div style="margin-bottom: 10px;">
                <input type="text" id="filter-input" placeholder="Filtrar requisições..." style="width: 100%; padding: 5px; border-radius: 4px; border: 1px solid #555;">
            </div>
            <div id="network-logs" style="overflow-y: auto;"></div>
            <div style="margin-top: 10px; font-size: 12px; color: #aaa; text-align: right;">
                Requisições: <span id="request-count">0</span>
            </div>
        `;

        document.body.appendChild(overlay);

        // Adicionar evento para limpar logs
        document.getElementById('clear-logs').addEventListener('click', clearLogs);
        
        // Adicionar filtro
        document.getElementById('filter-input').addEventListener('input', filterLogs);
    }

    // Limpar logs
    function clearLogs() {
        const logContainer = document.getElementById('network-logs');
        logContainer.innerHTML = '';
        updateRequestCount(0);
    }

    // Filtrar logs
    function filterLogs() {
        const filter = document.getElementById('filter-input').value.toLowerCase();
        const logs = document.querySelectorAll('#network-logs .log-item');
        
        logs.forEach(log => {
            const text = log.textContent.toLowerCase();
            log.style.display = text.includes(filter) ? 'block' : 'none';
        });
    }

    // Atualizar contador
    let requestCounter = 0;
    function updateRequestCount(count) {
        requestCounter = count;
        document.getElementById('request-count').textContent = count;
    }

    // Adicionar log
    function logRequest(request) {
        const logContainer = document.getElementById('network-logs');
        if (!logContainer) return;

        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        logItem.style.marginBottom = '10px';
        logItem.style.padding = '10px';
        logItem.style.background = 'rgba(255, 255, 255, 0.1)';
        logItem.style.borderRadius = '6px';
        logItem.style.borderLeft = `3px solid ${config.accentColor}`;
        logItem.style.wordBreak = 'break-word';
        logItem.style.position = 'relative';

        // Formatar o payload se for JSON
        let payload = request.body;
        try {
            if (payload && typeof payload === 'string') {
                const parsed = JSON.parse(payload);
                payload = JSON.stringify(parsed, null, 2);
            }
        } catch (e) {}

        logItem.innerHTML = `
            <div style="display: flex; justify-content: space-between;">
                <strong style="color: ${config.accentColor};">${request.method} ${request.url}</strong>
                <span style="font-size: 12px; color: #aaa;">${new Date().toLocaleTimeString()}</span>
            </div>
            ${request.headers ? `<div style="margin-top: 5px;"><small>Headers: ${JSON.stringify(request.headers, null, 2)}</small></div>` : ''}
            ${payload ? `<pre style="margin: 5px 0; padding: 5px; background: rgba(0,0,0,0.3); border-radius: 4px; overflow-x: auto; font-size: 12px;">${payload}</pre>` : ''}
            <div style="font-size: 12px; color: #aaa; text-align: right;">Status: ${request.status || 'Pending'}</div>
        `;

        // Adicionar funcionalidade de copiar
        logItem.addEventListener('click', function() {
            const textToCopy = `${request.method} ${request.url}\n\nHeaders: ${JSON.stringify(request.headers, null, 2)}\n\nBody: ${payload || 'None'}`;
            navigator.clipboard.writeText(textToCopy);
            
            const copyMsg = document.createElement('div');
            copyMsg.textContent = 'Copiado!';
            copyMsg.style.position = 'absolute';
            copyMsg.style.right = '5px';
            copyMsg.style.top = '5px';
            copyMsg.style.background = config.accentColor;
            copyMsg.style.color = 'white';
            copyMsg.style.padding = '2px 5px';
            copyMsg.style.borderRadius = '3px';
            copyMsg.style.fontSize = '10px';
            logItem.appendChild(copyMsg);
            
            setTimeout(() => copyMsg.remove(), 2000);
        });

        logContainer.insertBefore(logItem, logContainer.firstChild);
        updateRequestCount(requestCounter + 1);
    }

    // Interceptar XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    const activeRequests = new Map();

    XMLHttpRequest.prototype.open = function(method, url) {
        this._request = {
            method: method.toUpperCase(),
            url: url,
            headers: {},
            startTime: Date.now()
        };
        activeRequests.set(this, this._request);
        return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
        if (this._request) {
            this._request.headers[header] = value;
        }
        return originalSetRequestHeader.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
        const request = this._request;
        if (request) {
            request.body = body;
            
            this.addEventListener('load', function() {
                request.status = this.status;
                request.response = this.response;
                request.duration = Date.now() - request.startTime;
                logRequest(request);
                activeRequests.delete(this);
            });
            
            this.addEventListener('error', function() {
                request.status = this.status || 'Error';
                request.error = true;
                logRequest(request);
                activeRequests.delete(this);
            });
        }
        
        return originalSend.apply(this, arguments);
    };

    // Interceptar Fetch API
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        const request = {
            method: (init?.method || 'GET').toUpperCase(),
            url: typeof input === 'string' ? input : input.url,
            headers: init?.headers || {},
            body: init?.body,
            startTime: Date.now()
        };

        return originalFetch.apply(this, arguments).then(response => {
            request.status = response.status;
            request.duration = Date.now() - request.startTime;
            
            // Clonar a resposta para ler o corpo sem consumi-lo
            response.clone().json().then(data => {
                request.response = data;
                logRequest(request);
            }).catch(() => {
                response.clone().text().then(text => {
                    request.response = text;
                    logRequest(request);
                });
            });
            
            return response;
        }).catch(error => {
            request.status = 'Error';
            request.error = error.message;
            logRequest(request);
            throw error;
        });
    };

    // Inicializar
    createOverlay();
    console.log('Network Inspector ativado!');

    // Estilo adicional para melhorar a visualização
    const style = document.createElement('style');
    style.textContent = `
        #network-inspector::-webkit-scrollbar {
            width: 6px;
        }
        #network-inspector::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.1);
        }
        #network-inspector::-webkit-scrollbar-thumb {
            background: ${config.accentColor};
            border-radius: 3px;
        }
        .log-item:hover {
            background: rgba(255,255,255,0.15) !important;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
})();
