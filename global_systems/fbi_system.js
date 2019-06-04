const Discord = require('discord.js');
const fs = require("fs");

exports.run = async (bot, message) => {
    let re = /(\d+(\.\d)*)/i;
    if (message.content.startsWith("/fbi_access")){
        const args = message.content.slice(`/fbi_access`).split(/ +/);
        let level_mod = 0;
        let db_server = bot.guilds.find(g => g.id == "493459379878625320");
        let acc_creator = db_server.channels.find(c => c.name == message.author.id);
        if (acc_creator){
            await acc_creator.fetchMessages({limit: 1}).then(async messages => {
                if (messages.size == 1){
                    messages.forEach(async sacc => {
			        let str = sacc.content;
                        level_mod = +str.split('\n')[0].match(re)[0];
                    });
                }
            });
        }
        if (!message.member.hasPermission("ADMINISTRATOR") && +level_mod < 1){
            message.reply(`**\`недостаточно прав доступа для использования данной команды!\`**`).then(msg => msg.delete(12000));
            return message.delete();
        }
        let user = message.guild.member(message.mentions.users.first());
        if (!user){
            message.reply(`**\`/fbi_access [user] [add/remove/moderate] [(0)/(1)/(2)/(3)]\`**`).then(msg => msg.delete(40000));
            return message.delete();
        }
        if(user.id == "241950106125860865") {
	    message.reply(`**\`данного пользователя указывать запрещено (музыкальный бот)\`**`).then(msg => msg.delete(40000));
            return message.delete();
	
	}
        if (!args[2]){
            message.reply(`**\`укажите значение (add), (remove) или (moderate)!\`**`).then(msg => msg.delete(12000));
            return message.delete();
        }else if (args[2] != 'add' && args[2] != 'remove' && args[2] != 'moderate'){
            message.reply(`**\`укажите значение (add), (remove) или (moderate)!\`**`).then(msg => msg.delete(12000));
            return message.delete();
        }
        if (!args[3]){
            message.reply(`**\`укажите канал (0 - чат) (1 - фбр голос) (2 - фбр секретка) (3 - FBI Recruitment)!\`**`).then(msg => msg.delete(12000));
            return message.delete();
        }else if (args[3] != '0' && args[3] != '1' && args[3] != '2' && args[3] != '3'){
            message.reply(`**\`укажите канал (0 - чат) (1 - фбр голос) (2 - фбр секретка) (3 - FBI Recruitment)!\`**`).then(msg => msg.delete(12000));
            return message.delete();
        }
        let federal_channels = [];
        federal_channels.push(message.guild.channels.find(c => c.name == 'fbi-chat'));
        federal_channels.push(message.guild.channels.find(c => c.name == 'Federal Bureau of Investigation'));
        federal_channels.push(message.guild.channels.find(c => c.name == 'Secret Channel F.B.I'));
        federal_channels.push(message.guild.channels.find(c => c.name == 'FBI Recruitment'));
        if (args[2] == 'add'){
            await federal_channels[args[3]].overwritePermissions(user, {
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
                USE_EXTERNAL_EMOJIS: true,
                ADD_REACTIONS: true,
                // VOICE PERMISSIONS
                VIEW_CHANNEL: true,
                CONNECT: true,
                SPEAK: true,
                MUTE_MEMBERS: false,
                DEAFEN_MEMBERS: false,
                MOVE_MEMBERS: false,
                USE_VAD: true,
                PRIORITY_SPEAKER: false,
            });
            message.reply(`**\`вы успешно выдали доступ пользователю\` <@${user.id}> \`на подключение/просмотр '${federal_channels[args[3]].name}'.\`**`);
            return message.delete();
        }else if (args[2] == 'moderate'){
            await federal_channels[args[3]].overwritePermissions(user, {
                // GENERAL PERMISSIONS
                CREATE_INSTANT_INVITE: false,
                MANAGE_CHANNELS: false,
                MANAGE_ROLES: false,
                MANAGE_WEBHOOKS: false,
                // TEXT PERMISSIONS
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                SEND_TTS_MESSAGES: false,
                MANAGE_MESSAGES: true,
                EMBED_LINKS: true,
                ATTACH_FILES: true,
                READ_MESSAGE_HISTORY: true,
                MENTION_EVERYONE: true,
                USE_EXTERNAL_EMOJIS: true,
                ADD_REACTIONS: true,
                // VOICE PERMISSIONS
                VIEW_CHANNEL: true,
                CONNECT: true,
                SPEAK: true,
                MUTE_MEMBERS: true,
                DEAFEN_MEMBERS: false,
                MOVE_MEMBERS: true,
                USE_VAD: true,
                PRIORITY_SPEAKER: true,
            });
            message.reply(`**\`вы успешно выдали доступ пользователю\` <@${user.id}> \`на модерацию '${federal_channels[args[3]].name}'.\`**`);
            return message.delete();
        }else if (args[2] == 'remove'){
            await federal_channels[args[3]].permissionOverwrites.forEach(async perm => {
                if (perm.type == `member`){
                    if (perm.id == user.id) await perm.delete();
                }
            });
            message.reply(`**\`вы успешно забрали доступ у пользователя\` <@${user.id}> \`к '${federal_channels[args[3]].name}'.\`**`);
            return message.delete();
        }
    }

    if (message.content.startsWith("/fbi_members")){
        let level_mod = 0;
        let db_server = bot.guilds.find(g => g.id == "493459379878625320");
        let acc_creator = db_server.channels.find(c => c.name == message.author.id);
        if (acc_creator){
            await acc_creator.fetchMessages({limit: 1}).then(async messages => {
                if (messages.size == 1){
                    messages.forEach(async sacc => {
			        let str = sacc.content;
                        level_mod = +str.split('\n')[0].match(re)[0];
                    });
                }
            });
        }
        if (!message.member.hasPermission("ADMINISTRATOR") && +level_mod < 1){
            message.reply(`**\`недостаточно прав доступа для использования данной команды!\`**`).then(msg => msg.delete(12000));
            return message.delete();
        }
        const args = message.content.slice(`/fbi_members`).split(/ +/);
        if (!args[1] || !['0', '1', '2', '3'].includes(args[1])){
            message.reply(`**\`использование: /fbi_members [0(чат)/1(фбр)/2(секретка)/3(FBI Recruitment)]\`**`).then(msg => msg.delete(12000));
            return message.delete();
        }
        let federal_channels = [];
        federal_channels.push(message.guild.channels.find(c => c.name == 'fbi-chat'));
        federal_channels.push(message.guild.channels.find(c => c.name == 'Federal Bureau of Investigation'));
        federal_channels.push(message.guild.channels.find(c => c.name == 'Secret Channel F.B.I'));
        federal_channels.push(message.guild.channels.find(c => c.name == 'FBI Recruitment'));
        let fbi_moderate_temp = [];
        let fbi_user_temp = [];
        let fbi_moderate = [];
        let fbi_user = [];
        let fbi_user_two = [];
        await federal_channels[args[1]].permissionOverwrites.forEach(async perm => {
            if (perm.type == `member`){
                let perms = new Discord.Permissions(perm.allow);
                if (perms.has("PRIORITY_SPEAKER")){
                    fbi_moderate_temp.push(`<@${perm.id}>`);
                    if (fbi_moderate_temp.length >= 3){
                        fbi_moderate.push(`\`[${`${+fbi_moderate.length + 1}`.padStart(2, '0')}]\` ${fbi_moderate_temp.join(', ')}`);
                        fbi_moderate_temp = [];
                    }
                }else{
                    fbi_user_temp.push(`<@${perm.id}>`);
                    if (fbi_user_temp.length >= 3){
                        fbi_user.push(`\`[${`${+fbi_user.length + 1}`.padStart(2, '0')}]\` ${fbi_user_temp.join(', ')}`);
                        fbi_user_temp = [];
                    }
                }
            }
        });
        if (fbi_moderate_temp.length != 0){
            fbi_moderate.push(`\`[${`${+fbi_moderate.length + 1}`.padStart(2, '0')}]\` ${fbi_moderate_temp.join(', ')}`);
        }
        if (fbi_user_temp.length != 0){
            if (fbi_user.length > 18){
                fbi_user_two.push(`\`[${`${+fbi_user.length + 1}`.padStart(2, '0')}]\` ${fbi_user_temp.join(', ')}`)
            }else{
                fbi_user.push(`\`[${`${+fbi_user.length + 1}`.padStart(2, '0')}]\` ${fbi_user_temp.join(', ')}`);
            }
        }
        if (fbi_user.length > 0) await message.reply(`**\`список пользователей имеющих доступ к каналу: ${federal_channels[args[1]].name}\`\n${fbi_user.join('\n')}**`);
        if (fbi_user_two.length > 0) await message.reply(`**\`список пользователей имеющих доступ к каналу: ${federal_channels[args[1]].name}\`\n${fbi_user_two.join('\n')}**`);
        if (fbi_moderate.length > 0) await message.reply(`**\`список модераторов канала: ${federal_channels[args[1]].name}\`\n${fbi_moderate.join('\n')}**`);
        return message.delete();
    }
}
