# Примеры использования ролевой модели

## Backend (FastAPI) - Примеры кода

### 1. Проверка прав в роутерах

```python
from fastapi import APIRouter, Depends, HTTPException, status
from ..utils.permissions import Permission, has_permission, check_booking_access

@router.post("/bookings")
def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user)
):
    # Проверка права на создание бронирований
    if not has_permission(current_user, Permission.CREATE_BOOKINGS):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission 'bookings:create' required"
        )
    
    # Дополнительная бизнес-логика
    if not validate_booking_limits(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum bookings limit reached"
        )
    
    return create_booking_logic(booking_data, current_user)
```

### 2. Проверка доступа к ресурсам

```python
@router.put("/bookings/{booking_id}")
def update_booking(
    booking_id: int,
    booking_update: BookingUpdate,
    current_user: User = Depends(get_current_user)
):
    # Получаем бронирование
    booking = get_booking(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Проверяем права доступа
    if not check_booking_access(current_user, booking.user_id, "edit"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No permission to edit this booking"
        )
    
    return update_booking_logic(booking, booking_update)
```

### 3. Условная логика на основе ролей

```python
@router.get("/bookings")
def get_bookings(
    current_user: User = Depends(get_current_user)
):
    # Администраторы видят все бронирования, пользователи - только свои
    if has_permission(current_user, Permission.VIEW_ALL_BOOKINGS):
        return get_all_bookings(db)
    else:
        return get_user_bookings(db, current_user.id)
```

### 4. Декоратор для проверки прав

```python
from ..utils.permissions import require_permission

@router.get("/admin/dashboard")
@require_permission(Permission.ACCESS_ADMIN_PANEL)
def get_admin_dashboard(current_user: User = Depends(get_current_user)):
    return get_dashboard_data(db)
```

## Frontend (React) - Примеры кода

### 1. Условное отображение элементов

```jsx
import { Permission } from '../utils/permissions'

function BookingComponent({ user, booking }) {
  const canEdit = checkBookingAccess(user, booking.user_id, 'edit')
  const canCancel = checkBookingAccess(user, booking.user_id, 'cancel')
  
  return (
    <div className="booking-card">
      <h3>{booking.room.name}</h3>
      <p>{formatDateTime(booking.start_time)}</p>
      
      {canEdit && (
        <button onClick={() => editBooking(booking.id)}>
          Редактировать
        </button>
      )}
      
      {canCancel && (
        <button onClick={() => cancelBooking(booking.id)}>
          Отменить
        </button>
      )}
    </div>
  )
}
```

### 2. Проверка прав в компонентах

```jsx
function NavigationMenu({ user }) {
  const isAdmin = user?.isAdmin
  const canManageRooms = hasPermission(user, Permission.CREATE_ROOMS)
  
  return (
    <nav>
      <Link to="/bookings">Мои бронирования</Link>
      
      {canManageRooms && (
        <Link to="/admin/rooms">Управление аудиториями</Link>
      )}
      
      {isAdmin && (
        <Link to="/admin/dashboard">Админ-панель</Link>
      )}
    </nav>
  )
}
```

### 3. Утилиты для проверки прав

```javascript
// utils/permissions.js
export const hasPermission = (user, permission) => {
  if (!user) return false
  
  const userRole = getUserRole(user)
  const permissions = ROLE_PERMISSIONS[userRole] || []
  
  return permissions.includes(permission)
}

export const checkBookingAccess = (user, bookingUserId, action) => {
  if (!user) return false
  
  const isOwnBooking = user.id === bookingUserId
  const isAdmin = user.isAdmin
  
  switch (action) {
    case 'view':
      return isOwnBooking || isAdmin
    case 'edit':
      return isOwnBooking || isAdmin
    case 'cancel':
      return isOwnBooking || isAdmin
    default:
      return false
  }
}

export const getUserRole = (user) => {
  if (!user) return 'guest'
  if (user.isAdmin) return 'admin'
  return 'user'
}
```

### 4. Защищенные маршруты

```jsx
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, requiredPermission, user }) {
  if (!user) {
    return <Navigate to="/login" />
  }
  
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return <Navigate to="/unauthorized" />
  }
  
  return children
}

// Использование
function App() {
  return (
    <Routes>
      <Route path="/bookings" element={
        <ProtectedRoute requiredPermission={Permission.VIEW_OWN_BOOKINGS}>
          <BookingsPage />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/*" element={
        <ProtectedRoute requiredPermission={Permission.ACCESS_ADMIN_PANEL}>
          <AdminPanel />
        </ProtectedRoute>
      } />
    </Routes>
  )
}
```

## Бизнес-правила и валидация

### 1. Ограничения бронирований

```python
def validate_booking_limits(user: User, db: Session) -> bool:
    """Проверяет лимиты бронирований для пользователя"""
    active_bookings = get_user_active_bookings(db, user.id)
    
    # Максимум 3 активных бронирования
    if len(active_bookings) >= 3:
        return False
    
    # Проверка на повторные бронирования в один день
    today_bookings = [b for b in active_bookings 
                     if b.start_time.date() == datetime.now().date()]
    if len(today_bookings) >= 2:
        return False
    
    return True
```

### 2. Временные ограничения

```python
def validate_booking_time(booking_data) -> bool:
    """Проверяет временные ограничения"""
    start_time = booking_data.start_time
    end_time = booking_data.end_time
    
    # Нельзя бронировать в прошлом
    if start_time < datetime.utcnow():
        return False
    
    # Максимум 4 часа подряд
    if (end_time - start_time) > timedelta(hours=4):
        return False
    
    # Рабочие часы: 9:00 - 21:00
    if start_time.hour < 9 or end_time.hour > 21:
        return False
    
    # Нельзя отменять менее чем за 2 часа
    if start_time - datetime.utcnow() < timedelta(hours=2):
        return False
    
    return True
```

### 3. Проверка конфликтов

```python
def check_booking_conflicts(db: Session, room_id: int, start_time: datetime, end_time: datetime) -> bool:
    """Проверяет конфликты времени для аудитории"""
    conflicting_bookings = db.query(Booking).filter(
        Booking.room_id == room_id,
        Booking.status == "confirmed",
        Booking.start_time < end_time,
        Booking.end_time > start_time
    ).count()
    
    return conflicting_bookings == 0
```

## Логирование и аудит

### 1. Логирование действий

```python
import logging
from datetime import datetime

def log_user_action(user: User, action: str, resource: str, details: dict = None):
    """Логирует действия пользователя для аудита"""
    logger = logging.getLogger('user_actions')
    
    log_data = {
        'timestamp': datetime.utcnow().isoformat(),
        'user_id': user.id,
        'user_email': user.email,
        'user_role': getUserRole(user),
        'action': action,
        'resource': resource,
        'details': details or {}
    }
    
    logger.info(f"User action: {json.dumps(log_data)}")
```

### 2. Мониторинг попыток доступа

```python
def log_access_attempt(user: User, resource: str, success: bool, reason: str = None):
    """Логирует попытки доступа к ресурсам"""
    logger = logging.getLogger('access_control')
    
    log_data = {
        'timestamp': datetime.utcnow().isoformat(),
        'user_id': user.id if user else None,
        'user_email': user.email if user else 'anonymous',
        'resource': resource,
        'success': success,
        'reason': reason
    }
    
    if success:
        logger.info(f"Access granted: {json.dumps(log_data)}")
    else:
        logger.warning(f"Access denied: {json.dumps(log_data)}")
```

## Тестирование ролевой модели

### 1. Unit тесты для прав

```python
import pytest
from ..utils.permissions import has_permission, Permission, UserRole

def test_user_permissions():
    # Создаем тестового пользователя
    user = User(id=1, email="test@example.com", is_admin=False)
    
    # Проверяем права обычного пользователя
    assert has_permission(user, Permission.VIEW_OWN_BOOKINGS)
    assert has_permission(user, Permission.CREATE_BOOKINGS)
    assert not has_permission(user, Permission.CREATE_ROOMS)
    assert not has_permission(user, Permission.ACCESS_ADMIN_PANEL)

def test_admin_permissions():
    # Создаем тестового администратора
    admin = User(id=2, email="admin@example.com", is_admin=True)
    
    # Проверяем права администратора
    assert has_permission(admin, Permission.VIEW_OWN_BOOKINGS)
    assert has_permission(admin, Permission.CREATE_BOOKINGS)
    assert has_permission(admin, Permission.CREATE_ROOMS)
    assert has_permission(admin, Permission.ACCESS_ADMIN_PANEL)

def test_guest_permissions():
    # Гость не имеет прав
    assert not has_permission(None, Permission.VIEW_OWN_BOOKINGS)
    assert not has_permission(None, Permission.CREATE_BOOKINGS)
```

### 2. Интеграционные тесты

```python
def test_booking_access_control(client, test_user, test_admin):
    # Обычный пользователь может создавать бронирования
    response = client.post("/api/bookings", 
                          json=booking_data,
                          headers={"Authorization": f"Bearer {test_user_token}"})
    assert response.status_code == 200
    
    # Гость не может создавать бронирования
    response = client.post("/api/bookings", json=booking_data)
    assert response.status_code == 401
    
    # Администратор может управлять аудиториями
    response = client.post("/api/rooms",
                          json=room_data,
                          headers={"Authorization": f"Bearer {test_admin_token}"})
    assert response.status_code == 200
    
    # Обычный пользователь не может управлять аудиториями
    response = client.post("/api/rooms",
                          json=room_data,
                          headers={"Authorization": f"Bearer {test_user_token}"})
    assert response.status_code == 403
```

## Расширение ролевой модели

### 1. Добавление новой роли

```python
# В permissions.py
class UserRole(str, Enum):
    GUEST = "guest"
    USER = "user"
    MODERATOR = "moderator"  # Новая роль
    ADMIN = "admin"

# Добавляем права для модератора
ROLE_PERMISSIONS[UserRole.MODERATOR] = [
    # Все права пользователя
    *ROLE_PERMISSIONS[UserRole.USER],
    
    # Дополнительные права модератора
    Permission.VIEW_ALL_BOOKINGS,
    Permission.DELETE_ALL_POSTS,
    Permission.VIEW_STATISTICS,
]
```

### 2. Добавление нового права

```python
# Добавляем новое право
class Permission(str, Enum):
    # ... существующие права
    MANAGE_EVENTS = "events:manage"  # Новое право

# Добавляем в роли
ROLE_PERMISSIONS[UserRole.ADMIN].append(Permission.MANAGE_EVENTS)
```

### 3. Динамические права

```python
def get_dynamic_permissions(user: User) -> List[Permission]:
    """Возвращает динамические права на основе данных пользователя"""
    permissions = get_user_permissions(user)
    
    # Премиум-пользователи получают дополнительные права
    if user.is_premium:
        permissions.extend([
            Permission.PRIORITY_BOOKING,
            Permission.EXTENDED_BOOKING_TIME,
        ])
    
    # Пользователи с высокой кармой получают бонусы
    if user.karma > 100:
        permissions.append(Permission.EARLY_BOOKING)
    
    return permissions
```

---

*Этот документ содержит практические примеры использования ролевой модели в вашем приложении коворкинга.*
