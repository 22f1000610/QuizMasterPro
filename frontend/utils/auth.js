// Authentication Utility Functions
const auth = {
  // Save user data to localStorage
  saveUserData(token, userData) {
    localStorage.setItem('token', token);
    localStorage.setItem('userInfo', JSON.stringify(userData));
  },
  
  // Get user data from localStorage
  getUserData() {
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    
    if (token && userInfo) {
      return { 
        token, 
        userInfo: JSON.parse(userInfo) 
      };
    }
    
    return null;
  },
  
  // Check if user is logged in
  isLoggedIn() {
    return !!localStorage.getItem('token');
  },
  
  // Check if user is an admin
  isAdmin() {
    const userInfo = localStorage.getItem('userInfo');
    
    if (userInfo) {
      const user = JSON.parse(userInfo);
      return user.is_admin === true;
    }
    
    return false;
  },
  
  // Log out user
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
  },
  
  // Parse and decode JWT token
  parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  },
  
  // Check if token is expired
  isTokenExpired(token) {
    const decodedToken = this.parseJwt(token);
    
    if (decodedToken && decodedToken.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      return decodedToken.exp < currentTime;
    }
    
    return true; // If there's any error in parsing, consider the token expired
  }
};
