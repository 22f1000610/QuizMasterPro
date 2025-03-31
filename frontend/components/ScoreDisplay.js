Vue.component('score-display', {
  props: {
    scores: {
      type: Array,
      required: true
    },
    isAdmin: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      searchTerm: '',
      sortBy: 'attempt_date',
      sortDirection: 'desc',
      pageSize: 10,
      currentPage: 1
    };
  },
  computed: {
    filteredScores() {
      if (!this.scores) return [];
      
      let filtered = [...this.scores];
      
      // Apply search filtering
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        filtered = filtered.filter(score => {
          return (
            (score.quiz_title && score.quiz_title.toLowerCase().includes(term)) ||
            (score.username && score.username.toLowerCase().includes(term)) ||
            (score.subject_name && score.subject_name.toLowerCase().includes(term)) ||
            (score.chapter_name && score.chapter_name.toLowerCase().includes(term))
          );
        });
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        let aValue = a[this.sortBy];
        let bValue = b[this.sortBy];
        
        // Special handling for dates
        if (this.sortBy === 'attempt_date') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }
        
        if (this.sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      return filtered;
    },
    
    paginatedScores() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredScores.slice(start, end);
    },
    
    totalPages() {
      return Math.ceil(this.filteredScores.length / this.pageSize);
    },
    
    // Calculate stats for chart display
    scoreStats() {
      if (!this.scores || this.scores.length === 0) return null;
      
      // Get unique subjects
      const subjects = [...new Set(this.scores.map(score => score.subject_name))];
      const subjectScores = subjects.map(subject => {
        const subjectAttempts = this.scores.filter(score => score.subject_name === subject);
        const avgScore = subjectAttempts.reduce((acc, s) => acc + s.percentage_score, 0) / subjectAttempts.length;
        return {
          subject,
          avgScore,
          attempts: subjectAttempts.length
        };
      });
      
      return {
        subjects,
        subjectScores
      };
    }
  },
  template: `
    <div class="score-display">
      <!-- Stats Summary -->
      <div class="card mb-4" v-if="scores && scores.length > 0">
        <div class="card-header">
          <h5 class="mb-0">Performance Summary</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-4 text-center mb-3">
              <h6 class="text-muted">Total Quizzes Taken</h6>
              <h2>{{ scores.length }}</h2>
            </div>
            <div class="col-md-4 text-center mb-3">
              <h6 class="text-muted">Average Score</h6>
              <h2>{{ (scores.reduce((sum, score) => sum + score.percentage_score, 0) / scores.length).toFixed(1) }}%</h2>
            </div>
            <div class="col-md-4 text-center mb-3">
              <h6 class="text-muted">Last Quiz</h6>
              <h2 v-if="scores.length">{{ formatDate(scores[0].attempt_date) }}</h2>
              <h2 v-else>-</h2>
            </div>
          </div>
          
          <!-- Performance Chart -->
          <div v-if="scoreStats && scores.length >= 3" class="mt-4">
            <canvas id="performanceChart"></canvas>
          </div>
        </div>
      </div>
      
      <!-- Filters and Search -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <div class="input-group">
                <span class="input-group-text">
                  <i class="fas fa-search"></i>
                </span>
                <input type="text" class="form-control" placeholder="Search quizzes..." v-model="searchTerm">
              </div>
            </div>
            <div class="col-md-3">
              <select class="form-select" v-model="sortBy">
                <option value="attempt_date">Sort by Date</option>
                <option value="percentage_score">Sort by Score</option>
                <option value="quiz_title">Sort by Quiz Title</option>
                <option value="subject_name">Sort by Subject</option>
              </select>
            </div>
            <div class="col-md-3">
              <select class="form-select" v-model="sortDirection">
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Scores Table -->
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">Quiz History</h5>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th v-if="isAdmin">User</th>
                  <th>Subject</th>
                  <th>Chapter</th>
                  <th>Quiz</th>
                  <th>Score</th>
                  <th>Time Taken</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="paginatedScores.length === 0">
                  <td :colspan="isAdmin ? 7 : 6" class="text-center py-4">
                    <p class="text-muted mb-0">No scores found</p>
                  </td>
                </tr>
                <tr v-for="score in paginatedScores" :key="score.id">
                  <td>{{ formatDate(score.attempt_date) }}</td>
                  <td v-if="isAdmin">{{ score.username }}</td>
                  <td>{{ score.subject_name }}</td>
                  <td>{{ score.chapter_name }}</td>
                  <td>{{ score.quiz_title }}</td>
                  <td>
                    <span class="badge" :class="getScoreBadgeClass(score.percentage_score)">
                      {{ score.percentage_score.toFixed(1) }}%
                    </span>
                    <small class="text-muted ms-1">({{ score.total_correct }}/{{ score.total_questions }})</small>
                  </td>
                  <td>{{ formatTime(score.time_taken) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Pagination -->
        <div class="card-footer d-flex justify-content-between align-items-center">
          <div>
            Showing {{ paginatedScores.length }} of {{ filteredScores.length }} scores
          </div>
          <nav aria-label="Quiz scores pagination" v-if="totalPages > 1">
            <ul class="pagination mb-0">
              <li class="page-item" :class="{disabled: currentPage === 1}">
                <a class="page-link" href="#" @click.prevent="currentPage--" aria-label="Previous">
                  <span aria-hidden="true">&laquo;</span>
                </a>
              </li>
              <li class="page-item" v-for="page in totalPages" :key="page" :class="{active: currentPage === page}">
                <a class="page-link" href="#" @click.prevent="currentPage = page">{{ page }}</a>
              </li>
              <li class="page-item" :class="{disabled: currentPage === totalPages}">
                <a class="page-link" href="#" @click.prevent="currentPage++" aria-label="Next">
                  <span aria-hidden="true">&raquo;</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  `,
  methods: {
    formatDate(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    },
    
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    },
    
    getScoreBadgeClass(score) {
      if (score >= 80) return 'bg-success';
      if (score >= 60) return 'bg-primary';
      if (score >= 40) return 'bg-warning';
      return 'bg-danger';
    },
    
    renderCharts() {
      if (!this.scoreStats || this.scores.length < 3) return;
      
      const subjectScores = this.scoreStats.subjectScores;
      const chartData = {
        labels: subjectScores.map(stat => stat.subject),
        datasets: [
          {
            label: 'Average Score (%)',
            data: subjectScores.map(stat => stat.avgScore),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Number of Attempts',
            data: subjectScores.map(stat => stat.attempts),
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            yAxisID: 'y1'
          }
        ]
      };
      
      const config = {
        type: 'bar',
        data: chartData,
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Average Score (%)'
              },
              max: 100
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              grid: {
                drawOnChartArea: false
              },
              title: {
                display: true,
                text: 'Number of Attempts'
              }
            }
          }
        }
      };
      
      const ctx = document.getElementById('performanceChart').getContext('2d');
      new Chart(ctx, config);
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (this.scores && this.scores.length >= 3) {
        this.renderCharts();
      }
    });
  },
  updated() {
    this.$nextTick(() => {
      if (document.getElementById('performanceChart') && this.scores && this.scores.length >= 3) {
        this.renderCharts();
      }
    });
  }
});
