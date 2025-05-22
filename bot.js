const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, REST, Routes } = require('discord.js');
const axios = require('axios');
const https = require('https');
const { randomInt } = require('crypto');
const fs = require('fs');
const path = require('path');

// Configurações
const config = {
    BASE_URL: "https://edusp-api.ip.tv/",
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://edusp.ip.tv',
        'Referer': 'https://edusp.ip.tv/',
        'X-Api-Realm': 'edusp',
        'X-Api-Platform': 'webclient',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    SUBSCRIPTION_KEY: "2b03c1db3884488795f79c37c069381a",
    LOGIN_URL: "https://sedintegracoes.educacao.sp.gov.br/credenciais/api/LoginCompletoToken",
    RATE_LIMIT: 5,
    TOKEN: "MTAyNTAyNDc5MTAzNzYyODUwNg.G6gBl3.VOAwwqU8k8AJiz-3bKvm1Q3o-9hrBRHGoo77FU",
    CLIENT_ID: "1025024791037628506"
};

// Cargos permitidos
const ALLOWED_ROLES = {
    STARTER: '🟢 Starter',
    PRO: '🔴 Pro',
    STANDARD: '🟣 Standart'
};

// Limites de tarefas por cargo
const TASK_LIMITS = {
    [ALLOWED_ROLES.STARTER]: 10,
    [ALLOWED_ROLES.PRO]: 30,
    [ALLOWED_ROLES.STANDARD]: Infinity
};

// Caminho para o arquivo JSON de usuários Starter
const STARTER_USERS_FILE = path.join(__dirname, 'starterUsers.json');

// Carrega ou cria o arquivo de usuários Starter
let starterUsers = {};
if (fs.existsSync(STARTER_USERS_FILE)) {
    starterUsers = JSON.parse(fs.readFileSync(STARTER_USERS_FILE, 'utf8'));
}

// Função para salvar usuários Starter
function saveStarterUsers() {
    fs.writeFileSync(STARTER_USERS_FILE, JSON.stringify(starterUsers, null, 2));
}

// Dicionários para armazenamento
const loggedUsers = {};
const taskStatus = {};
const userSettings = {};
const lastRequests = {};
const userTasks = {};
const dailyTaskCounts = {};

// Registro de comandos slash
const commands = [
    {
        name: 'tarefapainel',
        description: 'Painel de controle para gerenciamento de tarefas do EduSP',
        options: []
    },
    {
        name: 'plans',
        description: 'Mostra os planos disponíveis para o bot'
    }
];

const rest = new REST({ version: '10' }).setToken(config.TOKEN);

(async () => {
    try {
        console.log('🔁 Registrando comandos slash...');
        await rest.put(
            Routes.applicationCommands(config.CLIENT_ID),
            { body: commands }
        );
        console.log('✅ Comandos slash registrados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
})();

class EduSPAPI {
    constructor(subscriptionKey) {
        this.subscriptionKey = subscriptionKey;
        this.httpsAgent = new https.Agent({ 
            rejectUnauthorized: false,
            keepAlive: true,
            timeout: 15000
        });
    }

    async login(ra, password) {
        try {
            const response = await axios.post(config.LOGIN_URL, {
                user: ra,
                senha: password
            }, {
                headers: {
                    'Ocp-Apim-Subscription-Key': this.subscriptionKey,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': config.HEADERS['User-Agent']
                },
                httpsAgent: this.httpsAgent,
                timeout: 15000
            });

            if (!response.data?.token) {
                throw new Error('Token não retornado na resposta');
            }

            return {
                token: response.data.token,
                nickname: response.data.DadosUsuario?.NM_NICK ? 
                    `${response.data.DadosUsuario.NM_NICK}-sp` : 
                    null,
                cpf: response.data.DadosUsuario?.NR_CPF,
                email: response.data.DadosUsuario?.DS_EMAIL,
                ra: ra
            };
        } catch (error) {
            console.error('Erro detalhado no login:', {
                status: error.response?.status,
                data: error.response?.data,
                headers: error.response?.headers,
                message: error.message
            });
            throw new Error(error.response?.data?.message || 'Falha no login. Verifique seu RA e senha.');
        }
    }
}

class User {
    constructor(tokenData, discordUser) {
        this.token = tokenData.token;
        this.discordUser = discordUser;
        this.userData = tokenData;
        this.httpsAgent = new https.Agent({ 
            rejectUnauthorized: false,
            keepAlive: true,
            timeout: 15000
        });
        
        this.headers = {
            ...config.HEADERS,
            'Ocp-Apim-Subscription-Key': config.SUBSCRIPTION_KEY,
            'Authorization': `Bearer ${this.token}`
        };

        this.axiosInstance = axios.create({
            baseURL: config.BASE_URL,
            headers: this.headers,
            httpsAgent: this.httpsAgent,
            timeout: 20000
        });
    }

    async registerToken() {
        try {
            const payload = {
                token: this.token,
                realm: 'edusp',
                platform: 'webclient',
                nickname: this.userData.nickname,
                cpf: this.userData.cpf,
                email: this.userData.email,
                login_method: 'SED',
                ra: this.userData.ra
            };

            // Remove campos vazios/nulos
            Object.keys(payload).forEach(key => {
                if (payload[key] === null || payload[key] === undefined) {
                    delete payload[key];
                }
            });

            console.log('Enviando payload para registro:', payload);

            const response = await this.axiosInstance.post(
                "registration/edusp/token", 
                payload,
                {
                    headers: {
                        ...this.headers,
                        'Content-Length': JSON.stringify(payload).length.toString()
                    }
                }
            );

            if (!response.data?.auth_token) {
                throw new Error('Resposta da API inválida - auth_token não encontrado');
            }

            this.authToken = response.data.auth_token;
            this.headers['x-api-key'] = this.authToken;
            this.axiosInstance.defaults.headers['x-api-key'] = this.authToken;
            
            console.log('Token registrado com sucesso');
            return true;
        } catch (error) {
            console.error('Erro detalhado no registro:', {
                error: error.response?.data || error.message,
                status: error.response?.status,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers,
                    data: error.config?.data
                },
                responseHeaders: error.response?.headers
            });

            throw new Error(`Falha no registro: ${error.response?.data?.message || error.message}`);
        }
    }

    async getTasks(expiredOnly = false) {
        try {
            const rooms = await this._getRooms();
            const url = expiredOnly 
                ? "tms/task/todo?expired_only=true&filter_expired=false&with_answer=true&answer_statuses=pending&with_apply_moment=true"
                : "tms/task/todo?expired_only=false&filter_expired=true&with_answer=true&answer_statuses=pending&with_apply_moment=false";

            const params = rooms?.length > 0 
                ? { publication_target: rooms.map(r => r.name) } 
                : {};

            const response = await this.axiosInstance.get(url, { params });
            return await this._loadTasks(response.data);
        } catch (error) {
            console.error('Erro ao buscar tarefas:', {
                error: error.response?.data || error.message,
                config: error.config
            });
            throw new Error('Falha ao carregar tarefas. Tente novamente mais tarde.');
        }
    }

    async _getRooms() {
        try {
            const response = await this.axiosInstance.get("room/user?list_all=true&with_cards=true");
            return response.data?.rooms || [];
        } catch (error) {
            console.error('Erro ao buscar salas:', error);
            return [];
        }
    }

    async _loadTasks(tasks) {
        if (!Array.isArray(tasks)) return [];

        const filteredTasks = tasks.filter(task => 
            task?.id && 
            !task.title?.toLowerCase().includes('redacao') &&
            !task.tags?.some(tag => tag.toLowerCase().includes('redacao'))
        );

        const loadedTasks = [];
        for (const task of filteredTasks) {
            try {
                const response = await this.axiosInstance.get(`tms/task/${task.id}/apply?preview_mode=false`);
                if (response.data) {
                    // Garante que o ID da tarefa é uma string
                    response.data.id = String(response.data.id);
                    loadedTasks.push(response.data);
                }
            } catch (error) {
                console.error(`Erro ao carregar tarefa ${task.id}:`, error);
            }
        }

        return loadedTasks;
    }

    async submit(task, duration = null, waitTime = 0) {
        const now = Date.now();
        
        // Controle de rate limit
        if (lastRequests[this.discordUser.id]) {
            const [count, lastTime] = lastRequests[this.discordUser.id];
            if (now - lastTime < 60000) {
                if (count >= config.RATE_LIMIT) {
                    waitTime = Math.max(waitTime, 60000 - (now - lastTime));
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
                lastRequests[this.discordUser.id] = [count + 1, now];
            } else {
                lastRequests[this.discordUser.id] = [1, now];
            }
        } else {
            lastRequests[this.discordUser.id] = [1, now];
        }

        // Configura tempo de execução
        if (userSettings[this.discordUser.id]) {
            const { minTime, maxTime } = userSettings[this.discordUser.id];
            duration = randomInt(minTime * 60, maxTime * 60 + 1);
        } else {
            duration = randomInt(600, 1201); // 10-20 minutos
        }

        try {
            const answers = {};
            const questions = task.questions?.filter(q => q.type !== 'info') || [];

            // Processa cada questão
            for (const question of questions) {
                let answer = {};
                
                if (question.type === 'media') {
                    answer = { status: 'error', message: 'Type=media system require url' };
                } else if (question.options) {
                    const options = Object.values(question.options);
                    const randomIndex = randomInt(0, options.length);
                    answer = Object.fromEntries(
                        options.map((_, i) => [i, i === randomIndex])
                    );
                }

                answers[String(question.id)] = {
                    question_id: String(question.id),
                    question_type: question.type,
                    answer: answer
                };
            }

            const draft = {
                status: 'submitted',
                accessed_on: 'room',
                executed_on: task.publication_target,
                duration: duration,
                answers: answers
            };

            console.log('Enviando resposta para tarefa:', {
                taskId: task.id,
                draft: draft
            });

            const response = await this.axiosInstance.post(
                `tms/task/${task.id}/answer`,
                draft
            );

            const answerData = response.data;
            const correctAnswers = await this._getCorrectAnswers(task, answerData);
            return await this._putAnswers(correctAnswers, task, answerData);
        } catch (error) {
            console.error(`Erro ao submeter tarefa ${task.id}:`, {
                error: error.response?.data || error.message,
                config: error.config
            });
            return false;
        }
    }

    async _getCorrectAnswers(task, answer) {
        try {
            const response = await this.axiosInstance.get(
                `tms/task/${task.id}/answer/${answer.id}?with_task=true&with_genre=true&with_questions=true&with_assessed_skills=true`
            );
            return response.data;
        } catch (error) {
            console.error(`Erro ao obter respostas corretas para tarefa ${task.id}:`, error);
            return null;
        }
    }

    async _putAnswers(data, task, answer) {
        try {
            const formatted = this._formatAnswers(data);
            await this.axiosInstance.put(
                `tms/task/${task.id}/answer/${answer.id}`,
                formatted
            );
            return true;
        } catch (error) {
            console.error(`Erro ao salvar respostas para tarefa ${task.id}:`, error);
            return false;
        }
    }

    _formatAnswers(data) {
        const result = {
            accessed_on: data.accessed_on,
            executed_on: data.executed_on,
            answers: {}
        };

        for (const [qId, qData] of Object.entries(data.answers)) {
            const question = data.task.questions.find(q => String(q.id) === String(qId));
            if (!question) continue;

            const answer = {
                question_id: String(qData.question_id),
                question_type: question.type
            };

            switch (question.type) {
                case 'order-sentences':
                    answer.answer = question.options.sentences.map(s => s.value);
                    break;
                case 'fill-words':
                    answer.answer = question.options.phrase
                        .filter((_, i) => i % 2)
                        .map(p => p.value);
                    break;
                case 'text_ai':
                    answer.answer = { '0': (question.comment || '').replace(/<[^>]*>/g, '') };
                    break;
                case 'fill-letters':
                    answer.answer = question.options.answer;
                    break;
                case 'cloud':
                    answer.answer = question.options.ids;
                    break;
                default:
                    answer.answer = Object.fromEntries(
                        Object.entries(question.options).map(([id, opt]) => [id, opt.answer])
                    );
            }

            result.answers[String(qId)] = answer;
        }

        return result;
    }
}

// Configuração do cliente Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

// Função para verificar se o usuário tem um dos cargos necessários
async function hasAllowedRole(member) {
    return member.roles.cache.some(role => 
        role.name === ALLOWED_ROLES.STARTER || 
        role.name === ALLOWED_ROLES.PRO || 
        role.name === ALLOWED_ROLES.STANDARD
    );
}

// Função para verificar se um usuário Starter já está registrado
function isStarterUserRegistered(userId) {
    return starterUsers[userId] !== undefined;
}

// Função para registrar um novo usuário Starter
function registerStarterUser(userId) {
    if (!isStarterUserRegistered(userId)) {
        starterUsers[userId] = {
            registeredAt: new Date().toISOString(),
            taskCount: 0
        };
        saveStarterUsers();
        return true;
    }
    return false;
}

// Função para incrementar a contagem de tarefas de um usuário
function incrementTaskCount(userId) {
    if (starterUsers[userId]) {
        starterUsers[userId].taskCount++;
        saveStarterUsers();
    }
    
    // Inicializa o contador diário se não existir
    if (!dailyTaskCounts[userId]) {
        dailyTaskCounts[userId] = 0;
    }
    dailyTaskCounts[userId]++;
}

// Função para verificar se o usuário atingiu o limite de tarefas
function hasReachedTaskLimit(member, userId) {
    const role = member.roles.cache.find(role => 
        role.name === ALLOWED_ROLES.STARTER || 
        role.name === ALLOWED_ROLES.PRO || 
        role.name === ALLOWED_ROLES.STANDARD
    );
    
    if (!role) return true; // Se não tem nenhum cargo permitido
    
    const limit = TASK_LIMITS[role.name];
    if (limit === Infinity) return false;
    
    return dailyTaskCounts[userId] >= limit;
}

// Função para criar embed de tarefas
function createTasksEmbed(tasks, userId) {
    const embed = new EmbedBuilder()
        .setTitle("📚 Lista de Tarefas Disponíveis")
        .setDescription("Selecione uma tarefa específica ou clique em 'Fazer Todas'")
        .setColor(0x3498db)
        .setFooter({ text: `Total de tarefas: ${tasks.length}` });

    tasks.slice(0, 5).forEach((task, index) => {
        embed.addFields({
            name: `📝 Tarefa ${index + 1}`,
            value: `**${task.title}**\nID: ${task.id}\nPrazo: ${task.deadline || 'Não especificado'}`,
            inline: false
        });
    });

    if (tasks.length > 5) {
        embed.addFields({
            name: "🔍 Mais tarefas",
            value: `+${tasks.length - 5} tarefas disponíveis para seleção no menu abaixo`,
            inline: false
        });
    }

    userTasks[userId] = tasks;
    return embed;
}

// Função para criar menu de seleção de tarefas
function createTasksMenu(tasks) {
    return new StringSelectMenuBuilder()
        .setCustomId('selectTask')
        .setPlaceholder('Selecione uma tarefa específica')
        .addOptions(
            tasks.slice(0, 25).map(task => 
                new StringSelectMenuOptionBuilder()
                    .setLabel(task.title.length > 45 ? task.title.substring(0, 42) + '...' : task.title)
                    .setDescription(`ID: ${task.id} | ${task.type || 'Tipo desconhecido'}`)
                    .setValue(String(task.id))
            )
        );
}

// Handler de interações
client.on('interactionCreate', async interaction => {
    try {
        if (!interaction.channel) {
            console.error('Canal não encontrado no cache!');
            return;
        }

        // Comando /plans
        if (interaction.isChatInputCommand() && interaction.commandName === 'plans') {
            const firstEmbed = new EmbedBuilder()
                .setColor('#211e63')
                .setImage('https://cdn.discordapp.com/attachments/1373795000734716014/1374784192449216565/Inserir_um_titulo_83.png?ex=682f4f0d&is=682dfd8d&hm=f5d65e128f683a7f6fdaa5612f782cbfd9f2dae58406deef91da81ba0c3d1efb&');

            const plansEmbed = new EmbedBuilder()
                .setColor('#211e63')
                .setDescription(
                    "## <:discotoolsxyzicon20250520T190108:1374507321933303838> Starter\n" +
                    "- Acesso básico aos bots essenciais.\n" +
                    "- Funções especiais no server.\n" +
                    "- Suporte via ticket.\n" +
                    "- Limite: 1 conta e 10 tarefas/dia\n\n" +
                    "## <:discotoolsxyzicon20250520T190404:1374508047480918239> Pro\n" +
                    "- Acesso a todos os bots avançados.\n" +
                    "- Maior prioridade no suporte.\n" +  
                    "- Acesso a novos recursos em primeira mão.\n" + 
                    "- Sem limitações de contas\n" +
                    "- Limite: 30 tarefas/dia\n\n" +
                    "## <:discotoolsxyzicon20250520T190535:1374508400364224552> Standard\n" +
                    "- Acesso completo a todos os bots disponíveis.\n" +
                    "- Comandos premium e exclusivos.\n" +
                    "- Suporte prioritário 24h.\n" +
                    "- Sem limitações de uso.\n" +
                    "- Acesso a novos recursos em primeira mão."
                )      
                .setImage('https://cdn.discordapp.com/attachments/1309655367386665061/1337557672635011165/Captura_de_tela_2024-01-26_210851_8.png?ex=67d016e7&is=67cec567&hm=746ed79af5d68e38a421f4c5c2f8e646c03e2eda94c0a7c5002e11f8104e6ff3');
           
            const secondEmbed = new EmbedBuilder()
                .setColor('#211e63')
                .setDescription('**Por que adquirir um plano?**\n\nCom nossos bots exclusivos, você otimiza seu tempo nos estudos! Eles ajudam na organização, resumos e pesquisas, permitindo que você foque no que realmente importa. Tenha acesso a ferramentas inteligentes que facilitam sua vida escolar e liberam mais tempo para você.\n\n**Clique em "Ver Planos" para consultar as opções antes de comprar!**')
                .setImage('https://cdn.discordapp.com/attachments/1309655367386665061/1337557672635011165/Captura_de_tela_2024-01-26_210851_8.png?ex=67d016e7&is=67cec567&hm=746ed79af5d68e38a421f4c5c2f8e646c03e2eda94c0a7c5002e11f8104e6ff3');
                
            const buyButton = new ButtonBuilder()
                .setCustomId('buy_button')
                .setLabel('Comprar Planos')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🛒');
                
            const plansButton = new ButtonBuilder()
                .setCustomId('view_plans')
                .setLabel('Detalhes dos Planos')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📋');

            const row = new ActionRowBuilder().addComponents(buyButton, plansButton);
            
            await interaction.reply({ 
                embeds: [firstEmbed, plansEmbed, secondEmbed], 
                components: [row] 
            });
            return;
        }

        // Comando /tarefapainel
        if (interaction.isChatInputCommand() && interaction.commandName === 'tarefapainel') {
            // Verifica se o usuário tem um dos cargos necessários
            const member = await interaction.guild.members.fetch(interaction.user.id);
            if (!await hasAllowedRole(member)) {
                const embed = new EmbedBuilder()
                    .setTitle("❌ Acesso Negado")
                    .setDescription("Você precisa ter um dos seguintes cargos para usar este bot:\n" +
                        `- ${ALLOWED_ROLES.STARTER}\n` +
                        `- ${ALLOWED_ROLES.PRO}\n` +
                        `- ${ALLOWED_ROLES.STANDARD}`)
                    .setColor(0xFF0000);
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            // Verifica se é um usuário Starter e já está registrado
            if (member.roles.cache.some(role => role.name === ALLOWED_ROLES.STARTER)) {
                if (isStarterUserRegistered(interaction.user.id)) {
                    const embed = new EmbedBuilder()
                        .setTitle("❌ Limite Atingido")
                        .setDescription("Usuários com cargo Starter só podem logar em 1 conta.")
                        .setColor(0xFF0000);
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                } else {
                    registerStarterUser(interaction.user.id);
                }
            }

            const embed = new EmbedBuilder()
                .setTitle("🩸 Painel de Tarefas EduSP")
                .setDescription("Gerencie todas as suas tarefas escolares com facilidade!")
                .setColor(0x8B0000)
                .setThumbnail("https://i.imgur.com/J5hZ5zK.png")
                .setFooter({ text: "Clique no botão abaixo para começar" });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('login')
                    .setLabel('🔑 Logar no Sistema')
                    .setStyle(ButtonStyle.Primary)
            );

            await interaction.reply({ embeds: [embed], components: [row] });
            return;
        }

        // Botão de login
        if (interaction.isButton() && interaction.customId === 'login') {
            // Verifica se o usuário tem um dos cargos necessários
            const member = await interaction.guild.members.fetch(interaction.user.id);
            if (!await hasAllowedRole(member)) {
                const embed = new EmbedBuilder()
                    .setTitle("❌ Acesso Negado")
                    .setDescription("Você precisa ter um dos seguintes cargos para usar este bot:\n" +
                        `- ${ALLOWED_ROLES.STARTER}\n` +
                        `- ${ALLOWED_ROLES.PRO}\n` +
                        `- ${ALLOWED_ROLES.STANDARD}`)
                    .setColor(0xFF0000);
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const modal = new ModalBuilder()
                .setCustomId('loginModal')
                .setTitle('🔐 Login EduSP');

            const raInput = new TextInputBuilder()
                .setCustomId('raInput')
                .setLabel("RA (Ex: 12345678sp)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(20);

            const passwordInput = new TextInputBuilder()
                .setCustomId('passwordInput')
                .setLabel("Senha")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(50);

            modal.addComponents(
                new ActionRowBuilder().addComponents(raInput),
                new ActionRowBuilder().addComponents(passwordInput)
            );

            await interaction.showModal(modal);
            return;
        }

        // Modal de login
        if (interaction.isModalSubmit() && interaction.customId === 'loginModal') {
            await interaction.deferReply({ ephemeral: true });

            try {
                const member = await interaction.guild.members.fetch(interaction.user.id);
                
                // Verifica se o usuário atingiu o limite de tarefas diárias
                if (hasReachedTaskLimit(member, interaction.user.id)) {
                    const role = member.roles.cache.find(role => 
                        role.name === ALLOWED_ROLES.STARTER || 
                        role.name === ALLOWED_ROLES.PRO || 
                        role.name === ALLOWED_ROLES.STANDARD
                    );
                    
                    const limit = TASK_LIMITS[role.name];
                    const embed = new EmbedBuilder()
                        .setTitle("❌ Limite Diário Atingido")
                        .setDescription(`Você já completou ${limit} tarefas hoje. Seu limite diário é ${limit}.`)
                        .setColor(0xFF0000);
                    return await interaction.editReply({ embeds: [embed] });
                }

                const ra = interaction.fields.getTextInputValue('raInput');
                const password = interaction.fields.getTextInputValue('passwordInput');

                const api = new EduSPAPI(config.SUBSCRIPTION_KEY);
                const tokenData = await api.login(ra, password);

                const user = new User(tokenData, interaction.user);
                const registered = await user.registerToken();

                if (!registered) {
                    throw new Error('Falha ao registrar token no sistema');
                }

                loggedUsers[interaction.user.id] = user;

                const embed = new EmbedBuilder()
                    .setTitle("🎉 Login Realizado!")
                    .setDescription(`Bem-vindo, ${tokenData.nickname || ra}!`)
                    .setColor(0x00FF00)
                    .addFields(
                        { name: "📝 Fazer Tarefas", value: "Processa todas as tarefas pendentes", inline: true },
                        { name: "⏱ Configurar Tempo", value: "Define tempo por tarefa", inline: true }
                    );

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('doTasks')
                        .setLabel('Fazer Tarefas')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('setTime')
                        .setLabel('Configurar Tempo')
                        .setStyle(ButtonStyle.Secondary)
                );

                await interaction.editReply({ embeds: [embed], components: [row] });
            } catch (error) {
                console.error('Erro no login:', error);
                const embed = new EmbedBuilder()
                    .setTitle("❌ Erro no Login")
                    .setDescription(error.message)
                    .setColor(0xFF0000);

                await interaction.editReply({ embeds: [embed] });
            }
            return;
        }

        // Botão de fazer tarefas
        if (interaction.isButton() && interaction.customId === 'doTasks') {
            await interaction.deferReply({ ephemeral: true });

            try {
                const member = await interaction.guild.members.fetch(interaction.user.id);
                
                // Verifica se o usuário atingiu o limite de tarefas diárias
                if (hasReachedTaskLimit(member, interaction.user.id)) {
                    const role = member.roles.cache.find(role => 
                        role.name === ALLOWED_ROLES.STARTER || 
                        role.name === ALLOWED_ROLES.PRO || 
                        role.name === ALLOWED_ROLES.STANDARD
                    );
                    
                    const limit = TASK_LIMITS[role.name];
                    const embed = new EmbedBuilder()
                        .setTitle("❌ Limite Diário Atingido")
                        .setDescription(`Você já completou ${limit} tarefas hoje. Seu limite diário é ${limit}.`)
                        .setColor(0xFF0000);
                    return await interaction.editReply({ embeds: [embed] });
                }

                const user = loggedUsers[interaction.user.id];
                if (!user) throw new Error("Você precisa fazer login primeiro");

                const [tasks, expiredTasks] = await Promise.all([
                    user.getTasks(false),
                    user.getTasks(true)
                ]);

                const allTasks = [...tasks, ...expiredTasks];
                if (allTasks.length === 0) {
                    const embed = new EmbedBuilder()
                        .setTitle("ℹ️ Nenhuma Tarefa")
                        .setDescription("Não há tarefas pendentes no momento")
                        .setColor(0x0000FF);
                    return await interaction.editReply({ embeds: [embed] });
                }

                const tasksEmbed = createTasksEmbed(allTasks, interaction.user.id);
                const tasksMenu = createTasksMenu(allTasks);

                const actionRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('processAllTasks')
                        .setLabel('✅ Fazer Todas as Tarefas')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('cancelTasks')
                        .setLabel('❌ Cancelar')
                        .setStyle(ButtonStyle.Danger)
                );

                const selectRow = new ActionRowBuilder().addComponents(tasksMenu);

                await interaction.editReply({
                    embeds: [tasksEmbed],
                    components: [selectRow, actionRow]
                });

            } catch (error) {
                console.error('Erro ao carregar tarefas:', error);
                const embed = new EmbedBuilder()
                    .setTitle("❌ Erro ao Carregar Tarefas")
                    .setDescription(error.message)
                    .setColor(0xFF0000);

                await interaction.editReply({ embeds: [embed] });
            }
            return;
        }

        // Processar todas as tarefas
        if (interaction.isButton() && interaction.customId === 'processAllTasks') {
            await interaction.deferReply({ ephemeral: true });

            try {
                const member = await interaction.guild.members.fetch(interaction.user.id);
                const user = loggedUsers[interaction.user.id];
                if (!user) throw new Error("Você precisa fazer login primeiro");

                const tasks = userTasks[interaction.user.id] || [];
                if (tasks.length === 0) {
                    throw new Error("Nenhuma tarefa disponível para processamento");
                }

                // Verifica o limite de tarefas
                const role = member.roles.cache.find(role => 
                    role.name === ALLOWED_ROLES.STARTER || 
                    role.name === ALLOWED_ROLES.PRO || 
                    role.name === ALLOWED_ROLES.STANDARD
                );
                const limit = TASK_LIMITS[role.name];
                
                // Ajusta o número de tarefas a processar se necessário
                let tasksToProcess = tasks;
                if (limit !== Infinity && (dailyTaskCounts[interaction.user.id] || 0) + tasks.length > limit) {
                    tasksToProcess = tasks.slice(0, limit - (dailyTaskCounts[interaction.user.id] || 0));
                }

                taskStatus[interaction.user.id] = {
                    total: tasksToProcess.length,
                    completed: 0,
                    failed: 0,
                    startTime: Date.now()
                };

                const processingEmbed = new EmbedBuilder()
                    .setTitle("⚙️ Processando Todas as Tarefas")
                    .setDescription(`Progresso: 0/${tasksToProcess.length}\n0% concluído`)
                    .setColor(0xFFA500);

                const message = await interaction.editReply({ embeds: [processingEmbed] });

                let successCount = 0;
                for (let i = 0; i < tasksToProcess.length; i++) {
                    try {
                        const waitTime = randomInt(2000, 5001);
                        await new Promise(resolve => setTimeout(resolve, waitTime));

                        const success = await user.submit(tasksToProcess[i]);
                        if (success) {
                            successCount++;
                            incrementTaskCount(interaction.user.id);
                        }

                        taskStatus[interaction.user.id].completed = successCount;
                        taskStatus[interaction.user.id].failed = (i + 1) - successCount;

                        if ((i + 1) % 5 === 0 || i === tasksToProcess.length - 1) {
                            const progress = Math.round(((i + 1) / tasksToProcess.length) * 100);
                            processingEmbed.setDescription(
                                `Progresso: ${i + 1}/${tasksToProcess.length}\n` +
                                `${progress}% concluído\n` +
                                `✅ ${successCount} sucessos | ❌ ${(i + 1) - successCount} falhas`
                            );
                            await message.edit({ embeds: [processingEmbed] });
                        }
                    } catch (error) {
                        console.error(`Erro na tarefa ${i + 1}:`, error);
                        taskStatus[interaction.user.id].failed++;
                    }
                }

                const resultEmbed = new EmbedBuilder()
                    .setTitle("✅ Processamento Concluído")
                    .setDescription(
                        `Tarefas processadas: ${tasksToProcess.length}\n` +
                        `✅ ${successCount} sucessos\n` +
                        `❌ ${tasksToProcess.length - successCount} falhas`
                    )
                    .setColor(0x00FF00)
                    .setFooter({ text: `Tempo total: ${((Date.now() - taskStatus[interaction.user.id].startTime) / 1000).toFixed(1)} segundos` });

                delete taskStatus[interaction.user.id];
                delete userTasks[interaction.user.id];
                await message.edit({ embeds: [resultEmbed], components: [] });

            } catch (error) {
                console.error('Erro no processamento:', error);
                if (taskStatus[interaction.user.id]) {
                    delete taskStatus[interaction.user.id];
                }
                if (userTasks[interaction.user.id]) {
                    delete userTasks[interaction.user.id];
                }

                const embed = new EmbedBuilder()
                    .setTitle("❌ Erro no Processamento")
                    .setDescription(error.message)
                    .setColor(0xFF0000);

                await interaction.editReply({ embeds: [embed], components: [] });
            }
            return;
        }

        // Selecionar tarefa específica
        if (interaction.isStringSelectMenu() && interaction.customId === 'selectTask') {
            await interaction.deferReply({ ephemeral: true });

            try {
                const member = await interaction.guild.members.fetch(interaction.user.id);
                
                // Verifica se o usuário atingiu o limite de tarefas diárias
                if (hasReachedTaskLimit(member, interaction.user.id)) {
                    const role = member.roles.cache.find(role => 
                        role.name === ALLOWED_ROLES.STARTER || 
                        role.name === ALLOWED_ROLES.PRO || 
                        role.name === ALLOWED_ROLES.STANDARD
                    );
                    
                    const limit = TASK_LIMITS[role.name];
                    const embed = new EmbedBuilder()
                        .setTitle("❌ Limite Diário Atingido")
                        .setDescription(`Você já completou ${limit} tarefas hoje. Seu limite diário é ${limit}.`)
                        .setColor(0xFF0000);
                    return await interaction.editReply({ embeds: [embed] });
                }

                const user = loggedUsers[interaction.user.id];
                if (!user) throw new Error("Você precisa fazer login primeiro");

                const taskId = interaction.values[0];
                const tasks = userTasks[interaction.user.id] || [];
                const task = tasks.find(t => String(t.id) === taskId);

                if (!task) {
                    throw new Error("Tarefa selecionada não encontrada");
                }

                const processingEmbed = new EmbedBuilder()
                    .setTitle(`⚙️ Processando Tarefa: ${task.title}`)
                    .setDescription("Aguarde, estou processando...")
                    .setColor(0xFFA500);

                await interaction.editReply({ embeds: [processingEmbed] });

                const success = await user.submit(task);
                if (success) {
                    incrementTaskCount(interaction.user.id);
                }

                const resultEmbed = new EmbedBuilder()
                    .setTitle(success ? "✅ Tarefa Concluída" : "⚠️ Tarefa Parcialmente Concluída")
                    .setDescription(`**${task.title}**\n${success ? "Processada com sucesso!" : "Ocorreu um problema ao processar"}`)
                    .setColor(success ? 0x00FF00 : 0xFFA500)
                    .addFields(
                        { name: "ID da Tarefa", value: task.id, inline: true },
                        { name: "Tipo", value: task.type || "Desconhecido", inline: true }
                    );

                await interaction.editReply({ embeds: [resultEmbed] });

            } catch (error) {
                console.error('Erro ao processar tarefa:', error);
                const embed = new EmbedBuilder()
                    .setTitle("❌ Erro ao Processar Tarefa")
                    .setDescription(error.message)
                    .setColor(0xFF0000);

                await interaction.editReply({ embeds: [embed] });
            }
            return;
        }

        // Botão de cancelar
        if (interaction.isButton() && interaction.customId === 'cancelTasks') {
            await interaction.deferUpdate();
            await interaction.deleteReply();
            return;
        }

        // Configurar tempo
        if (interaction.isButton() && interaction.customId === 'setTime') {
            const modal = new ModalBuilder()
                .setCustomId('timeModal')
                .setTitle('⏱ Configurar Tempo');

            const minInput = new TextInputBuilder()
                .setCustomId('minTime')
                .setLabel("Tempo Mínimo (minutos)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(3)
                .setValue("10");

            const maxInput = new TextInputBuilder()
                .setCustomId('maxTime')
                .setLabel("Tempo Máximo (minutos)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(3)
                .setValue("20");

            modal.addComponents(
                new ActionRowBuilder().addComponents(minInput),
                new ActionRowBuilder().addComponents(maxInput)
            );

            await interaction.showModal(modal);
            return;
        }

        // Modal de tempo
        if (interaction.isModalSubmit() && interaction.customId === 'timeModal') {
            await interaction.deferReply({ ephemeral: true });

            try {
                const minTime = parseInt(interaction.fields.getTextInputValue('minTime'));
                const maxTime = parseInt(interaction.fields.getTextInputValue('maxTime'));

                if (isNaN(minTime) || isNaN(maxTime) || minTime <= 0 || maxTime <= 0) {
                    throw new Error("Valores devem ser números positivos");
                }
                if (minTime > maxTime) {
                    throw new Error("O tempo mínimo não pode ser maior que o máximo");
                }

                userSettings[interaction.user.id] = { minTime, maxTime };

                const embed = new EmbedBuilder()
                    .setTitle("⏱ Configuração Salva")
                    .setDescription(`Tempo definido:\nMínimo: ${minTime} min\nMáximo: ${maxTime} min`)
                    .setColor(0x00FF00);

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error('Erro na configuração:', error);
                const embed = new EmbedBuilder()
                    .setTitle("❌ Erro na Configuração")
                    .setDescription(error.message)
                    .setColor(0xFF0000);

                await interaction.editReply({ embeds: [embed] });
            }
            return;
        }

    } catch (error) {
        console.error('Erro não tratado no handler de interações:', error);
    }
});

// Resetar contadores diários de tarefas a cada 24 horas
setInterval(() => {
    for (const userId in dailyTaskCounts) {
        dailyTaskCounts[userId] = 0;
    }
    console.log('Contadores diários de tarefas resetados');
}, 24 * 60 * 60 * 1000);

// Evento de ready
client.on('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
    client.user.setActivity({
        name: "/tarefapainel",
        type: 3 // WATCHING
    });
});

// Tratamento de erros globais
process.on('unhandledRejection', error => {
    console.error('Erro não tratado:', error);
});

process.on('uncaughtException', error => {
    console.error('Exceção não capturada:', error);
});

// Iniciar o bot
client.login(config.TOKEN).catch(error => {
    console.error("❌ Falha ao conectar:", error);
    process.exit(1);
});