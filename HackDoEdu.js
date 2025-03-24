(function() {
    function injectToast() {
        const style = document.createElement("style");
        style.innerHTML = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateX(50px); }
                to { opacity: 1; transform: translateX(0); }
            }

            @keyframes fadeOut {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(50px); }
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
                transform: translateX(50px);
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

            /* Estilo do menu */
            .menu-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: black;
                color: white;
                padding: 20px;
                border-radius: 10px;
                width: 300px;
                text-align: center;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                z-index: 10000;
                display: none;
            }

            .menu-container h2 {
                margin-bottom: 15px;
            }

            .menu-option {
                margin: 10px 0;
                display: flex;
                flex-direction: column;
                text-align: left;
            }

            .menu-option label {
                margin-bottom: 5px;
            }

            .menu-option input {
                padding: 8px;
                width: 100%;
                border-radius: 5px;
                border: none;
                font-size: 14px;
            }

            .close-btn, .confirm-btn {
                background: red;
                color: white;
                border: none;
                padding: 8px 10px;
                margin-top: 10px;
                cursor: pointer;
                border-radius: 5px;
                width: 100%;
            }

            .confirm-btn {
                background: green;
            }
        `;
        document.head.appendChild(style);

        const toast = document.createElement("div");
        toast.className = "toast-container";
        toast.innerHTML = `Injetando HypexScript.....<div class="toast-bar"></div>`;
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
            <h2>HypexScripts</h2>
            <div class="menu-option">
                <label for="ra">RA</label>
                <input type="text" id="ra">
            </div>
            <div class="menu-option">
                <label for="senha">Senha</label>
                <input type="password" id="senha">
            </div>
            <button class="confirm-btn">Confirmar</button>
            <button class="close-btn">Fechar</button>
        `;
        document.body.appendChild(menu);
        menu.style.display = "block";

        document.querySelector(".close-btn").addEventListener("click", () => {
            menu.remove();
        });

        document.querySelector(".confirm-btn").addEventListener("click", () => {
            const raValue = document.getElementById("ra").value;
            const senhaValue = document.getElementById("senha").value;

            if (raValue && senhaValue) {
                const raField = document.querySelector("input[name='ra']") || document.querySelector("#raField");
                const senhaField = document.querySelector("input[name='senha']") || document.querySelector("#senhaField");

                if (raField && senhaField) {
                    raField.value = raValue;
                    senhaField.value = senhaValue;
                    alert("Dados inseridos com sucesso!");
                } else {
                    alert("Erro: Não foi possível encontrar os campos de login no site.");
                }
            } else {
                alert("Por favor, preencha todos os campos!");
            }

            menu.remove();
        });
    }

    injectToast();
})();
