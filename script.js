import { Conversation } from '@11labs/client';

const stopButton = document.getElementById('stopButton');
const showHistoryButton = document.getElementById('showHistoryButton');
const saveHistoryButton = document.getElementById('saveHistoryButton');
const chatBody = document.getElementById('chatBody');
const connectionStatus = document.getElementById('connectionStatus');
const agentStatus = document.getElementById('agentStatus');

let conversation;

// Função para salvar mensagem no histórico (armazenado no localStorage)
function saveMessageToHistory(message, sender) {
  const history = JSON.parse(localStorage.getItem('conversationHistory')) || [];
  history.push({
    timestamp: new Date().toISOString(),
    sender,
    message
  });
  localStorage.setItem('conversationHistory', JSON.stringify(history));
}

// Função para exibir mensagem na tela
function displayMessage(message, sender) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', sender);
  
  const messageContent = document.createElement('div');
  messageContent.classList.add('message-content');
  messageContent.textContent = message;
  
  messageElement.appendChild(messageContent);
  chatBody.appendChild(messageElement);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Função para mostrar histórico (alert)
function showHistory() {
  const history = JSON.parse(localStorage.getItem('conversationHistory')) || [];
  if (history.length === 0) {
    alert("Nenhum histórico disponível.");
  } else {
    let historyText = history
      .map(item => `${item.timestamp} [${item.sender}]: ${item.message}`)
      .join('\n');
    alert(historyText);
  }
}

// Função para baixar o histórico como arquivo TXT
function downloadHistoryAsTxt() {
  const history = JSON.parse(localStorage.getItem('conversationHistory')) || [];
  if (history.length === 0) {
    alert("Nenhum histórico disponível para salvar.");
    return;
  }

  const historyText = history
    .map(item => `${item.timestamp} [${item.sender}]: ${item.message}`)
    .join('\n');

  const blob = new Blob([historyText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `conversation_history_${new Date().toISOString()}.txt`;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

// Função para iniciar a conversa automaticamente
async function startConversation() {
  try {
    // Limpa o histórico de conversas anteriores
    localStorage.removeItem('conversationHistory');

    // Solicita permissão para usar o microfone
    await navigator.mediaDevices.getUserMedia({ audio: true });

    conversation = await Conversation.startSession({
      agentId: 'fv2GDhW2drnXxI209xyt',
      onConnect: () => {
        connectionStatus.textContent = 'Conectado';
        displayMessage('Conexão estabelecida com o agente.', 'agent');
      },
      onDisconnect: () => {
        connectionStatus.textContent = 'Desconectado';
        displayMessage('Conexão encerrada.', 'agent');
      },
      onMessage: (message) => {
        const msgText = message.message || 'Mensagem sem conteúdo';
        displayMessage(msgText, 'agent');
        saveMessageToHistory(msgText, 'agent');
      },
      onError: (error) => {
        console.error('Erro:', error);
        displayMessage('Ocorreu um erro na conexão.', 'agent');
      },
      onModeChange: (mode) => {
        agentStatus.textContent = mode.mode === 'speaking' ? 'Falando' : 'Ouvindo';
      },
    });
  } catch (error) {
    console.error('Falha ao iniciar a conversa:', error);
    displayMessage('Falha ao iniciar a conversa. Verifique as permissões do microfone.', 'agent');
  }
}

// Função para encerrar a conversa
async function stopConversation() {
  if (conversation) {
    await conversation.endSession();
    conversation = null;
    displayMessage('Conversa encerrada.', 'agent');
    connectionStatus.textContent = 'Desconectado';
    agentStatus.textContent = 'Ouvindo';
  }
}

// Eventos dos botões
stopButton.addEventListener('click', () => {
  stopConversation();
});

showHistoryButton.addEventListener('click', () => {
  showHistory();
});

saveHistoryButton.addEventListener('click', () => {
  downloadHistoryAsTxt();
});

// Inicia a conversa automaticamente ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  startConversation();
});
