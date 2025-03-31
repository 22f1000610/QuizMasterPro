Vue.component('subject-list', {
  data() {
    return {
      subjects: [],
      isLoading: true,
      error: null,
      showAddModal: false,
      showEditModal: false,
      newSubject: {
        name: '',
        description: ''
      },
      editingSubject: {
        id: null,
        name: '',
        description: ''
      },
      validationErrors: {},
      searchTerm: '',
      successMessage: '',
      deleteConfirmSubject: null
    };
  },
  computed: {
    filteredSubjects() {
      if (!this.searchTerm) return this.subjects;
      
      const term = this.searchTerm.toLowerCase();
      return this.subjects.filter(subject => 
        subject.name.toLowerCase().includes(term) || 
        (subject.description && subject.description.toLowerCase().includes(term))
      );
    }
  },
  template: `
    <div class="subject-list">
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
      
      <!-- Toolbar -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-2">
            <div class="col-md-6">
              <div class="input-group">
                <span class="input-group-text">
                  <i class="fas fa-search"></i>
                </span>
                <input type="text" class="form-control" placeholder="Search subjects..." v-model="searchTerm">
              </div>
            </div>
            <div class="col-md-6 text-end">
              <button class="btn btn-primary" @click="openAddModal">
                <i class="fas fa-plus-circle me-1"></i>Add New Subject
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Subjects List -->
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">All Subjects</h5>
        </div>
        
        <div v-if="isLoading" class="card-body text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading subjects...</p>
        </div>
        
        <div v-else-if="filteredSubjects.length === 0" class="card-body text-center py-5">
          <div v-if="searchTerm">
            <p class="text-muted mb-0">No subjects match your search.</p>
            <p>
              <button class="btn btn-sm btn-outline-secondary mt-2" @click="searchTerm = ''">
                Clear Search
              </button>
            </p>
          </div>
          <div v-else>
            <p class="text-muted mb-0">No subjects have been created yet.</p>
            <p>
              <button class="btn btn-sm btn-primary mt-2" @click="openAddModal">
                <i class="fas fa-plus-circle me-1"></i>Create your first subject
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
                  <th>Chapters</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="subject in filteredSubjects" :key="subject.id">
                  <td>{{ subject.name }}</td>
                  <td>{{ subject.description || '—' }}</td>
                  <td>
                    <span class="badge bg-primary rounded-pill">{{ subject.chapters_count }}</span>
                  </td>
                  <td>{{ formatDate(subject.created_at) }}</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" @click="viewChapters(subject)">
                        <i class="fas fa-bookmark me-1"></i>Chapters
                      </button>
                      <button class="btn btn-outline-secondary" @click="editSubject(subject)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-outline-danger" @click="confirmDelete(subject)">
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
      
      <!-- Add Subject Modal -->
      <div class="modal fade" id="addSubjectModal" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Add New Subject</h5>
              <button type="button" class="btn-close" @click="closeAddModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="addSubject">
                <div class="mb-3">
                  <label for="subjectName" class="form-label">Subject Name</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    :class="{'is-invalid': validationErrors.name}"
                    id="subjectName" 
                    v-model="newSubject.name" 
                    required
                  >
                  <div v-if="validationErrors.name" class="invalid-feedback">
                    {{ validationErrors.name }}
                  </div>
                </div>
                <div class="mb-3">
                  <label for="subjectDescription" class="form-label">Description</label>
                  <textarea 
                    class="form-control" 
                    id="subjectDescription" 
                    v-model="newSubject.description" 
                    rows="3"
                  ></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeAddModal">Cancel</button>
              <button type="button" class="btn btn-primary" @click="addSubject">Add Subject</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Edit Subject Modal -->
      <div class="modal fade" id="editSubjectModal" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Subject</h5>
              <button type="button" class="btn-close" @click="closeEditModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="updateSubject">
                <div class="mb-3">
                  <label for="editSubjectName" class="form-label">Subject Name</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    :class="{'is-invalid': validationErrors.name}"
                    id="editSubjectName" 
                    v-model="editingSubject.name" 
                    required
                  >
                  <div v-if="validationErrors.name" class="invalid-feedback">
                    {{ validationErrors.name }}
                  </div>
                </div>
                <div class="mb-3">
                  <label for="editSubjectDescription" class="form-label">Description</label>
                  <textarea 
                    class="form-control" 
                    id="editSubjectDescription" 
                    v-model="editingSubject.description" 
                    rows="3"
                  ></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeEditModal">Cancel</button>
              <button type="button" class="btn btn-primary" @click="updateSubject">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div class="modal fade" id="deleteSubjectModal" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirm Delete</h5>
              <button type="button" class="btn-close" @click="closeDeleteModal"></button>
            </div>
            <div class="modal-body" v-if="deleteConfirmSubject">
              <p>Are you sure you want to delete the subject "{{ deleteConfirmSubject.name }}"?</p>
              <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                This will also delete all chapters, quizzes, and questions associated with this subject.
                This action cannot be undone.
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeDeleteModal">Cancel</button>
              <button type="button" class="btn btn-danger" @click="deleteSubject">Delete</button>
            </div>
          </div>
        </div>
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
    
    openAddModal() {
      this.newSubject = {
        name: '',
        description: ''
      };
      this.validationErrors = {};
      this.showAddModal = true;
      
      this.$nextTick(() => {
        new bootstrap.Modal(document.getElementById('addSubjectModal')).show();
      });
    },
    
    closeAddModal() {
      const modal = bootstrap.Modal.getInstance(document.getElementById('addSubjectModal'));
      if (modal) {
        modal.hide();
      }
      this.showAddModal = false;
    },
    
    validateSubject(subject) {
      this.validationErrors = {};
      let isValid = true;
      
      if (!subject.name || subject.name.trim() === '') {
        this.validationErrors.name = 'Subject name is required';
        isValid = false;
      }
      
      return isValid;
    },
    
    addSubject() {
      if (!this.validateSubject(this.newSubject)) {
        return;
      }
      
      api.post('/api/subjects', this.newSubject)
        .then(response => {
          this.subjects.push(response.data.subject);
          this.successMessage = 'Subject created successfully';
          this.closeAddModal();
        })
        .catch(error => {
          console.error('Error creating subject:', error);
          if (error.response && error.response.data && error.response.data.error) {
            this.validationErrors.name = error.response.data.error;
          } else {
            this.error = 'Failed to create subject. Please try again.';
            this.closeAddModal();
          }
        });
    },
    
    editSubject(subject) {
      this.editingSubject = { ...subject };
      this.validationErrors = {};
      this.showEditModal = true;
      
      this.$nextTick(() => {
        new bootstrap.Modal(document.getElementById('editSubjectModal')).show();
      });
    },
    
    closeEditModal() {
      const modal = bootstrap.Modal.getInstance(document.getElementById('editSubjectModal'));
      if (modal) {
        modal.hide();
      }
      this.showEditModal = false;
    },
    
    updateSubject() {
      if (!this.validateSubject(this.editingSubject)) {
        return;
      }
      
      api.put(`/api/subjects/${this.editingSubject.id}`, {
        name: this.editingSubject.name,
        description: this.editingSubject.description
      })
        .then(response => {
          // Update the subject in the local array
          const index = this.subjects.findIndex(s => s.id === this.editingSubject.id);
          if (index !== -1) {
            this.subjects[index] = response.data.subject;
          }
          
          this.successMessage = 'Subject updated successfully';
          this.closeEditModal();
        })
        .catch(error => {
          console.error('Error updating subject:', error);
          if (error.response && error.response.data && error.response.data.error) {
            this.validationErrors.name = error.response.data.error;
          } else {
            this.error = 'Failed to update subject. Please try again.';
            this.closeEditModal();
          }
        });
    },
    
    confirmDelete(subject) {
      this.deleteConfirmSubject = subject;
      
      this.$nextTick(() => {
        new bootstrap.Modal(document.getElementById('deleteSubjectModal')).show();
      });
    },
    
    closeDeleteModal() {
      const modal = bootstrap.Modal.getInstance(document.getElementById('deleteSubjectModal'));
      if (modal) {
        modal.hide();
      }
      this.deleteConfirmSubject = null;
    },
    
    deleteSubject() {
      if (!this.deleteConfirmSubject) return;
      
      api.delete(`/api/subjects/${this.deleteConfirmSubject.id}`)
        .then(() => {
          // Remove the subject from the local array
          this.subjects = this.subjects.filter(s => s.id !== this.deleteConfirmSubject.id);
          this.successMessage = `Subject "${this.deleteConfirmSubject.name}" deleted successfully`;
          this.closeDeleteModal();
        })
        .catch(error => {
          console.error('Error deleting subject:', error);
          if (error.response && error.response.data && error.response.data.error) {
            this.error = error.response.data.error;
          } else {
            this.error = 'Failed to delete subject. Please try again.';
          }
          this.closeDeleteModal();
        });
    },
    
    viewChapters(subject) {
      this.$emit('view-chapters', subject.id);
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
    this.fetchSubjects();
  }
});
