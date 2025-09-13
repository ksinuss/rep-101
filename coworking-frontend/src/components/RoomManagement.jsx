import { useState, useEffect } from 'react'
import apiService from '../services/api'
import { hasPermission, Permission, canManageRooms } from '../utils/permissions'

const RoomManagement = ({ user, onBack }) => {
  const [rooms, setRooms] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '',
    equipment: ''
  })

  useEffect(() => {
    if (user?.isAdmin) {
      loadRooms()
    }
  }, [user])

  const loadRooms = async () => {
    setIsLoading(true)
    try {
      const roomsData = await apiService.getRooms()
      setRooms(roomsData)
    } catch (error) {
      console.error('Ошибка загрузки аудиторий:', error)
      setError('Не удалось загрузить список аудиторий')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const roomData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        capacity: parseInt(formData.capacity),
        equipment: formData.equipment.trim() || null
      }

      if (editingRoom) {
        await apiService.updateRoom(editingRoom.id, roomData)
        setSuccess('Аудитория успешно обновлена!')
      } else {
        await apiService.createRoom(roomData)
        setSuccess('Аудитория успешно создана!')
      }

      setFormData({ name: '', description: '', capacity: '', equipment: '' })
      setEditingRoom(null)
      setShowAddForm(false)
      loadRooms()
    } catch (error) {
      setError(error.message || 'Ошибка при сохранении аудитории')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (room) => {
    setEditingRoom(room)
    setFormData({
      name: room.name,
      description: room.description || '',
      capacity: room.capacity.toString(),
      equipment: room.equipment || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (roomId) => {
    if (!confirm('Вы уверены, что хотите удалить эту аудиторию?')) {
      return
    }

    try {
      await apiService.deleteRoom(roomId)
      setSuccess('Аудитория успешно удалена!')
      loadRooms()
    } catch (error) {
      setError(error.message || 'Ошибка при удалении аудитории')
    }
  }

  const handleCancel = () => {
    setFormData({ name: '', description: '', capacity: '', equipment: '' })
    setEditingRoom(null)
    setShowAddForm(false)
  }

  if (!canManageRooms(user)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Доступ запрещен</h1>
          <p className="text-gray-600 mb-4">У вас нет прав для управления аудиториями</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Назад
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="mb-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Назад
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Управление аудиториями</h1>
              <p className="text-gray-600 mt-2">Создание и редактирование аудиторий для бронирования</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Добавить аудиторию
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Форма добавления/редактирования */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingRoom ? 'Редактировать аудиторию' : 'Добавить новую аудиторию'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название аудитории *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Например: Конференц-зал А"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Вместимость *
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                    min="1"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Количество мест"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Описание аудитории, особенности..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Оборудование
                </label>
                <input
                  type="text"
                  value={formData.equipment}
                  onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Например: Проектор, Доска, Микрофон"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {isLoading ? 'Сохранение...' : (editingRoom ? 'Обновить' : 'Создать')}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Список аудиторий */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Список аудиторий</h2>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Загрузка...</p>
            </div>
          ) : rooms.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {rooms.map(room => (
                <div key={room.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{room.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          room.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {room.is_active ? 'Активна' : 'Неактивна'}
                        </span>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Вместимость:</span> {room.capacity} чел.
                        </div>
                        {room.description && (
                          <div className="md:col-span-2">
                            <span className="font-medium">Описание:</span> {room.description}
                          </div>
                        )}
                        {room.equipment && (
                          <div className="md:col-span-3">
                            <span className="font-medium">Оборудование:</span> {room.equipment}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(room)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(room.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>Аудитории не найдены</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Создать первую аудиторию
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoomManagement
