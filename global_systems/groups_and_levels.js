const Discord = require('discord.js');
const fs = require("fs");

exports.run = async (bot, message, server, config, users, groups) => {
    const functions = require('../objects/functions');
    
    if (message.content == '/load_configs'){
        if (functions.levelGroup(users, message.guild.id, message.author.id, 'Разработчики') != 1){
            message.reply(`\`недостаточно прав доступа!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        functions.loadConfig(server, config).then(() => {
            functions.loadProfiles(server, users).then(() => {
                functions.loadGroups(server, groups).then(() => {
                    message.reply('все данные успешно загружены!');
                    return message.delete();
                }).catch((err) => {
                    message.reply('произошла ошибка при загрузке групп.');
                    return message.delete();
                });
            }).catch((err) => {
                message.reply('произошла ошибка при загрузке пользователей.');
                return message.delete();
            });
        }).catch((err) => {
            message.reply('произошла ошибка при загрузке серверов.');
            return message.delete();
        });
    }

    if (message.content == '/server_add'){
        if (functions.levelGroup(users, message.guild.id, message.author.id, 'Разработчики') != 1){
            message.reply(`\`недостаточно прав доступа!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        if (functions.isServerExists(config, message.guild.id)){
            message.reply(`\`сервер уже есть в базе данных!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        functions.createServer(server, config, message.guild.id).then(() => {
            message.reply('сервер был успешно создан в базе данных.');
            return message.delete();
        }).catch(() => {
            message.reply('произошла ошибка при создании сервера.');
            return message.delete();
        });
    }

    if (message.content == '/server_delete'){
        if (functions.levelGroup(users, message.guild.id, message.author.id, 'Разработчики') != 1){
            message.reply(`\`недостаточно прав доступа!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        if (!functions.isServerExists(config, message.guild.id)){
            message.reply(`\`данного сервера нет в базе данных!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        functions.deleteServer(server, config, message.guild.id).then(() => {
            message.reply('сервер был успешно удален с базы данных.');
            return message.delete();
        }).catch(() => {
            message.reply('произошла ошибка при удалении сервера.');
            return message.delete();
        });
    }

    if (message.content.startsWith('/server_status')){
        if (functions.levelGroup(users, message.guild.id, message.author.id, 'Разработчики') != 1){
            message.reply(`\`недостаточно прав доступа!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        const args = message.content.slice('/server_status').split(/ +/);
        if (!args[1]){
            message.reply(`использование: /server_status [on/off]`);
            return message.delete();
        }else if (args[1] != 'on' && args[1] != 'off'){
            message.reply(`использование: /server_status [on/off]`);
            return message.delete();
        }
        if (args[1] == 'on') args[1] = true;
        else args[1] = false;
        if (!functions.isServerExists(config, message.guild.id)){
            message.reply(`\`данного сервера нет в базе данных!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        if (functions.isEnableServer(config, message.guild.id) == args[1]){
            message.reply(`у сервера уже есть данный статус.`);
            return message.delete();
        }
        functions.changeStatusServer(server, config, message.guild.id, args[1]).then(() => {
            message.reply('статус сервера успешно изменен!');
            return message.delete();
        }).catch(() => {
            message.reply('произошла ошибка при смене статуса серверу!');
            return message.delete();
        });
    }

    if (message.content.startsWith('/system_create')){
        if (functions.levelGroup(users, message.guild.id, message.author.id, 'Разработчики') != 1){
            message.reply(`\`недостаточно прав доступа!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        const args = message.content.slice('/system_create').split(/ +/);
        if (!args[1]){
            message.reply(`использование: /system_create [name]`);
            return message.delete();
        }
        if (!functions.isServerExists(config, message.guild.id)){
            message.reply(`\`данного сервера нет в базе данных!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        if (!functions.isEnableServer(config, message.guild.id)){
            message.reply(`сервер не включен.`);
            return message.delete();
        }
        if (functions.isHasSystem(config, message.guild.id, args.slice(1).join(' '))){
            message.reply(`данная система уже существует на сервере.`);
            return message.delete();
        }
        functions.createSystem(server, config, message.guild.id, args.slice(1).join(' ')).then(() => {
            message.reply(`система ${args.slice(1).join(' ')} была успешно установлена на сервере.`);
            return message.delete();
        }).catch(() => {
            message.reply(`ошибка при выполнении команды.`);
            return message.delete();
        });
    }

    if (message.content.startsWith('/system_delete')){
        if (functions.levelGroup(users, message.guild.id, message.author.id, 'Разработчики') != 1){
            message.reply(`\`недостаточно прав доступа!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        const args = message.content.slice('/system_delete').split(/ +/);
        if (!args[1]){
            message.reply(`использование: /system_delete [name]`);
            return message.delete();
        }
        if (!functions.isServerExists(config, message.guild.id)){
            message.reply(`\`данного сервера нет в базе данных!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        if (!functions.isEnableServer(config, message.guild.id)){
            message.reply(`сервер не включен.`);
            return message.delete();
        }
        if (!functions.isHasSystem(config, message.guild.id, args.slice(1).join(' '))){
            message.reply(`данная система не существует на сервере.`);
            return message.delete();
        }
        functions.deleteSystem(server, config, message.guild.id, args.slice(1).join(' ')).then(() => {
            message.reply(`система ${args.slice(1).join(' ')} была успешно удалена с сервера.`);
            return message.delete();
        }).catch(() => {
            message.reply(`ошибка при выполнении команды.`);
            return message.delete();
        });
    }

    if (message.content.startsWith('/system_status')){
        if (functions.levelGroup(users, message.guild.id, message.author.id, 'Разработчики') != 1){
            message.reply(`\`недостаточно прав доступа!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        const args = message.content.slice('/system_status').split(/ +/);
        if (!args[1] || !args[2]){
            message.reply(`использование: /system_status [on/off] [system_name]`);
            return message.delete();
        }else if (args[1] != 'on' && args[1] != 'off'){
            message.reply(`использование: /system_status [on/off] [system_name]`);
            return message.delete();
        }
        if (args[1] == 'on') args[1] = true;
        else args[1] = false;
        if (!functions.isServerExists(config, message.guild.id)){
            message.reply(`\`данного сервера нет в базе данных!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        if (!functions.isEnableServer(config, message.guild.id)){
            message.reply(`сервер не включен.`);
            return message.delete();
        }
        if (!functions.isHasSystem(config, message.guild.id, args.slice(2).join(' '))){
            message.reply(`данная система не существует на сервере.`);
            return message.delete();
        }
        if (functions.isEnableSystem(config, message.guild.id, args.slice(2).join(' ')) == args[1]){
            message.reply(`статус системы ${functions.isEnableSystem(config, message.guild.id, args.slice(2).join(' '))} не может быть изменен на ${args[1]}`);
            return message.delete();
        }
        functions.changeStatusSystem(server, config, message.guild.id, args.slice(2).join(' '), args[1]).then(() => {
            message.reply('статус системы успешно изменен!');
            return message.delete();
        }).catch(() => {
            message.reply('произошла ошибка при смене статуса системе!');
            return message.delete();
        });
    }

    if (message.content.startsWith('/group_create')){
        if (functions.levelGroup(users, message.guild.id, message.author.id, 'Разработчики') != 1){
            message.reply(`\`недостаточно прав доступа!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        const args = message.content.slice('/group_create').split(/ +/);
        if (!args[1] || !args[2]){
            message.reply(`\`использование: /group_create [level_name] [group_name]\``);
            return message.delete();
        }
        if (!functions.isServerExists(config, message.guild.id)){
            message.reply(`\`данного сервера нет в базе данных!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        if (!functions.isEnableServer(config, message.guild.id)){
            message.reply(`сервер не включен.`);
            return message.delete();
        }
        if (functions.isGroupsExists(args.slice(2).join(' '))){
            message.reply(`данная группа уже существует.`);
            return message.delete();
        }
        functions.createGroup(server, groups, message.guild.id, args.slice(2).join(' '), args[1]).then(() => {
            message.reply(`вы успешно создали группу: ${args.slice(2).join(' ')}!`);
            return message.delete();
        }).catch(() => {
            message.reply('произошла ошибка при создании группы!');
            return message.delete();
        });
    }

    if (message.content.startsWith('/group_delete')){
        if (functions.levelGroup(users, message.guild.id, message.author.id, 'Разработчики') != 1){
            message.reply(`\`недостаточно прав доступа!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        const args = message.content.slice('/group_delete').split(/ +/);
        if (!args[1]){
            message.reply(`\`использование: /group_delete [group_name]\``);
            return message.delete();
        }
        if (!functions.isServerExists(config, message.guild.id)){
            message.reply(`\`данного сервера нет в базе данных!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        if (!functions.isEnableServer(config, message.guild.id)){
            message.reply(`сервер не включен.`);
            return message.delete();
        }
        if (!functions.isGroupsExists(args.slice(2).join(' '))){
            message.reply(`данная группа не существует.`);
            return message.delete();
        }
        functions.deleteGroup(server, groups, message.guild.id, args.slice(1).join(' ')).then(() => {
            message.reply(`вы успешно удалили группу: ${args.slice(1).join(' ')}!`);
            return message.delete();
        }).catch(() => {
            message.reply('произошла ошибка при удалении группы!');
            return message.delete();
        });
    }

    if (message.content.startsWith('/level_create')){
        if (functions.levelGroup(users, message.guild.id, message.author.id, 'Разработчики') != 1){
            message.reply(`\`недостаточно прав доступа!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        const args = message.content.slice('/level_create').split(/ +/);
        if (!args[1] || !args[2]){
            message.reply('использование: /level_create [level_name] [group_name]');
            return message.delete();
        }
        if (!functions.isServerExists(config, message.guild.id)){
            message.reply(`\`данного сервера нет в базе данных!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        if (!functions.isEnableServer(config, message.guild.id)){
            message.reply(`сервер не включен.`);
            return message.delete();
        }
        if (!functions.isGroupsExists(args.slice(2).join(' '))){
            message.reply(`данная группа не существует.`);
            return message.delete();
        }
        functions.createLevel(server, groups, message.guild.id, args.slice(2).join(' '), args[1]).then(() => {
            message.reply(`вы успешно создали ранг [${args[1]}] в группе [${args.slice(2).join(' ')}]!`);
            return message.delete();
        }).catch(() => {
            message.reply('произошла ошибка при создании ранга!');
            return message.delete();
        });
    }

    if (message.content.startsWith('/level_delete')){
        if (functions.levelGroup(users, message.guild.id, message.author.id, 'Разработчики') != 1){
            message.reply(`\`недостаточно прав доступа!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        const args = message.content.slice('/level_delete').split(/ +/);
        if (!args[1] || !args[2]){
            message.reply('использование: /level_delete [group_name]');
            return message.delete();
        }
        if (!functions.isServerExists(config, message.guild.id)){
            message.reply(`\`данного сервера нет в базе данных!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        if (!functions.isEnableServer(config, message.guild.id)){
            message.reply(`сервер не включен.`);
            return message.delete();
        }
        if (!functions.isGroupsExists(args.slice(1).join(' '))){
            message.reply(`данная группа не существует.`);
            return message.delete();
        }
        functions.deleteLevel(server, groups, users, message.guild.id, args.slice(1).join(' ')).then(() => {
            message.reply(`вы успешно удалили последний ранг в группе [${args.slice(1).join(' ')}]!`);
            return message.delete();
        }).catch((err) => {
            message.reply('произошла ошибка при удалении ранга!\n' + err);
            return message.delete();
        });
    }

    if (message.content.startsWith('/level_change')){
        if (functions.levelGroup(users, message.guild.id, message.author.id, 'Разработчики') != 1){
            message.reply(`\`недостаточно прав доступа!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        const args = message.content.slice('/level_change').split(/ +/);
        if (!args[1] || !args[2] || !args[3] || !args[4]){
            message.reply('использование: /level_change [level (число)] [permission] [value] [group_name]');
            return message.delete();
        }
        if (!functions.isServerExists(config, message.guild.id)){
            message.reply(`\`данного сервера нет в базе данных!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        if (!functions.isEnableServer(config, message.guild.id)){
            message.reply(`сервер не включен.`);
            return message.delete();
        }
        if (!functions.isGroupsExists(args.slice(4).join(' '))){
            message.reply(`данная группа не существует.`);
            return message.delete();
        }
        if (!functions.isHasLevel(groups, message.guild.id, args.slice(4).join(' '), args[1])){
            message.reply(`данный уровень не существует.`);
            return message.delete();
        }
        functions.changeLevel(server, groups, message.guild.id, args.slice(4).join(' '), args[1], args[2], args[3]).then(() => {
            message.reply(`вы успешно обновили уровень [${args[1]}], значение [${args[3]}], пункт [${args[2]}], группа [${args.slice(4).join(' ')}]!`);
            return message.delete();
        }).catch((err) => {
            message.reply(err);
            return message.delete();
        });
    }

    if (message.content.startsWith('/user_group')){
        const args = message.content.slice('/user_group').split(/ +/);
        if (!args[1] || !args[2] || !args[3]){
            message.reply('использование: /user_group [user] [level (число)] [group]');
            return message.delete();
        }
        let user = message.guild.member(message.mentions.users.first());
        if (!user){
            message.reply('использование: /user_group [user] [level (число)] [group]');
            return message.delete();
        }
        if (!functions.isServerExists(config, message.guild.id)){
            message.reply(`\`данного сервера нет в базе данных!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        if (!functions.isEnableServer(config, message.guild.id)){
            message.reply(`сервер не включен.`);
            return message.delete();
        }
        if (!functions.isGroupsExists(groups, message.guild.id, args.slice(3).join(' '))){
            message.reply(`данная группа не существует.`);
            return message.delete();
        }
        if (!functions.isHasLevel(groups, message.guild.id, args.slice(3).join(' '), args[2])){
            message.reply(`данный уровень не существует.`);
            return message.delete();
        }
        let author_level = functions.levelGroup(users, message.guild.id, message.author.id, args.slice(3).join(' '));
        let user_level = functions.levelGroup(users, message.guild.id, user.id, args.slice(3).join(' '));
        if (+args[2] == 0){
            if (!functions.getLevelPermissions(groups, message.guild.id, args.slice(3).join(' '), author_level)[2].includes(user_level)){
                message.reply(`вы не можете изменить уровень у данного пользователя!`);
                return message.delete();
            }
            functions.removeGroup(server, users, message.guild.id, user.id, args.slice(3).join(' ')).then(() => {
                message.reply(`пользователь успешно исключен из группы: ${args.slice(3).join(' ')}.`);
                return message.delete();
            }).catch(err => {
                message.reply(err);
                return message.delete();
            });
        }else{
            if (user_level != 0){
                if (!functions.getLevelPermissions(groups, message.guild.id, args.slice(3).join(' '), author_level)[2].includes(user_level)){
                    message.reply(`вы не можете изменить уровень у данного пользователя!`);
                    return message.delete();
                }
            }
            if (!functions.getLevelPermissions(groups, message.guild.id, args.slice(3).join(' '), author_level)[2].includes(args[2])){
                message.reply(`вы не можете назначить данный уровень, так как он не входит в ваши права доступа!`);
                return message.delete();
            }
            functions.changeGroup(server, users, groups, message.guild.id, user.id, args.slice(3).join(' '), args[2]).then((msg) => {
                message.reply(msg);
                return message.delete();
            }).catch(err => {
                message.reply(err);
                return message.delete();
            });
        }
    }
}