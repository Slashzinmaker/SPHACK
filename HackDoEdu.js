(function() {
    function injectStyles() {
        const style = document.createElement("style");
        style.innerHTML = `
            /* Animações */
            @keyframes fadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes fadeOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-20px); } }

            /* Toast inicial */
            .toast-container {
                position: fixed; top: 20px; right: 20px; background: #333; color: #fff;
                padding: 16px; border-radius: 8px; font-size: 16px; font-family: Arial, sans-serif;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); z-index: 9999; opacity: 0;
                animation: fadeIn 0.5s forwards;
            }
            .toast-bar {
                position: absolute; bottom: 0; left: 0; width: 100%; height: 4px;
                background: #4caf50; animation: progressBar 3s linear forwards;
            }
            @keyframes progressBar { from { width: 100%; } to { width: 0; } }

            /* Menu */
            .menu-container {
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: #000; color: #fff; padding: 20px; border-radius: 10px;
                width: 300px; text-align: center; font-family: Arial, sans-serif;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); border: 2px solid blue;
                z-index: 10000; animation: fadeIn 0.5s forwards;
            }
            .menu-option { margin: 10px 0; display: flex; justify-content: space-between; align-items: center; }
            .menu-btn {
                background: #2196F3; color: white; border: none; padding: 5px 10px;
                margin-top: 10px; cursor: pointer; border-radius: 5px;
                transition: background 0.3s;
            }
            .menu-btn:hover { background: #1976D2; }
            .btn-group { display: flex; justify-content: center; }
            .btn-group button { margin: 5px; }

            /* Ícone minimizado */
            .minimized-icon {
                position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px;
                background: blue; color: white; border-radius: 50%; display: flex;
                align-items: center; justify-content: center; font-family: Arial, sans-serif;
                cursor: grab; z-index: 10000; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                user-select: none;
            }
            .hidden { display: none !important; }
        `;
        document.head.appendChild(style);
    }

    function showToastAndMenu() {
        const toast = document.createElement("div");
        toast.className = "toast-container";
        toast.innerHTML = `Injetando HypexScript...<div class="toast-bar"></div>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = "fadeOut 0.5s forwards";
            setTimeout(() => { toast.remove(); showMenu(); }, 500);
        }, 3000);
    }

    function showMenu() {
        document.querySelector(".minimized-icon")?.classList.add("hidden");

        let menu = document.querySelector(".menu-container");
        if (!menu) {
            menu = document.createElement("div");
            menu.className = "menu-container";
            menu.innerHTML = `
                <h2>HypexScripts</h2>
                <div class="menu-option"><label>Leia SP</label><input type="checkbox" id="plataforma1"></div>
                <div class="menu-option"><label>Tarefas SP</label><input type="checkbox" id="plataforma2"></div>
                <div class="menu-option"><label>Redação SP</label><input type="checkbox" id="plataforma3"></div>
                <div class="btn-group">
                    <button class="menu-btn confirm-btn">Confirmar</button>
                    <button class="menu-btn minimize-btn">Minimizar</button>
                </div>
            `;
            document.body.appendChild(menu);

            menu.querySelector(".minimize-btn").addEventListener("click", () => {
                menu.classList.add("hidden");
                createMinimizedIcon();
            });

            menu.querySelector(".confirm-btn").addEventListener("click", () => {
                const p1 = document.getElementById("plataforma1").checked;
                const p2 = document.getElementById("plataforma2").checked;
                const p3 = document.getElementById("plataforma3").checked;
                alert(`Leia SP: ${p1 ? "Ativada" : "Desativada"}\nTarefas SP: ${p2 ? "Ativada" : "Desativada"}\nRedação SP: ${p3 ? "Ativada" : "Desativada"}`);
                menu.classList.add("hidden");
                createMinimizedIcon();
            });
        } else {
            menu.classList.remove("hidden");
        }
    }

    function createMinimizedIcon() {
        let icon = document.querySelector(".minimized-icon");
        if (!icon) {
            icon = document.createElement("div");
            icon.className = "minimized-icon";
            icon.innerHTML = "☰";
            document.body.appendChild(icon);

            icon.addEventListener("click", () => {
                document.querySelector(".menu-container")?.classList.remove("hidden");
                icon.classList.add("hidden");
            });

            let isDragging = false, offsetX, offsetY;

            function startDrag(e) {
                isDragging = true;
                let clientX = e.clientX || e.touches[0].clientX;
                let clientY = e.clientY || e.touches[0].clientY;
                offsetX = clientX - icon.getBoundingClientRect().left;
                offsetY = clientY - icon.getBoundingClientRect().top;
                icon.style.cursor = "grabbing";
            }

            function moveDrag(e) {
                if (isDragging) {
                    let clientX = e.clientX || e.touches[0].clientX;
                    let clientY = e.clientY || e.touches[0].clientY;
                    icon.style.left = (clientX - offsetX) + "px";
                    icon.style.top = (clientY - offsetY) + "px";
                    icon.style.bottom = "auto";
                    icon.style.right = "auto";
                }
            }

            function stopDrag() {
                isDragging = false;
                icon.style.cursor = "grab";
            }

            icon.addEventListener("mousedown", startDrag);
            document.addEventListener("mousemove", moveDrag);
            document.addEventListener("mouseup", stopDrag);

            icon.addEventListener("touchstart", startDrag);
            document.addEventListener("touchmove", moveDrag);
            document.addEventListener("touchend", stopDrag);
        } else {
            icon.classList.remove("hidden");
        }
    }

    injectStyles();
    showToastAndMenu();
})();
                                          
