import { useState } from 'react'
import Community from './Community'

const MainWindow = ({ user, onLogout, onGoToProfile }) => {
  const [activeTab, setActiveTab] = useState('dashboard')

  const tabs = [
    { id: 'dashboard', name: 'Панель управления', icon: '📊' },
    { id: 'booking', name: 'Бронирование', icon: '📅' },
    { id: 'events', name: 'События', icon: '🎉' },
    { id: 'community', name: 'Сообщество', icon: '👥' }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Панель управления</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Активные бронирования</h3>
                <p className="text-3xl font-bold text-blue-600">3</p>
                <p className="text-sm text-gray-600">На эту неделю</p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Часы работы</h3>
                <p className="text-3xl font-bold text-green-600">24</p>
                <p className="text-sm text-gray-600">На этой неделе</p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">События</h3>
                <p className="text-3xl font-bold text-blue-600">2</p>
                <p className="text-sm text-gray-600">Предстоящие</p>
              </div>
            </div>
          </div>
        )
      case 'booking':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Бронирование рабочих мест</h2>
            <div className="card">
              <p className="text-gray-600">Функция бронирования будет добавлена в следующих версиях.</p>
            </div>
          </div>
        )
      case 'events':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">События коворкинга</h2>
            <div className="card">
              <p className="text-gray-600">Календарь событий будет добавлен в следующих версиях.</p>
            </div>
          </div>
        )
      case 'community':
        return <Community user={user} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Коворкинг</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Привет, {user?.firstName}!
              </span>
              <button
                onClick={onGoToProfile}
                className="btn-secondary"
              >
                Профиль
              </button>
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainWindow
