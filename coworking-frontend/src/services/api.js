// API сервис для взаимодействия с backend
const API_BASE_URL = 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  // Установка токена авторизации
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // Получение заголовков для запросов
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Базовый метод для HTTP запросов
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.includeAuth !== false),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      // Если ответ пустой, возвращаем null
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // GET запрос
  async get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  // POST запрос
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // PUT запрос
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // DELETE запрос
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }

  // Аутентификация
  async login(email, password) {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      body: formData,
      headers: {
        // Не устанавливаем Content-Type для FormData
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login failed');
    }

    const data = await response.json();
    this.setToken(data.access_token);
    return data;
  }

  async register(userData) {
    return this.post('/auth/register', userData, { includeAuth: false });
  }

  async logout() {
    this.setToken(null);
  }

  // Пользователи
  async getCurrentUser() {
    return this.get('/users/me');
  }

  async getUser(userId) {
    return this.get(`/users/${userId}`);
  }

  async getUserVisits(userId) {
    return this.get(`/users/${userId}/visits`);
  }

  async getUserDonations(userId) {
    return this.get(`/users/${userId}/donations`);
  }

  // Посещения
  async createVisit() {
    return this.post('/visits/check-in');
  }

  async endVisit(visitId) {
    return this.post(`/visits/${visitId}/check-out`);
  }

  // Пожертвования
  async createDonation(donationData) {
    return this.post('/donations', donationData);
  }

  // Админ функции
  async getDashboardStats() {
    return this.get('/admin/dashboard');
  }

  async getAllUsers() {
    return this.get('/admin/users');
  }

  // Health check
  async healthCheck() {
    return this.get('/health', { includeAuth: false });
  }
}

// Создаем единственный экземпляр API сервиса
const apiService = new ApiService();

export default apiService;
