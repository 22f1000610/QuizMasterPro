Vue.component('user-dashboard-page', {
  props: ['userInfo'],
  template: `
    <div class="user-dashboard-page">
      <user-dashboard 
        :user-info="userInfo"
        @page-change="handlePageChange"
      ></user-dashboard>
    </div>
  `,
  methods: {
    handlePageChange(page, params) {
      this.$emit('page-change', page, params);
    }
  }
});
