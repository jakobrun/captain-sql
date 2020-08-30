import { ICommitControlUpdateEvent } from '../modules/commitControl'
const prop = require('mithril/stream')

export const createStatusbar = (m, pubsub) => {
    let rowCount = 0
    let startTime
    let time
    const exportData = {
        tables: 0,
        errors: 0,
    }
    const status = prop('')
    const exportStatus = prop('')
    const commitStatus = prop('')
    const uncommited = prop(0)
    const uncommitedClass = prop('')
    const getRowsText = res => {
        if (res.data && res.data.length) {
            rowCount += res.data.length
            return ', ' + (res.isMore ? 'more than ' : '') + rowCount + ' rows'
        }
        return ''
    }
    const endTime = res => {
        if (startTime) {
            time = Date.now() - startTime
            rowCount = 0
            status('Time ' + time + 'ms' + getRowsText(res))
            startTime = undefined
        }
    }

    function setStatus(text) {
        status(text)
        m.redraw()
    }

    pubsub.on('run-query', () => {
        startTime = Date.now()
        setStatus('executing...')
    })
    pubsub.on('reconnecting', () => setStatus('reconnecting...'))
    pubsub.on('data', endTime)
    pubsub.on('data-updated', endTime)
    pubsub.on('commit-ctrl-update', endTime)
    pubsub.on('data-more', res => {
        status('Time ' + time + 'ms' + getRowsText(res))
    })
    pubsub.on('data-error', endTime)
    pubsub.on('schema-loaded', () => {
        setStatus('Schema loaded !')
    })

    const setExportStatus = () => {
        exportStatus(
            `Exported tables: ${exportData.tables}${
                exportData.errors ? `, errors ${exportData.errors}` : ''
            }`
        )
        m.redraw()
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
    pubsub.on('commit-ctrl-update', (event: ICommitControlUpdateEvent) => {
        if (event.autoCommit) {
            commitStatus('Auto commit')
        } else {
            commitStatus('')
        }
        uncommited(event.uncommited.length)
        if (event.uncommited.length) {
            uncommitedClass('statusbar-uncommited notify-uncommited')
            setTimeout(() => {
                uncommitedClass('statusbar-uncommited')
                m.redraw()
            }, 1000)
        } else {
            uncommitedClass('statusbar-uncommited hide-login-item')
        }
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
                    m('div.statusbar-commit-status', commitStatus()),
                    m(
                        'div',
                        { title: 'Uncommited', class: uncommitedClass() },
                        uncommited()
                    ),
                ]
            )
        },
    }
}
