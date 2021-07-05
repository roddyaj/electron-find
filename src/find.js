const EventEmitter = require('events')
const { print } = require('./utils.js')

const stopActions = ['clearSelection', 'keepSelection', 'activateSelection']
const ipc = Symbol('ipcRenderer')
const opts = Symbol('options')
const requestId = Symbol('requestId')
const activeMatch = Symbol('activeMatch')
const matches = Symbol('matches')
const initd = Symbol('initd')
const preText = Symbol('preText')

class Find extends EventEmitter {
  constructor (ipcRenderer, options = {}) {
    super()
    this[ipc] = ipcRenderer
    this[opts] = options
    this[requestId] = null
    this[activeMatch] = 0
    this[matches] = 0
    this[initd] = false
    this[preText] = ''
  }
  initFind () {
    if (this[initd]) return false
    if (isIPC.call(this)) {
      bindFound.call(this)
      return this[initd] = true
    } else {
      throw new Error('[Find] In need of a valid webContents !')
    }
  }
  destroyFind () {
    this[ipc] = null
    this[opts]  = null
    this[requestId] = null
    this[activeMatch] = 0
    this[matches] = 0
    this[initd] = false
    this[preText] = ''
  }
  isFinding () {
    return !!this[requestId]
  }
  startFind (text = '', forward = true, matchCase = false) {
    if (!text) return
    this[activeMatch] = 0
    this[matches] = 0
    this[preText] = text
    this[ipc].send('find', this[preText], {
      forward,
      matchCase
    })
    this[requestId] = 1
    print(`[Find] startFind text=${text} forward=${forward} matchCase=${matchCase}`)
  }
  findNext (forward, matchCase = false) {
    if (!this.isFinding()) throw new Error('Finding did not start yet !')
    this[ipc].send('find', this[preText], {
      forward,
      matchCase,
      findNext: true
    })
    this[requestId] = 1
    print(`[Find] findNext text=${this[preText]} forward=${forward} matchCase=${matchCase}`)
  }
  stopFind (action) {
    stopActions.includes(action) ? '' : action = 'clearSelection'
    this[ipc].send('stopFind', action)
    print(`[Find] stopFind action=${action}`)
  }
}
function isIPC() {
	return this[ipc] && typeof this[ipc].send === 'function'
}
function bindFound () {
  this[ipc].on('found-in-page', (e, r) => {
    onFoundInPage.call(this, r)
  })
}
function onFoundInPage (result) {
  print('[Find] onFoundInPage, ', result)
  // if (this[requestId] !== result.requestId) return
  typeof result.activeMatchOrdinal === 'number' ? this[activeMatch] = result.activeMatchOrdinal : ''
  typeof result.matches === 'number' ? this[matches] = result.matches : ''
  result.finalUpdate ? reportResult.call(this) : ''
}
function reportResult () {
  this.emit('result', this[activeMatch], this[matches])
  typeof this[opts].onResult === 'function' ? this[opts].onResult(this[activeMatch], this[matches]) : ''
}

module.exports = Find
