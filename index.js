const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs').promises;

// Парсинг JSON-тела POST-запросов
app.use(bodyParser.json());

// Разрешить запросы с определенного источника
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:5500');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});
app.post('/chat', async (req, res) => {
    try {
        const jsonData = req.body;

        // Чтение файла
        const data = await fs.readFile('./json/db.json', 'utf8');
        // Парсинг данных из файла
        let existingData = [];
        if (data) {
            existingData = JSON.parse(data);
        }

        // Добавление новых данных в существующие данные
        existingData.push(jsonData);

        // Запись обновленных данных обратно в файл
        await fs.writeFile('db.json', JSON.stringify(existingData, null, 2));

        console.log('Данные успешно добавлены в файл db.json');
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка при обработке запроса:', error);
        res.status(500).json({ error: 'Ошибка при обработке запроса' });
    }
});

app.get('/', async (req, res) => {
    // Чтение данных из файла db.json
    try {
        const data = await fs.readFile('./json/db.json', 'utf8');
        if(data){
            res.json(data);
        }else{
            res.json(null);
        }
    } catch (error) {
        console.error('Ошибка при обработке запроса:', error);
        res.status(500).json({ error: 'Ошибка при обработке запроса' });
    }
});
app.post('/login', async (req, res) => {
    try {
        const reqData = req.body;
        const userDb = await fs.readFile('./json/user.json', 'utf8');
        const arrayUserDb = JSON.parse(userDb);

        const user = arrayUserDb.find(item => item.userLogin === reqData.userLogin && item.userPassword === reqData.userPassword);
        if (user) {
            console.log(`Пользователь ${user.userLogin} вошел в систему`);
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        console.error('Ошибка при обработке запроса:', error);
        res.status(500).json({ error: 'Ошибка при обработке запроса' });
    }
});
// Запуск сервера на порте 3000
app.listen(3000, () => {
    console.log('Сервер запущен на порте 3000');
});
