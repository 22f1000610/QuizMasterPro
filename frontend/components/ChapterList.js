Vue.component('chapter-list', {
  props: {
    subjectId: {
      type: Number,
      required: false
    }
  },
  data() {
    return {
      subject: null,
      subjects: [],
      chapters: [],
      isLoading: true,
      error: null,
      showAddModal: false,
      showEditModal: false,
      newChapter: {
        name: '',
        description: '',
        subject_id: null
      },
      editingChapter: {
        id: null,
        name: '',
        description: ''
      },
      validationErrors: {},
      searchTerm: '',
      successMessage: '',
      deleteConfirmChapter: null,
      loadingSubjects: false
    };
  },
  computed: {
    filteredChapters() {
      if (!this.searchTerm) return this.chapters;
      
      const term = this.searchTerm.toLowerCase();
      return this.chapters.filter(chapter => 
        chapter.name.toLowerCase().includes(term) || 
        (chapter.description && chapter.description.toLowerCase().includes(term))
      );
    }
  },
  template: `
    <div class="chapter-list">
      <!-- Success Message -->
      <div v-if="successMessage" class="alert alert-success alert-dismissible fade show" role="alert">
        {{ successMessage }}
        <button type="button" class="btn-close" @click="successMessage = ''"></button>
      </div>
      
      <!-- Error Message -->
      <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ error }}
        <button type="button" class="btn-close" @click="error = ''"></button>
      </div>
      
      <!-- Breadcrumb & Title -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="mb-0">
            <button class="btn btn-sm btn-outline-secondary me-2" @click="goBackToSubjects">
              <i class="fas fa-arrow-left"></i>
            </button>
            Chapters for {{ subject ? subject.name : 'Loading...' }}
          </h4>
        </div>
      </div>
      
      <!-- Toolbar -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-2">
            <div class="col-md-6">
              <div class="input-group">
                <span class="input-group-text">
                  <i class="fas fa-search"></i>
                </span>
                <input type="text" class="form-control" placeholder="Search chapters..." v-model="searchTerm">
              </div>
            </div>
            <div class="col-md-6 text-end">
              <button class="btn btn-primary" @click="openAddModal">
                <i class="fas fa-plus-circle me-1"></i>Add New Chapter
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Chapters List -->
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">All Chapters</h5>
        </div>
        
        <div v-if="isLoading" class="card-body text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading chapters...</p>
        </div>
        
        <div v-else-if="filteredChapters.length === 0" class="card-body text-center py-5">
          <div v-if="searchTerm">
            <p class="text-muted mb-0">No chapters match your search.</p>
            <p>
              <button class="btn btn-sm btn-outline-secondary mt-2" @click="searchTerm = ''">
                Clear Search
              </button>
            </p>
          </div>
          <div v-else>
            <p class="text-muted mb-0">No chapters have been created for this subject yet.</p>
            <p>
              <button class="btn btn-sm btn-primary mt-2" @click="openAddModal">
                <i class="fas fa-plus-circle me-1"></i>Create your first chapter
              </button>
            </p>
          </div>
        </div>
        
        <div v-else class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Quizzes</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="chapter in filteredChapters" :key="chapter.id">
                  <td>{{ chapter.name }}</td>
                  <td>{{ chapter.description || '—' }}</td>
                  <td>
                    <span class="badge bg-primary rounded-pill">{{ chapter.quizzes_count }}</span>
                  </td>
                  <td>{{ formatDate(chapter.created_at) }}</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" @click="viewQuizzes(chapter)">
                        <i class="fas fa-question-circle me-1"></i>Quizzes
                      </button>
                      <button class="btn btn-outline-secondary" @click="editChapter(chapter)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-outline-danger" @click="confirmDelete(chapter)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Add Chapter Modal -->
      <div class="modal fade" id="addChapterModal" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Add New Chapter</h5>
              <button type="button" class="btn-close" @click="closeAddModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="addChapter">
                <div class="mb-3">
                  <label for="subjectSelect" class="form-label">Subject</label>
                  <select 
                    class="form-select" 
                    id="subjectSelect" 
                    v-model="newChapter.subject_id"
                    :class="{'is-invalid': validationErrors.subject_id}"
                    required
                  >
                    <option value="" disabled selected>Select a subject</option>
                    <option v-for="subject in subjects" :value="subject.id" :key="subject.id">
                      {{ subject.name }}
                    </option>
                  </select>
                  <div v-if="validationErrors.subject_id" class="invalid-feedback">
                    {{ validationErrors.subject_id }}
                  </div>
                </div>
                <div class="mb-3">
                  <label for="chapterName" class="form-label">Chapter Name</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    :class="{'is-invalid': validationErrors.name}"
                    id="chapterName" 
                    v-model="newChapter.name" 
                    required
                  >
                  <div v-if="validationErrors.name" class="invalid-feedback">
                    {{ validationErrors.name }}
                  </div>
                </div>
                <div class="mb-3">
                  <label for="chapterDescription" class="form-label">Description</label>
                  <textarea 
                    class="form-control" 
                    id="chapterDescription" 
                    v-model="newChapter.description" 
                    rows="3"
                  ></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeAddModal">Cancel</button>
              <button type="button" class="btn btn-primary" @click="addChapter">Add Chapter</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Edit Chapter Modal -->
      <div class="modal fade" id="editChapterModal" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Chapter</h5>
              <button type="button" class="btn-close" @click="closeEditModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="updateChapter">
                <div class="mb-3">
                  <label for="editChapterName" class="form-label">Chapter Name</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    :class="{'is-invalid': validationErrors.name}"
                    id="editChapterName" 
                    v-model="editingChapter.name" 
                    required
                  >
                  <div v-if="validationErrors.name" class="invalid-feedback">
                    {{ validationErrors.name }}
                  </div>
                </div>
                <div class="mb-3">
                  <label for="editChapterDescription" class="form-label">Description</label>
                  <textarea 
                    class="form-control" 
                    id="editChapterDescription" 
                    v-model="editingChapter.description" 
                    rows="3"
                  ></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeEditModal">Cancel</button>
              <button type="button" class="btn btn-primary" @click="updateChapter">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div class="modal fade" id="deleteChapterModal" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirm Delete</h5>
              <button type="button" class="btn-close" @click="closeDeleteModal"></button>
            </div>
            <div class="modal-body" v-if="deleteConfirmChapter">
              <p>Are you sure you want to delete the chapter "{{ deleteConfirmChapter.name }}"?</p>
              <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                This will also delete all quizzes and questions associated with this chapter.
                This action cannot be undone.
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeDeleteModal">Cancel</button>
              <button type="button" class="btn btn-danger" @click="deleteChapter">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  methods: {
    fetchSubjects() {
      this.loadingSubjects = true;
      
      api.get('/api/subjects')
        .then(response => {
          this.subjects = response.data;
          this.loadingSubjects = false;
        })
        .catch(error => {
          console.error('Error fetching subjects:', error);
          this.error = 'Failed to load subjects. Please try again.';
          this.loadingSubjects = false;
        });
    },
    
    fetchSubject() {
      if (!this.subjectId) {
        this.error = 'Invalid subject ID';
        this.isLoading = false;
        return;
      }
      
      api.get(`/api/subjects/${this.subjectId}`)
        .then(response => {
          this.subject = response.data;
        })
        .catch(error => {
          console.error('Error fetching subject details:', error);
          this.error = 'Failed to load subject details. Please try again.';
          this.isLoading = false;
        });
    },
    
    fetchChapters() {
      this.isLoading = true;
      this.error = null;
      
      api.get(`/api/subjects/${this.subjectId}/chapters`)
        .then(response => {
          this.chapters = response.data;
          this.isLoading = false;
        })
        .catch(error => {
          console.error('Error fetching chapters:', error);
          if (error.response && error.response.data && error.response.data.error) {
            this.error = error.response.data.error;
          } else {
            this.error = 'Failed to load chapters. Please try again.';
          }
          this.isLoading = false;
        });
    },
    
    goBackToSubjects() {
      this.$emit('go-back');
    },
    
    openAddModal() {
      // Fetch subjects if not loaded yet
      if (this.subjects.length === 0) {
        this.fetchSubjects();
      }
      
      this.newChapter = {
        name: '',
        description: '',
        subject_id: this.subjectId || ''
      };
      this.validationErrors = {};
      this.showAddModal = true;
      
      this.$nextTick(() => {
        new bootstrap.Modal(document.getElementById('addChapterModal')).show();
      });
    },
    
    closeAddModal() {
      const modal = bootstrap.Modal.getInstance(document.getElementById('addChapterModal'));
      if (modal) {
        modal.hide();
      }
      this.showAddModal = false;
    },
    
    validateChapter(chapter) {
      this.validationErrors = {};
      let isValid = true;
      
      if (!chapter.name || chapter.name.trim() === '') {
        this.validationErrors.name = 'Chapter name is required';
        isValid = false;
      }
      
      if (!chapter.subject_id) {
        this.validationErrors.subject_id = 'Subject selection is required';
        isValid = false;
      }
      
      return isValid;
    },
    
    addChapter() {
      if (!this.validateChapter(this.newChapter)) {
        return;
      }
      
      const subjectId = this.newChapter.subject_id;
      
      api.post(`/api/subjects/${subjectId}/chapters`, {
        name: this.newChapter.name,
        description: this.newChapter.description
      })
        .then(response => {
          // If the chapter belongs to the currently viewed subject, add it to the list
          if (subjectId === this.subjectId) {
            this.chapters.push(response.data.chapter);
          }
          this.successMessage = 'Chapter created successfully';
          this.closeAddModal();
          
          // If we're creating a chapter for a different subject, reload current subject's chapters
          if (subjectId !== this.subjectId && this.subjectId) {
            this.fetchChapters();
          }
        })
        .catch(error => {
          console.error('Error creating chapter:', error);
          if (error.response && error.response.data && error.response.data.error) {
            this.validationErrors.name = error.response.data.error;
          } else {
            this.error = 'Failed to create chapter. Please try again.';
            this.closeAddModal();
          }
        });
    },
    
    editChapter(chapter) {
      this.editingChapter = { ...chapter };
      this.validationErrors = {};
      this.showEditModal = true;
      
      this.$nextTick(() => {
        new bootstrap.Modal(document.getElementById('editChapterModal')).show();
      });
    },
    
    closeEditModal() {
      const modal = bootstrap.Modal.getInstance(document.getElementById('editChapterModal'));
      if (modal) {
        modal.hide();
      }
      this.showEditModal = false;
    },
    
    updateChapter() {
      if (!this.validateChapter(this.editingChapter)) {
        return;
      }
      
      api.put(`/api/chapters/${this.editingChapter.id}`, {
        name: this.editingChapter.name,
        description: this.editingChapter.description
      })
        .then(response => {
          // Update the chapter in the local array
          const index = this.chapters.findIndex(c => c.id === this.editingChapter.id);
          if (index !== -1) {
            this.chapters[index] = response.data.chapter;
          }
          
          this.successMessage = 'Chapter updated successfully';
          this.closeEditModal();
        })
        .catch(error => {
          console.error('Error updating chapter:', error);
          if (error.response && error.response.data && error.response.data.error) {
            this.validationErrors.name = error.response.data.error;
          } else {
            this.error = 'Failed to update chapter. Please try again.';
            this.closeEditModal();
          }
        });
    },
    
    confirmDelete(chapter) {
      this.deleteConfirmChapter = chapter;
      
      this.$nextTick(() => {
        new bootstrap.Modal(document.getElementById('deleteChapterModal')).show();
      });
    },
    
    closeDeleteModal() {
      const modal = bootstrap.Modal.getInstance(document.getElementById('deleteChapterModal'));
      if (modal) {
        modal.hide();
      }
      this.deleteConfirmChapter = null;
    },
    
    deleteChapter() {
      if (!this.deleteConfirmChapter) return;
      
      api.delete(`/api/chapters/${this.deleteConfirmChapter.id}`)
        .then(() => {
          // Remove the chapter from the local array
          this.chapters = this.chapters.filter(c => c.id !== this.deleteConfirmChapter.id);
          this.successMessage = `Chapter "${this.deleteConfirmChapter.name}" deleted successfully`;
          this.closeDeleteModal();
        })
        .catch(error => {
          console.error('Error deleting chapter:', error);
          if (error.response && error.response.data && error.response.data.error) {
            this.error = error.response.data.error;
          } else {
            this.error = 'Failed to delete chapter. Please try again.';
          }
          this.closeDeleteModal();
        });
    },
    
    viewQuizzes(chapter) {
      this.$emit('view-quizzes', chapter.id);
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    }
  },
  mounted() {
    // Always fetch subjects for the dropdown
    this.fetchSubjects();
    
    if (this.subjectId) {
      this.fetchSubject();
      this.fetchChapters();
    } else {
      this.isLoading = false;
    }
  },
  watch: {
    subjectId: {
      handler(newVal) {
        if (newVal) {
          this.fetchSubject();
          this.fetchChapters();
        }
      },
      immediate: true
    }
  }
});
