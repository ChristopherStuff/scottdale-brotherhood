const Discord = require('discord.js');
const fs = require("fs");
const generator = require('../oauth2/generate-password');
const md5 = require('../my_modules/md5');

exports.run = async (bot, message, cooldown) => {
    if (message.content.startsWith('/connect')){
        const args = message.content.slice(`/connect`).split(/ +/);
        if (!args[1] || !args[2] || args[3]){
            message.reply(`\`использование: /connect [название аккаунта] [сервер]\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        let servers = ['phoenix', 'tucson', 'scottdale', 'chandler', 'brainburg', 'saintrose', 'mesa', 'redrock', 'yuma'];
        let _servers = {"phoenix": "1", "tucson": "2", "scottdale": "3", "chandler": "4", "brainburg": "5", "saintrose": "8", "mesa": "9", "redrock": "10", "yuma": "12"}
        if (!_servers[args[2].toLowerCase()]){
            message.reply(`\`сервер: ${args[2]} не найден. Сервера: ${servers.join(', ')}\``).then(msg => msg.delete(12000));
            return message.delete();
        }else if (!message.member.roles.some(r => r.name == 'Проверенный 🔐')){
            message.reply(`\`для выполнения данного действия нужна роль проверенного!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        if (cooldown.has(message.author.id)){
            message.reply(`\`повторить попытку можно будет через 2 минуты!\``).then(msg => msg.delete(7000));
            return message.delete();
        }
        cooldown.add(message.author.id);
        setTimeout(() => {
            if (cooldown.has(message.author.id)) cooldown.delete(message.author.id);
        }, 120000);
        const code = md5(generator.generate({ length: 10, numbers: true, symbols: true }));
        await connection.query(`INSERT INTO \`per_day\` (\`server\`, \`game_server\`, \`game_name\`, \`discord_id\`, \`state\`) VALUES ('${message.guild.id}', '${args[2]}', '${args[1]}', '${message.author.id}', '${code}')`, async (error) => {
            if (error){
                message.reply(`\`критическая ошибка! воспроизведение функционала невозможно.\``);
                return message.delete();
            }
            const embed = new Discord.RichEmbed();
            embed.setColor('#FF0000');
            embed.setDescription(`Нажмите на [выделенный текст](https://discordapp.com/oauth2/authorize?response_type=code&client_id=551420210830114858&scope=identify+guilds+email&state=web_${code}) для привязки дискорда к вашему аккаунту в игре.`);
            message.member.send(embed).then(() => {
                message.reply(`\`код вам был отправлен в личные сообщения!\``).then(msg => msg.delete(12000));
            }).catch(err => {
                message.reply(embed);
            });
            return message.delete();
        });
    }
}