const Discord = require('discord.js');
const fs = require("fs");
const generator = require('../modules/generate-password');
const md5 = require('../modules/crypt-modules/md5');

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function isInteger(n) {
    return n === +n && n === (n|0);
}

exports.run = async (bot, message, cooldown, connection) => {
    if (message.content.startsWith('/ban')){
        if (!message.member.hasPermission("MANAGE_ROLES")){
            message.reply(`\`недостаточно прав доступа!\``).then(msg => msg.delete(7000));
            return message.delete();
        }
        const args = message.content.slice(`/ban`).split(/ +/);
        let user = message.guild.member(message.mentions.users.first());
        if (!user || !args[2] || !args[3] || !isInteger(+args[2])){
            message.reply(`\`использование: /ban [user] [дни] [причина]\``).then(msg => msg.delete(10000));
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
        let date = addDays(new Date(), +args[2]);
        let mysql_date = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ` +
        `${date.getHours().toString().padStart(2, '0')}:` +
        `${date.getMinutes().toString().padStart(2, '0')}:` +
        `${date.getSeconds().toString().padStart(2, '0')}`;
        connection.query(`INSERT INTO \`admin_actions\` (\`server\`, \`moderator\`, \`action\`, \`time\`, \`user\`, \`reason\`) VALUES ('${message.guild.id}', '${message.author.id}', 'ban', '${mysql_date}', '${user.id}', '${args.slice(3)}')`, (error) => {
            if (error){
                message.reply(`\`ошибка на стороне сервера! действия не выполнены!\``);
                return message.delete();
            }
            message.reply(`\`заявка успешно была отправлена!\``).then(msg => msg.delete(7000));
            return message.delete();
        });
    }
}