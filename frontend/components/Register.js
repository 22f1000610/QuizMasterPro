Vue.component('register-form', {
  data() {
    return {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      isLoading: false,
      error: null,
      validationErrors: {}
    };
  },
  template: `
    <div class="register-form">
      <div class="card shadow-sm">
        <div class="card-body p-4">
          <h4 class="card-title text-center mb-4">Create an Account</h4>
          
          <div v-if="error" class="alert alert-danger">
            {{ error }}
          </div>
          
          <form @submit.prevent="register" novalidate>
            <div class="mb-3">
              <label for="username" class="form-label">Username</label>
              <div class="input-group">
                <span class="input-group-text"><i class="fas fa-user"></i></span>
                <input 
                  type="text" 
                  class="form-control" 
                  :class="{'is-invalid': validationErrors.username}"
                  id="username" 
                  v-model="username" 
                  required
                  :disabled="isLoading"
                  placeholder="Choose a username"
                >
              </div>
              <div v-if="validationErrors.username" class="invalid-feedback d-block">
                {{ validationErrors.username }}
              </div>
            </div>
            
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <div class="input-group">
                <span class="input-group-text"><i class="fas fa-envelope"></i></span>
                <input 
                  type="email" 
                  class="form-control" 
                  :class="{'is-invalid': validationErrors.email}"
                  id="email" 
                  v-model="email" 
                  required
                  :disabled="isLoading"
                  placeholder="Enter your email"
                >
              </div>
              <div v-if="validationErrors.email" class="invalid-feedback d-block">
                {{ validationErrors.email }}
              </div>
            </div>
            
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <div class="input-group">
                <span class="input-group-text"><i class="fas fa-lock"></i></span>
                <input 
                  type="password" 
                  class="form-control" 
                  :class="{'is-invalid': validationErrors.password}"
                  id="password" 
                  v-model="password" 
                  required
                  :disabled="isLoading"
                  placeholder="Choose a password"
                >
              </div>
              <div v-if="validationErrors.password" class="invalid-feedback d-block">
                {{ validationErrors.password }}
              </div>
              <small class="form-text text-muted">Password must be at least 6 characters long.</small>
            </div>
            
            <div class="mb-3">
              <label for="confirmPassword" class="form-label">Confirm Password</label>
              <div class="input-group">
                <span class="input-group-text"><i class="fas fa-lock"></i></span>
                <input 
                  type="password" 
                  class="form-control" 
                  :class="{'is-invalid': validationErrors.confirmPassword}"
                  id="confirmPassword" 
                  v-model="confirmPassword" 
                  required
                  :disabled="isLoading"
                  placeholder="Confirm your password"
                >
              </div>
              <div v-if="validationErrors.confirmPassword" class="invalid-feedback d-block">
                {{ validationErrors.confirmPassword }}
              </div>
            </div>
            
            <div class="d-grid mt-4">
              <button type="submit" class="btn btn-primary" :disabled="isLoading">
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                {{ isLoading ? 'Registering...' : 'Register' }}
              </button>
            </div>
          </form>
          
          <div class="mt-3 text-center">
            <p class="mb-0">Already have an account? 
              <a href="#" @click.prevent="goToLogin" class="text-primary">Login</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  methods: {
    validateForm() {
      this.validationErrors = {};
      let isValid = true;
      
      if (!this.username || this.username.trim() === '') {
        this.validationErrors.username = 'Username is required';
        isValid = false;
      }
      
      if (!this.email || this.email.trim() === '') {
        this.validationErrors.email = 'Email is required';
        isValid = false;
      } else if (!this.isValidEmail(this.email)) {
        this.validationErrors.email = 'Please enter a valid email address';
        isValid = false;
      }
      
      if (!this.password) {
        this.validationErrors.password = 'Password is required';
        isValid = false;
      } else if (this.password.length < 6) {
        this.validationErrors.password = 'Password must be at least 6 characters long';
        isValid = false;
      }
      
      if (this.password !== this.confirmPassword) {
        this.validationErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
      
      return isValid;
    },
    
    isValidEmail(email) {
      const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(String(email).toLowerCase());
    },
    
    register() {
      if (!this.validateForm()) {
        return;
      }
      
      this.isLoading = true;
      this.error = null;
      
      const userData = {
        username: this.username,
        email: this.email,
        password: this.password
      };
      
      api.post('/api/users/register', userData)
        .then(response => {
          this.isLoading = false;
          this.$emit('register-success', response.data);
        })
        .catch(error => {
          this.isLoading = false;
          if (error.response && error.response.data && error.response.data.error) {
            this.error = error.response.data.error;
          } else {
            this.error = 'Registration failed. Please try again.';
          }
          console.error('Registration error:', error);
        });
    },
    
    goToLogin() {
      this.$emit('go-to-login');
    }
  }
});
