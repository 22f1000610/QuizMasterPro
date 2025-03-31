Vue.component('manage-users-page', {
  template: `
    <div class="manage-users-page container py-4">
      <h2 class="mb-4">Manage Users</h2>
      
      <div class="row mb-4">
        <div class="col-12">
          <div class="card bg-dark">
            <div class="card-body">
              <h5 class="card-title">User Management Tools</h5>
              <p class="card-text">View, search, and manage user accounts. Track user activity and performance.</p>
              <button class="btn btn-primary me-2" @click="goToDashboard">
                <i class="fas fa-arrow-left me-1"></i>Back to Dashboard
              </button>
              <button class="btn btn-info" @click="exportUserData">
                <i class="fas fa-file-export me-1"></i>Export User Data
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <user-list ref="userList"></user-list>
    </div>
  `,
  methods: {
    goToDashboard() {
      this.$emit('page-change', 'admin-dashboard-page');
    },
    
    exportUserData() {
      // Export user data functionality
      alert('Export user data feature will be implemented soon.');
    }
  }
});