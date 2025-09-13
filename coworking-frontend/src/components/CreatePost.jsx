import { useState } from 'react'

const CreatePost = ({ user, onPostCreated }) => {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!content.trim()) {
      alert('Пожалуйста, введите текст поста')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Имитация API запроса
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newPost = {
        id: Date.now(),
        author: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          company: user.company || 'Не указано'
        },
        content: content.trim(),
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: []
      }
      
      // Сохраняем пост в localStorage
      const existingPosts = JSON.parse(localStorage.getItem('coworking_posts') || '[]')
      const updatedPosts = [newPost, ...existingPosts]
      localStorage.setItem('coworking_posts', JSON.stringify(updatedPosts))
      
      // Уведомляем родительский компонент о создании поста
      onPostCreated(newPost)
      
      // Очищаем форму
      setContent('')
      
    } catch (error) {
      console.error('Ошибка создания поста:', error)
      alert('Ошибка создания поста. Попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
          {user.firstName[0]}{user.lastName[0]}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-sm text-gray-600">{user.company || 'Не указано'}</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Поделитесь своими мыслями с сообществом..."
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          maxLength={500}
        />
        
        <div className="flex justify-between items-center mt-3">
          <span className="text-sm text-gray-500">
            {content.length}/500 символов
          </span>
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Публикация...' : 'Опубликовать'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreatePost
