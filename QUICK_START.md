# 🚀 Быстрый старт - Coworking Platform

## ⚡ Запуск за 5 минут

### 1. Запуск Backend
```bash
cd coworking-backend
pip install -r requirements.txt
python start_server.py
```
**Результат**: Backend запущен на `http://localhost:8000`

### 2. Запуск Frontend
```bash
cd coworking-frontend
npm install
npm run dev
```
**Результат**: Frontend запущен на `http://localhost:5173`

### 3. Проверка работы
- Откройте `http://localhost:5173` в браузере
- Зарегистрируйтесь или войдите в систему
- Проверьте API документацию: `http://localhost:8000/docs`

## 🔧 Альтернативные способы запуска

### Backend (альтернативы)
```bash
# Способ 1: Через uvicorn
uvicorn app.main:app --reload --port 8000

# Способ 2: Через Python модуль
python -m uvicorn app.main:app --reload --port 8000

# Способ 3: Через Docker
docker build -t coworking-backend .
docker run -p 8000:8000 coworking-backend
```

### Frontend (альтернативы)
```bash
# Через yarn
yarn install
yarn dev

# Сборка для продакшена
npm run build
npm run preview
```

## 🧪 Тестирование

### Автоматический тест
Откройте `coworking-frontend/test-integration.html` в браузере

### Ручной тест API
```bash
# Проверка здоровья
curl http://localhost:8000/health

# Регистрация
curl -X POST "http://localhost:8000/auth/register" \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "full_name": "Test User", "password": "test123"}'
```

## 🐛 Решение проблем

### Backend не запускается
```bash
# Проверьте зависимости
pip install -r requirements.txt

# Проверьте порт
netstat -an | findstr :8000

# Убейте процессы Python
taskkill /F /IM python.exe
```

### Frontend не запускается
```bash
# Очистите кэш
npm cache clean --force

# Переустановите зависимости
rm -rf node_modules
npm install
```

### CORS ошибки
- Убедитесь, что backend запущен на порту 8000
- Проверьте настройки CORS в `main.py`

## 📱 Доступные URL

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🔑 Тестовые данные

### Пользователь по умолчанию
- **Email**: test@example.com
- **Пароль**: testpassword123

### API Endpoints
- `POST /auth/register` - регистрация
- `POST /auth/login` - вход
- `GET /users/me` - профиль
- `GET /health` - статус сервера

## 📞 Поддержка

При проблемах:
1. Проверьте логи в консоли
2. Убедитесь, что порты свободны
3. Перезапустите сервисы
4. Используйте `test-integration.html` для диагностики
