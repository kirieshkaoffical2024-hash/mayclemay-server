# 🚀 Инструкция по развертыванию MaycleMay

## Шаг 1: Развертывание сервера в облаке

### Вариант А: Render.com (РЕКОМЕНДУЕТСЯ - БЕСПЛАТНО)

1. Зарегистрируйтесь на https://render.com
2. Нажмите "New +" → "Web Service"
3. Подключите GitHub репозиторий или загрузите код
4. Настройки:
   - **Name**: mayclemay-server
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node cloud-server.js`
   - **Plan**: Free
5. Нажмите "Create Web Service"
6. Скопируйте URL вашего сервера (например: `https://mayclemay-server.onrender.com`)

### Вариант Б: Railway.app (БЕСПЛАТНО)

1. Зарегистрируйтесь на https://railway.app
2. Нажмите "New Project" → "Deploy from GitHub repo"
3. Выберите репозиторий
4. Railway автоматически определит Node.js проект
5. Добавьте переменную окружения:
   - `PORT`: 3000
6. Скопируйте URL вашего сервера

### Вариант В: Glitch.com (БЕСПЛАТНО)

1. Зарегистрируйтесь на https://glitch.com
2. Нажмите "New Project" → "Import from GitHub"
3. Вставьте ссылку на репозиторий
4. Glitch автоматически запустит сервер
5. Скопируйте URL проекта

### Вариант Г: Heroku (ПЛАТНО после бесплатного периода)

1. Зарегистрируйтесь на https://heroku.com
2. Установите Heroku CLI
3. Выполните команды:
```bash
heroku login
heroku create mayclemay-server
git push heroku main
```
4. Скопируйте URL приложения

## Шаг 2: Настройка приложения

1. Откройте файл `app.js`
2. Найдите строку:
```javascript
const SERVER_URL = 'https://your-server-url.com';
```
3. Замените на URL вашего сервера:
```javascript
const SERVER_URL = 'https://mayclemay-server.onrender.com';
```

## Шаг 3: Сборка приложения для друзей

### Windows:
```bash
npm install
npm run build-win
```
Готовый установщик будет в папке `dist/`

### macOS:
```bash
npm install
npm run build-mac
```
Готовый .dmg файл будет в папке `dist/`

### Linux:
```bash
npm install
npm run build-linux
```
Готовый .AppImage файл будет в папке `dist/`

## Шаг 4: Распространение

1. Найдите установочный файл в папке `dist/`
2. Отправьте друзьям через:
   - Google Drive
   - Dropbox
   - WeTransfer
   - Telegram
   - Discord

## Важные замечания

⚠️ **Бесплатные серверы имеют ограничения:**
- Render.com: засыпает после 15 минут неактивности (первое подключение может занять 30 сек)
- Railway.app: 500 часов в месяц бесплатно
- Glitch.com: проект засыпает после 5 минут неактивности

💡 **Для продакшена рекомендуется:**
- DigitalOcean ($5/месяц)
- AWS EC2
- Google Cloud
- Azure

## Альтернатива: Peer-to-Peer

Если не хотите платить за сервер, можно использовать P2P решения:
- PeerJS
- WebRTC
- Gun.js

Но это потребует переписать код для работы без центрального сервера.

## Проверка работы сервера

После деплоя откройте в браузере URL вашего сервера.
Вы должны увидеть JSON с информацией:
```json
{
  "status": "online",
  "users": 0,
  "onlineUsers": 0,
  "messages": 0
}
```

## Поддержка

Если возникли проблемы:
1. Проверьте логи сервера в панели управления хостинга
2. Убедитесь что URL в app.js правильный
3. Проверьте что сервер запущен и доступен
