Vue.component('login-form', {
  data() {
    return {
      username: '',
      password: '',
      isLoading: false,
      error: null,
      isAdmin: false
    };
  },
  template: `
    <div class="login-form">
      <div class="card shadow-sm">
        <div class="card-body p-4">
          <h4 class="card-title text-center mb-4">
            {{ isAdmin ? 'Admin Login' : 'User Login' }}
          </h4>
          
          <div v-if="error" class="alert alert-danger">
            {{ error }}
          </div>
          
          <form @submit.prevent="login">
            <div class="mb-3">
              <label for="username" class="form-label">Username</label>
              <div class="input-group">
                <span class="input-group-text"><i class="fas fa-user"></i></span>
                <input 
                  type="text" 
                  class="form-control" 
                  id="username" 
                  v-model="username" 
                  required
                  :disabled="isLoading"
                  placeholder="Enter your username"
                >
              </div>
            </div>
            
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <div class="input-group">
                <span class="input-group-text"><i class="fas fa-lock"></i></span>
                <input 
                  type="password" 
                  class="form-control" 
                  id="password" 
                  v-model="password" 
                  required
                  :disabled="isLoading"
                  placeholder="Enter your password"
                >
              </div>
            </div>
            
            <div class="d-grid mt-4">
              <button type="submit" class="btn btn-primary" :disabled="isLoading">
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                {{ isLoading ? 'Logging in...' : 'Login' }}
              </button>
            </div>
          </form>
          
          <div class="mt-3 text-center">
            <a href="#" @click.prevent="toggleAdminMode" class="text-decoration-none">
              {{ isAdmin ? 'Switch to User Login' : 'Switch to Admin Login' }}
            </a>
          </div>
          
          <div v-if="!isAdmin" class="mt-3 text-center">
            <p class="mb-0">Don't have an account? 
              <a href="#" @click.prevent="goToRegister" class="text-primary">Register</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  methods: {
    login() {
      this.isLoading = true;
      this.error = null;
      
      const credentials = {
        username: this.username,
        password: this.password
      };
      
      const endpoint = this.isAdmin ? '/api/admin/login' : '/api/users/login';
      
      api.post(endpoint, credentials)
        .then(response => {
          this.isLoading = false;
          this.$emit('login-success', response.data);
        })
        .catch(error => {
          this.isLoading = false;
          if (error.response && error.response.data && error.response.data.error) {
            this.error = error.response.data.error;
          } else {
            this.error = 'Login failed. Please try again.';
          }
          console.error('Login error:', error);
        });
    },
    toggleAdminMode() {
      this.isAdmin = !this.isAdmin;
      this.username = '';
      this.password = '';
      this.error = null;
    },
    goToRegister() {
      this.$emit('go-to-register');
    }
  }
});
