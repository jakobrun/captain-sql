import { EventEmitter } from 'events'

const isCmdAndNotCtrl = (e: KeyboardEvent) => e.metaKey && !e.ctrlKey
const isCtrlAndNotCmd = (e: KeyboardEvent) => e.ctrlKey && !e.metaKey
export const createGlobalShortcuts = (pubsub: EventEmitter) => {
    const isCmdOrCtrl =
        process.platform === 'darwin' ? isCmdAndNotCtrl : isCtrlAndNotCmd
    const showCommands = (e: KeyboardEvent) => {
        if (e.shiftKey && isCmdOrCtrl(e) && !e.ctrlKey && e.key === 'P') {
            pubsub.emit('actions-toggle-show')
        }
    }
    pubsub.on('connected', () => {
        window.addEventListener('keydown', showCommands)
    })

    pubsub.on('disconnect', () => {
        window.removeEventListener('keydown', showCommands)
    })
}
