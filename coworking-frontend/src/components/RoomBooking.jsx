import { useState, useEffect } from 'react'
import apiService from '../services/api'
import { hasPermission, Permission, validateBookingTime, canCancelBooking } from '../utils/permissions'

const RoomBooking = ({ user, onBack }) => {
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [purpose, setPurpose] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [myBookings, setMyBookings] = useState([])

  useEffect(() => {
    loadRooms()
    loadMyBookings()
  }, [])

  useEffect(() => {
    if (selectedRoom && selectedDate) {
      loadRoomAvailability()
    }
  }, [selectedRoom, selectedDate])

  const loadRooms = async () => {
    try {
      const roomsData = await apiService.getRooms()
      setRooms(roomsData)
    } catch (error) {
      console.error('Ошибка загрузки аудиторий:', error)
      setError('Не удалось загрузить список аудиторий')
    }
  }

  const loadMyBookings = async () => {
    try {
      const bookings = await apiService.getMyBookings()
      setMyBookings(bookings)
    } catch (error) {
      console.error('Ошибка загрузки бронирований:', error)
    }
  }

  const loadRoomAvailability = async () => {
    if (!selectedRoom) return
    
    setIsLoading(true)
    try {
      const availability = await apiService.getRoomAvailability(selectedRoom.id, selectedDate)
      setAvailableSlots(availability.available_slots || [])
    } catch (error) {
      console.error('Ошибка загрузки доступности:', error)
      setError('Не удалось загрузить доступные слоты')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBooking = async () => {
    if (!selectedRoom || !selectedSlot || !purpose.trim()) {
      setError('Пожалуйста, заполните все поля')
      return
    }

    // Проверяем права на создание бронирования
    if (!hasPermission(user, Permission.CREATE_BOOKINGS)) {
      setError('У вас нет прав для создания бронирований')
      return
    }

    // Валидируем время бронирования
    const bookingData = {
      room_id: selectedRoom.id,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      purpose: purpose.trim()
    }

    const timeValidation = validateBookingTime(bookingData)
    if (!timeValidation.isValid) {
      setError(timeValidation.message)
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      await apiService.createBooking(bookingData)
      setSuccess('Аудитория успешно забронирована!')
      setPurpose('')
      setSelectedSlot(null)
      loadMyBookings()
      loadRoomAvailability()
    } catch (error) {
      setError(error.message || 'Ошибка при бронировании')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    const booking = myBookings.find(b => b.id === bookingId)
    if (!booking) {
      setError('Бронирование не найдено')
      return
    }

    // Проверяем, можно ли отменить бронирование
    const cancelValidation = canCancelBooking(booking)
    if (!cancelValidation.canCancel) {
      setError(cancelValidation.message)
      return
    }

    if (!confirm('Вы уверены, что хотите отменить бронирование?')) {
      return
    }

    try {
      await apiService.cancelBooking(bookingId)
      setSuccess('Бронирование отменено')
      loadMyBookings()
      loadRoomAvailability()
    } catch (error) {
      setError(error.message || 'Ошибка при отмене бронирования')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatSlotTime = (slot) => {
    const start = new Date(slot.start_time)
    const end = new Date(slot.end_time)
    return `${start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
  }

  const isBookingInPast = (booking) => {
    return new Date(booking.start_time) < new Date()
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
          <h1 className="text-3xl font-bold text-gray-900">Бронирование аудиторий</h1>
          <p className="text-gray-600 mt-2">Выберите аудиторию и время для бронирования</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Бронирование */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Новое бронирование</h2>
            
            {/* Выбор аудитории */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите аудиторию
              </label>
              <select
                value={selectedRoom?.id || ''}
                onChange={(e) => {
                  const room = rooms.find(r => r.id === parseInt(e.target.value))
                  setSelectedRoom(room)
                }}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Выберите аудиторию</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name} (вместимость: {room.capacity} чел.)
                  </option>
                ))}
              </select>
            </div>

            {/* Выбор даты */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите дату
              </label>
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Доступные слоты */}
            {selectedRoom && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Доступные слоты
                </label>
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 text-sm rounded-lg border transition-colors ${
                          selectedSlot?.start_time === slot.start_time
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {formatSlotTime(slot)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Нет доступных слотов на выбранную дату
                  </p>
                )}
              </div>
            )}

            {/* Цель бронирования */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Цель бронирования
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Например: Встреча команды, Презентация, Обучение"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Кнопка бронирования */}
            <button
              onClick={handleBooking}
              disabled={!selectedRoom || !selectedSlot || !purpose.trim() || isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Бронирование...' : 'Забронировать'}
            </button>
          </div>

          {/* Мои бронирования */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Мои бронирования</h2>
            
            {myBookings.length > 0 ? (
              <div className="space-y-4">
                {myBookings.map(booking => (
                  <div
                    key={booking.id}
                    className={`p-4 border rounded-lg ${
                      booking.status === 'cancelled' 
                        ? 'bg-gray-100 border-gray-300' 
                        : isBookingInPast(booking)
                        ? 'bg-yellow-50 border-yellow-300'
                        : 'bg-green-50 border-green-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{booking.room.name}</h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(booking.start_time)} - {formatDate(booking.end_time)}
                        </p>
                        {booking.purpose && (
                          <p className="text-sm text-gray-500 mt-1">{booking.purpose}</p>
                        )}
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                          booking.status === 'cancelled'
                            ? 'bg-gray-200 text-gray-700'
                            : isBookingInPast(booking)
                            ? 'bg-yellow-200 text-yellow-700'
                            : 'bg-green-200 text-green-700'
                        }`}>
                          {booking.status === 'cancelled' 
                            ? 'Отменено' 
                            : isBookingInPast(booking)
                            ? 'Завершено'
                            : 'Подтверждено'
                          }
                        </span>
                      </div>
                      {booking.status === 'confirmed' && !isBookingInPast(booking) && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Отменить
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                У вас пока нет бронирований
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomBooking
