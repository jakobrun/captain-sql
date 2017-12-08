export const createStatusbar = (m, pubsub) => {
    let rowCount = 0
    let time
    const exportData = {
        tables: 0,
        errors: 0,
    }
    const status = m.prop('')
    const exportStatus = m.prop('')
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

    const setExportStatus = () => {
        m.startComputation()
        exportStatus(
            `Exported tables: ${exportData.tables}${
                exportData.errors ? `, errors ${exportData.errors}` : ''
            }`
        )
        m.endComputation()
    }
    pubsub.on('export-schema-start', () => {
        exportData.tables = 0
        exportData.errors = 0
    })
    pubsub.on('export-error', err => {
        console.log('Export error', err.message)
        exportData.errors += 1
        setExportStatus()
    })
    pubsub.on('export-table', data => {
        setStatus(`Export table: ${data.table}`)
        exportData.tables += 1
        setExportStatus()
    })
    return {
        view() {
            return m(
                'div',
                {
                    class: 'statusbar',
                },
                [
                    m('div.statusbar-message', status()),
                    m('div.statusbar-export-schema', exportStatus()),
                ]
            )
        },
    }
}
