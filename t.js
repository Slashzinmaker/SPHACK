(function(){
  function initMenu() {
    if (document.getElementById('spHackMenu')) return;

    const menu = document.createElement('div');
    menu.id = 'spHackMenu';
    Object.assign(menu.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) scale(0.9)',
      background: 'radial-gradient(circle at center, rgba(20,20,30,0.98), rgba(10,10,20,0.95))',
      backdropFilter: 'blur(12px)',
      color: '#fff',
      padding: '35px 25px 25px 25px',
      borderRadius: '18px',
      zIndex: 999999,
      boxShadow: '0 0 30px rgba(0, 0, 0, 0.6)',
      fontFamily: 'Segoe UI, sans-serif',
      textAlign: 'center',
      width: '350px',
      maxHeight: '90vh',
      overflowY: 'auto',
      border: '1px solid rgba(255,255,255,0.08)',
      animation: 'fadeIn 0.4s ease-out forwards'
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from {opacity: 0; transform: translate(-50%, -50%) scale(0.7);}
        to {opacity: 1; transform: translate(-50%, -50%) scale(1);}
      }
      .sp-button {
        display: block;
        width: 100%;
        margin: 12px 0;
        padding: 14px;
        font-size: 15px;
        font-weight: bold;
        cursor: pointer;
        background: linear-gradient(to right, #6c5ce7, #8e44ad);
        color: white;
        border: none;
        border-radius: 12px;
        box-shadow: 0 0 12px rgba(108,92,231,0.4);
        transition: all 0.3s ease;
      }
      .sp-button:hover {
        transform: scale(1.05);
        box-shadow: 0 0 20px rgba(142, 68, 173, 0.7);
      }
      .sp-button.maintenance {
        background: #444;
        box-shadow: none;
      }
      .sp-button.maintenance:hover {
        background: #555;
      }
    `;
    document.head.appendChild(style);

    const title = document.createElement('h2');
    title.textContent = 'SP Hack Menu';
    Object.assign(title.style, {
      marginBottom: '25px',
      color: '#a29bfe',
      textShadow: '0 0 5px rgba(162, 155, 254, 0.6)',
      fontSize: '22px',
      letterSpacing: '1px'
    });
    menu.appendChild(title);

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
      setTimeout(() => toast.style.opacity = '0', 5000);
    }

    const funcs = [
      { name: 'Tarefas SP', status: 'maintenance' },
      { name: 'Expansão SP', status: 'load', url: 'https://raw.githubusercontent.com/Slashzinmaker/SPHACK/refs/heads/main/HackDoEdu.js' },
      { name: 'Speak SP', status: 'load', url: 'https://speakify.cupiditys.lol/api/bookmark.js' },
      { name: 'Redação SP', status: 'load', url: 'https://raw.githubusercontent.com/Slashzinmaker/SPHACK/refs/heads/main/Redacao.js' },
      { name: 'Provas Paulista SP', status: 'maintenance' },
      { name: 'Menu 2.0', status: 'maintenance' }
    ];

    funcs.forEach(func => {
      const btn = document.createElement('button');
      btn.textContent = func.status === 'load' ? `Ativar ${func.name}` : `${func.name} (Manutenção)`;
      btn.className = 'sp-button' + (func.status === 'maintenance' ? ' maintenance' : '');
      btn.onclick = () => {
        if (func.status === 'maintenance') {
          showToast(`${func.name} está em manutenção`);
        } else if (func.status === 'load' && func.url) {
          fetch(`${func.url}?${Math.random()}`)
            .then(r => r.text())
            .then(code => eval(code))
            .catch(err => alert('Erro ao carregar script: ' + err));
        }
      };
      menu.appendChild(btn);
    });

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

    document.body.appendChild(menu);
  }

  if (document.body) {
    initMenu();
  } else {
    window.addEventListener('DOMContentLoaded', initMenu);
  }
})();
