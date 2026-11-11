import { API_BASE_URL } from '../../config/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('trade_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    if (res.status === 401 || (res.status === 403 && !path.startsWith('/admin'))) {
      this.handleUnauthorized();
    }
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error! status: ${res.status}`);
    }
    
    return res.json() as Promise<T>;
  }

  async post<T>(path: string, body: any): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    
    if (res.status === 401 || (res.status === 403 && !path.startsWith('/admin'))) {
      this.handleUnauthorized();
    }
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error! status: ${res.status}`);
    }
    
    return res.json() as Promise<T>;
  }

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    if (res.status === 401 || (res.status === 403 && !path.startsWith('/admin'))) {
      this.handleUnauthorized();
    }
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error! status: ${res.status}`);
    }
    
    return res.json() as Promise<T>;
  }

  private handleUnauthorized() {
    localStorage.removeItem('trade_token');
    localStorage.removeItem('trade_user');
    // If we're not on the login page already, redirect
    if (!window.location.pathname.endsWith('/login')) {
      window.location.href = '/login';
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;
