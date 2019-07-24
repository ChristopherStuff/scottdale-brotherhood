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


/*
    cmd: /load_configs - load config, users, groups;

    cmd: /server_add - add server to database;
    cmd: /server_delete - delition server;
    cmd: /server_status [on/off] - change server status;
    
    cmd: /system_create [system_name] - add system to database;
    cmd: /system_delete [system_name] - delete system;
    cmd: /system_status [on/off] [system_name] - change system status;

    cmd: /group_create [level_name] [group_name] - create a group;
    cmd: /group_delete [group_name] - delete a group;

    cmd: /level_create [level_name] [group_name] - create level;
    cmd: /level_delete [group_name] - delete level;
    cmd: /level_change [level] [permission] [value] [group_name] - change stats;

    cmd: /user_group [user] [level] [group] - add user to group;
    дополнительно:                          - level 0 delete user;
*/


exports.loadConfig = (server, config) => {
    return new Promise((resolve, reject) => {
        console.log(`[MYSQL] Вызвана загрузка файлов конфига..`);
        config.splice(0, config.length);
        server.query(`SELECT * FROM \`config\``, (error, answer) => {
            if (error){
                reject('Ошибка при выполнении MYSQL запроса.\`\`\`\nSELECT * FROM config\n\`\`\`');
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
            resolve('Загрузка файлов конфига успешно завершена!');
        });
    });
}; // Загрузка серверов с их параметрами

exports.isServerExists = (config, serverid) => {
    if (!config || !serverid) return false;
    let server = config.find(value => value.server == serverid);
    if (!server) return false;
    return true;
} // Проверка наличия сервера

exports.createServer = async (server, config, serverid) => {
    return new Promise((resolve, reject) => {
        if (!server || !config || !serverid) return reject(`Не указаны одни из параметров функции: server, config, serverid`);
        server.query(`INSERT INTO \`config\` (\`server\`, \`systems\`) VALUES ('${serverid}', '[]')`, (error) => {
            if (error){
                reject(`Ошибка MYSQL запроса!\`\`\`\nINSERT INTO \`config\` (\`server\`, \`systems\`) VALUES ('${serverid}', '[]')\n\`\`\``);
                console.log(`[MYSQL] Произошла ошибка при добавлении сервера.`);
                return console.error(error);
            }
            console.log(`[MYSQL] Сервер успешно добавлен в БД!`);
            this.loadConfig(server, config).then(() => {
                resolve('Сервер успешно добавлен в БД!')
            }).catch((err) => {
                reject(err);
            });
        });
    });
} // Создание сервера

exports.deleteServer = async (server, config, serverid) => {
    return new Promise((resolve, reject) => {
        if (!server || !config || !serverid) return reject(`Не указаны одни из параметров функции: server, config, serverid`);
        server.query(`DELETE FROM \`config\` WHERE \`server\` = '${serverid}'`, (error) => {
            if (error){
                reject(`Ошибка MYSQL запроса!\`\`\`\nDELETE FROM \`config\` WHERE \`server\` = '${serverid}'\n\`\`\``);
                console.log(`[MYSQL] Произошла ошибка при удалении сервера.`);
                return console.error(error);
            }
            console.log(`[MYSQL] Сервер успешно удален!`);
            this.loadConfig(server, config).then(() => {
                resolve('Сервер успешно удален!');
            }).catch((err) => {
                reject(err);
            });
        });
    });
} // Удаление сервера

exports.isEnableServer = (config, serverid) => {
    if (!config || !serverid) return false;
    let server = config.find(value => value.server == serverid);
    if (!server) return false;
    return server.active;
} // Активирован ли сервер

exports.changeStatusServer = async (server, config, serverid, status) => {
    return new Promise((resolve, reject) => {
        if (!server || !config || !serverid) return reject(`Не указаны одни из параметров функции: server, config, serverid`);
        let _server = config.find(value => value.server == serverid);
        if (!_server){
            reject('Сервер не найден.');
            return console.log(`[CONFIG] Сервер не найден.`);
        }
        if (typeof (status) != "boolean"){
            reject('Значение status должно быть true или false!')
            return console.log(`[STATUS] Значение status должно быть boolean!`);
        }
        server.query(`UPDATE \`config\` SET \`active\` = ${status} WHERE \`server\` = '${serverid}'`, (error) => {
            if (error){
                reject(`Ошибка MYSQL запроса!\`\`\`\nUPDATE \`config\` SET \`active\` = ${status} WHERE \`server\` = '${serverid}'\n\`\`\``)
                console.log(`[MYSQL] Произошла ошибка при изменении статуса сервера.`);
                return console.error(error);
            }
            console.log(`[MYSQL] Статус сервера был изменен на ${status}!`);
            this.loadConfig(server, config).then(() => {
                resolve(`Статус сервера был изменен!`);
            }).catch((err) => {
                reject(err);
            });
        });
    });
} // Изменить статус активации серверу

exports.isHasSystem = (config, serverid, system_name) => {
    if (!config || !serverid || !system_name) return false;
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
    return new Promise((resolve, reject) => {
        if (!server || !config || !serverid || !system_name) return reject(`Не указаны одни из параметров функции: server, config, serverid, system_name`);
        let _server = config.find(value => value.server == serverid);
        if (!_server){
            reject(`Сервер не был найден!`);
            return console.log(`[CONFIG] Сервер не был найден!`);
        }
        let systems = JSON.parse(_server.systems);
        if (typeof (systems) != "object"){
            reject(`Ошибка внутри базы данных! Значение SYSTEMS не является объектом.`);
            return console.log(`[TYPE] Значение SYSTEMS не является объектом.`);
        }
        if (!Array.isArray(systems)){
            reject(`Ошибка внутри базы данных! Значение SYSTEMS не является массивом.`);
            return console.log(`[TYPE] Значение SYSTEMS не является массивом.`);
        }
        let system = systems.find(value => value.name == system_name);
        if (system){
            reject(`Система уже существует!`);
            return console.log(`[SYSTEM] Система уже существует!`);
        }
        systems.push({
            "name": `${system_name}`,
            "status": false,
        });
        server.query(`UPDATE \`config\` SET \`systems\` = '${JSON.stringify(systems)}' WHERE \`server\` = '${serverid}'`, (error) => {
            if (error){
                reject(`Ошибка MYSQL запроса!\`\`\`\nUPDATE \`config\` SET \`systems\` = '${JSON.stringify(systems)}' WHERE \`server\` = '${serverid}'\n\`\`\``);
                console.log(`[MYSQL] Произошла ошибка при добавлении системы.`);
                return console.error(error);
            }
            console.log(`[MYSQL] Система была добавлена: ${system_name}!`);
            this.loadConfig(server, config).then(() => {
                resolve('Система была добавлена!');
            }).catch((err) => {
                reject(err);
            });
        });
    });
} // Создание системы

exports.deleteSystem = async (server, config, serverid, system_name) => {
    return new Promise((resolve, reject) => {
        if (!server || !config || !serverid, !system_name) return reject(`Не указаны одни из параметров функции: server, config, serverid, system_name`);
        let _server = config.find(value => value.server == serverid);
        if (!_server){
            reject(`Сервер не был найден!`);
            return console.log(`[CONFIG] Сервер не был найден!`);
        }
        let systems = JSON.parse(_server.systems);
        if (typeof (systems) != "object"){
            reject(`Ошибка внутри базы данных! Значение SYSTEMS не является объектом.`);
            return console.log(`[TYPE] Значение SYSTEMS не является объектом.`);
        }
        if (!Array.isArray(systems)){
            reject(`Ошибка внутри базы данных! Значение SYSTEMS не является массивом.`);
            return console.log(`[TYPE] Значение SYSTEMS не является массивом.`);
        }
        let system = systems.find(value => value.name == system_name);
        if (!system){
            reject(`Система не существует!`);
            return console.log(`[SYSTEM] Система не существует!`);
        }
        systems = systems.filter(sys => sys.name != system_name);
        server.query(`UPDATE \`config\` SET \`systems\` = '${JSON.stringify(systems)}' WHERE \`server\` = '${serverid}'`, (error) => {
            if (error){
                reject(`Ошибка MYSQL запроса!\`\`\`\nUPDATE \`config\` SET \`systems\` = '${JSON.stringify(systems)}' WHERE \`server\` = '${serverid}'\n\`\`\``);
                console.log(`[MYSQL] Произошла ошибка при удалении системы.`);
                return console.error(error);
            }
            console.log(`[MYSQL] Система была удалена: ${system_name}!`);
            this.loadConfig(server, config).then(() => {
                resolve('Система была удалена!');
            }).catch(err => {
                reject(err);
            });
        });
    });
} // Удаление системы

exports.changeStatusSystem = async (server, config, serverid, system_name, status) => {
    return new Promise((resolve, reject) => {
        if (!server || !config || !serverid || !system_name) return reject(`Не указаны одни из параметров функции: server, config, serverid, system_name`);
        let _server = config.find(value => value.server == serverid);
        if (!_server){
            reject(`Сервер не был найден!`);
            return console.log(`[CONFIG] Сервер не был найден!`);
        }
        let systems = JSON.parse(_server.systems);
        if (typeof (systems) != "object"){
            reject(`Ошибка внутри базы данных! Значение SYSTEMS не является объектом.`);
            return console.log(`[TYPE] Значение SYSTEMS не является объектом.`);
        }
        if (!Array.isArray(systems)){
            reject(`Ошибка внутри базы данных! Значение SYSTEMS не является массивом.`);
            return console.log(`[TYPE] Значение SYSTEMS не является массивом.`);
        }
        let system = systems.find(value => value.name == system_name);
        if (!system){
            reject(`Система не существует!`);
            return console.log(`[SYSTEM] Система не существует!`);
        }
        if (typeof (status) != "boolean"){
            reject('Значение status должно быть boolean!');
            return console.log(`[STATUS] Значение status должно быть boolean!`);
        }
        for (let i = 0; i < systems.length; i++){ if (systems[i].name == system_name) systems[i].status = status };
        server.query(`UPDATE \`config\` SET \`systems\` = '${JSON.stringify(systems)}' WHERE \`server\` = '${serverid}'`, (error) => {
            if (error){
                reject(`Ошибка MYSQL запроса!\`\`\`\nUPDATE \`config\` SET \`systems\` = '${JSON.stringify(systems)}' WHERE \`server\` = '${serverid}'\n\`\`\``);
                console.log(`[MYSQL] Произошла ошибка при изменении статуса системы.`);
                return console.error(error);
            }
            console.log(`[MYSQL] Статус системы ${system_name} был изменен на ${status}!`);
            this.loadConfig(server, config).then(() => {
                resolve('Статус системы был успешно изменен!');
            }).catch(err => {
                reject(err);
            });
        });
    });
} // Изменение статуса системе

exports.isEnableSystem = (config, serverid, system_name) => {
    if (!config || !serverid || !system_name) return false;
    let server = config.find(value => value.server == serverid);
    if (!server) return false;
    let systems = JSON.parse(server.systems);
    if (typeof (systems) != "object") return false;
    if (!Array.isArray(systems)) return false;
    let system = systems.find(value => value.name == system_name);
    if (!system) return false;
    return system.status;
} // Включена ли система

exports.loadProfiles = async (server, users) => {
    return new Promise(async (resolve, reject) => {
        if (!server || !users) return reject(`Не указаны одни из параметров функции: server, users`);
        console.log(`[MYSQL] Вызвана загрузка профилей пользователей..`);
        users.splice(0, users.length);
        server.query(`SELECT * FROM \`users\``, (error, answer) => {
            if (error){
                reject(`Произошла ошибка при загрузке пользователей.\`\`\`\nSELECT * FROM \`users\`\n\`\`\``);
                console.log(`[MYSQL] Произошла ошибка при загрузке пользователей.`);
                return console.error(error);
            }
            answer.forEach(line => {
                users.push({
                    "server"  : line.server,   // ID сервера
                    "discord" : line.discord,  // ID дискорда
                    "access"  : line.access,   // Доступ [{ group: 'developers', level: '1' }]
                });
            });
            console.log(`[MYSQL] Загрузка профилей пользователей успешно заверешна!`);
            resolve('Загрузка профилей пользователей успешно заверешна!');
        });
    });
}; // Загрузка пользователей

exports.isHasProfile = (users, serverid, discord) => {
    if (!users || !serverid || !discord) return false;
    let profile = users.find(user => user.discord == discord && user.server == serverid);
    if (!profile) return false;
    return true;
}; // Есть ли аккаунт пользователя (дискорд)

exports.createProfile = async (server, users, serverid, discord) => {
    return new Promise(async (resolve, reject) => {
        if (!server || !users || !serverid || !discord) return reject(`Не указаны одни из параметров функции: server, users, serverid, discord`);
        server.query(`INSERT INTO \`users\` (\`server\`, \`discord\`, \`access\`) VALUES ('${serverid}', '${discord}', '[]')`, async (error) => {
            if (error){
                reject(`Ошибка MYSQL!\`\`\`\nINSERT INTO \`users\` (\`server\`, \`discord\`, \`access\`) VALUES ('${serverid}', '${discord}', '[]'\n\`\`\``);
                console.log(`[MYSQL] Произошла ошибка при добавлении аккаунта.`);
                return console.error(error);
            }
            console.log(`[MYSQL] Аккаунт успешно добавлен в БД!`);
            this.loadProfiles(server, users).then(() => {
                resolve('Аккаунт успешно добавлен в БД!');
            }).catch((err) => {
                reject(err);
            });
        });
    });
} // Создать профиль

exports.deleteProfile = async (server, users, serverid, discord) => {
    return new Promise(async (resolve, reject) => {
        if (!server || !users || !serverid || !discord) return reject(`Не указаны одни из параметров функции: server, users, serverid, discord`);
        server.query(`DELETE FROM \`users\` WHERE \`server\` = '${serverid}' AND \`discord\` = '${discord}'`, (error) => {
            if (error){
                reject(`Произошла ошибка MYSQL!\`\`\`\nDELETE FROM \`users\` WHERE \`server\` = '${serverid}' AND \`discord\` = '${discord}'\n\`\`\``);
                console.log(`[MYSQL] Произошла ошибка при удалении аккаунта.`);
                return console.error(error);
            }
            console.log(`[MYSQL] Аккаунт успешно удален!`);
            this.loadProfiles(server, users).then(() => {
                resolve('Аккаунт успешно удален!');
            }).catch(err => {
                reject(err);
            });
        });
    });
} // Удалить профиль по дискорд айди

exports.groups = (users, serverid, discord) => {
    if (!users || !serverid || !discord) return [];
    let profile = users.find(user => user.discord == discord && user.server == serverid);
    if (!profile) return [];
    let groups = JSON.parse(profile.access);
    if (typeof (groups) != "object") return [];
    if (!Array.isArray(groups)) return [];
    let name_groups = groups.map(g => g.group);
    return name_groups;
} // Получить все группы по дискорду

exports.levelGroup = (users, serverid, discord, groupname) => {
    if (!users || !serverid || !discord || !groupname) return 0;
    let profile = users.find(user => user.discord == discord && user.server == serverid);
    if (!profile) return 0;
    let groups = JSON.parse(profile.access);
    if (typeof (groups) != "object") return 0;
    if (!Array.isArray(groups)) return 0;
    let group = groups.find(value => value.group == groupname);
    if (!group) return 0;
    return +group.level;
} // Уровень группы по дискорду

exports.changeGroup = async (server, users, groups, serverid, discord, groupname, level) => {
    return new Promise(async (resolve, reject) => {
        if (!server || !users || !groups || !serverid || !discord || !groupname || !level) return reject(`Не указаны одни из параметров функции: server, users, groups, serverid, discord, groupname, level`);
        let profile = users.find(value => value.server == serverid && value.discord == discord);
        if (!profile){
            reject('Профиль не был найден!');
            return console.log(`[CONFIG] Профиль не был найден!`);
        }
        let systems = JSON.parse(profile.access);
        if (typeof (systems) != "object"){
            reject(`Ошибка внутри базы данных! Значение ACCESS не является объектом.`);
            return console.log(`[TYPE] Значение ACCESS не является объектом.`);
        }
        if (!Array.isArray(systems)){
            reject(`Ошибка внутри базы данных! Значение SYSTEMS не является массивом.`);
            return console.log(`[TYPE] Значение ACCESS не является массивом.`);
        }
        if (typeof (+level) != "number"){
            reject('Значение LEVEL не является числом.');
            return console.log(`[TYPE] Значение LEVEL не является числом.`);
        }
        if (+level == 0){
            reject('Нельзя указывать уровень равный нулю!');
            return console.log(`[TYPE] Нельзя указывать уровень равный нулю!`);
        }
        let system = systems.find(value => value.group == groupname);
        if (system && +system.level == +level){
            reject('Пользователь уже состоит в данной группе!');
            return console.log(`[SYSTEM] Пользователь уже состоит в данной группе!`);
        }
        if (!this.isGroupsExists(groups, serverid, groupname)){
            reject('Данная группа не найдена в системе!');
            return console.log(`[SYSTEM] Данная группа не найдена в системе!`);
        }
        if (!this.isHasLevel(groups, serverid, groupname, +level)){
            reject('Данного уровня в данной группе не существует!');
            return console.log(`[SYSTEM] Данного уровня в данной группе не существует!`);
        }
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
                reject(`Произошла ошибка MYSQL!\`\`\`\nUPDATE \`users\` SET \`access\` = '${JSON.stringify(systems)}' WHERE \`server\` = '${serverid}' AND \`discord\` = '${discord}'\n\`\`\``)
                console.log(`[MYSQL] Произошла ошибка при добавлении пользователя в группу.`);
                return console.error(error);
            }
            console.log(`[MYSQL] Пользователь успешно добавлен в группу: ${groupname}, уровень ${level}!`);
            this.loadProfiles(server, users).then(() => {
                resolve('Пользователь успешно добавлен в группу!');
            }).catch((err) => {
                reject(err);
            });
        });
    });
} // Изменить или добавить группу (дискорд)

exports.removeGroup = async (server, users, serverid, discord, groupname) => {
    return new Promise(async (resolve, reject) => {
        if (!server || !users || !serverid || !discord || !groupname) return reject(`Не указаны одни из параметров функции: server, users, serverid, discord, groupname`);
        let profile = users.find(value => value.server == serverid && value.discord == discord);
        if (!profile){
            reject('Профиль не был найден!');
            return console.log(`[CONFIG] Профиль не был найден!`);
        }
        let systems = JSON.parse(profile.access);
        if (typeof (systems) != "object"){
            reject(`Ошибка внутри базы данных! Значение ACCESS не является объектом.`);
            return console.log(`[TYPE] Значение ACCESS не является объектом.`);
        }
        if (!Array.isArray(systems)){
            reject(`Ошибка внутри базы данных! Значение SYSTEMS не является массивом.`);
            return console.log(`[TYPE] Значение ACCESS не является массивом.`);
        }
        let system = systems.find(value => value.group == groupname);
        if (!system){
            reject('Пользователя нельзя убрать из группы в которой он не состоит!');
            return console.log(`[SYSTEM] Пользователя нельзя убрать из группы в которой он не состоит!`);
        }
        systems = systems.filter(sys => sys.group != groupname);
        server.query(`UPDATE \`users\` SET \`access\` = '${JSON.stringify(systems)}' WHERE \`server\` = '${serverid}' AND \`discord\` = '${discord}'`, (error) => {
            if (error){
                reject(`Произошла ошибка MYSQL!\`\`\`\nUPDATE \`users\` SET \`access\` = '${JSON.stringify(systems)}' WHERE \`server\` = '${serverid}' AND \`discord\` = '${discord}'\n\`\`\``);
                console.log(`[MYSQL] Произошла ошибка при удалении пользователя с группы.`);
                return console.error(error);
            }
            console.log(`[MYSQL] Пользователь успешно удален из группы: ${groupname}!`);
            this.loadProfiles(server, users).then(() => {
                resolve('Пользователь успешно удален из группы!');
            }).catch(err => {
                reject(err);
            });
        });
    });
}; // Убрать пользователя из группы (дискорд)

exports.loadGroups = async (server, groups) => {
    return new Promise(async (resolve, reject) => {
        if (!server || !groups) return reject(`Не указаны одни из параметров функции: server, groups`);
        console.log(`[MYSQL] Вызвана загрузка групп..`);
        groups.splice(0, groups.length);
        server.query(`SELECT * FROM \`groups\``, (error, answer) => {
            if (error){
                reject(`Произошла ошибка при загрузке групп.\`\`\`\nSELECT * FROM \`groups\`\n\`\`\``);
                console.log(`[MYSQL] Произошла ошибка при загрузке групп.`);
                return console.error(error);
            }
            answer.forEach(line => {
                groups.push({
                    "server"    : line.server,    // ID сервера
                    "name"      : line.name,      // Название группы
                    "levels"    : line.levels,    // Доступ [{ level: 2, name: 'Разработчик', manage_group: true, manage_levels: [1] }]
                });
            });
            console.log(`[MYSQL] Загрузка групп успешно заверешна!`);
            resolve('Загрузка групп успешно заверешна!');
        });
    });
}; // Загрузка групп

exports.isGroupsExists = (groups, serverid, name) => {
    if (!groups || !serverid || !name) return false;
    let group = groups.find(value => value.server == serverid && value.name == name);
    if (!group) return false;
    return true;
} // Проверка наличия группы

exports.createGroup = async (server, groups, serverid, name, level_name) => {
    return new Promise((resolve, reject) => {
        if (!server || !groups || !serverid || !name || !level_name) return reject(`Не указаны одни из параметров функции: server, groups, serverid, name, level_name`);
        server.query(`INSERT INTO \`groups\` (\`server\`, \`name\`, \`levels\`) VALUES ('${serverid}', '${name}', '${JSON.stringify([{"level":1,"name":`${level_name}`,"manage_group":true,"manage_levels":[1]}])}')`, (error) => {
            if (error){
                reject(`Ошибка MYSQL запроса!\`\`\`\nINSERT INTO \`groups\` (\`server\`, \`name\`, \`levels\`) VALUES ('${serverid}', '${name}', '${JSON.stringify([{"level":1,"name":`${level_name}`,"manage_group":true,"manage_levels":[1]}])}')\n\`\`\``);
                console.log(`[MYSQL] Произошла ошибка при добавлении группы.`);
                return console.error(error);
            }
            console.log(`[MYSQL] Группа успешно добавлена в БД!`);
            this.loadGroups(server, groups).then(() => {
                resolve('Группа успешно добавлена в БД!')
            }).catch((err) => {
                reject(err);
            });
        });
    });
} // Создание группы

exports.deleteGroup = async (server, groups, serverid, name) => {
    return new Promise((resolve, reject) => {
        if (!server || !groups || !serverid || !name) return reject(`Не указаны одни из параметров функции: server, groups, serverid, name`);
        server.query(`DELETE FROM \`groups\` WHERE \`server\` = '${serverid}' AND \`name\` = '${name}'`, (error) => {
            if (error){
                reject(`Ошибка MYSQL запроса!\`\`\`\nDELETE FROM \`groups\` WHERE \`server\` = '${serverid}' AND \`name\` = '${name}'\n\`\`\``);
                console.log(`[MYSQL] Произошла ошибка при удалении группы.`);
                return console.error(error);
            }
            console.log(`[MYSQL] Группа успешно удалена!`);
            this.loadGroups(server, groups).then(() => {
                resolve('Группа успешно удалена!');
            }).catch((err) => {
                reject(err);
            });
        });
    });
} // Удаление группы

exports.isHasLevel = (groups, serverid, name, level) => {
    if (!groups || !serverid || !name || !level) return false;
    let group = groups.find(value => value.server == serverid && value.name == name);
    if (!group) return false;
    let levels = JSON.parse(group.levels);
    if (typeof (levels) != "object") return false;
    if (!Array.isArray(levels)) return false;
    let _level = levels.find(lvl => lvl.level == level);
    if (!_level) return false;
    return true;
} // Существует ли такой уровень

exports.getLevelPermissions = (groups, serverid, name, level) => {
    if (!groups || !serverid || !name || !level) return [];
    let group = groups.find(value => value.server == serverid && value.name == name);
    if (!group) return [];
    let levels = JSON.parse(group.levels);
    if (typeof (levels) != "object") return [];
    if (!Array.isArray(levels)) return [];
    let _level = levels.find(lvl => lvl.level == level);
    if (!_level) return [];
    return [_level.name, _level.manage_group, _level.manage_levels];
} // Права данного уровня

exports.createLevel = async (server, groups, serverid, group_name, level_name) => {
    return new Promise((resolve, reject) => {
        if (!server || !groups || !serverid || !group_name || !level_name) return reject(`Не указаны одни из параметров функции: server, groups, serverid, group_name, level_name`);
        let group = groups.find(value => value.server == serverid && value.name == group_name);
        if (!group){
            reject(`Группа не была найдена!`);
            return console.log(`[GROUP] Группа не была найдена!`);
        }
        let levels = JSON.parse(group.levels);
        if (typeof (levels) != "object"){
            reject(`Ошибка внутри базы данных! Значение LEVELS не является объектом.`);
            return console.log(`[TYPE] Значение LEVELS не является объектом.`);
        }
        if (!Array.isArray(levels)){
            reject(`Ошибка внутри базы данных! Значение LEVELS не является массивом.`);
            return console.log(`[TYPE] Значение LEVELS не является массивом.`);
        }
        let level = levels.find(value => value.name == level_name);
        if (level){
            reject(`Такое название уже есть!`);
            return console.log(`[SYSTEM] Такое название уже есть!`);
        }
        levels.push({
            level: +levels.length + 1,
            name: `${level_name}`,
            manage_group: false,
            manage_levels: [],
        });
        server.query(`UPDATE \`groups\` SET \`levels\` = '${JSON.stringify(levels)}' WHERE \`server\` = '${serverid}' AND \`name\` = '${group_name}'`, (error) => {
            if (error){
                reject(`Ошибка MYSQL запроса!\`\`\`\nUPDATE \`groups\` SET \`levels\` = '${JSON.stringify(levels)}' WHERE \`server\` = '${serverid}' AND \`name\` = '${group_name}'\n\`\`\``);
                console.log(`[MYSQL] Произошла ошибка при добавлении уровня.`);
                return console.error(error);
            }
            console.log(`[MYSQL] Уровень был добавлен: ${level_name}!`);
            this.loadGroups(server, groups).then(() => {
                resolve('Уровень был добавлен!');
            }).catch((err) => {
                reject(err);
            });
        });
    });
} // Создания уровня

exports.deleteLevel = async (server, groups, users, serverid, group_name) => {
    return new Promise((resolve, reject) => {
        if (!server || !groups || !users || !serverid || !group_name) return reject(`Не указаны одни из параметров функции: server, groups, users, serverid, group_name`);
        let group = groups.find(value => value.server == serverid && value.name == group_name);
        if (!group){
            reject(`Группа не была найдена!`);
            return console.log(`[GROUP] Группа не была найдена!`);
        }
        let levels = JSON.parse(group.levels);
        if (typeof (levels) != "object"){
            reject(`Ошибка внутри базы данных! Значение LEVELS не является объектом.`);
            return console.log(`[TYPE] Значение LEVELS не является объектом.`);
        }
        if (!Array.isArray(levels)){
            reject(`Ошибка внутри базы данных! Значение LEVELS не является массивом.`);
            return console.log(`[TYPE] Значение LEVELS не является массивом.`);
        }
        if (levels.length == 1){
            reject(`Нельзя удалить первый уровень в группе!`);
            return console.log(`[SYSTEM] Нельзя удалить первый уровень в группе!`);
        }
        let profiles = users.filter(value => value.server == serverid);
        let systems = profiles.filter(profile => {
            let access = JSON.parse(profile.access);
            let _access = access.find(value => value.group == group_name && +value.level == 1);
            if (_access) return true;
            return false;
        });
        if (systems.length != 0){
            reject(`Нельзя удалить, пока ${systems.length} пользователей имеют данный уровень при себе!`);
            return console.log(`[SYSTEM] Нельзя удалить пока ${systems.length} пользователей имеют данный уровень!`);
        }
        let deleted_level = levels.pop();
        server.query(`UPDATE \`groups\` SET \`levels\` = '${JSON.stringify(levels)}' WHERE \`server\` = '${serverid}' AND \`name\` = '${group_name}'`, async (error) => {
            if (error){
                reject(`Ошибка MYSQL запроса!\`\`\`\nUPDATE \`groups\` SET \`levels\` = '${JSON.stringify(levels)}' WHERE \`server\` = '${serverid}' AND \`name\` = '${group_name}'\n\`\`\``);
                console.log(`[MYSQL] Произошла ошибка при удалении уровня.`);
                return console.error(error);
            }
            console.log(`[MYSQL] Уровень был удален: ${deleted_level.name}!`);
            this.loadGroups(server, groups).then(() => {
                resolve('Уровень был удален!');
            }).catch((err) => {
                reject(err);
            });
        });
    });
} // Удаление уровня

exports.changeLevel = async (server, groups, serverid, group_name, level, permission, value) => {
    return new Promise((resolve, reject) => {
        if (!server || !groups || !serverid || !group_name || !level || !permission) return reject(`Не указаны одни из параметров функции: server, groups, serverid, group_name, level, permission`);
        if (permission != 'manage_group' && permission != 'manage_levels') return reject(`Значение permission должно быть двух параметров: manage_group или manage_levels`);
        let group = groups.find(value => value.server == serverid && value.name == group_name);
        if (!group){
            reject(`Группа не найдена!`);
            return console.log(`[GROUPS] Группа не найдена!`);
        }
        if (permission == 'manage_group' && typeof (value) != "boolean"){
            reject(`Значение value при manage_group должно быть: true или false!`);
            return console.log(`[TYPE] Значение value при manage_group должно быть: true или false!`);
        }else if (permission == 'manage_levels' && !Array.isArray(value)){
            reject(`Значение value при manage_levels должно быть: array!`);
            return console.log(`[TYPE] Значение value при manage_levels должно быть: array!`);
        }
        let levels = JSON.parse(group.levels);
        if (typeof (levels) != "object"){
            reject(`Ошибка внутри базы данных! Значение LEVELS не является объектом.`);
            return console.log(`[TYPE] Значение LEVELS не является объектом.`);
        }
        if (!Array.isArray(levels)){
            reject(`Ошибка внутри базы данных! Значение LEVELS не является массивом.`);
            return console.log(`[TYPE] Значение LEVELS не является массивом.`);
        }
        let _level = levels.find(value => +value.level == +level);
        if (!_level){
            reject(`Уровень не найден!`);
            return console.log(`[SYSTEM] Уровень не найден!`);
        }
        for (let i = 0; i < levels.length; i++){ if (+levels[i].level == +level) levels[i][permission] = value };
        server.query(`UPDATE \`groups\` SET \`levels\` = '${JSON.stringify(levels)}' WHERE \`server\` = '${serverid}' AND \`name\` = '${group_name}'`, (error) => {
            if (error){
                reject(`Ошибка MYSQL запроса!\`\`\`\nUPDATE \`groups\` SET \`levels\` = '${JSON.stringify(levels)}' WHERE \`server\` = '${serverid}' AND \`name\` = '${group_name}'\n\`\`\``);
                console.log(`[MYSQL] Произошла ошибка при изменении прав уровня.`);
                return console.error(error);
            }
            console.log(`[MYSQL] Право ${permission} было изменено на ${value}!`);
            this.loadGroups(server, groups).then(() => {
                resolve('Право группы было успешно изменено!');
            }).catch(err => {
                reject(err);
            });
        });
    });
} // Изменение уровня