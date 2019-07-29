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
          category: 'profile-pic',
          destination: 'profile-pic',
          allowedExtensions: ['.png', '.jpg']
        }
      ]
    }
  }
}
