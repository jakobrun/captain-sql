import { EventEmitter } from 'events'

const isCmdAndNotCtrl = (e: KeyboardEvent) => e.metaKey && !e.ctrlKey
const isCtrlAndNotCmd = (e: KeyboardEvent) => e.ctrlKey && !e.metaKey
export const createGlobalShortcuts = (pubsub: EventEmitter) => {
    const isCmdOrCtrl =
        process.platform === 'darwin' ? isCmdAndNotCtrl : isCtrlAndNotCmd
    const showCommands = (e: KeyboardEvent) => {
        if (e.shiftKey && isCmdOrCtrl(e) && e.key === 'P') {
            pubsub.emit('actions-toggle-show')
        } else if (!e.shiftKey && isCmdOrCtrl(e) && e.key === 'h') {
            pubsub.emit('history-list')
        } else if (!e.shiftKey && isCmdOrCtrl(e) && e.key === '1') {
            pubsub.emit('editor-focus')
        } else if (!e.shiftKey && isCmdOrCtrl(e) && e.key === '2') {
            pubsub.emit('results-focus')
        }
    }
    pubsub.on('connected', () => {
        window.addEventListener('keydown', showCommands)
    })

    pubsub.on('disconnect', () => {
        window.removeEventListener('keydown', showCommands)
    })
}
