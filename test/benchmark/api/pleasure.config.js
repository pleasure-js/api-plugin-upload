const { PleasureApiPluginUpload } = require('../../../')

module.exports = {
  debug: true,
  api: {
    plugins: [
      PleasureApiPluginUpload
    ]
  },
  ui: {
    postCssVariables: {
      theme: {
        profile: {
          // todo: see if it can be reloaded
          background: `black`, // can be accessed via var(--theme-profile-background) in any postcss scope
        }
      }
    }
  }
}
