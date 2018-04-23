import http from 'http'
import Stremio from 'stremio-addons'
import serveStatic from 'serve-static'
import Client from './Client'


const SUPPORTED_METHODS = [
  'stream.find', 'meta.find', 'meta.search', 'meta.get',
]
const STATIC_DIR = 'static'

const HOST = process.env.STREMIO_PORN_HOST || '0.0.0.0'
const PORT = process.env.STREMIO_PORN_PORT || 8008
const PROXY = process.env.STREMIO_PORN_PROXY
const USE_CACHE = (process.env.STREMIO_PORN_CACHE !== '0')
const IS_PROD = process.env.NODE_ENV === 'production'

const MANIFEST = {
  name: 'Porn',
  id: 'org.stremio.porn',
  version: '0.0.0',
  description: 'Time to unsheathe your sword!',
  types: ['movie', 'tv'],
  idProperty: Client.ID,
  dontAnnounce: !IS_PROD,
  sorts: Client.SORTS,
  // icon: 'URL to 256x256 monochrome png icon',
  // background: 'URL to 1366x756 png background',
}


function makeMethod(client, methodName) {
  return (request, cb) => {
    return client.invokeMethod(methodName, request).then(
      (response) => cb(null, response),
      (err) => {
        /* eslint-disable no-console */
        console.error(
          'An error has occurred while processing ' +
          `the following request to ${methodName}:`
        )
        console.error(request)
        console.error(err)
        /* eslint-enable no-console */
        cb(err)
      }
    )
  }
}

function makeMethods(client, methodNames) {
  return methodNames.reduce((methods, methodName) => {
    methods[methodName] = makeMethod(client, methodName)
    return methods
  }, {})
}


let client = new Client({ proxy: PROXY, cache: USE_CACHE })
let methods = makeMethods(client, SUPPORTED_METHODS)
let addon = new Stremio.Server(methods, MANIFEST)
let server = http.createServer((req, res) => {
  serveStatic(STATIC_DIR)(req, res, () => {
    addon.middleware(req, res, () => res.end())
  })
})

server
  .on('listening', () => {
    /* eslint-disable no-console */
    console.log(`Porn Addon is listening on ${HOST}:${PORT}`)

    if (PROXY) {
      console.log(`Using proxy ${PROXY}`)
    }

    if (USE_CACHE) {
      console.log('Using cache')
    }
    /* eslint-enable no-console */
  })
  .listen(PORT, HOST)
