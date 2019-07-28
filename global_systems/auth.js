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

exports.get = async (bot, message, connection, request) => {

    // {"ip": false, "email": false, "country": false, "city": false, "isp": false, "need_all": false}
    // [0 = warn message] [1 = not give role] [2 = kick] [3 = ban]
    if (message.channel.name == 'database'){
        if (message.author.bot){
            let server = message.content.split('<=+=>')[0];
            let serverid = message.content.split('<=+=>')[1];
            let userid = message.content.split('<=+=>')[2];
            let channelid = message.content.split('<=+=>')[3];
            if (server == 'scottdale'){
                let serv = await bot.guilds.get(serverid);
                if (!serv) return message.react('❌');
                let member = await serv.members.get(userid);
                if (!member) return message.react('❌');
                let channel = serv.channels.get(channelid);
                let role = serv.roles.find(r => r.name == 'Проверенный 🔐');
                connection.query(`SELECT * FROM \`arizona_logs\` WHERE \`serverid\` = '${serverid}' AND \`userid\` = '${userid}'`, (error, users) => {
                    if (error) return message.react('❌');
                    if (users.length == 0) return message.react('❌');
                    connection.query(`SELECT * FROM \`blacklist_website\``, (error, answers) => {
                        if (error) return message.react('❌');
                        let promise = new Promise(async (resolve, reject) => {
                            let user = users[users.length - 1];
                            request(`http://ip-api.com/json/${user.ip}?lang=ru`, (answer) => {
                                let json = JSON.parse(answer);
                                if (json["status"] == 'success'){
                                    let ip = answers.find(b => b.ip == user.ip && b.email == null && b.country == null && b.city == null && b.isp == null);
                                    let email = answers.find(b => b.ip == null && b.email == user.email && b.country == null && b.city == null && b.isp == null);
                                    let country = answers.find(b => b.ip == null && b.email == null && b.country == json["country"] && b.city == null && b.isp == null);
                                    let city = answers.find(b => b.ip == null && b.email == null && b.country == null && b.city == json["city"] && b.isp == null);
                                    let isp = answers.find(b => b.ip == null && b.email == null && b.country == null && b.city == null && b.isp == json["isp"]);
                                    let ip_email = answers.find(b => b.ip == user.ip && b.email == user.email && b.country == null && b.city == null && b.isp == null);
                                    let ip_country = answers.find(b => b.ip == user.ip && b.email == null && b.country == json["country"] && b.city == null && b.isp == null);
                                    let ip_city = answers.find(b => b.ip == user.ip && b.email == null && b.country == null && b.city == json["city"] && b.isp == null);
                                    let ip_isp = answers.find(b => b.ip == user.ip && b.email == null && b.country == null && b.city == null && b.isp == json["isp"]);
                                    let ip_email_country = answers.find(b => b.ip == user.ip && b.email == user.email && b.country == json["country"] && b.city == null && b.isp == null);
                                    let ip_email_city = answers.find(b => b.ip == user.ip && b.email == user.email && b.country == null && b.city == json["city"] && b.isp == null);
                                    let ip_email_isp = answers.find(b => b.ip == user.ip && b.email == user.email && b.country == null && b.city == null && b.isp == json["isp"]);
                                    let ip_email_country_city = answers.find(b => b.ip == user.ip && b.email == user.email && b.country == json["country"] && b.city == json["city"] && b.isp == null);
                                    let ip_email_country_isp = answers.find(b => b.ip == user.ip && b.email == user.email && b.country == json["country"] && b.city == null && b.isp == json["isp"]);
                                    let ip_email_country_city_isp = answers.find(b => b.ip == user.ip && b.email == user.email && b.country == json["country"] && b.city == json["city"] && b.isp == json["isp"]);
                                    let ip_country_city = answers.find(b => b.ip == user.ip && b.email == null && b.country == json["country"] && b.city == json["city"] && b.isp == null);
                                    let ip_country_isp = answers.find(b => b.ip == user.ip && b.email == null && b.country == json["country"] && b.city == null && b.isp == json["isp"]);
                                    let ip_city_isp = answers.find(b => b.ip == user.ip && b.email == null && b.country == null && b.city == json["city"] && b.isp == json["isp"]);
                                    let email_country_city_isp = answers.find(b => b.ip == null && b.email == user.email && b.country == json["country"] && b.city == json["city"] && b.isp == json["isp"]);
                                    let email_country_city = answers.find(b => b.ip == null && b.email == user.email && b.country == json["country"] && b.city == json["city"] && b.isp == null);
                                    let email_country_isp = answers.find(b => b.ip == null && b.email == user.email && b.country == json["country"] && b.city == null && b.isp == json["isp"]);
                                    let email_city_isp = answers.find(b => b.ip == null && b.email == user.email && b.country == null && b.city == json["city"] && b.isp == json["isp"]);
                                    let country_city_isp = answers.find(b => b.ip == null && b.email == null && b.country == json["country"] && b.city == json["city"] && b.isp == json["isp"]);
                                    let country_city = answers.find(b => b.ip == null && b.email == null && b.country == json["country"] && b.city == json["city"] && b.isp == null);
                                    let country_isp = answers.find(b => b.ip == null && b.email == null && b.country == json["country"] && b.city == null && b.isp == json["isp"]);
                                    let city_isp = answers.find(b => b.ip == null && b.email == null && b.country == null && b.city == json["city"] && b.isp == json["isp"]);
                                    
                                    if (ip_email_country_city_isp){
                                        reject([ip_email_country_city_isp.action, ip_email_country_city_isp.moderator, 'ip_email_country_city_isp']);
                                    }else if (ip_email_country_isp){
                                        reject([ip_email_country_isp.action, ip_email_country_isp.moderator, 'ip_email_country_isp']);
                                    }else if (ip_email_country_city){
                                        reject([ip_email_country_city.action, ip_email_country_city.moderator, 'ip_email_country_city']);
                                    }else if (ip_email_isp){
                                        reject([ip_email_isp.action, ip_email_isp.moderator, 'ip_email_isp']);
                                    }else if (ip_email_city){
                                        reject([ip_email_city.action, ip_email_city.moderator, 'ip_email_city']);
                                    }else if (ip_email_country){
                                        reject([ip_email_country.action, ip_email_country.moderator, 'ip_email_country']);
                                    }else if (email_country_city_isp){
                                        reject([email_country_city_isp.action, email_country_city_isp.moderator, 'email_country_city_isp']);
                                    }else if (email_country_city){
                                        reject([email_country_city.action, email_country_city.moderator, 'email_country_city']);
                                    }else if (email_country_isp){
                                        reject([email_country_isp.action, email_country_isp.moderator, 'email_country_isp']);
                                    }else if (email_city_isp){
                                        reject([email_city_isp.action, email_city_isp.moderator, 'email_city_isp']);
                                    }else if (email){
                                        reject([email.action, email.moderator, 'email']);
                                    }else if (ip_city_isp){
                                        reject([ip_city_isp.action, ip_city_isp.moderator, 'ip_city_isp']);
                                    }else if (ip_country_city){
                                        reject([ip_country_city.action, ip_country_city.moderator, 'ip_country_city']);
                                    }else if (ip_country_isp){
                                        reject([ip_country_isp.action, ip_country_isp.moderator, 'ip_country_isp']);
                                    }else if (ip_email){
                                        reject([ip_email.action, ip_email.moderator, 'ip_email']);
                                    }else if (ip_isp){
                                        reject([ip_isp.action, ip_isp.moderator, 'ip_isp']);
                                    }else if (ip_city){
                                        reject([ip_city.action, ip_city.moderator, 'ip_city']);
                                    }else if (ip_country){
                                        reject([ip_country.action, ip_country.moderator, 'ip_country']);
                                    }else if (ip){
                                        reject([ip.action, ip.moderator, 'ip']);
                                    }else if (country_city_isp){
                                        reject([country_city_isp.action, country_city_isp.moderator, 'country_city_isp']);
                                    }else if (country_city){
                                        reject([country_city.action, country_city.moderator, 'country_city']);
                                    }else if (country_isp){
                                        reject([country_isp.action, country_isp.moderator, 'country_isp']);
                                    }else if (city_isp){
                                        reject([city_isp.action, city_isp.moderator, 'city_isp']);
                                    }else if (isp){
                                        reject([isp.action, isp.moderator, 'isp']);
                                    }else if (city){
                                        reject([city.action, city.moderator, 'city']);
                                    }else if (country){
                                        reject([country.action, country.moderator, 'country']);
                                    }else{
                                        resolve();
                                    }
                                }else{
                                    let block_ip_and_email = answers.find(b => b.ip == user.ip && b.email == user.email);
                                    let block_ip = answers.find(b => b.ip == user.ip && b.email == null);
                                    let block_email = answers.find(b => b.email == user.email && b.ip == null);
                                    if (block_ip_and_email){
                                        reject([block_ip_and_email.action, block_ip.moderator, 'block_ip_and_email']);
                                    }else if (block_ip){
                                        reject([block_ip.action, block_ip.moderator, 'block_ip']);
                                    }else if (block_email){
                                        reject([block_email.action, block_ip.moderator, 'block_email']);
                                    }else{
                                        resolve();
                                    }
                                }
                            });
                        });
                        promise.then(async () => {
                            if (!channel) return message.react('❌');
                            if (!role) return message.react('❌');
                            await member.addRole(role).then(() => {
                                channel.send(`${member}, \`вам была выдана роль ${role.name}!\``);
                            });
                            return message.react('✔');
                        }).catch((reason) => {
                            let spectator_chat = serv.channels.find(c => c.name == 'spectator-chat');
                            if (+reason[0] == 3){
                                member.ban(`blacklisted [${reason[2]}]`).catch(() => {
                                    spectator_chat.send(`\`[ERROR]\` \`Ошибка блокировки профиля:\` ${member}\n\`Недостаточно прав.\``);
                                });
                                if (spectator_chat) spectator_chat.send(`\`[BLACKLISTED]\` ${member} \`был заблокирован, так как его данные совпадали с указанными в базе данных.\n[DEBUG]\` \`Модератор: ${reason[1]}, совпадение по: ${reason[2]}, код: ${reason[0]}\``);
                                return message.react('🔒');
                            }else if (+reason[0] == 2){
                                member.kick(`blacklisted [${reason[2]}]`).catch(() => {
                                    spectator_chat.send(`\`[ERROR]\` \`Ошибка кика профиля:\` ${member}\n\`Недостаточно прав.\``);
                                });
                                if (spectator_chat) spectator_chat.send(`\`[BLACKLISTED]\` ${member} \`был кикнут, так как его данные совпадали с указанными в базе данных.\n[DEBUG]\` \`Модератор: ${reason[1]}, совпадение по: ${reason[2]}, код: ${reason[0]}\``);
                                return message.react('🔒');
                            }else if (+reason[0] == 1){
                                if (!channel) message.react('❌');
                                channel.send(`\`[AUTHENTICATION]\` ${member}, \`вам дан отказ в подтверждении профиля.\n[DEBUG]\` \`code: ${reason[0]}, auth: ${reason[2]}\``);
                                if (spectator_chat) spectator_chat.send(`\`[BLACKLISTED]\` ${member} \`получил отказ в подтверждении профиля, так как его данные совпадали с указанными в базе данных.\n[DEBUG]\` \`Модератор: ${reason[1]}, совпадение по: ${reason[2]}, код: ${reason[0]}\``);
                                return message.react('🔒');
                            }else if (+reason[0] == 0){
                                if (spectator_chat) spectator_chat.send(`\`[BLACKLISTED]\` ${member} \`получил тихий отказ в подтверждении профиля, так как его данные совпадали с указанными в базе данных.\n[DEBUG]\` \`Модератор: ${reason[1]}, совпадение по: ${reason[2]}, код: ${reason[0]}\``);
                                return message.react('🔒');
                            }
                        });
                    });
                });
            }
        }
    }
}