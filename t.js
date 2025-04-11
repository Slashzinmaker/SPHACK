(function(){
    // Função para garantir que o DOM está pronto
    function waitForDOM() {
        return new Promise(resolve => {
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                resolve();
            } else {
                document.addEventListener('DOMContentLoaded', resolve);
            }
        });
    }

    // Função principal que cria o menu
    async function createHackMenu() {
        await waitForDOM();
        
        // Verifica se o menu já existe
        if (document.getElementById('spHackMenu')) {
            document.getElementById('spHackMenu').style.display = 'block';
            return;
        }

        // Cria o elemento do menu
        const menuHTML = `
        <div class="sp-hack-menu" id="spHackMenu" style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 380px;
            background: rgba(30, 30, 46, 0.95);
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(108, 92, 231, 0.3);
            backdrop-filter: blur(5px);
            z-index: 999999;
            font-family: 'Segoe UI', system-ui, sans-serif;
        ">
            <div class="menu-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(108, 92, 231, 0.3);
            ">
                <div class="menu-title" style="
                    font-size: 1.2rem;
                    color: #6c5ce7;
                    font-weight: 600;
                ">
                    <i class="fas fa-code"></i> SP HACK v1.0
                </div>
                <div class="menu-controls" style="display: flex; gap: 8px;">
                    <div class="control-btn close" style="
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        cursor: pointer;
                        background: #ff5f56;
                    "></div>
                    <div class="control-btn minimize" style="
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        cursor: pointer;
                        background: #ffbd2e;
                    "></div>
                    <div class="control-btn maximize" style="
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        cursor: pointer;
                        background: #27c93f;
                    "></div>
                </div>
            </div>
            <div class="menu-items" id="spMenuItems" style="
                display: flex;
                flex-direction: column;
                gap: 10px;
            "></div>
            <div class="menu-status" style="
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 0.7rem;
                color: #a1a1c2;
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px solid rgba(108, 92, 231, 0.2);
            ">
                <div class="status-dot" style="
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #27c93f;
                "></div>
                <span>Sistema operacional - Conectado</span>
            </div>
        </div>`;
        
        // Adiciona o menu ao corpo do documento
        const menuContainer = document.createElement('div');
        menuContainer.innerHTML = menuHTML;
        document.body.appendChild(menuContainer);

        // Dados do menu
        const menuItems = [
            { icon: 'fa-tasks', name: 'Tarefas SP', desc: 'Gerenciamento de tarefas', color: '#6c5ce7' },
            { icon: 'fa-pen-fancy', name: 'Redação SP', desc: 'Ferramentas de escrita', color: '#00b894' },
            { icon: 'fa-expand', name: 'Expansão SP', desc: 'Ampliação de conteúdo', color: '#0984e3' },
            { icon: 'fa-comment-dots', name: 'Speak SP', desc: 'Texto para fala', color: '#e84393' },
            { icon: 'fa-shield-alt', name: 'Proteção SP', desc: 'Anti-detecção', color: '#fdcb6e' },
            { icon: 'fa-bolt', name: 'Turbo SP', desc: 'Aceleração de processos', color: '#e17055' }
        ];
        
        // Cria os itens do menu
        const container = document.getElementById('spMenuItems');
        menuItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.style.cssText = `
                background: rgba(40, 40, 60, 0.7);
                border-radius: 8px;
                padding: 12px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.2s ease;
                border: 1px solid rgba(108, 92, 231, 0.1);
            `;
            itemElement.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="
                        width: 30px;
                        height: 30px;
                        border-radius: 6px;
                        background: rgba(108, 92, 231, 0.2);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        font-size: 1rem;
                        color: ${item.color};
                    ">
                        <i class="fas ${item.icon}"></i>
                    </div>
                    <div>
                        <h3 style="font-size: 0.95rem; font-weight: 500; margin-bottom: 2px;">${item.name}</h3>
                        <p style="font-size: 0.75rem; color: #a1a1c2;">${item.desc}</p>
                    </div>
                </div>
                <button class="sp-item-btn" data-name="${item.name}" style="
                    padding: 6px 15px;
                    background: linear-gradient(135deg, #6c5ce7 0%, #8c7ae6 100%);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">Ativar</button>
            `;
            container.appendChild(itemElement);
        });
        
        // Adiciona Font Awesome se não estiver presente
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const faLink = document.createElement('link');
            faLink.rel = 'stylesheet';
            faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            document.head.appendChild(faLink);
            
            // Espera o CSS carregar
            await new Promise(resolve => {
                faLink.onload = resolve;
                setTimeout(resolve, 500); // Fallback timeout
            });
        }
        
        // Função para ativar item
        function activateItem(itemName) {
            console.log(`[SYSTEM] ${itemName} activated`);
            const buttons = document.querySelectorAll('.sp-item-btn');
            buttons.forEach(btn => {
                if (btn.dataset.name === itemName) {
                    btn.textContent = 'Ativado!';
                    btn.style.background = 'linear-gradient(135deg, #00cec9 0%, #55efc4 100%)';
                    setTimeout(() => {
                        btn.textContent = 'Ativar';
                        btn.style.background = 'linear-gradient(135deg, #6c5ce7 0%, #8c7ae6 100%)';
                    }, 1000);
                }
            });
        }
        
        // Event listeners
        document.querySelectorAll('.sp-item-btn').forEach(btn => {
            btn.addEventListener('click', () => activateItem(btn.dataset.name));
        });
        
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('spHackMenu').style.display = 'none';
        });
        
        document.querySelector('.minimize').addEventListener('click', () => {
            const menu = document.getElementById('spHackMenu');
            menu.style.transform = 'translate(-50%, -50%) scale(0.95)';
            setTimeout(() => {
                menu.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 1000);
        });
        
        document.querySelector('.maximize').addEventListener('click', () => {
            const menu = document.getElementById('spHackMenu');
            menu.style.width = menu.style.width === '420px' ? '380px' : '420px';
        });
    }

    // Inicia o processo
    createHackMenu().catch(console.error);
})();
