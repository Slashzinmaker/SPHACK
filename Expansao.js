async function responderQuestionario(url, tempoProcessamento) {
  const inicio = new Date();

  try {
    // 1. Acessar questionário
    const response = await fetch(url, { credentials: 'include' });
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 2. Extrair dados
    const pergunta = doc.querySelector('.qtext')?.textContent.trim() || "";
    const alternativas = Array.from(doc.querySelectorAll('.answer input[type="radio"]'))
      .map(input => ({
        elemento: input,
        texto: input.closest('.answer')?.textContent.trim() || "",
        valor: input.value
      }))
      .filter(alt => alt.texto.length > 0);

    if (!pergunta || alternativas.length === 0) {
      throw new Error("Dados da questão não encontrados");
    }

    // Mostrar preview da pergunta e alternativas
    await mostrarPreviewPergunta(pergunta, alternativas);

    // 3. Consultar IA
    const respostaIA = await consultarIA(pergunta, alternativas);
    const alternativaCorreta = processarRespostaIA(respostaIA, alternativas);

    if (!alternativaCorreta) {
      throw new Error("Resposta da IA inválida");
    }

    // 4. Selecionar resposta
    await selecionarResposta(alternativaCorreta);

    // 5. Aguardar tempo mínimo
    const tempoDecorrido = new Date() - inicio;
    if (tempoDecorrido < tempoProcessamento) {
      await delay(tempoProcessamento - tempoDecorrido);
    }

  } catch (erro) {
    throw erro;
  }
}

// Nova função para mostrar preview da pergunta
async function mostrarPreviewPergunta(pergunta, alternativas) {
  return new Promise((resolve) => {
    // Criar overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      z-index: 99999;
      display: flex;
      justify-content: center;
      align-items: center;
    `;
    
    // Criar container do preview
    const previewContainer = document.createElement('div');
    previewContainer.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 10px;
      max-width: 80%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
    `;
    
    // Adicionar título
    const titulo = document.createElement('h3');
    titulo.textContent = 'Preview da Pergunta';
    titulo.style.marginTop = '0';
    titulo.style.color = '#333';
    previewContainer.appendChild(titulo);
    
    // Adicionar pergunta
    const perguntaElement = document.createElement('div');
    perguntaElement.textContent = pergunta;
    perguntaElement.style.margin = '15px 0';
    perguntaElement.style.fontWeight = 'bold';
    perguntaElement.style.fontSize = '16px';
    previewContainer.appendChild(perguntaElement);
    
    // Adicionar alternativas
    const alternativasTitle = document.createElement('div');
    alternativasTitle.textContent = 'Alternativas:';
    alternativasTitle.style.margin = '10px 0 5px 0';
    alternativasTitle.style.fontWeight = 'bold';
    previewContainer.appendChild(alternativasTitle);
    
    const listaAlternativas = document.createElement('ul');
    listaAlternativas.style.margin = '0 0 20px 0';
    listaAlternativas.style.paddingLeft = '20px';
    
    alternativas.forEach((alt, index) => {
      const item = document.createElement('li');
      item.textContent = alt.texto;
      item.style.margin = '5px 0';
      listaAlternativas.appendChild(item);
    });
    
    previewContainer.appendChild(listaAlternativas);
    
    // Botão de confirmação
    const btnConfirmar = document.createElement('button');
    btnConfirmar.textContent = 'Continuar';
    btnConfirmar.style.cssText = `
      padding: 10px 20px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    `;
    btnConfirmar.onclick = () => {
      overlay.remove();
      resolve();
    };
    
    previewContainer.appendChild(btnConfirmar);
    overlay.appendChild(previewContainer);
    document.body.appendChild(overlay);
  });
}
