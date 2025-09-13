import { useState, useEffect } from 'react'
import CreatePost from './CreatePost'
import PostList from './PostList'

const Community = ({ user }) => {
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Загружаем посты из localStorage при монтировании компонента
  useEffect(() => {
    const loadPosts = () => {
      try {
        const savedPosts = localStorage.getItem('coworking_posts')
        if (savedPosts) {
          setPosts(JSON.parse(savedPosts))
        }
      } catch (error) {
        console.error('Ошибка загрузки постов:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPosts()
  }, [])

  const handlePostCreated = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts])
  }

  const handlePostUpdate = (updatedPosts) => {
    setPosts(updatedPosts)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Сообщество</h2>
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка постов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Сообщество</h2>
        <div className="text-sm text-gray-600">
          {posts.length} {posts.length === 1 ? 'пост' : posts.length < 5 ? 'поста' : 'постов'}
        </div>
      </div>
      
      {/* Форма создания поста */}
      <CreatePost user={user} onPostCreated={handlePostCreated} />
      
      {/* Список постов */}
      <PostList posts={posts} onPostUpdate={handlePostUpdate} />
    </div>
  )
}

export default Community
