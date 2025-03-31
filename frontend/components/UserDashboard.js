Vue.component('user-dashboard', {
  props: ['userInfo'],
  data() {
    return {
      subjects: [],
      selectedSubject: null,
      chapters: [],
      selectedChapter: null,
      quizzes: [],
      recentScores: [],
      isLoadingSubjects: true,
      isLoadingChapters: false,
      isLoadingQuizzes: false,
      isLoadingScores: true,
      error: null
    };
  },
  template: `
    <div class="user-dashboard">
      <div class="row mb-4">
        <div class="col-md-12">
          <h1><i class="fas fa-tachometer-alt me-2"></i>Student Dashboard</h1>
          <p class="lead">Welcome back, {{ userInfo.username }}!</p>
        </div>
      </div>
      
      <!-- Error Display -->
      <div v-if="error" class="alert alert-danger mb-4">
        {{ error }}
      </div>
      
      <!-- Recent Performance Summary -->
      <div class="row mb-4">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Recent Performance</h5>
              <button class="btn btn-sm btn-primary" @click="viewAllScores">
                <i class="fas fa-chart-bar me-1"></i>View All Scores
              </button>
            </div>
            <div class="card-body">
              <div v-if="isLoadingScores" class="text-center py-3">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading your recent scores...</p>
              </div>
              
              <div v-else-if="recentScores.length === 0" class="text-center py-3">
                <div class="text-muted">
                  <i class="fas fa-chart-line fa-3x mb-3"></i>
                  <p>You haven't taken any quizzes yet.</p>
                  <p>Select a subject and chapter below to get started!</p>
                </div>
              </div>
              
              <div v-else>
                <!-- Performance Chart -->
                <div class="row">
                  <div class="col-md-8 offset-md-2">
                    <canvas id="performanceChart"></canvas>
                  </div>
                </div>
                
                <!-- Quick Stats -->
                <div class="row mt-4 text-center">
                  <div class="col-md-4">
                    <div class="border rounded p-3">
                      <h6 class="text-muted">Quizzes Taken</h6>
                      <h3>{{ recentScores.length }}</h3>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="border rounded p-3">
                      <h6 class="text-muted">Average Score</h6>
                      <h3>{{ calculateAverageScore() }}%</h3>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="border rounded p-3">
                      <h6 class="text-muted">Latest Score</h6>
                      <h3 v-if="recentScores.length">{{ recentScores[0].percentage_score.toFixed(1) }}%</h3>
                      <h3 v-else>-</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Subject and Chapter Selection -->
      <div class="row mb-4">
        <div class="col-md-4">
          <div class="card h-100">
            <div class="card-header">
              <h5 class="mb-0">Subjects</h5>
            </div>
            <div class="card-body">
              <div v-if="isLoadingSubjects" class="text-center py-3">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading subjects...</p>
              </div>
              
              <div v-else-if="subjects.length === 0" class="text-center py-3">
                <p class="text-muted mb-0">No subjects available.</p>
              </div>
              
              <div v-else class="list-group">
                <button 
                  v-for="subject in subjects" 
                  :key="subject.id"
                  class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  :class="{ active: selectedSubject && selectedSubject.id === subject.id }"
                  @click="selectSubject(subject)"
                >
                  {{ subject.name }}
                  <span class="badge bg-primary rounded-pill">{{ subject.chapters_count }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="card h-100">
            <div class="card-header">
              <h5 class="mb-0">Chapters</h5>
            </div>
            <div class="card-body">
              <div v-if="!selectedSubject" class="text-center py-3">
                <p class="text-muted mb-0">Please select a subject first.</p>
              </div>
              
              <div v-else-if="isLoadingChapters" class="text-center py-3">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading chapters...</p>
              </div>
              
              <div v-else-if="chapters.length === 0" class="text-center py-3">
                <p class="text-muted mb-0">No chapters available for this subject.</p>
              </div>
              
              <div v-else class="list-group">
                <button 
                  v-for="chapter in chapters" 
                  :key="chapter.id"
                  class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  :class="{ active: selectedChapter && selectedChapter.id === chapter.id }"
                  @click="selectChapter(chapter)"
                >
                  {{ chapter.name }}
                  <span class="badge bg-primary rounded-pill">{{ chapter.quizzes_count }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="card h-100">
            <div class="card-header">
              <h5 class="mb-0">Available Quizzes</h5>
            </div>
            <div class="card-body">
              <div v-if="!selectedChapter" class="text-center py-3">
                <p class="text-muted mb-0">Please select a chapter first.</p>
              </div>
              
              <div v-else-if="isLoadingQuizzes" class="text-center py-3">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading quizzes...</p>
              </div>
              
              <div v-else-if="quizzes.length === 0" class="text-center py-3">
                <p class="text-muted mb-0">No quizzes available for this chapter.</p>
              </div>
              
              <div v-else class="list-group">
                <button 
                  v-for="quiz in quizzes" 
                  :key="quiz.id"
                  class="list-group-item list-group-item-action"
                  @click="startQuiz(quiz.id)"
                >
                  <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">{{ quiz.title }}</h6>
                    <small>{{ quiz.questions_count }} questions</small>
                  </div>
                  <p class="mb-1">{{ quiz.description }}</p>
                  <small>Duration: {{ quiz.time_duration }} minutes</small>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent Quizzes -->
      <div class="row">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Upcoming and Recent Quizzes</h5>
            </div>
            <div class="card-body">
              <div v-if="isLoadingSubjects" class="text-center py-3">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading quizzes...</p>
              </div>
              
              <div v-else-if="getAllQuizzes().length === 0" class="text-center py-3">
                <p class="text-muted mb-0">No quizzes available yet.</p>
              </div>
              
              <div v-else class="row">
                <div v-for="quiz in getAllQuizzes().slice(0, 3)" :key="quiz.id" class="col-md-4 mb-3">
                  <quiz-card 
                    :quiz="quiz" 
                    :is-user-view="true"
                    @take-quiz="startQuiz"
                  ></quiz-card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  methods: {
    fetchSubjects() {
      this.isLoadingSubjects = true;
      this.error = null;
      
      api.get('/api/subjects')
        .then(response => {
          this.subjects = response.data;
          this.isLoadingSubjects = false;
        })
        .catch(error => {
          console.error('Error fetching subjects:', error);
          this.error = 'Failed to load subjects. Please try refreshing the page.';
          this.isLoadingSubjects = false;
        });
    },
    
    fetchRecentScores() {
      this.isLoadingScores = true;
      
      api.get('/api/users/scores')
        .then(response => {
          this.recentScores = response.data;
          this.isLoadingScores = false;
          
          this.$nextTick(() => {
            if (this.recentScores.length > 0) {
              this.renderPerformanceChart();
            }
          });
        })
        .catch(error => {
          console.error('Error fetching recent scores:', error);
          this.error = 'Failed to load your recent scores. Please try refreshing the page.';
          this.isLoadingScores = false;
        });
    },
    
    selectSubject(subject) {
      this.selectedSubject = subject;
      this.selectedChapter = null;
      this.quizzes = [];
      this.fetchChapters(subject.id);
    },
    
    fetchChapters(subjectId) {
      this.isLoadingChapters = true;
      
      api.get(`/api/subjects/${subjectId}/chapters`)
        .then(response => {
          this.chapters = response.data;
          this.isLoadingChapters = false;
        })
        .catch(error => {
          console.error('Error fetching chapters:', error);
          this.error = 'Failed to load chapters. Please try refreshing the page.';
          this.isLoadingChapters = false;
        });
    },
    
    selectChapter(chapter) {
      this.selectedChapter = chapter;
      this.fetchQuizzes(chapter.id);
    },
    
    fetchQuizzes(chapterId) {
      this.isLoadingQuizzes = true;
      
      api.get(`/api/chapters/${chapterId}/quizzes`)
        .then(response => {
          this.quizzes = response.data;
          this.isLoadingQuizzes = false;
        })
        .catch(error => {
          console.error('Error fetching quizzes:', error);
          this.error = 'Failed to load quizzes. Please try refreshing the page.';
          this.isLoadingQuizzes = false;
        });
    },
    
    startQuiz(quizId) {
      this.$emit('page-change', 'start-quiz-page', { quizId });
    },
    
    viewAllScores() {
      this.$emit('page-change', 'view-scores-page');
    },
    
    calculateAverageScore() {
      if (this.recentScores.length === 0) return 0;
      
      const total = this.recentScores.reduce((sum, score) => sum + score.percentage_score, 0);
      return (total / this.recentScores.length).toFixed(1);
    },
    
    renderPerformanceChart() {
      // Only render if we have scores and the canvas element exists
      if (this.recentScores.length === 0 || !document.getElementById('performanceChart')) {
        return;
      }
      
      // Take the last 5 quizzes (or fewer if not available)
      const recentScoresForChart = this.recentScores.slice(0, 5).reverse();
      
      const ctx = document.getElementById('performanceChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: recentScoresForChart.map(score => score.quiz_title),
          datasets: [{
            label: 'Score (%)',
            data: recentScoresForChart.map(score => score.percentage_score),
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Recent Quiz Performance'
            }
          }
        }
      });
    },
    
    getAllQuizzes() {
      // Get available quizzes from all subjects and chapters for display in the recent quizzes section
      let allQuizzes = [];
      
      if (this.quizzes && this.quizzes.length > 0) {
        // Add currently selected chapter's quizzes first
        allQuizzes.push(...this.quizzes);
      }
      
      return allQuizzes;
    }
  },
  mounted() {
    this.fetchSubjects();
    this.fetchRecentScores();
  },
  updated() {
    // Re-render the chart whenever the component updates
    this.$nextTick(() => {
      if (this.recentScores.length > 0 && document.getElementById('performanceChart')) {
        this.renderPerformanceChart();
      }
    });
  }
});
