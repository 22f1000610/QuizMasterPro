Vue.component('start-quiz-page', {
  props: ['currentParams'],
  data() {
    return {
      quizData: null,
      isLoading: true,
      error: null
    };
  },
  template: `
    <div class="start-quiz-page container py-4">
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading quiz...</p>
      </div>
      
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
        <div class="mt-3">
          <button class="btn btn-primary" @click="goToDashboard">Return to Dashboard</button>
        </div>
      </div>
      
      <div v-else-if="quizData">
        <quiz-attempt 
          :quiz-data="quizData"
          @go-to-dashboard="goToDashboard"
          @view-scores="goToScores"
        ></quiz-attempt>
      </div>
    </div>
  `,
  methods: {
    fetchQuizData() {
      if (!this.currentParams || !this.currentParams.quizId) {
        this.error = 'Invalid quiz ID';
        this.isLoading = false;
        return;
      }
      
      const quizId = this.currentParams.quizId;
      
      api.get(`/api/quizzes/${quizId}/take`)
        .then(response => {
          this.quizData = response.data;
          this.isLoading = false;
        })
        .catch(error => {
          console.error('Error fetching quiz data:', error);
          if (error.response && error.response.data && error.response.data.error) {
            this.error = error.response.data.error;
          } else {
            this.error = 'Failed to load quiz. Please try again.';
          }
          this.isLoading = false;
        });
    },
    
    goToDashboard() {
      this.$emit('page-change', 'user-dashboard-page');
    },
    
    goToScores() {
      this.$emit('page-change', 'view-scores-page');
    }
  },
  created() {
    this.fetchQuizData();
  },
  watch: {
    currentParams: {
      handler(newParams) {
        if (newParams && newParams.quizId) {
          this.isLoading = true;
          this.error = null;
          this.quizData = null;
          this.fetchQuizData();
        }
      },
      deep: true
    }
  }
});
