const Discord = require('discord.js');
const fs = require("fs");

function isInteger(n) {
    return n === +n && n === (n|0);
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function error_mysql(error, message){
    console.error(error);
    message.reply(`**\`произошла критическая ошибка. Подробности отправлены в личные сообщения.\`**`).then(msg => msg.delete(20000));
    const embed = new Discord.RichEmbed();
    embed.setDescription(`**${message.member}, для устранения ошибки пожалуйста составьте жалобу в нашем [техническом разделе](https://robo-hamster.ru/index.php?forums/%D0%A2%D0%B5%D1%85%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9-%D1%80%D0%B0%D0%B7%D0%B4%D0%B5%D0%BB.5/). Код ошибки: #752**`);
    message.member.send(embed);
    return message.delete();
}

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
    let hrs = (s - mins) / 60;
    let output = '';

    if (hrs != 0){
        if (hrs.toString().endsWith('1') && !hrs.toString().endsWith('11')){
            output += hrs + ' час ';
        }else if (endsWithAny(['2', '3', '4'], hrs.toString()) && !endsWithAny(['12', '13', '14'], hrs.toString())){
            output += hrs + ' часа ';
        }else{
            output += hrs + ' часов ';
        }
    }
    if (mins != 0){
        if (mins.toString().endsWith('1') && !mins.toString().endsWith('11')){
            output += mins + ' минута ';
        }else if (endsWithAny(['2', '3', '4'], mins.toString()) && !endsWithAny(['12', '13', '14'], mins.toString())){
            output += mins + ' минуты ';
        }else{
            output += mins + ' минут ';
        }
    }
    if (secs != 0){
        if (secs.toString().endsWith('1') && !secs.toString().endsWith('11')){
            output += secs + ' секунда ';
        }else if (endsWithAny(['2', '3', '4'], secs.toString()) && !endsWithAny(['12', '13', '14'], secs.toString())){
            output += secs + ' секунды ';
        }else{
            output += secs + ' секунд ';
        }
    }
    if (ms != 0){
        output += ms + ' милисекунд';
    }
    return output;
}

function uses(message, command, uses_args, settings_args){
    const args = message.content.slice(`${command}`).split(/ +/);
    if (+args.length - 1 != uses_args.length){
        message.reply(`**\`использование: ${command} [${uses_args.join('] [')}]\`**`).then(msg => msg.delete(12000));
        message.delete();
        return true;
    }
    for (let i = 0; i <= settings_args.length; i++){
        if (settings_args[i] == 'number'){
            if (!isNumeric(args[+i + 1])){
                message.reply(`**\`использование: ${command} [${uses_args.join('] [')}]\nError: значение '${uses_args[i]}' не является числом.\`**`).then(msg => msg.delete(12000));
                message.delete();
                return true;
            }
        }else if (settings_args[i] == 'integer'){
            if (!isNumeric(args[+i + 1])){
                message.reply(`**\`использование: ${command} [${uses_args.join('] [')}]\nError: значение '${uses_args[i]}' не является числом.\`**`).then(msg => msg.delete(12000));
                message.delete();
                return true;
            }
            if (!isInteger(+args[+i + 1])){
                message.reply(`**\`использование: ${command} [${uses_args.join('] [')}]\nError: значение '${uses_args[i]}' не целое.\`**`).then(msg => msg.delete(12000));
                message.delete();
                return true;
            }
        }else if (settings_args[i] == 'mention'){
            let user = message.guild.member(message.mentions.users.first());
            if (!user){
                message.reply(`**\`использование: ${command} [${uses_args.join('] [')}]\nError: '${uses_args[i]}' не является упоминанием пользователя.\`**`).then(msg => msg.delete(12000));
                message.delete();
                return true;
            }
        }else if (settings_args[i] == 'mention_user'){
            let user = message.guild.member(message.mentions.users.first());
            if (!user){
                message.reply(`**\`использование: ${command} [${uses_args.join('] [')}]\nError: '${uses_args[i]}' не является упоминанием пользователя.\`**`).then(msg => msg.delete(12000));
                message.delete();
                return true;
            }else if (user.id == message.author.id){
                message.reply(`**\`использование: ${command} [${uses_args.join('] [')}]\nError: на себя нельзя!\`**`).then(msg => msg.delete(12000));
                message.delete();
                return true;
            }
        }else if (settings_args[i] == 'plus_number'){
            if (!isNumeric(args[+i + 1])){
                message.reply(`**\`использование: ${command} [${uses_args.join('] [')}]\nError: значение '${uses_args[i]}' не является числом.\`**`).then(msg => msg.delete(12000));
                message.delete();
                return true;
            }
            if (args[+i + 1] <= 0){
                message.reply(`**\`использование: ${command} [${uses_args.join('] [')}]\nError: значение '${uses_args[i]}' должно быть положительным.\`**`).then(msg => msg.delete(12000));
                message.delete();
                return true;
            }
        }else if (settings_args[i] == 'status'){
            if (!isNumeric(args[+i + 1])){
                message.reply(`**\`использование: ${command} [${uses_args.join('] [')}]\nError: значение '${uses_args[i]}' не является числом.\`**`).then(msg => msg.delete(12000));
                message.delete();
                return true;
            }
            if (args[+i + 1] != 0 && args[+i + 1] != 1){
                message.reply(`**\`использование: ${command} [${uses_args.join('] [')}]\nError: значение '${uses_args[i]}' должно быть или '0', или '1'.\`**`).then(msg => msg.delete(12000));
                message.delete();
                return true;
            }
        }
    }
    return false;
}

function mysql_load(message, mysql_cooldown){
    if (mysql_cooldown.has(message.author.id)){
        message.reply(`**\`повторите попытку через 4 секунды.\`**`).then(msg => msg.delete(3000));
        message.delete();
        return false;
    }
    mysql_cooldown.add(message.author.id);
    setTimeout(() => {
        if (mysql_cooldown.has(message.author.id)) mysql_cooldown.delete(message.author.id)
    }, 4000);
    return true;
}

exports.run = async (bot, message, ds_cooldown, connection, mysql_cooldown, send_action) => {
    
    if (!message) return
    if (!message.member) return
    if (!message.member.roles) return
    if (!message.member.roles.some(r => r.name == 'Проверенный 🔐')) return

    if (!ds_cooldown.has(message.author.id)){
        ds_cooldown.add(message.author.id);
        setTimeout(() => {
            if (ds_cooldown.has(message.author.id)) ds_cooldown.delete(message.author.id);
        }, 180000);
        connection.query(`SELECT \`id\`, \`server\` \`user\`, \`money\` FROM \`profiles\` WHERE \`user\` = '${message.author.id}' AND \`server\` = '${message.guild.id}'`, async (error, result, packets) => {
            if (error) return console.error(error);
            if (result.length > 1) return console.error(`Ошибка при выполнении, результатов много, error code: [#351]`);
            if (result.length == 0){
                connection.query(`INSERT INTO \`profiles\` (\`server\`, \`user\`, \`money\`) VALUES ('${message.guild.id}', '${message.author.id}', '0.5')`);
            }else{
                connection.query(`UPDATE \`profiles\` SET money = money + 0.5 WHERE \`user\` = '${message.author.id}' AND \`server\` = '${message.guild.id}'`);
            }
        });
    }

    // Profile actions
    if (message.content.startsWith('/setstat')){
        if (!message.member.hasPermission("ADMINISTRATOR")) return
        if (!mysql_load(message, mysql_cooldown)) return
        if (uses(message, '/setstat', ['serverid', 'userid', 'money'], ['number', 'number', 'number'])) return
        const args = message.content.slice(`/setstat`).split(/ +/);
        connection.query(`SELECT \`id\`, \`server\` \`user\`, \`money\` FROM \`profiles\` WHERE \`user\` = '${args[2]}' AND \`server\` = '${args[1]}'`, async (error, result, packets) => {
            if (error) return console.error(error);
            if (result.length > 1) return console.error(`Ошибка при выполнении, результатов много, error code: [#351]`);
            if (result.length == 0){
                connection.query(`INSERT INTO \`profiles\` (\`server\`, \`user\`, \`money\`) VALUES ('${args[1]}', '${args[2]}', '${args[3]}')`);
                send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) добавил пользователю ${args[2]} ${args[3]} dp. (MONEY: ${args[3]})`);
            }else{
                connection.query(`UPDATE \`profiles\` SET money = money + ${args[3]} WHERE \`user\` = '${args[2]}' AND \`server\` = '${args[1]}'`);
                send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) добавил пользователю ${args[2]} ${args[3]} dp. (MONEY: ${+result[0].money + +args[3]})`);
            }
            await message.reply(`**добавил пользователю <@${args[2]}> ${args[3]} ₯**`);
            return message.delete();
        });
    }

    if (message.content.startsWith('/pay')){
        if (!mysql_load(message, mysql_cooldown)) return
        if (uses(message, '/pay', ['user', 'сумма'], ['mention_user', 'plus_number'])) return
        const args = message.content.slice(`/pay`).split(/ +/);
        let user = message.guild.member(message.mentions.users.first());
        if (args[2] < 0.01){
            await message.reply(`\`нельзя переводить менее 0.01 dp! Использование: /pay [user] [сумма]\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        connection.query(`SELECT * FROM \`profiles\` WHERE \`user\` = '${message.author.id}' AND \`server\` = '${message.guild.id}'`, async (error, result, packets) => {
            if (error) return console.error(error);
            if (result.length > 1){
                await message.reply(`**\`произошла ошибка при использовании команды. Информация была отправлена в личные сообщения.\`**`);
                const embed = new Discord.RichEmbed();
                embed.setDescription(`**${message.member}, для устранения ошибки пожалуйста составьте жалобу в нашем [техническом разделе](https://robo-hamster.ru/index.php?forums/%D0%A2%D0%B5%D1%85%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9-%D1%80%D0%B0%D0%B7%D0%B4%D0%B5%D0%BB.5/). Код ошибки: #1**`);
                message.member.send(embed);
                return message.delete();
            }else if (result.length < 1){
                await message.reply(`**\`у вас недостаточно средств для соверешения передачи.\`**`);
                return message.delete();
            }
            if (result[0].money - args[2] < 0){
                await message.reply(`**\`у вас недостаточно средств для соверешения передачи.\`**`);
                return message.delete();
            }
            connection.query(`SELECT * FROM \`profiles\` WHERE \`user\` = '${user.id}' AND \`server\` = '${message.guild.id}'`, async (error, answer, packets) => {
                if (error) return console.error(error);
                if (answer.length > 1){
                    await message.reply(`**\`произошла ошибка при использовании команды. Информация была отправлена в личные сообщения.\`**`);
                    const embed = new Discord.RichEmbed();
                    embed.setDescription(`**${message.member}, для устранения ошибки пожалуйста составьте жалобу в нашем [техническом разделе](https://robo-hamster.ru/index.php?forums/%D0%A2%D0%B5%D1%85%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9-%D1%80%D0%B0%D0%B7%D0%B4%D0%B5%D0%BB.5/). Код ошибки: #2**`);
                    message.member.send(embed);
                    return message.delete();
                }
                if (answer.length != 1){
                    connection.query(`UPDATE \`profiles\` SET money = money - ${+args[2]} WHERE \`user\` = '${message.author.id}' AND \`server\` = '${message.guild.id}'`);
                    connection.query(`INSERT INTO \`profiles\` (\`server\`, \`user\`, \`money\`) VALUES ('${message.guild.id}', '${user.id}', '${+args[2]}')`);
                    send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) перевел ${+args[2]} dp пользователю ${user.displayName || user.user.tag} (${user.id}) (${+result[0].money - +args[2]}-${+args[2]})`);
                    send_action(message.guild.id, `${user.displayName || user.user.tag} (${user.id}) получил от ${message.member.displayName || message.author.tag} (${message.author.id}) | ${+args[2]} dp (0-${+answer[0].money + +args[2]})`);
                    await message.reply(`**\`вы успешно передали ${args[2]} dp пользователю\` ${user}**`);
                    return message.delete();
                }else{
                    connection.query(`UPDATE \`profiles\` SET money = money - ${+args[2]} WHERE \`user\` = '${message.author.id}' AND \`server\` = '${message.guild.id}'`);
                    connection.query(`UPDATE \`profiles\` SET money = money + ${+args[2]} WHERE \`user\` = '${user.id}' AND \`server\` = '${message.guild.id}'`);
                    send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) перевел ${+args[2]} dp пользователю ${user.displayName || user.user.tag} (${user.id}) (${+result[0].money - +args[2]}-${+answer[0].money + +args[2]})`);
                    send_action(message.guild.id, `${user.displayName || message.author.tag} (${user.id}) получил от ${message.member.displayName || message.author.tag} (${message.author.id}) | ${+args[2]} dp (${+answer[0].money}-${+answer[0].money + +args[2]})`);
                    await message.reply(`**\`вы успешно передали ${args[2]} dp пользователю\` ${user}**`);
                    return message.delete();
                }
            });
        });
    }

    if (message.content.startsWith('/balance')){
        if (!mysql_load(message, mysql_cooldown)) return
        let user = message.guild.member(message.mentions.users.first());
        if (!user){
            connection.query(`SELECT * FROM \`profiles\` WHERE \`user\` = '${message.author.id}' AND \`server\` = '${message.guild.id}'`, async (error, result, packets) => {
                if (error) return console.error(error);
                if (result.length > 1){
                    await message.reply(`**\`произошла ошибка при использовании команды. Информация была отправлена в личные сообщения.\`**`);
                    const embed = new Discord.RichEmbed();
                    embed.setDescription(`**${message.member}, для устранения ошибки пожалуйста составьте жалобу в нашем [техническом разделе](https://robo-hamster.ru/index.php?forums/%D0%A2%D0%B5%D1%85%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9-%D1%80%D0%B0%D0%B7%D0%B4%D0%B5%D0%BB.5/). Код ошибки: #3**`);
                    await message.member.send(embed);
                    return message.delete();
                }
                if (result.length == 0){
                    send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) просмотрел свой баланс (MONEY: 0)`);
                    await message.reply(`**ваш баланс составляет 0 ₯**`);
                    return message.delete();
                }else{
                    send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) просмотрел свой баланс (MONEY: ${result[0].money})`);
                    await message.reply(`**ваш баланс составляет ${result[0].money} ₯**`);
                    return message.delete();
                }
            });
        }else{
            if (!message.member.hasPermission("MANAGE_ROLES")){
                await message.reply(`**\`недостаточно прав доступа для выполнения данного действия.\`**`).then(msg => msg.delete(12000));
                return message.delete();
            }
            connection.query(`SELECT * FROM \`profiles\` WHERE \`user\` = '${user.id}' AND \`server\` = '${message.guild.id}'`, async (error, result, packets) => {
                if (error) return console.error(error);
                if (result.length > 1){
                    await message.reply(`**\`произошла ошибка при использовании команды. Информация была отправлена в личные сообщения.\`**`);
                    const embed = new Discord.RichEmbed();
                    embed.setDescription(`**${message.member}, для устранения ошибки пожалуйста составьте жалобу в нашем [техническом разделе](https://robo-hamster.ru/index.php?forums/%D0%A2%D0%B5%D1%85%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B9-%D1%80%D0%B0%D0%B7%D0%B4%D0%B5%D0%BB.5/). Код ошибки: #4**`);
                    await message.member.send(embed);
                    return message.delete();
                }
                if (result.length == 0){
                    send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) просмотрел баланс пользователя ${user.displayName || user.user.tag} (${user.id}) (MONEY: 0)`);
                    await message.reply(`**баланс пользователя ${user} составляет 0 ₯**`);
                    return message.delete();
                }else{
                    send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) просмотрел баланс пользователя ${user.displayName || user.user.tag} (${user.id}) (MONEY: ${result[0].money})`);
                    await message.reply(`**баланс пользователя ${user} составляет ${result[0].money} ₯**`);
                    return message.delete();
                }
            });
        }
    }

    if (message.content.startsWith('/top')){
        const args = message.content.slice(`/top`).split(/ +/);
        if (args[1]){
            if (isNumeric(args[1])) return message.delete();
            connection.query(`SELECT * FROM \`profiles\` WHERE \`server\` = '${args[1]}'`, async (error, result, packets) => {
                if (result.length == 0){
                    message.reply(`**\`пользователи на данном сервере не имеют discord point'ов.\`**`).then(msg => msg.delete(12000));
                    return message.delete();
                }else{
                    let top = result.sort((a, b) => b.money - a.money);
                    let topp = [];
                    for (let i = 0; i < 10; i++){
                        topp.push(`\`[TOP ${`${i + 1}`.padStart(2, '0')}] - [${top[i].money}] -\` <@${top[i].user}>`);
                    }
                    message.member.send(`${message.member}, **\`список самых богатых пользователей:\`\n${topp.join('\n')}**`).catch(() => {
                        message.reply(`**\`список самых богатых пользователей:\`\n${topp.join('\n')}**`);
                    });
                    return message.delete();
                }
            });
        }else{
            connection.query(`SELECT * FROM \`profiles\` WHERE \`server\` = '${message.guild.id}'`, async (error, result, packets) => {
                if (result.length == 0){
                    message.reply(`**\`пользователи на данном сервере не имеют discord point'ов.\`**`).then(msg => msg.delete(12000));
                    return message.delete();
                }else{
                    let top = result.sort((a, b) => b.money - a.money);
                    let topp = [];
                    for (let i = 0; i < 10; i++){
                        topp.push(`\`[TOP ${`${i + 1}`.padStart(2, '0')}] - [${top[i].money}] -\` <@${top[i].user}>`);
                    }
                    message.member.send(`${message.member}, **\`список самых богатых пользователей:\`\n${topp.join('\n')}**`).catch(() => {
                        message.reply(`**\`список самых богатых пользователей:\`\n${topp.join('\n')}**`);
                    });
                    return message.delete();
                }
            });
        }
    }

    // Работа с предприятиями

    if (message.content.startsWith('/storage_status')){
        if (!mysql_load(message, mysql_cooldown)) return
        if (uses(message, '/storage_status', ['состояние (1/0)'], ['none'])) return
        const args = message.content.slice(`/storage_status`).split(/ +/);
        connection.query(`SELECT * FROM \`storage\` WHERE \`server\` = '${message.guild.id}' AND \`owner\` = '${message.author.id}'`, async (error, storage) => {
            if (error) return error_mysql(error, message);
            if (storage.length == 0){
                message.reply(`**\`вы не являетесь владельцем одного из предприятий на данном сервере!\`**`).then(msg => msg.delete(18000));
                return message.delete();
            }else if (storage.length == 1){
                if (uses(message, '/storage_status', ['состояние (1/0)'], ['status'])) return
                if (storage[0].money < storage[0].nalog){
                    message.reply(`**\`нельзя изменить состояние предприятия, недостаточно средств!\`**`).then(msg => msg.delete(12000));
                    return message.delete();
                }
                connection.query(`UPDATE \`storage\` SET status = '${args[1]}' WHERE \`id\` = '${storage[0].id}'`);
                message.reply(`**\`состояние предприятия было изменено!\`**`).then(msg => msg.delete(10000));
                send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) изменил состояние предприятию ${storage[0].name} на ${args[1]}`);
                return message.delete();
            }else{
                if (uses(message, '/storage_status', ['предприятие', 'состояние (1/0)'], ['number', 'status'])) return
                connection.query(`SELECT * FROM \`storage\` WHERE \`server\` = '${message.guild.id}' AND \`owner\` = '${message.author.id} AND \`id\` = '${args[1]}'`, async (error, storage) => {
                    if (error) return error_mysql(error, message);
                    if (storage.length == 0){
                        message.reply(`**\`вы не являетесь владельцем данного предприятия!\`**`).then(msg => msg.delete(18000));
                        return message.delete();
                    }else if (storage.length == 1){
                        if (storage[0].money < storage[0].nalog){
                            message.reply(`**\`нельзя изменить состояние предприятия, недостаточно средств!\`**`).then(msg => msg.delete(12000));
                            return message.delete();
                        }
                        connection.query(`UPDATE \`storage\` SET status = '${args[2]}' WHERE \`id\` = '${storage[0].id}'`);
                        message.reply(`**\`состояние предприятия было изменено!\`**`).then(msg => msg.delete(10000));
                        send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) изменил состояние предприятию ${storage[0].name} на ${args[2]}`);
                        return message.delete();
                    }else{
                        return error_mysql(error, message);
                    }
                });
            }
        });
        return
    }

    if (message.content.startsWith('/storage_description')){
        if (!mysql_load(message, mysql_cooldown)) return
        const args = message.content.slice(`/storage_description`).split(/ +/);
        if (!args[1]){
            message.reply('**\`введите значение-то!\`**').then(msg => msg.delete(7000));
            return message.delete();
        }
        connection.query(`SELECT * FROM \`storage\` WHERE \`server\` = '${message.guild.id}' AND \`owner\` = '${message.author.id}'`, async (error, storage) => {
            if (error) return error_mysql(error, message);
            if (storage.length == 0){
                message.reply(`**\`вы не являетесь владельцем одного из предприятий на данном сервере!\`**`).then(msg => msg.delete(18000));
                return message.delete();
            }else if (storage.length == 1){
                if (storage[0].status == false){
                    message.reply(`**\`нельзя редактировать предприятие, которое закрыто.\`**`).then(msg => msg.delete(10000));
                    return message.delete();
                }
                const description = args.slice(1).join(' ');
                if (description.length > 500){
                    message.reply(`**\`нельзя установить описание больше 500 символов!\`**`).then(msg => msg.delete(12000));
                    return message.delete();
                }
                connection.query(`UPDATE \`storage\` SET description = '${description}' WHERE \`id\` = '${storage[0].id}'`);
                message.reply(`**\`описание предприятия было успешно изменено!\`**`).then(msg => msg.delete(10000));
                send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) изменил описание предприятию ${storage[0].name} на ${description}`);
                return message.delete();
            }else{
                if (!isNumeric(args[1])){
                    message.reply(`**\`укажите номер вашего предприятия: /storage_description [предприятие] [описание]\`**`).then(msg => msg.delete(10000));
                    return message.delete();
                }
                connection.query(`SELECT * FROM \`storage\` WHERE \`server\` = '${message.guild.id}' AND \`owner\` = '${message.author.id} AND \`id\` = '${args[1]}'`, async (error, storage) => {
                    if (error) return error_mysql(error, message);
                    if (storage.length == 0){
                        message.reply(`**\`вы не являетесь владельцем данного предприятия!\`**`).then(msg => msg.delete(18000));
                        return message.delete();
                    }else if (storage.length == 1){
                        if (storage[0].status == false){
                            message.reply(`**\`нельзя редактировать предприятие, которое закрыто.\`**`).then(msg => msg.delete(10000));
                            return message.delete();
                        }
                        const description = args.slice(2).join(' ');
                        if (description.length > 500){
                            message.reply(`**\`нельзя установить описание больше 500 символов!\`**`).then(msg => msg.delete(12000));
                            return message.delete();
                        }
                        connection.query(`UPDATE \`storage\` SET description = '${description}' WHERE \`id\` = '${storage[0].id}'`);
                        message.reply(`**\`описание предприятия было успешно изменено!\`**`).then(msg => msg.delete(10000));
                        send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) изменил описание предприятию ${storage[0].name} на ${description}`);
                        return message.delete();
                    }else{
                        return error_mysql(error, message);
                    }
                });
            }
        });
        return
    }

    if (message.content.startsWith('/storage_up')){
        if (!mysql_load(message, mysql_cooldown)) return
        const args = message.content.slice(`/storage_up`).split(/ +/);
        connection.query(`SELECT * FROM \`storage\` WHERE \`server\` = '${message.guild.id}' AND \`owner\` = '${message.author.id}'`, async (error, storage) => {
            if (error) return error_mysql(error, message);
            if (storage.length == 0){
                message.reply(`**\`вы не являетесь владельцем одного из предприятий на данном сервере!\`**`).then(msg => msg.delete(18000));
                return message.delete();
            }else if (storage.length == 1){
                if (uses(message, '/storage_up', [], [])) return
                if (storage[0].status == false){
                    message.reply(`**\`нельзя редактировать предприятие, которое закрыто.\`**`).then(msg => msg.delete(10000));
                    return message.delete();
                }
                let need = Number((storage[0].level * storage[0].min_cost * 30)).toFixed(2);
                if (storage[0].money < need){
                    message.reply(`**\`нельзя изменить уровень предприятия, недостаточно средств!\`**`).then(msg => msg.delete(12000));
                    return message.delete();
                }
                connection.query(`UPDATE \`storage\` SET money = money - ${need} WHERE \`id\` = '${storage[0].id}'`);
                connection.query(`UPDATE \`storage\` SET level = level + 1 WHERE \`id\` = '${storage[0].id}'`)
                message.reply(`**\`уровень предприятия был увеличен!\`**`).then(msg => msg.delete(10000));
                send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) повысил уровень предприятию ${storage[0].name} до ${+storage[0].level + 1}`);
                return message.delete();
            }else{
                if (uses(message, '/storage_status', ['предприятие'], ['number'])) return
                connection.query(`SELECT * FROM \`storage\` WHERE \`server\` = '${message.guild.id}' AND \`owner\` = '${message.author.id} AND \`id\` = '${args[1]}'`, async (error, storage) => {
                    if (error) return error_mysql(error, message);
                    if (storage.length == 0){
                        message.reply(`**\`вы не являетесь владельцем данного предприятия!\`**`).then(msg => msg.delete(18000));
                        return message.delete();
                    }else if (storage.length == 1){
                        if (storage[0].status == false){
                            message.reply(`**\`нельзя редактировать предприятие, которое закрыто.\`**`).then(msg => msg.delete(10000));
                            return message.delete();
                        }
                        let need = Number((storage[0].level * storage[0].min_cost * 30)).toFixed(2);
                        if (storage[0].money < need){
                            message.reply(`**\`нельзя изменить уровень предприятия, недостаточно средств!\`**`).then(msg => msg.delete(12000));
                            return message.delete();
                        }
                        connection.query(`UPDATE \`storage\` SET money = money - ${need} WHERE \`id\` = '${storage[0].id}'`);
                        connection.query(`UPDATE \`storage\` SET level = level + 1 WHERE \`id\` = '${storage[0].id}'`)
                        message.reply(`**\`уровень предприятия был увеличен!\`**`).then(msg => msg.delete(10000));
                        send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) повысил уровень предприятию ${storage[0].name} до ${+storage[0].level + 1}`);
                        return message.delete();
                    }else{
                        return error_mysql(error, message);
                    }
                });
            }
        });
        return
    }

    if (message.content.startsWith('/storage_cost')){
        if (!mysql_load(message, mysql_cooldown)) return
        if (uses(message, '/storage_cost', ['сумма'], ['none'])) return
        const args = message.content.slice(`/storage_cost`).split(/ +/);
        connection.query(`SELECT * FROM \`storage\` WHERE \`server\` = '${message.guild.id}' AND \`owner\` = '${message.author.id}'`, async (error, storage) => {
            if (error) return error_mysql(error, message);
            if (storage.length == 0){
                message.reply(`**\`вы не являетесь владельцем одного из предприятий на данном сервере!\`**`).then(msg => msg.delete(18000));
                return message.delete();
            }else if (storage.length == 1){
                args[1] = Number((args[1])).toFixed(2);
                if (uses(message, '/storage_cost', ['сумма'], ['plus_number'])) return
                if (storage[0].status == false){
                    message.reply(`**\`нельзя редактировать предприятие, которое закрыто.\`**`).then(msg => msg.delete(10000));
                    return message.delete();
                }
                if (args[1] < storage[0].min_cost){
                    message.reply(`**\`разрешено устанавливать сумму от ${storage[0].min_cost} discord points!\`**`).then(msg => msg.delete(12000));
                    return message.delete();
                }
                connection.query(`UPDATE \`storage\` SET cost = '${args[1]}' WHERE \`id\` = '${storage[0].id}'`);
                message.reply(`**\`стоимость продажи товара была изменена!\`**`).then(msg => msg.delete(10000));
                send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) изменил стоимость продажи c ${storage[0].cost} на ${args[1]} — предприятию ${storage[0].name}`);
                return message.delete();
            }else{
                args[2] = Number((args[2])).toFixed(2);
                if (uses(message, '/storage_cost', ['предприятие', 'сумма'], ['number', 'plus_number'])) return
                connection.query(`SELECT * FROM \`storage\` WHERE \`server\` = '${message.guild.id}' AND \`owner\` = '${message.author.id} AND \`id\` = '${args[1]}'`, async (error, storage) => {
                    if (error) return error_mysql(error, message);
                    if (storage.length == 0){
                        message.reply(`**\`вы не являетесь владельцем данного предприятия!\`**`).then(msg => msg.delete(18000));
                        return message.delete();
                    }else if (storage.length == 1){
                        if (storage[0].status == false){
                            message.reply(`**\`нельзя редактировать предприятие, которое закрыто.\`**`).then(msg => msg.delete(10000));
                            return message.delete();
                        }
                        if (args[2] < storage[0].min_cost){
                            message.reply(`**\`разрешено устанавливать сумму от ${storage[0].min_cost} discord points!\`**`).then(msg => msg.delete(12000));
                            return message.delete();    
                        }
                        connection.query(`UPDATE \`storage\` SET cost = '${args[2]}' WHERE \`id\` = '${storage[0].id}'`);
                        message.reply(`**\`стоимость продажи товара была изменена!\`**`).then(msg => msg.delete(10000));
                        send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) изменил стоимость продажи c ${storage[0].cost} на ${args[2]} — предприятию ${storage[0].name}`);
                        return message.delete();
                    }else{
                        return error_mysql(error, message);
                    }
                });
            }
        });
        return
    }

    if (message.content.startsWith('/storage_add')){
        if (!mysql_load(message, mysql_cooldown)) return
        if (uses(message, '/storage_add', ['сумма'], ['none'])) return
        const args = message.content.slice(`/storage_add`).split(/ +/);
        connection.query(`SELECT * FROM \`storage\` WHERE \`server\` = '${message.guild.id}' AND \`owner\` = '${message.author.id}'`, async (error, storage) => {
            if (error) return error_mysql(error, message);
            if (storage.length == 0){
                message.reply(`**\`вы не являетесь владельцем одного из предприятий на данном сервере!\`**`).then(msg => msg.delete(18000));
                return message.delete();
            }else if (storage.length == 1){
                args[1] = Number((args[1])).toFixed(2);
                if (uses(message, '/storage_add', ['сумма'], ['plus_number'])) return
                connection.query(`SELECT * FROM \`profiles\` WHERE \`server\` = '${message.guild.id}' AND \`user\` = '${message.author.id}'`, async (error, profile) => {
                    if (error) return error_mysql(error, message);
                    if (profile.length > 1) return error_mysql(error, message);
                    if (profile.length == 1){
                        if (+profile[0].money < +args[1]){
                            message.reply(`**\`недостаточно средств!\`**`).then(msg => msg.delete(10000));
                            return message.delete();
                        }
                        connection.query(`UPDATE \`storage\` SET money = money + ${args[1]} WHERE \`id\` = '${storage[0].id}'`);
                        connection.query(`UPDATE \`profiles\` SET money = money - ${args[1]} WHERE \`id\` = '${profile[0].id}'`);
                        message.reply(`**\`вы успешно положили на склад предприятия ${args[1]} discord points!\`**`).then(msg => msg.delete(10000));
                        send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) пополнил баланс на ${args[1]} — предприятию ${storage[0].name} [MONEY ST: было: ${storage[0].money}, стало: ${Number((storage[0].money + +args[1])).toFixed(2)}] [MONEY PR: было: ${profile[0].money}, стало: ${Number((profile[0].money - +args[1])).toFixed(2)}]`);
                        return message.delete();
                    }else{
                        message.reply(`**\`недостаточно средств!\`**`).then(msg => msg.delete(10000));
                        return message.delete();
                    }
                });
            }else{
                args[2] = Number((args[2])).toFixed(2);
                if (uses(message, '/storage_add', ['предприятие', 'сумма'], ['number', 'plus_number'])) return
                connection.query(`SELECT * FROM \`storage\` WHERE \`server\` = '${message.guild.id}' AND \`owner\` = '${message.author.id} AND \`id\` = '${args[1]}'`, async (error, storage) => {
                    if (error) return error_mysql(error, message);
                    if (storage.length == 0){
                        message.reply(`**\`вы не являетесь владельцем данного предприятия!\`**`).then(msg => msg.delete(18000));
                        return message.delete();
                    }else if (storage.length == 1){
                        connection.query(`SELECT * FROM \`profiles\` WHERE \`server\` = '${message.guild.id}' AND \`user\` = '${message.author.id}'`, async (error, profile) => {
                            if (error) return error_mysql(error, message);
                            if (profile.length > 1) return error_mysql(error, message);
                            if (profile.length == 1){
                                if (+profile[0].money < +args[2]){
                                    message.reply(`**\`недостаточно средств!\`**`).then(msg => msg.delete(10000));
                                    return message.delete();
                                }
                                connection.query(`UPDATE \`storage\` SET money = money + ${args[2]} WHERE \`id\` = '${storage[0].id}'`);
                                connection.query(`UPDATE \`profiles\` SET money = money - ${args[2]} WHERE \`id\` = '${profile[0].id}'`);
                                message.reply(`**\`вы успешно положили на склад предприятия ${args[2]} discord points!\`**`).then(msg => msg.delete(10000));
                                send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) пополнил баланс на ${args[1]} — предприятию ${storage[0].name} [MONEY ST: было: ${storage[0].money}, стало: ${Number((storage[0].money + +args[2])).toFixed(2)}] [MONEY PR: было: ${profile[0].money}, стало: ${Number((profile[0].money - +args[2])).toFixed(2)}]`);
                                return message.delete();
                            }else{
                                message.reply(`**\`недостаточно средств!\`**`).then(msg => msg.delete(10000));
                                return message.delete();
                            }
                        });
                    }else{
                        return error_mysql(error, message);
                    }
                });
            }
        });
        return
    }

    if (message.content.startsWith('/storage_get')){
        if (!mysql_load(message, mysql_cooldown)) return
        if (uses(message, '/storage_get', ['сумма'], ['none'])) return
        const args = message.content.slice(`/storage_get`).split(/ +/);
        connection.query(`SELECT * FROM \`storage\` WHERE \`server\` = '${message.guild.id}' AND \`owner\` = '${message.author.id}'`, async (error, storage) => {
            if (error) return error_mysql(error, message);
            if (storage.length == 0){
                message.reply(`**\`вы не являетесь владельцем одного из предприятий на данном сервере!\`**`).then(msg => msg.delete(18000));
                return message.delete();
            }else if (storage.length == 1){
                args[1] = Number((args[1])).toFixed(2);
                if (uses(message, '/storage_get', ['сумма'], ['plus_number'])) return
                if (+storage[0].money < +args[1]){
                    message.reply(`**\`недостаточно средств!\`**`).then(msg => msg.delete(10000));
                    return message.delete();
                }
                connection.query(`SELECT * FROM \`profiles\` WHERE \`server\` = '${message.guild.id}' AND \`user\` = '${message.author.id}'`, async (error, profile) => {
                    if (error) return error_mysql(error, message);
                    if (profile.length > 1) return error_mysql(error, message);
                    if (profile.length == 1){
                        connection.query(`UPDATE \`storage\` SET money = money - ${args[1]} WHERE \`id\` = '${storage[0].id}'`);
                        connection.query(`UPDATE \`profiles\` SET money = money + ${args[1]} WHERE \`id\` = '${profile[0].id}'`);
                        message.reply(`**\`вы успешно сняли со склада предприятия ${args[1]} discord points!\`**`).then(msg => msg.delete(10000));
                        send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) снял со счета ${args[1]} — предприятия ${storage[0].name} (MONEY ST: ${storage[0].money} - ${Number((storage[0].money - +args[1])).toFixed(2)}) (MONEY PR: ${profile[0].money} - ${Number((profile[0].money + +args[1])).toFixed(2)})`);
                        return message.delete();
                    }else{
                        connection.query(`UPDATE \`storage\` SET money = money - ${args[1]} WHERE \`id\` = '${storage[0].id}'`);
                        connection.query(`INSERT INTO \`profiles\` (\`server\`, \`user\`, \`money\`) VALUES ('${message.guild.id}', '${message.author.id}', '${args[1]}')`);
                        message.reply(`**\`вы успешно сняли со склада предприятия ${args[1]} discord points!\`**`).then(msg => msg.delete(10000));
                        send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) снял со счета ${args[1]} — предприятия ${storage[0].name} (MONEY ST: ${storage[0].money} - ${Number((storage[0].money - +args[1])).toFixed(2)}) (MONEY PR: ${profile[0].money} - ${Number((profile[0].money + +args[1])).toFixed(2)})`);
                        return message.delete();
                    }
                });
            }else{
                args[2] = Number((args[2])).toFixed(2);
                if (uses(message, '/storage_get', ['предприятие', 'сумма'], ['number', 'plus_number'])) return
                connection.query(`SELECT * FROM \`storage\` WHERE \`server\` = '${message.guild.id}' AND \`owner\` = '${message.author.id} AND \`id\` = '${args[1]}'`, async (error, storage) => {
                    if (error) return error_mysql(error, message);
                    if (storage.length == 0){
                        message.reply(`**\`вы не являетесь владельцем данного предприятия!\`**`).then(msg => msg.delete(18000));
                        return message.delete();
                    }else if (storage.length == 1){
                        if (storage[0].money < args[2]){
                            message.reply(`**\`недостаточно средств!\`**`).then(msg => msg.delete(10000));
                            return message.delete();
                        }
                        connection.query(`SELECT * FROM \`profiles\` WHERE \`server\` = '${message.guild.id}' AND \`user\` = '${message.author.id}'`, async (error, profile) => {
                            if (error) return error_mysql(error, message);
                            if (profile.length > 1) return error_mysql(error, message);
                            if (profile.length == 1){
                                connection.query(`UPDATE \`storage\` SET money = money - ${args[2]} WHERE \`id\` = '${storage[0].id}'`);
                                connection.query(`UPDATE \`profiles\` SET money = money + ${args[2]} WHERE \`id\` = '${profile[0].id}'`);
                                message.reply(`**\`вы успешно сняли со склада предприятия ${args[2]} discord points!\`**`).then(msg => msg.delete(10000));
                                send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) снял со счета ${args[1]} — предприятия ${storage[0].name} (MONEY ST: ${storage[0].money} - ${Number((storage[0].money - +args[2]).toFixed(2))}) (MONEY PR: ${profile[0].money} - ${Number((profile[0].money + +args[2]).toFixed(2))})`);
                                return message.delete();
                            }else{
                                connection.query(`UPDATE \`storage\` SET money = money - ${args[2]} WHERE \`id\` = '${storage[0].id}'`);
                                connection.query(`INSERT INTO \`profiles\` (\`server\`, \`user\`, \`money\`) VALUES ('${message.guild.id}', '${message.author.id}', '${args[2]}')`);
                                message.reply(`**\`вы успешно сняли со склада предприятия ${args[2]} discord points!\`**`).then(msg => msg.delete(10000));
                                send_action(message.guild.id, `${message.member.displayName || message.author.tag} (${message.author.id}) снял со счета ${args[1]} — предприятия ${storage[0].name} (MONEY ST: ${storage[0].money} - ${Number((storage[0].money - +args[2])).toFixed(2)}) (MONEY PR: ${profile[0].money} - ${Number((profile[0].money + +args[2])).toFixed(2)})`);
                                return message.delete();
                            }
                        });
                    }else{
                        return error_mysql(error, message);
                    }
                });
            }
        });
        return
    }

    if (message.content == '/storage_help'){
        if (!mysql_load(message, mysql_cooldown)) return
        const embed = new Discord.RichEmbed();
        embed.setTitle('Команды для взоимодействия с предприятием');
        embed.addField(`Список команд`, `**/storage - получить информацию о текущем предприятии\n` +
        `/storage_help - получить справку по командам\n` +
        `/storage_description - поменять описание предприятия\n` +
        `/storage_status - открыть или закрыть предприятие\n` +
        `/storage_up - повысить уровень предприятия\n` +
        `/storage_cost - поменять цену товара на предприятии\n` +
        `/storage_add - положить деньги на предприятие\n` +
        `/storage_get - снять деньги с предприятия**`);
        embed.addField(`Краткое описание`, `**Ваше предприятие теряет в час определённую сумму, для поддержания работы предприятия требуется положить деньги на склад (/storage_add), после этого вы сможете восстановить работу предприятия командой (/storage_status).**`);
        message.member.send(embed).then(() => {
            message.reply(`**\`документация была отправлена вам в личные сообщения.\`**`).then(msg => msg.delete(12000));
        }).catch(() => {
            message.reply(`**\`ошибка отправки в личные сообщения. err: access denied for user\`**`).then(msg => msg.delete(12000));
        });
        return message.delete();
    }

    if (message.content.startsWith('/storage')){
        if (!mysql_load(message, mysql_cooldown)) return
        const args = message.content.slice(`/storage`).split(/ +/);
        connection.query(`SELECT * FROM \`storage\` WHERE \`server\` = '${message.guild.id}' AND \`owner\` = '${message.author.id}'`, async (error, storage) => {
            if (error) return error_mysql(error, message);
            if (storage.length == 0){
                message.reply(`**\`вы не являетесь владельцем одного из предприятий на данном сервере!\`**`).then(msg => msg.delete(18000));
                return message.delete();
            }else if (storage.length == 1){
                const embed = new Discord.RichEmbed();
                if (storage[0].status == true){
                    storage[0].status = 'открыто';
                    embed.setColor('#008000');
                }else{
                    storage[0].status = 'закрыто';
                    embed.setColor('#FF0000');
                }
                embed.setTitle(`Информация о предприятии ${storage[0].name} [№${storage[0].id}]`);
                embed.setDescription(`**Название предприятия: \`${storage[0].name}\`\n` +
                `Статус предприятия: \`${storage[0].status}\`\n` +
                `Уровень предприятия: \`${storage[0].level} [${Number((storage[0].level * storage[0].min_cost * 30)).toFixed(2)}]\`\n` +
                `Описание: \`${storage[0].description}\`\n` +
                `Владелец: ${message.member}\n` +
                `Стоимость: \`${Number((storage[0].cost)).toFixed(2)}\` ₯\n` +
                `Денег: \`${Number((storage[0].money)).toFixed(2)}\` ₯\n` +
                `Налог: \`${Number((storage[0].nalog)).toFixed(2)}\` ₯\n` +
                `Время производства: \`${time(storage[0].date)}\`**`);
                message.reply(embed);
                return message.delete();
            }else{
                if (!isNumeric(args[1])){
                    message.reply(`**\`укажите номер вашего предприятия: /storage_description [предприятие] [описание]\`**`).then(msg => msg.delete(10000));
                    return message.delete();
                }
                connection.query(`SELECT * FROM \`storage\` WHERE \`server\` = '${message.guild.id}' AND \`owner\` = '${message.author.id} AND \`id\` = '${args[1]}'`, async (error, storage) => {
                    if (error) return error_mysql(error, message);
                    if (storage.length == 0){
                        message.reply(`**\`вы не являетесь владельцем данного предприятия!\`**`).then(msg => msg.delete(18000));
                        return message.delete();
                    }else if (storage.length == 1){
                        const embed = new Discord.RichEmbed();
                        if (storage[0].status == true){
                            storage[0].status = 'открыто';
                            embed.setColor('#008000');
                        }else{
                            storage[0].status = 'закрыто';
                            embed.setColor('#FF0000');
                        }
                        embed.setTitle(`Информация о предприятии ${storage[0].name} [№${storage[0].id}]`);
                        embed.setDescription(`**Название предприятия: \`${storage[0].name}\`\n` +
                        `Статус предприятия: \`${storage[0].status}\`\n` +
                        `Уровень предприятия: \`${storage[0].level} [${Number((storage[0].level * storage[0].min_cost * 30)).toFixed(2)}]\`\n` +
                        `Описание: \`${storage[0].description}\`\n` +
                        `Владелец: ${message.member}\n` +
                        `Стоимость: \`${Number((storage[0].cost)).toFixed(2)}\` ₯\n` +
                        `Денег: \`${Number((storage[0].money)).toFixed(2)}\` ₯\n` +
                        `Налог: \`${Number((storage[0].nalog)).toFixed(2)}\` ₯\n` +
                        `Время производства: \`${time(storage[0].date)}\`**`);
                        message.reply(embed);
                        return message.delete();
                    }else{
                        return error_mysql(error, message);
                    }
                });
            }
        });
        return
    }

    // Конец работы с предприятиями

    // Работа с магазином
    /*
        Закрытие-открытие магазина. (если денег в магазине > чем налог)
        Изменить описание магазина. (если магазин открыт)
        Изменить стоимость товара (если магазин открыт)
        Положить или снять деньги магазин.
        

    */

    // Конец работы с магазином
}
