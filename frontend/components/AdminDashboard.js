Vue.component('admin-dashboard', {
  props: ['userInfo'],
  data() {
    return {
      stats: {
        total_users: 0,
        total_subjects: 0,
        total_chapters: 0,
        total_quizzes: 0,
        total_questions: 0,
        total_attempts: 0,
        recent_users: [],
        recent_scores: []
      },
      isLoading: true,
      error: null,
      exportInProgress: false,
      exportTaskId: null,
      exportMessage: ''
    };
  },
  template: `
    <div class="admin-dashboard">
      <div class="row mb-4">
        <div class="col-md-12">
          <div class="d-flex justify-content-between align-items-center">
            <h1><i class="fas fa-tachometer-alt me-2"></i>Admin Dashboard</h1>
            <button class="btn btn-primary" @click="exportScoresCSV" :disabled="exportInProgress">
              <i class="fas fa-file-export me-1"></i>
              {{ exportInProgress ? 'Exporting...' : 'Export Scores CSV' }}
            </button>
          </div>
          <p v-if="exportMessage" class="alert" :class="{'alert-success': !exportMessage.includes('Error'), 'alert-danger': exportMessage.includes('Error')}">
            {{ exportMessage }}
          </p>
        </div>
      </div>
      
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading dashboard data...</p>
      </div>
      
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>
      
      <div v-else>
        <!-- Stats Cards -->
        <div class="row mb-4">
          <div class="col-md-4 mb-3">
            <div class="card bg-primary text-white h-100">
              <div class="card-body d-flex flex-column align-items-center justify-content-center">
                <h1 class="display-4">{{ stats.total_users }}</h1>
                <h6 class="text-uppercase">Users</h6>
              </div>
              <div class="card-footer d-flex">
                <a @click="goToManageUsers" class="text-white text-decoration-none small w-100 text-center">
                  <span>View Details</span>
                  <i class="fas fa-angle-right ms-1"></i>
                </a>
              </div>
            </div>
          </div>
          
          <div class="col-md-4 mb-3">
            <div class="card bg-success text-white h-100">
              <div class="card-body d-flex flex-column align-items-center justify-content-center">
                <h1 class="display-4">{{ stats.total_subjects }}</h1>
                <h6 class="text-uppercase">Subjects</h6>
              </div>
              <div class="card-footer d-flex">
                <a @click="goToManageSubjects" class="text-white text-decoration-none small w-100 text-center">
                  <span>View Details</span>
                  <i class="fas fa-angle-right ms-1"></i>
                </a>
              </div>
            </div>
          </div>
          
          <div class="col-md-4 mb-3">
            <div class="card bg-info text-white h-100">
              <div class="card-body d-flex flex-column align-items-center justify-content-center">
                <h1 class="display-4">{{ stats.total_quizzes }}</h1>
                <h6 class="text-uppercase">Quizzes</h6>
              </div>
              <div class="card-footer d-flex">
                <a @click="goToManageQuizzes" class="text-white text-decoration-none small w-100 text-center">
                  <span>View Details</span>
                  <i class="fas fa-angle-right ms-1"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Charts Row -->
        <div class="row mb-4">
          <div class="col-md-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Content Distribution</h5>
              </div>
              <div class="card-body" style="height: 300px; position: relative;">
                <canvas id="contentChart"></canvas>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Recent Quiz Attempts</h5>
              </div>
              <div class="card-body" style="height: 300px; position: relative;">
                <canvas id="scoresChart"></canvas>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Recent Activity Row -->
        <div class="row">
          <div class="col-md-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Recent User Registrations</h5>
              </div>
              <div class="card-body">
                <div v-if="stats.recent_users.length === 0" class="text-center py-3">
                  <p class="text-muted">No recent user registrations</p>
                </div>
                <ul v-else class="list-group list-group-flush">
                  <li v-for="user in stats.recent_users" :key="user.id" class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <i class="fas fa-user-circle me-2"></i>
                        <strong>{{ user.username }}</strong>
                        <small class="text-muted ms-2">{{ user.email }}</small>
                      </div>
                      <small class="text-muted">
                        {{ formatDate(user.created_at) }}
                      </small>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 mb-4">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="card-title mb-0">Recent Quiz Attempts</h5>
              </div>
              <div class="card-body">
                <div v-if="stats.recent_scores.length === 0" class="text-center py-3">
                  <p class="text-muted">No recent quiz attempts</p>
                </div>
                <ul v-else class="list-group list-group-flush">
                  <li v-for="score in stats.recent_scores" :key="score.id" class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{{ score.username }}</strong>
                        <span class="badge bg-primary ms-2">{{ score.quiz_title }}</span>
                      </div>
                      <div>
                        <span class="badge" :class="getScoreBadgeClass(score.percentage_score)">
                          {{ score.percentage_score.toFixed(1) }}%
                        </span>
                        <small class="text-muted ms-2">
                          {{ formatDate(score.attempt_date) }}
                        </small>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Quick Links -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Quick Actions</h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-3 mb-3">
                    <a @click="goToManageSubjects" class="btn btn-outline-primary w-100">
                      <i class="fas fa-book me-2"></i>Manage Subjects
                    </a>
                  </div>
                  <div class="col-md-3 mb-3">
                    <a @click="goToManageChapters" class="btn btn-outline-primary w-100">
                      <i class="fas fa-bookmark me-2"></i>Manage Chapters
                    </a>
                  </div>
                  <div class="col-md-3 mb-3">
                    <a @click="goToManageQuizzes" class="btn btn-outline-primary w-100">
                      <i class="fas fa-question-circle me-2"></i>Manage Quizzes
                    </a>
                  </div>
                  <div class="col-md-3 mb-3">
                    <a @click="goToManageUsers" class="btn btn-outline-primary w-100">
                      <i class="fas fa-users me-2"></i>Manage Users
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  methods: {
    fetchDashboardData() {
      this.isLoading = true;
      this.error = null;
      
      api.get('/api/admin/stats')
        .then(response => {
          this.stats = response.data;
          this.isLoading = false;
          this.$nextTick(() => {
            this.renderCharts();
          });
        })
        .catch(error => {
          console.error('Error fetching dashboard data:', error);
          this.error = 'Failed to load dashboard data. Please try refreshing the page.';
          this.isLoading = false;
        });
    },
    renderCharts() {
      try {
        // Content distribution chart
        const contentCanvas = document.getElementById('contentChart');
        if (contentCanvas) {
          const contentCtx = contentCanvas.getContext('2d');
          if (contentCtx) {
            const hasData = this.stats.total_subjects || this.stats.total_chapters || 
                           this.stats.total_quizzes || this.stats.total_questions;
            
            if (hasData) {
              new Chart(contentCtx, {
                type: 'doughnut',
                data: {
                  labels: ['Subjects', 'Chapters', 'Quizzes', 'Questions'],
                  datasets: [{
                    data: [
                      this.stats.total_subjects || 0,
                      this.stats.total_chapters || 0,
                      this.stats.total_quizzes || 0, 
                      this.stats.total_questions || 0
                    ],
                    backgroundColor: [
                      '#28a745', // green
                      '#17a2b8', // teal
                      '#007bff', // blue
                      '#6f42c1'  // purple
                    ],
                    borderWidth: 1
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }
              });
            } else {
              // Create empty chart when no data is available
              new Chart(contentCtx, {
                type: 'doughnut',
                data: {
                  labels: ['No content available'],
                  datasets: [{
                    data: [1],
                    backgroundColor: ['#e9ecef'],
                    borderWidth: 0
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    },
                    tooltip: {
                      callbacks: {
                        label: function() {
                          return 'No content added yet';
                        }
                      }
                    }
                  }
                }
              });
            }
          }
        }
        
        // Recent scores chart
        const scoresCanvas = document.getElementById('scoresChart');
        if (scoresCanvas) {
          const scoresCtx = scoresCanvas.getContext('2d');
          if (scoresCtx) {
            if (this.stats.recent_scores && this.stats.recent_scores.length > 0) {
              const scoresData = this.stats.recent_scores.slice(0, 5).reverse();
              new Chart(scoresCtx, {
                type: 'bar',
                data: {
                  labels: scoresData.map(score => score.username),
                  datasets: [{
                    label: 'Score (%)',
                    data: scoresData.map(score => score.percentage_score),
                    backgroundColor: '#007bff',
                    borderWidth: 1
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100
                    }
                  }
                }
              });
            } else {
              // Create empty chart when no data is available
              new Chart(scoresCtx, {
                type: 'bar',
                data: {
                  labels: ['No data available'],
                  datasets: [{
                    label: 'Score (%)',
                    data: [0],
                    backgroundColor: '#9ec5fe',
                    borderWidth: 1
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100
                    }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function() {
                          return 'No quiz attempts yet';
                        }
                      }
                    }
                  }
                }
              });
            }
          }
        }
      } catch (error) {
        console.error('Error rendering charts:', error);
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    },
    getScoreBadgeClass(score) {
      if (score >= 80) return 'bg-success';
      if (score >= 60) return 'bg-primary';
      if (score >= 40) return 'bg-warning';
      return 'bg-danger';
    },
    exportScoresCSV() {
      this.exportInProgress = true;
      this.exportMessage = '';
      
      api.post('/api/admin/scores/export')
        .then(response => {
          this.exportTaskId = response.data.task_id;
          this.exportMessage = 'Export started successfully! The file will be ready for download shortly.';
          // In a real app, we would poll the server to check when the file is ready
          setTimeout(() => {
            this.exportInProgress = false;
            this.exportMessage = 'Export complete! File ready for download.';
          }, 3000);
        })
        .catch(error => {
          console.error('Error exporting scores:', error);
          this.exportMessage = 'Error starting export. Please try again.';
          this.exportInProgress = false;
        });
    },
    goToManageSubjects() {
      this.$root.navigateTo('/admin/subjects');
    },
    goToManageChapters() {
      this.$root.navigateTo('/admin/chapters');
    },
    goToManageQuizzes() {
      // Navigate directly to a special "all quizzes" page
      this.$root.navigateTo('/admin/quizzes');
    },
    goToManageUsers() {
      this.$root.navigateTo('/admin/users');
    }
  },
  mounted() {
    this.fetchDashboardData();
  }
});
