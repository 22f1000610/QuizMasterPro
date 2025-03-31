// API Utility Functions
const api = {
  // Base API URL
  baseURL: '',
  
  // Headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // Set auth token for future requests
  setAuthToken(token) {
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`;
    }
  },
  
  // Clear auth token
  clearAuthToken() {
    delete this.headers['Authorization'];
  },
  
  // Helper method to handle API errors
  handleError(error) {
    console.error('API Error:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      
      // If the error is due to expired token or unauthorized, remove token and redirect to login
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        window.location.href = '/';
      }
      
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
    return Promise.reject(error);
  },
  
  // GET request
  get(url, params = {}) {
    let queryString = '';
    
    if (Object.keys(params).length > 0) {
      queryString = '?' + Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    }
    
    return axios.get(`${this.baseURL}${url}${queryString}`, { headers: this.headers })
      .catch(this.handleError);
  },
  
  // POST request
  post(url, data = {}) {
    return axios.post(`${this.baseURL}${url}`, data, { headers: this.headers })
      .catch(this.handleError);
  },
  
  // PUT request
  put(url, data = {}) {
    return axios.put(`${this.baseURL}${url}`, data, { headers: this.headers })
      .catch(this.handleError);
  },
  
  // DELETE request
  delete(url) {
    return axios.delete(`${this.baseURL}${url}`, { headers: this.headers })
      .catch(this.handleError);
  }
};
