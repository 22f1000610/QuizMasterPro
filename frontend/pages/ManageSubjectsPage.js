Vue.component('manage-subjects-page', {
  template: `
    <div class="manage-subjects-page container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Manage Subjects</h1>
        <button class="btn btn-primary" @click="goToDashboard">
          <i class="fas fa-arrow-left me-2"></i>Back to Dashboard
        </button>
      </div>
      
      <subject-list 
        @view-chapters="viewChapters"
      ></subject-list>
    </div>
  `,
  methods: {
    goToDashboard() {
      this.$emit('page-change', 'admin-dashboard-page');
    },
    
    viewChapters(subjectId) {
      this.$emit('page-change', 'manage-chapters-page', { subjectId });
    }
  }
});
