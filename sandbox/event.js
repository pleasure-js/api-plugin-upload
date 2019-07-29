const { EventEmitter } = require('events')

const MyObj = Object.assign(new EventEmitter(), {
  papo: 'sandy',
  esHora () {
    this.emit('bailando')
    return 'de bailar'
  }
})

MyObj.on('bailando', function () {
  process.nextTick(() => {
    console.log(`A bailar, sin parar!`)
  })
})

console.log(MyObj.esHora())
