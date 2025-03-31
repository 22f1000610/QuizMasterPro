Vue.component('user-list', {
  data() {
    return {
      users: [],
      isLoading: true,
      error: null,
      searchTerm: '',
      sortBy: 'created_at',
      sortDirection: 'desc',
      pageSize: 10,
      currentPage: 1
    };
  },
  computed: {
    filteredUsers() {
      if (!this.users) return [];
      
      let filtered = [...this.users];
      
      // Apply search filtering
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        filtered = filtered.filter(user => {
          return (
            user.username.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term)
          );
        });
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        let aValue = a[this.sortBy];
        let bValue = b[this.sortBy];
        
        // Special handling for dates
        if (this.sortBy === 'created_at' || this.sortBy === 'last_active') {
          aValue = new Date(aValue || '1970-01-01').getTime();
          bValue = new Date(bValue || '1970-01-01').getTime();
        }
        
        if (this.sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      return filtered;
    },
    
    paginatedUsers() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredUsers.slice(start, end);
    },
    
    totalPages() {
      return Math.ceil(this.filteredUsers.length / this.pageSize);
    }
  },
  template: `
    <div class="user-list">
      <!-- Error Message -->
      <div v-if="error" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ error }}
        <button type="button" class="btn-close" @click="error = ''"></button>
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
                <input type="text" class="form-control" placeholder="Search users..." v-model="searchTerm">
              </div>
            </div>
            <div class="col-md-3">
              <select class="form-select" v-model="sortBy">
                <option value="username">Sort by Username</option>
                <option value="email">Sort by Email</option>
                <option value="created_at">Sort by Registered Date</option>
                <option value="last_active">Sort by Last Active</option>
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
      
      <!-- Users Table -->
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">Users</h5>
        </div>
        
        <div v-if="isLoading" class="card-body text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading users...</p>
        </div>
        
        <div v-else-if="paginatedUsers.length === 0" class="card-body text-center py-5">
          <div v-if="searchTerm">
            <p class="text-muted mb-0">No users match your search criteria.</p>
            <p>
              <button class="btn btn-sm btn-outline-secondary mt-2" @click="searchTerm = ''">
                Clear Search
              </button>
            </p>
          </div>
          <div v-else>
            <p class="text-muted mb-0">No users found.</p>
          </div>
        </div>
        
        <div v-else class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in paginatedUsers" :key="user.id">
                  <td>
                    <span v-if="user.is_admin" class="badge bg-danger me-1">Admin</span>
                    {{ user.username }}
                  </td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span class="badge" :class="getUserStatusClass(user)">
                      {{ getUserStatus(user) }}
                    </span>
                  </td>
                  <td>{{ formatDate(user.created_at) }}</td>
                  <td>{{ user.last_active ? formatDate(user.last_active) : 'Never' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Pagination -->
        <div class="card-footer d-flex justify-content-between align-items-center">
          <div>
            Showing {{ paginatedUsers.length }} of {{ filteredUsers.length }} users
          </div>
          <nav aria-label="User pagination" v-if="totalPages > 1">
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
    fetchUsers() {
      this.isLoading = true;
      this.error = null;
      
      api.get('/api/admin/users')
        .then(response => {
          this.users = response.data;
          this.isLoading = false;
        })
        .catch(error => {
          console.error('Error fetching users:', error);
          if (error.response && error.response.data && error.response.data.error) {
            this.error = error.response.data.error;
          } else {
            this.error = 'Failed to load users. Please try again.';
          }
          this.isLoading = false;
        });
    },
    
    getUserStatus(user) {
      if (!user.last_active) return 'New';
      
      const lastActive = new Date(user.last_active);
      const now = new Date();
      const diffTime = Math.abs(now - lastActive);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) return 'Active';
      if (diffDays <= 7) return 'Recent';
      if (diffDays <= 30) return 'Inactive';
      return 'Dormant';
    },
    
    getUserStatusClass(user) {
      const status = this.getUserStatus(user);
      
      switch (status) {
        case 'Active': return 'bg-success';
        case 'Recent': return 'bg-primary';
        case 'New': return 'bg-info';
        case 'Inactive': return 'bg-warning';
        case 'Dormant': return 'bg-secondary';
        default: return 'bg-secondary';
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
  },
  mounted() {
    this.fetchUsers();
  }
});
