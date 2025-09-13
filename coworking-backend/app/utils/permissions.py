"""
Модуль для управления правами доступа и ролевой моделью
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from enum import Enum

from ..models import User
from ..schemas import UserResponse

class UserRole(str, Enum):
    """Роли пользователей в системе"""
    GUEST = "guest"
    USER = "user"
    ADMIN = "admin"

class Permission(str, Enum):
    """Права доступа в системе"""
    # Аутентификация
    REGISTER = "auth:register"
    LOGIN = "auth:login"
    LOGOUT = "auth:logout"
    
    # Управление профилем
    VIEW_OWN_PROFILE = "profile:view_own"
    EDIT_OWN_PROFILE = "profile:edit_own"
    VIEW_OTHER_PROFILES = "profile:view_other"
    EDIT_OTHER_PROFILES = "profile:edit_other"
    
    # Аудитории
    VIEW_ROOMS = "rooms:view"
    CREATE_ROOMS = "rooms:create"
    EDIT_ROOMS = "rooms:edit"
    DELETE_ROOMS = "rooms:delete"
    
    # Бронирования
    CREATE_BOOKINGS = "bookings:create"
    VIEW_OWN_BOOKINGS = "bookings:view_own"
    VIEW_ALL_BOOKINGS = "bookings:view_all"
    EDIT_OWN_BOOKINGS = "bookings:edit_own"
    EDIT_ALL_BOOKINGS = "bookings:edit_all"
    CANCEL_OWN_BOOKINGS = "bookings:cancel_own"
    CANCEL_ALL_BOOKINGS = "bookings:cancel_all"
    
    # Посещения
    CHECK_IN = "visits:check_in"
    CHECK_OUT = "visits:check_out"
    VIEW_OWN_VISITS = "visits:view_own"
    VIEW_ALL_VISITS = "visits:view_all"
    
    # Пожертвования
    CREATE_DONATIONS = "donations:create"
    VIEW_OWN_DONATIONS = "donations:view_own"
    VIEW_ALL_DONATIONS = "donations:view_all"
    
    # Сообщество
    VIEW_POSTS = "community:view_posts"
    CREATE_POSTS = "community:create_posts"
    EDIT_OWN_POSTS = "community:edit_own_posts"
    DELETE_OWN_POSTS = "community:delete_own_posts"
    DELETE_ALL_POSTS = "community:delete_all_posts"
    
    # Административные функции
    ACCESS_ADMIN_PANEL = "admin:access_panel"
    VIEW_STATISTICS = "admin:view_stats"
    MANAGE_USERS = "admin:manage_users"
    SYSTEM_SETTINGS = "admin:system_settings"
    EXPORT_DATA = "admin:export_data"

# Матрица прав доступа: роль -> список разрешенных прав
ROLE_PERMISSIONS = {
    UserRole.GUEST: [
        Permission.REGISTER,
        Permission.LOGIN,
    ],
    
    UserRole.USER: [
        # Аутентификация
        Permission.LOGIN,
        Permission.LOGOUT,
        
        # Управление профилем
        Permission.VIEW_OWN_PROFILE,
        Permission.EDIT_OWN_PROFILE,
        
        # Аудитории
        Permission.VIEW_ROOMS,
        
        # Бронирования
        Permission.CREATE_BOOKINGS,
        Permission.VIEW_OWN_BOOKINGS,
        Permission.EDIT_OWN_BOOKINGS,
        Permission.CANCEL_OWN_BOOKINGS,
        
        # Посещения
        Permission.CHECK_IN,
        Permission.CHECK_OUT,
        Permission.VIEW_OWN_VISITS,
        
        # Пожертвования
        Permission.CREATE_DONATIONS,
        Permission.VIEW_OWN_DONATIONS,
        
        # Сообщество
        Permission.VIEW_POSTS,
        Permission.CREATE_POSTS,
        Permission.EDIT_OWN_POSTS,
        Permission.DELETE_OWN_POSTS,
    ],
    
    UserRole.ADMIN: [
        # Все права пользователя
        *ROLE_PERMISSIONS.get(UserRole.USER, []),
        
        # Дополнительные права администратора
        Permission.VIEW_OTHER_PROFILES,
        Permission.EDIT_OTHER_PROFILES,
        
        Permission.CREATE_ROOMS,
        Permission.EDIT_ROOMS,
        Permission.DELETE_ROOMS,
        
        Permission.VIEW_ALL_BOOKINGS,
        Permission.EDIT_ALL_BOOKINGS,
        Permission.CANCEL_ALL_BOOKINGS,
        
        Permission.VIEW_ALL_VISITS,
        
        Permission.VIEW_ALL_DONATIONS,
        
        Permission.DELETE_ALL_POSTS,
        
        Permission.ACCESS_ADMIN_PANEL,
        Permission.VIEW_STATISTICS,
        Permission.MANAGE_USERS,
        Permission.SYSTEM_SETTINGS,
        Permission.EXPORT_DATA,
    ]
}

def get_user_role(user: Optional[User]) -> UserRole:
    """
    Определяет роль пользователя на основе его данных
    """
    if user is None:
        return UserRole.GUEST
    
    if user.is_admin:
        return UserRole.ADMIN
    
    return UserRole.USER

def has_permission(user: Optional[User], permission: Permission) -> bool:
    """
    Проверяет, есть ли у пользователя указанное право
    """
    user_role = get_user_role(user)
    user_permissions = ROLE_PERMISSIONS.get(user_role, [])
    return permission in user_permissions

def require_permission(permission: Permission):
    """
    Декоратор для проверки прав доступа к endpoint'у
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Ищем current_user в аргументах
            current_user = None
            for arg in args:
                if isinstance(arg, User) or (hasattr(arg, 'is_admin')):
                    current_user = arg
                    break
            
            for key, value in kwargs.items():
                if key == 'current_user' or (hasattr(value, 'is_admin')):
                    current_user = value
                    break
            
            if not has_permission(current_user, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission '{permission}' required"
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

def check_room_access(user: Optional[User], room_id: int, action: str) -> bool:
    """
    Проверяет доступ пользователя к аудитории для конкретного действия
    """
    if action == "view":
        return has_permission(user, Permission.VIEW_ROOMS)
    elif action == "create":
        return has_permission(user, Permission.CREATE_ROOMS)
    elif action == "edit":
        return has_permission(user, Permission.EDIT_ROOMS)
    elif action == "delete":
        return has_permission(user, Permission.DELETE_ROOMS)
    
    return False

def check_booking_access(user: Optional[User], booking_user_id: int, action: str) -> bool:
    """
    Проверяет доступ пользователя к бронированию для конкретного действия
    """
    if not user:
        return False
    
    # Пользователь может управлять своими бронированиями
    is_own_booking = user.id == booking_user_id
    
    if action == "view":
        return (is_own_booking and has_permission(user, Permission.VIEW_OWN_BOOKINGS)) or \
               has_permission(user, Permission.VIEW_ALL_BOOKINGS)
    elif action == "edit":
        return (is_own_booking and has_permission(user, Permission.EDIT_OWN_BOOKINGS)) or \
               has_permission(user, Permission.EDIT_ALL_BOOKINGS)
    elif action == "cancel":
        return (is_own_booking and has_permission(user, Permission.CANCEL_OWN_BOOKINGS)) or \
               has_permission(user, Permission.CANCEL_ALL_BOOKINGS)
    
    return False

def check_post_access(user: Optional[User], post_user_id: int, action: str) -> bool:
    """
    Проверяет доступ пользователя к посту для конкретного действия
    """
    if not user:
        return False
    
    # Пользователь может управлять своими постами
    is_own_post = user.id == post_user_id
    
    if action == "view":
        return has_permission(user, Permission.VIEW_POSTS)
    elif action == "create":
        return has_permission(user, Permission.CREATE_POSTS)
    elif action == "edit":
        return (is_own_post and has_permission(user, Permission.EDIT_OWN_POSTS)) or \
               has_permission(user, Permission.DELETE_ALL_POSTS)  # Админ может редактировать любые посты
    elif action == "delete":
        return (is_own_post and has_permission(user, Permission.DELETE_OWN_POSTS)) or \
               has_permission(user, Permission.DELETE_ALL_POSTS)
    
    return False

def get_user_permissions(user: Optional[User]) -> List[Permission]:
    """
    Возвращает список всех прав пользователя
    """
    user_role = get_user_role(user)
    return ROLE_PERMISSIONS.get(user_role, [])

def is_admin(user: Optional[User]) -> bool:
    """
    Проверяет, является ли пользователь администратором
    """
    return user is not None and user.is_admin

def is_owner_or_admin(user: Optional[User], resource_user_id: int) -> bool:
    """
    Проверяет, является ли пользователь владельцем ресурса или администратором
    """
    if not user:
        return False
    
    return user.id == resource_user_id or is_admin(user)

# Утилиты для валидации бизнес-правил
def validate_booking_limits(user: User, db: Session) -> bool:
    """
    Проверяет лимиты бронирований для пользователя
    """
    from ..crud import get_user_bookings
    
    # Получаем активные бронирования пользователя
    bookings = get_user_bookings(db, user.id)
    active_bookings = [b for b in bookings if b.status == "confirmed"]
    
    # Максимум 3 активных бронирования
    return len(active_bookings) < 3

def validate_booking_time(booking_data) -> bool:
    """
    Проверяет временные ограничения для бронирования
    """
    from datetime import datetime, timedelta
    
    start_time = booking_data.start_time
    end_time = booking_data.end_time
    
    # Нельзя бронировать в прошлом
    if start_time < datetime.utcnow():
        return False
    
    # Максимум 4 часа подряд
    duration = end_time - start_time
    if duration > timedelta(hours=4):
        return False
    
    # Рабочие часы: 9:00 - 21:00
    if start_time.hour < 9 or end_time.hour > 21:
        return False
    
    return True

def can_cancel_booking(user: User, booking) -> bool:
    """
    Проверяет, может ли пользователь отменить бронирование
    """
    from datetime import datetime, timedelta
    
    # Проверяем права доступа
    if not check_booking_access(user, booking.user_id, "cancel"):
        return False
    
    # Нельзя отменять в прошлом
    if booking.start_time < datetime.utcnow():
        return False
    
    # Нельзя отменять менее чем за 2 часа до начала
    time_until_start = booking.start_time - datetime.utcnow()
    if time_until_start < timedelta(hours=2):
        return False
    
    return True
