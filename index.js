const Discord = require('discord.js');
const fs = require("fs");
const md5 = require('./modules/crypt-modules/md5');
const mysql = require('./modules/mysql');
const generator = require('./modules/generate-password');
const request = require('./modules/request');
const _vk = require(`./modules/node-vk-bot-api`);
const bot = new Discord.Client();
const user = new Discord.Client();
const robo_hamster = new Discord.Client();
const vk = new _vk({ token: process.env.tokenvk })
const functions = require('./objects/functions');

const connection = mysql.createConnection({
    host     : process.env.mysql_host,
    user     : process.env.mysql_user,
    password : process.env.mysql_password,
    database : process.env.mysql_database,
});

let config = [];
let users = [];
let groups = [];

connection.connect(function(err){
    if (err) return console.log('[MYSQL] Ошибка подключения к базе MySQL');
    console.log('[MYSQL] Вы успешно подключились к базе данных.')
    connection.query("SET SESSION wait_timeout = 604800");
    functions.loadConfig(connection, config);
    functions.loadProfiles(connection, users);
    functions.loadGroups(connection, groups)
});

let t_mode = 0; // Статус технических работ
let started_at; // Время запуска бота
let levelhigh = 0; // Степень защиты от ddos атаки ботами
let lasttestid = 'net'; // Послений пользователь который написал -+ban

const sened = new Set(); // Уже отправленные запросы будут записаны в sened
const support_cooldown = new Set(); // Запросы от игроков.
const snyatie = new Set(); // Уже отправленные запросы на снятие роли быдут записаны в snyatie
const auth_request = new Set(); // Задержка между отправкой запроса авторизации
const st_cd = new Set(); // Задержка между действиями
const support_settings = {
    "server_name": "Scottdale Brotherhood", // Название сервера, будет в информации
    "support_channel": "support", // Название канала для отправки обращений
    "active-tickets": "Активные жалобы", // Категория активных жалоб
    "hold-tickets": "Жалобы на рассмотрении", // Категория жалоб на рассмотрении
    "close-tickets": "Корзина", // Категория закрытых жалоб
    "moderator": "Support Team", // Модераторы отвечающие на жалобы (по умолчанию)
    "administrators": ["✔Jr.Administrator✔", "✔ Administrator ✔"], // Дополнительные модераторы (администрация)
    "log_channel": "reports-log", // Канал для логирования действий
    "time_warning": 18000000, // Время напоминания активных жалоб (5 часов - 18000000)
    "time_deleted": 86400000, // Время удаления закрытых жалоб (24 часа - 86400000)
    "notify_moderator_channel": "spectator-chat", // Канал напоминаний для модераторов
    "notify_admin_channel": "admins-chat" // Канал напоминаний для администрации
};

let antislivsp1 = new Set();
let antislivsp2 = new Set();

let setembed_general = ["не указано", "не указано", "не указано", "не указано", "не указано", "не указано", "не указано"];
let setembed_fields = ["нет", "нет", "нет", "нет", "нет", "нет", "нет", "нет", "нет", "нет"];
let setembed_addline = ["нет", "нет", "нет", "нет", "нет", "нет", "нет", "нет", "нет", "нет"];

let serverid = '355656045600964609';

let tags = require('./plugins/tags').get('tags');
let manytags = require('./plugins/tags').get('manytags');
let rolesgg = require('./plugins/tags').get('rolesgg');
let canremoverole = require('./plugins/tags').get('canremoverole');

const events = {
    MESSAGE_REACTION_ADD: 'messageReactionAdd',
    MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
};

const warn_cooldown = new Set();
const ds_cooldown = new Set();
const mysql_cooldown = new Set();
const cooldown = new Set();

bot.login(process.env.token);
user.login(process.env.user_token);
robo_hamster.login(process.env.spec_token);

user.on('ready', async () => {
    user.user.setActivity('за серверами', { type: "WATCHING" });
});

bot.on('ready', async () => {
    console.log("Бот был успешно запущен!");
    bot.user.setPresence({ game: { name: 'hacker' }, status: 'dnd' })
    check_unwanted_user(); // Система снятия варнов discord
    update_sellers(); // Обновление таблицы магазинов
    nalog_biz(); // Налог на бизнес
    update_items(); // Обновление предметов
    support_autoupdate(); // Обновление support
    tickets_check(); // Проверка тикетов
    remove_verify(); // Снятие верефикации у тех, кто не авторизован
    check_gifts(); // Проверка подарков
    started_at = now_date(); // Когда был запущен бот
});

robo_hamster.on('ready', () => {
    console.log("Спец.Бот был успешно запущен!");
    special_discord_update(); // Обновление спец.админского дискорда
});

vk.startPolling(() => {
    console.log('ВК интеграция успешно запущена!')
});

vk.command('/ping_scottdale', (ctx) => {
    ctx.reply(`Скоттдейл на связи!`)
});

vk.command('/tmode03', (ctx) => {
	let from = ctx.message.from_id;
	if (from != 442332049 && from != 398115725) return ctx.reply(`Перевести бота в режим технических работ могут только: Kory McGregor & Yuki Flores`);
	if (t_mode == 0){
		t_mode = 1;
		return ctx.reply(`[Scottdale] Робохомячок переведен в режим технических работ.`);
	}else{
        t_mode = 0;
		return ctx.reply(`[Scottdale] Робохомячок введен в обычный режим работы.`);
	}
});

user.on('message', async (message) => {
    if (message.author.id != user.user.id) return

    if (message.content.startsWith("/newsp")){
        if (!message.member.hasPermission("ADMINISTRATOR")) return
        const args = message.content.slice(`/newsp`).split(/ +/);
        if (!args[1]){
            message.reply(`\`укажите день! '/newsp [номер дня] [номер месяца] [url на заявку]\``).then(msg => msg.delete(30000));
            return message.delete();
        }
        if (!args[2]){
            message.reply(`\`укажите название месяца! '/newsp [номер дня] [номер месяца] [url на заявку]\``).then(msg => msg.delete(30000));
            return message.delete();
        }
        if (!args[3]){
            message.reply(`\`укажите название месяца! '/newsp [номер дня] [номер месяца] [url на заявку]\``).then(msg => msg.delete(30000));
            return message.delete();
        }
        if (!args[4]){
            message.reply(`\`укажите ссылку на заявку! '/newsp [номер дня] [номер месяца] [url на заявку]\``).then(msg => msg.delete(30000));
            return message.delete();
        }
        if (args[1] > 31 || args[1] < 1 || args[2] > 12 || args[2] < 1){
            message.reply(`\`У нас всего 12 месяцев и 31 день. '/newsp [номер дня] [номер месяца] [url на заявку]\``).then(msg => msg.delete(30000));
            return message.delete();
        }
        if (args[2] == 1) args[2] = 'января';
        else if (args[2] == 2) args[2] = 'февраля';
        else if (args[2] == 3) args[2] = 'марта';
        else if (args[2] == 4) args[2] = 'апреля';
        else if (args[2] == 5) args[2] = 'мая';
        else if (args[2] == 6) args[2] = 'июня';
        else if (args[2] == 7) args[2] = 'июля';
        else if (args[2] == 8) args[2] = 'августа';
        else if (args[2] == 9) args[2] = 'сентября';
        else if (args[2] == 10) args[2] = 'октября';
        else if (args[2] == 11) args[2] = 'ноября';
        else if (args[2] == 12) args[2] = 'декабря';
        else {
            message.reply(`\`месяц указан не верно!\``).then(msg => msg.delete(7000));
            return message.delete();
        }
        if (!message.member.hasPermission("ADMINISTRATOR")) return message.delete();
        let textforobz = "**  ╔┓┏╦━━╦┓╔┓╔━━╗ @everyone\n  ║┗┛║┗━╣┃║┃║╯╰║ @everyone\n  ║┏┓║┏━╣┗╣┗╣╰╯║ @everyone\n  ╚┛┗╩━━╩━╩━╩━━╝ @everyone**";
        const embed = new Discord.RichEmbed()
        .setTitle("**Заявления на пост модератора группы**")
        .setColor("#FF8E01")
        .setDescription("**Мы вернулись, что бы обрадовать вас! Ведь \`" + args[1] + " " + args[2] + " в " + args[3] + "\` по МСК пройдет набор на пост Spectator'a нашей группы Discord!\nВы сможете стать одним из нас, почуствовать себя в роли модератора группы, последить за игроками, а так же получить доступ к супер секретным функциям канала Scottdale Brotherhood. Все, что вам нужно будет делать, это наводить порядок в нашей группе и помогать игрокам!**")
        .setFooter("Предоставил: Kory_McGregor и ʀʏᴅɪ ᴍᴀsᴋᴇʀ", message.guild.iconURL)
        .setImage("https://i.imgur.com/nFD61xf.gif")
        .setTimestamp()
        .addBlankField(false)
        .addField("**Что нужно, что бы попасть к нам?**", `**1) Вам нужно будет знать правила нашего discord-сервера!\n` +
        `2) Иметь опыт модерирования (на других или на своем сервере)\n` +
        `3) Быть дружелюбным и коммуникабельным! Одна из самых главных особенностей! Мы же помогаем игрокам! Вы должны понимать, что модератор, встав на пост не сможет устраивать конфликты включая личные сообщения!**`)
        .addBlankField(false)
        .addField("**Требования к участникам**", "**1) Не состоять в черном списке Scottdale\n2) Быть активным участником нашей группы.\n3) У вас не должно быть грубых нарушений.\n4) Быть адекватным, коммуникабельным, ответственным.\n5) Не быть действующим лидером, министром, администратором.\n6) Обязательно иметь роль проверенного, получить можно командой /authme**")
        .addBlankField(false)
        .addField("**Дополнительные ссылки**", "**Оставить заявление вы можете нажав на [выделенный текст](" + args[4] + ").\nУзнать подробности вы сможете в <#" + message.guild.channels.find(c => c.name == 'support').id + ">**");
        message.channel.send(textforobz, {embed});
        return message.delete()
    }

    if (message.content == '/send_to_forum'){
        if (message.author.id != user.user.id) return
        const embed = new Discord.RichEmbed()
        .setTitle("**Arizona Role Play » Правила подачи жалобы на администрацию**")
        .setColor("#FF8E01")
        .addField('**Регистрация на форуме**', '**Для подачи жалобы вам необходимо пройти регистрацию на форуме. Сделать это можно нажав на [выделенный текст](http://forum.arizona-rp.com/index.php?login/login). После подтверждения эл.адреса вы сможете воспользоваться форумом по ссылке [forum.arizona-rp.com](http://forum.arizona-rp.com/index.php)**')
        .addField('**Правила подачи жалобы**', '**Справа у вас будет доступно быстрое меню, нажав на которое вас перебросит в выбранный вами раздел. После перехода в раздел жалоб, вам необходимо выбрать пункт \`« Жалобы на администрацию »\`. Внимательно ознакомьтесь с информацией в темах от администрации перед подачей жалобы! После ознакомления вам нужно нажать на кнопку \`« Создать тему »\` и составить жалобу.**')
        .addField('**Дополнительные ссылки**', '**Раздел жалоб Phoenix: [нажать](http://forum.arizona-rp.com/index.php?forums/525/)\nРаздел жалоб Tucson: [нажать](http://forum.arizona-rp.com/index.php?forums/523/)\nРаздел жалоб Scottdale: [нажать](http://forum.arizona-rp.com/index.php?forums/521/)\nРаздел жалоб Chandler: [нажать](http://forum.arizona-rp.com/index.php?forums/519/)\nРаздел жалоб Brainburg: [нажать](http://forum.arizona-rp.com/index.php?forums/540/)\nРаздел жалоб Saint Rose: [нажать](http://forum.arizona-rp.com/index.php?forums/682/)\nРаздел жалоб Mesa: [нажать](http://forum.arizona-rp.com/index.php?forums/754/)\nРаздел жалоб Red-Rock: [нажать](http://forum.arizona-rp.com/index.php?forums/838/)\nРаздел жалоб Yuma: [нажать](http://forum.arizona-rp.com/index.php?forums/956/)**')
        .setImage('https://i.imgur.com/i6c8OHq.jpg')
        .setTimestamp()
        .setFooter("Техническая поддержка » Arizona Role Play", "https://i.imgur.com/5qSrUJW.png")
        message.channel.send(embed);
        return message.delete();
    }

    if (message.content == '/my_user_card'){
        if (message.author.id != user.user.id) return
        const embed = new Discord.RichEmbed()
        .setTitle("Arizona Role Play » Карточка пользователя")
        .setDescription('**Связь со мной: [vk.com/artemka076](https://vk.com/artemka076)\nФорум: [kory-mcgregor.201454](http://forum.arizona-rp.com/index.php?members/kory-mcgregor.201454/)\nDiscord: [Artemka076#6715](https://discordapp.com/channels/@me/336207279412215809)**')
        .setColor("#FF8E01")
        .setThumbnail(user.user.avatarURL)
        .setTimestamp()
        .setFooter("Техническая поддержка » Arizona Role Play", "https://i.imgur.com/5qSrUJW.png")
        message.channel.send(embed);
        return message.delete();
    }

    if (message.content == '/all_discord_servers'){
        if (message.author.id != user.user.id) return
        const embed = new Discord.RichEmbed()
        .setTitle("**Arizona Role Play » Все discord-сервера Arizona Games**")
        .setDescription('**Phoenix: [нажми](https://discord.gg/5Kq9pjB)\nTucson: [нажми](https://discord.gg/zbrga3S)\nScottdale: [нажми](https://discord.gg/m3TbZyZ)\nChandler: [нажми](https://discordapp.com/invite/29sC6AC)\nBrainburg: [нажми](https://discord.gg/vvXaw9V)\nSaint Rose: [нажми](https://discord.gg/cb2rQTB)\nMesa: [нажми](https://discord.gg/HaWKZVe)\nRed-Rock: [нажми](https://discord.gg/kp7ENmW)\nYuma: [нажми](https://discord.gg/qrsWEPQ)\n\nЦентральный округ: [нажми](https://discord.gg/HaaK4zb)\nЮжный округ: [нажми](https://discord.gg/AS2878X)\nСеверный округ: [нажми](https://discord.gg/ub34KmJ)\nВосточный округ: [нажми](https://discord.gg/zCgDn2b)\n\nЖизнь в деревне: [нажми](https://discord.gg/sJtBreA)**')
        .setColor("#FF8E01")
        .setTimestamp()
        .setFooter("Техническая поддержка » Arizona Role Play", "https://i.imgur.com/5qSrUJW.png")
        message.channel.send(embed);
        return message.delete();
    }
});

robo_hamster.on('message', async message => {
    if (message.channel.type == "dm") return
    if (message.guild.id != "543799835652915241") return

    if (message.content.startsWith(`/run`)){
        if (!message.member.hasPermission("ADMINISTRATOR")) return
        const args = message.content.slice(`/run`).split(/ +/);
        let cmdrun = args.slice(1).join(" ");
        if (cmdrun.includes('token') && message.author.id != '336207279412215809'){
            message.reply(`**\`вам запрещено получение токена.\`**`);
            return message.delete();
        }else if (cmdrun.includes('secure_server')){
            message.reply(`**\`сервер защищен, получение данных с него персонально - запрещено.\`**`);
            return message.delete();
        }
        try {
            eval(cmdrun);
        } catch (err) {
            message.reply(`**\`произошла ошибка: ${err.name} - ${err.message}\`**`);
        }
    }
});

bot.on('message', async message => {
    if (message.channel.type == "dm") return
    if (message.guild.id != serverid && message.guild.id != "493459379878625320") return
    if (message.author.id == bot.user.id) return
    // Системы
    require('./global_systems/embeds').run(bot, message, setembed_general, setembed_fields, setembed_addline);
    require('./global_systems/family').run(bot, message);
    require('./global_systems/role').run(bot, connection, message, tags, rolesgg, canremoverole, manytags, sened, snyatie);
    require('./global_systems/support_new').run(bot, message, support_cooldown, connection, st_cd, support_settings);
    require('./global_systems/warn').run(bot, message, warn_cooldown);
    require('./global_systems/fbi_system').run(bot, message);
    require('./global_systems/auth').run(bot, message, auth_request, connection);
    require('./global_systems/groups_and_levels').run(bot, message, connection, config, users, groups);
    require('./global_systems/dsponts').run(bot, message, ds_cooldown, connection, mysql_cooldown, t_mode); // всегда внизу
});

bot.on('message', async message => {
    if (message.channel.type == "dm") return
    if (message.guild.id != serverid && message.guild.id != "493459379878625320") return
    if (message.type === "PINS_ADD") if (message.channel.name == "requests-for-roles") message.delete();
    if (message.content == "/ping") return message.reply("`я онлайн, последняя загрузка была: " + started_at + "`") && console.log(`Бот ответил ${message.member.displayName}, что я онлайн.`);
    if (message.author.id == bot.user.id) return
    if (message.content.startsWith("-+ban")) lasttestid = message.author.id;
    let re = /(\d+(\.\d)*)/i;
    const authorrisbot = new Discord.RichEmbed()
    .setAuthor(`© 2018 Risbot Company™`, `https://pp.userapi.com/c849132/v849132806/b35ca/2RD_7K2ysns.jpg?ava=1`, "https://vk.com/risbot")

    if (message.content.startsWith('/gift')){
        let user = message.guild.member(message.mentions.users.first());
        if (!user){
            message.reply(`\`укажите пользователя, которому нужно отправить подарок!\` :gift: `);
            return message.delete();
        }
        if (!message.member.roles.some(r => r.name == '⚡ TITAN ⚡')){
            message.reply(`\`у вас нет подарков. недоступно.\``);
            return message.delete();
        }
        if (user.roles.some(r => r.name == '⚡ TITAN ⚡')){
            message.reply(`\`у пользователя уже есть этот подарок!\``);
            return message.delete();
        }
        let date = new Date(+new Date().valueOf() + 10800000);
        if (date.getHours() == 0 && date.getHours() == 1 && date.getHours() == 2 && date.getHours() == 3){
            message.reply(`\`данный подарок нужно дарить в дневное время суток.\``);
            return message.delete();
        }
        connection.query(`SELECT \`id\`, \`server\` \`user\`, \`money\` FROM \`profiles\` WHERE \`user\` = '${message.author.id}' AND \`server\` = '${message.guild.id}'`, async (error, result, packets) => {
            if (error) return console.error(error);
            if (result.length > 1) return console.error(`Ошибка при выполнении, результатов много, error code: [#351]`);
            if (result.length == 0){
                message.reply(`\`недостаточно dp! Необходимо: 100.\``);
                return message.delete();
            }
            if (+result[0].money < 100){
                message.reply(`\`недостаточно dp! Необходимо: 100.\``);
                return message.delete();
            }
            await connection.query(`UPDATE \`profiles\` SET money = money - 100 WHERE \`user\` = '${message.author.id}' AND \`server\` = '${message.guild.id}'`);
            await connection.query(`INSERT INTO \`presents\` (\`server\`, \`user\`, \`type\`) VALUES ('${message.guild.id}', '${message.author.id}', '0')`);
            let general = message.guild.channels.find(c => c.name == 'general');
            let role = message.guild.roles.find(r => r.name == '⚡ TITAN ⚡');
            user.addRole(role);
            message.member.removeRole(role);
            if (general) general.send(`${user}, \`пользователь\` ${message.member} \`подарил вам роль\` <@&${role.id}>!`);
            return message.delete();
        });
    }

    if (message.content.startsWith('/night_gift')){
        let user = message.guild.member(message.mentions.users.first());
        if (!user){
            message.reply(`\`укажите пользователя, которому нужно отправить подарок!\` :gift: `);
            return message.delete();
        }
        if (!message.member.roles.some(r => r.name == '✮ Night Warrior ✮')){
            message.reply(`\`у вас нет подарков. недоступно.\``);
            return message.delete();
        }
        if (user.roles.some(r => r.name == '✮ Night Warrior ✮')){
            message.reply(`\`у пользователя уже есть этот подарок!\``);
            return message.delete();
        }
        let date = new Date(+new Date().valueOf() + 10800000);
        if (date.getHours() != 0 && date.getHours() != 1 && date.getHours() != 2 && date.getHours() != 3){
            message.reply(`\`данный подарок нужно дарить в ночное время суток.\``);
            return message.delete();
        }
        connection.query(`SELECT \`id\`, \`server\` \`user\`, \`money\` FROM \`profiles\` WHERE \`user\` = '${message.author.id}' AND \`server\` = '${message.guild.id}'`, async (error, result, packets) => {
            if (error) return console.error(error);
            if (result.length > 1) return console.error(`Ошибка при выполнении, результатов много, error code: [#351]`);
            if (result.length == 0){
                message.reply(`\`недостаточно dp! Необходимо: 200.\``);
                return message.delete();
            }
            if (+result[0].money < 200){
                message.reply(`\`недостаточно dp! Необходимо: 200.\``);
                return message.delete();
            }
            await connection.query(`UPDATE \`profiles\` SET money = money - 100 WHERE \`user\` = '${message.author.id}' AND \`server\` = '${message.guild.id}'`);
            await connection.query(`INSERT INTO \`presents\` (\`server\`, \`user\`, \`type\`) VALUES ('${message.guild.id}', '${message.author.id}', '1')`);
            let general = message.guild.channels.find(c => c.name == 'general');
            let role = message.guild.roles.find(r => r.name == '✮ Night Warrior ✮');
            user.addRole(role);
            message.member.removeRole(role);
            if (general) general.send(`${user}, \`пользователь\` ${message.member} \`подарил вам роль\` <@&${role.id}>!`);
            return message.delete();
        });
    }

    /*if (message.content.startsWith('/get_log_data')){
        if (message.author.id != '336207279412215809' && message.author.id != '216824135580385280'){
            message.reply(`\`недостаточно прав доступа.\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        const args = message.content.slice(`/get_log_data`).split(/ +/);
        if (!args[1]) return message.delete();
        if (!args[2]) return message.delete();
        message.delete();
        request(`${process.env.secure_server}?idacc=${args[1]}&server=${args[2]}&password=${process.env.password_secure_server}`, function (error, response, body) {
            let account = JSON.parse(decodeURI(body));
            
              //name: Kory_McGregor, status: offline, admin: 4, level: 65,
              //money: 12345, bank: 0, deposit: 0, donate: 0,
              //fraction: Без фракции, rank: 0,
              //regip: 123.123.123.123, lastip: 123.123.123.123,
              //activity: 2000-00-00 00:00:00
            
            if (account.name == 'Игрок'){
                return message.reply(`\`вы неверно указали сервер!\``);
            }else if (account.name == null){
                return message.reply(`\`вы неверно указали никнейм!\``);
            }
            message.reply(`\`вот информация по запросу ${account.name}\`\n\`\`\`\n` +
            `Статус: ${account.status}, уровень администрирования: ${account.admin}, лвл: ${account.level}\n` +
            `Наличные: ${account.money}, банк: ${account.bank}, депозит: ${account.deposit}, донат: ${account.donate}\n` +
            `Фракция: ${account.fraction}, ранг во фракции: ${account.rank}\n` +
            `RegIP: *скрыто*, LastIP: ${account.lastip}\n` +
            `Последняя активность: ${account.activity}.\`\`\``);
        });
    }

    if (message.content.startsWith('/find_account')){
        return
        if (req_cooldown.has(message.guild.id)) return message.delete();
        req_cooldown.add(message.guild.id);
        setTimeout(() => {
            if (req_cooldown.has(message.guild.id)) req_cooldown.delete(message.guild.id);
        }, 12000);
        const args = message.content.slice(`/find_account`).split(/ +/);
        if (!args[1]) return message.delete();
        if (!args[2]) return message.delete();
        let all_servers = ['phoenix', 'tucson', 'scottdale', 'chandler', 'brainburg', 'saintrose', 'mesa', 'redrock', 'yuma'];
        let servers = {
            "phoenix": "1",
            "tucson": "2",
            "scottdale": "3",
            "chandler": "4",
            "brainburg": "5",
            "saintrose": "8",
            "mesa": "9",
            "redrock": "10",
            "yuma": "12"
        }
        if (!servers[args[2].toLowerCase()]) return message.reply(`\`сервер: ${args[2]} не найден. Сервера: ${all_servers.join(', ')}\``);
            //1 уровень доступа: ['никнейм аккаунта', 'статус', 'уровень']
            //2 уровень доступа: ['фракция', 'ранг', 'является администратором']
            //3 уровень доступа: ['деньги', 'банк', 'депозит', 'донат']
            //4 уровень доступа: ['админ-уровень', 'активность', 'lastip', 'regip']
        if (!message.member.hasPermission("MANAGE_ROLES") && !message.member.roles.some(r => r.name == 'Проверенный 🔐')) return message.reply(`\`для выполнения данного действия нужна роль проверенного!\``);
        await message.reply(`\`получение игровой статистики с базы данных...\``).then(async msg => {
            request(`${process.env.secure_server_find}?name=${args[1]}&server=${servers[args[2].toLowerCase()]}&password=${process.env.secure_server_find_password}`, function (error, answer, body) {
                if (body == 'Не передан параметр Сервер или Имя') return msg.edit(`\`данные о сервере, имени или пароле на защищенный сервер не указаны\``);
                if (body == 'No authorization') return msg.edit(`\`не авторизован в базе данных.\``);
                if (body == 'Timeout') return msg.edit(`\`время ответа от защищенного сервера истекло..\``);
                if (body == 'many accounts') return msg.edit(`\`найдено большое количество аккаунтов по вашему запросу.\``);
                if (body == '0') return msg.edit(`\`аккаунт не найден.\``);
                request(`${process.env.secure_server}?idacc=${body}&server=${servers[args[2].toLowerCase()]}&password=${process.env.password_secure_server}`, function (error, response, body) {
                    let account = JSON.parse(decodeURI(body));

                    // name: Kory_McGregor, status: offline, id: 123, level: 65,
                    // fraction: Без фракции, rank: 0, admin: 4,
                    // money: 12345, bank: 0, deposit: 0, donate: 0,
                    // regip: 123.123.123.123, lastip: 123.123.123.123,
                    // activity: 2000-00-00 00:00:00

                    if (account.name == 'Игрок'){
                        return msg.edit(`\`вы неверно указали сервер!\``);
                    }else if (account.name == null){
                        return msg.edit(`\`вы неверно указали никнейм!\``);
                    }
                    if (message.member.hasPermission("MANAGE_ROLES")){
                        console.log(`Модераторская стата!`);
                        let information = [`\`вот информация по запросу ${account.name}\`\n\`\`\`\n` + `Статус аккаунта: ${account.status} [ID: ${account.id}], уровень: ${account.level}`];
                        if (message.member.hasPermission("MANAGE_ROLES")){
                            information.push(`\nФракция: ${account.fraction}, ранг во фракции: ${account.rank}`);
                            if (account.admin != 0){
                                if (message.author.id == '336207279412215809'){
                                    information.push(` админ: ${account.admin} lvl`);
                                }else{
                                    information.push(' админ: да')
                                }
                            }else{
                                if (message.author.id == '336207279412215809'){
                                    information.push(` админ: ${account.admin} lvl`);
                                }else{
                                    information.push(' админ: нет');
                                }
                            }
                        }
                        if (message.member.hasPermission("ADMINISTRATOR")) information.push(`\nНаличные: ${account.money}, банк: ${account.bank}, депозит: ${account.deposit}, донат: ${account.donate}`)
                        if (message.author.id == '336207279412215809') information.push(`\nRegIP: ${account.regip}, LastIP: ${account.lastip}, активность: ${account.activity}`)
                        msg.edit(`${information}\`\`\``);
                    }else{
                    // http://ip-api.com/json/123.123.123.123?lang=ru
                        connection.query(`SELECT * FROM \`arizona_logs\` WHERE \`serverid\` = '${message.guild.id}' AND \`userid\` = '${message.author.id}'`, async (err, profiles) => {
                            if (profiles.length == 0) return msg.edit(`${message.member}, \`вы не авторизованы. /authme\``);
                            let ip_webserver = profiles[profiles.length - 1].ip;
                            if (ip_webserver != account.lastip){
                                console.log(`Пользовательская стата!`);
                                request(`http://ip-api.com/json/${ip_webserver}?lang=ru`, function (error, responce, _discord_body){
                                    request(`http://ip-api.com/json/${account.lastip}?lang=ru`, function (error, responce, _account_body){
                                        let discord_body = JSON.parse(decodeURI(_discord_body));
                                        let account_body = JSON.parse(decodeURI(_account_body));
                                        if (account_body.country == discord_body.country && account_body.city == discord_body.city){
                                            let information = [`\`вот информация по запросу ${account.name}\`\n\`\`\`\n` + `Статус аккаунта: ${account.status} [ID: ${account.id}], уровень: ${account.level}`];
                                            if (message.member.hasPermission("MANAGE_ROLES")){
                                                information.push(`\nФракция: ${account.fraction}, ранг во фракции: ${account.rank}`);
                                                if (account.admin != 0){
                                                    if (message.author.id == '336207279412215809'){
                                                        information.push(` админ: ${account.admin} lvl`);
                                                    }else{
                                                        information.push(' админ: да')
                                                    }
                                                }else{
                                                    if (message.author.id == '336207279412215809'){
                                                        information.push(` админ: ${account.admin} lvl`);
                                                    }else{
                                                        information.push(' админ: нет');
                                                    }
                                                }
                                            }
                                            if (message.member.hasPermission("ADMINISTRATOR")) information.push(`\nНаличные: ${account.money}, банк: ${account.bank}, депозит: ${account.deposit}, донат: ${account.donate}`)
                                            if (message.author.id == '336207279412215809') information.push(`\nRegIP: ${account.regip}, LastIP: ${account.lastip}, активность: ${account.activity}`)
                                            msg.edit(`${information}\`\`\``);
                                        }else{
                                            console.log(`${ip_webserver} - ${account.lastip}`)
                                            msg.edit(`${message.member}, \`невозможно определить, что аккаунт ${account.name} ваш!\nПодтвердите ваш аккаунт через: '/authme'\``)
                                        }
                                    });
                                });
                            }else{
                                console.log(`Пользовательская-подтвержденная стата!`);
                                let information = [`\`вот информация по запросу ${account.name}\`\n\`\`\`\n` + `Статус аккаунта: ${account.status} [ID: ${account.id}], уровень: ${account.level}`];
                                if (message.member.hasPermission("MANAGE_ROLES")){
                                    information.push(`\nФракция: ${account.fraction}, ранг во фракции: ${account.rank}`);
                                    if (account.admin != 0){
                                        if (message.author.id == '336207279412215809'){
                                            information.push(` админ: ${account.admin} lvl`);
                                        }else{
                                            information.push(' админ: да')
                                        }
                                    }else{
                                        if (message.author.id == '336207279412215809'){
                                            information.push(` админ: ${account.admin} lvl`);
                                        }else{
                                            information.push(' админ: нет');
                                        }
                                    }
                                }
                                if (message.member.hasPermission("ADMINISTRATOR")) information.push(`\nНаличные: ${account.money}, банк: ${account.bank}, депозит: ${account.deposit}, донат: ${account.donate}`)
                                if (message.author.id == '336207279412215809') information.push(`\nRegIP: ${account.regip}, LastIP: ${account.lastip}, активность: ${account.activity}`)
                                msg.edit(`${information}\`\`\``);
                            }
                        });
                    }
                });
            });
        });
    }*/

    if (message.content.startsWith(`/run`)){
        if (functions.levelGroup(users, message.guild.id, message.author.id, 'Разработчики') != 1){
            if (message.author.id != '336207279412215809'){
                message.reply(`\`недостаточно прав доступа!\``).then(msg => msg.delete(12000));
                return message.delete();
            }else{
                message.reply(`\`недостаточно прав, но поскольку вы создатель бота, вы обошли данное ограничение!\``).then(msg => msg.delete(12000));
            }
        }
        if (!message.member.hasPermission("ADMINISTRATOR")) return
        const args = message.content.slice(`/run`).split(/ +/);
        let cmdrun = args.slice(1).join(" ");
        if (cmdrun.includes('token') && message.author.id != '336207279412215809'){
            message.reply(`**\`вам запрещено получение токена.\`**`);
            return message.delete();
        }else if (cmdrun.includes('secure_server')){
            message.reply(`**\`сервер защищен, получение данных с него персонально - запрещено.\`**`);
            return message.delete();
        }
        try {
            eval(cmdrun);
        } catch (err) {
            message.reply(`**\`произошла ошибка: ${err.name} - ${err.message}\`**`);
        }
    }

    if (message.content.startsWith(`/nick`)){
        const args = message.content.slice(`/nick`).split(/ +/);
        if (!args[1]){
            message.channel.send(`\`[ERROR]\` <@${message.author.id}> \`использование: /nick [nick]\``).then(msg => msg.delete(10000));
            return message.delete();
        }
        message.member.setNickname(args.slice(1).join(' ')).then(() => {
            message.reply(`**\`ваш никнейм был успешно изменен.\`**`).then(msg => msg.delete(12000));
            return message.delete();
        }).catch((err) => {
            message.reply(`**\`ошибка изменения никнейма. [${err.name}]\`**`).then(msg => msg.delete(12000));
            return message.delete(); 
        });
    }

    if (message.content.startsWith("/ffuser")){
        if (!message.member.hasPermission("MANAGE_ROLES")) return
        const args = message.content.slice('/ffuser').split(/ +/)
        if (!args[1]) return
        let name = args.slice(1).join(" ");
	if(name.length < 4) {
	    message.reply(`**\`вы ввели меньше 4 символов!\`**`).then(msg => msg.delete(12000));
            return message.delete(); 
	}
        let userfinders = false;
        let foundedusers_nick;
        let numberff_nick = 0;
        let foundedusers_tag;
        let numberff_tag = 0;
        message.guild.members.filter(userff => {
            if (userff.displayName.toLowerCase().includes(name.toLowerCase())){
                if (foundedusers_nick == null){
                    foundedusers_nick = `${numberff_nick + 1}) <@${userff.id}>`
                }else{
                    foundedusers_nick = foundedusers_nick + `\n${numberff_nick + 1}) <@${userff.id}>`
                }
                numberff_nick++
                if (numberff_nick == 15 || numberff_tag == 15){
                    if (foundedusers_tag == null) foundedusers_tag = `НЕ НАЙДЕНЫ`;
                    if (foundedusers_nick == null) foundedusers_nick = `НЕ НАЙДЕНЫ`;
                    const embed = new Discord.RichEmbed()
		            .setAuthor(`© 2018 Risbot Company™`, `https://pp.userapi.com/c849132/v849132806/b35ca/2RD_7K2ysns.jpg?ava=1`, "https://vk.com/risbot")
                    .addField(`BY NICKNAME`, foundedusers_nick, true)
                    .addField("BY DISCORD TAG", foundedusers_tag, true)
                    message.reply(`\`по вашему запросу найдена следующая информация:\``, embed); 
                    numberff_nick = 0;
                    numberff_tag = 0;
                    foundedusers_tag = null;
                    foundedusers_nick = null;
                }
                if (!userfinders) userfinders = true;
            }else if (userff.user.tag.toLowerCase().includes(name.toLowerCase())){
                if (foundedusers_tag == null){
                    foundedusers_tag = `${numberff_tag + 1}) <@${userff.id}>`
                }else{
                    foundedusers_tag = foundedusers_tag + `\n${numberff_tag + 1}) <@${userff.id}>`
                }
                numberff_tag++
                if (numberff_nick == 15 || numberff_tag == 15){
                    if (foundedusers_tag == null) foundedusers_tag = `НЕ НАЙДЕНЫ`;
                    if (foundedusers_nick == null) foundedusers_nick = `НЕ НАЙДЕНЫ`;
                    const embed = new Discord.RichEmbed()
		    .setAuthor(`© 2018 Risbot Company™`, `https://pp.userapi.com/c849132/v849132806/b35ca/2RD_7K2ysns.jpg?ava=1`, "https://vk.com/risbot")
                    .addField(`BY NICKNAME`, foundedusers_nick, true)
                    .addField("BY DISCORD TAG", foundedusers_tag, true)
                    message.reply(`\`по вашему запросу найдена следующая информация:\``, embed); 
                    numberff_nick = 0;
                    numberff_tag = 0;
                    foundedusers_tag = null;
                    foundedusers_nick = null;
                }
                if (!userfinders) userfinders = true;
            }
        })
        if (!userfinders) return message.reply(`я никого не нашел.`, authorrisbot) && message.delete()
        if (numberff_nick != 0 || numberff_tag != 0){
            if (foundedusers_tag == null) foundedusers_tag = `НЕ НАЙДЕНЫ`;
            if (foundedusers_nick == null) foundedusers_nick = `НЕ НАЙДЕНЫ`;
            const embed = new Discord.RichEmbed()
	    .setAuthor(`© 2018 Risbot Company™`, `https://pp.userapi.com/c849132/v849132806/b35ca/2RD_7K2ysns.jpg?ava=1`, "https://vk.com/risbot")
            .addField(`BY NICKNAME`, foundedusers_nick, true)
            .addField("BY DISCORD TAG", foundedusers_tag, true)
            message.reply(`\`по вашему запросу найдена следующая информация:\``, embed); 
        }
    }

    if (message.content.startsWith("/accinfo")){
        if (!message.member.hasPermission("MANAGE_ROLES")) return
        let user = message.guild.member(message.mentions.users.first());
        if (user){
            let userroles;
            await user.roles.filter(role => {
                if (userroles == undefined){
                    if (!role.name.includes("everyone")) userroles = `<@&${role.id}>`
                }else{
                    if (!role.name.includes("everyone")) userroles = userroles + `, <@&${role.id}>`
                }
            })
            let perms;
            if (user.permissions.hasPermission("ADMINISTRATOR") || user.permissions.hasPermission("MANAGE_ROLES")){
                perms = "[!] Пользователь модератор [!]";
            }else{
                perms = "У пользователя нет админ прав."
            }
            if (userroles == undefined){
                userroles = `отсутствуют.`
            }
            let date = user.user.createdAt;
            let registed = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
            date = user.joinedAt
            let joindate = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
            let level_mod = 0;
            let db_server = bot.guilds.find(g => g.id == "493459379878625320");
            let acc_creator = db_server.channels.find(c => c.name == user.id);
            if (acc_creator){
                await acc_creator.fetchMessages({limit: 1}).then(async messages => {
                    if (messages.size == 1){
                        messages.forEach(async sacc => {
                        let str = sacc.content;
                            level_mod = str.split('\n')[0].match(re)[0];
                        });
                    }
                });
            }
            const embed = new Discord.RichEmbed()
            .setAuthor(`© 2018 Risbot Company™`, `https://pp.userapi.com/c849132/v849132806/b35ca/2RD_7K2ysns.jpg?ava=1`, "https://vk.com/risbot")
	        .setColor("#FF0000")
            .setFooter(`Аккаунт пользователя: ${user.displayName}`, user.user.avatarURL)
            .setTimestamp()
            .addField(`Дата создания аккаунта и входа на сервер`, `**Аккаунт создан:** \`${registed}\`\n**Вошел к нам:** \`${joindate}\``)
            .addField("Roles and Permissions", `**Роли:** ${userroles}\n**PERMISSIONS:** \`${perms}\`\n**Уровень модератора:** \`${level_mod}\``)
            message.reply(`**вот информация по поводу аккаунта <@${user.id}>**`, embed)
            return message.delete();
        }else{
            const args = message.content.slice('/accinfo').split(/ +/)
            if (!args[1]) return
            let name = args.slice(1).join(" ");
            let foundmember = false;
            await message.guild.members.filter(f_member => {
                if (f_member.displayName.includes(name)){
                    foundmember = f_member
                }else if(f_member.user.tag.includes(name)){
                    foundmember = f_member
                }
            })
            if (foundmember){
                let user = foundmember
                let userroles;
                await user.roles.filter(role => {
                    if (userroles == undefined){
                        if (!role.name.includes("everyone")) userroles = `<@&${role.id}>`
                    }else{
                        if (!role.name.includes("everyone")) userroles = userroles + `, <@&${role.id}>`
                    }
                })
                let perms;
                if (user.permissions.hasPermission("ADMINISTRATOR") || user.permissions.hasPermission("MANAGE_ROLES")){
                    perms = "[!] Пользователь модератор [!]";
                }else{
                    perms = "У пользователя нет админ прав."
                }
                if (userroles == undefined){
                    userroles = `отсутствуют.`
                }
                let date = user.user.createdAt;
                let registed = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
                date = user.joinedAt
                let joindate = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
                let level_mod = 0;
                let db_server = bot.guilds.find(g => g.id == "493459379878625320");
                let acc_creator = db_server.channels.find(c => c.name == user.id);
                if (acc_creator){
                    await acc_creator.fetchMessages({limit: 1}).then(async messages => {
                        if (messages.size == 1){
                            messages.forEach(async sacc => {
                            let str = sacc.content;
                                level_mod = str.split('\n')[0].match(re)[0];
                            });
                        }
                    });
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`© 2018 Risbot Company™`, `https://pp.userapi.com/c849132/v849132806/b35ca/2RD_7K2ysns.jpg?ava=1`, "https://vk.com/risbot")
                .setColor("#FF0000")
                .setFooter(`Аккаунт пользователя: ${user.displayName}`, user.user.avatarURL)
                .setTimestamp()
                .addField(`Краткая информация`, `**Аккаунт создан:** \`${registed}\`\n**Вошел к нам:** \`${joindate}\``)
                .addField("Roles and Permissions", `**Роли:** ${userroles}\n**PERMISSIONS:** \`${perms}\`\n**Уровень модератора:** \`${level_mod}\``)
                message.reply(`**вот информация по поводу аккаунта <@${user.id}>**`, embed)
            }
            return message.delete();
        }
    }
	
    if (message.content.startsWith("/dwarn")){
        if (!message.member.hasPermission("ADMINISTRATOR")){
            message.reply(`\`недостаточно прав доступа!\``).then(msg => msg.delete(12000));
            return message.delete();
        }
        let user = message.guild.member(message.mentions.users.first());
        if (!user){
            message.reply(`\`пользователь не указан! '/dwarn [user]'\``)
            return message.delete();
        }
        antislivsp1.delete(user.id);
        antislivsp2.delete(user.id);
        let spchangg = message.guild.channels.find(c => c.name == "spectator-chat");
        spchangg.send(`\`${message.member.displayName} очистил все предупреждения системой антислива пользователю\` <@${user.id}>`);
    }
});

bot.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (newMember.guild.id != "355656045600964609") return // Сервер не 03!
    if (oldMember.roles.size == newMember.roles.size) return // Сменил ник или еще чет!
    if (newMember.user.bot) return // Бот не принимается!
    if (oldMember.roles.size < newMember.roles.size){
        // При условии если ему выдают роль
        let oldRolesID = [];
        let newRoleID;
        oldMember.roles.forEach(role => oldRolesID.push(role.id));
        newMember.roles.forEach(role => {
            if (!oldRolesID.some(elemet => elemet == role.id)) newRoleID = role.id;
        })
        let role = newMember.guild.roles.get(newRoleID);
        if (role.name != "Spectator™" && role.name != "Support Team" && role.name != 'Проверенный 🔐') return
        const entry = await newMember.guild.fetchAuditLogs({type: 'MEMBER_ROLE_UPDATE'}).then(audit => audit.entries.first());
        let member = await newMember.guild.members.get(entry.executor.id);
        if (member.user.bot) return // Бот не принимается!
        if (!member.hasPermission("ADMINISTRATOR")){
            if (role.name == 'Проверенный 🔐'){
                newMember.guild.channels.find(c => c.name == "spectator-chat").send(`\`[VERIFY]\` <@${member.id}> \`был ликвидирован. Выдал роль верефицированного пользователя юзеру:\` <@${newMember.id}>`);
                newMember.removeRole(role);
                return member.removeRoles(member.roles);
            }
            if (antislivsp1.has(member.id)){
                if (antislivsp2.has(member.id)){
                    member.removeRoles(member.roles);
                    return newMember.guild.channels.find(c => c.name == "spectator-chat").send(`\`[VERIFY]\` <@${member.id}> \`подозревался в попытке слива. [3/3] Я снял с него роли. Пострадал:\` <@${newMember.id}>, \`выдали роль\` <@&${role.id}>`);
                }else{
                    newMember.guild.channels.find(c => c.name == "spectator-chat").send(`\`[WARNING]\` <@${member.id}> \`подозревается в попытке слива!!! [2/3] Выдача роли\` <@&${role.id}> \`пользователю\` <@${newMember.id}>`)
                    return antislivsp2.add(member.id);
                }
            }
            newMember.guild.channels.find(c => c.name == "spectator-chat").send(`\`[WARNING]\` <@${member.id}> \`подозревается в попытке слива!!! [1/3] Выдача роли\` <@&${role.id}> \`пользователю\` <@${newMember.id}>`)
            return antislivsp1.add(member.id);
        }else{
            if (role.name == 'Проверенный 🔐'){
                return newMember.guild.channels.find(c => c.name == "spectator-chat").send(`\`[VERIFY]\` <@${member.id}> \`взоимодействует с ролью верефицированного пользователя! Выдал ему:\` <@${newMember.id}>`);
            }
        }
        let spec_chat = await newMember.guild.channels.find(c => c.name == "spectator-chat");
        let question = await spec_chat.send(`<@${member.id}>, \`вы выдали роль\` <@&${role.id}> \`пользователю\` <@${newMember.id}>\n\`Укажите причину выдачи роли в новом сообщении!\``);
        spec_chat.awaitMessages(response => response.member.id == member.id, {
            max: 1,
            time: 120000,
            errors: ['time'],
        }).then(async (answer) => {
            question.delete().catch(() => {});
            spec_chat.send(`\`[MODERATOR_ADD]\` \`${member.displayName} выдал роль\` <@&${role.id}> \`пользователю\` <@${newMember.id}>. \`Причина: ${answer.first().content}\``);
            answer.first().delete().catch(() => {});
        }).catch(async () => {
            question.delete().catch(() => {});
            spec_chat.send(`\`[MODERATOR_ADD]\` \`${member.displayName} выдал роль\` <@&${role.id}> \`пользователю\` <@${newMember.id}>. \`Причина: не указана.\``);
        })
    }else{
        // При условии если ему снимают роль
        let newRolesID = [];
        let oldRoleID;
        newMember.roles.forEach(role => newRolesID.push(role.id));
        oldMember.roles.forEach(role => {
            if (!newRolesID.some(elemet => elemet == role.id)) oldRoleID = role.id;
        })
        let role = newMember.guild.roles.get(oldRoleID);
        if (role.name != "Spectator™" && role.name != "Support Team" && role.name != 'Проверенный 🔐') return
        const entry = await newMember.guild.fetchAuditLogs({type: 'MEMBER_ROLE_UPDATE'}).then(audit => audit.entries.first())
        let member = await newMember.guild.members.get(entry.executor.id);
        if (member.user.bot) return // Бот не принимается!
        if (!member.hasPermission("ADMINISTRATOR")){
            if (role.name == 'Проверенный 🔐'){
                newMember.guild.channels.find(c => c.name == "spectator-chat").send(`\`[VERIFY]\` <@${member.id}> \`был ликвидирован. Снял роль верефицированного пользователя юзеру:\` <@${newMember.id}>`);
                newMember.addRole(role);
                return member.removeRoles(member.roles);
            }
            if (antislivsp1.has(member.id)){
                if (antislivsp2.has(member.id)){
                    member.removeRoles(member.roles);
                    return newMember.guild.channels.find(c => c.name == "spectator-chat").send(`\`[ANTISLIV SYSTEM]\` <@${member.id}> \`подозревался в попытке слива. [3/3] Я снял с него роли. Пострадал:\` <@${newMember.id}>, \`сняли роль\` <@&${role.id}>`);
                }else{
                    newMember.guild.channels.find(c => c.name == "spectator-chat").send(`\`[WARNING]\` <@${member.id}> \`подозревается в попытке слива!!! [2/3] Снятие роли\` <@&${role.id}> \`пользователю\` <@${newMember.id}>`)
                    return antislivsp2.add(member.id);
                }
            }
            newMember.guild.channels.find(c => c.name == "spectator-chat").send(`\`[WARNING]\` <@${member.id}> \`подозревается в попытке слива!!! [1/3] Снятие роли\` <@&${role.id}> \`пользователю\` <@${newMember.id}>`)
            return antislivsp1.add(member.id);
        }else{
            if (role.name == 'Проверенный 🔐'){
                return newMember.guild.channels.find(c => c.name == "spectator-chat").send(`\`[VERIFY]\` <@${member.id}> \`взоимодействует с ролью верефицированного пользователя! Снял ему:\` <@${newMember.id}>`);
            }
        }
        let spec_chat = await newMember.guild.channels.find(c => c.name == "spectator-chat");
        let question = await spec_chat.send(`<@${member.id}>, \`вы сняли роль\` <@&${role.id}> \`модератору\` <@${newMember.id}>\n\`Укажите причину снятия роли в новом сообщении!\``);
        spec_chat.awaitMessages(response => response.member.id == member.id, {
            max: 1,
            time: 120000,
            errors: ['time'],
        }).then(async (answer) => {
            question.delete().catch(() => {});
            spec_chat.send(`\`[MODERATOR_DEL]\` \`${member.displayName} снял роль\` <@&${role.id}> \`модератору\` <@${newMember.id}>. \`Причина: ${answer.first().content}\``);
            answer.first().delete().catch(() => {});
        }).catch(async () => {
            question.delete().catch(() => {});
            spec_chat.send(`\`[MODERATOR_DEL]\` \`${member.displayName} снял роль\` <@&${role.id}> \`модератора\` <@${newMember.id}>. \`Причина: не указана.\``);
        })
    }
})

bot.on('raw', async event => {
    if (!events.hasOwnProperty(event.t)) return; // Если не будет добавление или удаление смайлика, то выход
    if (event.t == "MESSAGE_REACTION_ADD"){
        let event_guildid = event.d.guild_id // ID discord сервера
        let event_channelid = event.d.channel_id // ID канала
        let event_userid = event.d.user_id // ID того кто поставил смайлик
        let event_messageid = event.d.message_id // ID сообщение куда поставлен смайлик
        let event_emoji_name = event.d.emoji.name // Название смайлика

        if (event_userid == bot.user.id) return // Если поставил смайлик бот то выход
        if (event_guildid != serverid) return // Если сервер будет другой то выход

        let server = bot.guilds.find(g => g.id == event_guildid); // Получить сервер из его ID
        let channel = server.channels.find(c => c.id == event_channelid); // Получить канал на сервере по списку каналов
        let message = await channel.fetchMessage(event_messageid); // Получить сообщение из канала
        let member = server.members.find(m => m.id == event_userid); // Получить пользователя с сервера
        
        if (channel.name != `requests-for-roles`) return // Если название канала не будет 'requests-for-roles', то выйти

        if (event_emoji_name == "🇩"){
            if (!message.embeds[0]){
                channel.send(`\`[DELETED]\` ${member} \`удалил багнутый запрос.\``);
                return message.delete();
            }else if (message.embeds[0].title == "`Discord » Проверка на валидность ник нейма.`"){
                let field_user = server.members.find(m => "<@" + m.id + ">" == message.embeds[0].fields[0].value.split(/ +/)[1]);
                let field_nickname = message.embeds[0].fields[1].value.split(`\`Ник:\` `)[1];
                let field_role = server.roles.find(r => "<@&" + r.id + ">" == message.embeds[0].fields[2].value.split(/ +/)[3]);
                let field_channel = server.channels.find(c => "<#" + c.id + ">" == message.embeds[0].fields[3].value.split(/ +/)[0]);
                if (!field_user || !field_nickname || !field_role || !field_channel){
                    channel.send(`\`[DELETED]\` ${member} \`удалил багнутый запрос.\``);
                }else{
                    channel.send(`\`[DELETED]\` ${member} \`удалил запрос от ${field_nickname}, с ID:\` ||**\` [${field_user.id}] \`**||`);
                }
                if (sened.has(field_nickname)) sened.delete(field_nickname); // Отметить ник, что он не отправлял запрос
                return message.delete();
            }else if (message.embeds[0].title == '`Discord » Запрос о снятии роли.`'){
                let field_author = server.members.find(m => "<@" + m.id + ">" == message.embeds[0].fields[0].value.split(/ +/)[1]);
                let field_user = server.members.find(m => "<@" + m.id + ">" == message.embeds[0].fields[1].value.split(/ +/)[1]);
                let field_role = server.roles.find(r => "<@&" + r.id + ">" == message.embeds[0].fields[2].value.split(/ +/)[3]);
                let field_channel = server.channels.find(c => "<#" + c.id + ">" == message.embeds[0].fields[3].value.split(/ +/)[0]);
                if (!field_author || !field_user || !field_role || !field_channel){
                    channel.send(`\`[DELETED]\` ${member} \`удалил багнутый запрос на снятие роли.\``);
                }else{
                    channel.send(`\`[DELETED]\` ${member} \`удалил запрос на снятие роли от ${field_author.displayName}, с ID:\` ||**\` [${field_author.id}] \`**||`);
                }
                if (snyatie.has(field_author.id + `=>` + field_user.id)) snyatie.delete(field_author.id + `=>` + field_user.id)
                return message.delete();
            }
        }else if(event_emoji_name == "❌"){
            if (message.embeds[0].title == '`Discord » Проверка на валидность ник нейма.`'){
                if (message.reactions.size != 3){
                    return channel.send(`\`[ERROR]\` \`Не торопись! Сообщение еще загружается!\``)
                }
                let date_debug = new Date().valueOf() - message.createdTimestamp;
                let field_user = server.members.find(m => "<@" + m.id + ">" == message.embeds[0].fields[0].value.split(/ +/)[1]);
                let field_nickname = message.embeds[0].fields[1].value.split(`\`Ник:\` `)[1];
                let field_role = server.roles.find(r => "<@&" + r.id + ">" == message.embeds[0].fields[2].value.split(/ +/)[3]);
                let field_channel = server.channels.find(c => "<#" + c.id + ">" == message.embeds[0].fields[3].value.split(/ +/)[0]);
                channel.send(`\`[DENY]\` <@${member.id}> \`отклонил запрос от ${field_nickname}, с ID:\` ||**\` [${field_user.id}] \`**||\n\`[DEBUG]\` \`Запрос был рассмотрен и отказан за ${time(date_debug)}\``);
                field_channel.send(`<@${field_user.id}>**,** \`модератор\` <@${member.id}> \`отклонил ваш запрос на выдачу роли.\nВаш ник при отправке: ${field_nickname}\nУстановите ник на: [Фракция] Имя_Фамилия [Ранг]\``)
                let date = require('./objects/functions').getDateMySQL();
                connection.query(`SELECT * FROM \`blacklist_names\` WHERE \`name\` = '${field_nickname.toLowerCase()}' AND \`server\` = '${server.id}'`, async (err, names) => {
                    if (names.length == 0) await connection.query(`INSERT INTO \`blacklist_names\` (\`server\`, \`name\`, \`blacklisted\`, \`moderator\`, \`time_add\`, \`user\`) VALUES ('${server.id}', '${field_nickname.toLowerCase()}', '1', '${member.id}', '${date}', '${field_user.id}')`);
                    if (names.length == 1){
                        connection.query(`UPDATE \`blacklist_names\` SET \`blacklisted\` = '1', \`moderator\` = '${member.id}', \`time_add\` = '${date}' WHERE \`server\` = '${server.id}' AND \`name\` = '${field_nickname.toLowerCase()}'`);
                    }
                });
                connection.query(`SELECT * FROM \`requests-for-roles\` WHERE \`server\` = '${server.id}' AND \`user\` = '${field_user.id}'`, async (err, users) => {
                    if (users.length == 0) await connection.query(`INSERT INTO \`requests-for-roles\` (\`server\`, \`user\`, \`blacklisted\`) VALUES ('${server.id}', '${field_user.id}', '${date}')`);
                    if (users.length == 1){
                        connection.query(`UPDATE \`requests-for-roles\` SET \`blacklisted\` = '${date}' WHERE \`server\` = '${server.id}' AND \`user\` = '${field_user.id}'`);
                    }
                });
                if (sened.has(field_nickname)) sened.delete(field_nickname); // Отметить ник, что он не отправлял запрос
                return message.delete();
            }else if (message.embeds[0].title == '`Discord » Запрос о снятии роли.`'){
                if (message.reactions.size != 3){
                    return channel.send(`\`[ERROR]\` \`Не торопись! Сообщение еще загружается!\``)
                }
                let date_debug = new Date().valueOf() - message.createdTimestamp;
                let field_author = server.members.find(m => "<@" + m.id + ">" == message.embeds[0].fields[0].value.split(/ +/)[1]);
                let field_user = server.members.find(m => "<@" + m.id + ">" == message.embeds[0].fields[1].value.split(/ +/)[1]);
                let field_role = server.roles.find(r => "<@&" + r.id + ">" == message.embeds[0].fields[2].value.split(/ +/)[3]);
                let field_channel = server.channels.find(c => "<#" + c.id + ">" == message.embeds[0].fields[3].value.split(/ +/)[0]);
                if (member.id == field_author.id) return channel.send(`\`[ERROR]\` \`${member.displayName} свои запросы отклонять нельзя!\``).then(msg => msg.delete(5000))
                if (!field_user.roles.some(r => r.id == field_role.id)){
                    if (snyatie.has(field_author.id + `=>` + field_user.id)) snyatie.delete(field_author.id + `=>` + field_user.id)
                    return message.delete();
                }
                channel.send(`\`[DENY]\` <@${member.id}> \`отклонил запрос на снятие роли от\` <@${field_author.id}>\`, с ID:\` ||**\` [${field_author.id}] \`**||\n\`[DEBUG]\` \`Запрос был рассмотрен и отказан за ${time(date_debug)}\``);
                field_channel.send(`<@${field_author.id}>**,** \`модератор\` <@${member.id}> \`отклонил ваш запрос на снятие роли пользователю:\` <@${field_user.id}>`)
                if (snyatie.has(field_author.id + `=>` + field_user.id)) snyatie.delete(field_author.id + `=>` + field_user.id)
                return message.delete();
            }
        }else if (event_emoji_name == "✔"){
            if (message.embeds[0].title == '`Discord » Проверка на валидность ник нейма.`'){
                if (message.reactions.size != 3){
                    return channel.send(`\`[ERROR]\` \`Не торопись! Сообщение еще загружается!\``)
                }
                let date_debug = new Date().valueOf() - message.createdTimestamp;
                let field_user = server.members.find(m => "<@" + m.id + ">" == message.embeds[0].fields[0].value.split(/ +/)[1]);
                let field_nickname = message.embeds[0].fields[1].value.split(`\`Ник:\` `)[1];
                let field_role = server.roles.find(r => "<@&" + r.id + ">" == message.embeds[0].fields[2].value.split(/ +/)[3]);
                let field_channel = server.channels.find(c => "<#" + c.id + ">" == message.embeds[0].fields[3].value.split(/ +/)[0]);
                if (field_user.roles.some(r => field_role.id == r.id)){
                    if (sened.has(field_nickname)) sened.delete(field_nickname); // Отметить ник, что он не отправлял запрос
                    return message.delete(); // Если роль есть, то выход
                }
                let rolesremoved = false;
                let rolesremovedcount = 0;
                if (field_user.roles.some(r=>rolesgg.includes(r.name))) {
                    for (var i in rolesgg){
                        let rolerem = server.roles.find(r => r.name == rolesgg[i]);
                        if (field_user.roles.some(role=>[rolesgg[i]].includes(role.name))){
                            rolesremoved = true;
                            rolesremovedcount = rolesremovedcount+1;
                            await field_user.removeRole(rolerem); // Забрать фракционные роли
                        }
                    }
                }
                await field_user.addRole(field_role); // Выдать роль по соответствию с тэгом
                let effects = [];
                if (field_user.roles.some(r => r.name == '🏆 Legendary 🏆')) effects.push('Legendary');
                connection.query(`SELECT * FROM \`requests-for-roles\` WHERE \`server\` = '${server.id}' AND \`user\` = '${field_user.id}'`, async (err, users) => {
                    if (users.length == 1){
                        if (new Date(`${users[0].blacklisted}`).valueOf() != '-30610224000000') effects.push('BlackListed');
                        if (new Date(`${users[0].remove_role}`).valueOf() != '-30610224000000') effects.push('Lifting the Role');
                    }
                    channel.send(`\`[ACCEPT]\` <@${member.id}> \`одобрил запрос от ${field_nickname}, с ID:\` ||**\` [${field_user.id}] \`**||\n\`[DEBUG]\` \`Запрос был рассмотрен и одобрен за ${time(date_debug)}. [${effects.join(', ') || 'None'}]\``);
                });
                if (rolesremoved){
                    if (rolesremovedcount == 1){
                        field_channel.send(`<@${field_user.id}>**,** \`модератор\` <@${member.id}> \`одобрил ваш запрос на выдачу роли.\`\n\`Роль\`  <@&${field_role.id}>  \`была выдана! ${rolesremovedcount} роль другой фракции была убрана.\``)
                    }else if (rolesremovedcount < 5){
                        field_channel.send(`<@${field_user.id}>**,** \`модератор\` <@${member.id}> \`одобрил ваш запрос на выдачу роли.\`\n\`Роль\`  <@&${field_role.id}>  \`была выдана! Остальные ${rolesremovedcount} роли других фракций были убраны.\``)
                    }else{
                        field_channel.send(`<@${field_user.id}>**,** \`модератор\` <@${member.id}> \`одобрил ваш запрос на выдачу роли.\`\n\`Роль\`  <@&${field_role.id}>  \`была выдана! Остальные ${rolesremovedcount} ролей других фракций были убраны.\``)
                    }
                }else{
                    field_channel.send(`<@${field_user.id}>**,** \`модератор\` <@${member.id}> \`одобрил ваш запрос на выдачу роли.\`\n\`Роль\`  <@&${field_role.id}>  \`была выдана!\``)
                }
                if (sened.has(field_nickname)) sened.delete(field_nickname); // Отметить ник, что он не отправлял запрос
                return message.delete();
            }else if (message.embeds[0].title == '`Discord » Запрос о снятии роли.`'){
                if (message.reactions.size != 3){
                    return channel.send(`\`[ERROR]\` \`Не торопись! Сообщение еще загружается!\``)
                }
                let date_debug = new Date().valueOf() - message.createdTimestamp;
                let field_author = server.members.find(m => "<@" + m.id + ">" == message.embeds[0].fields[0].value.split(/ +/)[1]);
                let field_user = server.members.find(m => "<@" + m.id + ">" == message.embeds[0].fields[1].value.split(/ +/)[1]);
                let field_role = server.roles.find(r => "<@&" + r.id + ">" == message.embeds[0].fields[2].value.split(/ +/)[3]);
                let field_channel = server.channels.find(c => "<#" + c.id + ">" == message.embeds[0].fields[3].value.split(/ +/)[0]);
                if (member.id == field_author.id) return channel.send(`\`[ERROR]\` \`${member.displayName} свои запросы принимать нельзя!\``).then(msg => msg.delete(5000))
                if (!field_user.roles.some(r => r.id == field_role.id)){
                    if (snyatie.has(field_author.id + `=>` + field_user.id)) snyatie.delete(field_author.id + `=>` + field_user.id)
                    return message.delete();
                }
                field_user.removeRole(field_role);
                channel.send(`\`[ACCEPT]\` <@${member.id}> \`одобрил снятие роли (${field_role.name}) от\` <@${field_author.id}>, \`пользователю\` <@${field_user.id}>, \`с ID:\` ||**\` [${field_user.id}] \`**||\n\`[DEBUG]\` \`Запрос был рассмотрен и одобрен за ${time(date_debug)}\``);
                field_channel.send(`**<@${field_user.id}>, с вас сняли роль**  <@&${field_role.id}>  **по запросу от <@${field_author.id}>.**`)
                if (snyatie.has(field_author.id + `=>` + field_user.id)) snyatie.delete(field_author.id + `=>` + field_user.id)
                let date = require('./objects/functions').getDateMySQL();
                connection.query(`SELECT * FROM \`requests-for-roles\` WHERE \`server\` = '${server.id}' AND \`user\` = '${field_user.id}'`, async (err, users) => {
                    if (users.length == 0) await connection.query(`INSERT INTO \`requests-for-roles\` (\`server\`, \`user\`, \`remove_role\`, \`staff\`) VALUES ('${server.id}', '${field_user.id}', '${date}', '${field_author.id}')`);
                    if (users.length == 1){
                        connection.query(`UPDATE \`requests-for-roles\` SET \`remove_role\` = '${date}', \`staff\` = '${field_author.id}' WHERE \`server\` = '${server.id}' AND \`user\` = '${field_user.id}'`);
                    }
                });
                return message.delete()
            }
        }
    }
});

bot.on('guildBanAdd', async (guild, user) => {
    if (guild.id != serverid) return
    setTimeout(async () => {
        const entry = await guild.fetchAuditLogs({type: 'MEMBER_BAN_ADD'}).then(audit => audit.entries.first());
        let member = await guild.members.get(entry.executor.id);
        if (member.user.bot && lasttestid != 'net'){
            member = await guild.members.get(lasttestid);
            lasttestid = 'net';
        }
        let reason = await entry.reason;
        if (!reason) reason = 'Причина не указана';
        const embed_ban = new Discord.RichEmbed()
        .setThumbnail(user.avatarURL)
        .setColor("#FF0000")
        .addField(`**Информация о блокировке**`, `**Заблокирован: ${user}**\n**Заблокировал: ${member}**\n**Причина: \`${reason}\`**`)
        // .addField(`**Причина блокировки**`, `**\`${reason}\`**`)
        .setFooter(`Команда по безопасности Discord сервера.`, guild.iconURL)
        guild.channels.find(c => c.name == "general").send(embed_ban).catch(() => {
            guild.channels.find(c => c.name == "general").send(`**${user} был заблокирован.**`)
        })
    }, 2000);
});

bot.on('voiceStateUpdate', async (oldMember, newMember) => {
    if (oldMember.voiceChannelID == newMember.voiceChannelID) return
    if (newMember.hasPermission("ADMINISTRATOR")) return
    let member_oldchannel = newMember.guild.channels.get(oldMember.voiceChannelID);
    let member_newchannel = newMember.guild.channels.get(newMember.voiceChannelID);
    if (member_newchannel){
        if (member_newchannel.name == 'Конференция'){
            let edit_channel = newMember.guild.channels.find(c => c.name == "конференция");
            if (!edit_channel) return console.log('[ERROR] Не возможно найти текстовой канал конференции.');
            await edit_channel.overwritePermissions(newMember, {
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
            }, 'подключение (конференция)');
            edit_channel.send(`**<@${newMember.id}> \`успешно подключился.\`**`).then(msg => msg.delete(30000));
        }else if (member_newchannel.name == '→ Обзвон ←'){
            let edit_channel = newMember.guild.channels.find(c => c.name == "closed-accept");
            if (!edit_channel) return console.log('[ERROR] Не возможно найти текстовой канал конференции.');
            await edit_channel.overwritePermissions(newMember, {
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
                READ_MESSAGE_HISTORY: false,
                MENTION_EVERYONE: false,
                USE_EXTERNAL_EMOJIS: false,
                ADD_REACTIONS: false,
            }, 'подключение (конференция)');
            edit_channel.send(`**<@${newMember.id}> \`успешно подключился.\`**`).then(msg => msg.delete(30000));
        }else if (member_newchannel.name == 'Проводится обзвон [SP]'){
            let edit_channel = newMember.guild.channels.find(c => c.name == "проверка");
            if (!edit_channel) return console.log('[ERROR] Не возможно найти текстовой канал конференции.');
            await edit_channel.overwritePermissions(newMember, {
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
                READ_MESSAGE_HISTORY: false,
                MENTION_EVERYONE: false,
                USE_EXTERNAL_EMOJIS: false,
                ADD_REACTIONS: false,
            }, 'подключение (конференция)');
            edit_channel.send(`**<@${newMember.id}> \`успешно подключился.\`**`).then(msg => msg.delete(30000));
        }else if (member_newchannel.name == '→ Обзвон Бывшие ←'){
            let edit_channel = newMember.guild.channels.find(c => c.name == "closed-accept-two");
            if (!edit_channel) return console.log('[ERROR] Не возможно найти текстовой канал конференции.');
            await edit_channel.overwritePermissions(newMember, {
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
                READ_MESSAGE_HISTORY: false,
                MENTION_EVERYONE: false,
                USE_EXTERNAL_EMOJIS: false,
                ADD_REACTIONS: false,
            }, 'подключение (конференция)');
            edit_channel.send(`**<@${newMember.id}> \`успешно подключился.\`**`).then(msg => msg.delete(30000));
        }
    }
    if (member_oldchannel){
        if (member_oldchannel.name == 'Конференция'){
        let edit_channel = newMember.guild.channels.find(c => c.name == "конференция");
            if (!edit_channel) return console.log('[ERROR] Не возможно найти текстовой канал конференции.');
            edit_channel.permissionOverwrites.forEach(async (perm) => {
                if (perm.type != 'member') return
                if (perm.id != newMember.id) return
                await perm.delete('отключение (конференция)');
            });
            edit_channel.send(`**<@${newMember.id}> \`отключился.\`**`).then(msg => msg.delete(15000));
        }else if (member_oldchannel.name == '→ Обзвон ←'){
            let edit_channel = newMember.guild.channels.find(c => c.name == "closed-accept");
            if (!edit_channel) return console.log('[ERROR] Не возможно найти текстовой канал конференции.');
            edit_channel.permissionOverwrites.forEach(async (perm) => {
                if (perm.type != 'member') return
                if (perm.id != newMember.id) return
                await perm.delete('отключение (конференция)');
            });
            edit_channel.send(`**<@${newMember.id}> \`отключился.\`**`).then(msg => msg.delete(15000));
            let role_one = newMember.guild.roles.find(r => r.name == 'Кандидаты(бывшие)');
            let role_two = newMember.guild.roles.find(r => r.name == 'Кандидаты(хелперы)');
            let role_three = newMember.guild.roles.find(r => r.name == 'Обзвон');
            if (newMember.roles.some(r => r.id == role_one.id)) newMember.removeRole(role_one);
            if (newMember.roles.some(r => r.id == role_two.id)) newMember.removeRole(role_two);
            if (newMember.roles.some(r => r.id == role_three.id)) newMember.removeRole(role_three);
        }else if (member_oldchannel.name == 'Проводится обзвон [SP]'){
            let edit_channel = newMember.guild.channels.find(c => c.name == "проверка");
            if (!edit_channel) return console.log('[ERROR] Не возможно найти текстовой канал конференции.');
            edit_channel.permissionOverwrites.forEach(async (perm) => {
                if (perm.type != 'member') return
                if (perm.id != newMember.id) return
                await perm.delete('отключение (конференция)');
            });
            edit_channel.send(`**<@${newMember.id}> \`отключился.\`**`).then(msg => msg.delete(15000));
        }else if (member_oldchannel.name == '→ Обзвон Бывшие ←'){
            let edit_channel = newMember.guild.channels.find(c => c.name == "closed-accept-two");
            if (!edit_channel) return console.log('[ERROR] Не возможно найти текстовой канал конференции.');
            edit_channel.permissionOverwrites.forEach(async (perm) => {
                if (perm.type != 'member') return
                if (perm.id != newMember.id) return
                await perm.delete('отключение (конференция)');
            });
            edit_channel.send(`**<@${newMember.id}> \`отключился.\`**`).then(msg => msg.delete(15000));
            let role_one = newMember.guild.roles.find(r => r.name == 'Кандидаты(бывшие)');
            let role_two = newMember.guild.roles.find(r => r.name == 'Кандидаты(хелперы)');
            let role_three = newMember.guild.roles.find(r => r.name == 'Обзвон');
            if (newMember.roles.some(r => r.id == role_one.id)) newMember.removeRole(role_one);
            if (newMember.roles.some(r => r.id == role_two.id)) newMember.removeRole(role_two);
            if (newMember.roles.some(r => r.id == role_three.id)) newMember.removeRole(role_three);
        }
    }
});

bot.on('guildMemberAdd', async member => {
    if (member.guild.id != serverid) return
    levelhigh++;
    if (levelhigh >= 5){
        if (!member.hasPermission("MANAGE_ROLES")){
            member.ban(`SYSTEM: DDOS ATTACK`);
            console.log(`${member.id} - заблокирован за ДДОС.`)
        }
        setTimeout(() => {
            if (levelhigh > 0){
                levelhigh--;
            }
        }, 60000*levelhigh);
    }else{
        setTimeout(() => {
            if (levelhigh > 0){
                levelhigh--;
            }
        }, 60000*levelhigh);
    }
})

// Syoer System
async function check_unwanted_user(){
    setInterval(async () => {
        let re = /(\d+(\.\d)*)/i;
        let gserver = bot.guilds.get('355656045600964609');
        let spchat = gserver.channels.find(c => c.name == 'spectator-chat');
        await spchat.fetchPinnedMessages().then(messages => {
            messages.forEach(async message => {
                if (!message.content.includes('Нежелательный пользователь')) return
                if (!message.member.user.bot) return
                let user = gserver.members.get(message.content.split('<')[1].split('>')[0].split('@!')[1]);
                if (!user) return
                gserver.members.forEach(async (member) => {
                    if (member.id == user.id){
                        await member.addRole(message.guild.roles.find(r => r.name == '🏆 Legendary 🏆'));
                        await message.unpin();
                        await spchat.send(`**${member} \`был установлен как нежелательный пользователь.\`**`);
                    }
                });
            });
        });
        // UNWARN SYSTEM
        let dataserver = bot.guilds.find(g => g.id == "493459379878625320");
        dataserver.channels.forEach(async channel => {
            if (channel.type=="text"){
                if (!['administration', 'accounts', 'bad-words', 'err-code', 'config', 'bot-updates'].includes(channel.name)){
                    await channel.fetchMessages({limit: 1}).then(async messages => {
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
                                    let myDate = new Date().valueOf();
                                    if (+str.split('\n')[+circle + +moderation_warns + 3].split('==>')[1] > myDate){
                                        user_reason.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[0]);
                                        user_time.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[1]);
                                        user_give.push(str.split('\n')[+circle + +moderation_warns + 3].split('==>')[2]);
                                    }else{
                                        rem++
                                        let genchannel = gserver.channels.find(c => c.name == "general");
                                        genchannel.send(`<@${channel.name}>, \`вам было снято одно предупреждение. [Прошло 7 дней]\``);
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
                                    channel.delete();
                                }else{
                                    sacc.edit(text_end);
                                }
                            });
                        }
                    });
                }
            }
        });
    }, 25000);
}

bot.on('guildMemberUpdate', async (old_member, new_member) => {
    if (new_member.guild.id != '355656045600964609') return
    if (old_member.roles.size == new_member.roles.size) return
    if (new_member.user.bot) return
    if (old_member.roles.size < new_member.roles.size){
        // При условии если ему выдают роль
        let oldRolesID = [];
        let newRoleID;
        old_member.roles.forEach(role => oldRolesID.push(role.id));
        new_member.roles.forEach(role => {
            if (!oldRolesID.some(elemet => elemet == role.id)) newRoleID = role.id;
        });
        let role = new_member.guild.roles.get(newRoleID);
        if (role.name != '🏆 Legendary 🏆') return
        const entry = await new_member.guild.fetchAuditLogs({type: 'MEMBER_ROLE_UPDATE'}).then(audit => audit.entries.first());
        let member = await new_member.guild.members.get(entry.executor.id);
        if (!member.user.bot && !member.hasPermission("ADMINISTRATOR")){
            if (new_member.hasPermission("MANAGE_ROLES") || new_member.roles.some(r => ['✵Хранитель✵', '⋆ YouTube ⋆', '⋆ Stream Team 🎥 ⋆'].includes(r.name))){
                await new_member.guild.channels.find(c => c.name == 'spectator-chat').send(`**${member}, \`над данным пользователем такое действие совершать нельзя!\`**`);
            	return await new_member.removeRole(role);
	    }
        }
        await new_member.roles.forEach(trole => {
            if (!trole.hasPermission("ADMINISTRATOR") && trole.name != '🏆 Legendary 🏆'){
                if (trole.hasPermission('MANAGE_ROLES')){
                    new_member.removeRole(trole);
                }
            }
        });
        if (!member.user.bot){
            await new_member.guild.channels.find(c => c.name == 'spectator-chat').send(`${member} **\`отметил пользователя\` ${new_member} \`как нежелательного.\`**`).catch(() => {
                new_member.guild.channels.find(c => c.name == 'spectator-chat').send(`${member} **\`отметил пользователя\` ${new_member} \`как нежелательного.\`**`);
            });
        }
    }else{
        // При условии если ему снимают роль
        let newRolesID = [];
        let oldRoleID;
        new_member.roles.forEach(role => newRolesID.push(role.id));
        old_member.roles.forEach(role => {
            if (!newRolesID.some(elemet => elemet == role.id)) oldRoleID = role.id;
        })
        let role = new_member.guild.roles.get(oldRoleID);
        if (role.name != '🏆 Legendary 🏆') return
        const entry = await new_member.guild.fetchAuditLogs({type: 'MEMBER_ROLE_UPDATE'}).then(audit => audit.entries.first())
        let member = await new_member.guild.members.get(entry.executor.id);
        if (member.user.bot) return
        if (member.hasPermission("ADMINISTRATOR") || member.roles.some(r => r.name == 'Support Team')){
            await new_member.guild.channels.find(c => c.name == 'spectator-chat').send(`${member} **\`снял пользователю\` ${new_member} \`отметку нежелательного.\`**`).catch(() => {
                new_member.guild.channels.find(c => c.name == 'spectator-chat').send(`${member} **\`снял пользователю\` ${new_member} \`отметку нежелательного.\`**`);
            });
        }else{
            await new_member.guild.channels.find(c => c.name == 'spectator-chat').send(`**${member}, \`вам запрещено снимать данную отметку!\`**`);
            await new_member.addRole(role);
        }
    }
});

bot.on('guildMemberRemove', async (member) => {
    if (member.guild.id != '355656045600964609') return
    if (member.roles.some(r => r.name == '🏆 Legendary 🏆')){
        await member.guild.channels.find(c => c.name == 'spectator-chat').send(`**\`Нежелательный пользователь\` ${member} \`вышел с сервера.\`**`).then(async (tmsg) => {
            await tmsg.pin();
        });
    }
});

bot.on('guildMemberAdd', async (member) => {
    if (member.guild.id != '355656045600964609') return
    let spyktor_chat = member.guild.channels.find(c => c.name == 'spectator-chat');
    if (!spyktor_chat) return
    spyktor_chat.fetchPinnedMessages().then(messages => {
        messages.forEach(async message => {
            if (!message.content.includes('Нежелательный пользователь')) return
            if (!message.member.user.bot) return
            let user = member.guild.members.get(message.content.split('<')[1].split('>')[0].split('@!')[1]);
            if (!user) return
            if (member.id == user.id){
                setTimeout(async () => {
                    await member.addRole(message.guild.roles.find(r => r.name == '🏆 Legendary 🏆'));
                }, 3000)
                await message.unpin();
                await spyktor_chat.send(`**\`Нежелательный пользователь\` ${member} \`вошел на сервер.\`**`)
            }
        });
    });
});

bot.on('message', async (message) => {if (message.type === "PINS_ADD") if (message.channel.name == "spectator-chat") message.delete();});

bot.on('message', async (message) => {
    if (message.channel.type == 'dm') return
    if (message.guild.id != '355656045600964609' && message.guild.id != '488400983496458260') return
    require('./global_systems/auth').get(message, connection, request);
});


bot.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (newMember.guild.id != "355656045600964609") return // Сервер не 03!
    if (oldMember.roles.size == newMember.roles.size) return // Сменил ник или еще чет!
    if (newMember.user.bot) return // Бот не принимается!
    if(oldMember.roles.size < newMember.roles.size){
        let oldRolesID = [];
        let newRoleID;
        oldMember.roles.forEach(role => oldRolesID.push(role.id));
        newMember.roles.forEach(role => {
            if (!oldRolesID.some(elemet => elemet == role.id)) newRoleID = role.id;
        })
        let role = newMember.guild.roles.get(newRoleID);
        let date = date_now();
        const entry = await newMember.guild.fetchAuditLogs({type: 'MEMBER_ROLE_UPDATE', before: new Date()}).then(audit => audit.entries.first());
        let member = await newMember.guild.members.get(entry.executor.id);
        if(role.name == "✔ Helper ✔") {
            vk.sendMessage(2000000013, `${date} | ${newMember.displayName} | Назначен на 1 лвл адм | <@${newMember.id}>`)
        }
        else if(role.name == "✔Jr.Administrator✔") {
            vk.sendMessage(2000000013, `${date} | ${newMember.displayName} | повышен на 3 лвл адм | <@${newMember.id}>`)
        }
        else if(role.name == "✔ Administrator ✔") {
            vk.sendMessage(2000000013, `${date} | ${newMember.displayName} | повышен на 4 лвл адм | <@${newMember.id}>`)
        }
        else if(role.name == "Следящие за хелперами") {
            vk.sendMessage(2000000013, `${date} | ${newMember.displayName} | Назначен на след.за.хелп | <@${newMember.id}>`)
        }
        else if(role.name == "Тех.поддержка сервера") {
            vk.sendMessage(2000000013, `${date} | ${newMember.displayName} | Назначен на тех.администратора | <@${newMember.id}>`)
        }
        else if(role.name == "✯Управляющие сервером.✯") {
            vk.sendMessage(2000000013, `${date} | ${newMember.displayName} | Повышен в управляющий состав сервера | <@${newMember.id}>`)
        }
        else if(role.name == "✮Ministers✮") {
            vk.sendMessage(2000000013, `${date} | ${newMember.displayName} | Назначен на пост министра | <@${newMember.id}>`)
        }
        else if(role.name == "✵Leader✵") {
            vk.sendMessage(2000000013, `${date} | ${newMember.displayName} | Назначен на пост лидера | <@${newMember.id}>`)
        }
        else if(role.name == "Muted") {
            vk.sendMessage(2000000013, `*id152326572 (*)\n${date} | ${newMember.displayName} | получил роль мута | <@${newMember.id}>\nВыдал - ${member.displayName} (ID - ${member.id})`)
        }
    }
    else{
        let newRolesID = [];
        let oldRoleID;
        newMember.roles.forEach(role => newRolesID.push(role.id));
        oldMember.roles.forEach(role => {
            if (!newRolesID.some(elemet => elemet == role.id)) oldRoleID = role.id;
        })
        let role = newMember.guild.roles.get(oldRoleID);
        const entry = await newMember.guild.fetchAuditLogs({type: 'MEMBER_ROLE_UPDATE', before: new Date()}).then(audit => audit.entries.first());
        let member = await newMember.guild.members.get(entry.executor.id);
        let date = date_now();
        if(role.name == "✔ Helper ✔") {
            vk.sendMessage(2000000013, `${date} | ${newMember.displayName} | Возможно снят с 1 лвла админки [Проверять!] | <@${newMember.id}>`)
        }
        else if(role.name == "✔Jr.Administrator✔") {
            vk.sendMessage(2000000013, `${date} | ${newMember.displayName} | Снят с 3 лвла админики | <@${newMember.id}>`)
        }
        else if(role.name == "✔ Administrator ✔") {
            vk.sendMessage(2000000013, `${date} | ${newMember.displayName} | Снят с 4 лвла админки | <@${newMember.id}>`)
        }
        else if(role.name == "Следящие за хелперами") {
            vk.sendMessage(2000000013, `${date} | ${newMember.displayName} | Снят с должности след.за.хелп | <@${newMember.id}>`)
        }
        else if(role.name == "Тех.поддержка сервера") {
            vk.sendMessage(2000000013, `${date} | ${newMember.displayName} | Снят с должности технического администратора | <@${newMember.id}>`)
        }
        else if(role.name == "✯Управляющие сервером.✯") {
            vk.sendMessage(2000000013, `${date} | ${newMember.displayName} | Исключен из управляющего состава сервера | <@${newMember.id}>`)
        }
        else if(role.name == "✮Ministers✮") {
            vk.sendMessage(2000000013, `${date} | ${newMember.displayName} | Снят с поста министра | <@${newMember.id}>`)
        }
        else if(role.name == "✵Leader✵") {
            vk.sendMessage(2000000013, `${date} | ${newMember.displayName} | Снят с поста лидера | <@${newMember.id}>`)
        }
        else if(role.name == "Muted") {
            vk.sendMessage(2000000013, `*id152326572 (*)\n${date} | ${newMember.displayName} | утратил роль мута | <@${newMember.id}>\nВыдал - ${member.displayName} (ID - ${member.id})`)
        }
    }
});

function support_autoupdate(){
    setInterval(() => {
        let server = bot.guilds.get(serverid);
        if (!server) return
        let channel = server.channels.find(c => c.name == support_settings["support_channel"]);
        if (!channel) return
        connection.query(`SELECT * FROM \`new-support\` WHERE \`server\` = '${server.id}'`, async (error, answer) => {
            if (error) return console.error(error);
            if (answer.length == 0) return
            if (answer.length == 1){
                await channel.fetchMessage(answer[0].message).then(async support_message => {
                    if (!support_message) return console.error(`При выводе support_message вылазит значение false`);
                    await connection.query(`SELECT * FROM \`tickets-new\` WHERE \`server\` = '${server.id}'`, (error, res) => {
                        if (error) return console.error(error);
                        let open = res.filter(r => r.status == 1);
                        let hold = res.filter(r => r.status == 2);
                        let close = res.filter(r => r.status == 0);
                        const image = new Discord.RichEmbed();
                        image.setImage("https://imgur.com/LKDbJeM.gif");
                        support_message.edit(`` +
                        `**Приветствую! Вы попали в канал поддержки сервера ${support_settings["server_name"]}!**\n` +
                        `**Тут Вы сможете задать вопрос модераторам или администраторам сервера!**\n\n` +
                        `**Количество вопросов за все время: ${answer[0].tickets}**\n` +
                        `**Необработанных модераторами: ${open.length}**\n` +
                        `**Вопросы на рассмотрении: ${hold.length}**\n` +
                        `**Закрытых: ${close.length}**`, image);
                    });
                }).catch(() => {
                    console.error(`Не получилось найти сообщение в support. Ошибка.`);
                });
            }else{
                return console.error(`Множество результатов в new-support.`);
            }
        });
    }, 30000);
}

function tickets_check(){
    setInterval(() => {
        let server = bot.guilds.get(serverid);
        if (!server) return console.log(`Сервер не найден [error 661]`);
        let active_tickets = server.channels.find(c => c.name == support_settings["active-tickets"]);
        let close_tickets = server.channels.find(c => c.name == support_settings["close-tickets"]);
        if (!active_tickets || !close_tickets) return console.log(`Канал тикетов не найден [error 662]`);
        connection.query(`SELECT * FROM \`tickets-new\` WHERE \`server\` = '${server.id}'`, async (error, answer) => {
            server.channels.forEach(async (ticket) => {
                if (!ticket.name.startsWith('ticket-')) return
                if (ticket.parentID == active_tickets.id){
                    ticket.fetchMessages({limit: 1}).then(messages => {
                        let message = messages.first();
                        let back_time = new Date().valueOf() - support_settings["time_warning"];
                        if (message.createdAt.valueOf() < back_time){
                            if (message.author.bot && message.content == `\`[NOTIFICATION]\` \`Ваше обращение еще в обработке! На данный момент все модераторы заняты!\``){
                                let db_ticket = answer.find(_ticket => _ticket.ticket == ticket.name.split('ticket-')[1]);
                                if (!db_ticket) return;
                                let category = server.channels.find(c => c.name == support_settings["hold-tickets"]);
                                let author = server.members.get(db_ticket.author);
                                if (!category) return 
                                if (category.children.size >= 45) return
                                connection.query(`UPDATE \`tickets-new\` SET \`status\` = '2' WHERE \`server\` = '${server.id}' AND \`ticket\` = '${ticket.name.split('ticket-')[1]}'`, async (error) => {
                                    if (error) return console.error(error);
                                    await ticket.setParent(category.id).catch((error) => {
                                        if (error) console.error(`[SUPPORT] Произошла ошибка при установки категории каналу.`);
                                        ticket.setParent(category.id);
                                    });
                                    if (author){
                                        ticket.send(`${author}, \`вашей жалобе был установлен статус: 'На рассмотрении'. Источник: Система\``);
                                    }else{
                                        ticket.send(`\`Данной жалобе [${message.channel.name}] был установлен статус: 'На рассмотрении'. Источник: Система\``);
                                    }
                                    let ticket_log = server.channels.find(c => c.name == support_settings["log_channel"]);
                                    if (ticket_log) ticket_log.send(`\`[SYSTEM]\` \`Система за долгое отсутствие ответа установила жалобе\` <#${message.channel.id}> \`[${message.channel.name}] статус 'На рассмотрении'\``);
                                });
                            }else{
                                ticket.send(`\`[NOTIFICATION]\` \`Ваше обращение еще в обработке! На данный момент все модераторы заняты!\``);
                                let db_ticket = answer.find(_ticket => _ticket.ticket == ticket.name.split('ticket-')[1]);
                                if (db_ticket.department == 0){
                                    let channel = server.channels.find(c => c.name == support_settings["notify_moderator_channel"]);
                                    let role = server.roles.find(r => r.name == support_settings["moderator"]);
                                    if (channel && role){
                                        channel.send(`\`[NOTIFICATION]\` \`Жалоба\` <#${ticket.id}> \`[${ticket.name}] активна! Пользователь ждет вашего ответа!\` ${role}`);
                                    }
                                }else if (db_ticket.department == 1){
                                    let channel = server.channels.find(c => c.name == support_settings["notify_admin_channel"]);
                                    let administrators = [];
                                    support_settings["administrators"].forEach(admin => {
                                        let role = server.roles.find(r => r.name == admin);
                                        administrators.push(`<@&${role.id}>`);
                                    });
                                    if (channel && administrators.length > 0){
                                        channel.send(`\`[NOTIFICATION]\` \`Жалоба\` <#${ticket.id}> \`[${ticket.name}] активна! Пользователь ждет вашего ответа!\` ${administrators.join(', ')}`);
                                    }
                                }
                            }
                        }
                    });
                }else if (ticket.parentID == close_tickets.id){
                    let db_ticket = answer.find(_ticket => _ticket.ticket == ticket.name.split('ticket-')[1]);
                    ticket.fetchMessages({limit: 1}).then(async messages => {
                        let message = messages.first();
                        let back_time = new Date().valueOf() - support_settings["time_deleted"];
                        if (message.createdAt.valueOf() < back_time){
                            let archive_messages = [];
                            await ticket.fetchMessages({limit: 100}).then(async messages => {
                                messages.forEach(async _message => {
                                    _message.mentions.users.forEach(mention => {
                                        let m_member = server.members.find(m => m.id == mention.id);
                                        if (m_member) _message.content = _message.content.replace(`<@!${m_member.id}>`, `${m_member.displayName || m_member.user.tag} [${m_member.id}]`).replace(`<@${m_member.id}>`, `${m_member.displayName || m_member.user.tag}`);
                                    });
                                    _message.mentions.members.forEach(mention => {
                                        let m_member = server.members.find(m => m.id == mention.id);
                                        if (m_member) _message.content = _message.content.replace(`<@!${m_member.id}>`, `${m_member.displayName || m_member.user.tag} [${m_member.id}]`).replace(`<@${m_member.id}>`, `${m_member.displayName || m_member.user.tag}`);
                                    });
                                    _message.mentions.roles.forEach(mention => {
                                        let m_role = server.roles.find(r => r.id == mention.id);
                                        if (m_role) _message.content = _message.content.replace(`<@&${m_role.id}>`, `${m_role.name}`);
                                    });
                                    let date = new Date(+_message.createdAt.valueOf() + 10800000);
                                    let formate_date = `[${date.getFullYear()}-` + 
                                    `${(date.getMonth() + 1).toString().padStart(2, '0')}-` +
                                    `${date.getDate().toString().padStart(2, '0')} ` + 
                                    `${date.getHours().toString().padStart(2, '0')}-` + 
                                    `${date.getMinutes().toString().padStart(2, '0')}-` + 
                                    `${date.getSeconds().toString().padStart(2, '0')}]`;
                                    if (!_message.embeds[0]){
                                        archive_messages.push(`${formate_date} ${_message.member.displayName || _message.member.user.tag}: ${_message.content}`);
                                    }else{
                                        archive_messages.push(`${formate_date} [К СООБЩЕНИЮ БЫЛО ДОБАВЛЕНО] ${_message.embeds[0].fields[1].value}`);
                                        archive_messages.push(`${formate_date} [К СООБЩЕНИЮ БЫЛО ДОБАВЛЕНО] ${_message.embeds[0].fields[0].value}`);
                                        archive_messages.push(`${formate_date} ${_message.member.displayName || _message.member.user.tag}: ${_message.content}`);
                                    }
                                });
                            });
                            let i = archive_messages.length - 1;
                            while (i >= 0){
                                await fs.appendFileSync(`./${ticket.name}.txt`, `${archive_messages[i]}\r\n`);
                                i--;
                            }
                            let ticket_log = server.channels.find(c => c.name == support_settings["log_channel"]);
                            let author = server.members.get(db_ticket.author);
                            if (ticket_log) await ticket_log.send(`\`[SYSTEM]\` \`Канал ${ticket.name} был удален. [24 часа в статусе 'Закрыт']\``, { files: [ `./${ticket.name}.txt` ] });
                            if (author) await author.send(`\`[SYSTEM]\` \`Здравствуйте! Ваш вопрос ${ticket.name} был удален. Все сообщения были сохранены в файл.\``, { files: [ `./${ticket.name}.txt` ] }).catch(err => { console.error('Не могу отправить сообщение пользователю тикет: ' + ticket.name) });
                            await ticket.delete();
                            fs.unlinkSync(`./${ticket.name}.txt`);
                        }
                    });
                }
            });
        });
    }, 40000);
}

connection.on('error', function(err) {
    if (err.code == 'PROTOCOL_CONNECTION_LOST'){
        console.log('[MYSQL] Соединение с базой MySQL потеряно. Выполняю переподключение...');
        connection.connect(function(err){
            if (err){
                return console.log('[MYSQL] Ошибка подключения к базе MySQL');
            }
            console.log('[MYSQL] Вы успешно подключились к базе данных.')
            connection.query("SET SESSION wait_timeout = 604800"); // 3 дня
        });
    }else{
        console.log('[MYSQL] Произошла ошибка MySQL, информация об ошибке: ' + err);
    }
});

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

function now_date(){
    let date = new Date(+new Date().valueOf() + 10800000);
    return `${date.getDate().toString().padStart(2, '0')}.` +
        `${(date.getMonth() + 1).toString().padStart(2, '0')}.` +
        `${date.getFullYear()} ` +
        `${date.getHours().toString().padStart(2, '0')}:` +
        `${date.getMinutes().toString().padStart(2, '0')}:` +
        `${date.getSeconds().toString().padStart(2, '0')}`;
}
function date_now(){
    let date = new Date(+new Date().valueOf() + 10800000);
    return `${date.getDate().toString().padStart(2, '0')}.` +
        `${(date.getMonth() + 1).toString().padStart(2, '0')}.` +
        `${date.getFullYear()} `;
}

async function remove_verify(){
    setInterval(() => {
        let server = bot.guilds.get(serverid);
        if (server){
            let role = server.roles.find(r => r.name == 'Проверенный 🔐');
            if (role){
                connection.query(`SELECT * FROM \`arizona_logs\` WHERE \`serverid\` = '355656045600964609'`, async (err, profiles) => {
                    // let date = require('./objects/functions').getDateMySQL();
                    server.roles.find(r => r.name == 'Проверенный 🔐').members.forEach(member => {
                        if (!profiles.some(p => p.userid == member.id)){
                            let moderator = server.channels.find(c => c.name == 'spectator-chat');
                            if (moderator) moderator.send(`\`[СИНХРОНИЗАЦИЯ]\` ${member} \`был лишен роли ${role.name}. Причина: Не авторизован через /authme.\``);
                            member.removeRole(role);
                        }
                    });
                });
            }
        }
    }, 85000);
}

async function check_gifts(){
    setInterval(() => {
        let server = bot.guilds.get(serverid);
        if (server){
            let general = server.channels.find(c => c.name == 'general');
            let titan = server.roles.find(r => r.name == '⚡ TITAN ⚡');
            let warrior = server.roles.find(r => r.name == '✮ Night Warrior ✮');
            let spectator = server.roles.find(r => r.name == 'Spectator™');
            if (titan && warrior){
                connection.query(`SELECT * FROM \`presents\` WHERE \`server\` = '355656045600964609'`, async (err, gifts) => {
                    if (gifts.length != 0){
                        gifts.forEach(async gift => {
                            let user = server.members.get(gift.user);
                            if (user){
                                let date = (new Date().valueOf() + 10800000) - new Date(`${gift.date}`).valueOf();
                                if (+gift.type == 0){
                                    if (date >= 86400000){
                                        if (user.roles.some(r => r.id != titan.id)){
                                            let data = new Date(+new Date().valueOf() + 10800000);
                                            if (data.getHours() != 0 && data.getHours() != 1 && data.getHours() != 2 && data.getHours() != 3){
                                                user.addRole(titan);
                                                await connection.query(`DELETE FROM \`presents\` WHERE \`server\` = '${gift.server}' AND \`user\` = '${gift.user}' AND \`type\` = '${gift.type}'`);
                                                user.send(`${user}, \`вам была выдана роль ${titan.name} за вручение подарков!\``);
                                            }
                                        }
                                    }
                                }else if (+gift.type == 1){
                                    if (date >= 172800000){
                                        if (user.roles.some(r => r.id != warrior.id)){
                                            let data = new Date(+new Date().valueOf() + 10800000);
                                            if (data.getHours() == 0 && data.getHours() == 1 && data.getHours() == 2 && data.getHours() == 3){
                                                user.addRole(warrior);
                                                await connection.query(`DELETE FROM \`presents\` WHERE \`server\` = '${gift.server}' AND \`user\` = '${gift.user}' AND \`type\` = '${gift.type}'`);
                                                user.send(`${user}, \`вам была выдана роль ${warrior.name} за вручение подарков!\``);
                                            }
                                        }
                                    } 
                                }
                            }
                        });
                    }
                });
                let data = new Date(+new Date().valueOf() + 10800000);
                let night_warrior = server.channels.find(c => c.name == 'night-warrior');
                let titan_chat = server.channels.find(c => c.name == 'titan');
                night_warrior.permissionOverwrites.forEach(perm => {
                    if (perm.id == warrior.id){
                        let permissions = new Discord.Permissions(perm.allow);
                        if (data.getHours() != 0 && data.getHours() != 1 && data.getHours() != 2 && data.getHours() != 3){
                            if (permissions.has("SEND_MESSAGES") || permissions.has("ADD_REACTIONS") || permissions.has("USE_EXTERNAL_EMOJIS") || permissions.has("READ_MESSAGE_HISTORY")){
                                night_warrior.overwritePermissions(warrior, {
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
                                    EMBED_LINKS: true,
                                    ATTACH_FILES: true,
                                    READ_MESSAGE_HISTORY: false,
                                    MENTION_EVERYONE: false,
                                    USE_EXTERNAL_EMOJIS: false,
                                    ADD_REACTIONS: false,
                                });
                                night_warrior.send(`<@&${warrior.id}>, \`ночной чат открыт только ночью! Сейчас он закрывается!\``);
                            }
                        }else{
                            if (!permissions.has("SEND_MESSAGES") || !permissions.has("ADD_REACTIONS") || !permissions.has("USE_EXTERNAL_EMOJIS") || !permissions.has("READ_MESSAGE_HISTORY")){
                                night_warrior.overwritePermissions(warrior, {
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
                                });
                                night_warrior.send(`<@&${warrior.id}>, \`ночной чат открыт!\``);
                            }
                        }
                    }else if (perm.id == spectator.id){
                        let permissions = new Discord.Permissions(perm.allow);
                        if (data.getHours() != 0 && data.getHours() != 1 && data.getHours() != 2 && data.getHours() != 3){
                            if (permissions.has("SEND_MESSAGES") || permissions.has("ADD_REACTIONS") || permissions.has("USE_EXTERNAL_EMOJIS")){
                                night_warrior.overwritePermissions(spectator, {
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
                                    EMBED_LINKS: true,
                                    ATTACH_FILES: true,
                                    READ_MESSAGE_HISTORY: true,
                                    MENTION_EVERYONE: false,
                                    USE_EXTERNAL_EMOJIS: false,
                                    ADD_REACTIONS: false,
                                });
                            }
                        }else{
                            if (!permissions.has("SEND_MESSAGES") || !permissions.has("ADD_REACTIONS") || !permissions.has("USE_EXTERNAL_EMOJIS")){
                                night_warrior.overwritePermissions(spectator, {
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
                                });
                            }
                        }
                    }
                });

                titan_chat.permissionOverwrites.forEach(perm => {
                    if (perm.id == titan.id){
                        let permissions = new Discord.Permissions(perm.allow);
                        if (data.getHours() == 0 && data.getHours() == 1 && data.getHours() == 2 && data.getHours() == 3){
                            if (permissions.has("SEND_MESSAGES") || permissions.has("ADD_REACTIONS") || permissions.has("USE_EXTERNAL_EMOJIS") || permissions.has("READ_MESSAGE_HISTORY")){
                                titan_chat.overwritePermissions(titan, {
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
                                    EMBED_LINKS: true,
                                    ATTACH_FILES: true,
                                    READ_MESSAGE_HISTORY: false,
                                    MENTION_EVERYONE: false,
                                    USE_EXTERNAL_EMOJIS: false,
                                    ADD_REACTIONS: false,
                                });
                                titan_chat.send(`<@&${titan.id}>, \`чат открыт только утром, днем и вечером! Сейчас он закрывается!\``);
                            }
                        }else{
                            if (!permissions.has("SEND_MESSAGES") || !permissions.has("ADD_REACTIONS") || !permissions.has("USE_EXTERNAL_EMOJIS") || !permissions.has("READ_MESSAGE_HISTORY")){
                                titan_chat.overwritePermissions(titan, {
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
                                });
                                titan_chat.send(`<@&${titan.id}>, \`чат открыт!\``);
                            }
                        }
                    }else if (perm.id == spectator.id){
                        let permissions = new Discord.Permissions(perm.allow);
                        if (data.getHours() == 0 && data.getHours() == 1 && data.getHours() == 2 && data.getHours() == 3){
                            if (permissions.has("SEND_MESSAGES") || permissions.has("ADD_REACTIONS") || permissions.has("USE_EXTERNAL_EMOJIS")){
                                titan_chat.overwritePermissions(spectator, {
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
                                    EMBED_LINKS: true,
                                    ATTACH_FILES: true,
                                    READ_MESSAGE_HISTORY: true,
                                    MENTION_EVERYONE: false,
                                    USE_EXTERNAL_EMOJIS: false,
                                    ADD_REACTIONS: false,
                                });
                            }
                        }else{
                            if (!permissions.has("SEND_MESSAGES") || !permissions.has("ADD_REACTIONS") || !permissions.has("USE_EXTERNAL_EMOJIS")){
                                titan_chat.overwritePermissions(spectator, {
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
                                });
                            }
                        }
                    }
                });
            }
        }
    }, 60000);
}

async function special_discord_update(){
    setInterval(async () => {
        let special_server = robo_hamster.guilds.get('543799835652915241');
        let check_server = user.guilds.get('543354025387491339');
        if (!special_server || !check_server) return console.log('Сервер спец.администрации не найден!');
        let admin_role = special_server.roles.find(r => r.name == 'Администратор');
        let helper_role = special_server.roles.find(r => r.name == 'Хелпер');
        let checker_role = special_server.roles.find(r => r.name == 'Команда проверки');
        if (!admin_role || !helper_role) return console.log('Роли хелпера или админа не найдены на спец админском');
        let all_chat = special_server.channels.find(c => c.name == 'основной');
        if (!all_chat) return console.log('Чат "основной" не был найден!');
        let phoenix = user.guilds.get('544446632226324481');
        let tucson = user.guilds.get('599706379296440320');
        let scottdale = user.guilds.get('355656045600964609');
        let chandler = user.guilds.get('555334013255155712');
        let brainburg = user.guilds.get('282282840840732672');
        let saintrose = user.guilds.get('347728316557426688');
        let mesa = user.guilds.get('399241867914379265');
        let redrock = user.guilds.get('470981734863994881');
        let yuma = user.guilds.get('528635749206196232');

        let central = user.guilds.get('325607843547840522');
        let eastern = user.guilds.get('465086262383083520');
        let north = user.guilds.get('477547500232769536');
        let vostok = user.guilds.get('577511138032484360');

        let bone_country = user.guilds.get('527799726557364237');
        if (!phoenix || !tucson || !scottdale || !chandler || !brainburg || !saintrose || !mesa || !redrock || !yuma || !central || !eastern || !north || !vostok || !bone_country) console.log('Один из серверов не найден!');

        special_server.members.forEach(async (member) => {
            
            let server_were_admin = [];
            let server_were_helper = [];
            let user_checker = false;

            if (check_server.members.get(member.id)){
                let g_member = check_server.members.get(member.id);
                if (g_member.roles.some(r => ['Checkers Team'].includes(r.name))){
                    user_checker = true;
                }
            }

            if (phoenix.members.get(member.id)){
                let g_member = phoenix.members.get(member.id);
                if (g_member.roles.some(r => ['Администрация 4 уровня', 'Администрация 3 уровня'].includes(r.name))){
                    server_were_admin.push('Phoenix');
                }else if (g_member.roles.some(r => ['Администрация 1-2 уровня'].includes(r.name))){
                    server_were_helper.push('Phoenix');
                }
            }
            
            if (tucson.members.get(member.id)){
                let g_member = tucson.members.get(member.id);
                if (g_member.roles.some(r => ['★ Администратор 4 уровня ★', '★ Администратор 3 уровня ★'].includes(r.name))){
                    server_were_admin.push('Tucson');
                }else if (g_member.roles.some(r => ['★ Администратор 2 уровня ★', '★ Администратор 2 уровня ★'].includes(r.name))){
                    server_were_helper.push('Tucson');
                }
            }
            
            if (scottdale.members.get(member.id)){
                let g_member = scottdale.members.get(member.id);
                if (g_member.roles.some(r => ['✔ Administrator ✔', '✔Jr.Administrator✔'].includes(r.name))){
                    server_were_admin.push('Scottdale');
                }else if (g_member.roles.some(r => ['✔ Helper ✔'].includes(r.name))){
                    server_were_helper.push('Scottdale');
                }
            }
            
            if (chandler.members.get(member.id)){
                let g_member = chandler.members.get(member.id);
                if (g_member.roles.some(r => ['Администратор 4 уровня', 'Администратор 3 уровня'].includes(r.name))){
                    server_were_admin.push('Chandler');
                }else if (g_member.roles.some(r => ['Хелпер'].includes(r.name))){
                    server_were_helper.push('Chandler');
                }
            }
            
            if (brainburg.members.get(member.id)){
                let g_member = brainburg.members.get(member.id);
                if (g_member.roles.some(r => ['⚃ Администратор 4 ур. ⚃', '⚂ Администратор 3 ур. ⚂'].includes(r.name))){
                    server_were_admin.push('Brainburg');
                }else if (g_member.roles.some(r => ['⚁ Администратор 2 ур. ⚁', '⚀ Администратор 1 ур. ⚀'].includes(r.name))){
                    server_were_helper.push('Brainburg');
                }
            }
            
            if (saintrose.members.get(member.id)){
                let g_member = saintrose.members.get(member.id);
                if (g_member.roles.some(r => ['◉ Ст. Администратор [4 LVL]', '◉ Мл. Администратор [3 LVL]'].includes(r.name))){
                    server_were_admin.push('Saint Rose');
                }else if (g_member.roles.some(r => ['◉ Хелпер [1-2 LVL]'].includes(r.name))){
                    server_were_helper.push('Saint Rose');
                }
            }
            
            if (mesa.members.get(member.id)){
                let g_member = mesa.members.get(member.id);
                if (g_member.roles.some(r => ['✔Administration✔', '✔Jr.Administration✔'].includes(r.name))){
                    server_were_admin.push('Mesa');
                }else if (g_member.roles.some(r => ['✔Moderator✔'].includes(r.name))){
                    server_were_helper.push('Mesa');
                }
            }
            
            if (redrock.members.get(member.id)){
                let g_member = redrock.members.get(member.id);
                if (g_member.roles.some(r => ['IV ⚡️ Администратор', 'III ⚡️ Старший модератор'].includes(r.name))){
                    server_were_admin.push('Red-Rock');
                }else if (g_member.roles.some(r => ['II ⚡️ Модератор', 'I ⚡️ Младший модератор'].includes(r.name))){
                    server_were_helper.push('Red-Rock');
                }
            }
            
            if (yuma.members.get(member.id)){
                let g_member = yuma.members.get(member.id);
                if (g_member.roles.some(r => ['✔ Administrator ✔', '✔Jr.Administrator✔'].includes(r.name))){
                    server_were_admin.push('Yuma');
                }else if (g_member.roles.some(r => ['✔ Helper ✔'].includes(r.name))){
                    server_were_helper.push('Yuma');
                }
            }


            if (central.members.get(member.id)){
                let g_member = central.members.get(member.id);
                if (g_member.roles.some(r => ['★ Администратор ★', '★ Старший Модератор ★'].includes(r.name))){
                    server_were_admin.push('Центральный Округ');
                }else if (g_member.roles.some(r => ['★ Модератор ★', '★ Хелпер ★'].includes(r.name))){
                    server_were_helper.push('Центральный Округ');
                }
            }

            if (eastern.members.get(member.id)){
                let g_member = eastern.members.get(member.id);
                if (g_member.roles.some(r => ['☆ Администратор ☆', '☆ Старший Модератор ☆'].includes(r.name))){
                    server_were_admin.push('Южный округ');
                }else if (g_member.roles.some(r => ['☆ Модератор ☆', '☆  Младший Модератор  ☆'].includes(r.name))){
                    server_were_helper.push('Южный округ');
                }
            }

            if (north.members.get(member.id)){
                let g_member = north.members.get(member.id);
                if (g_member.roles.some(r => ['✔ Administrator ✔', '✔ Jr.Administrator ✔'].includes(r.name))){
                    server_were_admin.push('Северный округ');
                }else if (g_member.roles.some(r => ['✔ Moderator ✔', '✔ Helper ✔'].includes(r.name))){
                    server_were_helper.push('Северный округ');
                }
            }

            if (vostok.members.get(member.id)){
                let g_member = vostok.members.get(member.id);
                if (g_member.roles.some(r => ['★ Администратор ★', '★ Старший Модератор ★'].includes(r.name))){
                    server_were_admin.push('Восточный округ');
                }else if (g_member.roles.some(r => ['★ Модератор ★', '★ Младший Модератор ★'].includes(r.name))){
                    server_were_helper.push('Восточный округ');
                }
            }

            if (bone_country.members.get(member.id)){
                let g_member = bone_country.members.get(member.id);
                if (g_member.roles.some(r => ['[A] Администрация проекта'].includes(r.name))){
                    server_were_admin.push('Жизнь в деревне');
                }
            }

            if (user_checker == true){
                if (!member.roles.some(r => checker_role.id == r.id)){
                    await member.addRole(checker_role);
                    await all_chat.send(`**${member}, \`вам была выдана роль ${checker_role.name}. Источник: ${check_server.name}\`**`);
                }
            }else{
                if (member.roles.some(r => checker_role.id == r.id)){
                    await member.removeRole(checker_role);
                    await all_chat.send(`**${member}, \`вам была снята роль ${checker_role.name}.\`**`);
                }
            }

            if (server_were_admin.length > 0){
                if (!member.roles.some(r => admin_role.id == r.id)){
                    await member.addRole(admin_role);
                    await all_chat.send(`**${member}, \`вам была выдана роль ${admin_role.name}. Администратор на: ${server_were_admin.join(', ')}\`**`);
                    if (member.roles.some(r => helper_role.id == r.id)){
                        await member.removeRole(helper_role);
                    }
                }
            }else if (server_were_helper.length > 0){
                if (!member.roles.some(r => helper_role.id == r.id)){
                    await member.addRole(helper_role);
                    await all_chat.send(`**${member}, \`вам была выдана роль ${helper_role.name}. Хелпер на: ${server_were_helper.join(', ')}\`**`);
                    if (member.roles.some(r => admin_role.id == r.id)){
                        await member.removeRole(admin_role);
                    }
                }
            }

            if (server_were_admin.length == 0){
                if (member.roles.some(r => admin_role.id == r.id)){
                    await member.removeRole(admin_role);
                    await all_chat.send(`**${member}, \`вам была снята роль ${admin_role.name}. Не является администратором на одном из серверов.\`**`);
                }
            }

            if (server_were_helper.length == 0){
                if (member.roles.some(r => helper_role.id == r.id)){
                    await member.removeRole(helper_role);
                    await all_chat.send(`**${member}, \`вам была снята роль ${helper_role.name}. Не является хелпером на одном из серверов.\`**`);
                }
            }
        });
    }, 40000);
}

async function update_sellers(){
    setInterval(() => {
        let server = bot.guilds.get('355656045600964609');
        if (!server) return
        let channel = server.channels.find(c => c.name == 'buy-dashboard');
        if (!channel) return
        connection.query(`SELECT * FROM \`buy_dashboard\` WHERE \`status\` = '1' AND \`amount\` > 0 AND \`server\` = '355656045600964609'`, async (err, result, fields) => {
            channel.fetchMessages({limit: 1}).then(async messages => {
                let names = [];
                let cost = [];
                let amount = [];
                result.forEach(res => {
                    names.push(res.name);
                    cost.push(res.cost);
                    amount.push(res.amount);
                });
                const table = new Discord.RichEmbed();
                table.setTitle(`**Ассортимент Discord-сервера**`);
                table.setDescription(`**В данном канале вы можете приобрести товары у администрации discord-сервера! В качестве цены указана валюта - Discord Point (₯).\nКоманда для покупки товара: /buy [название товара]**`);
                table.setColor(`#0601ff`);
                if (names.length > 0) table.addField(`Название товара`, `${names.join('\n')}`, true);
                if (amount.length > 0) table.addField(`В наличии`, `${amount.join('\n')}`, true);
                if (cost.length > 0) table.addField(`Цена`, `${cost.join(' ₯\n')} ₯`, true);
                table.setFooter(`© Сopyright 2019`, server.icon_url);
                let msg = messages.first();
                if (!msg){
                    channel.send(table);
                }else{
                    msg.edit(table);
                }
            });
        });
    }, 20000)
}

async function nalog_biz(){
    setInterval(() => {
        connection.query(`SELECT * FROM \`storage\` WHERE \`server\` = '355656045600964609'`, async (error, storages) => {
            storages.forEach(storage => {
                let date = new Date().valueOf();
                if (storage.nalog_new < date){
                    if (storage.money < storage.nalog){
                        if (storage.status == true) {
                            connection.query(`UPDATE \`storage\` SET status = '0' WHERE \`id\` = '${storage.id}'`);
                        }
                    }else{
                        connection.query(`UPDATE \`storage\` SET money = money - ${storage.nalog} WHERE \`id\` = '${storage.id}'`);
                        connection.query(`UPDATE \`storage\` SET nalog_new = '${+date + 3600000}' WHERE \`id\` = '${storage.id}'`);
                    }
                }
            });
        });

        connection.query(`SELECT * FROM \`buy_dashboard\` WHERE \`server\` = '355656045600964609'`, async (error, shops) => {
            shops.forEach(shop => {
                let date = new Date().valueOf();
                if (shop.nalog_new < date){
                    if (shop.money < shop.nalog){
                        if (shop.status == true) {
                            connection.query(`UPDATE \`buy_dashboard\` SET status = '0' WHERE \`id\` = '${shop.id}'`);
                        }
                    }else{
                        connection.query(`UPDATE \`buy_dashboard\` SET money = money - ${shop.nalog} WHERE \`id\` = '${shop.id}'`);
                        connection.query(`UPDATE \`buy_dashboard\` SET nalog_new = '${+date + 3600000}' WHERE \`id\` = '${shop.id}'`);
                    }
                }
            });
        });
    }, 27000);
}

async function update_items(){
    setInterval(() => {
        connection.query(`SELECT * FROM \`items\` WHERE \`server\` = '355656045600964609'`, async (error, items) => {
            if (error) return
	    if (items.lenght <= 0) return; 
            items.forEach(item => {
                let date = new Date().valueOf();
                if (item.date_end < date){
                    connection.query(`SELECT * FROM \`storage\` WHERE \`id\` = '${item.storage}'`, async (error, storage) => {
                        if (error) return console.error(error);
                        if (storage.length < 1 || storage.length > 1){
                            connection.query(`DELETE FROM \`items\` WHERE \`id\` = '${item.id}'`);
                        }else{
                            connection.query(`SELECT * FROM \`buy_dashboard\` WHERE \`id\` = '${item.dashboard}'`, async (error, shop) => {
                                if (error) return console.error(error);
                                if (shop.length < 1 || shop.length > 1){
                                    connection.query(`DELETE FROM \`items\` WHERE \`id\` = '${item.id}'`);
                                }else{
                                    connection.query(`UPDATE \`buy_dashboard\` SET amount = amount + 1 WHERE \`id\` = '${shop[0].id}'`);
                                    connection.query(`DELETE FROM \`items\` WHERE \`id\` = '${item.id}'`);
                                }
                            });
                        }
                    });
                }
            });
        });
    }, 12000);
}
