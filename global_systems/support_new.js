const Discord = require('discord.js');
const fs = require("fs");

exports.run = async (bot, message, support_loop, support_cooldown, connection, st_cd, t_mode) => {
    const image = new Discord.RichEmbed();
    image.setImage("https://imgur.com/LKDbJeM.gif");

    if (message.channel.name == "support"){
        if (message.author.bot) return message.delete();
        if (support_cooldown.has(message.author.id)){
            return message.delete();
        }
        support_cooldown.add(message.author.id);
        setTimeout(() => {
            if (support_cooldown.has(message.author.id)) support_cooldown.delete(message.author.id);
        }, 30000);

        connection.query(`SELECT * FROM \`tickets-global\` WHERE \`server\` = '${message.guild.id}'`, async (error, result) => {
            if (error) return message.delete();
            if (result.length == 0){
                message.channel.send(`` +
                `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                `**Количество вопросов за все время: 0**\n` +
                `**Необработанных модераторами: 0**\n` +
                `**Вопросы на рассмотрении: 0**\n` +
                `**Закрытых: 0**`, image).then(msg => {
                    connection.query(`INSERT INTO \`tickets-global\` (\`server\`, \`message\`, \`tickets\`, \`open\`, \`hold\`, \`close\`) VALUES ('${message.guild.id}', '${msg.id}', '0', '0', '0', '0')`);
                });
                return message.delete();
            }else{
                let rep_message = await message.channel.fetchMessage(result[0].message).catch(async err => {
                    await message.channel.send(`` +
                    `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                    `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                    `**Количество вопросов за все время: ${result[0].tickets}**\n` +
                    `**Необработанных модераторами: ${result[0].open}**\n` +
                    `**Вопросы на рассмотрении: ${result[0].hold}**\n` +
                    `**Закрытых: ${result[0].close}**`, image).then(msg => {
                        rep_message = msg;
                        connection.query(`UPDATE \`tickets-global\` SET message = '${msg.id}' WHERE \`server\` = '${message.guild.id}'`);
                    });
                });
                let category = message.guild.channels.find(c => c.name == "Активные жалобы");
                let moderator = await message.guild.roles.find(r => r.name == 'Support Team');
                if (!category || !moderator) return message.delete();
                if (category.children.size >= 45){
                    message.reply(`\`обращения в поддержку временно недоступны. Повторите попытку позднее.\``).then(msg => msg.delete(12000));
                    return message.delete();
                }
                message.guild.createChannel(`ticket-${+result[0].tickets + 1}`, 'text', [
                    {
                        id: moderator.id,
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS'],
                        deny: ['CREATE_INSTANT_INVITE', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'MENTION_EVERYONE']
                    },
                    {
                        id: message.member.id,
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS'],
                        deny: ['CREATE_INSTANT_INVITE', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'MENTION_EVERYONE']
                    },
                    {
                        id: message.guild.id,
                        deny: ['CREATE_INSTANT_INVITE', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'MENTION_EVERYONE', 'VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS']
                    }
                ]).then(async channel => {
                    await channel.setParent(category.id).catch(() => { setTimeout(() => { channel.setParent(category.id); }, 4000); });
                    await connection.query(`UPDATE \`tickets-global\` SET tickets = tickets + 1 WHERE \`server\` = '${message.guild.id}'`);
                    await connection.query(`UPDATE \`tickets-global\` SET open = open + 1 WHERE \`server\` = '${message.guild.id}'`);
                    await channel.setParent(category.id).catch(() => { setTimeout(() => { channel.setParent(category.id); }, 4000); });
                    message.delete();
                    channel.send(`<@${message.author.id}> \`для команды поддержки\` <@&${moderator.id}>`, {embed: {
                        color: 3447003,
                        title: "Обращение к поддержке Discord",
                        fields: [{
                            name: "Отправитель",
                            value: `**Пользователь:** <@${message.author.id}>`,
                        },{
                            name: "Суть обращения",
                            value: `${message.content}`,
                        }]
                    }}).catch(() => {
                        channel.send(`<@${message.author.id}> \`для команды поддержки\` <@&${moderator.id}>`, {embed: {
                            color: 3447003,
                            title: "Обращение к поддержке Discord",
                            description: `${message.content}`
                        }});
                    });
                    rep_message.edit(`` +
                    `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                    `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                    `**Количество вопросов за все время: ${+result[0].tickets + 1}**\n` +
                    `**Необработанных модераторами: ${+result[0].open + 1}**\n` +
                    `**Вопросы на рассмотрении: ${result[0].hold}**\n` +
                    `**Закрытых: ${result[0].close}**`, image);
                    connection.query(`INSERT INTO \`tickets\` (\`server\`, \`ticket_id\`, \`question\`, \`author\`) VALUES ('${message.guild.id}', '${+result[0].tickets + 1}', '${message.content}', '${message.author.id}')`);
                    let ticket_log = message.guild.channels.find(c => c.name == "reports-log");
                    if (ticket_log) ticket_log.send(`\`[CREATE]\` <@${message.author.id}> \`создал обращение к поддержке:\` <#${channel.id}> \`[${channel.name}]\``);
                    message.channel.send(`<@${message.author.id}>, \`обращение составлено. Нажмите на\` <#${channel.id}>`).then(msg => msg.delete(15000));
                });
            }
        });
    }

    if (message.content == '/hold'){
        if (!message.member.hasPermission("MANAGE_ROLES")) return message.delete();
        if (!message.channel.name.startsWith('ticket-')) return message.delete();
        if (st_cd.has(message.guild.id)){
            message.reply(`**\`подождите, запрос обрабатывается..\`**`).then(msg => msg.delete(6000));
            return message.delete();
        }
        st_cd.add(message.guild.id);
        setTimeout(() => {
            if (st_cd.has(message.guild.id)) st_cd.delete(message.guild.id);
        }, 7000);

        connection.query(`SELECT * FROM \`tickets\` WHERE server = '${message.guild.id}' AND ticket_id = '${message.channel.name.split('ticket-')[1]}'`, async (err, tickets) => {
            if (err){
                message.reply(`\`произошла ошибка на стороне web-сервера. повторите попытку позднее\``).then(msg => msg.delete(7000));
                return message.delete();
            }
            if (+tickets[0].status != 1) return message.delete();
            let category = message.guild.channels.find(c => c.name == "Жалобы на рассмотрении");
            let ticket_channel = message.guild.channels.find(c => c.name == 'support');
            let author = message.guild.members.get(tickets[0].author);
            if (!category || !ticket_channel) return message.delete();
            await message.channel.setParent(category.id).catch(() => { setTimeout(() => { message.channel.setParent(category.id); }, 4000); });
            connection.query(`SELECT * FROM \`tickets-global\` WHERE \`server\` = '${message.guild.id}'`, async (error, result) => {
                if (error) return message.delete();
                if (result.length == 0){
                    ticket_channel.send(`` +
                    `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                    `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                    `**Количество вопросов за все время: 0**\n` +
                    `**Необработанных модераторами: 0**\n` +
                    `**Вопросы на рассмотрении: 0**\n` +
                    `**Закрытых: 0**`, image).then(msg => {
                        connection.query(`INSERT INTO \`tickets-global\` (\`server\`, \`message\`, \`tickets\`, \`open\`, \`hold\`, \`close\`) VALUES ('${message.guild.id}', '${msg.id}', '0', '0', '0', '0')`);
                    });
                    return message.delete();
                }else{
                    let rep_message = await ticket_channel.fetchMessage(result[0].message).catch(async (err) => {
                        await ticket_channel.send(`` +
                        `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                        `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                        `**Количество вопросов за все время: ${result[0].tickets}**\n` +
                        `**Необработанных модераторами: ${result[0].open}**\n` +
                        `**Вопросы на рассмотрении: ${result[0].hold}**\n` +
                        `**Закрытых: ${result[0].close}**`, image).then(msg => {
                            rep_message = msg;
                            connection.query(`UPDATE \`tickets-global\` SET message = '${msg.id}' WHERE \`server\` = '${message.guild.id}'`);
                        });
                    });
                    rep_message.edit(`` +
                    `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                    `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                    `**Количество вопросов за все время: ${result[0].tickets}**\n` +
                    `**Необработанных модераторами: ${+result[0].open - 1}**\n` +
                    `**Вопросы на рассмотрении: ${+result[0].hold + 1}**\n` +
                    `**Закрытых: ${result[0].close}**`, image);
                    connection.query(`UPDATE \`tickets\` SET status = 2 WHERE \`server\` = '${message.guild.id}' AND ticket_id = '${message.channel.name.split('ticket-')[1]}'`);
                    connection.query(`UPDATE \`tickets-global\` SET open = open - 1 WHERE \`server\` = '${message.guild.id}'`);
                    connection.query(`UPDATE \`tickets-global\` SET hold = hold + 1 WHERE \`server\` = '${message.guild.id}'`);
                    if (author){
                        message.channel.send(`${author}, \`вашей жалобе был установлен статус: 'На рассмотрении'. Источник:\` ${message.member}`);
                    }else{
                        message.channel.send(`\`Жалобе <#${message.channel.id}> был установлен статус: 'На рассмотрении'. Источник:\` ${message.member}`);
                    }
                    let ticket_log = message.guild.channels.find(c => c.name == "reports-log");
                    if (ticket_log) ticket_log.send(`\`[STATUS]\` \`Модератор ${message.member.displayName || message.member.user.tag} установил жалобе\` <#${message.channel.id}> \`[${message.channel.name}] статус 'На рассмотрении'\``);
                    return message.delete();
                }
            });
        });
    }

    if (message.content == '/active'){
        if (!message.member.hasPermission("MANAGE_ROLES")) return message.delete();
        if (!message.channel.name.startsWith('ticket-')) return message.delete();
        if (st_cd.has(message.guild.id)){
            message.reply(`**\`подождите, запрос обрабатывается..\`**`).then(msg => msg.delete(6000));
            return message.delete();
        }
        st_cd.add(message.guild.id);
        setTimeout(() => {
            if (st_cd.has(message.guild.id)) st_cd.delete(message.guild.id);
        }, 7000);

        connection.query(`SELECT * FROM \`tickets\` WHERE server = '${message.guild.id}' AND ticket_id = '${message.channel.name.split('ticket-')[1]}'`, async (err, tickets) => {
            if (err){
                message.reply(`\`произошла ошибка на стороне web-сервера. повторите попытку позднее\``).then(msg => msg.delete(7000));
                return message.delete();
            }
            if (+tickets[0].status != 2) return message.delete();
            let category = message.guild.channels.find(c => c.name == "Активные жалобы");
            let ticket_channel = message.guild.channels.find(c => c.name == 'support');
            let author = message.guild.members.get(tickets[0].author);
            if (!category || !ticket_channel) return message.delete();
            await message.channel.setParent(category.id).catch(() => { setTimeout(() => { message.channel.setParent(category.id); }, 4000); });
            connection.query(`SELECT * FROM \`tickets-global\` WHERE \`server\` = '${message.guild.id}'`, async (error, result) => {
                if (error) return message.delete();
                if (result.length == 0){
                    ticket_channel.send(`` +
                    `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                    `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                    `**Количество вопросов за все время: 0**\n` +
                    `**Необработанных модераторами: 0**\n` +
                    `**Вопросы на рассмотрении: 0**\n` +
                    `**Закрытых: 0**`, image).then(msg => {
                        connection.query(`INSERT INTO \`tickets-global\` (\`server\`, \`message\`, \`tickets\`, \`open\`, \`hold\`, \`close\`) VALUES ('${message.guild.id}', '${msg.id}', '0', '0', '0', '0')`);
                    });
                    return message.delete();
                }else{
                    let rep_message = await ticket_channel.fetchMessage(result[0].message).catch(async (err) => {
                        await ticket_channel.send(`` +
                        `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                        `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                        `**Количество вопросов за все время: ${result[0].tickets}**\n` +
                        `**Необработанных модераторами: ${result[0].open}**\n` +
                        `**Вопросы на рассмотрении: ${result[0].hold}**\n` +
                        `**Закрытых: ${result[0].close}**`, image).then(msg => {
                            rep_message = msg;
                            connection.query(`UPDATE \`tickets-global\` SET message = '${msg.id}' WHERE \`server\` = '${message.guild.id}'`);
                        });
                    });
                    rep_message.edit(`` +
                    `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                    `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                    `**Количество вопросов за все время: ${result[0].tickets}**\n` +
                    `**Необработанных модераторами: ${+result[0].open + 1}**\n` +
                    `**Вопросы на рассмотрении: ${+result[0].hold - 1}**\n` +
                    `**Закрытых: ${result[0].close}**`, image);
                    connection.query(`UPDATE \`tickets\` SET status = 2 WHERE \`server\` = '${message.guild.id}' AND ticket_id = '${message.channel.name.split('ticket-')[1]}'`);
                    connection.query(`UPDATE \`tickets-global\` SET open = open + 1 WHERE \`server\` = '${message.guild.id}'`);
                    connection.query(`UPDATE \`tickets-global\` SET hold = hold - 1 WHERE \`server\` = '${message.guild.id}'`);
                    if (author){
                        message.channel.send(`${author}, \`вашей жалобе был установлен статус: 'В обработке'. Источник:\` ${message.member}`);
                    }else{
                        message.channel.send(`\`Жалобе <#${message.channel.id}> был установлен статус: 'В обработке'. Источник:\` ${message.member}`);
                    }
                    let ticket_log = message.guild.channels.find(c => c.name == "reports-log");
                    if (ticket_log) ticket_log.send(`\`[STATUS]\` \`Модератор ${message.member.displayName || message.member.user.tag} установил жалобе\` <#${message.channel.id}> \`[${message.channel.name}] статус 'В обработке'\``);
                    return message.delete();
                }
            });
        });
    }

    if (message.content.startsWith('/add')){
        if (!message.member.hasPermission("MANAGE_ROLES")) return message.delete();
        if (!message.channel.name.startsWith('ticket-')) return message.delete();
        let user = message.guild.member(message.mentions.users.first());
        if (!user){
            message.reply(`\`пользователь не указан! используйте: '/add @user'\``).then(msg => msg.delete(7000));
            return message.delete();
        }
        if (st_cd.has(message.guild.id)){
            message.reply(`**\`подождите, запрос обрабатывается..\`**`).then(msg => msg.delete(6000));
            return message.delete();
        }
        st_cd.add(message.guild.id);
        setTimeout(() => {
            if (st_cd.has(message.guild.id)) st_cd.delete(message.guild.id);
        }, 7000);
        connection.query(`SELECT * FROM \`tickets\` WHERE server = '${message.guild.id}' AND ticket_id = '${message.channel.name.split('ticket-')[1]}'`, async (err, tickets) => {
            if (err){
                message.reply(`\`произошла ошибка на стороне web-сервера. повторите попытку позднее\``).then(msg => msg.delete(7000));
                return message.delete();
            }
            if (user.id == message.author.id){
                if (+tickets[0].additional_user != 0){
                    let permission = message.channel.permissionOverwrites.find(p => p.id == `${tickets[0].additional_user}`);
                    if (permission) permission.delete();
                    await connection.query(`UPDATE \`tickets\` SET additional_user = 0 WHERE \`server\` = '${message.guild.id}' AND ticket_id = '${message.channel.name.split('ticket-')[1]}'`);
                    message.channel.send(`\`Модератор\` ${message.member} \`очистил дополнительных пользователей в данной жалобе.\``);
                    let ticket_log = message.guild.channels.find(c => c.name == "reports-log");
                    if (ticket_log) ticket_log.send(`\`[USER]\` \`Модератор ${message.member.displayName || message.member.user.tag} удалил доп.пользователей у жалобы\` <#${message.channel.id}> \`[${message.channel.name}]\``);
                }else{
                    message.reply(`\`дополнительных пользователей нет. их не нужно очищать.\``).then(msg => msg.delete(12000));
                }
                return message.delete();
            }
            if (tickets[0].additional_user == user.id){
                message.reply(`\`данный пользователь уже добавлен!\``).then(msg => msg.delete(12000));
                return message.delete();
            }
            if (+tickets[0].additional_user != 0){
                let permission = message.channel.permissionOverwrites.find(p => p.id == `${tickets[0].additional_user}`);
                if (permission) permission.delete();
            }
            await connection.query(`UPDATE \`tickets\` SET additional_user = '${user.id}' WHERE \`server\` = '${message.guild.id}' AND ticket_id = '${message.channel.name.split('ticket-')[1]}'`);
            await message.channel.overwritePermissions(user, {
                // GENERAL PERMISSIONS
                CREATE_INSTANT_INVITE: false,
                MANAGE_CHANNELS: false,
                MANAGE_ROLES: false,
                MANAGE_WEBHOOKS: false,
                // TEXT PERMISSIONS
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                SEND_TTS_MESSAGES: false,
                MANAGE_MESSAGES: false,
                EMBED_LINKS: true,
                ATTACH_FILES: true,
                READ_MESSAGE_HISTORY: true,
                MENTION_EVERYONE: false,
                USE_EXTERNAL_EMOJIS: false,
                ADD_REACTIONS: false,
            })
            message.channel.send(`\`Модератор\` ${message.member} \`добавил к данной жалобе пользователя:\` ${user}`);
            let ticket_log = message.guild.channels.find(c => c.name == "reports-log");
            if (ticket_log) ticket_log.send(`\`[USER]\` \`Модератор ${message.member.displayName || message.member.user.tag} добавил к жалобе\` <#${message.channel.id}> \`[${message.channel.name}] ${user.displayName || user.user.tag} [${user.id}]\``);
            return message.delete();
        });
    }

    if (message.content.startsWith('/set')){
        if (!message.member.hasPermission("MANAGE_ROLES")) return message.delete();
        if (!message.channel.name.startsWith('ticket-')) return message.delete();
        const args = message.content.slice(`/run`).split(/ +/);
        if (args[1] != '1' && args[1] != '0'){
            message.reply(`\`используйте: '/set [0 или 1]'\n0 - модераторы, 1 - админы\``).then(msg => msg.delete(7000));
            return message.delete();
        }
        if (st_cd.has(message.guild.id)){
            message.reply(`**\`подождите, запрос обрабатывается..\`**`).then(msg => msg.delete(6000));
            return message.delete();
        }
        st_cd.add(message.guild.id);
        setTimeout(() => {
            if (st_cd.has(message.guild.id)) st_cd.delete(message.guild.id);
        }, 7000);
        let author = message.guild.members.get(tickets[0].author);
        connection.query(`SELECT * FROM \`tickets\` WHERE server = '${message.guild.id}' AND ticket_id = '${message.channel.name.split('ticket-')[1]}'`, async (err, tickets) => {
            if (err){
                message.reply(`\`произошла ошибка на стороне web-сервера. повторите попытку позднее\``).then(msg => msg.delete(7000));
                return message.delete();
            }
            if (tickets[0].department == args[1]) return message.delete();
            let moderator = message.guild.roles.find(r => r.name == 'Support Team');
            let jr_administrator = message.guild.roles.find(r => r.name == '✔Jr.Administrator✔');
            let administrator = message.guild.roles.find(r => r.name == '✔ Administrator ✔');
            if (tickets[0].department == '0'){
                let permission = message.channel.permissionOverwrites.find(p => p.id == `${moderator.id}`);
                if (permission) permission.delete();
                await message.channel.overwritePermissions(jr_administrator, {
                    // GENERAL PERMISSIONS
                    CREATE_INSTANT_INVITE: false,
                    MANAGE_CHANNELS: false,
                    MANAGE_ROLES: false,
                    MANAGE_WEBHOOKS: false,
                    // TEXT PERMISSIONS
                    VIEW_CHANNEL: true,
                    SEND_MESSAGES: true,
                    SEND_TTS_MESSAGES: false,
                    MANAGE_MESSAGES: false,
                    EMBED_LINKS: true,
                    ATTACH_FILES: true,
                    READ_MESSAGE_HISTORY: true,
                    MENTION_EVERYONE: false,
                    USE_EXTERNAL_EMOJIS: false,
                    ADD_REACTIONS: false,
                });
                await message.channel.overwritePermissions(administrator, {
                    // GENERAL PERMISSIONS
                    CREATE_INSTANT_INVITE: false,
                    MANAGE_CHANNELS: false,
                    MANAGE_ROLES: false,
                    MANAGE_WEBHOOKS: false,
                    // TEXT PERMISSIONS
                    VIEW_CHANNEL: true,
                    SEND_MESSAGES: true,
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
                    message.channel.send(`${author}, \`ваша жалоба была перенаправлена администрации сервера. Источник:\` ${message.member}`);
                }else{
                    message.channel.send(`\`Данная жалоба была перенаправлена администрации сервера. Источник:\` ${message.member}`);
                }
                let ticket_log = message.guild.channels.find(c => c.name == "reports-log");
                if (ticket_log) ticket_log.send(`\`[USER]\` \`Модератор ${message.member.displayName || message.member.user.tag} перенаправил жалобу\` <#${message.channel.id}> \`[${message.channel.name}] ${user.displayName || user.user.tag} [${user.id}] администрации сервера.\``);
            }else if (tickets[0].department == '1'){
                let permission = message.channel.permissionOverwrites.find(p => p.id == `${jr_administrator.id}`);
                if (permission) permission.delete();
                let permission_two = message.channel.permissionOverwrites.find(p => p.id == `${administrator.id}`);
                if (permission_two) permission_two.delete();
                await message.channel.overwritePermissions(moderator, {
                    // GENERAL PERMISSIONS
                    CREATE_INSTANT_INVITE: false,
                    MANAGE_CHANNELS: false,
                    MANAGE_ROLES: false,
                    MANAGE_WEBHOOKS: false,
                    // TEXT PERMISSIONS
                    VIEW_CHANNEL: true,
                    SEND_MESSAGES: true,
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
                    message.channel.send(`${author}, \`ваша жалоба была перенаправлена модераторам сервера. Источник:\` ${message.member}`);
                }else{
                    message.channel.send(`\`Данная жалоба была перенаправлена модераторам сервера. Источник:\` ${message.member}`);
                }
                let ticket_log = message.guild.channels.find(c => c.name == "reports-log");
                if (ticket_log) ticket_log.send(`\`[USER]\` \`Администратор ${message.member.displayName || message.member.user.tag} перенаправил жалобу\` <#${message.channel.id}> \`[${message.channel.name}] ${user.displayName || user.user.tag} [${user.id}] модераторам сервера.\``);
            }
            await connection.query(`UPDATE \`tickets\` SET department = '${args[1]}' WHERE \`server\` = '${message.guild.id}' AND ticket_id = '${message.channel.name.split('ticket-')[1]}'`);
            return message.delete();
        });
    }
    return
};