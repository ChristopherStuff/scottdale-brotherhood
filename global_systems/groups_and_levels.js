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
}