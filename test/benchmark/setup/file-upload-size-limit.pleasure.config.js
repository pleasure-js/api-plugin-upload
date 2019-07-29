const { PleasureApiPluginUpload } = require('../../../')
console.log(`HERE!!`)

module.exports = {
  debug: true,
  api: {
    plugins: [
      PleasureApiPluginUpload
    ],
    upload: {
      setup: [
        {
          category: 'docs',
          destination: 'docs',
          maxSize: 4 * 1024 * 1024 // 4MB
        }
      ]
    }
  }
}
