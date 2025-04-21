const supabase = require('../supabaseClient');

const menuInicial = (nome) => `Olá, ${nome}! 👋  
Sou o assistente virtual do *Líder Despachante*. Como posso ajudar?

${'1️⃣'} - Solicitar orçamento  
${'2️⃣'} - Meu documento está pronto?`;

const servicos = [
  { key: '1', label: '0km', msg: '🚗 Parabéns pelo seu novo veículo 0km! Envie seu nome completo e aguarde o atendimento.' },
  { key: '2', label: 'Transferência', msg: '🔄 Para transferência, envie seu nome completo e aguarde o atendimento.' },
  { key: '3', label: 'Licenciamento', msg: '📄 Para licenciamento, envie seu nome completo e aguarde o atendimento.' },
  { key: '4', label: 'Renovação de CNH', msg: '🪪 Vamos renovar sua CNH! Envie seu nome completo e aguarde.' },
  { key: '5', label: 'Liberação de veículo apreendido', msg: '🚓 Para liberar o veículo, envie seu nome completo e aguarde atendimento.' },
  { key: '6', label: 'Perda da placa', msg: '🛑 Perdeu a placa? Envie seu nome completo e aguarde.' },
  { key: '7', label: 'Vistoria', msg: '🔍 Para vistoria, envie seu nome completo e aguarde.' },
  { key: '8', label: 'Recurso de multas', msg: '📬 Para recurso de multas, envie seu nome completo e aguarde.' },
];

const estadoUsuario = {}; 
const aguardandoNome = {};
const usuariosInativos = {};

const formatarDataBR = (dataISO) => {
  const dataObj = new Date(dataISO);
  return dataObj.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};

module.exports = async (client, message) => {
  const msg = message.body.trim().toLowerCase();
  const from = message.from;
  const nomeUsuario = message._data.notifyName || 'cliente';


  if (usuariosInativos[from] && msg !== 'menu') return;


  if (msg === 'menu') {
    delete estadoUsuario[from];
    delete aguardandoNome[from];
    delete usuariosInativos[from];
    client.sendMessage(from, menuInicial(nomeUsuario));
    return;
  }


  if (msg === 'voltar') {
    delete estadoUsuario[from];
    delete aguardandoNome[from];
    client.sendMessage(from, menuInicial(nomeUsuario));
    return;
  }


  if (aguardandoNome[from]) {
    client.sendMessage(from, `✅ Obrigado, *${msg}*! Em breve um atendente entrará em contato com você.  
Encerrando atendimento automático.\n\n➡️ Para voltar ao menu a qualquer momento, digite *menu*.`);
    delete aguardandoNome[from];
    estadoUsuario[from] = null;
    usuariosInativos[from] = true;
    return;
  }

  if (estadoUsuario[from] === 'orçamento') {
    const servico = servicos.find(s => msg === s.key);
    if (servico) {
      client.sendMessage(from, `${servico.msg}\n\n➡️ Para voltar ao menu, digite *menu*.`);
      aguardandoNome[from] = true;
      estadoUsuario[from] = null;
      return;
    } else {
      client.sendMessage(from, '❌ Opção inválida. Escolha um dos serviços listados ou digite *voltar*.');
      return;
    }
  }


  if (estadoUsuario[from] === 'documento') {
    const placa = msg.toUpperCase().replace(/\s+/g, '');
    const { data, error } = await supabase
      .from('documentos')
      .select('status, data_prevista')
      .eq('placa', placa)
      .single();

    if (error || !data) {
      client.sendMessage(from, `❌ Placa *${placa}* não encontrada. Verifique se digitou corretamente.\n\n➡️ Digite *voltar* para retornar ao menu.`);
    } else {
      const status = data.status === 1 ? '⏳ Em andamento' : '✅ Finalizado';
      const dataPrevista = data.data_prevista ? `\n📅 Previsão: ${formatarDataBR(data.data_prevista)}` : '';
      client.sendMessage(from, `📌 Status do documento para placa *${placa}*:\n${status}${dataPrevista}\n\n➡️ Digite *voltar* para retornar ao menu.`);
    }

    estadoUsuario[from] = null;
    return;
  }


  if (!estadoUsuario[from]) {
    if (msg === '1') {
      let texto = '*💼 Escolha um serviço para orçamento:*\n\n';
      servicos.forEach(s => (texto += `${s.key}️⃣ - ${s.label}\n`));
      texto += `\n↩️ Digite *voltar* para retornar ao menu`;
      estadoUsuario[from] = 'orçamento';
      client.sendMessage(from, texto);
      return;
    }

    if (msg === '2') {
      estadoUsuario[from] = 'documento';
      client.sendMessage(from, '🔎 Por favor, envie a *placa do veículo* para verificarmos o status do seu documento.\n\n↩️ Digite *voltar* para retornar ao menu');
      return;
    }
  }


  client.sendMessage(from, menuInicial(nomeUsuario));
};
