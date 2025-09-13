import { useState } from 'react'

const PostList = ({ posts, onPostUpdate }) => {
  const [likedPosts, setLikedPosts] = useState(new Set())

  const handleLike = (postId) => {
    const isLiked = likedPosts.has(postId)
    const updatedLikedPosts = new Set(likedPosts)
    
    if (isLiked) {
      updatedLikedPosts.delete(postId)
    } else {
      updatedLikedPosts.add(postId)
    }
    
    setLikedPosts(updatedLikedPosts)
    
    // Обновляем количество лайков в localStorage
    const existingPosts = JSON.parse(localStorage.getItem('coworking_posts') || '[]')
    const updatedPosts = existingPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: isLiked ? post.likes - 1 : post.likes + 1
        }
      }
      return post
    })
    
    localStorage.setItem('coworking_posts', JSON.stringify(updatedPosts))
    onPostUpdate(updatedPosts)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'только что'
    } else if (diffInHours < 24) {
      return `${diffInHours} ч. назад`
    } else if (diffInHours < 48) {
      return 'вчера'
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  if (posts.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📝</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Пока нет постов</h3>
        <p className="text-gray-600">Станьте первым, кто поделится чем-то интересным с сообществом!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="card">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {post.author.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
              <p className="text-sm text-gray-600">{post.author.company}</p>
            </div>
            <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
          </div>
          
          <div className="flex items-center space-x-6 pt-3 border-t border-gray-100">
            <button
              onClick={() => handleLike(post.id)}
              className={`flex items-center space-x-2 text-sm transition-colors duration-200 ${
                likedPosts.has(post.id)
                  ? 'text-red-600 hover:text-red-700'
                  : 'text-gray-600 hover:text-red-600'
              }`}
            >
              <span className="text-lg">
                {likedPosts.has(post.id) ? '❤️' : '🤍'}
              </span>
              <span>{post.likes}</span>
            </button>
            
            <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200">
              <span className="text-lg">💬</span>
              <span>{post.comments.length}</span>
            </button>
            
            <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200">
              <span className="text-lg">📤</span>
              <span>Поделиться</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default PostList
