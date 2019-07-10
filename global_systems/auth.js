const Discord = require('discord.js');
const fs = require("fs");
const generator = require('../oauth2/generate-password');
const md5 = require('../my_modules/md5');

exports.run = async (bot, message, cooldown, connection) => {
    if (message.content.startsWith('/ban')){
        if (!message.member.hasPermission("MANAGE_ROLES")){
            message.reply(`\`недостаточно прав доступа!\``).then(msg => msg.delete(7000));
            return message.delete();
        }
        const args = message.content.slice(`/ban`).split(/ +/);
        let user = message.guild.member(message.mentions.users.first());
        if (!user || !args[2]){
            message.reply(`\`использование: /ban [user] [причина]\``).then(msg => msg.delete(10000));
            return message.delete();
        }
        if (cooldown.has(message.author.id)){
            message.reply(`\`нельзя так часто блокировать пользователей!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        cooldown.add(message.author.id);
        setTimeout(() => {
            if (cooldown.has(message.author.id)) cooldown.delete(message.author.id);
        }, 30000);
        connection.query(`INSERT INTO \`admin_actions\` (\`server\`, \`moderator\`, \`action\`, \`user\`, \`reason\`) VALUES ('${message.guild.id}', '${message.author.id}', 'ban', '${user.id}', '${args.slice(2)}')`, (error) => {
            if (error){
                message.reply(`\`ошибка на стороне сервера! действия не выполнены!\``);
                return message.delete();
            }
            message.reply(`\`заявка успешно была отправлена!\``).then(msg => msg.delete(7000));
            return message.delete();
        });
    }
}