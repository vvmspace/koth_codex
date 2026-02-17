module.exports = {
  onSuccess: async ({ utils }) => {
    utils.status.show({
      summary: 'postdeploy-migrate plugin is a no-op in this MVP',
      text: 'Database migrations are applied manually via Supabase SQL migrations.',
    });
  },
};
