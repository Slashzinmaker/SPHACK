// == CONFIGURAÇÃO PRINCIPAL == //
const CONFIG = {
  targetURL: "https://expansao.educacao.sp.gov.br/mod/quiz/attempt.php",
  questionSelector: '.qtext p',
  answerSelector: '.answer input[type="radio"]',
  submitSelector: 'input[name="next"][type="submit"]'
};

// == FUNÇÃO PARA VERIFICAR E EXECUTAR == //
function verificarEExecutar() {
  // Verificar se a URL corresponde ao padrão
  if (window.location.href.includes(CONFIG.targetURL) && 
      window.location.href.includes("attempt=") && 
      window.location.href.includes("cmid=")) {
    
    console.log("URL compatível detectada. Iniciando extração de dados...");
    
    // Extrair pergunta
    const perguntaElement = document.querySelector(CONFIG.questionSelector);
    const pergunta = perguntaElement ? perguntaElement.textContent.trim() : null;
    
    if (!pergunta) {
      console.error("Pergunta não encontrada!");
      return;
    }
    
    // Extrair alternativas
    const alternativasElements = document.querySelectorAll(CONFIG.answerSelector);
    const alternativas = Array.from(alternativasElements).map(input => {
      const labelElement = input.closest('.answer').querySelector('p');
      return {
        valor: input.value,
        texto: labelElement ? labelElement.textContent.trim() : "",
        elemento: input
      };
    }).filter(alt => alt.texto.length > 0);
    
    if (alternativas.length === 0) {
      console.error("Nenhuma alternativa encontrada!");
      return;
    }
    
    // Mostrar dados extraídos no console
    console.log("=== DADOS EXTRAÍDOS ===");
    console.log("Pergunta:", pergunta);
    console.log("Alternativas:");
    alternativas.forEach((alt, index) => {
      console.log(`${String.fromCharCode(97 + index)})`, alt.texto);
    });
    
    // Criar interface de visualização
    criarInterfacePreview(pergunta, alternativas);
  } else {
    console.log("URL não compatível. Script não será executado.");
  }
}

// == FUNÇÃO PARA CRIAR INTERFACE DE PREVIEW == //
function criarInterfacePreview(pergunta, alternativas) {
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
  
  // Criar container principal
  const container = document.createElement('div');
  container.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 10px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 0 20px rgba(0,0,0,0.5);
  `;
  
  // Adicionar título
  const titulo = document.createElement('h2');
  titulo.textContent = 'Pré-visualização da Questão';
  titulo.style.cssText = `
    margin-top: 0;
    color: #2c3e50;
    text-align: center;
  `;
  container.appendChild(titulo);
  
  // Adicionar pergunta
  const perguntaDiv = document.createElement('div');
  perguntaDiv.textContent = pergunta;
  perguntaDiv.style.cssText = `
    margin: 20px 0;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 5px;
    font-weight: bold;
    border-left: 4px solid #3498db;
  `;
  container.appendChild(perguntaDiv);
  
  // Adicionar alternativas
  const alternativasTitle = document.createElement('h3');
  alternativasTitle.textContent = 'Alternativas:';
  alternativasTitle.style.margin = '20px 0 10px 0';
  container.appendChild(alternativasTitle);
  
  const listaAlternativas = document.createElement('div');
  
  alternativas.forEach((alt, index) => {
    const alternativaDiv = document.createElement('div');
    alternativaDiv.style.cssText = `
      margin: 10px 0;
      padding: 10px;
      background: #f1f1f1;
      border-radius: 5px;
      display: flex;
      align-items: center;
    `;
    
    const letra = document.createElement('span');
    letra.textContent = `${String.fromCharCode(97 + index)})`;
    letra.style.cssText = `
      font-weight: bold;
      margin-right: 10px;
      color: #e74c3c;
      min-width: 20px;
    `;
    
    const texto = document.createElement('span');
    texto.textContent = alt.texto;
    
    alternativaDiv.appendChild(letra);
    alternativaDiv.appendChild(texto);
    listaAlternativas.appendChild(alternativaDiv);
  });
  
  container.appendChild(listaAlternativas);
  
  // Adicionar botões
  const botoesDiv = document.createElement('div');
  botoesDiv.style.cssText = `
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
  `;
  
  const btnCancelar = document.createElement('button');
  btnCancelar.textContent = 'Cancelar';
  btnCancelar.style.cssText = `
    padding: 10px 20px;
    background: #e74c3c;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
  `;
  btnCancelar.onclick = () => {
    overlay.remove();
  };
  
  const btnContinuar = document.createElement('button');
  btnContinuar.textContent = 'Continuar';
  btnContinuar.style.cssText = `
    padding: 10px 20px;
    background: #2ecc71;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
  `;
  btnContinuar.onclick = () => {
    overlay.remove();
    // Aqui você pode adicionar a lógica para processar a resposta
    console.log("Processando resposta...");
    // Exemplo: selecionar a primeira alternativa
    // alternativas[0].elemento.click();
    // document.querySelector(CONFIG.submitSelector).click();
  };
  
  botoesDiv.appendChild(btnCancelar);
  botoesDiv.appendChild(btnContinuar);
  container.appendChild(botoesDiv);
  
  overlay.appendChild(container);
  document.body.appendChild(overlay);
}

// == EXECUTAR QUANDO A PÁGINA CARREGAR == //
if (document.readyState === 'complete') {
  verificarEExecutar();
} else {
  window.addEventListener('load', verificarEExecutar);
    }
