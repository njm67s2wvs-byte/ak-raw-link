const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

// بيانات البوت الخاصة بك التي أرسلتها
const TOKEN = "MTU0NDEzMDA3NjUxNjI4NjUxNA.GQhqgZ.9HX-S7Li3FWsk6aQXZzVW1d-vEfkMW4rF8lAsw";
const CLIENT_ID = "1544130076516286514";

client.once('ready', () => {
    console.log(`[OK] Bot is online! Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong! AK Script Guardian is active and running.');
    }
});

client.login(TOKEN);
