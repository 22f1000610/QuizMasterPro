Vue.component('admin-dashboard-page', {
  props: ['userInfo'],
  template: `
    <div class="admin-dashboard-page">
      <admin-dashboard :user-info="userInfo" @page-change="handlePageChange"></admin-dashboard>
    </div>
  `,
  methods: {
    handlePageChange(page, params) {
      this.$emit('page-change', page, params);
    }
  }
});
