(function() {
    function injectToast() {
        const style = document.createElement("style");
        style.innerHTML = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-20px); }
            }

            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: #333;
                color: #fff;
                padding: 16px;
                border-radius: 8px;
                font-size: 16px;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                z-index: 9999;
                opacity: 0;
                transform: translateY(-20px);
                animation: fadeIn 0.5s forwards;
            }

            .toast-bar {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 4px;
                background-color: #4caf50;
                animation: progressBar 3s linear forwards;
            }

            @keyframes progressBar {
                from { width: 100%; }
                to { width: 0; }
            }

            /* Melhorando o estilo do menu */
            .menu-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #222;
                color: white;
                padding: 20px;
                border-radius: 10px;
                width: 350px;
                text-align: center;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                display: none;
            }

            .menu-container h2 {
                margin-bottom: 15px;
                font-size: 20px;
                color: #4caf50;
            }

            .menu-option {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                border-bottom: 1px solid #444;
            }

            .menu-option label {
                flex-grow: 1;
                text-align: left;
            }

            .menu-option input {
                transform: scale(1.3);
            }

            .button-group {
                display: flex;
                justify-content: space-between;
                margin-top: 15px;
            }

            .close-btn, .confirm-btn {
                flex: 1;
                background: red;
                color: white;
                border: none;
                padding: 8px;
                cursor: pointer;
                border-radius: 5px;
                transition: background 0.3s;
                margin: 5px;
            }

            .confirm-btn {
                background: #4caf50;
            }

            .close-btn:hover {
                background: #d32f2f;
            }

            .confirm-btn:hover {
                background: #388e3c;
            }
        `;
        document.head.appendChild(style);

        const toast = document.createElement("div");
        toast.className = "toast-container";
        toast.innerHTML = `Injetando HypexScript...<div class="toast-bar"></div>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = "fadeOut 0.5s forwards";
            setTimeout(() => {
                toast.remove();
                showMenu();
            }, 500);
        }, 3000);
    }

    function showMenu() {
        const menu = document.createElement("div");
        menu.className = "menu-container";
        menu.innerHTML = `
            <h2>📌 HypexScripts</h2>
            <div class="menu-option">
                <label>📖 Leia SP</label>
                <input type="checkbox" id="plataforma1">
            </div>
            <div class="menu-option">
                <label>📝 Tarefas SP</label>
                <input type="checkbox" id="plataforma2">
            </div>
            <div class="menu-option">
                <label>📜 Redação SP</label>
                <input type="checkbox" id="plataforma3">
            </div>
            <div class="button-group">
                <button class="confirm-btn">✅ Confirmar</button>
                <button class="close-btn">❌ Fechar</button>
            </div>
        `;
        document.body.appendChild(menu);
        menu.style.display = "block";

        document.querySelector(".close-btn").addEventListener("click", () => {
            menu.style.animation = "fadeOut 0.3s forwards";
            setTimeout(() => menu.remove(), 300);
        });

        document.querySelector(".confirm-btn").addEventListener("click", () => {
            const plataforma1 = document.getElementById("plataforma1").checked;
            const plataforma2 = document.getElementById("plataforma2").checked;
            const plataforma3 = document.getElementById("plataforma3").checked;

            alert(`📖 Leia SP: ${plataforma1 ? "Ativada" : "Desativada"}\n📝 Tarefas SP: ${plataforma2 ? "Ativada" : "Desativada"}\n📜 Redação SP: ${plataforma3 ? "Ativada" : "Desativada"}`);
            menu.style.animation = "fadeOut 0.3s forwards";
            setTimeout(() => menu.remove(), 300);
        });
    }

    injectToast();
})();
                                                              
