const Discord = require('discord.js');
const fs = require("fs");

exports.run = async (bot, message, warn_cooldown) => {
    let re = /(\d+(\.\d)*)/i;
    const authorrisbot = new Discord.RichEmbed()
    .setAuthor(`© 2018 Risbot Company™`, `https://pp.userapi.com/c849132/v849132806/b35ca/2RD_7K2ysns.jpg?ava=1`, "https://vk.com/risbot")
    
    if (message.content.startsWith("/mwarn")){
        if (!message.member.hasPermission("ADMINISTRATOR")) return
        let user = message.guild.member(message.mentions.users.first());
        const args = message.content.slice(`/mwarn`).split(/ +/);
        if (!user || !args[2]){
            message.reply(`\`ошибка выполнения! '/mwarn [пользователь] [причина]'\``).then(msg => msg.delete(9000));
            return message.delete();
        }
        let reason = args.slice(2).join(" ");
        if (reason.length < 3 || reason.length > 70){
            message.reply(`\`ошибка выполнения! Причина должна быть больше 3-х и меньше 70-и символов.\``).then(msg => msg.delete(9000));
            return message.delete();
        }
        if (user.hasPermission("ADMINISTRATOR") || !user.roles.some(r => ["Spectator™", "Support Team"].includes(r.name))){
            message.reply(`\`ошибка выполнения! Выдать можно только модераторам!\``).then(msg => msg.delete(9000));
            return message.delete();
        }
        if (reason.includes("==>")){
            message.reply(`\`ошибка выполнения! Вы использовали запрещенный символ!\``).then(msg => msg.delete(9000));
            return message.delete();
        }
        let db_server = bot.guilds.find(g => g.id == "493459379878625320");
        let db_parent = db_server.channels.find(c => c.name == 'db_users');
        let acc = db_server.channels.find(c => c.name == user.id);
        if (!acc){
            await db_server.createChannel(user.id).then(async chan => {
            await chan.setTopic(`<@${user.id}> - ${user.displayName}`);
            acc = chan;
            });
        }
        await acc.fetchMessages({limit: 1}).then(async messages => {
            if (messages.size == 1){
            messages.forEach(async sacc => {
                let str = sacc.content;
                let moderation_level = str.split('\n')[0].match(re)[0];
                let moderation_warns = str.split('\n')[1].match(re)[0];
                let user_warns = str.split('\n')[+moderation_warns + 2].match(re)[0];
                let moderation_reason = [];
                let user_reason = [];
                let moderation_time = [];
                let user_time = [];
                let moderation_give = [];
                let user_give = [];
                
                let circle = 0;
                while (+moderation_warns > circle){
                moderation_reason.push(str.split('\n')[+circle + 2].split('==>')[0]);
                moderation_time.push(str.split('\n')[+circle + 2].split('==>')[1]);
                moderation_give.push(str.split('\n')[+circle + 2].split('==>')[2]);
                circle++;
                }
    
                circle = 0;
                while (+user_warns > circle){
                user_reason.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[0]);
                user_time.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[1]);
                user_give.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[2]);
                circle++;
                }
                
                moderation_warns++
                moderation_reason.push(reason);
                moderation_time.push(604800000 * +moderation_warns + 604800000 + +message.createdAt.valueOf());
                moderation_give.push(message.member.displayName);
                
                if (+moderation_warns < 3){
                let text_end = `Уровень модератора: ${moderation_level}\n` + 
                `Предупреждения модератора: ${+moderation_warns}`;
                for (var i = 0; i < moderation_reason.length; i++){
                    text_end = text_end + `\n${moderation_reason[i]}==>${moderation_time[i]}==>${moderation_give[i]}`;
                }
                text_end = text_end + `\nПредупреждений: ${+user_warns}`;
                for (var i = 0; i < user_reason.length; i++){
                    text_end = text_end + `\n${user_reason[i]}==>${user_time[i]}==>${user_give[i]}`;
                }
    
                sacc.edit(text_end);
                let ann = message.guild.channels.find(c => c.name == "spectator-chat");
                ann.send(`<@${user.id}>, \`модератор\` <@${message.author.id}> \`выдал вам предупреждение (${moderation_warns}/3). Причина: ${reason}\``);
                return message.delete();
                }else{
                let text_end = `Уровень модератора: ${moderation_level}\n` + 
                `Предупреждения модератора: ${+moderation_warns}`;
                for (var i = 0; i < moderation_reason.length; i++){
                    text_end = text_end + `\n${moderation_reason[i]}==>${moderation_time[i]}==>${moderation_give[i]}`;
                }
                text_end = text_end + `\nПредупреждений: ${+user_warns}`;
                for (var i = 0; i < user_reason.length; i++){
                    text_end = text_end + `\n${user_reason[i]}==>${user_time[i]}==>${user_give[i]}`;
                }
                if (user.roles.some(r => ["Support Team"].includes(r.name))){
                    await fs.appendFileSync(`./spwarn.txt`, `${text_end}`); // { files: [ `./ban.txt` ] }
                    let ann = message.guild.channels.find(c => c.name == "spectator-chat");
                await ann.send(`<@${user.id}>, \`модератор\` <@${message.author.id}> \`выдал вам предупреждение (${moderation_warns}/3). Причина: ${reason}\`\n\`Вы были понижены с должности Support Team на должность Spectator'а.\``, { files: [ `./spwarn.txt` ] });
                    fs.unlinkSync(`./spwarn.txt`);
                    user.removeRole(message.guild.roles.find(r => r.name == "Support Team"))
                    if (!user.roles.some(r => ["Spectator™"].includes(r.name))) user.addRole(message.guild.roles.find(r => r.name == "Spectator™"))
                    if (user_warns == 0 && moderation_level == 0){ 
                    acc.delete();
                    }else{
                    moderation_warns = 0;
                    let moderation_reason = [];
                    let moderation_time = [];
                    let moderation_give = [];
                    let text_end = `Уровень модератора: ${moderation_level}\n` + 
                    `Предупреждения модератора: ${+moderation_warns}`;
                    for (var i = 0; i < moderation_reason.length; i++){
                        text_end = text_end + `\n${moderation_reason[i]}==>${moderation_time[i]}==>${moderation_give[i]}`;
                    }
                    text_end = text_end + `\nПредупреждений: ${+user_warns}`;
                    for (var i = 0; i < user_reason.length; i++){
                        text_end = text_end + `\n${user_reason[i]}==>${user_time[i]}==>${user_give[i]}`;
                    }
                    sacc.edit(text_end);
                    }
                    return message.delete();
                }else if (user.roles.some(r => ["Spectator™"].includes(r.name))){
                    await fs.appendFileSync(`./spwarn.txt`, `${text_end}`); // { files: [ `./ban.txt` ] }
                    let ann = message.guild.channels.find(c => c.name == "spectator-chat");
                await ann.send(`<@${user.id}>, \`модератор\` <@${message.author.id}> \`выдал вам предупреждение (${moderation_warns}/3). Причина: ${reason}\`\n\`Вы были сняты с должности Spectator'а.\``, { files: [ `./spwarn.txt` ] });
                    fs.unlinkSync(`./spwarn.txt`);
                    user.removeRole(message.guild.roles.find(r => r.name == "Spectator™"))
                    if (user_warns == 0 && moderation_level == 0){ 
                    acc.delete();
                    }else{
                    moderation_warns = 0;
                    let moderation_reason = [];
                    let moderation_time = [];
                    let moderation_give = [];
                    let text_end = `Уровень модератора: ${moderation_level}\n` + 
                    `Предупреждения модератора: ${+moderation_warns}`;
                    for (var i = 0; i < moderation_reason.length; i++){
                        text_end = text_end + `\n${moderation_reason[i]}==>${moderation_time[i]}==>${moderation_give[i]}`;
                    }
                    text_end = text_end + `\nПредупреждений: ${+user_warns}`;
                    for (var i = 0; i < user_reason.length; i++){
                        text_end = text_end + `\n${user_reason[i]}==>${user_time[i]}==>${user_give[i]}`;
                    }
                    sacc.edit(text_end);
                    }
                    return message.delete();
                }
                }
            });
            }else{
                await acc.send(`Уровень модератора: 0\n` +
                `Предупреждения модератора: 1\n` +
                `${reason}==>${+message.createdAt.valueOf() + 604800000}==>${message.member.displayName}\n` +
                `Предупреждений: 0`);
                let ann = message.guild.channels.find(c => c.name == "spectator-chat");
                ann.send(`<@${user.id}>, \`модератор\` <@${message.author.id}> \`выдал вам предупреждение (1/3). Причина: ${reason}\``);
                return message.delete();
            }
        });
        }
        
        if (message.content.startsWith("/unwarn")){
        if (!message.member.hasPermission("MANAGE_ROLES")) return message.delete();
        let user = message.guild.member(message.mentions.users.first());
        if (!user){
            message.reply(`\`пользователь не указан! '/unwarn [пользователь] [тип] [число]'\``).then(msg => msg.delete(9000));
            return message.delete();
        }
        const args = message.content.slice(`/unwarn`).split(/ +/);
        if (!args[2]){
            message.reply(`\`тип не указан! '/unwarn [пользователь] [тип] [число]'\``).then(msg => msg.delete(9000));
            return message.delete();
        }
        if (args[2] != 'user' && args[2] != 'mod'){
            message.reply(`\`тип может быть 'user' или 'mod'! '/unwarn [пользователь] [тип] [число]'\``).then(msg => msg.delete(9000));
            return message.delete();
        }
        if (!args[3]){
            message.reply(`\`номер предупреждения не указан! '/unwarn [пользователь] [тип] [число]'\``).then(msg => msg.delete(9000));
            return message.delete();
        }
        if (typeof(+args[3]) != "number"){
            message.reply(`\`укажите число! '/unwarn [пользователь] [тип] [число]'\``).then(msg => msg.delete(9000));
            return message.delete();
        }
        if (+args[3] > 2 || +args[3] < 1){
            message.reply(`\`можно указать 1 или 2! '/unwarn [пользователь] [тип] [число]'\``).then(msg => msg.delete(9000));
            return message.delete();
        }
        args[3] = +args[3] - 1;
        if (args[2] == "user"){
            if (user.hasPermission("MANAGE_ROLES") && !message.member.hasPermission("ADMINISTRATOR")){
            message.reply(`\`модератору нельзя снимать предупреждения!\``).then(msg => msg.delete(9000));
            return message.delete();
            }
            let dataserver = bot.guilds.find(g => g.id == "493459379878625320");
            let report_channel = dataserver.channels.find(c => c.name == user.id);
            if (!report_channel){
            message.reply(`\`у пользователя нет предупреждений!\``).then(msg => msg.delete(9000));
            return message.delete();
            }
            await report_channel.fetchMessages({limit: 1}).then(async messages => {
            if (messages.size == 1){
                messages.forEach(async sacc => {
                let str = sacc.content;
                let moderation_level = str.split('\n')[0].match(re)[0];
                let moderation_warns = str.split('\n')[1].match(re)[0];
                let user_warns = str.split('\n')[+moderation_warns + 2].match(re)[0];
                let moderation_reason = [];
                let user_reason = [];
                let moderation_time = [];
                let user_time = [];
                let moderation_give = [];
                let user_give = [];
                
                let circle = 0;
                while (+moderation_warns > circle){
                    moderation_reason.push(str.split('\n')[+circle + 2].split('==>')[0]);
                    moderation_time.push(str.split('\n')[+circle + 2].split('==>')[1]);
                    moderation_give.push(str.split('\n')[+circle + 2].split('==>')[2]);
                    circle++;
                }
    
                circle = 0;
            let rem = 0;
                while (+user_warns > circle){
                    if (+circle == +args[3]){
                    rem++;
                    let genchannel = message.guild.channels.find(c => c.name == "general");
                    genchannel.send(`<@${user.id}>, \`вам было снято одно предупреждение. Источник: ${message.member.displayName}\``);
                    let schat = message.guild.channels.find(c => c.name == "spectator-chat");
                    schat.send(`\`Модератор\` <@${message.author.id}> \`снял пользователю\` <@${user.id}> \`одно предупреждение.\nИнформация: Выдано было модератором: ${str.split('\n')[+circle + +moderation_warns + 3].split('==>')[2]} по причине: ${str.split('\n')[+circle + +moderation_warns + 3].split('==>')[0]}\``);
                    }else{
                    user_reason.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[0]);
                    user_time.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[1]);
                    user_give.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[2]);
                    }
                    circle++;
                }
            user_warns = +user_warns - +rem;
                let text_end = `Уровень модератора: ${moderation_level}\n` + 
                `Предупреждения модератора: ${moderation_warns}`;
                for (var i = 0; i < moderation_reason.length; i++){
                    text_end = text_end + `\n${moderation_reason[i]}==>${moderation_time[i]}==>${moderation_give[i]}`;
                }
                text_end = text_end + `\nПредупреждений: ${+user_warns}`;
                for (var i = 0; i < user_reason.length; i++){
                    text_end = text_end + `\n${user_reason[i]}==>${user_time[i]}==>${user_give[i]}`;
                }
                if (+moderation_level == 0 && +moderation_warns == 0 && +user_warns == 0){
                    report_channel.delete();
                }else{
                    sacc.edit(text_end);
                }
                message.delete()
                });
            }else{
                message.reply(`\`произошла ошибка. [USER=${user.id}]\``).then(msg => msg.delete(9000));
                return message.delete();
            }
            });
        }else if (args[2] == "mod"){
            if (!message.member.hasPermission("ADMINISTRATOR")){
            message.reply(`\`недостаточно прав доступа к данному разделу!\``).then(msg => msg.delete(9000));
            return message.delete();
            }
            let dataserver = bot.guilds.find(g => g.id == "493459379878625320");
            let report_channel = dataserver.channels.find(c => c.name == user.id);
            if (!report_channel){
            message.reply(`\`у пользователя нет предупреждений!\``).then(msg => msg.delete(9000));
            return message.delete();
            }
            await report_channel.fetchMessages({limit: 1}).then(async messages => {
            if (messages.size == 1){
                messages.forEach(async sacc => {
                let str = sacc.content;
                let moderation_level = str.split('\n')[0].match(re)[0];
                let moderation_warns = str.split('\n')[1].match(re)[0];
                let user_warns = str.split('\n')[+moderation_warns + 2].match(re)[0];
                let moderation_reason = [];
                let user_reason = [];
                let moderation_time = [];
                let user_time = [];
                let moderation_give = [];
                let user_give = [];
                
                let circle = 0;
                let rem = 0;
                while (+moderation_warns > circle){
                    if (+circle == +args[3]){
                    rem++;
                    let schat = message.guild.channels.find(c => c.name == "spectator-chat");
                    schat.send(`<@${message.author.id}> \`снял модератору\` <@${user.id}> \`одно предупреждение.\nИнформация: Выдано было модератором: ${str.split('\n')[+circle + 2].split('==>')[2]} по причине: ${str.split('\n')[+circle + 2].split('==>')[0]}\``);
                    }else{
                    moderation_reason.push(str.split('\n')[+circle + 2].split('==>')[0]);
                    moderation_time.push(str.split('\n')[+circle + 2].split('==>')[1]);
                    moderation_give.push(str.split('\n')[+circle + 2].split('==>')[2]);
                    }
                    circle++;
                }
                circle = 0;
                while (+user_warns > circle){
                    user_reason.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[0]);
                    user_time.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[1]);
                    user_give.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[2]);
                    circle++;
                }
                moderation_warns = +moderation_warns - +rem;
                let text_end = `Уровень модератора: ${moderation_level}\n` + 
                `Предупреждения модератора: ${moderation_warns}`;
                for (var i = 0; i < moderation_reason.length; i++){
                    text_end = text_end + `\n${moderation_reason[i]}==>${moderation_time[i]}==>${moderation_give[i]}`;
                }
                text_end = text_end + `\nПредупреждений: ${+user_warns}`;
                for (var i = 0; i < user_reason.length; i++){
                    text_end = text_end + `\n${user_reason[i]}==>${user_time[i]}==>${user_give[i]}`;
                }
                if (+moderation_level == 0 && +moderation_warns == 0 && +user_warns == 0){
                    report_channel.delete();
                }else{
                    sacc.edit(text_end);
                }
                message.delete()
                });
            }else{
                message.reply(`\`произошла ошибка. [USER=${user.id}]\``).then(msg => msg.delete(9000));
                return message.delete();
            }
            });
        }
        }
        
        if (message.content.startsWith("/getmwarns")){
        if (!message.member.hasPermission("MANAGE_ROLES")) return message.delete();
        let user = message.guild.member(message.mentions.users.first());
        if (!user){
            message.reply(`\`для выполнения нужно указать пользователя. '/getmwarns [user]'\``).then(msg => msg.delete(9000));
            return message.delete();
        }
        if (user.id == message.author.id){
            let db_server = bot.guilds.find(g => g.id == "493459379878625320");
            let acc = db_server.channels.find(c => c.name == user.id);
            if (!acc){
            message.reply(`\`у вас нет текущих предупреждений.\``).then(msg => msg.delete(12000));
            return message.delete();
            }
            await acc.fetchMessages({limit: 1}).then(async messages => {
            if (messages.size == 1){
                messages.forEach(async sacc => {
                let str = sacc.content;
                let moderation_level = str.split('\n')[0].match(re)[0];
                let moderation_warns = str.split('\n')[1].match(re)[0];
                let user_warns = str.split('\n')[+moderation_warns + 2].match(re)[0];
                let moderation_reason = [];
                let user_reason = [];
                let moderation_time = [];
                let user_time = [];
                let moderation_give = [];
                let user_give = [];
    
                let circle = 0;
                while (+moderation_warns > circle){
                    moderation_reason.push(str.split('\n')[+circle + 2].split('==>')[0]);
                    moderation_time.push(str.split('\n')[+circle + 2].split('==>')[1]);
                    moderation_give.push(str.split('\n')[+circle + 2].split('==>')[2]);
                    circle++;
                }
    
                circle = 0;
                while (+user_warns > circle){
                    user_reason.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[0]);
                    user_time.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[1]);
                    user_give.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[2]);
                    circle++;
                }
                let text_end = `**Предупреждений: ${moderation_warns}**`;
                for (var i = 0; i < moderation_reason.length; i++){
                    text_end = text_end + `\n**[#${+i + 1}] Выдано модератором: \`${moderation_give[i]}\`. Причина: \`${moderation_reason[i]}\`**`;
                }
                message.reply(`\`вот информация по поводу аккаунта:\` <@${user.id}>\n${text_end}`, authorrisbot);
                return message.delete();
                });
            }else{
                message.reply(`\`ошибка выполнения 605. [ACC=${user.id}]\``).then(msg => msg.pin());
                return message.delete();
            }
            });
        }else{
            if (!message.member.hasPermission("ADMINISTRATOR")){
            message.reply(`\`у вас нет прав модератора для просмотра чужой статистики.\``, authorrisbot).then(msg => msg.delete(7000));
            return message.delete();
            }
            let db_server = bot.guilds.find(g => g.id == "493459379878625320");
            let acc = db_server.channels.find(c => c.name == user.id);
            if (!acc){
            message.reply(`\`у пользователя нет предупреждений.\``).then(msg => msg.delete(12000));
            return message.delete();
            }
            await acc.fetchMessages({limit: 1}).then(async messages => {
            if (messages.size == 1){
                messages.forEach(async sacc => {
                let str = sacc.content;
                let moderation_level = str.split('\n')[0].match(re)[0];
                let moderation_warns = str.split('\n')[1].match(re)[0];
                let user_warns = str.split('\n')[+moderation_warns + 2].match(re)[0];
                let moderation_reason = [];
                let user_reason = [];
                let moderation_time = [];
                let user_time = [];
                let moderation_give = [];
                let user_give = [];
    
                let circle = 0;
                while (+moderation_warns > circle){
                    moderation_reason.push(str.split('\n')[+circle + 2].split('==>')[0]);
                    moderation_time.push(str.split('\n')[+circle + 2].split('==>')[1]);
                    moderation_give.push(str.split('\n')[+circle + 2].split('==>')[2]);
                    circle++;
                }
    
                circle = 0;
                while (+user_warns > circle){
                    user_reason.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[0]);
                    user_time.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[1]);
                    user_give.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[2]);
                    circle++;
                }
                let text_end = `**Предупреждений: ${moderation_warns}**`;
                for (var i = 0; i < moderation_reason.length; i++){
                    text_end = text_end + `\n**[#${+i + 1}] Выдано модератором: \`${moderation_give[i]}\`. Причина: \`${moderation_reason[i]}\`**`;
                }
                message.reply(`\`вот информация по поводу аккаунта:\` <@${user.id}>\n${text_end}`, authorrisbot);
                return message.delete();
                });
            }else{
                message.reply(`\`ошибка выполнения 605. [ACC=${user.id}]\``).then(msg => msg.pin());
                return message.delete();
            }
            });
        }
        }
            
        if (message.content.startsWith("/getwarns")){
        let user = message.guild.member(message.mentions.users.first());
        if (!user){
            message.reply(`\`для выполнения нужно указать пользователя. '/getwarns [user]'\``).then(msg => msg.delete(9000));
            return message.delete();
        }
        if (user.id == message.author.id){
            let db_server = bot.guilds.find(g => g.id == "493459379878625320");
            let acc = db_server.channels.find(c => c.name == user.id);
            if (!acc){
            message.reply(`\`у вас нет текущих предупреждений.\``).then(msg => msg.delete(12000));
            return message.delete();
            }
            await acc.fetchMessages({limit: 1}).then(async messages => {
            if (messages.size == 1){
                messages.forEach(async sacc => {
                let str = sacc.content;
                let moderation_level = str.split('\n')[0].match(re)[0];
                let moderation_warns = str.split('\n')[1].match(re)[0];
                let user_warns = str.split('\n')[+moderation_warns + 2].match(re)[0];
                let moderation_reason = [];
                let user_reason = [];
                let moderation_time = [];
                let user_time = [];
                let moderation_give = [];
                let user_give = [];
    
                let circle = 0;
                while (+moderation_warns > circle){
                    moderation_reason.push(str.split('\n')[+circle + 2].split('==>')[0]);
                    moderation_time.push(str.split('\n')[+circle + 2].split('==>')[1]);
                    moderation_give.push(str.split('\n')[+circle + 2].split('==>')[2]);
                    circle++;
                }
    
                circle = 0;
                while (+user_warns > circle){
                    user_reason.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[0]);
                    user_time.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[1]);
                    user_give.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[2]);
                    circle++;
                }
                let text_end = `**Предупреждений: ${user_warns}**`;
                for (var i = 0; i < user_reason.length; i++){
                    let date = new Date(+user_time[i] + 10800000);
                    let formate_date = `${date.getFullYear()}.` + 
                    `${(date.getMonth() + 1).toString().padStart(2, '0')}.` +
                    `${date.getDate().toString().padStart(2, '0')} в ` + 
                    `${date.getHours().toString().padStart(2, '0')}:` + 
                    `${date.getMinutes().toString().padStart(2, '0')}:` + 
                    `${date.getSeconds().toString().padStart(2, '0')}`;
                    text_end = text_end + `\n**[#${+i + 1}] Выдано модератором: \`${user_give[i]}\`. Причина: \`${user_reason[i]}\`\n[#${+i + 1}] Истекает: ${formate_date}**\n`;
                }
                message.reply(`\`вот информация по поводу аккаунта:\` <@${user.id}>\n${text_end}`, authorrisbot);
                return message.delete();
                });
            }else{
                message.reply(`\`ошибка выполнения 605. [ACC=${user.id}]\``).then(msg => msg.pin());
                return message.delete();
            }
            });
        }else{
            if (!message.member.hasPermission("MANAGE_ROLES")){
            message.reply(`\`у вас нет прав модератора для просмотра чужой статистики.\``, authorrisbot).then(msg => msg.delete(7000));
            return message.delete();
            }
            let db_server = bot.guilds.find(g => g.id == "493459379878625320");
            let acc = db_server.channels.find(c => c.name == user.id);
            if (!acc){
            message.reply(`\`у пользователя нет предупреждений.\``).then(msg => msg.delete(12000));
            return message.delete();
            }
            await acc.fetchMessages({limit: 1}).then(async messages => {
            if (messages.size == 1){
                messages.forEach(async sacc => {
                let str = sacc.content;
                let moderation_level = str.split('\n')[0].match(re)[0];
                let moderation_warns = str.split('\n')[1].match(re)[0];
                let user_warns = str.split('\n')[+moderation_warns + 2].match(re)[0];
                let moderation_reason = [];
                let user_reason = [];
                let moderation_time = [];
                let user_time = [];
                let moderation_give = [];
                let user_give = [];
    
                let circle = 0;
                while (+moderation_warns > circle){
                    moderation_reason.push(str.split('\n')[+circle + 2].split('==>')[0]);
                    moderation_time.push(str.split('\n')[+circle + 2].split('==>')[1]);
                    moderation_give.push(str.split('\n')[+circle + 2].split('==>')[2]);
                    circle++;
                }
    
                circle = 0;
                while (+user_warns > circle){
                    user_reason.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[0]);
                    user_time.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[1]);
                    user_give.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[2]);
                    circle++;
                }
                let text_end = `**Предупреждений: ${user_warns}**`;
                for (var i = 0; i < user_reason.length; i++){
                    let date = new Date(+user_time[i] + 10800000);
                    let formate_date = `${date.getFullYear()}.` + 
                    `${(date.getMonth() + 1).toString().padStart(2, '0')}.` +
                    `${date.getDate().toString().padStart(2, '0')} в ` + 
                    `${date.getHours().toString().padStart(2, '0')}:` + 
                    `${date.getMinutes().toString().padStart(2, '0')}:` + 
                    `${date.getSeconds().toString().padStart(2, '0')}`;
                    text_end = text_end + `\n**[#${+i + 1}] Выдано модератором: \`${user_give[i]}\`. Причина: \`${user_reason[i]}\`\n[#${+i + 1}] Истекает: ${formate_date}**\n`;
                }
                message.reply(`\`вот информация по поводу аккаунта:\` <@${user.id}>\n${text_end}`, authorrisbot);
                return message.delete();
                });
            }else{
                message.reply(`\`ошибка выполнения 605. [ACC=${user.id}]\``).then(msg => msg.pin());
                return message.delete();
            }
            });
        }
        }
    
        if (message.content.startsWith("/warn")){
            if (!message.member.hasPermission("MANAGE_ROLES")) return
            if (warn_cooldown.has(message.author.id)) return message.delete();
            warn_cooldown.add(message.author.id)
            setTimeout(() => {
                if (warn_cooldown.has(message.author.id)) warn_cooldown.delete(message.author.id);
            }, 30000);
            let user = message.guild.member(message.mentions.users.first());
            const args = message.content.slice(`/warn`).split(/ +/);
            if (!user || !args[2]){
                message.reply(`\`ошибка выполнения! '/warn [пользователь] [причина]'\``).then(msg => msg.delete(9000));
                return message.delete();
            }
            let reason = args.slice(2).join(" ");
            if (reason.length < 3 || reason.length > 70){
                message.reply(`\`ошибка выполнения! Причина должна быть больше 3-х и меньше 70-и символов.\``).then(msg => msg.delete(9000));
                return message.delete();
            }
            if (user.hasPermission("ADMINISTRATOR") || user.roles.some(r => ["Spectator™", "Support Team", "✔ Helper ✔", "✔Jr.Administrator✔", "✔ Administrator ✔"].includes(r.name))){
                if (!message.member.hasPermission("ADMINISTRATOR")){
                message.reply(`\`ошибка выполнения! Данному пользователю нельзя выдать предупреждение!\``).then(msg => msg.delete(9000));
                return message.delete();
                }
            }
            if (reason.includes("==>")){
                message.reply(`\`ошибка выполнения! Вы использовали запрещенный символ!\``).then(msg => msg.delete(9000));
                return message.delete();
            }
            let db_server = bot.guilds.find(g => g.id == "493459379878625320");
            let db_parent = db_server.channels.find(c => c.name == 'db_users');
            let acc = db_server.channels.find(c => c.name == user.id);
            if (!acc){
                await db_server.createChannel(user.id).then(async chan => {
                await chan.setTopic(`<@${user.id}> - ${user.displayName}`);
                acc = chan;
                });
            }
            await acc.fetchMessages({limit: 1}).then(async messages => {
                if (messages.size == 1){
                messages.forEach(async sacc => {
                    let str = sacc.content;
                    let moderation_level = str.split('\n')[0].match(re)[0];
                    let moderation_warns = str.split('\n')[1].match(re)[0];
                    let user_warns = str.split('\n')[+moderation_warns + 2].match(re)[0];
                    let moderation_reason = [];
                    let user_reason = [];
                    let moderation_time = [];
                    let user_time = [];
                    let moderation_give = [];
                    let user_give = [];
                    
                    let circle = 0;
                    while (+moderation_warns > circle){
                        moderation_reason.push(str.split('\n')[+circle + 2].split('==>')[0]);
                        moderation_time.push(str.split('\n')[+circle + 2].split('==>')[1]);
                        moderation_give.push(str.split('\n')[+circle + 2].split('==>')[2]);
                        circle++;
                    }
            
                    circle = 0;
                    while (+user_warns > circle){
                        user_reason.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[0]);
                        user_time.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[1]);
                        user_give.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[2]);
                        circle++;
                    }
                        
                    user_warns++
                    user_reason.push(reason);
                    user_time.push(604800000 * +user_warns + 604800000 + +message.createdAt.valueOf());
                    user_give.push(message.member.displayName);
                        
                    let text_end = `Уровень модератора: ${moderation_level}\n` + 
                    `Предупреждения модератора: ${moderation_warns}`;
                    for (var i = 0; i < moderation_reason.length; i++){
                        text_end = text_end + `\n${moderation_reason[i]}==>${moderation_time[i]}==>${moderation_give[i]}`;
                    }
                    text_end = text_end + `\nПредупреждений: ${+user_warns}`;
                    for (var i = 0; i < user_reason.length; i++){
                        text_end = text_end + `\n${user_reason[i]}==>${user_time[i]}==>${user_give[i]}`;
                    }
                    if (+user_warns < 3){
                        sacc.edit(text_end);
                        let ann = message.guild.channels.find(c => c.name == "general");
                        ann.send(`<@${user.id}>, \`модератор\` <@${message.author.id}> \`выдал вам предупреждение (${user_warns}/3). Причина: ${reason}\nЕсли вы не согласны с модератором, вы можете написать в нашу поддержку\` <#${message.guild.channels.find(c => c.name == "support").id}>`);
                        return message.delete();
                    }else{
                        await fs.appendFileSync(`./ban.txt`, `${text_end}`);
                        await message.guild.channels.find(c => c.name == "spectator-chat").send(`\`Привет! Я тут чела за нарушение правил забанил!\``, { files: [ `./ban.txt` ] });
                        fs.unlinkSync(`./ban.txt`);
                        acc.delete();
                        let ann = message.guild.channels.find(c => c.name == "general");
                        await ann.send(`<@${user.id}>, \`модератор\` <@${message.author.id}> \`выдал вам предупреждение (${user_warns}/3). Причина: ${reason}\nВам была выдана блокировка за нарушение правил (3/3)!\``);
                        user.ban("Максимальное количество предупреждений");
                        return message.delete();
                    }
                });
            }else{
                await acc.send(`Уровень модератора: 0\n` +
                `Предупреждения модератора: 0\n` +
                `Предупреждений: 1\n` +
                `${reason}==>${+message.createdAt.valueOf() + 604800000}==>${message.member.displayName}`);
                let ann = message.guild.channels.find(c => c.name == "general");
                ann.send(`<@${user.id}>, \`модератор\` <@${message.author.id}> \`выдал вам предупреждение. Причина: ${reason}\nЕсли вы не согласны с модератором, вы можете написать в нашу поддержку\` <#${message.guild.channels.find(c => c.name == "support").id}>`);
                return message.delete();
            }
        });
    }
}