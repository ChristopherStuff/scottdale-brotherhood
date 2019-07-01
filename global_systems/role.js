const Discord = require('discord.js');
const fs = require("fs");

function endsWithAny(suffixes, string) {
    return suffixes.some(function (suffix) {
        return string.endsWith(suffix);
    });
}

function time(s) {
    let ms = s % 1000;
    s = (s - ms) / 1000;
    let secs = s % 60;
    s = (s - secs) / 60;
    let mins = s % 60;
    s = (s - mins) / 60;
    let hrs = s % 24;
    s = (s - hrs) / 24;
    let days = s;
    let status = true;
    let output = '';

    if (days != 0){
        if (days.toString().endsWith('1') && !days.toString().endsWith('11')){
            output += days + ' день';
        }else if (endsWithAny(['2', '3', '4'], days.toString()) && !endsWithAny(['12', '13', '14'], days.toString())){
            output += days + ' дня';
        }else{
            output += days + ' дней';
        }
        status = false;
    }
    if (hrs != 0){
        if (status){
            if (hrs.toString().endsWith('1') && !hrs.toString().endsWith('11')){
                output += hrs + ' час';
            }else if (endsWithAny(['2', '3', '4'], hrs.toString()) && !endsWithAny(['12', '13', '14'], hrs.toString())){
                output += hrs + ' часа';
            }else{
                output += hrs + ' часов';
            }
            status = false;
        }
    }
    if (mins != 0){
        if (status){
            if (mins.toString().endsWith('1') && !mins.toString().endsWith('11')){
                output += mins + ' минуту';
            }else if (endsWithAny(['2', '3', '4'], mins.toString()) && !endsWithAny(['12', '13', '14'], mins.toString())){
                output += mins + ' минуты';
            }else{
                output += mins + ' минут';
            }
            status = false;
        }
    }
    if (secs != 0){
        if (status){
            if (secs.toString().endsWith('1') && !secs.toString().endsWith('11')){
                output += secs + ' секунду';
            }else if (endsWithAny(['2', '3', '4'], secs.toString()) && !endsWithAny(['12', '13', '14'], secs.toString())){
                output += secs + ' секунды';
            }else{
                output += secs + ' секунд';
            }
            status = false;
        }
    }
    if (ms != 0){
        if (status){
            output += ms + ' ms';
        }
    }
    return output;
}

exports.run = async (bot, connection, message, tags, rolesgg, canremoverole, manytags, sened, snyatie) => {

    if (message.content.startsWith('/remove_blacklist')){
        if (!message.member.hasPermission("MANAGE_ROLES")){
            message.reply(`\`недостаточно прав доступа!\``).then(msg => msg.delete(7000));
            return message.delete();
        }
        const args = message.content.slice('/remove_blacklist').split(/ +/);
        if (!args[1]){
            message.reply(`\`укажите никнейм! '/remove_blacklist [name]'\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        let name = args.slice(1).join(" ").toLowerCase();
        connection.query(`SELECT * FROM \`blacklist_names\` WHERE \`name\` = '${name}' AND \`server\` = '${message.guild.id}'`, async (err, names) => {
            if (names.length == 0){
                message.reply(`\`данный никнейм не был найден в чс!\``).then(msg => msg.delete(7000));
                return message.delete();
            }else{
                connection.query(`UPDATE \`blacklist_names\` SET \`blacklisted\` = '0' WHERE \`server\` = '${message.guild.id}' AND \`name\` = '${name}'`);
                message.reply(`\`запрос на удаление с blacklist был успешно выполнен! [${name}]\``);
                message.delete();
                connection.query(`SELECT * FROM \`requests-for-roles\` WHERE \`server\` = '${message.guild.id}' AND \`user\` = '${names[0].user}'`, async (err, users) => {
                    if (users.length > 0){
                        if (new Date(`${users[0].remove_role}`).valueOf() != '-30610224000000'){
                            connection.query(`UPDATE \`requests-for-roles\` SET \`blacklisted\` = '1000-01-01 00:00:00' WHERE \`server\` = '${message.guild.id}' AND \`user\` = '${names[0].user}'`);
                            message.reply(`\`Пользователю\` <@${names[0].user}> \`был снят статус чёрного списка.\``);
                        }else{
                            connection.query(`DELETE FROM \`requests-for-roles\` WHERE \`server\` = '${message.guild.id}' AND \`user\` = '${names[0].user}'`);
                            message.reply(`\`Пользователю\` <@${names[0].user}> \`был удален статус чёрного списка.\``);
                        }
                    }
                });
            }
        });
    }

    if (message.content.startsWith('/remove_accepted')){
        if (!message.member.hasPermission("MANAGE_ROLES")){
            message.reply(`\`недостаточно прав доступа!\``).then(msg => msg.delete(7000));
            return message.delete();
        }
        let user = message.guild.member(message.mentions.members.first());
        if (!user){
            message.reply(`\`укажите пользователя! '/remove_accepted [user]'\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        connection.query(`SELECT * FROM \`requests-for-roles\` WHERE \`server\` = '${message.guild.id}' AND \`user\` = '${user.id}'`, async (err, users) => {
            if (users.length > 0){
                if (new Date(`${users[0].blacklisted}`).valueOf() != '-30610224000000'){
                    connection.query(`UPDATE \`requests-for-roles\` SET \`remove_role\` = '1000-01-01 00:00:00', \`staff\` = '' WHERE \`server\` = '${message.guild.id}' AND \`user\` = '${user.id}'`);
                    message.reply(`\`Пользователю\` ${user} \`был снят статус снятие роли.\``);
                    return message.delete();
                }else{
                    connection.query(`DELETE FROM \`requests-for-roles\` WHERE \`server\` = '${message.guild.id}' AND \`user\` = '${user.id}'`);
                    message.reply(`\`Пользователю\` ${user} \`был удален статус снятие роли.\``);
                    return message.delete();
                }
            }else{
                message.reply(`\`данный никнейм не найден в списке предупреждений!\``).then(msg => msg.delete(7000));
                return message.delete();
            }
        });
    }

    if (message.content.toLowerCase().includes("сними") || message.content.toLowerCase().includes("снять")){
        if (!message.member.roles.some(r => canremoverole.includes(r.name)) && !message.member.hasPermission("MANAGE_ROLES")) return
        const args = message.content.split(/ +/)
        let onebe = false;
        let twobe = false;
        args.forEach(word => {
            if (word.toLowerCase().includes(`роль`)) onebe = true
            if (word.toLowerCase().includes(`у`)) twobe = true
        })
        if (!onebe || !twobe) return
        if (message.mentions.users.size > 1) return message.react(`📛`)
        let user = message.guild.member(message.mentions.users.first());
        if (!user) return message.react(`📛`)
        if (snyatie.has(message.author.id + `=>` + user.id)) return message.react(`🕖`)
        let reqchat = message.guild.channels.find(c => c.name == `requests-for-roles`); // Найти чат на сервере.
        if(!reqchat){
            message.reply(`\`Ошибка выполнения. Канал requests-for-roles не был найден!\``)
            return console.error(`Канал requests-for-roles не был найден!`)
        }
        let roleremove = user.roles.find(r => rolesgg.includes(r.name));
        if (!roleremove) return message.react(`📛`)

        message.reply(`\`напишите причину снятия роли.\``).then(answer => {
            message.channel.awaitMessages(response => response.member.id == message.member.id, {
                max: 1,
                time: 60000,
                errors: ['time'],
            }).then((collected) => {
                const embed = new Discord.RichEmbed()
                .setTitle("`Discord » Запрос о снятии роли.`")
                .setColor("#483D8B")
                .addField("Отправитель", `\`Пользователь:\` <@${message.author.id}>`)
                .addField("Кому снять роль", `\`Пользователь:\` <@${user.id}>`)
                .addField("Роль для снятия", `\`Роль для снятия:\` <@&${roleremove.id}>`)
                .addField("Отправлено с канала", `<#${message.channel.id}>`)
                .addField("Причина снятия роли", `${collected.first().content}`)
                .addField("Информация", `\`[✔] - снять роль\`\n` + `\`[❌] - отказать в снятии роли\`\n` + `\`[D] - удалить сообщение\``)
                .setFooter("© Support Team | by Kory_McGregor")
                .setTimestamp()
                reqchat.send(embed).then(async msgsen => {
                    answer.delete();
                    collected.first().delete();
                    await msgsen.react('✔')
                    await msgsen.react('❌')
                    await msgsen.react('🇩')
                    await msgsen.pin();
                })
                snyatie.add(message.author.id + `=>` + user.id)
                return message.react(`📨`);
            }).catch(() => {
                return answer.delete()
            });
        });
    }

    if (message.content.toLowerCase().includes("роль") && !message.content.toLowerCase().includes(`сними`) && !message.content.toLowerCase().includes(`снять`)){
        // Проверить невалидный ли ник.
        connection.query(`SELECT * FROM \`blacklist_names\` WHERE \`name\` = '${message.member.displayName.toLowerCase() || message.member.user.tag.toLowerCase()}' AND \`server\` = '${message.guild.id}'`, async (err, names) => {
            if (names.length > 1){
                message.reply(`\`произошла ошибка! код ошибки: 521\``);
                return message.delete();
            }
            if (names.length == 1){
                if (names[0].blacklisted == true){
                    if (message.member.roles.some(r=>rolesgg.includes(r.name))) {
                        for (var i in rolesgg){
                            let rolerem = bot.guilds.find(g => g.id == message.guild.id).roles.find(r => r.name == rolesgg[i]);
                            if (message.member.roles.some(role=>[rolesgg[i]].includes(role.name))){
                                await message.member.removeRole(rolerem); // Забрать роли указанные ранее.
                            }
                        }
                    }
                    let moderator_chat = message.guild.channels.find(c => c.name == 'spectator-chat');
                    if (moderator_chat) moderator_chat.send(`${message.member} \`попытался запросить роль. Ответ от системы: BLACKLISTED\`\n\`[DEBUG]\` \`${names[0].name} - ${names[0].blacklisted} - ${names[0].moderator} - ${names[0].time_add}\``);
                    return message.react(`📛`);
                }
            }
            // Проверить все доступные тэги
            connection.query(`SELECT * FROM \`requests-for-roles\` WHERE \`server\` = '${message.guild.id}' AND \`user\` = '${message.author.id}'`, async (err, users) => {
                for (var i in manytags){
                    if (message.member.displayName.toLowerCase().includes("[" + manytags[i].toLowerCase()) || message.member.displayName.toLowerCase().includes(manytags[i].toLowerCase() + "]") || message.member.displayName.toLowerCase().includes("(" + manytags[i].toLowerCase()) || message.member.displayName.toLowerCase().includes(manytags[i].toLowerCase() + ")") || message.member.displayName.toLowerCase().includes("{" + manytags[i].toLowerCase()) || message.member.displayName.toLowerCase().includes(manytags[i].toLowerCase() + "}")){
                        let rolename = tags[manytags[i].toUpperCase()] // Указать название роли по соответствию с тэгом
                        let role = message.guild.roles.find(r => r.name == rolename); // Найти эту роль на discord сервере.
                        let reqchat = message.guild.channels.find(c => c.name == `requests-for-roles`); // Найти чат на сервере.
                        if (!role){
                            message.reply(`\`Ошибка выполнения. Роль ${rolename} не была найдена.\``)
                            return console.error(`Роль ${rolename} не найдена!`);
                        }else if(!reqchat){
                            message.reply(`\`Ошибка выполнения. Канал requests-for-roles не был найден!\``)
                            return console.error(`Канал requests-for-roles не был найден!`)
                        }
                        if (message.member.roles.some(r => [rolename].includes(r.name))){
                            return message.react(`👌`) // Если роль есть, поставить окей.
                        }
                        if (sened.has(message.member.displayName)) return message.react(`🕖`) // Если уже отправлял - поставить часы.
                        let nickname = message.member.displayName;
                        const embed = new Discord.RichEmbed()
                        .setTitle("`Discord » Проверка на валидность ник нейма.`")
                        .setColor("#483D8B")
                        .addField("Аккаунт", `\`Пользователь:\` <@${message.author.id}>`, true)
                        .addField("Никнейм", `\`Ник:\` ${nickname}`, true)
                        .addField("Роль для выдачи", `\`Роль для выдачи:\` <@&${role.id}>`)
                        .addField("Отправлено с канала", `<#${message.channel.id}>`)
                        .addField("Информация по выдачи", `\`[✔] - выдать роль\`\n` + `\`[❌] - отказать в выдачи роли\`\n` + `\`[D] - удалить сообщение\``)
                        .setFooter("© Support Team | by Kory_McGregor")
                        .setTimestamp();
                        if (message.member.roles.some(r => r.name == '🏆 Legendary 🏆')){
                            embed.addField(`ВНИМАНИЕ!!!`, `\`\`\`diff\n- ОБРАТИТЕ ВНИМАНИЕ, ЧТО ДАННЫЙ ПОЛЬЗОВАТЕЛЬ ЯВЛЯЕТСЯ НЕЖЕЛАТЕЛЬНЫМ, ЭТО ОЗНАЧАЕТ ЧТО ОН МОЖЕТ ВАС ОБМАНУТЬ!!!\`\`\``);	
                        }
                        if (users.length == 1){
                            if (new Date(`${users[0].blacklisted}`).valueOf() != '-30610224000000'){
                                let date = new Date().valueOf() - new Date(`${users[0].blacklisted}`).valueOf();
                                if (+date < 604800000) embed.addField(`Внимание! Чёрный список!`, `\`\`\`diff\n- ${time(date)} назад у данного пользователя был отмечен никнейм как невалидный.\n- Будьте внимательны перед проверкой его на роль! Данное уведомление действует 7 дней.\`\`\``);
                            }
                            if (new Date(`${users[0].remove_role}`).valueOf() != '-30610224000000'){
                                let date = new Date().valueOf() - new Date(`${users[0].remove_role}`).valueOf();
                                let member = message.guild.members.get(users[0].staff);
                                let staff = ' от ' + member.displayName || ' от ' + member.user.tag || '';
                                if (+date < 259200000) embed.addField(`Снятие роли!`, `\`\`\`diff\n+ ${time(date)} назад у данного пользователя была снята роль по запросу${staff}.\n+ Будьте внимательны перед проверкой его на роль! Данное уведомление действует 3-ое суток.\`\`\``);
                            }
                        }
                        reqchat.send(embed).then(async msgsen => {
                            await msgsen.react('✔')
                            await msgsen.react('❌')
                            await msgsen.react('🇩')
                            await msgsen.pin();
                        })
                        sened.add(message.member.displayName); // Пометить данный ник, что он отправлял запрос.
                        return message.react(`📨`);
                    }
                }
            });
        });
    }
}