import { useState, useEffect } from 'react'

const Profile = ({ user, onLogout, onUpdateProfile, onBackToMain }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || '',
    position: user?.position || ''
  })
  const [errors, setErrors] = useState({})

  // Обновляем форму при изменении пользователя
  useEffect(() => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: user?.company || '',
      position: user?.position || ''
    })
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Имя обязательно'
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Фамилия обязательна'
    }
    
    if (!formData.email) {
      newErrors.email = 'Email обязателен'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный email'
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Телефон обязателен'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateForm()) {
      onUpdateProfile(formData)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: user?.company || '',
      position: user?.position || ''
    })
    setErrors({})
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  <p className="text-gray-600">{user?.email}</p>
                </div>
              </div>
              <div className="flex space-x-3">
                {!isEditing ? (
                  <>
                    <button
                      onClick={onBackToMain}
                      className="btn-secondary"
                    >
                      Главная
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn-secondary"
                    >
                      Редактировать
                    </button>
                  </>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancel}
                      className="btn-secondary"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="btn-primary"
                    >
                      Сохранить
                    </button>
                  </div>
                )}
                <button
                  onClick={onLogout}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Выйти
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Личная информация
              </h2>
              
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        Имя
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={`mt-1 input-field ${errors.firstName ? 'border-red-500' : ''}`}
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Фамилия
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={`mt-1 input-field ${errors.lastName ? 'border-red-500' : ''}`}
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`mt-1 input-field ${errors.email ? 'border-red-500' : ''}`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Телефон
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`mt-1 input-field ${errors.phone ? 'border-red-500' : ''}`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                      Компания
                    </label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      value={formData.company}
                      onChange={handleChange}
                      className="mt-1 input-field"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                      Должность
                    </label>
                    <input
                      id="position"
                      name="position"
                      type="text"
                      value={formData.position}
                      onChange={handleChange}
                      className="mt-1 input-field"
                    />
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Имя</label>
                      <p className="mt-1 text-sm text-gray-900">{user?.firstName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Фамилия</label>
                      <p className="mt-1 text-sm text-gray-900">{user?.lastName}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Телефон</label>
                    <p className="mt-1 text-sm text-gray-900">{user?.phone}</p>
                  </div>
                  
                  {user?.company && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Компания</label>
                      <p className="mt-1 text-sm text-gray-900">{user.company}</p>
                    </div>
                  )}
                  
                  {user?.position && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Должность</label>
                      <p className="mt-1 text-sm text-gray-900">{user.position}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Membership Status */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Статус членства
              </h3>
              <div className="flex items-center">
                <div className="h-3 w-3 bg-green-400 rounded-full mr-3"></div>
                <span className="text-sm text-gray-900">Активный участник</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Член коворкинга с {user?.joinDate ? new Date(user.joinDate).toLocaleDateString('ru-RU') : new Date().toLocaleDateString('ru-RU')}
              </p>
              {user?.lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Последнее обновление: {new Date(user.lastUpdated).toLocaleString('ru-RU')}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Быстрые действия
              </h3>
              <div className="space-y-3">
                <button className="w-full btn-secondary text-left">
                  Забронировать рабочее место
                </button>
                <button className="w-full btn-secondary text-left">
                  Посмотреть расписание
                </button>
                <button className="w-full btn-secondary text-left">
                  Связаться с поддержкой
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Последняя активность
              </h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="text-gray-900">Вход в систему</p>
                  <p className="text-gray-600">Сегодня в {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                {user?.lastUpdated && (
                  <div className="text-sm">
                    <p className="text-gray-900">Обновление профиля</p>
                    <p className="text-gray-600">
                      {new Date(user.lastUpdated).toLocaleDateString('ru-RU')} в {new Date(user.lastUpdated).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
