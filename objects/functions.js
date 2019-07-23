exports.validateBitrate = origBitrate => {
    if (origBitrate > 96000) return 96000;
    else if (origBitrate < 8000) return 8000;
    else return origBitrate;
};

exports.validateUserLimit = userLimit => {
    if (userLimit < 0) return 0;
    else if (userLimit > 99) return 99;
    else return userLimit;
};

exports.getDateString = () => {
    let date = new Date();
    return `${date.getDate().toString().padStart(2, '0')}.` +
        `${(date.getMonth() + 1).toString().padStart(2, '0')}.` +
        `${date.getFullYear()} ` +
        `${date.getHours().toString().padStart(2, '0')}:` +
        `${date.getMinutes().toString().padStart(2, '0')}:` +
        `${date.getSeconds().toString().padStart(2, '0')}`;
};

exports.getDateMySQL = () => {
    let date = new Date();
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ` +
        `${date.getHours().toString().padStart(2, '0')}:` +
        `${date.getMinutes().toString().padStart(2, '0')}:` +
        `${date.getSeconds().toString().padStart(2, '0')}`;
};



exports.loadConfig = (server, config) => {
    console.log(`[MYSQL] Вызвана загрузка файлов конфига..`);
    config.splice(0, config.length);
    server.query(`SELECT * FROM \`config\``, (error, answer) => {
        if (error){
            console.log(`[MYSQL] Произошла ошибка при загрузке конфига.`);
            return console.error(error);
        }
        answer.forEach(line => {
            config.push({
                "server"      : line.server,       // ID сервера
                "active"      : line.active,       // Состояние (true/false)
                "systems"     : line.systems,      // Системы [{ name: roles, status: 1 }]
            });
        });
        console.log(`[MYSQL] Загрузка файлов конфига успешно заверешна!`);
    });
}; // Загрузка серверов с их параметрами

exports.isServerExists = (config, serverid) => {
    let server = config.find(value => value.server == serverid);
    if (server) return true;
    return false;
} // Проверка наличия сервера

exports.createServer = async (server, config, serverid) => {
    server.query(`INSERT INTO \`config\` (\`server\`, \`systems\`) VALUES ('${serverid}', '[]')`, (error) => {
        if (error){
            console.log(`[MYSQL] Произошла ошибка при добавлении сервера.`);
            return console.error(error);
        }
        console.log(`[MYSQL] Сервер успешно добавлен в БД!`);
        this.loadConfig(server, config);
    });
} // Создание сервера

exports.deleteServer = async (server, config, serverid) => {
    server.query(`DELETE FROM \`config\` WHERE \`server\` = '${serverid}'`, (error) => {
        if (error){
            console.log(`[MYSQL] Произошла ошибка при удалении сервера.`);
            return console.error(error);
        }
        console.log(`[MYSQL] Сервер успешно удален!`);
        this.loadConfig(server, config);
    });
} // Удаление сервера

exports.isEnableServer = (config, serverid) => {
    let server = config.find(value => value.server == serverid);
    if (!server) return false;
    return server.active;
} // Активирован ли сервер

exports.changeStatusServer = async (server, config, serverid, status) => {
    let _server = config.find(value => value.server == serverid);
    if (!_server) return console.log(`[CONFIG] Сервер не найден.`);
    if (typeof (status) != "boolean") return console.log(`[STATUS] Значение status должно быть boolean!`);
    server.query(`UPDATE \`config\` SET \`active\` = ${status} WHERE \`server\` = '${serverid}'`, (error) => {
        if (error){
            console.log(`[MYSQL] Произошла ошибка при изменении статуса сервера.`);
            return console.error(error);
        }
        console.log(`[MYSQL] Статус сервера был изменен на ${status}!`);
        this.loadConfig(server, config);
    });
} // Изменить статус активации серверу

exports.isHasSystem = (config, serverid, system_name) => {
    let server = config.find(value => value.server == serverid);
    if (!server) return false;
    let systems = JSON.parse(server.systems);
    if (typeof (systems) != "object") return false;
    if (!Array.isArray(systems)) return false;
    let system = systems.find(value => value.name == system_name);
    if (!system) return false;
    return true;
} // Имеется ли данная система в БД

exports.createSystem = async (server, config, serverid, system_name) => {
    let _server = config.find(value => value.server == serverid);
    if (!_server) return console.log(`[CONFIG] Сервер не был найден!`);
    let systems = JSON.parse(_server.systems);
    if (typeof (systems) != "object") return console.log(`[TYPE] Значение SYSTEMS не является объектом.`);
    if (!Array.isArray(systems)) return console.log(`[TYPE] Значение SYSTEMS не является массивом.`);
    let system = systems.find(value => value.name == system_name);
    if (system) return console.log(`[SYSTEM] Система уже существует!`);
    systems.push({
        "name": `${system_name}`,
        "status": false,
    });
    server.query(`UPDATE \`config\` SET \`systems\` = '${JSON.stringify(systems)}' WHERE \`server\` = '${serverid}'`, (error) => {
        if (error){
            console.log(`[MYSQL] Произошла ошибка при добавлении системы.`);
            return console.error(error);
        }
        console.log(`[MYSQL] Система была добавлена: ${system_name}!`);
        this.loadConfig(server, config);
    });
} // Создание системы

exports.deleteSystem = async (server, config, serverid, system_name) => {
    let _server = config.find(value => value.server == serverid);
    if (!_server) return console.log(`[CONFIG] Сервер не был найден!`);
    let systems = JSON.parse(_server.systems);
    if (typeof (systems) != "object") return console.log(`[TYPE] Значение SYSTEMS не является объектом.`);
    if (!Array.isArray(systems)) return console.log(`[TYPE] Значение SYSTEMS не является массивом.`);
    let system = systems.find(value => value.name == system_name);
    if (!system) return console.log(`[SYSTEM] Система не существует!`);
    systems = systems.filter(sys => sys.name != system_name);
    server.query(`UPDATE \`config\` SET \`systems\` = '${JSON.stringify(systems)}' WHERE \`server\` = '${serverid}'`, (error) => {
        if (error){
            console.log(`[MYSQL] Произошла ошибка при удалении системы.`);
            return console.error(error);
        }
        console.log(`[MYSQL] Система была удалена: ${system_name}!`);
        this.loadConfig(server, config);
    });
} // Удаление системы

exports.changeStatusSystem = async (server, config, serverid, system_name, status) => {
    let _server = config.find(value => value.server == serverid);
    if (!_server) return console.log(`[CONFIG] Сервер не найден.`);
    let systems = JSON.parse(_server.systems);
    if (typeof (systems) != "object") return console.log(`[TYPE] Значение SYSTEMS не является объектом.`);
    if (!Array.isArray(systems)) return console.log(`[TYPE] Значение SYSTEMS не является массивом.`);
    let system = systems.find(value => value.name == system_name);
    if (!system) return console.log(`[SYSTEM] Система не существует!`);
    if (typeof (status) != "boolean") return console.log(`[STATUS] Значение status должно быть boolean!`);
    for (let i = 0; i < systems.length; i++){ if (systems[i].name == system_name) systems[i].status = status };
    server.query(`UPDATE \`config\` SET \`systems\` = '${JSON.stringify(systems)}' WHERE \`server\` = '${serverid}'`, (error) => {
        if (error){
            console.log(`[MYSQL] Произошла ошибка при изменении статуса системы.`);
            return console.error(error);
        }
        console.log(`[MYSQL] Статус системы ${system_name} был изменен на ${status}!`);
        this.loadConfig(server, config);
    });
} // Изменение статуса системе

exports.isEnableSystem = (config, serverid, system_name) => {
    let server = config.find(value => value.server == serverid);
    if (!server) return false;
    let systems = JSON.parse(server.systems);
    if (typeof (systems) != "object") return false;
    if (!Array.isArray(systems)) return false;
    let system = systems.find(value => value.name == system_name);
    if (!system) return false;
    return system.status;
} // Включена ли система

exports.loadProfiles = (server, users) => {
    console.log(`[MYSQL] Вызвана загрузка профилей пользователей..`);
    users.splice(0, users.length);
    server.query(`SELECT * FROM \`users\``, (error, answer) => {
        if (error){
            console.log(`[MYSQL] Произошла ошибка при загрузке пользователей.`);
            return console.error(error);
        }
        answer.forEach(line => {
            users.push({
                "server"  : line.server,   // ID сервера
                "discord" : line.discord,  // ID дискорда
                "vk"      : line.vk,       // ID вконтакте
                "access"  : line.access,   // Доступ [{ group: 'developers', level: '1' }]
            });
        });
        console.log(`[MYSQL] Загрузка профилей пользователей успешно заверешна!`);
    });
}; // Загрузка пользователей

exports.isHasProfileDiscord = (users, serverid, discord) => {
    let profile = users.find(user => user.discord == discord && user.server == serverid);
    if (!profile) return false;
    return true;
}; // Есть ли аккаунт пользователя (дискорд)

exports.isHasProfileVK = (users, vk) => {
    let profile = users.find(user => user.vk == vk);
    if (!profile) return false;
    return true;
}; // Есть ли аккаунт пользователя (вк)

exports.createProfile = async (server, users, serverid, discord, vk) => {
    server.query(`INSERT INTO \`users\` (\`server\`, \`discord\`, \`vk\`, \`access\`) VALUES ('${serverid}', '${discord}', '${vk}', '[]')`, (error) => {
        if (error){
            console.log(`[MYSQL] Произошла ошибка при добавлении аккаунта.`);
            return console.error(error);
        }
        console.log(`[MYSQL] Аккаунт успешно добавлен в БД!`);
        this.loadProfiles(server, users);
    });
} // Создать профиль

exports.deleteProfileByDiscord = async (server, users, serverid, discord) => {
    server.query(`DELETE FROM \`users\` WHERE \`server\` = '${serverid}' AND \`discord\` = '${discord}'`, (error) => {
        if (error){
            console.log(`[MYSQL] Произошла ошибка при удалении аккаунта.`);
            return console.error(error);
        }
        console.log(`[MYSQL] Аккаунт успешно удален!`);
        this.loadProfiles(server, users);
    });
} // Удалить профиль по дискорд айди

exports.deleteProfileByVK = async (server, users, vk) => {
    server.query(`DELETE FROM \`users\` WHERE \`vk\` = '${vk}'`, (error) => {
        if (error){
            console.log(`[MYSQL] Произошла ошибка при удалении аккаунта.`);
            return console.error(error);
        }
        console.log(`[MYSQL] Аккаунт успешно удален!`);
        this.loadProfiles(server, users);
    });
} // Удалить профиль по ВК

exports.groupsByDiscord = (users, serverid, discord) => {
    let profile = users.find(user => user.discord == discord && user.server == serverid);
    if (!profile) return [];
    let groups = JSON.parse(profile.access);
    if (typeof (groups) != "object") return [];
    if (!Array.isArray(groups)) return [];
    let name_groups = groups.map(g => g.group);
    return name_groups;
} // Получить все группы по дискорду

exports.groupsByVK = (users, vk, groupname) => {
    if (vk == 0) return [];
    let profile = users.find(user => user.vk == vk);
    if (!profile) return [];
    let groups = JSON.parse(profile.access);
    if (typeof (groups) != "object") return [];
    if (!Array.isArray(groups)) return [];
    let name_groups = groups.map(g => g.group);
    return name_groups;
} // Получить все группы ВК


exports.levelGroupByDiscord = (users, serverid, discord, groupname) => {
    let profile = users.find(user => user.discord == discord && user.server == serverid);
    if (!profile) return 0;
    let groups = JSON.parse(profile.access);
    if (typeof (groups) != "object") return 0;
    if (!Array.isArray(groups)) return 0;
    let group = groups.find(value => value.group == groupname);
    if (!group) return 0;
    return +group.level;
} // Уровень группы по дискорду

exports.levelGroupByVK = (users, vk, groupname) => {
    if (vk == 0) return 0;
    let profile = users.find(user => user.vk == vk);
    if (!profile) return 0;
    let groups = JSON.parse(profile.access);
    if (typeof (groups) != "object") return 0;
    if (!Array.isArray(groups)) return 0;
    let group = groups.find(value => value.group == groupname);
    if (!group) return 0;
    return +group.level;
} // Уровень группы по ВК

exports.changeGroupByDiscord = async (server, users, serverid, discord, groupname, level) => {
    let profile = users.find(value => value.server == serverid && value.discord == discord);
    if (!profile) return console.log(`[CONFIG] Профиль не был найден!`);
    let systems = JSON.parse(profile.access);
    if (typeof (systems) != "object") return console.log(`[TYPE] Значение ACCESS не является объектом.`);
    if (!Array.isArray(systems)) return console.log(`[TYPE] Значение ACCESS не является массивом.`);
    if (typeof (+level) != "number") return console.log(`[TYPE] Значение LEVEL не является числом.`);
    if (+level == 0) return console.log(`[TYPE] Нельзя указывать уровень равный нулю!`);
    let system = systems.find(value => value.group == groupname);
    if (system && system.level == level) return console.log(`[SYSTEM] Пользователь уже состоит в данной группе!`);
    if (!system){
        systems.push({
            "group": `${groupname}`,
            "level": level,
        });
    }else{
        for (let i = 0; i < systems.length; i++){ if (systems[i].group == groupname) systems[i].level = +level };
    }
    server.query(`UPDATE \`users\` SET \`access\` = '${JSON.stringify(systems)}' WHERE \`server\` = '${serverid}' AND \`discord\` = '${discord}'`, (error) => {
        if (error){
            console.log(`[MYSQL] Произошла ошибка при добавлении пользователя в группу.`);
            return console.error(error);
        }
        console.log(`[MYSQL] Пользователь успешно добавлен в группу: ${groupname}, уровень ${level}!`);
        this.loadProfiles(server, users);
    });
} // Изменить или добавить группу (дискорд)

exports.changeGroupByVK = async (server, users, vk, groupname, level) => {
    let profile = users.find(value => value.vk == vk);
    if (!profile) return console.log(`[CONFIG] Профиль не был найден!`);
    let systems = JSON.parse(profile.access);
    if (typeof (systems) != "object") return console.log(`[TYPE] Значение ACCESS не является объектом.`);
    if (!Array.isArray(systems)) return console.log(`[TYPE] Значение ACCESS не является массивом.`);
    if (typeof (+level) != "number") return console.log(`[TYPE] Значение LEVEL не является числом.`);
    if (+level == 0) return console.log(`[TYPE] Нельзя указывать уровень равный нулю!`);
    let system = systems.find(value => value.group == groupname);
    if (system && system.level == level) return console.log(`[SYSTEM] Пользователь уже состоит в данной группе!`);
    if (!system){
        systems.push({
            "group": `${groupname}`,
            "level": level,
        });
    }else{
        for (let i = 0; i < systems.length; i++){ if (systems[i].group == groupname) systems[i].level = +level };
    }
    server.query(`UPDATE \`users\` SET \`access\` = '${JSON.stringify(systems)}' WHERE \`vk\` = '${vk}'`, (error) => {
        if (error){
            console.log(`[MYSQL] Произошла ошибка при добавлении пользователя в группу.`);
            return console.error(error);
        }
        console.log(`[MYSQL] Пользователь успешно добавлен в группу: ${groupname}, уровень ${level}!`);
        this.loadProfiles(server, users);
    });
} // Изменить или добавить группу (вк)

exports.removeGroupByDiscord = async (server, users, serverid, discord, groupname) => {
    let profile = users.find(value => value.server == serverid && value.discord == discord);
    if (!profile) return console.log(`[CONFIG] Профиль не был найден!`);
    let systems = JSON.parse(profile.access);
    if (typeof (systems) != "object") return console.log(`[TYPE] Значение ACCESS не является объектом.`);
    if (!Array.isArray(systems)) return console.log(`[TYPE] Значение ACCESS не является массивом.`);
    let system = systems.find(value => value.group == groupname);
    if (!system) return console.log(`[SYSTEM] Пользователя нельзя убрать из группы в которой он не состоит!`);
    systems = systems.filter(sys => sys.gorup != groupname);
    server.query(`UPDATE \`users\` SET \`access\` = '${JSON.stringify(systems)}' WHERE \`server\` = '${serverid}' AND \`discord\` = '${discord}'`, (error) => {
        if (error){
            console.log(`[MYSQL] Произошла ошибка при удалении пользователя с группы.`);
            return console.error(error);
        }
        console.log(`[MYSQL] Пользователь успешно удален из группы: ${groupname}!`);
        this.loadProfiles(server, users);
    });
}; // Убрать пользователя из группы (дискорд)

exports.removeGroupByVK = async (server, users, vk, groupname) => {
    let profile = users.find(value => value.vk == vk);
    if (!profile) return console.log(`[CONFIG] Профиль не был найден!`);
    let systems = JSON.parse(profile.access);
    if (typeof (systems) != "object") return console.log(`[TYPE] Значение ACCESS не является объектом.`);
    if (!Array.isArray(systems)) return console.log(`[TYPE] Значение ACCESS не является массивом.`);
    let system = systems.find(value => value.group == groupname);
    if (!system) return console.log(`[SYSTEM] Пользователя нельзя убрать из группы в которой он не состоит!`);
    systems = systems.filter(sys => sys.gorup != groupname);
    server.query(`UPDATE \`users\` SET \`access\` = '${JSON.stringify(systems)}' WHERE \`vk\` = '${vk}'`, (error) => {
        if (error){
            console.log(`[MYSQL] Произошла ошибка при удалении пользователя с группы.`);
            return console.error(error);
        }
        console.log(`[MYSQL] Пользователь успешно удален из группы: ${groupname}!`);
        this.loadProfiles(server, users);
    });
}; // Убрать пользователя из группы (вк)