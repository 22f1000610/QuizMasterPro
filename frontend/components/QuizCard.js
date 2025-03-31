Vue.component('quiz-card', {
  props: {
    quiz: {
      type: Object,
      required: true
    },
    isUserView: {
      type: Boolean,
      default: false
    },
    displayMode: {
      type: String,
      default: 'card', // 'card' or 'list'
      validator: value => ['card', 'list'].includes(value)
    }
  },
  data() {
    return {
      isLoading: false
    };
  },
  computed: {
    formattedDate() {
      return new Date(this.quiz.date_of_quiz).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    daysUntilQuiz() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const quizDate = new Date(this.quiz.date_of_quiz);
      quizDate.setHours(0, 0, 0, 0);
      
      const differenceInTime = quizDate.getTime() - today.getTime();
      const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
      
      return differenceInDays;
    },
    quizStatusClass() {
      if (this.daysUntilQuiz < 0) return 'text-secondary';
      if (this.daysUntilQuiz === 0) return 'text-danger';
      if (this.daysUntilQuiz <= 3) return 'text-warning';
      return 'text-success';
    },
    quizStatusText() {
      if (this.daysUntilQuiz < 0) return 'Past';
      if (this.daysUntilQuiz === 0) return 'Today';
      if (this.daysUntilQuiz === 1) return 'Tomorrow';
      return `In ${this.daysUntilQuiz} days`;
    }
  },
  template: `
    <div :class="{'card h-100': displayMode === 'card', 'list-item mb-3 border rounded p-3': displayMode === 'list'}">
      <div v-if="displayMode === 'card'" class="card-header d-flex justify-content-between align-items-center">
        <h5 class="card-title mb-0">{{ quiz.title }}</h5>
        <span class="badge" :class="quizStatusClass">{{ quizStatusText }}</span>
      </div>
      <div v-if="displayMode === 'card'" class="card-body">
        <p v-if="quiz.description" class="card-text">{{ quiz.description }}</p>
        <ul class="list-group list-group-flush mb-3">
          <li v-if="quiz.subject_name" class="list-group-item d-flex justify-content-between align-items-center">
            Subject
            <span>{{ quiz.subject_name }}</span>
          </li>
          <li v-if="quiz.chapter_name" class="list-group-item d-flex justify-content-between align-items-center">
            Chapter
            <span>{{ quiz.chapter_name }}</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            Date
            <span>{{ formattedDate }}</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            Duration
            <span>{{ quiz.time_duration }} minutes</span>
          </li>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            Questions
            <span>{{ quiz.questions_count || 0 }}</span>
          </li>
        </ul>
      </div>
      
      <div v-if="displayMode === 'list'" class="d-flex flex-row align-items-center">
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-1">{{ quiz.title }}</h5>
            <span class="badge ms-2" :class="quizStatusClass">{{ quizStatusText }}</span>
          </div>
          <div class="text-muted mb-2" v-if="quiz.description">{{ quiz.description }}</div>
          <div class="d-flex flex-wrap gap-3 text-muted small">
            <span v-if="quiz.subject_name"><i class="fas fa-book me-1"></i>{{ quiz.subject_name }}</span>
            <span v-if="quiz.chapter_name"><i class="fas fa-bookmark me-1"></i>{{ quiz.chapter_name }}</span>
            <span><i class="fas fa-calendar me-1"></i>{{ formattedDate }}</span>
            <span><i class="fas fa-clock me-1"></i>{{ quiz.time_duration }} minutes</span>
            <span><i class="fas fa-question-circle me-1"></i>{{ quiz.questions_count || 0 }} questions</span>
          </div>
        </div>
        <div class="ms-3 d-flex gap-2">
          <button v-if="isUserView" class="btn btn-primary" @click="takeQuiz" 
            :disabled="isLoading || daysUntilQuiz < 0 || !quiz.questions_count">
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            <i v-else class="fas fa-play-circle me-1"></i>Take
          </button>
          <template v-else>
            <button class="btn btn-sm btn-primary" @click="editQuiz">
              <i class="fas fa-edit me-1"></i>Edit
            </button>
            <button class="btn btn-sm btn-success" @click="manageQuestions">
              <i class="fas fa-question-circle me-1"></i>Questions
            </button>
            <button class="btn btn-sm btn-danger" @click="deleteQuiz">
              <i class="fas fa-trash me-1"></i>Delete
            </button>
          </template>
        </div>
      </div>
      
      <div v-if="displayMode === 'card'" class="card-footer d-flex justify-content-between">
        <template v-if="isUserView">
          <button 
            class="btn btn-primary w-100" 
            @click="takeQuiz"
            :disabled="isLoading || daysUntilQuiz < 0 || !quiz.questions_count"
          >
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            <i v-else class="fas fa-play-circle me-2"></i>
            Take Quiz
          </button>
        </template>
        <template v-else>
          <button class="btn btn-sm btn-primary" @click="editQuiz">
            <i class="fas fa-edit me-1"></i>Edit
          </button>
          <button class="btn btn-sm btn-success" @click="manageQuestions">
            <i class="fas fa-question-circle me-1"></i>Questions ({{ quiz.questions_count || 0 }})
          </button>
          <button class="btn btn-sm btn-danger" @click="deleteQuiz">
            <i class="fas fa-trash me-1"></i>Delete
          </button>
        </template>
      </div>
    </div>
  `,
  methods: {
    takeQuiz() {
      this.isLoading = true;
      this.$emit('take-quiz', this.quiz.id);
    },
    editQuiz() {
      this.$emit('edit-quiz', this.quiz);
    },
    manageQuestions() {
      this.$emit('manage-questions', this.quiz.id);
    },
    deleteQuiz() {
      if (confirm(`Are you sure you want to delete the quiz "${this.quiz.title}"? This action cannot be undone.`)) {
        this.$emit('delete-quiz', this.quiz.id);
      }
    }
  }
});
