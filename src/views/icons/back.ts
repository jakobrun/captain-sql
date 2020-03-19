export const createBack = m =>
    m(
        'svg',
        {
            height: '24',
            viewBox: '0 0 24 24',
            width: '24',
        },
        [
            m('line', {
                x1: '7',
                y1: '12',
                x2: '15',
                y2: '20',
                'stroke-width': '2',
                'stroke-linecap': 'round',
            }),
            m('line', {
                x1: '7',
                y1: '12',
                x2: '15',
                y2: '4',
                'stroke-width': '2',
                'stroke-linecap': 'round',
            }),
        ]
    )

/*
<svg enable-background="new 0 0 50 50" height="50px" id="Layer_1" version="1.1" viewBox="0 0 50 50" width="50px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <rect fill="none" height="50" width="50"/>
    <polygon points="35,47.25 37.086,45.164 16.922,25 37.086,4.836 35,2.75 12.75,25 "/>
    <rect fill="none" height="50" width="50"/>
</svg>
*/
