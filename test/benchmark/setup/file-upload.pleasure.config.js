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
          category: 'documents',
          destination: 'documents'
        }
      ]
    }
  }
}
