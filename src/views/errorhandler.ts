export const createErrorHandler = m => {
    let message
    process.on('uncaughtException', err => {
        console.log('Caught exception: ', err.message, err.stack)
        message = err.message
        m.redraw(true)
    })

    document.addEventListener('keyup', e => {
        if (e.keyCode === 27 && message) {
            message = undefined
            m.redraw(true)
        }
    })

    return {
        view: () => {
            return m(
                'div',
                { class: 'container popup' + (message ? '' : ' hidden') },
                [
                    m(
                        'h2',
                        {
                            class: 'popup-title',
                        },
                        'Ups... '
                    ),
                    m(
                        'p',
                        'Unexpected error occurred. It is probably best to restart.'
                    ),
                    m('p', 'Message: ' + message),
                ]
            )
        },
    }
}
