Vue.component('view-scores-page', {
  props: ['userInfo'],
  data() {
    return {
      scores: [],
      isLoading: true,
      error: null
    };
  },
  template: `
    <div class="view-scores-page container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Your Quiz Results</h1>
        <button class="btn btn-primary" @click="goToDashboard">
          <i class="fas fa-arrow-left me-2"></i>Back to Dashboard
        </button>
      </div>
      
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading your scores...</p>
      </div>
      
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>
      
      <div v-else>
        <score-display 
          :scores="scores" 
          :is-admin="userInfo.is_admin"
        ></score-display>
      </div>
    </div>
  `,
  methods: {
    fetchScores() {
      this.isLoading = true;
      this.error = null;
      
      const endpoint = this.userInfo.is_admin ? '/api/admin/scores' : '/api/users/scores';
      
      api.get(endpoint)
        .then(response => {
          this.scores = response.data;
          this.isLoading = false;
        })
        .catch(error => {
          console.error('Error fetching scores:', error);
          if (error.response && error.response.data && error.response.data.error) {
            this.error = error.response.data.error;
          } else {
            this.error = 'Failed to load scores. Please try again.';
          }
          this.isLoading = false;
        });
    },
    
    goToDashboard() {
      if (this.userInfo.is_admin) {
        this.$emit('page-change', 'admin-dashboard-page');
      } else {
        this.$emit('page-change', 'user-dashboard-page');
      }
    }
  },
  mounted() {
    this.fetchScores();
  }
});
