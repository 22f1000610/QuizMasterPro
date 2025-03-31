// Navigation Bar Component
Vue.component('nav-bar', {
  props: ['isLoggedIn', 'isAdmin', 'userInfo'],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" @click="goToHome" href="#">
          <i class="fas fa-graduation-cap me-2"></i>Quiz Master Pro
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <template v-if="isLoggedIn">
              <li class="nav-item">
                <a class="nav-link" @click.prevent="goToHome" href="#">
                  <i class="fas fa-home me-1"></i>Dashboard
                </a>
              </li>
              <li class="nav-item" v-if="!isAdmin">
                <a class="nav-link" @click.prevent="goToScores" href="#">
                  <i class="fas fa-chart-bar me-1"></i>My Scores
                </a>
              </li>
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                  <i class="fas fa-user-circle me-1"></i>{{ userInfo.username }}
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><a class="dropdown-item" @click.prevent="logout" href="#"><i class="fas fa-sign-out-alt me-1"></i>Logout</a></li>
                </ul>
              </li>
            </template>
            <template v-else>
              <li class="nav-item">
                <a class="nav-link" @click.prevent="goToLogin" href="#">
                  <i class="fas fa-sign-in-alt me-1"></i>Login
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" @click.prevent="goToRegister" href="#">
                  <i class="fas fa-user-plus me-1"></i>Register
                </a>
              </li>
            </template>
          </ul>
        </div>
      </div>
    </nav>
  `,
  methods: {
    goToLogin() {
      this.$root.navigateTo('/login');
    },
    goToRegister() {
      this.$root.navigateTo('/register');
    },
    goToHome() {
      if (this.isAdmin) {
        this.$root.navigateTo('/admin/dashboard');
      } else {
        this.$root.navigateTo('/dashboard');
      }
    },
    goToScores() {
      this.$root.navigateTo('/scores');
    },
    logout() {
      this.$emit('logout');
    }
  }
});

// Simple Router
const Router = {
  routes: {
    '/login': 'login-page',
    '/register': 'register-page',
    '/dashboard': 'user-dashboard-page',
    '/admin/dashboard': 'admin-dashboard-page',
    '/scores': 'view-scores-page',
    '/admin/subjects': 'manage-subjects-page',
    '/admin/chapters': 'manage-chapters-page',
    '/admin/quizzes': 'manage-quizzes-page',
    '/admin/users': 'manage-users-page',
    '/quiz/start': 'start-quiz-page'
  },
  
  // Map a URL path to a component
  getComponentForPath(path) {
    console.log('Router processing path:', path);
    
    // First, check for exact matches
    if (this.routes[path]) {
      console.log('Matched exact route:', this.routes[path]);
      return { 
        component: this.routes[path],
        params: {} 
      };
    }
    
    // Then check for parameterized routes
    // e.g., /subjects/1/chapters -> manage-chapters-page with subjectId=1
    const subjectChaptersMatch = path.match(/^\/subjects\/(\d+)\/chapters$/);
    if (subjectChaptersMatch) {
      console.log('Matched subject chapters route');
      return {
        component: 'manage-chapters-page',
        params: { subjectId: subjectChaptersMatch[1] }
      };
    }
    
    const chapterQuizzesMatch = path.match(/^\/chapters\/(\d+)\/quizzes$/);
    if (chapterQuizzesMatch) {
      console.log('Matched chapter quizzes route');
      return {
        component: 'manage-quizzes-page',
        params: { chapterId: chapterQuizzesMatch[1] }
      };
    }
    
    const quizQuestionsMatch = path.match(/^\/quizzes\/(\d+)\/questions$/);
    if (quizQuestionsMatch) {
      console.log('Matched quiz questions route:', quizQuestionsMatch[1]);
      // Route to the manage-questions-page component with the quizId parameter
      return {
        component: 'manage-questions-page',
        params: { quizId: quizQuestionsMatch[1] }
      };
    }
    
    // Old pattern for /admin/questions/{id} - kept for compatibility
    const adminQuestionsMatch = path.match(/^\/admin\/questions\/(\d+)$/);
    if (adminQuestionsMatch) {
      console.log('Matched admin questions route:', adminQuestionsMatch[1]);
      return {
        component: 'manage-questions-page',
        params: { quizId: adminQuestionsMatch[1] }
      };
    }
    
    // Default to login page if no match
    console.log('No route match, defaulting to login');
    return { 
      component: 'login-page',
      params: {} 
    };
  },
  
  // Generate a URL for a component and parameters
  getPathForComponent(component, params) {
    // First, check for direct mapping
    for (const [path, comp] of Object.entries(this.routes)) {
      if (comp === component) {
        return path;
      }
    }
    
    // Handle parameterized routes
    if (component === 'manage-chapters-page' && params && params.subjectId) {
      return `/subjects/${params.subjectId}/chapters`;
    }
    
    if (component === 'manage-quizzes-page' && params && params.chapterId) {
      return `/chapters/${params.chapterId}/quizzes`;
    }
    
    if (component === 'manage-questions-page' && params && params.quizId) {
      return `/quizzes/${params.quizId}/questions`;
    }
    
    // Default to login if no match
    return '/login';
  }
};

// Add a blank page component to identify the problematic route
Vue.component('blank-page', {
  props: ['currentParams'],
  template: `
    <div class="container py-4">
      <div class="alert alert-info">
        <h4>DEBUG INFO: Blank Page Test</h4>
        <p>This is a blank test page to identify the problematic route.</p>
        <p>URL: /quizzes/{id}/questions</p>
        <p>Parameters: {{ JSON.stringify(currentParams) }}</p>
      </div>
    </div>
  `
});

// Create Vue app instance
new Vue({
  el: '#app',
  data: {
    currentPage: 'login-page',
    currentParams: {},
    isLoggedIn: false,
    isAdmin: false,
    userInfo: {},
    token: null
  },
  created() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    
    if (token && userInfo) {
      this.token = token;
      this.userInfo = JSON.parse(userInfo);
      this.isLoggedIn = true;
      this.isAdmin = this.userInfo.is_admin;
      
      // Set authorization header for all future requests
      api.setAuthToken(token);
      
      // Parse the current URL and set the appropriate page
      this.handleUrlChange();
      
      // Update user's last active timestamp
      this.updateLastActive();
    } else {
      // If not logged in, redirect to login page
      this.navigateTo('/login', {}, false);
    }
    
    // Listen for URL changes (back/forward buttons)
    window.addEventListener('popstate', this.handleUrlChange);
  },
  methods: {
    handleUrlChange() {
      // Get the current path from the URL
      const path = window.location.pathname || '/login';
      
      // Parse query parameters
      const queryParams = {};
      const searchParams = new URLSearchParams(window.location.search);
      for (const [key, value] of searchParams.entries()) {
        queryParams[key] = value;
      }
      
      // Get the component and params for this path
      const { component, params } = Router.getComponentForPath(path);
      
      // Debug parameters
      console.log('URL path params:', params);
      console.log('Query params:', queryParams);
      
      // Merge URL params with query params
      const mergedParams = { ...params, ...queryParams };
      console.log('Merged params before assignment:', mergedParams);
      
      // Update the component parameters first, then set the current page
      // This ensures params are available when the component mounts
      this.currentParams = mergedParams;
      
      // Use setTimeout to ensure parameters are updated before changing the page
      // This helps avoid timing issues with Vue's reactivity
      setTimeout(() => {
        this.currentPage = component;
        
        // Additional logs to verify
        console.log('Current page set to:', this.currentPage);
        console.log('Current params set to:', this.currentParams);
        
        // Check if this page requires authentication
        const publicPages = ['login-page', 'register-page'];
        const requiresAuth = !publicPages.includes(component);
        
        // Redirect to login if not authenticated
        if (requiresAuth && !this.isLoggedIn) {
          this.navigateTo('/login', {}, false);
        }
        
        // Redirect from login page if already authenticated
        if (component === 'login-page' && this.isLoggedIn) {
          if (this.isAdmin) {
            this.navigateTo('/admin/dashboard', {}, false);
          } else {
            this.navigateTo('/dashboard', {}, false);
          }
        }
      }, 0);
    },
    
    changePage(page, params = {}) {
      this.currentPage = page;
      this.currentParams = params || {};
      
      // Update the URL
      const path = Router.getPathForComponent(page, params);
      this.navigateTo(path, {}, false);
    },
    
    navigateTo(path, queryParams = {}, addToHistory = true) {
      // Build the query string
      let queryString = '';
      if (Object.keys(queryParams).length > 0) {
        queryString = '?' + new URLSearchParams(queryParams).toString();
      }
      
      // Update browser history
      if (addToHistory) {
        history.pushState({}, '', path + queryString);
      } else {
        history.replaceState({}, '', path + queryString);
      }
      
      // Update the page
      this.handleUrlChange();
    },
    
    handleLogin(data) {
      this.token = data.access_token;
      this.userInfo = {
        id: data.user_id,
        username: data.username,
        is_admin: data.is_admin
      };
      this.isLoggedIn = true;
      this.isAdmin = data.is_admin;
      
      // Store token and user info in local storage
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
      
      // Set authorization header for all future requests
      api.setAuthToken(data.access_token);
      
      // Redirect to appropriate dashboard
      if (data.is_admin) {
        this.navigateTo('/admin/dashboard');
      } else {
        this.navigateTo('/dashboard');
      }
    },
    
    handleRegister(data) {
      this.handleLogin(data);
    },
    
    logout() {
      // Clear user data
      this.token = null;
      this.userInfo = {};
      this.isLoggedIn = false;
      this.isAdmin = false;
      
      // Remove from local storage
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      
      // Clear authorization header
      api.clearAuthToken();
      
      // Redirect to login
      this.navigateTo('/login');
    },
    
    updateLastActive() {
      // Update the user's last active timestamp
      api.post('/api/users/active')
        .catch(error => {
          console.error('Error updating last active timestamp:', error);
        });
    }
  }
});

// Initialize Bootstrap components
document.addEventListener('DOMContentLoaded', function() {
  // Initialize dropdowns
  var dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
  dropdownElementList.map(function(dropdownToggleEl) {
    return new bootstrap.Dropdown(dropdownToggleEl);
  });
});
