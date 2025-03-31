Vue.component('manage-quizzes-page', {
  data() {
    return {
      quizzes: [],
      subjects: [],
      chapters: [],
      selectedSubjects: [],
      selectedChapters: [],
      isLoading: true,
      error: null,
      showCreateModal: false,
      newQuiz: {
        title: '',
        description: '',
        subject_id: '',
        chapter_id: '',
        date_of_quiz: '',
        time_duration: 30
      },
      editingQuiz: null,
      searchQuery: ''
    };
  },
  created() {
    this.fetchSubjects();
    this.fetchChapters();
    this.fetchQuizzes();
  },
  computed: {
    filteredQuizzes() {
      let result = this.quizzes;
      
      // Apply subject filter if any subjects are selected
      if (this.selectedSubjects.length > 0) {
        result = result.filter(quiz => this.selectedSubjects.includes(quiz.subject_id));
      }
      
      // Apply chapter filter if any chapters are selected
      if (this.selectedChapters.length > 0) {
        result = result.filter(quiz => this.selectedChapters.includes(quiz.chapter_id));
      }
      
      // Apply search filter if there's a search query
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase().trim();
        result = result.filter(quiz => 
          quiz.title.toLowerCase().includes(query) ||
          (quiz.description && quiz.description.toLowerCase().includes(query)) ||
          (quiz.subject_name && quiz.subject_name.toLowerCase().includes(query)) ||
          (quiz.chapter_name && quiz.chapter_name.toLowerCase().includes(query))
        );
      }
      
      return result;
    },
    
    availableChapters() {
      if (!this.editingQuiz && !this.newQuiz.subject_id) {
        return this.chapters;
      }
      
      const subjectId = this.editingQuiz ? this.editingQuiz.subject_id : this.newQuiz.subject_id;
      return this.chapters.filter(chapter => chapter.subject_id === subjectId);
    }
  },
  methods: {
    fetchSubjects() {
      api.get('/api/subjects')
        .then(response => {
          this.subjects = response.data;
        })
        .catch(error => {
          console.error('Error fetching subjects:', error);
          this.error = 'Failed to load subjects.';
        });
    },
    fetchChapters() {
      api.get('/api/chapters')
        .then(response => {
          this.chapters = response.data;
        })
        .catch(error => {
          console.error('Error fetching chapters:', error);
          this.error = 'Failed to load chapters.';
        });
    },
    fetchQuizzes() {
      this.isLoading = true;
      this.error = null;
      
      api.get('/api/quizzes')
        .then(response => {
          if (Array.isArray(response.data)) {
            this.quizzes = response.data.map(quiz => {
              const subject = this.subjects.find(s => s.id === quiz.subject_id);
              const chapter = this.chapters.find(c => c.id === quiz.chapter_id);
              
              return {
                ...quiz,
                subject_name: subject ? subject.name : 'Unknown Subject',
                chapter_name: chapter ? chapter.name : 'Unknown Chapter'
              };
            });
          } else {
            console.error('Unexpected response format:', response.data);
            this.error = 'Received invalid data format from server.';
          }
          this.isLoading = false;
        })
        .catch(error => {
          console.error('Error fetching quizzes:', error);
          this.error = 'Failed to load quizzes. Please try refreshing the page.';
          this.isLoading = false;
        });
    },
    manageQuestions(quizId) {
      this.$root.navigateTo(`/quizzes/${quizId}/questions`);
    },
    editQuiz(quiz) {
      this.editingQuiz = { ...quiz };
      this.showCreateModal = true;
    },
    deleteQuiz(quizId) {
      if (confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
        api.delete(`/api/quizzes/${quizId}`)
          .then(() => {
            this.quizzes = this.quizzes.filter(q => q.id !== quizId);
            this.showToast('Quiz deleted successfully');
          })
          .catch(error => {
            console.error('Error deleting quiz:', error);
            this.error = 'Failed to delete quiz.';
          });
      }
    },
    saveQuiz() {
      const isEditing = !!this.editingQuiz;
      const quizData = isEditing ? this.editingQuiz : this.newQuiz;
      const apiCall = isEditing 
        ? api.put(`/api/quizzes/${this.editingQuiz.id}`, quizData)
        : api.post('/api/quizzes', quizData);
      apiCall
        .then(response => {
          if (isEditing) {
            const index = this.quizzes.findIndex(q => q.id === this.editingQuiz.id);
            if (index !== -1) {
              this.quizzes[index] = { ...response.data };
            }
            this.showToast('Quiz updated successfully');
          } else {
            this.quizzes.push(response.data);
            this.showToast('Quiz created successfully');
          }
          this.closeModal();
          this.fetchQuizzes();
        })
        .catch(error => {
          console.error('Error saving quiz:', error);
          this.error = 'Failed to save quiz.';
        });
    },
    closeModal() {
      this.showCreateModal = false;
      this.editingQuiz = null;
      this.newQuiz = {
        title: '',
        description: '',
        subject_id: '',
        chapter_id: '',
        date_of_quiz: '',
        time_duration: 30
      };
    },
    showToast(message) {
      this.toastMessage = message;
      setTimeout(() => {
        this.toastMessage = '';
      }, 3000);
    },
    onSubjectChange() {
      if (this.newQuiz.subject_id) {
        this.fetchChaptersBySubject(this.newQuiz.subject_id);
      }
    },
    fetchChaptersBySubject(subjectId) {
      api.get(`/api/subjects/${subjectId}/chapters`)
        .then(response => {
          this.subjectChapters = response.data;
          this.newQuiz.chapter_id = '';
        })
        .catch(error => {
          console.error('Error fetching chapters for subject:', error);
        });
    }
  },
  template: `
    <div class="manage-quizzes-page container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">Manage Quizzes</h4>
        <button class="btn btn-primary" @click="showCreateModal = true">
          <i class="fas fa-plus me-2"></i>Create New Quiz
        </button>
      </div>
      
      <!-- Error Message -->
      <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ error }}
        <button type="button" class="btn-close" @click="error = ''"></button>
      </div>
      
      <!-- Search Box -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="input-group">
            <span class="input-group-text"><i class="fas fa-search"></i></span>
            <input type="text" class="form-control" v-model="searchQuery" 
                   placeholder="Search quizzes by title, description, subject or chapter">
            <button v-if="searchQuery" class="btn btn-outline-secondary" type="button" @click="searchQuery = ''">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Loading Indicator -->
      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading quizzes...</p>
      </div>
      
      <!-- Quiz Cards Grid -->
      <div v-else-if="filteredQuizzes.length > 0">
        <div class="mb-3 d-flex justify-content-between align-items-center">
          <span class="text-muted">{{ filteredQuizzes.length }} quizzes found</span>
        </div>
        
        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          <div v-for="quiz in filteredQuizzes" :key="quiz.id" class="col">
            <quiz-card 
              :quiz="quiz" 
              :isUserView="false"
              @edit-quiz="editQuiz" 
              @manage-questions="manageQuestions" 
              @delete-quiz="deleteQuiz">
            </quiz-card>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else class="text-center py-5">
        <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
        <h5>No quizzes found</h5>
        <p class="text-muted">
          {{ searchQuery ? 'No quizzes match your search criteria.' : 'Get started by creating your first quiz.' }}
        </p>
        <button v-if="searchQuery" class="btn btn-outline-secondary me-2" @click="searchQuery = ''">
          Clear Search
        </button>
        <button class="btn btn-primary" @click="showCreateModal = true">
          <i class="fas fa-plus me-2"></i>Create New Quiz
        </button>
      </div>
      
      <!-- Create/Edit Quiz Modal -->
      <div class="modal fade" :class="{ show: showCreateModal }" tabindex="-1" 
           :style="{ display: showCreateModal ? 'block' : 'none' }">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editingQuiz ? 'Edit Quiz' : 'Create New Quiz' }}</h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="saveQuiz">
                <div class="mb-3">
                  <label class="form-label">Quiz Title</label>
                  <input type="text" class="form-control" v-model="editingQuiz ? editingQuiz.title : newQuiz.title" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Description</label>
                  <textarea class="form-control" v-model="editingQuiz ? editingQuiz.description : newQuiz.description" rows="3"></textarea>
                </div>
                <div class="row mb-3">
                  <div class="col-md-6">
                    <label class="form-label">Subject</label>
                    <select class="form-select" v-model="editingQuiz ? editingQuiz.subject_id : newQuiz.subject_id" @change="onSubjectChange" required>
                      <option value="" disabled>Select Subject</option>
                      <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                        {{ subject.name }}
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Chapter</label>
                    <select class="form-select" v-model="editingQuiz ? editingQuiz.chapter_id : newQuiz.chapter_id" required>
                      <option value="" disabled>Select Chapter</option>
                      <option v-for="chapter in availableChapters" :key="chapter.id" :value="chapter.id">
                        {{ chapter.name }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="row mb-3">
                  <div class="col-md-6">
                    <label class="form-label">Quiz Date</label>
                    <input type="date" class="form-control" v-model="editingQuiz ? editingQuiz.date_of_quiz : newQuiz.date_of_quiz" required>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Duration (minutes)</label>
                    <input type="number" class="form-control" v-model="editingQuiz ? editingQuiz.time_duration : newQuiz.time_duration" min="1" required>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
                  <button type="submit" class="btn btn-primary">{{ editingQuiz ? 'Update Quiz' : 'Create Quiz' }}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showCreateModal" class="modal-backdrop fade show"></div>
      
      <!-- Toast Notification -->
      <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
        <div v-if="toastMessage" class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="toast-header">
            <strong class="me-auto">Notification</strong>
            <button type="button" class="btn-close" @click="toastMessage = ''"></button>
          </div>
          <div class="toast-body">
            {{ toastMessage }}
          </div>
        </div>
      </div>
    </div>
  `
});
