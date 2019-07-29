import sha1 from 'sha1'

export function generateFileName () {
  return sha1(Date.now() + '-' + Math.random().toString())
}
