const Discord = require('discord.js');
const fs = require("fs");
const generator = require('../modules/generate-password');
const md5 = require('../modules/crypt-modules/md5');

exports.run = async (bot, message, auth_request, connection) => {
    if (message.content == '/authme'){
        if (message.member.roles.some(r => r.name == 'Проверенный 🔐')){
            message.reply(`**\`у вас уже есть роль проверенного!\`**`);
            return message.delete();
        }
        if (auth_request.has(message.author.id)){
            message.reply(`**\`вы уже отправляли запрос на авторизацию, ожидайте 2 минуты с прошлого запроса\`**`);
            return message.delete();
        }
        auth_request.add(message.author.id)
        setTimeout(() => {
            if (auth_request.has(message.author.id)) auth_request.delete(message.author.id);           
        }, 120000);
        await connection.query(`SELECT \`state\`, \`userid\`, \`serverid\`, \`channelid\` FROM \`scottdale_auth\` WHERE \`userid\` = '${message.author.id}'`, async function(error, result, fields){
            if (error) return message.delete();
            if (result.length == 0){
                const password = md5(generator.generate({ length: 10, numbers: true, symbols: true }));
                connection.query(`INSERT INTO \`scottdale_auth\` (\`state\`, \`userid\`, \`serverid\`, \`channelid\`) VALUES ('${password}', '${message.author.id}', '${message.guild.id}', '${message.channel.id}')`, async function(error, result, fields){
                    if (error) console.log(error);
                });
                const embed = new Discord.RichEmbed();
                embed.setDescription(`**${message.member}, для авторизации нажмите на [выделенный текст](https://discordapp.com/oauth2/authorize?response_type=code&client_id=488717818829996034&scope=identify+guilds+email&state=scottdale_${password}&prompt=none).**`);
                message.member.send(embed).then(() => {
		            message.reply(`**\`код авторизации был отправлен в личные сообщения!\`**`).then(msg => msg.delete(12000));
		        }).catch(err => {
                    message.reply(`**\`ошибка при отправке в личные сообщения, оставлю код тут!\`**`, embed);
                });
                return message.delete();
            }else if (result.length == 1){
                const embed = new Discord.RichEmbed();
                embed.setDescription(`**${message.member}, для авторизации нажмите на [выделенный текст](https://discordapp.com/oauth2/authorize?response_type=code&client_id=488717818829996034&scope=identify+guilds+email&state=scottdale_${result[0].state}&prompt=none).**`);
                message.member.send(embed).then(() => {
		            message.reply(`**\`код авторизации был отправлен в личные сообщения!\`**`).then(msg => msg.delete(12000));
		        }).catch(err => {
                    message.reply(`**\`ошибка при отправке в личные сообщения, оставлю код тут!\`**`, embed);
                });
                return message.delete();
            }else{
                message.reply(`\`ошибка mysql запроса, код 994\``);
                return message.delete();
            }
            
        });
    }
}