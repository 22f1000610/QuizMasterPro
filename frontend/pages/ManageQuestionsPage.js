Vue.component('manage-questions-page', {
  props: ['currentParams'],
  data() {
    return {
      // Store the quiz info locally to avoid relying on props
      quizInfo: {
        id: null,
        title: 'Quiz'
      }
    };
  },
  created() {
    // Extract quiz ID from URL directly as a fallback
    const pathMatch = window.location.pathname.match(/\/quizzes\/(\d+)\/questions/);
    if (pathMatch && pathMatch[1]) {
      this.quizInfo.id = parseInt(pathMatch[1]);
      console.log('Quiz ID extracted from URL path:', this.quizInfo.id);
    }
    
    // Try to get quiz title from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const titleFromUrl = urlParams.get('quizTitle');
    if (titleFromUrl) {
      this.quizInfo.title = titleFromUrl;
      console.log('Quiz title from URL query:', this.quizInfo.title);
    }
    
    // If props are available, use them (but they might not be due to timing issues)
    if (this.currentParams && this.currentParams.quizId) {
      this.quizInfo.id = parseInt(this.currentParams.quizId);
      console.log('Quiz ID from props:', this.quizInfo.id);
      
      if (this.currentParams.quizTitle) {
        this.quizInfo.title = this.currentParams.quizTitle;
        console.log('Quiz title from props:', this.quizInfo.title);
      }
    }
  },
  template: `
    <div class="manage-questions-page container py-4">
      <question-form 
        v-if="quizInfo.id"
        :quiz-id="quizInfo.id"
        :quiz-title="quizInfo.title"
        @go-back="goBackToQuizzes"
      ></question-form>
      
      <div v-else class="alert alert-danger">
        <p>Invalid quiz ID. Please go back and select a quiz.</p>
        <button class="btn btn-primary mt-2" @click="goToDashboard">Go to Dashboard</button>
      </div>
    </div>
  `,
  methods: {
    goBackToQuizzes() {
      this.$root.navigateTo('/admin/quizzes');
    },
    
    goToDashboard() {
      this.$root.navigateTo('/admin/dashboard');
    }
  }
});
