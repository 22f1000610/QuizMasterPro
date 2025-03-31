Vue.component('manage-chapters-page', {
  props: ['currentParams'],
  data() {
    return {
      subjectId: null,
      subjects: [],
      isLoading: false,
      error: null,
      selectedSubjectId: null
    };
  },
  template: `
    <div class="manage-chapters-page container py-4">
      <h2 class="mb-4">Manage Chapters</h2>
      
      <!-- Redirect Message -->
      <div v-if="currentParams && currentParams.redirectMessage" class="alert alert-info alert-dismissible fade show" role="alert">
        {{ currentParams.redirectMessage }}
        <button type="button" class="btn-close" @click="currentParams.redirectMessage = ''"></button>
      </div>
      
      <!-- Error Message -->
      <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ error }}
        <button type="button" class="btn-close" @click="error = ''"></button>
      </div>
      
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Select Subject</h5>
            </div>
            <div class="card-body">
              <div v-if="isLoading" class="text-center py-3">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading subjects...</p>
              </div>
              <div v-else>
                <div class="mb-3">
                  <label for="subjectSelect" class="form-label">Subject</label>
                  <select 
                    class="form-select" 
                    id="subjectSelect" 
                    v-model="selectedSubjectId"
                    @change="onSubjectChange"
                  >
                    <option value="" disabled selected>Select a subject</option>
                    <option v-for="subject in subjects" :value="subject.id" :key="subject.id">
                      {{ subject.name }}
                    </option>
                  </select>
                </div>
                <div class="d-grid">
                  <button 
                    class="btn btn-primary" 
                    @click="goToSubjects"
                  >
                    <i class="fas fa-arrow-left me-1"></i>
                    Back to Subjects
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <chapter-list 
        v-if="subjectId"
        :subject-id="subjectId"
        @go-back="goToSubjects"
        @view-quizzes="viewQuizzes"
      ></chapter-list>
      
      <div v-else-if="!isLoading" class="alert alert-info">
        <i class="fas fa-info-circle me-2"></i>
        Please select a subject from the dropdown above to view its chapters.
      </div>
    </div>
  `,
  methods: {
    fetchSubjects() {
      this.isLoading = true;
      this.error = null;
      
      api.get('/api/subjects')
        .then(response => {
          this.subjects = response.data;
          this.isLoading = false;
          
          // If there's a subjectId in params, select it in the dropdown
          if (this.subjectId) {
            this.selectedSubjectId = this.subjectId;
          }
        })
        .catch(error => {
          console.error('Error fetching subjects:', error);
          if (error.response && error.response.data && error.response.data.error) {
            this.error = error.response.data.error;
          } else {
            this.error = 'Failed to load subjects. Please try again.';
          }
          this.isLoading = false;
        });
    },
    
    onSubjectChange() {
      if (this.selectedSubjectId) {
        this.subjectId = parseInt(this.selectedSubjectId, 10);
      } else {
        this.subjectId = null;
      }
    },
    
    goToSubjects() {
      this.$emit('page-change', 'manage-subjects-page');
    },
    
    viewQuizzes(chapterId) {
      this.$emit('page-change', 'manage-quizzes-page', { chapterId });
    }
  },
  created() {
    // Parse subjectId from URL params
    if (this.currentParams && this.currentParams.subjectId) {
      this.subjectId = parseInt(this.currentParams.subjectId, 10);
    }
    
    // Fetch subjects for the dropdown
    this.fetchSubjects();
  },
  watch: {
    currentParams: {
      handler(newParams) {
        if (newParams && newParams.subjectId) {
          this.subjectId = parseInt(newParams.subjectId, 10);
          this.selectedSubjectId = this.subjectId;
        }
      },
      deep: true
    }
  }
});
