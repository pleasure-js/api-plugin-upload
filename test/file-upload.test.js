import test from 'ava'
import { spawn } from 'child_process'
import path from 'path'
import request from 'request-promise'
import fs from 'fs'
import checksum from 'checksum'
import util from 'util'
import { emptyDir, pathExists } from 'fs-extra'

let exitTrigger = []
const cleanExitTrigger = () => {
  exitTrigger.forEach(cb => cb())
  exitTrigger = []
}
const sha1 = util.promisify(checksum.file)

test.beforeEach(async () => {
  await emptyDir(fromStorage('./'))
  cleanExitTrigger()
})

test.after.always(async () => {
  await emptyDir(fromStorage('./'))
  exitTrigger.forEach(cb => cb())
})

const fromStorage = (...paths) => {
  return path.join(__dirname, 'benchmark/api/storage', ...paths)
}

const getFileupload = (...paths) => {
  return path.resolve(__dirname, 'benchmark/files-to-upload', ...paths)
}

const upload = (category, file, { fieldName = 'file', uploadUri = 'http://localhost:3000/api/upload' } = {}) => {
  const url = `${ uploadUri }/${ category }`
  // console.log({ url })
  return request.post({
    url,
    formData: {
      [fieldName]: fs.createReadStream(file)
    }
  })
}

const pdfFile = getFileupload('admin.pdf')
const imageFile = getFileupload('IMG_4441.png')
const largeFile = getFileupload('tag-heuer-with-logo.mov')

async function startApi (config) {
  const dev = spawn('pls', ['app', 'dev'], {
    cwd: path.join(__dirname, 'benchmark/api'),
    silent: true,
    env: Object.assign({}, process.env, {
      PLEASURE_CONFIG: path.join(__dirname, 'benchmark/setup', `${ config }.pleasure.config.js`)
    })
  })

  return new Promise((resolve, reject) => {
    dev.stdout.on('data', d => {
      // console.log(`server >>>`, d.toString())

      if (/pleasure-api-plugin-upload initialized/.test(d.toString())) {
        setTimeout(() => resolve({
          stop () {
            return dev.kill()
          }
        }), 1)
      }
    })

    dev.on('error', (err) => {
      console.log(`can not start sub process`, err)
      reject()
    })
  })
}

test(`Allow file uploads`, async t => {
  const { stop } = await startApi('file-upload')
  exitTrigger.push(stop)

  const checksum = await sha1(pdfFile)
  const { data } = JSON.parse(await upload(`documents`, pdfFile))

  t.truthy(checksum)
  t.is(data.hash, checksum)
  t.true(await pathExists(fromStorage('documents', checksum)))
})

test(`Restrict file uploads by extensions`, async t => {
  const { stop } = await startApi('file-upload-extensions')
  exitTrigger.push(stop)

  const { error } = JSON.parse(await upload(`profile-pic`, pdfFile))
  t.is(error, 'Not Implemented')

  const checksum = await sha1(imageFile)

  const { data } = JSON.parse(await upload(`profile-pic`, imageFile))
  t.is(data.hash, checksum)
  t.true(await pathExists(fromStorage('profile-pic', checksum)))
})

test(`Restrict file uploads by file size`, async t => {
  const { stop } = await startApi('file-upload-size-limit')
  exitTrigger.push(stop)

  const { data } = JSON.parse(await upload(`docs`, pdfFile))
  t.truthy(data.hash)

  const checksum = await sha1(largeFile)

  const { error } = JSON.parse(await upload(`docs`, largeFile))
  t.is(error, 'Not Implemented')
  t.false(await pathExists(fromStorage('docs', checksum)))
})
