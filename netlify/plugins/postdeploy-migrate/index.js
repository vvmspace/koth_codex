const { spawnSync } = require('node:child_process');

module.exports = {
  onSuccess: async ({ utils }) => {
    console.log('[postdeploy-migrate] Deploy is successful. Running DB migrations...');

    const result = spawnSync('yarn', ['migrate:deploy'], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: process.env
    });

    if (result.status !== 0) {
      utils.build.failPlugin(
        `Post-deploy migrations failed with exit code ${result.status ?? 'unknown'}.`
      );
      return;
    }

    console.log('[postdeploy-migrate] Migrations completed successfully.');
  }
};
