export const createStatusbar = (m, pubsub) => {
    let rowCount = 0
    let time
    const status = m.prop('')
    const getRowsText = res => {
        if (res.data && res.data.length) {
            rowCount += res.data.length
            return ', ' + (res.isMore ? 'more than ' : '') + rowCount + ' rows'
        }
        return ''
    }
    const endTime = res => {
        time = Date.now() - time
        rowCount = 0
        status('Time ' + time + 'ms' + getRowsText(res))
    }

    function setStatus(text) {
        m.startComputation()
        status(text)
        m.endComputation()
    }

    pubsub.on('run-query', () => {
        time = Date.now()
        setStatus('executing...')
    })
    pubsub.on('reconnecting', () => setStatus('reconnecting...'))
    pubsub.on('data', endTime)
    pubsub.on('data-more', res => {
        status('Time ' + time + 'ms' + getRowsText(res))
    })
    pubsub.on('data-error', endTime)
    pubsub.on('schema-loaded', () => {
        setStatus('Schema loaded !')
    })
    return {
        view() {
            return m(
                'div',
                {
                    class: 'statusbar',
                },
                status()
            )
        },
    }
}
