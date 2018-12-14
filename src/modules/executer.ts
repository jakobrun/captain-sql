export interface IUpdatedEvent {
    sql: string
    updated: number
}

export const createExecuter = (pubsub, editor, m) => {
    let more
    let connection

    const compute = fun => {
        return (...args) => {
            m.startComputation()
            fun(...args)
            m.endComputation()
        }
    }
    const emit = eventName => {
        return compute(res => {
            console.log('emit', eventName)
            pubsub.emit(eventName, res)
        })
    }
    const emitData = eventName => {
        return compute(res => {
            pubsub.emit(eventName, {
                data: res.data,
                isMore: !!res.more,
            })
            more = res.more
        })
    }
    const dataHandler = emitData('data')
    const moredataHandler = emitData('data-more')
    const errorHandler = compute(err => {
        const error =
            err.cause && err.cause.getMessageSync
                ? new Error(err.cause.getMessageSync())
                : err
        pubsub.emit('data-error', error)
    })
    const runQuery = () => {
        const sql = editor.getSelection() || editor.getCursorStatement()
        if (!connection) {
            return
        }
        if (sql.trim().toUpperCase() === 'COMMIT') {
            pubsub.emit('commit')
            return
        }
        if (sql.trim().toUpperCase() === 'ROLLBACK') {
            pubsub.emit('rollback')
            return
        }
        connection
            .execute(sql)
            .then(st => {
                if (st.isQuery()) {
                    st.metadata()
                        .then(emit('metadata'))
                        .catch(errorHandler)
                    st.query()
                        .then(res => {
                            pubsub.emit('succesfull-query', {
                                sql,
                                data: res.data,
                            })
                            return res
                        })
                        .then(dataHandler)
                        .catch(errorHandler)
                } else {
                    st.updated()
                        .then(
                            compute(updated => {
                                const event: IUpdatedEvent = {
                                    sql,
                                    updated,
                                }
                                pubsub.emit('data-updated', event)
                            })
                        )
                        .catch(errorHandler)
                }
            })
            .catch(errorHandler)
    }
    const loadMore = () => {
        if (!more) {
            return
        }
        more()
            .then(moredataHandler)
            .catch(errorHandler)
    }

    pubsub.on('connected', c => (connection = c))
    pubsub.on('run-query', runQuery)
    pubsub.on('load-more', loadMore)
}
