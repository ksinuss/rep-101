/**
 * Утилиты для работы с ролевой моделью и правами доступа
 */

// Роли пользователей
export const UserRole = {
  GUEST: 'guest',
  USER: 'user',
  ADMIN: 'admin'
}

// Права доступа
export const Permission = {
  // Аутентификация
  REGISTER: 'auth:register',
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  
  // Управление профилем
  VIEW_OWN_PROFILE: 'profile:view_own',
  EDIT_OWN_PROFILE: 'profile:edit_own',
  VIEW_OTHER_PROFILES: 'profile:view_other',
  EDIT_OTHER_PROFILES: 'profile:edit_other',
  
  // Аудитории
  VIEW_ROOMS: 'rooms:view',
  CREATE_ROOMS: 'rooms:create',
  EDIT_ROOMS: 'rooms:edit',
  DELETE_ROOMS: 'rooms:delete',
  
  // Бронирования
  CREATE_BOOKINGS: 'bookings:create',
  VIEW_OWN_BOOKINGS: 'bookings:view_own',
  VIEW_ALL_BOOKINGS: 'bookings:view_all',
  EDIT_OWN_BOOKINGS: 'bookings:edit_own',
  EDIT_ALL_BOOKINGS: 'bookings:edit_all',
  CANCEL_OWN_BOOKINGS: 'bookings:cancel_own',
  CANCEL_ALL_BOOKINGS: 'bookings:cancel_all',
  
  // Посещения
  CHECK_IN: 'visits:check_in',
  CHECK_OUT: 'visits:check_out',
  VIEW_OWN_VISITS: 'visits:view_own',
  VIEW_ALL_VISITS: 'visits:view_all',
  
  // Пожертвования
  CREATE_DONATIONS: 'donations:create',
  VIEW_OWN_DONATIONS: 'donations:view_own',
  VIEW_ALL_DONATIONS: 'donations:view_all',
  
  // Сообщество
  VIEW_POSTS: 'community:view_posts',
  CREATE_POSTS: 'community:create_posts',
  EDIT_OWN_POSTS: 'community:edit_own_posts',
  DELETE_OWN_POSTS: 'community:delete_own_posts',
  DELETE_ALL_POSTS: 'community:delete_all_posts',
  
  // Административные функции
  ACCESS_ADMIN_PANEL: 'admin:access_panel',
  VIEW_STATISTICS: 'admin:view_stats',
  MANAGE_USERS: 'admin:manage_users',
  SYSTEM_SETTINGS: 'admin:system_settings',
  EXPORT_DATA: 'admin:export_data'
}

// Матрица прав доступа
const ROLE_PERMISSIONS = {
  [UserRole.GUEST]: [
    Permission.REGISTER,
    Permission.LOGIN,
  ],
  
  [UserRole.USER]: [
    // Аутентификация
    Permission.LOGIN,
    Permission.LOGOUT,
    
    // Управление профилем
    Permission.VIEW_OWN_PROFILE,
    Permission.EDIT_OWN_PROFILE,
    
    // Аудитории
    Permission.VIEW_ROOMS,
    
    // Бронирования
    Permission.CREATE_BOOKINGS,
    Permission.VIEW_OWN_BOOKINGS,
    Permission.EDIT_OWN_BOOKINGS,
    Permission.CANCEL_OWN_BOOKINGS,
    
    // Посещения
    Permission.CHECK_IN,
    Permission.CHECK_OUT,
    Permission.VIEW_OWN_VISITS,
    
    // Пожертвования
    Permission.CREATE_DONATIONS,
    Permission.VIEW_OWN_DONATIONS,
    
    // Сообщество
    Permission.VIEW_POSTS,
    Permission.CREATE_POSTS,
    Permission.EDIT_OWN_POSTS,
    Permission.DELETE_OWN_POSTS,
  ],
  
  [UserRole.ADMIN]: [
    // Все права пользователя
    ...ROLE_PERMISSIONS[UserRole.USER],
    
    // Дополнительные права администратора
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

/**
 * Определяет роль пользователя на основе его данных
 * @param {Object|null} user - Объект пользователя
 * @returns {string} Роль пользователя
 */
export const getUserRole = (user) => {
  if (!user) {
    return UserRole.GUEST
  }
  
  if (user.isAdmin) {
    return UserRole.ADMIN
  }
  
  return UserRole.USER
}

/**
 * Проверяет, есть ли у пользователя указанное право
 * @param {Object|null} user - Объект пользователя
 * @param {string} permission - Право для проверки
 * @returns {boolean} Есть ли право у пользователя
 */
export const hasPermission = (user, permission) => {
  const userRole = getUserRole(user)
  const userPermissions = ROLE_PERMISSIONS[userRole] || []
  return userPermissions.includes(permission)
}

/**
 * Возвращает список всех прав пользователя
 * @param {Object|null} user - Объект пользователя
 * @returns {Array<string>} Список прав пользователя
 */
export const getUserPermissions = (user) => {
  const userRole = getUserRole(user)
  return ROLE_PERMISSIONS[userRole] || []
}

/**
 * Проверяет, является ли пользователь администратором
 * @param {Object|null} user - Объект пользователя
 * @returns {boolean} Является ли пользователь администратором
 */
export const isAdmin = (user) => {
  return user && user.isAdmin === true
}

/**
 * Проверяет, является ли пользователь владельцем ресурса или администратором
 * @param {Object|null} user - Объект пользователя
 * @param {number} resourceUserId - ID пользователя-владельца ресурса
 * @returns {boolean} Может ли пользователь управлять ресурсом
 */
export const isOwnerOrAdmin = (user, resourceUserId) => {
  if (!user) return false
  return user.id === resourceUserId || isAdmin(user)
}

/**
 * Проверяет доступ пользователя к бронированию
 * @param {Object|null} user - Объект пользователя
 * @param {number} bookingUserId - ID пользователя-владельца бронирования
 * @param {string} action - Действие (view, edit, cancel)
 * @returns {boolean} Может ли пользователь выполнить действие
 */
export const checkBookingAccess = (user, bookingUserId, action) => {
  if (!user) return false
  
  const isOwnBooking = user.id === bookingUserId
  const isAdminUser = isAdmin(user)
  
  switch (action) {
    case 'view':
      return (isOwnBooking && hasPermission(user, Permission.VIEW_OWN_BOOKINGS)) ||
             hasPermission(user, Permission.VIEW_ALL_BOOKINGS)
    case 'edit':
      return (isOwnBooking && hasPermission(user, Permission.EDIT_OWN_BOOKINGS)) ||
             hasPermission(user, Permission.EDIT_ALL_BOOKINGS)
    case 'cancel':
      return (isOwnBooking && hasPermission(user, Permission.CANCEL_OWN_BOOKINGS)) ||
             hasPermission(user, Permission.CANCEL_ALL_BOOKINGS)
    default:
      return false
  }
}

/**
 * Проверяет доступ пользователя к посту
 * @param {Object|null} user - Объект пользователя
 * @param {number} postUserId - ID пользователя-автора поста
 * @param {string} action - Действие (view, edit, delete)
 * @returns {boolean} Может ли пользователь выполнить действие
 */
export const checkPostAccess = (user, postUserId, action) => {
  if (!user) return false
  
  const isOwnPost = user.id === postUserId
  const isAdminUser = isAdmin(user)
  
  switch (action) {
    case 'view':
      return hasPermission(user, Permission.VIEW_POSTS)
    case 'edit':
      return (isOwnPost && hasPermission(user, Permission.EDIT_OWN_POSTS)) ||
             isAdminUser
    case 'delete':
      return (isOwnPost && hasPermission(user, Permission.DELETE_OWN_POSTS)) ||
             hasPermission(user, Permission.DELETE_ALL_POSTS)
    default:
      return false
  }
}

/**
 * Проверяет доступ пользователя к аудитории
 * @param {Object|null} user - Объект пользователя
 * @param {string} action - Действие (view, create, edit, delete)
 * @returns {boolean} Может ли пользователь выполнить действие
 */
export const checkRoomAccess = (user, action) => {
  if (!user) return false
  
  switch (action) {
    case 'view':
      return hasPermission(user, Permission.VIEW_ROOMS)
    case 'create':
      return hasPermission(user, Permission.CREATE_ROOMS)
    case 'edit':
      return hasPermission(user, Permission.EDIT_ROOMS)
    case 'delete':
      return hasPermission(user, Permission.DELETE_ROOMS)
    default:
      return false
  }
}

/**
 * Проверяет временные ограничения для бронирования
 * @param {Object} booking - Данные бронирования
 * @returns {Object} Результат проверки с сообщением об ошибке
 */
export const validateBookingTime = (booking) => {
  const now = new Date()
  const startTime = new Date(booking.start_time)
  const endTime = new Date(booking.end_time)
  
  // Нельзя бронировать в прошлом
  if (startTime < now) {
    return {
      isValid: false,
      message: 'Нельзя бронировать аудиторию в прошлом'
    }
  }
  
  // Время окончания должно быть позже времени начала
  if (endTime <= startTime) {
    return {
      isValid: false,
      message: 'Время окончания должно быть позже времени начала'
    }
  }
  
  // Максимум 4 часа подряд
  const durationHours = (endTime - startTime) / (1000 * 60 * 60)
  if (durationHours > 4) {
    return {
      isValid: false,
      message: 'Максимальная продолжительность бронирования - 4 часа'
    }
  }
  
  // Рабочие часы: 9:00 - 21:00
  if (startTime.getHours() < 9 || endTime.getHours() > 21) {
    return {
      isValid: false,
      message: 'Бронирование возможно только с 9:00 до 21:00'
    }
  }
  
  return { isValid: true }
}

/**
 * Проверяет, можно ли отменить бронирование
 * @param {Object} booking - Данные бронирования
 * @returns {Object} Результат проверки с сообщением об ошибке
 */
export const canCancelBooking = (booking) => {
  const now = new Date()
  const startTime = new Date(booking.start_time)
  
  // Нельзя отменять в прошлом
  if (startTime < now) {
    return {
      canCancel: false,
      message: 'Нельзя отменить прошедшее бронирование'
    }
  }
  
  // Нельзя отменять менее чем за 2 часа до начала
  const timeUntilStart = startTime - now
  const twoHours = 2 * 60 * 60 * 1000 // 2 часа в миллисекундах
  
  if (timeUntilStart < twoHours) {
    return {
      canCancel: false,
      message: 'Нельзя отменить бронирование менее чем за 2 часа до начала'
    }
  }
  
  return { canCancel: true }
}

/**
 * Форматирует роль пользователя для отображения
 * @param {string} role - Роль пользователя
 * @returns {string} Отформатированное название роли
 */
export const formatUserRole = (role) => {
  const roleNames = {
    [UserRole.GUEST]: 'Гость',
    [UserRole.USER]: 'Пользователь',
    [UserRole.ADMIN]: 'Администратор'
  }
  
  return roleNames[role] || 'Неизвестная роль'
}

/**
 * Получает цвет для отображения роли
 * @param {string} role - Роль пользователя
 * @returns {string} CSS класс для цвета
 */
export const getRoleColor = (role) => {
  const roleColors = {
    [UserRole.GUEST]: 'text-gray-500',
    [UserRole.USER]: 'text-blue-600',
    [UserRole.ADMIN]: 'text-red-600'
  }
  
  return roleColors[role] || 'text-gray-500'
}

/**
 * Проверяет, может ли пользователь видеть административные элементы
 * @param {Object|null} user - Объект пользователя
 * @returns {boolean} Может ли видеть админ-элементы
 */
export const canSeeAdminElements = (user) => {
  return hasPermission(user, Permission.ACCESS_ADMIN_PANEL)
}

/**
 * Проверяет, может ли пользователь управлять аудиториями
 * @param {Object|null} user - Объект пользователя
 * @returns {boolean} Может ли управлять аудиториями
 */
export const canManageRooms = (user) => {
  return hasPermission(user, Permission.CREATE_ROOMS) ||
         hasPermission(user, Permission.EDIT_ROOMS) ||
         hasPermission(user, Permission.DELETE_ROOMS)
}

/**
 * Проверяет, может ли пользователь просматривать статистику
 * @param {Object|null} user - Объект пользователя
 * @returns {boolean} Может ли просматривать статистику
 */
export const canViewStatistics = (user) => {
  return hasPermission(user, Permission.VIEW_STATISTICS)
}

/**
 * Получает список доступных действий для пользователя
 * @param {Object|null} user - Объект пользователя
 * @returns {Array<string>} Список доступных действий
 */
export const getAvailableActions = (user) => {
  const permissions = getUserPermissions(user)
  const actions = []
  
  if (permissions.includes(Permission.CREATE_BOOKINGS)) {
    actions.push('create_booking')
  }
  
  if (permissions.includes(Permission.CREATE_ROOMS)) {
    actions.push('manage_rooms')
  }
  
  if (permissions.includes(Permission.ACCESS_ADMIN_PANEL)) {
    actions.push('admin_panel')
  }
  
  if (permissions.includes(Permission.VIEW_STATISTICS)) {
    actions.push('view_statistics')
  }
  
  return actions
}

export default {
  UserRole,
  Permission,
  getUserRole,
  hasPermission,
  getUserPermissions,
  isAdmin,
  isOwnerOrAdmin,
  checkBookingAccess,
  checkPostAccess,
  checkRoomAccess,
  validateBookingTime,
  canCancelBooking,
  formatUserRole,
  getRoleColor,
  canSeeAdminElements,
  canManageRooms,
  canViewStatistics,
  getAvailableActions
}
