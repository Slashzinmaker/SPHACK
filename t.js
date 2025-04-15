(function () {
  function initMenu() {
    if (document.getElementById('spHackMenu') || document.getElementById('spLogo')) return;

    const settings = {
      title: localStorage.getItem('spTitle') || 'SP Hack Menu',
      primaryColor: localStorage.getItem('spPrimaryColor') || '#6c5ce7',
      backgroundColor: localStorage.getItem('spBackground') || 'radial-gradient(circle at center, rgba(20,20,30,0.98), rgba(10,10,20,0.95))'
    };

    // Substituir o menu hambúrguer pela logo
    const logo = document.createElement('img');
    logo.id = 'spLogo';
    logo.src = 'https://marketplace.s9k.store/imgs/logo.png';
    Object.assign(logo.style, {
      position: 'fixed',
      top: '15px',
      left: '15px',
      width: '40px',
      height: '40px',
      cursor: 'pointer',
      zIndex: 1000000,
      borderRadius: '50%',
      boxShadow: '0 0 10px rgba(0,0,0,0.5)',
      transition: 'transform 0.3s ease'
    });
    document.body.appendChild(logo);

    logo.onmouseenter = () => {
      logo.style.transform = 'scale(1.1)';
    };
    logo.onmouseleave = () => {
      logo.style.transform = 'scale(1)';
    };

    logo.onclick = () => {
      const menu = document.getElementById('spHackMenu');
      if (menu) {
        menu.remove();
      } else {
        openMenu();
      }
    };

    function openMenu() {
      const menu = document.createElement('div');
      menu.id = 'spHackMenu';
      Object.assign(menu.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotateX(90deg)',
        background: settings.backgroundColor,
        backdropFilter: 'blur(14px)',
        color: '#fff',
        padding: '35px 25px 25px',
        borderRadius: '18px',
        zIndex: 999999,
        boxShadow: '0 0 40px rgba(0, 0, 0, 0.7)',
        fontFamily: 'Segoe UI, sans-serif',
        textAlign: 'center',
        width: '370px',
        maxHeight: '88vh',
        overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.08)',
        animation: 'flyIn3D 0.5s ease forwards',
        perspective: '800px',
        transformStyle: 'preserve-3d'
      });

      const style = document.createElement('style');
      style.textContent = `
        @keyframes flyIn3D {
          0% {transform: translate(-50%, -50%) rotateX(90deg); opacity: 0}
          100% {transform: translate(-50%, -50%) rotateX(0deg); opacity: 1}
        }
        .sp-button {
          display: block;
          width: 100%;
          margin: 12px 0;
          padding: 14px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
          background: linear-gradient(to right, ${settings.primaryColor}, #8e44ad);
          color: white;
          border: none;
          border-radius: 12px;
          box-shadow: 0 0 12px ${settings.primaryColor}66;
          transition: all 0.3s ease;
        }
        .sp-button:hover {
          transform: scale(1.05);
          box-shadow: 0 0 20px ${settings.primaryColor}bb;
        }
        .sp-button.maintenance {
          background: #444;
          box-shadow: none;
        }
        .sp-button.maintenance:hover {
          background: #555;
        }
        .sp-input {
          width: 100%;
          margin: 6px 0 15px;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid #555;
          background: #222;
          color: #fff;
        }
        label {
          display: block;
          text-align: left;
          margin-top: 10px;
          font-size: 13px;
          color: #bbb;
        }
        .sp-iframe-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.9);
          z-index: 1000001;
          display: flex;
          flex-direction: column;
        }
        .sp-iframe-header {
          padding: 10px;
          background: #222;
          display: flex;
          justify-content: flex-end;
        }
        .sp-iframe-close {
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0 10px;
        }
        .sp-iframe-content {
          flex: 1;
          border: none;
        }
      `;
      document.head.appendChild(style);

      const title = document.createElement('h2');
      title.textContent = settings.title;
      Object.assign(title.style, {
        marginBottom: '25px',
        color: '#a29bfe',
        textShadow: '0 0 5px rgba(162, 155, 254, 0.6)',
        fontSize: '22px',
        letterSpacing: '1px'
      });
      menu.appendChild(title);

      const funcs = [
        { name: 'Tarefas SP', status: 'maintenance' },
        { name: 'Expansão SP', status: 'load', url: 'https://raw.githubusercontent.com/Slashzinmaker/SPHACK/refs/heads/main/HackDoEdu.js' },
        { name: 'Speak SP', status: 'load', url: 'https://speakify.cupiditys.lol/api/bookmark.js' },
        { name: 'Redação SP', status: 'load', url: 'https://raw.githubusercontent.com/Slashzinmaker/SPHACK/refs/heads/main/Redacao.js' },
        { name: 'Provas Paulista SP', status: 'maintenance' },
        { name: 'IA S9K', status: 'load', url: 'https://chat.s9k.store' },
        { name: 'Khan Academy', status: 'load', url: 'https://raw.githubusercontent.com/iUnknownBr/KhanDestroyer/refs/heads/main/KhanDestroyer.js' },
      ];

      funcs.forEach(func => {
        const btn = document.createElement('button');
        btn.textContent = func.status === 'load' ? `Ativar ${func.name}` : `${func.name} (Manutenção)`;
        btn.className = 'sp-button' + (func.status === 'maintenance' ? ' maintenance' : '');
        btn.onclick = () => {
          if (func.status === 'maintenance') {
            showToast(`${func.name} está em manutenção`);
          } else if (func.url) {
            if (func.url.endsWith('.js')) {
              loadScript(func.url, func.name);
            } else {
              loadExternalPage(func.url);
            }
          }
        };
        menu.appendChild(btn);
      });

      // BOTÃO PARA MOSTRAR OPÇÕES AVANÇADAS
      const toggleAdvanced = document.createElement('button');
      toggleAdvanced.textContent = 'Avançado';
      toggleAdvanced.className = 'sp-button';
      toggleAdvanced.style.background = '#2c3e50';
      toggleAdvanced.style.marginTop = '25px';
      menu.appendChild(toggleAdvanced);

      const advancedArea = document.createElement('div');
      advancedArea.style.display = 'none';
      advancedArea.style.marginTop = '20px';
      menu.appendChild(advancedArea);

      toggleAdvanced.onclick = () => {
        advancedArea.style.display = advancedArea.style.display === 'none' ? 'block' : 'none';
      };

      const label1 = document.createElement('label');
      label1.textContent = 'Título do Menu:';
      const input1 = document.createElement('input');
      input1.className = 'sp-input';
      input1.value = settings.title;

      const label2 = document.createElement('label');
      label2.textContent = 'Cor Primária (botões):';
      const input2 = document.createElement('input');
      input2.type = 'color';
      input2.className = 'sp-input';
      input2.value = settings.primaryColor;

      const label3 = document.createElement('label');
      label3.textContent = 'Cor de Fundo:';
      const input3 = document.createElement('input');
      input3.className = 'sp-input';
      input3.placeholder = 'Ex: #000, #222, radial-gradient(...)';
      input3.value = settings.backgroundColor;

      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Salvar Preferências';
      saveBtn.className = 'sp-button';
      saveBtn.onclick = () => {
        localStorage.setItem('spTitle', input1.value);
        localStorage.setItem('spPrimaryColor', input2.value);
        localStorage.setItem('spBackground', input3.value);
        showToast('Preferências salvas! Reabrindo...');
        setTimeout(() => {
          menu.remove();
          openMenu();
        }, 800);
      };

      advancedArea.append(label1, input1, label2, input2, label3, input3, saveBtn);

      const closeBtn = document.createElement('span');
      closeBtn.textContent = '×';
      Object.assign(closeBtn.style, {
        position: 'absolute',
        top: '12px',
        right: '18px',
        cursor: 'pointer',
        fontSize: '24px',
        color: '#aaa',
        transition: '0.3s'
      });
      closeBtn.onmouseover = () => closeBtn.style.color = '#fff';
      closeBtn.onmouseout = () => closeBtn.style.color = '#aaa';
      closeBtn.onclick = () => menu.remove();
      menu.appendChild(closeBtn);

      const watermark = document.createElement('div');
      watermark.textContent = 'Feito por S9K';
      Object.assign(watermark.style, {
        marginTop: '30px',
        fontSize: '11px',
        color: '#888',
        textShadow: '0 0 3px rgba(255,255,255,0.2)',
        opacity: '0.7'
      });
      menu.appendChild(watermark);

      const toast = document.createElement('div');
      toast.id = 'spToast';
      Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: '#2d3436',
        color: 'white',
        padding: '12px 18px',
        borderRadius: '10px',
        boxShadow: '0 0 15px rgba(0,0,0,0.5)',
        opacity: '0',
        transition: 'opacity 0.3s ease',
        zIndex: 999999
      });
      document.body.appendChild(toast);

      function showToast(msg) {
        toast.textContent = msg;
        toast.style.opacity = '1';
        setTimeout(() => toast.style.opacity = '0', 4000);
      }

      function loadScript(url, scriptName) {
        showToast(`Carregando ${scriptName}...`);
        
        // Primeiro verifica se o script já foi carregado
        const existingScript = document.querySelector(`script[src="${url}"]`);
        if (existingScript) {
          showToast(`${scriptName} já está carregado!`);
          return;
        }

        // Cria um elemento script
        const script = document.createElement('script');
        script.src = url;
        
        // Adiciona eventos para monitorar o carregamento
        script.onload = function() {
          showToast(`${scriptName} carregado com sucesso!`);
        };
        
        script.onerror = function() {
          showToast(`Falha ao carregar ${scriptName}`);
        };
        
        // Adiciona o script ao documento
        document.body.appendChild(script);
      }

      function loadExternalPage(url) {
        // Remove qualquer iframe existente
        const existingFrame = document.getElementById('spExternalFrame');
        if (existingFrame) existingFrame.remove();
        
        // Cria container para o iframe
        const container = document.createElement('div');
        container.className = 'sp-iframe-container';
        container.id = 'spExternalFrame';
        
        // Cria header com botão de fechar
        const header = document.createElement('div');
        header.className = 'sp-iframe-header';
        
        const closeBtn = document.createElement('div');
        closeBtn.className = 'sp-iframe-close';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => container.remove();
        
        header.appendChild(closeBtn);
        container.appendChild(header);
        
        // Cria iframe
        const iframe = document.createElement('iframe');
        iframe.className = 'sp-iframe-content';
        iframe.src = url;
        iframe.allow = 'fullscreen';
        container.appendChild(iframe);
        
        document.body.appendChild(container);
      }

      document.body.appendChild(menu);
    }
  }

  if (document.body) {
    initMenu();
  } else {
    window.addEventListener('DOMContentLoaded', initMenu);
  }
})();
