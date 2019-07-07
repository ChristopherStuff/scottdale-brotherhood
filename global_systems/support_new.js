const Discord = require('discord.js');
const fs = require("fs");

exports.run = async (bot, message, support_cooldown, connection, st_cd, support_settings) => {
    const image = new Discord.RichEmbed();
    image.setImage("https://imgur.com/LKDbJeM.gif");
    
    if (message.channel.name == support_settings["support_channel"]){
        if (message.author.bot) return message.delete(); // Проверка на бота
        if (support_cooldown.has(message.author.id)) return message.delete(); // Проверка на cooldown
        support_cooldown.add(message.author.id); // Добавление пользователя в cooldown
        setTimeout(() => { if (support_cooldown.has(message.author.id)) support_cooldown.delete(message.author.id); }, 7000); // Удаление из cooldown
        connection.query(`SELECT * FROM \`new-support\` WHERE \`server\` = '${message.guild.id}'`, async (error, answer) => {
            if (error){
                message.reply(`\`произошла ошибка базы данных. повторите позднее.\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            if (answer.length == 0){
                let category = message.guild.channels.find(c => c.name == support_settings["active-tickets"]);
                let moderator = message.guild.roles.find(r => r.name == support_settings["moderator"]);
                if (!category){
                    message.reply(`\`категория активных жалоб не найдена!\``).then(msg => msg.delete(12000));
                    return message.delete();
                }else if (!moderator){
                    message.reply(`\`роль модератора не найдена!\``).then(msg => msg.delete(12000));
                    return message.delete();
                }else if (category.children.size >= 45){
                    message.reply(`\`временно недоступно. очередь забита.\``).then(msg => msg.delete(12000));
                    return message.delete();
                }
                message.channel.send(`` +
                    `**Приветствую! Вы попали в канал поддержки сервера ${support_settings["server_name"]}!**\n` +
                    `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                    `**Количество вопросов за все время: 1**\n` +
                    `**Необработанных модераторами: 1**\n` +
                    `**Вопросы на рассмотрении: 0**\n` +
                    `**Закрытых: 0**`, image)
                .then(async support_message => {
                    await connection.query(`INSERT INTO \`new-support\` (\`server\`, \`message\`, \`tickets\`) VALUES ('${message.guild.id}', '${support_message.id}', '1')`, (error) => {
                        if (error){
                            console.error(`[SUPPORT] Произошла ошибка при UPDATE, суть: ${error}`);
                            return message.delete();
                        }
                        message.guild.createChannel(`ticket-1`, 'text', [
                            {
                                id: moderator.id,
                                allow: ['VIEW_CHANNEL', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS'],
                                deny: ['CREATE_INSTANT_INVITE', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'MENTION_EVERYONE']
                            },
                            {
                                id: message.member.id,
                                allow: ['VIEW_CHANNEL', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS'],
                                deny: ['CREATE_INSTANT_INVITE', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'MENTION_EVERYONE']
                            },
                            {
                                id: message.guild.id,
                                allow: ['SEND_MESSAGES'],
                                deny: ['CREATE_INSTANT_INVITE', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'MENTION_EVERYONE', 'VIEW_CHANNEL', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS']
                            }
                        ]).then(async ticket => {
                            await ticket.setParent(category.id).catch(() => { ticket.setParent(category.id); });
                            await connection.query(`INSERT INTO \`tickets-new\` (\`server\`, \`ticket\`, \`question\`, \`author\`) VALUES ('${message.guild.id}', '1', '${message.content}', '${message.author.id}')`, async (error) => {
                                if (error){
                                    message.reply(`\`критическая ошибка! воспроизведение функционала невозможно.\``);
                                    return message.delete();
                                }
                                message.delete();
                                ticket.send(`<@${message.author.id}> \`для команды поддержки\` <@&${moderator.id}>`, {embed: {
                                    color: 3447003,
                                    title: "Обращение к поддержке Discord",
                                    fields: [{
                                        name: "Отправитель",
                                        value: `**Пользователь:** \`${message.member.displayName || message.member.user.tag}\``,
                                    },{
                                        name: "Суть обращения",
                                        value: `${message.content}`,
                                    }]
                                }}).catch(() => {
                                    ticket.send(`<@${message.author.id}> \`для команды поддержки\` <@&${moderator.id}>`, {embed: {
                                        color: 3447003,
                                        title: "Обращение к поддержке Discord",
                                        description: `${message.content}`
                                    }});
                                });
                                let ticket_log = message.guild.channels.find(c => c.name == support_settings["log_channel"]);
                                if (ticket_log) ticket_log.send(`\`[CREATE]\` <@${message.author.id}> \`создал обращение к поддержке:\` <#${ticket.id}> \`[${ticket.name}]\``);
                                message.channel.send(`<@${message.author.id}>, \`обращение составлено. Нажмите на\` <#${ticket.id}>`).then(msg => msg.delete(15000));
                                await ticket.setParent(category.id).catch(() => { ticket.setParent(category.id); });
                            });
                        });
                    });
                });
            }else{
                let category = message.guild.channels.find(c => c.name == support_settings["active-tickets"]);
                let moderator = message.guild.roles.find(r => r.name == support_settings["moderator"]);
                if (!category){
                    message.reply(`\`категория активных жалоб не найдена!\``).then(msg => msg.delete(12000));
                    return message.delete();
                }else if (!moderator){
                    message.reply(`\`роль модератора не найдена!\``).then(msg => msg.delete(12000));
                    return message.delete();
                }else if (category.children.size >= 45){
                    message.reply(`\`временно недоступно. очередь забита.\``).then(msg => msg.delete(12000));
                    return message.delete();
                }
                await connection.query(`UPDATE \`new-support\` SET \`tickets\` = '${+answer[0].tickets + 1}' WHERE \`server\` = '${message.guild.id}'`, (error) => {
                    if (error){
                        console.error(`[SUPPORT] Произошла ошибка при UPDATE, суть: ${error}`);
                        return message.delete();
                    }
                    message.guild.createChannel(`ticket-${+answer[0].tickets + 1}`, 'text', [
                        {
                            id: moderator.id,
                            allow: ['VIEW_CHANNEL', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS'],
                            deny: ['CREATE_INSTANT_INVITE', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'MENTION_EVERYONE']
                        },
                        {
                            id: message.member.id,
                            allow: ['VIEW_CHANNEL', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS'],
                            deny: ['CREATE_INSTANT_INVITE', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'MENTION_EVERYONE']
                        },
                        {
                            id: message.guild.id,
                            allow: ['SEND_MESSAGES'],
                            deny: ['CREATE_INSTANT_INVITE', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'MENTION_EVERYONE', 'VIEW_CHANNEL', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS']
                        }
                    ]).then(async ticket => {
                        await ticket.setParent(category.id).catch(() => { ticket.setParent(category.id); });
                        await connection.query(`INSERT INTO \`tickets-new\` (\`server\`, \`ticket\`, \`question\`, \`author\`) VALUES ('${message.guild.id}', '${+answer[0].tickets + 1}', '${message.content}', '${message.author.id}')`, async (error) => {
                            if (error){
                                message.reply(`\`критическая ошибка! воспроизведение функционала невозможно.\``);
                                return message.delete();
                            }
                            message.delete();
                            ticket.send(`<@${message.author.id}> \`для команды поддержки\` <@&${moderator.id}>`, {embed: {
                                color: 3447003,
                                title: "Обращение к поддержке Discord",
                                fields: [{
                                    name: "Отправитель",
                                    value: `**Пользователь:** \`${message.member.displayName || message.member.user.tag}\``,
                                },{
                                    name: "Суть обращения",
                                    value: `${message.content}`,
                                }]
                            }}).catch(() => {
                                ticket.send(`<@${message.author.id}> \`для команды поддержки\` <@&${moderator.id}>`, {embed: {
                                    color: 3447003,
                                    title: "Обращение к поддержке Discord",
                                    description: `${message.content}`
                                }});
                            });
                            let ticket_log = message.guild.channels.find(c => c.name == support_settings["log_channel"]);
                            if (ticket_log) ticket_log.send(`\`[CREATE]\` <@${message.author.id}> \`создал обращение к поддержке:\` <#${ticket.id}> \`[${ticket.name}]\``);
                            message.channel.send(`<@${message.author.id}>, \`обращение составлено. Нажмите на\` <#${ticket.id}>`).then(msg => msg.delete(15000));
                            await ticket.setParent(category.id).catch(() => { ticket.setParent(category.id); });
                        });
                    });
                });
            }
        });
    }

    if (message.content == '/hold'){
        if (!message.channel.name.startsWith('ticket-')) return message.delete();
        if (!message.member.hasPermission("ADMINISTRATOR") && !message.member.roles.some(r => r.name == support_settings["moderator"]) && !message.member.roles.some(r => support_settings["administrators"].includes(r.name))) return message.delete();
        if (st_cd.has(message.guild.id)) return message.delete();
        st_cd.add(message.guild.id);
        setTimeout(() => { if (st_cd.has(message.guild.id)) st_cd.delete(message.guild.id); }, 3000);
        connection.query(`SELECT * FROM \`tickets-new\` WHERE \`server\` = '${message.guild.id}' AND \`ticket\` = '${message.channel.name.split('ticket-')[1]}'`, (error, answer) => {
            if (error){
                message.reply(`\`произошла критическая ошибка. повторите попытку позже.\``).then(msg => msg.delete(12000));
                return message.delete();
            }else if (answer.length == 0){
                message.reply(`\`данная жалоба не была найдена в базе данных. error.\``);
                return message.delete();
            }else if (answer.length > 1){
                message.reply(`\`ошибка получения. много результатов. передайте сообщение тех.администраторам discord.\``);
                return message.delete();
            }else if (answer[0].status == 2){
                message.reply(`\`ошибка! данная жалоба уже на рассмотрении!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            let category = message.guild.channels.find(c => c.name == support_settings["hold-tickets"]);
            let author = message.guild.members.get(answer[0].author);
            if (!category){
                message.reply(`\`категория жалоб на рассмотрении не найдена!\``).then(msg => msg.delete(12000));
                return message.delete();
            }else if (category.children.size >= 45){
                message.reply(`\`временно недоступно. очередь забита.\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            connection.query(`UPDATE \`tickets-new\` SET \`status\` = '2' WHERE \`server\` = '${message.guild.id}' AND \`ticket\` = '${message.channel.name.split('ticket-')[1]}'`, async (error) => {
                if (error){
                    message.reply(`\`произошла критическая ошибка. повторите попытку позже.\``).then(msg => msg.delete(12000));
                    return message.delete();
                }
                await message.channel.setParent(category.id).catch((error) => {
                    if (error) console.error(`[SUPPORT] Произошла ошибка при установки категории каналу.`);
                    message.channel.setParent(category.id);
                });
                message.delete();
                if (author){
                    message.channel.send(`${author}, \`вашей жалобе был установлен статус: 'На рассмотрении'. Источник:\` ${message.member}`);
                }else{
                    message.channel.send(`\`Данной жалобе [${message.channel.name}] был установлен статус: 'На рассмотрении'. Источник:\` ${message.member}`);
                }
                let ticket_log = message.guild.channels.find(c => c.name == support_settings["log_channel"]);
                if (ticket_log) ticket_log.send(`\`[STATUS]\` \`Модератор ${message.member.displayName || message.member.user.tag} [${message.member.id}] установил жалобе\` <#${message.channel.id}> \`[${message.channel.name}] статус 'На рассмотрении'\``);
            });
        });
    }

    if (message.content == '/active'){
        if (!message.channel.name.startsWith('ticket-')) return message.delete();
        if (!message.member.hasPermission("ADMINISTRATOR") && !message.member.roles.some(r => r.name == support_settings["moderator"]) && !message.member.roles.some(r => support_settings["administrators"].includes(r.name))) return message.delete();
        if (st_cd.has(message.guild.id)) return message.delete();
        st_cd.add(message.guild.id);
        setTimeout(() => { if (st_cd.has(message.guild.id)) st_cd.delete(message.guild.id); }, 3000);
        connection.query(`SELECT * FROM \`tickets-new\` WHERE \`server\` = '${message.guild.id}' AND \`ticket\` = '${message.channel.name.split('ticket-')[1]}'`, (error, answer) => {
            if (error){
                message.reply(`\`произошла критическая ошибка. повторите попытку позже.\``).then(msg => msg.delete(12000));
                return message.delete();
            }else if (answer.length == 0){
                message.reply(`\`данная жалоба не была найдена в базе данных. error.\``);
                return message.delete();
            }else if (answer.length > 1){
                message.reply(`\`ошибка получения. много результатов. передайте сообщение тех.администраторам discord.\``);
                return message.delete();
            }else if (answer[0].status == 1){
                message.reply(`\`ошибка! данная жалоба уже в обработке!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            let category = message.guild.channels.find(c => c.name == support_settings["active-tickets"]);
            let author = message.guild.members.get(answer[0].author);
            if (!category){
                message.reply(`\`категория активных жалоб не найдена!\``).then(msg => msg.delete(12000));
                return message.delete();
            }else if (category.children.size >= 45){
                message.reply(`\`временно недоступно. очередь забита.\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            connection.query(`UPDATE \`tickets-new\` SET \`status\` = '1' WHERE \`server\` = '${message.guild.id}' AND \`ticket\` = '${message.channel.name.split('ticket-')[1]}'`, async (error) => {
                if (error){
                    message.reply(`\`произошла критическая ошибка. повторите попытку позже.\``).then(msg => msg.delete(12000));
                    return message.delete();
                }
                await message.channel.setParent(category.id).catch((error) => {
                    if (error) console.error(`[SUPPORT] Произошла ошибка при установки категории каналу.`);
                    message.channel.setParent(category.id);
                });
                message.delete();
                if (author){
                    message.channel.send(`${author}, \`вашей жалобе был установлен статус: 'В обработке'. Источник:\` ${message.member}`);
                }else{
                    message.channel.send(`\`Данной жалобе [${message.channel.name}] был установлен статус: 'В обработке'. Источник:\` ${message.member}`);
                }
                let ticket_log = message.guild.channels.find(c => c.name == support_settings["log_channel"]);
                if (ticket_log) ticket_log.send(`\`[STATUS]\` \`Модератор ${message.member.displayName || message.member.user.tag} [${message.member.id}] установил жалобе\` <#${message.channel.id}> \`[${message.channel.name}] статус 'В обработке'\``);
            });
        });
    }

    if (message.content.startsWith('/department')){
        if (!message.channel.name.startsWith('ticket-')) return message.delete();
        if (!message.member.hasPermission("ADMINISTRATOR") && !message.member.roles.some(r => r.name == support_settings["moderator"]) && !message.member.roles.some(r => support_settings["administrators"].includes(r.name))) return message.delete();
        if (st_cd.has(message.guild.id)) return message.delete();
        st_cd.add(message.guild.id);
        setTimeout(() => { if (st_cd.has(message.guild.id)) st_cd.delete(message.guild.id); }, 3000);
        const args = message.content.slice(`/department`).split(/ +/);
        if (!['0', '1'].includes(args[1])){
            message.reply(`\`использование: /department [0/1]\n[0] - ${support_settings["moderator"]}\n[1] - ${support_settings["administrators"].join(', ')}\``).then(msg => msg.delete(20000));
            return message.delete();
        }
        connection.query(`SELECT * FROM \`tickets-new\` WHERE \`server\` = '${message.guild.id}' AND \`ticket\` = '${message.channel.name.split('ticket-')[1]}'`, (error, answer) => {
            if (error){
                message.reply(`\`произошла критическая ошибка. повторите попытку позже.\``).then(msg => msg.delete(12000));
                return message.delete();
            }else if (answer.length == 0){
                message.reply(`\`данная жалоба не была найдена в базе данных. error.\``);
                return message.delete();
            }else if (answer.length > 1){
                message.reply(`\`ошибка получения. много результатов. передайте сообщение тех.администраторам discord.\``);
                return message.delete();
            }else if (+answer[0].department == +args[1]){
                message.reply(`\`ошибка! нельзя передать жалобу тем же модераторам, которые сейчас её обрабатывают!\``).then(msg => msg.delete(18000));
                return message.delete();
            }else if (answer[0].status == 0){
                message.reply(`\`жалоба закрыта, действия невозможны.\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            let moderator = message.guild.roles.find(r => r.name == support_settings["moderator"]);
            let author = message.guild.members.get(answer[0].author);
            if (!moderator){
                message.reply(`\`не найдена роль модератора! некому обрабатывать жалобы!\``);
                return message.delete();
            }
            connection.query(`UPDATE \`tickets-new\` SET \`department\` = '${args[1]}' WHERE \`server\` = '${message.guild.id}' AND \`ticket\` = '${message.channel.name.split('ticket-')[1]}'`, async (error) => {
                if (error){
                    message.reply(`\`произошла критическая ошибка. повторите попытку позже.\``).then(msg => msg.delete(12000));
                    return message.delete();
                }
                message.delete();
                let redirected = [];
                if (args[1] == '0'){
                    support_settings["administrators"].forEach(admin => {
                        let role = message.guild.roles.find(r => r.name == admin);
                        if (role){
                            let permission = message.channel.permissionOverwrites.find(p => p.id == role.id);
                            permission.delete();
                        }
                    });
                    message.channel.overwritePermissions(moderator, {
                        // GENERAL PERMISSIONS
                        CREATE_INSTANT_INVITE: false,
                        MANAGE_CHANNELS: false,
                        MANAGE_ROLES: false,
                        MANAGE_WEBHOOKS: false,
                        // TEXT PERMISSIONS
                        VIEW_CHANNEL: true,
                        SEND_TTS_MESSAGES: false,
                        MANAGE_MESSAGES: false,
                        EMBED_LINKS: true,
                        ATTACH_FILES: true,
                        READ_MESSAGE_HISTORY: true,
                        MENTION_EVERYONE: false,
                        USE_EXTERNAL_EMOJIS: false,
                        ADD_REACTIONS: false,
                    });
                    redirected.push(`<@&${moderator.id}>`);
                }else if (args[1] == '1'){
                    support_settings["administrators"].forEach(admin => {
                        let role = message.guild.roles.find(r => r.name == admin);
                        if (role){
                            message.channel.overwritePermissions(role, {
                                // GENERAL PERMISSIONS
                                CREATE_INSTANT_INVITE: false,
                                MANAGE_CHANNELS: false,
                                MANAGE_ROLES: false,
                                MANAGE_WEBHOOKS: false,
                                // TEXT PERMISSIONS
                                VIEW_CHANNEL: true,
                                SEND_TTS_MESSAGES: false,
                                MANAGE_MESSAGES: false,
                                EMBED_LINKS: true,
                                ATTACH_FILES: true,
                                READ_MESSAGE_HISTORY: true,
                                MENTION_EVERYONE: false,
                                USE_EXTERNAL_EMOJIS: false,
                                ADD_REACTIONS: false,
                            });
                            redirected.push(`<@&${role.id}>`);
                        }
                    });
                    let permission = message.channel.permissionOverwrites.find(p => p.id == moderator.id);
                    permission.delete();
                }
                if (author){
                    message.channel.send(`${author}, \`ваша жалоба была перенаправлена\` ${redirected.join(`, `)} \`Источник:\` ${message.member}`);
                }else{
                    message.channel.send(`\`Данная жалоба была перенаправлена\` ${redirected.join(`, `)} \`Источник:\` ${message.member}`);
                }
                let ticket_log = message.guild.channels.find(c => c.name == "reports-log");
                if (ticket_log) ticket_log.send(`\`[DEPARTMENT]\` \`Модератор ${message.member.displayName || message.member.user.tag} [${message.member.id}] перенаправил жалобу\` <#${message.channel.id}> \`[${message.channel.name}].\``);
            });
        });
    }

    if (message.content.startsWith('/user')){
        if (!message.channel.name.startsWith('ticket-')) return message.delete();
        if (!message.member.hasPermission("ADMINISTRATOR") && !message.member.roles.some(r => r.name == support_settings["moderator"]) && !message.member.roles.some(r => support_settings["administrators"].includes(r.name))) return message.delete();
        if (st_cd.has(message.guild.id)) return message.delete();
        st_cd.add(message.guild.id);
        setTimeout(() => { if (st_cd.has(message.guild.id)) st_cd.delete(message.guild.id); }, 3000);
        let user = message.guild.member(message.mentions.users.first());
        if (!user){
            message.reply(`\`использование: /user [пользователь]\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        connection.query(`SELECT * FROM \`tickets-new\` WHERE \`server\` = '${message.guild.id}' AND \`ticket\` = '${message.channel.name.split('ticket-')[1]}'`, (error, answer) => {
            if (error){
                message.reply(`\`произошла критическая ошибка. повторите попытку позже.\``).then(msg => msg.delete(12000));
                return message.delete();
            }else if (answer.length == 0){
                message.reply(`\`данная жалоба не была найдена в базе данных. error.\``);
                return message.delete();
            }else if (answer.length > 1){
                message.reply(`\`ошибка получения. много результатов. передайте сообщение тех.администраторам discord.\``);
                return message.delete();
            }else if (answer[0].status == 0){
                message.reply(`\`жалоба закрыта, действия невозможны.\``).then(msg => msg.delete(12000));
                return message.delete();
            }else if (user.id == message.author.id && answer[0].user == 0){
                message.reply(`\`в жалобе уже нет пользователей!\``).then(msg => msg.delete(12000));
                return message.delete();
            }else if (user.id == answer[0].user){
                message.reply(`\`данный пользователь уже добавлен к данной жалобе!\``).then(msg => msg.delete(12000));
                return message.delete();
            }else if (user.id != message.author.id && user.id == answer[0].author){
                message.reply(`\`автора жалобы назначить как дополнительного пользователя нельзя!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            let author = message.guild.members.get(answer[0].author);
            if (user.id == message.author.id){
                connection.query(`UPDATE \`tickets-new\` SET \`user\` = '0' WHERE \`server\` = '${message.guild.id}' AND \`ticket\` = '${message.channel.name.split('ticket-')[1]}'`, async (error) => {
                    if (error){
                        message.reply(`\`произошла критическая ошибка. повторите попытку позже.\``).then(msg => msg.delete(12000));
                        return message.delete();
                    }
                    message.delete();
                    let permission = message.channel.permissionOverwrites.find(p => p.id == answer[0].user);
                    permission.delete();
                    if (author){
                        message.channel.send(`${author}, \`модератор\` ${message.member} \`очистил дополнительных пользователей в данной жалобе.\``);
                    }else{
                        message.channel.send(`\`Модератор\` ${message.member} \`очистил дополнительных пользователей в данной жалобе.\``);
                    }
                    let ticket_log = message.guild.channels.find(c => c.name == "reports-log");
                    if (ticket_log) ticket_log.send(`\`[USER]\` \`Модератор ${message.member.displayName || message.member.user.tag} [${message.member.id}] очистил доп.пользователей в жалобе\` <#${message.channel.id}> \`[${message.channel.name}]\``);
                });
            }else{
                connection.query(`UPDATE \`tickets-new\` SET \`user\` = '${user.id}' WHERE \`server\` = '${message.guild.id}' AND \`ticket\` = '${message.channel.name.split('ticket-')[1]}'`, async (error) => {
                    if (error){
                        message.reply(`\`произошла критическая ошибка. повторите попытку позже.\``).then(msg => msg.delete(12000));
                        return message.delete();
                    }
                    message.delete();
                    let accept_message = 'добавил к данной жалобе пользователя:';
                    if (answer[0].user != 0){
                        accept_message = `обновил доп.пользователя в данной жалобе, удалил:\` <@${answer[0].user}>, \`добавил:`
                        let permission = message.channel.permissionOverwrites.find(p => p.id == answer[0].user);
                        permission.delete();
                    }
                    message.channel.overwritePermissions(user, {
                        // GENERAL PERMISSIONS
                        CREATE_INSTANT_INVITE: false,
                        MANAGE_CHANNELS: false,
                        MANAGE_ROLES: false,
                        MANAGE_WEBHOOKS: false,
                        // TEXT PERMISSIONS
                        VIEW_CHANNEL: true,
                        SEND_TTS_MESSAGES: false,
                        MANAGE_MESSAGES: false,
                        EMBED_LINKS: true,
                        ATTACH_FILES: true,
                        READ_MESSAGE_HISTORY: true,
                        MENTION_EVERYONE: false,
                        USE_EXTERNAL_EMOJIS: false,
                        ADD_REACTIONS: false,
                    });
                    if (author){
                        message.channel.send(`${author}, \`модератор\` ${message.member} \`${accept_message}\` ${user}`);
                    }else{
                        message.channel.send(`\`Модератор\` ${message.member} \`${accept_message}\` ${user}`);
                    }
                    let ticket_log = message.guild.channels.find(c => c.name == "reports-log");
                    if (ticket_log) ticket_log.send(`\`[USER]\` \`Модератор ${message.member.displayName || message.member.user.tag} [${message.member.id}] добавил к жалобе\` <#${message.channel.id}> \`[${message.channel.name}] пользователя ${user.displayName || user.user.tag} [${user.id}]\``);
                });
            }
        });
    }

    if (message.content == '/close'){
        if (!message.channel.name.startsWith('ticket-')) return message.delete();
        if (!message.member.hasPermission("ADMINISTRATOR") && !message.member.roles.some(r => r.name == support_settings["moderator"]) && !message.member.roles.some(r => support_settings["administrators"].includes(r.name))) return message.delete();
        if (st_cd.has(message.guild.id)) return message.delete();
        st_cd.add(message.guild.id);
        setTimeout(() => { if (st_cd.has(message.guild.id)) st_cd.delete(message.guild.id); }, 3000);
        connection.query(`SELECT * FROM \`tickets-new\` WHERE \`server\` = '${message.guild.id}' AND \`ticket\` = '${message.channel.name.split('ticket-')[1]}'`, (error, answer) => {
            if (error){
                message.reply(`\`произошла критическая ошибка. повторите попытку позже.\``).then(msg => msg.delete(12000));
                return message.delete();
            }else if (answer.length == 0){
                message.reply(`\`данная жалоба не была найдена в базе данных. error.\``);
                return message.delete();
            }else if (answer.length > 1){
                message.reply(`\`ошибка получения. много результатов. передайте сообщение тех.администраторам discord.\``);
                return message.delete();
            }else if (answer[0].status == 0){
                message.reply(`\`ошибка! данная жалоба уже закрыта!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            let category = message.guild.channels.find(c => c.name == support_settings["close-tickets"]);
            let author = message.guild.members.get(answer[0].author);
            if (!category){
                message.reply(`\`категория активных жалоб не найдена!\``).then(msg => msg.delete(12000));
                return message.delete();
            }else if (category.children.size >= 45){
                message.reply(`\`временно недоступно. очередь забита.\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            connection.query(`UPDATE \`tickets-new\` SET \`status\` = '0' WHERE \`server\` = '${message.guild.id}' AND \`ticket\` = '${message.channel.name.split('ticket-')[1]}'`, async (error) => {
                if (error){
                    message.reply(`\`произошла критическая ошибка. повторите попытку позже.\``).then(msg => msg.delete(12000));
                    return message.delete();
                }
                await message.channel.setParent(category.id).catch((error) => {
                    if (error) console.error(`[SUPPORT] Произошла ошибка при установки категории каналу.`);
                    message.channel.setParent(category.id);
                });
                message.delete();
                message.channel.overwritePermissions(message.guild, { SEND_MESSAGES: false });
                if (author){
                    message.channel.send(`${author}, \`вашей жалобе был установлен статус: 'Закрыта'. Источник:\` ${message.member}`);
                }else{
                    message.channel.send(`\`Данной жалобе [${message.channel.name}] был установлен статус: 'Закрыта'. Источник:\` ${message.member}`);
                }
                let ticket_log = message.guild.channels.find(c => c.name == support_settings["log_channel"]);
                if (ticket_log) ticket_log.send(`\`[STATUS]\` \`Модератор ${message.member.displayName || message.member.user.tag} [${message.member.id}] установил жалобе\` <#${message.channel.id}> \`[${message.channel.name}] статус 'Закрыта'\``);
            });
        });
    }
};