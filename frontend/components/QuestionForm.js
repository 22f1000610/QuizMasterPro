Vue.component('question-form', {
  props: {
    quizId: {
      type: Number,
      required: true
    },
    quizTitle: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      questions: [],
      isLoading: true,
      error: null,
      showAddModal: false,
      showEditModal: false,
      currentImageContext: null, // 'question', 'option1', etc.
      showImageModal: false,
      isNewQuestion: false, // Whether we're adding or editing
      newQuestion: {
        question_statement: '',
        question_image: '',
        option1: '',
        option1_image: '',
        option2: '',
        option2_image: '',
        option3: '',
        option3_image: '',
        option4: '',
        option4_image: '',
        correct_option: 1
      },
      editingQuestion: {
        id: null,
        question_statement: '',
        question_image: '',
        option1: '',
        option1_image: '',
        option2: '',
        option2_image: '',
        option3: '',
        option3_image: '',
        option4: '',
        option4_image: '',
        correct_option: 1
      },
      validationErrors: {},
      successMessage: '',
      deleteConfirmQuestion: null,
      imageUrlMode: {
        question: true,
        option1: true,
        option2: true,
        option3: true,
        option4: true
      }
    };
  },
  template: `
    <div class="question-form">
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
            <button class="btn btn-sm btn-outline-secondary me-2" @click="goBackToQuizzes">
              <i class="fas fa-arrow-left"></i>
            </button>
            Questions for {{ quizTitle }}
          </h4>
        </div>
        <div>
          <button class="btn btn-primary" @click="openAddModal">
            <i class="fas fa-plus-circle me-1"></i>Add New Question
          </button>
        </div>
      </div>
      
      <!-- Questions List -->
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">All Questions</h5>
          <span class="badge bg-primary">{{ questions.length }} questions</span>
        </div>
        
        <div v-if="isLoading" class="card-body text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading questions...</p>
        </div>
        
        <div v-else-if="questions.length === 0" class="card-body text-center py-5">
          <div>
            <p class="text-muted mb-0">No questions have been created for this quiz yet.</p>
            <p>
              <button class="btn btn-sm btn-primary mt-2" @click="openAddModal">
                <i class="fas fa-plus-circle me-1"></i>Create your first question
              </button>
            </p>
          </div>
        </div>
        
        <div v-else class="card-body">
          <div class="accordion" id="questionsAccordion">
            <div v-for="(question, index) in questions" :key="question.id" class="accordion-item mb-3">
              <h2 class="accordion-header" :id="'heading-' + question.id">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" :data-bs-target="'#collapse-' + question.id">
                  <div class="d-flex w-100 justify-content-between align-items-center">
                    <div>
                      <span class="badge bg-secondary me-2">Q{{ index + 1 }}</span>
                      {{ question.question_statement }}
                    </div>
                  </div>
                </button>
              </h2>
              <div :id="'collapse-' + question.id" class="accordion-collapse collapse" :data-bs-parent="'#questionsAccordion'">
                <div class="accordion-body">
                  <!-- Display question image if available -->
                  <div v-if="question.question_image" class="mb-3">
                    <img :src="question.question_image" class="img-fluid" style="max-height: 200px;">
                  </div>
                  
                  <div class="options-list mb-3">
                    <div class="option mb-2 p-2 border rounded" :class="{'bg-success bg-opacity-25': question.correct_option === 1}">
                      <div class="d-flex">
                        <div class="option-label me-2">A. </div>
                        <div>{{ question.option1 }}</div>
                      </div>
                      <div v-if="question.option1_image" class="mt-2">
                        <img :src="question.option1_image" class="img-fluid" style="max-height: 100px;">
                      </div>
                    </div>
                    
                    <div class="option mb-2 p-2 border rounded" :class="{'bg-success bg-opacity-25': question.correct_option === 2}">
                      <div class="d-flex">
                        <div class="option-label me-2">B. </div>
                        <div>{{ question.option2 }}</div>
                      </div>
                      <div v-if="question.option2_image" class="mt-2">
                        <img :src="question.option2_image" class="img-fluid" style="max-height: 100px;">
                      </div>
                    </div>
                    
                    <div class="option mb-2 p-2 border rounded" :class="{'bg-success bg-opacity-25': question.correct_option === 3}">
                      <div class="d-flex">
                        <div class="option-label me-2">C. </div>
                        <div>{{ question.option3 }}</div>
                      </div>
                      <div v-if="question.option3_image" class="mt-2">
                        <img :src="question.option3_image" class="img-fluid" style="max-height: 100px;">
                      </div>
                    </div>
                    
                    <div class="option mb-2 p-2 border rounded" :class="{'bg-success bg-opacity-25': question.correct_option === 4}">
                      <div class="d-flex">
                        <div class="option-label me-2">D. </div>
                        <div>{{ question.option4 }}</div>
                      </div>
                      <div v-if="question.option4_image" class="mt-2">
                        <img :src="question.option4_image" class="img-fluid" style="max-height: 100px;">
                      </div>
                    </div>
                  </div>
                  
                  <div class="d-flex justify-content-end">
                    <button class="btn btn-sm btn-outline-secondary me-2" @click="editQuestion(question)">
                      <i class="fas fa-edit me-1"></i>Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="confirmDelete(question)">
                      <i class="fas fa-trash me-1"></i>Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Add Question Modal -->
      <div class="modal fade" id="addQuestionModal" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Add New Question</h5>
              <button type="button" class="btn-close" @click="closeAddModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="addQuestion">
                <div class="mb-3">
                  <label for="questionStatement" class="form-label">Question</label>
                  <div class="input-group">
                    <textarea 
                      class="form-control" 
                      :class="{'is-invalid': validationErrors.question_statement}"
                      id="questionStatement" 
                      v-model="newQuestion.question_statement" 
                      rows="2"
                      required
                    ></textarea>
                    <button type="button" class="btn btn-outline-secondary" @click="openImageModal('question', true)">
                      <i class="fas fa-image"></i> Add Image
                    </button>
                  </div>
                  <div v-if="validationErrors.question_statement" class="invalid-feedback d-block">
                    {{ validationErrors.question_statement }}
                  </div>
                  <div v-if="newQuestion.question_image" class="mt-2">
                    <div class="d-flex align-items-center">
                      <img :src="newQuestion.question_image" class="img-fluid me-2" style="max-height: 100px; max-width: 150px;">
                      <button type="button" class="btn btn-sm btn-outline-danger" @click="removeImage('question', true)">
                        <i class="fas fa-times"></i> Remove
                      </button>
                    </div>
                  </div>
                </div>
                
                <div class="row mb-3">
                  <div class="col-md-6">
                    <label for="option1" class="form-label">Option A</label>
                    <div class="input-group">
                      <input 
                        type="text" 
                        class="form-control" 
                        :class="{'is-invalid': validationErrors.option1}"
                        id="option1" 
                        v-model="newQuestion.option1" 
                        required
                      >
                      <button type="button" class="btn btn-outline-secondary" @click="openImageModal('option1', true)">
                        <i class="fas fa-image"></i>
                      </button>
                    </div>
                    <div v-if="validationErrors.option1" class="invalid-feedback d-block">
                      {{ validationErrors.option1 }}
                    </div>
                    <div v-if="newQuestion.option1_image" class="mt-2">
                      <div class="d-flex align-items-center">
                        <img :src="newQuestion.option1_image" class="img-fluid me-2" style="max-height: 50px; max-width: 100px;">
                        <button type="button" class="btn btn-sm btn-outline-danger" @click="removeImage('option1', true)">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-md-6">
                    <label for="option2" class="form-label">Option B</label>
                    <div class="input-group">
                      <input 
                        type="text" 
                        class="form-control" 
                        :class="{'is-invalid': validationErrors.option2}"
                        id="option2" 
                        v-model="newQuestion.option2" 
                        required
                      >
                      <button type="button" class="btn btn-outline-secondary" @click="openImageModal('option2', true)">
                        <i class="fas fa-image"></i>
                      </button>
                    </div>
                    <div v-if="validationErrors.option2" class="invalid-feedback d-block">
                      {{ validationErrors.option2 }}
                    </div>
                    <div v-if="newQuestion.option2_image" class="mt-2">
                      <div class="d-flex align-items-center">
                        <img :src="newQuestion.option2_image" class="img-fluid me-2" style="max-height: 50px; max-width: 100px;">
                        <button type="button" class="btn btn-sm btn-outline-danger" @click="removeImage('option2', true)">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="row mb-3">
                  <div class="col-md-6">
                    <label for="option3" class="form-label">Option C</label>
                    <div class="input-group">
                      <input 
                        type="text" 
                        class="form-control" 
                        :class="{'is-invalid': validationErrors.option3}"
                        id="option3" 
                        v-model="newQuestion.option3" 
                        required
                      >
                      <button type="button" class="btn btn-outline-secondary" @click="openImageModal('option3', true)">
                        <i class="fas fa-image"></i>
                      </button>
                    </div>
                    <div v-if="validationErrors.option3" class="invalid-feedback d-block">
                      {{ validationErrors.option3 }}
                    </div>
                    <div v-if="newQuestion.option3_image" class="mt-2">
                      <div class="d-flex align-items-center">
                        <img :src="newQuestion.option3_image" class="img-fluid me-2" style="max-height: 50px; max-width: 100px;">
                        <button type="button" class="btn btn-sm btn-outline-danger" @click="removeImage('option3', true)">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-md-6">
                    <label for="option4" class="form-label">Option D</label>
                    <div class="input-group">
                      <input 
                        type="text" 
                        class="form-control" 
                        :class="{'is-invalid': validationErrors.option4}"
                        id="option4" 
                        v-model="newQuestion.option4" 
                        required
                      >
                      <button type="button" class="btn btn-outline-secondary" @click="openImageModal('option4', true)">
                        <i class="fas fa-image"></i>
                      </button>
                    </div>
                    <div v-if="validationErrors.option4" class="invalid-feedback d-block">
                      {{ validationErrors.option4 }}
                    </div>
                    <div v-if="newQuestion.option4_image" class="mt-2">
                      <div class="d-flex align-items-center">
                        <img :src="newQuestion.option4_image" class="img-fluid me-2" style="max-height: 50px; max-width: 100px;">
                        <button type="button" class="btn btn-sm btn-outline-danger" @click="removeImage('option4', true)">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="mb-3">
                  <label class="form-label">Correct Answer</label>
                  <div class="d-flex">
                    <div class="form-check me-4">
                      <input class="form-check-input" type="radio" name="correctOption" id="correctOptionA" value="1" v-model="newQuestion.correct_option">
                      <label class="form-check-label" for="correctOptionA">
                        Option A
                      </label>
                    </div>
                    <div class="form-check me-4">
                      <input class="form-check-input" type="radio" name="correctOption" id="correctOptionB" value="2" v-model="newQuestion.correct_option">
                      <label class="form-check-label" for="correctOptionB">
                        Option B
                      </label>
                    </div>
                    <div class="form-check me-4">
                      <input class="form-check-input" type="radio" name="correctOption" id="correctOptionC" value="3" v-model="newQuestion.correct_option">
                      <label class="form-check-label" for="correctOptionC">
                        Option C
                      </label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" name="correctOption" id="correctOptionD" value="4" v-model="newQuestion.correct_option">
                      <label class="form-check-label" for="correctOptionD">
                        Option D
                      </label>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeAddModal">Cancel</button>
              <button type="button" class="btn btn-primary" @click="addQuestion">Add Question</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Edit Question Modal -->
      <div class="modal fade" id="editQuestionModal" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Question</h5>
              <button type="button" class="btn-close" @click="closeEditModal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="updateQuestion">
                <div class="mb-3">
                  <label for="editQuestionStatement" class="form-label">Question</label>
                  <div class="input-group">
                    <textarea 
                      class="form-control" 
                      :class="{'is-invalid': validationErrors.question_statement}"
                      id="editQuestionStatement" 
                      v-model="editingQuestion.question_statement" 
                      rows="2"
                      required
                    ></textarea>
                    <button type="button" class="btn btn-outline-secondary" @click="openImageModal('question', false)">
                      <i class="fas fa-image"></i> Add Image
                    </button>
                  </div>
                  <div v-if="validationErrors.question_statement" class="invalid-feedback d-block">
                    {{ validationErrors.question_statement }}
                  </div>
                  <div v-if="editingQuestion.question_image" class="mt-2">
                    <div class="d-flex align-items-center">
                      <img :src="editingQuestion.question_image" class="img-fluid me-2" style="max-height: 100px; max-width: 150px;">
                      <button type="button" class="btn btn-sm btn-outline-danger" @click="removeImage('question', false)">
                        <i class="fas fa-times"></i> Remove
                      </button>
                    </div>
                  </div>
                </div>
                
                <div class="row mb-3">
                  <div class="col-md-6">
                    <label for="editOption1" class="form-label">Option A</label>
                    <div class="input-group">
                      <input 
                        type="text" 
                        class="form-control" 
                        :class="{'is-invalid': validationErrors.option1}"
                        id="editOption1" 
                        v-model="editingQuestion.option1" 
                        required
                      >
                      <button type="button" class="btn btn-outline-secondary" @click="openImageModal('option1', false)">
                        <i class="fas fa-image"></i>
                      </button>
                    </div>
                    <div v-if="validationErrors.option1" class="invalid-feedback d-block">
                      {{ validationErrors.option1 }}
                    </div>
                    <div v-if="editingQuestion.option1_image" class="mt-2">
                      <div class="d-flex align-items-center">
                        <img :src="editingQuestion.option1_image" class="img-fluid me-2" style="max-height: 50px; max-width: 100px;">
                        <button type="button" class="btn btn-sm btn-outline-danger" @click="removeImage('option1', false)">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-md-6">
                    <label for="editOption2" class="form-label">Option B</label>
                    <div class="input-group">
                      <input 
                        type="text" 
                        class="form-control" 
                        :class="{'is-invalid': validationErrors.option2}"
                        id="editOption2" 
                        v-model="editingQuestion.option2" 
                        required
                      >
                      <button type="button" class="btn btn-outline-secondary" @click="openImageModal('option2', false)">
                        <i class="fas fa-image"></i>
                      </button>
                    </div>
                    <div v-if="validationErrors.option2" class="invalid-feedback d-block">
                      {{ validationErrors.option2 }}
                    </div>
                    <div v-if="editingQuestion.option2_image" class="mt-2">
                      <div class="d-flex align-items-center">
                        <img :src="editingQuestion.option2_image" class="img-fluid me-2" style="max-height: 50px; max-width: 100px;">
                        <button type="button" class="btn btn-sm btn-outline-danger" @click="removeImage('option2', false)">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="row mb-3">
                  <div class="col-md-6">
                    <label for="editOption3" class="form-label">Option C</label>
                    <div class="input-group">
                      <input 
                        type="text" 
                        class="form-control" 
                        :class="{'is-invalid': validationErrors.option3}"
                        id="editOption3" 
                        v-model="editingQuestion.option3" 
                        required
                      >
                      <button type="button" class="btn btn-outline-secondary" @click="openImageModal('option3', false)">
                        <i class="fas fa-image"></i>
                      </button>
                    </div>
                    <div v-if="validationErrors.option3" class="invalid-feedback d-block">
                      {{ validationErrors.option3 }}
                    </div>
                    <div v-if="editingQuestion.option3_image" class="mt-2">
                      <div class="d-flex align-items-center">
                        <img :src="editingQuestion.option3_image" class="img-fluid me-2" style="max-height: 50px; max-width: 100px;">
                        <button type="button" class="btn btn-sm btn-outline-danger" @click="removeImage('option3', false)">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-md-6">
                    <label for="editOption4" class="form-label">Option D</label>
                    <div class="input-group">
                      <input 
                        type="text" 
                        class="form-control" 
                        :class="{'is-invalid': validationErrors.option4}"
                        id="editOption4" 
                        v-model="editingQuestion.option4" 
                        required
                      >
                      <button type="button" class="btn btn-outline-secondary" @click="openImageModal('option4', false)">
                        <i class="fas fa-image"></i>
                      </button>
                    </div>
                    <div v-if="validationErrors.option4" class="invalid-feedback d-block">
                      {{ validationErrors.option4 }}
                    </div>
                    <div v-if="editingQuestion.option4_image" class="mt-2">
                      <div class="d-flex align-items-center">
                        <img :src="editingQuestion.option4_image" class="img-fluid me-2" style="max-height: 50px; max-width: 100px;">
                        <button type="button" class="btn btn-sm btn-outline-danger" @click="removeImage('option4', false)">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="mb-3">
                  <label class="form-label">Correct Answer</label>
                  <div class="d-flex">
                    <div class="form-check me-4">
                      <input class="form-check-input" type="radio" name="editCorrectOption" id="editCorrectOptionA" :value="1" v-model="editingQuestion.correct_option">
                      <label class="form-check-label" for="editCorrectOptionA">
                        Option A
                      </label>
                    </div>
                    <div class="form-check me-4">
                      <input class="form-check-input" type="radio" name="editCorrectOption" id="editCorrectOptionB" :value="2" v-model="editingQuestion.correct_option">
                      <label class="form-check-label" for="editCorrectOptionB">
                        Option B
                      </label>
                    </div>
                    <div class="form-check me-4">
                      <input class="form-check-input" type="radio" name="editCorrectOption" id="editCorrectOptionC" :value="3" v-model="editingQuestion.correct_option">
                      <label class="form-check-label" for="editCorrectOptionC">
                        Option C
                      </label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" name="editCorrectOption" id="editCorrectOptionD" :value="4" v-model="editingQuestion.correct_option">
                      <label class="form-check-label" for="editCorrectOptionD">
                        Option D
                      </label>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeEditModal">Cancel</button>
              <button type="button" class="btn btn-primary" @click="updateQuestion">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Image Upload Modal -->
      <div class="modal fade" id="imageModal" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Add Image</h5>
              <button type="button" class="btn-close" @click="closeImageModal"></button>
            </div>
            <div class="modal-body">
              <ul class="nav nav-tabs mb-3">
                <li class="nav-item">
                  <a class="nav-link" :class="{ active: imageUrlMode[currentImageContext] }" href="#" @click.prevent="setImageMode(true)">Image URL</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" :class="{ active: !imageUrlMode[currentImageContext] }" href="#" @click.prevent="setImageMode(false)">Upload Image</a>
                </li>
              </ul>
              
              <div v-if="imageUrlMode[currentImageContext]">
                <div class="mb-3">
                  <label class="form-label">Image URL</label>
                  <input 
                    type="text" 
                    class="form-control"
                    placeholder="Enter image URL" 
                    v-model="getCurrentImageValue()"
                  >
                </div>
                <div v-if="getCurrentImageValue()" class="mb-3 text-center">
                  <img :src="getCurrentImageValue()" class="img-fluid" style="max-height: 200px;">
                </div>
              </div>
              <div v-else>
                <div class="mb-3">
                  <label class="form-label">Upload Image</label>
                  <input 
                    type="file" 
                    class="form-control"
                    accept="image/*"
                    @change="handleImageUpload($event)"
                  >
                </div>
                <div v-if="getCurrentImageValue()" class="mb-3 text-center">
                  <img :src="getCurrentImageValue()" class="img-fluid" style="max-height: 200px;">
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeImageModal">Cancel</button>
              <button type="button" class="btn btn-primary" @click="saveImage">Save Image</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div class="modal fade" id="deleteQuestionModal" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirm Delete</h5>
              <button type="button" class="btn-close" @click="closeDeleteModal"></button>
            </div>
            <div class="modal-body" v-if="deleteConfirmQuestion">
              <p>Are you sure you want to delete this question?</p>
              <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                This action cannot be undone.
              </div>
              <p class="mb-0"><strong>Question:</strong> {{ deleteConfirmQuestion.question_statement }}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeDeleteModal">Cancel</button>
              <button type="button" class="btn btn-danger" @click="deleteQuestion">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  methods: {
    fetchQuestions() {
      this.isLoading = true;
      this.error = null;
      
      console.log('fetchQuestions called with quizId:', this.quizId);
      
      api.get(`/api/quizzes/${this.quizId}/questions`)
        .then(response => {
          console.log('Questions API response:', response.data);
          this.questions = response.data;
          this.isLoading = false;
          
          // Initialize the Bootstrap accordion components
          this.$nextTick(() => {
            const accordionItems = document.querySelectorAll('.accordion-button');
            accordionItems.forEach(item => {
              item.addEventListener('click', function() {
                const target = this.getAttribute('data-bs-target');
                const collapse = new bootstrap.Collapse(document.querySelector(target));
              });
            });
          });
        })
        .catch(error => {
          console.error('Error fetching questions:', error);
          if (error.response && error.response.data && error.response.data.error) {
            this.error = error.response.data.error;
          } else {
            this.error = 'Failed to load questions. Please try again.';
          }
          this.isLoading = false;
        });
    },
    
    goBackToQuizzes() {
      // Use URL-based routing instead of event emission
      this.$root.navigateTo('/admin/quizzes');
    },
    
    openAddModal() {
      this.newQuestion = {
        question_statement: '',
        question_image: '',
        option1: '',
        option1_image: '',
        option2: '',
        option2_image: '',
        option3: '',
        option3_image: '',
        option4: '',
        option4_image: '',
        correct_option: 1
      };
      this.validationErrors = {};
      this.showAddModal = true;
      
      this.$nextTick(() => {
        new bootstrap.Modal(document.getElementById('addQuestionModal')).show();
      });
    },
    
    closeAddModal() {
      const modal = bootstrap.Modal.getInstance(document.getElementById('addQuestionModal'));
      if (modal) {
        modal.hide();
      }
      this.showAddModal = false;
    },
    
    validateQuestion(question) {
      this.validationErrors = {};
      let isValid = true;
      
      if (!question.question_statement || question.question_statement.trim() === '') {
        this.validationErrors.question_statement = 'Question is required';
        isValid = false;
      }
      
      if (!question.option1 || question.option1.trim() === '') {
        this.validationErrors.option1 = 'Option A is required';
        isValid = false;
      }
      
      if (!question.option2 || question.option2.trim() === '') {
        this.validationErrors.option2 = 'Option B is required';
        isValid = false;
      }
      
      if (!question.option3 || question.option3.trim() === '') {
        this.validationErrors.option3 = 'Option C is required';
        isValid = false;
      }
      
      if (!question.option4 || question.option4.trim() === '') {
        this.validationErrors.option4 = 'Option D is required';
        isValid = false;
      }
      
      return isValid;
    },
    
    addQuestion() {
      if (!this.validateQuestion(this.newQuestion)) {
        return;
      }
      
      // Ensure correct_option is numeric
      this.newQuestion.correct_option = parseInt(this.newQuestion.correct_option);
      
      // Create a question object with all fields including images
      const questionData = {
        question_statement: this.newQuestion.question_statement,
        question_image: this.newQuestion.question_image || null,
        option1: this.newQuestion.option1,
        option1_image: this.newQuestion.option1_image || null,
        option2: this.newQuestion.option2,
        option2_image: this.newQuestion.option2_image || null,
        option3: this.newQuestion.option3,
        option3_image: this.newQuestion.option3_image || null,
        option4: this.newQuestion.option4,
        option4_image: this.newQuestion.option4_image || null,
        correct_option: this.newQuestion.correct_option
      };
      
      api.post(`/api/quizzes/${this.quizId}/questions`, questionData)
        .then(response => {
          this.questions.push(response.data.question);
          this.successMessage = 'Question added successfully';
          this.closeAddModal();
        })
        .catch(error => {
          console.error('Error creating question:', error);
          if (error.response && error.response.data && error.response.data.error) {
            this.error = error.response.data.error;
            this.closeAddModal();
          } else {
            this.error = 'Failed to create question. Please try again.';
            this.closeAddModal();
          }
        });
    },
    
    editQuestion(question) {
      this.editingQuestion = { ...question };
      this.validationErrors = {};
      this.showEditModal = true;
      
      // Ensure correct_option is numeric
      this.editingQuestion.correct_option = parseInt(this.editingQuestion.correct_option);
      
      this.$nextTick(() => {
        new bootstrap.Modal(document.getElementById('editQuestionModal')).show();
      });
    },
    
    closeEditModal() {
      const modal = bootstrap.Modal.getInstance(document.getElementById('editQuestionModal'));
      if (modal) {
        modal.hide();
      }
      this.showEditModal = false;
    },
    
    updateQuestion() {
      if (!this.validateQuestion(this.editingQuestion)) {
        return;
      }
      
      // Ensure correct_option is numeric
      this.editingQuestion.correct_option = parseInt(this.editingQuestion.correct_option);
      
      // Create a question object with all fields including images
      const questionData = {
        question_statement: this.editingQuestion.question_statement,
        question_image: this.editingQuestion.question_image || null,
        option1: this.editingQuestion.option1,
        option1_image: this.editingQuestion.option1_image || null,
        option2: this.editingQuestion.option2,
        option2_image: this.editingQuestion.option2_image || null,
        option3: this.editingQuestion.option3,
        option3_image: this.editingQuestion.option3_image || null,
        option4: this.editingQuestion.option4,
        option4_image: this.editingQuestion.option4_image || null,
        correct_option: this.editingQuestion.correct_option
      };
      
      api.put(`/api/questions/${this.editingQuestion.id}`, questionData)
        .then(response => {
          // Update the question in the local array
          const index = this.questions.findIndex(q => q.id === this.editingQuestion.id);
          if (index !== -1) {
            this.questions[index] = response.data.question;
          }
          
          this.successMessage = 'Question updated successfully';
          this.closeEditModal();
        })
        .catch(error => {
          console.error('Error updating question:', error);
          if (error.response && error.response.data && error.response.data.error) {
            this.error = error.response.data.error;
            this.closeEditModal();
          } else {
            this.error = 'Failed to update question. Please try again.';
            this.closeEditModal();
          }
        });
    },
    
    confirmDelete(question) {
      this.deleteConfirmQuestion = question;
      
      this.$nextTick(() => {
        new bootstrap.Modal(document.getElementById('deleteQuestionModal')).show();
      });
    },
    
    closeDeleteModal() {
      const modal = bootstrap.Modal.getInstance(document.getElementById('deleteQuestionModal'));
      if (modal) {
        modal.hide();
      }
      this.deleteConfirmQuestion = null;
    },
    
    deleteQuestion() {
      if (!this.deleteConfirmQuestion) return;
      
      api.delete(`/api/questions/${this.deleteConfirmQuestion.id}`)
        .then(() => {
          // Remove the question from the local array
          this.questions = this.questions.filter(q => q.id !== this.deleteConfirmQuestion.id);
          this.successMessage = 'Question deleted successfully';
          this.closeDeleteModal();
        })
        .catch(error => {
          console.error('Error deleting question:', error);
          if (error.response && error.response.data && error.response.data.error) {
            this.error = error.response.data.error;
          } else {
            this.error = 'Failed to delete question. Please try again.';
          }
          this.closeDeleteModal();
        });
    },
    
    openImageModal(imageContext, isNew) {
      this.currentImageContext = imageContext;
      this.isNewQuestion = isNew;
      this.showImageModal = true;
      
      this.$nextTick(() => {
        new bootstrap.Modal(document.getElementById('imageModal')).show();
      });
    },
    
    closeImageModal() {
      const modal = bootstrap.Modal.getInstance(document.getElementById('imageModal'));
      if (modal) {
        modal.hide();
      }
      this.showImageModal = false;
      this.currentImageContext = null;
    },
    
    setImageMode(isUrl) {
      if (this.currentImageContext) {
        this.$set(this.imageUrlMode, this.currentImageContext, isUrl);
      }
    },
    
    getCurrentImageValue() {
      if (!this.currentImageContext) return '';
      
      const target = this.isNewQuestion ? this.newQuestion : this.editingQuestion;
      const field = `${this.currentImageContext}_image`;
      return target[field] || '';
    },
    
    setCurrentImageValue(value) {
      if (!this.currentImageContext) return;
      
      const target = this.isNewQuestion ? this.newQuestion : this.editingQuestion;
      const field = `${this.currentImageContext}_image`;
      this.$set(target, field, value);
    },
    
    saveImage() {
      this.closeImageModal();
    },
    
    removeImage(imageContext, isNew) {
      const target = isNew ? this.newQuestion : this.editingQuestion;
      const field = `${imageContext}_image`;
      this.$set(target, field, '');
    },
    
    handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      if (!file.type.match('image.*')) {
        this.error = 'Please select an image file';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.setCurrentImageValue(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  },
  mounted() {
    console.log('QuestionForm mounted with quizId:', this.quizId, 'type:', typeof this.quizId);
    console.log('QuestionForm quiz title:', this.quizTitle);
    this.fetchQuestions();
  },
  watch: {
    quizId: {
      handler(newVal) {
        if (newVal) {
          this.fetchQuestions();
        }
      },
      immediate: true
    }
  }
});
