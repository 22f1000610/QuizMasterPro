Vue.component('login-page', {
  template: `
    <div class="login-page container">
      <div class="row justify-content-center mt-5">
        <div class="col-lg-5 col-md-8">
          <div class="text-center mb-4">
            <h1 class="display-4 mb-0">Quiz Master Pro</h1>
            <p class="lead">Test your knowledge and track your progress</p>
          </div>
          
          <login-form 
            @login-success="handleLogin" 
            @go-to-register="goToRegister"
          ></login-form>
        </div>
      </div>
    </div>
  `,
  methods: {
    handleLogin(userData) {
      this.$emit('login', userData);
    },
    goToRegister() {
      this.$emit('page-change', 'register-page');
    }
  }
});
