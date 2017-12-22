import { EventEmitter } from 'events'
import { IClientConnection } from './connect'
import { IUpdatedEvent } from './executer'

export interface ICommitControlUpdateEvent {
    uncommited: IUpdatedEvent[]
    autoCommit: boolean | undefined
}

export const createCommitControl = (pubsub: EventEmitter) => {
    let connection: IClientConnection
    let uncommited: IUpdatedEvent[]

    const emitUpdate = () => {
        const event: ICommitControlUpdateEvent = {
            uncommited,
            autoCommit: connection.settings().autoCommit,
        }
        pubsub.emit('commit-ctrl-update', event)
    }

    pubsub.on('connected', c => {
        connection = c
        uncommited = []
        emitUpdate()
    })
    pubsub.on('data-updated', (res: IUpdatedEvent) => {
        if (!connection.settings().autoCommit) {
            uncommited.push(res)
            emitUpdate()
        }
    })

    pubsub.on('commit', () => {
        if (connection) {
            connection.commit()
            uncommited = []
            emitUpdate()
        }
        pubsub.emit('editor-focus', {})
    })

    pubsub.on('rollback', () => {
        if (connection) {
            connection.rollback()
            uncommited = []
            emitUpdate()
        }
        pubsub.emit('editor-focus', {})
    })
}
