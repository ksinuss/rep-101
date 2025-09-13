import { useState, useEffect } from 'react'
import Login from './components/Login'
import Register from './components/Register'
import Profile from './components/Profile'
import MainWindow from './components/MainWindow'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('login') // 'login', 'register', 'profile', 'main'
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Проверяем, есть ли сохраненный пользователь в localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('coworking_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      setCurrentView('main')
    }
  }, [])

  const handleLogin = async (loginData) => {
    setIsLoading(true)
    try {
      // Имитация API запроса
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Проверяем, есть ли сохраненные данные пользователя
      const savedUser = localStorage.getItem('coworking_user')
      let userData
      
      if (savedUser) {
        // Используем сохраненные данные
        userData = JSON.parse(savedUser)
        userData.email = loginData.email // Обновляем email на случай, если он изменился
      } else {
        // Создаем нового пользователя только если нет сохраненных данных
        userData = {
          id: Date.now(),
          firstName: 'Иван',
          lastName: 'Иванов',
          email: loginData.email,
          phone: '+7 (999) 123-45-67',
          company: 'ООО "Пример"',
          position: 'Frontend Developer',
          joinDate: new Date().toISOString()
        }
      }
      
      setUser(userData)
      localStorage.setItem('coworking_user', JSON.stringify(userData))
      setCurrentView('main')
    } catch (error) {
      console.error('Ошибка входа:', error)
      alert('Ошибка входа. Попробуйте еще раз.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (registerData) => {
    setIsLoading(true)
    try {
      // Имитация API запроса
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Создаем пользователя
      const userData = {
        id: Date.now(),
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        email: registerData.email,
        phone: registerData.phone,
        company: registerData.company || '',
        position: registerData.position || '',
        joinDate: new Date().toISOString()
      }
      
      setUser(userData)
      localStorage.setItem('coworking_user', JSON.stringify(userData))
      setCurrentView('profile')
    } catch (error) {
      console.error('Ошибка регистрации:', error)
      alert('Ошибка регистрации. Попробуйте еще раз.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('coworking_user')
    setCurrentView('login')
  }

  const handleUpdateProfile = async (profileData) => {
    setIsLoading(true)
    try {
      // Имитация API запроса
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Создаем обновленный объект пользователя
      const updatedUser = { 
        ...user, 
        ...profileData,
        lastUpdated: new Date().toISOString() // Добавляем время последнего обновления
      }
      
      // Обновляем состояние
      setUser(updatedUser)
      
      // Сохраняем в localStorage
      localStorage.setItem('coworking_user', JSON.stringify(updatedUser))
      
      console.log('Профиль обновлен:', updatedUser)
    } catch (error) {
      console.error('Ошибка обновления профиля:', error)
      alert('Ошибка обновления профиля. Попробуйте еще раз.')
    } finally {
      setIsLoading(false)
    }
  }

  const switchToRegister = () => setCurrentView('register')
  const switchToLogin = () => setCurrentView('login')
  const switchToProfile = () => setCurrentView('profile')
  const switchToMain = () => setCurrentView('main')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      {currentView === 'login' && (
        <Login 
          onLogin={handleLogin} 
          onSwitchToRegister={switchToRegister}
        />
      )}
      
      {currentView === 'register' && (
        <Register 
          onRegister={handleRegister} 
          onSwitchToLogin={switchToLogin}
        />
      )}
      
      {currentView === 'profile' && user && (
        <Profile 
          user={user}
          onLogout={handleLogout}
          onUpdateProfile={handleUpdateProfile}
          onBackToMain={switchToMain}
        />
      )}
      
      {currentView === 'main' && user && (
        <MainWindow 
          user={user}
          onLogout={handleLogout}
          onGoToProfile={switchToProfile}
        />
      )}
    </div>
  )
}

export default App
