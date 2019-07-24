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
}