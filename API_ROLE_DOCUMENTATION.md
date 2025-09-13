# API Документация - Ролевая модель

## Обзор

Данный документ описывает API endpoints с учетом ролевой модели и прав доступа в системе управления коворкингом.

## Аутентификация

Все защищенные endpoints требуют JWT токен в заголовке:
```
Authorization: Bearer <jwt_token>
```

## Роли и права

### Роли пользователей
- **Guest** - неавторизованный пользователь
- **User** - обычный пользователь
- **Admin** - администратор

### Матрица прав доступа

| Endpoint | Method | Guest | User | Admin | Описание |
|----------|--------|-------|------|-------|----------|
| `/auth/register` | POST | ✅ | ❌ | ❌ | Регистрация |
| `/auth/login` | POST | ✅ | ❌ | ❌ | Вход в систему |
| `/users/me` | GET | ❌ | ✅ | ✅ | Текущий пользователь |
| `/api/rooms` | GET | ❌ | ✅ | ✅ | Список аудиторий |
| `/api/rooms` | POST | ❌ | ❌ | ✅ | Создание аудитории |
| `/api/rooms/{id}` | PUT | ❌ | ❌ | ✅ | Обновление аудитории |
| `/api/rooms/{id}` | DELETE | ❌ | ❌ | ✅ | Удаление аудитории |
| `/api/bookings` | POST | ❌ | ✅ | ✅ | Создание бронирования |
| `/api/bookings/my` | GET | ❌ | ✅ | ✅ | Мои бронирования |
| `/api/bookings` | GET | ❌ | ❌ | ✅ | Все бронирования |
| `/api/bookings/{id}` | PUT | ❌ | ✅* | ✅ | Обновление бронирования |
| `/api/bookings/{id}` | DELETE | ❌ | ✅* | ✅ | Отмена бронирования |

*Пользователи могут управлять только своими бронированиями

## Детальное описание endpoints

### Аутентификация

#### POST /auth/register
**Права**: Guest  
**Описание**: Регистрация нового пользователя

**Request Body**:
```json
{
  "email": "user@example.com",
  "full_name": "Иван Иванов",
  "password": "password123"
}
```

**Response**:
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "Иван Иванов",
  "is_active": true,
  "is_admin": false,
  "karma": 0,
  "total_donated": 0.0,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### POST /auth/login
**Права**: Guest  
**Описание**: Вход в систему

**Request Body** (Form Data):
```
username: user@example.com
password: password123
```

**Response**:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

### Управление аудиториями

#### GET /api/rooms
**Права**: User, Admin  
**Описание**: Получение списка аудиторий

**Query Parameters**:
- `skip` (int, optional): Количество пропускаемых записей (default: 0)
- `limit` (int, optional): Максимальное количество записей (default: 100)
- `active_only` (bool, optional): Только активные аудитории (default: true)

**Response**:
```json
[
  {
    "id": 1,
    "name": "Конференц-зал А",
    "description": "Большой конференц-зал с проектором",
    "capacity": 20,
    "equipment": "Проектор, Доска, Микрофон",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/rooms
**Права**: Admin  
**Описание**: Создание новой аудитории

**Request Body**:
```json
{
  "name": "Новая аудитория",
  "description": "Описание аудитории",
  "capacity": 10,
  "equipment": "Проектор, Wi-Fi"
}
```

**Response**:
```json
{
  "id": 2,
  "name": "Новая аудитория",
  "description": "Описание аудитории",
  "capacity": 10,
  "equipment": "Проектор, Wi-Fi",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### PUT /api/rooms/{room_id}
**Права**: Admin  
**Описание**: Обновление аудитории

**Request Body**:
```json
{
  "name": "Обновленное название",
  "description": "Обновленное описание",
  "capacity": 15,
  "equipment": "Новое оборудование",
  "is_active": true
}
```

#### DELETE /api/rooms/{room_id}
**Права**: Admin  
**Описание**: Удаление аудитории (деактивация)

**Response**:
```json
{
  "id": 1,
  "name": "Конференц-зал А",
  "is_active": false,
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### GET /api/rooms/{room_id}/availability
**Права**: User, Admin  
**Описание**: Получение доступных слотов времени для аудитории

**Query Parameters**:
- `date` (string, required): Дата в формате ISO (YYYY-MM-DDTHH:MM:SS)

**Response**:
```json
{
  "room_id": 1,
  "room_name": "Конференц-зал А",
  "date": "2024-01-01T00:00:00Z",
  "available_slots": [
    {
      "start_time": "2024-01-01T09:00:00Z",
      "end_time": "2024-01-01T10:00:00Z",
      "duration_hours": 1
    },
    {
      "start_time": "2024-01-01T10:00:00Z",
      "end_time": "2024-01-01T11:00:00Z",
      "duration_hours": 1
    }
  ]
}
```

### Управление бронированиями

#### POST /api/bookings
**Права**: User, Admin  
**Описание**: Создание нового бронирования

**Request Body**:
```json
{
  "room_id": 1,
  "start_time": "2024-01-01T10:00:00Z",
  "end_time": "2024-01-01T11:00:00Z",
  "purpose": "Встреча команды"
}
```

**Response**:
```json
{
  "id": 1,
  "user_id": 1,
  "room_id": 1,
  "start_time": "2024-01-01T10:00:00Z",
  "end_time": "2024-01-01T11:00:00Z",
  "purpose": "Встреча команды",
  "status": "confirmed",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "room": {
    "id": 1,
    "name": "Конференц-зал А",
    "capacity": 20
  },
  "user_name": "Иван Иванов"
}
```

#### GET /api/bookings/my
**Права**: User, Admin  
**Описание**: Получение бронирований текущего пользователя

**Response**:
```json
[
  {
    "id": 1,
    "user_id": 1,
    "room_id": 1,
    "start_time": "2024-01-01T10:00:00Z",
    "end_time": "2024-01-01T11:00:00Z",
    "purpose": "Встреча команды",
    "status": "confirmed",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "room": {
      "id": 1,
      "name": "Конференц-зал А",
      "capacity": 20
    },
    "user_name": "Иван Иванов"
  }
]
```

#### GET /api/bookings
**Права**: Admin  
**Описание**: Получение всех бронирований (только для администраторов)

**Query Parameters**:
- `skip` (int, optional): Количество пропускаемых записей (default: 0)
- `limit` (int, optional): Максимальное количество записей (default: 100)

#### PUT /api/bookings/{booking_id}
**Права**: User* (свои), Admin (все)  
**Описание**: Обновление бронирования

**Request Body**:
```json
{
  "start_time": "2024-01-01T11:00:00Z",
  "end_time": "2024-01-01T12:00:00Z",
  "purpose": "Обновленная цель"
}
```

#### DELETE /api/bookings/{booking_id}
**Права**: User* (свои), Admin (все)  
**Описание**: Отмена бронирования

**Response**:
```json
{
  "id": 1,
  "status": "cancelled",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## Коды ошибок

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "Permission 'rooms:create' required"
}
```

### 404 Not Found
```json
{
  "detail": "Room not found"
}
```

### 400 Bad Request
```json
{
  "detail": "Maximum number of active bookings reached (3)"
}
```

## Бизнес-правила и ограничения

### Ограничения бронирований
- Максимум 3 активных бронирования на пользователя
- Максимальная продолжительность: 4 часа
- Рабочие часы: 9:00 - 21:00
- Отмена возможна не позднее чем за 2 часа до начала

### Валидация времени
- Нельзя бронировать в прошлом
- Время окончания должно быть позже времени начала
- Проверка конфликтов с существующими бронированиями

### Система кармы
- +2 кармы за каждое бронирование
- +1 карма за посещение коворкинга
- +1 карма за каждые 50₽ пожертвования

## Примеры использования

### Создание бронирования
```bash
curl -X POST "http://localhost:8000/api/bookings" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": 1,
    "start_time": "2024-01-01T10:00:00Z",
    "end_time": "2024-01-01T11:00:00Z",
    "purpose": "Встреча команды"
  }'
```

### Получение доступных слотов
```bash
curl -X GET "http://localhost:8000/api/rooms/1/availability?date=2024-01-01T00:00:00Z" \
  -H "Authorization: Bearer <token>"
```

### Создание аудитории (только админ)
```bash
curl -X POST "http://localhost:8000/api/rooms" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Новая аудитория",
    "description": "Описание",
    "capacity": 10,
    "equipment": "Проектор"
  }'
```

## Безопасность

### JWT токены
- Время жизни: 24 часа
- Алгоритм: HS256
- Секретный ключ: настраивается в переменных окружения

### Валидация данных
- Все входные данные валидируются с помощью Pydantic
- Проверка прав доступа на уровне endpoint'ов
- Логирование всех административных действий

### CORS
- Разрешены запросы с любого origin в режиме разработки
- В продакшене настраивается список разрешенных доменов

---

*Документация актуальна на: [текущая дата]*  
*Версия API: 1.0*
