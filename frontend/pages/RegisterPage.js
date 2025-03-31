Vue.component('register-page', {
  template: `
    <div class="register-page container">
      <div class="row justify-content-center mt-5">
        <div class="col-lg-5 col-md-8">
          <div class="text-center mb-4">
            <h1 class="display-4 mb-0">Quiz Master Pro</h1>
            <p class="lead">Create your account to get started</p>
          </div>
          
          <register-form 
            @register-success="handleRegister" 
            @go-to-login="goToLogin"
          ></register-form>
        </div>
      </div>
    </div>
  `,
  methods: {
    handleRegister(userData) {
      this.$emit('register', userData);
    },
    goToLogin() {
      this.$emit('page-change', 'login-page');
    }
  }
});
