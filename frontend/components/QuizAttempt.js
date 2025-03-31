Vue.component('quiz-attempt', {
  props: ['quizData'],
  data() {
    return {
      currentQuestionIndex: 0,
      selectedAnswers: {},
      timeLeft: 0,
      timerInterval: null,
      quizCompleted: false,
      isSubmitting: false,
      score: null,
      error: null
    };
  },
  computed: {
    currentQuestion() {
      if (!this.quizData || !this.quizData.questions || this.quizData.questions.length === 0) {
        return null;
      }
      return this.quizData.questions[this.currentQuestionIndex];
    },
    progress() {
      if (!this.quizData || !this.quizData.questions || this.quizData.questions.length === 0) {
        return 0;
      }
      return Math.round(((this.currentQuestionIndex + 1) / this.quizData.questions.length) * 100);
    },
    formattedTimeLeft() {
      const minutes = Math.floor(this.timeLeft / 60);
      const seconds = this.timeLeft % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },
    isLastQuestion() {
      return this.currentQuestionIndex === this.quizData.questions.length - 1;
    }
  },
  template: `
    <div class="quiz-attempt">
      <div v-if="error" class="alert alert-danger mb-4">
        {{ error }}
      </div>
      
      <div v-if="score" class="card mb-4">
        <div class="card-body text-center">
          <h3 class="card-title">Quiz Completed!</h3>
          <div class="my-4">
            <div class="display-1 mb-3">{{ score.percentage_score.toFixed(1) }}%</div>
            <h5>You got {{ score.total_correct }} out of {{ score.total_questions }} questions correct</h5>
            <p class="text-muted">Time taken: {{ formatTime(score.time_taken) }}</p>
          </div>
          <div class="d-grid gap-2 d-md-flex justify-content-md-center">
            <button @click="$emit('go-to-dashboard')" class="btn btn-primary">
              <i class="fas fa-home me-2"></i>Return to Dashboard
            </button>
            <button @click="$emit('view-scores')" class="btn btn-secondary">
              <i class="fas fa-chart-bar me-2"></i>View All Scores
            </button>
          </div>
        </div>
      </div>
      
      <div v-else-if="!quizCompleted" class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">{{ quizData.quiz.title }}</h5>
          <div class="quiz-timer" :class="{'text-danger': timeLeft < 60}">
            <i class="fas fa-clock me-2"></i>{{ formattedTimeLeft }}
          </div>
        </div>
        
        <div class="card-body">
          <div class="progress mb-4">
            <div class="progress-bar" role="progressbar" :style="{width: progress + '%'}" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
              Question {{ currentQuestionIndex + 1 }} of {{ quizData.questions.length }}
            </div>
          </div>
          
          <div v-if="currentQuestion" class="question-container">
            <h5 class="mb-3">{{ currentQuestion.question_statement }}</h5>
            
            <div class="options-list">
              <div class="form-check mb-3">
                <input class="form-check-input" type="radio" :name="'question-' + currentQuestion.id" :id="'option1-' + currentQuestion.id" :value="1" v-model="selectedAnswers[currentQuestion.id]">
                <label class="form-check-label" :for="'option1-' + currentQuestion.id">
                  {{ currentQuestion.option1 }}
                </label>
              </div>
              
              <div class="form-check mb-3">
                <input class="form-check-input" type="radio" :name="'question-' + currentQuestion.id" :id="'option2-' + currentQuestion.id" :value="2" v-model="selectedAnswers[currentQuestion.id]">
                <label class="form-check-label" :for="'option2-' + currentQuestion.id">
                  {{ currentQuestion.option2 }}
                </label>
              </div>
              
              <div class="form-check mb-3">
                <input class="form-check-input" type="radio" :name="'question-' + currentQuestion.id" :id="'option3-' + currentQuestion.id" :value="3" v-model="selectedAnswers[currentQuestion.id]">
                <label class="form-check-label" :for="'option3-' + currentQuestion.id">
                  {{ currentQuestion.option3 }}
                </label>
              </div>
              
              <div class="form-check mb-3">
                <input class="form-check-input" type="radio" :name="'question-' + currentQuestion.id" :id="'option4-' + currentQuestion.id" :value="4" v-model="selectedAnswers[currentQuestion.id]">
                <label class="form-check-label" :for="'option4-' + currentQuestion.id">
                  {{ currentQuestion.option4 }}
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card-footer d-flex justify-content-between">
          <button 
            class="btn btn-outline-secondary" 
            @click="previousQuestion" 
            :disabled="currentQuestionIndex === 0"
          >
            <i class="fas fa-chevron-left me-2"></i>Previous
          </button>
          
          <button 
            v-if="isLastQuestion" 
            class="btn btn-success" 
            @click="finishQuiz"
            :disabled="!isAllQuestionsAnswered()"
          >
            <i class="fas fa-check me-2"></i>Finish Quiz
          </button>
          
          <button 
            v-else 
            class="btn btn-primary" 
            @click="nextQuestion"
          >
            Next<i class="fas fa-chevron-right ms-2"></i>
          </button>
        </div>
      </div>
      
      <div v-else-if="isSubmitting" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Submitting...</span>
        </div>
        <p class="mt-2">Submitting your answers...</p>
      </div>
    </div>
  `,
  methods: {
    startTimer() {
      this.timeLeft = this.quizData.quiz.time_duration * 60; // Convert minutes to seconds
      this.timerInterval = setInterval(() => {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
          this.stopTimer();
          this.autoSubmit();
        }
      }, 1000);
    },
    
    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
    },
    
    nextQuestion() {
      if (this.currentQuestionIndex < this.quizData.questions.length - 1) {
        this.currentQuestionIndex++;
      }
    },
    
    previousQuestion() {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--;
      }
    },
    
    isAllQuestionsAnswered() {
      return this.quizData.questions.every(question => 
        this.selectedAnswers[question.id] !== undefined
      );
    },
    
    finishQuiz() {
      if (confirm('Are you sure you want to finish the quiz? You cannot change your answers after submission.')) {
        this.submitQuiz();
      }
    },
    
    autoSubmit() {
      alert('Time is up! Your quiz will be submitted automatically.');
      this.submitQuiz();
    },
    
    submitQuiz() {
      this.quizCompleted = true;
      this.isSubmitting = true;
      
      const timeTaken = (this.quizData.quiz.time_duration * 60) - this.timeLeft;
      
      const payload = {
        answers: this.selectedAnswers,
        time_taken: timeTaken
      };
      
      api.post(`/api/quizzes/${this.quizData.quiz.id}/submit`, payload)
        .then(response => {
          this.score = response.data.score;
          this.isSubmitting = false;
        })
        .catch(error => {
          this.isSubmitting = false;
          if (error.response && error.response.data && error.response.data.error) {
            this.error = error.response.data.error;
          } else {
            this.error = 'Failed to submit quiz. Please try again.';
          }
          console.error('Error submitting quiz:', error);
        });
    },
    
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
  },
  created() {
    this.startTimer();
  },
  beforeDestroy() {
    this.stopTimer();
  }
});
