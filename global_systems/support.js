const Discord = require('discord.js');
const fs = require("fs");

exports.run = async (bot, message, support_loop, support_cooldown, connection, st_cd, t_mode) => {
    let re = /(\d+(\.\d)*)/i;

    if (message.channel.name == "support"){
        if(t_mode == 1) return message.reply(`**\`Проводятся технические работы на стороне бота \ хостинга. Повторите попытку позже. Просим извинения за доставленные неудобства.\`**`).then(msg => msg.delete(12000);
        if (message.member.bot) return message.delete();
        if (support_cooldown.has(message.author.id)) {
            return message.delete();
        }
        if (!message.member.hasPermission("ADMINISTRATOR")) support_cooldown.add(message.author.id);
        setTimeout(() => {
            if (support_cooldown.has(message.author.id)) support_cooldown.delete(message.author.id);
        }, 300000);
        let id_mm;
        let rep_message;
        let db_server = bot.guilds.find(g => g.id == "493459379878625320");
        let db_channel = db_server.channels.find(c => c.name == "config");
        await db_channel.fetchMessages().then(async messages => {
            let db_msg = messages.find(m => m.content.startsWith(`MESSAGEID:`));
            if (db_msg){
                id_mm = db_msg.content.match(re)[0]
                await message.channel.fetchMessages().then(async messagestwo => {
                    rep_message = await messagestwo.find(m => m.id == id_mm);
                });
            }
        });
        await connection.query(`UPDATE \`support\` SET tickets = tickets + 1 WHERE \`id\` = '1'`);
        await connection.query(`UPDATE \`support\` SET unseen = unseen + 1 WHERE \`id\` = '1'`);
        connection.query(`SELECT \`id\`, \`tickets\`, \`unseen\`, \`hold\`, \`closed\` FROM \`support\` WHERE \`id\` = '1'`, async (error, result, packets) => {
            if (error) return console.error(error);
            if (result.length == 1){
                if (!rep_message){
                    await message.channel.send(`` +
                    `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                    `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                    `**Количество вопросов за все время: ${result[0].tickets}**\n` +
                    `**Необработанных модераторами: ${result[0].unseen}**\n` +
                    `**Вопросы на рассмотрении: ${result[0].hold}**\n` +
                    `**Закрытых: ${result[0].closed}**`).then(async msg => {
                        db_channel.send(`MESSAGEID: ${msg.id}`)
                        rep_message = await message.channel.fetchMessage(msg.id);
                    });
                }
                const imageemb = new Discord.RichEmbed()
                .setAuthor(`© 2018 Risbot Company™`, `https://pp.userapi.com/c849132/v849132806/b35ca/2RD_7K2ysns.jpg?ava=1`, "https://vk.com/risbot")
                .setImage("https://imgur.com/LKDbJeM.gif")
                rep_message.edit(`` +
                    `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                    `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                    `**Количество вопросов за все время: ${result[0].tickets}**\n` +
                    `**Необработанных модераторами: ${result[0].unseen}**\n` +
                    `**Вопросы на рассмотрении: ${result[0].hold}**\n` +
                    `**Закрытых: ${result[0].closed}**`, imageemb)
                let s_category = message.guild.channels.find(c => c.name == "Активные жалобы");
                if (!s_category) return message.delete(3000);
                let moderator_role = await message.guild.roles.find(r => r.name == 'Support Team');
                if (!moderator_role) return message.delete(3000);
                let createdChans = 0;
                await message.guild.channels.forEach(channel => {
                    if (channel.parentID == s_category.id){
                        createdChans++;
                    }
                });
                if (createdChans >= 45){
                    message.channel.send(`<@${message.author.id}>, \`попробуйте позже.\``).then(msg => msg.delete(7000));
                    return message.delete();
                }
                await message.guild.createChannel(`ticket-${result[0].tickets}`, 'text', [
                    {
                        id: moderator_role.id,
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
                    message.delete();    
                    await channel.setParent(s_category.id);
                    await channel.setTopic('Жалоба в обработке.');
                    channel.send(`<@${message.author.id}> \`для команды поддержки\` <@&${moderator_role.id}>`, {embed: {
                    color: 3447003,
                    title: "Обращение к поддержке Discord",
                    fields: [{
                        name: "Отправитель",
                        value: `**Пользователь:** <@${message.author.id}>`,
                    },{
                        name: "Суть обращения",
                        value: `${message.content}`,
                    }]
                    }});
                    connection.query(`INSERT INTO \`support_log\` (\`ticket\`, \`author\`, \`text\`) VALUES ('${channel.name}', '${message.author.id}', '${message.content}')`);
                    let sp_chat_get = message.guild.channels.find(c => c.name == "reports-log");
                    await sp_chat_get.send(`\`[CREATE]\` <@${message.author.id}> \`создал обращение к поддержке:\` <#${channel.id}>`);
                    message.channel.send(`<@${message.author.id}>, \`обращение составлено. Нажмите на\` <#${channel.id}>`).then(msg => msg.delete(15000));
                });
            }
        });
    }

    if (message.content == '/hold'){
        if(t_mode == 1) return message.reply(`**\`Проводятся технические работы на стороне бота \ хостинга. Повторите попытку позже. Просим извинения за доставленные неудобства.\`**`).then(msg => msg.delete(12000);
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
        if (message.channel.topic == 'Жалоба закрыта.' || message.channel.topic == 'Жалоба на рассмотрении.') return message.delete();
        let memberid = 'не найден';
        await message.channel.permissionOverwrites.forEach(async perm => {
            if (perm.type == `member`){
                memberid = await perm.id;
            }
        });
        let rep_message;
        let db_server = bot.guilds.find(g => g.id == "493459379878625320");
        let db_channel = db_server.channels.find(c => c.name == "config");
        await db_channel.fetchMessages().then(async messages => {
            let db_msg = messages.find(m => m.content.startsWith(`MESSAGEID:`));
            if (db_msg){
                id_mm = db_msg.content.match(re)[0]
                let ticket_channel = message.guild.channels.find(c => c.name == 'support');
                await ticket_channel.fetchMessages().then(async messagestwo => {
                    rep_message = await messagestwo.find(m => m.id == id_mm);
                });
            }
        });
        if (!rep_message) return message.delete();
        await connection.query(`UPDATE \`support\` SET unseen = unseen - 1 WHERE \`id\` = '1'`);
        await connection.query(`UPDATE \`support\` SET hold = hold + 1 WHERE \`id\` = '1'`);
        connection.query(`SELECT \`id\`, \`tickets\`, \`unseen\`, \`hold\`, \`closed\` FROM \`support\` WHERE \`id\` = '1'`, async (error, result, packets) => {
            const imageemb = new Discord.RichEmbed()
            .setAuthor(`© 2018 Risbot Company™`, `https://pp.userapi.com/c849132/v849132806/b35ca/2RD_7K2ysns.jpg?ava=1`, "https://vk.com/risbot")
            .setImage("https://imgur.com/LKDbJeM.gif")
            rep_message.edit(`` +
            `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
            `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
            `**Количество вопросов за все время: ${result[0].tickets}**\n` +
            `**Необработанных модераторами: ${result[0].unseen}**\n` +
            `**Вопросы на рассмотрении: ${result[0].hold}**\n` +
            `**Закрытых: ${result[0].closed}**`, imageemb)
            let s_category = message.guild.channels.find(c => c.name == "Жалобы на рассмотрении");
            if (!s_category) return message.delete(3000);
            await message.channel.setParent(s_category.id);
            let sp_chat_get = message.guild.channels.find(c => c.name == "reports-log");
            message.channel.setTopic('Жалоба на рассмотрении.')
            if (memberid != 'не найден'){
                message.channel.send(`\`[STATUS]\` <@${memberid}>, \`вашей жалобе был установлен статус: 'На рассмотрении'. Источник: ${message.member.displayName}\``);
                sp_chat_get.send(`\`[HOLD]\` \`Модератор ${message.member.displayName} установил жалобе\` <#${message.channel.id}> \`статус 'На рассмотрении'.\``);
            }else{
                message.channel.send(`\`[STATUS]\` \`Данной жалобе был установлен статус: 'На рассмотрении'. Источник: ${message.member.displayName}\``);
                sp_chat_get.send(`\`[HOLD]\` \`Модератор ${message.member.displayName} установил жалобе\` <#${message.channel.id}> \`статус 'На рассмотрении'.\``);
            }
            message.delete();
        });
    }

    if (message.content == '/toadmin'){
        if(t_mode == 1) return message.reply(`**\`Проводятся технические работы на стороне бота \ хостинга. Повторите попытку позже. Просим извинения за доставленные неудобства.\`**`).then(msg => msg.delete(12000);
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
        if (message.channel.topic == 'Жалоба закрыта.') return message.delete();
        let memberid = 'не найден';
        await message.channel.permissionOverwrites.forEach(async perm => {
            if (perm.type == `member`){
                memberid = await perm.id;
            }
        });
        await message.channel.overwritePermissions(message.guild.roles.find(r => r.name == 'Support Team'), {
            // GENERAL PERMISSIONS
            CREATE_INSTANT_INVITE: false,
            MANAGE_CHANNELS: false,
            MANAGE_ROLES: false,
            MANAGE_WEBHOOKS: false,
            // TEXT PERMISSIONS
            VIEW_CHANNEL: false,
            SEND_MESSAGES: false,
            SEND_TTS_MESSAGES: false,
            MANAGE_MESSAGES: false,
            EMBED_LINKS: false,
            ATTACH_FILES: false,
            READ_MESSAGE_HISTORY: false,
            MENTION_EVERYONE: false,
            USE_EXTERNAL_EMOJIS: false,
            ADD_REACTIONS: false,
        })  

        await message.channel.overwritePermissions(message.guild.roles.find(r => r.name == '✔ Administrator ✔'), {
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

        await message.channel.overwritePermissions(message.guild.roles.find(r => r.name == '✔Jr.Administrator✔'), {
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
        let sp_chat_get = message.guild.channels.find(c => c.name == "reports-log");
        if (memberid != 'не найден'){        
            message.channel.send(`\`[STATUS]\` <@${memberid}>, \`ваше обращение было передано администрации. Источник: ${message.member.displayName}\``);
        }else{
            message.channel.send(`\`[STATUS]\` \`Данное обращение было передано администрации. Источник: ${message.member.displayName}\``);
        }
        sp_chat_get.send(`\`[ADMIN]\` \`Модератор ${message.member.displayName} передал жалобу\` <#${message.channel.id}> \`администрации.\``);
        message.delete();
    }

    if (message.content == '/close'){
        if(t_mode == 1) return message.reply(`**\`Проводятся технические работы на стороне бота \ хостинга. Повторите попытку позже. Просим извинения за доставленные неудобства.\`**`).then(msg => msg.delete(12000);
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
        if (message.channel.topic == 'Жалоба закрыта.') return message.delete();
        let full_support = false;
        let s_category = message.guild.channels.find(c => c.name == "Корзина");
        if (!s_category) return message.delete(3000);
        await message.channel.setParent(s_category.id).catch(err => {
            full_support = true;
        });
        if (full_support){
            message.reply(`\`корзина заполнена! Повторите попытку чуть позже!\``).then(msg => msg.delete(12000));
            return message.delete();  
        }
        let memberid = 'не найден';
        await message.channel.permissionOverwrites.forEach(async perm => {
            if (perm.type == `member`){
            memberid = await perm.id;
            }
        });
        let rep_message;
        let db_server = bot.guilds.find(g => g.id == "493459379878625320");
        let db_channel = db_server.channels.find(c => c.name == "config");
        await db_channel.fetchMessages().then(async messages => {
            let db_msg = messages.find(m => m.content.startsWith(`MESSAGEID:`));
            if (db_msg){
                id_mm = db_msg.content.match(re)[0]
                let ticket_channel = message.guild.channels.find(c => c.name == 'support');
                await ticket_channel.fetchMessages().then(async messagestwo => {
                    rep_message = await messagestwo.find(m => m.id == id_mm);
                });
            }
        });
        if (!rep_message) return message.delete();
        let info_rep = [];
        info_rep.push(rep_message.content.split('\n')[3].match(re)[0]);
        info_rep.push(rep_message.content.split('\n')[4].match(re)[0]);
        info_rep.push(rep_message.content.split('\n')[5].match(re)[0]);
        info_rep.push(rep_message.content.split('\n')[6].match(re)[0]);
        let imageemb = new Discord.RichEmbed()
        .setAuthor(`© 2018 Risbot Company™`, `https://pp.userapi.com/c849132/v849132806/b35ca/2RD_7K2ysns.jpg?ava=1`, "https://vk.com/risbot")
        .setImage("https://imgur.com/LKDbJeM.gif");
        if (message.channel.topic == 'Жалоба на рассмотрении.'){
            await connection.query(`UPDATE \`support\` SET hold = hold - 1 WHERE \`id\` = '1'`);
            await connection.query(`UPDATE \`support\` SET closed = closed + 1 WHERE \`id\` = '1'`);
            connection.query(`SELECT \`id\`, \`tickets\`, \`unseen\`, \`hold\`, \`closed\` FROM \`support\` WHERE \`id\` = '1'`, async (error, result, packets) => {
                rep_message.edit(`` +
                `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                `**Количество вопросов за все время: ${result[0].tickets}**\n` +
                `**Необработанных модераторами: ${result[0].unseen}**\n` +
                `**Вопросы на рассмотрении: ${result[0].hold}**\n` +
                `**Закрытых: ${result[0].closed}**`, imageemb)
            });
        }else{
            await connection.query(`UPDATE \`support\` SET unseen = unseen - 1 WHERE \`id\` = '1'`);
            await connection.query(`UPDATE \`support\` SET closed = closed + 1 WHERE \`id\` = '1'`);
            connection.query(`SELECT \`id\`, \`tickets\`, \`unseen\`, \`hold\`, \`closed\` FROM \`support\` WHERE \`id\` = '1'`, async (error, result, packets) => {
                rep_message.edit(`` +
                `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
                `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                `**Количество вопросов за все время: ${result[0].tickets}**\n` +
                `**Необработанных модераторами: ${result[0].unseen}**\n` +
                `**Вопросы на рассмотрении: ${result[0].hold}**\n` +
                `**Закрытых: ${result[0].closed}**`, imageemb)
            });
        }
        if (memberid != 'не найден'){
            await message.channel.overwritePermissions(message.guild.members.find(m => m.id == memberid), {
                // GENERAL PERMISSIONS
                CREATE_INSTANT_INVITE: false,
                MANAGE_CHANNELS: false,
                MANAGE_ROLES: false,
                MANAGE_WEBHOOKS: false,
                // TEXT PERMISSIONS
                VIEW_CHANNEL: true,
                SEND_MESSAGES: false,
                SEND_TTS_MESSAGES: false,
                MANAGE_MESSAGES: false,
                EMBED_LINKS: false,
                ATTACH_FILES: false,
                READ_MESSAGE_HISTORY: true,
                MENTION_EVERYONE: false,
                USE_EXTERNAL_EMOJIS: false,
                ADD_REACTIONS: false,
            }) 
        }
        let sp_chat_get = message.guild.channels.find(c => c.name == "reports-log");
        message.channel.setTopic('Жалоба закрыта.');
        if (memberid != 'не найден'){
            message.channel.send(`\`[STATUS]\` <@${memberid}>, \`вашей жалобе был установлен статус: 'Закрыта'. Источник: ${message.member.displayName}\``);
        }else{
            message.channel.send(`\`[STATUS]\` \`Данной жалобе был установлен статус: 'Закрыта'. Источник: ${message.member.displayName}\``);
        }
        sp_chat_get.send(`\`[CLOSE]\` \`Модератор ${message.member.displayName} установил жалобе\` <#${message.channel.id}> \`статус 'Закрыта'.\``);
        message.delete();
    }

    if (message.content == '/active'){
        if(t_mode == 1) return message.reply(`**\`Проводятся технические работы на стороне бота \ хостинга. Повторите попытку позже. Просим извинения за доставленные неудобства.\`**`).then(msg => msg.delete(12000);
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
        if (message.channel.topic == 'Жалоба закрыта.' || message.channel.topic != 'Жалоба на рассмотрении.') return message.delete();
        let memberid = 'не найден';
        await message.channel.permissionOverwrites.forEach(async perm => {
            if (perm.type == `member`){
                memberid = await perm.id;
            }
        });
        let rep_message;
        let db_server = bot.guilds.find(g => g.id == "493459379878625320");
        let db_channel = db_server.channels.find(c => c.name == "config");
        await db_channel.fetchMessages().then(async messages => {
            let db_msg = messages.find(m => m.content.startsWith(`MESSAGEID:`));
            if (db_msg){
                id_mm = db_msg.content.match(re)[0]
                let ticket_channel = message.guild.channels.find(c => c.name == 'support');
                await ticket_channel.fetchMessages().then(async messagestwo => {
                    rep_message = await messagestwo.find(m => m.id == id_mm);
                });
            }
        });
        if (!rep_message) return message.delete();
        await connection.query(`UPDATE \`support\` SET unseen = unseen + 1 WHERE \`id\` = '1'`);
        await connection.query(`UPDATE \`support\` SET hold = hold - 1 WHERE \`id\` = '1'`);
        connection.query(`SELECT \`id\`, \`tickets\`, \`unseen\`, \`hold\`, \`closed\` FROM \`support\` WHERE \`id\` = '1'`, async (error, result, packets) => {
            const imageemb = new Discord.RichEmbed()
            .setAuthor(`© 2018 Risbot Company™`, `https://pp.userapi.com/c849132/v849132806/b35ca/2RD_7K2ysns.jpg?ava=1`, "https://vk.com/risbot")
            .setImage("https://imgur.com/LKDbJeM.gif")
            rep_message.edit(`` +
            `**Приветствую! Вы попали в канал поддержки сервера Scottdale Brotherhood!**\n` +
            `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
            `**Количество вопросов за все время: ${result[0].tickets}**\n` +
            `**Необработанных модераторами: ${result[0].unseen}**\n` +
            `**Вопросы на рассмотрении: ${result[0].hold}**\n` +
            `**Закрытых: ${result[0].closed}**`, imageemb);
            let s_category = message.guild.channels.find(c => c.name == "Активные жалобы");
            if (!s_category) return message.delete(3000);
            await message.channel.setParent(s_category.id);
            let sp_chat_get = message.guild.channels.find(c => c.name == "reports-log");
            message.channel.setTopic('Жалоба в обработке.');
            if (memberid != 'не найден'){
                message.channel.send(`\`[STATUS]\` <@${memberid}>, \`вашей жалобе был установлен статус: 'В обработке'. Источник: ${message.member.displayName}\``);
            }else{
                message.channel.send(`\`[STATUS]\` \`Данной жалобе был установлен статус: 'В обработке'. Источник: ${message.member.displayName}\``);
            }
            sp_chat_get.send(`\`[UNWAIT]\` \`Модератор ${message.member.displayName} убрал жалобе\` <#${message.channel.id}> \`статус 'На рассмотрении'.\``);
            message.delete();
        });
    }
}
