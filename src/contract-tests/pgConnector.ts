import { expect } from 'chai'
import { connect } from '../modules/connectors/pgConnector'
import { IClientConnection } from '../modules/connectors/types'
import { IConnectionInfo } from '../modules/settings'

const settings: IConnectionInfo = {
    type: 'postgres',
    name: 'test',
    host: 'localhost',
    database: 'gandalf_test',
    user: '',
    editorFile: '',
    properties: {},
    history: {
        file: 'test',
        max: 500,
        min: 400,
    },
    schemas: [
        {
            name: 'public',
            file: 'public',
        },
    ],
}

describe('pg connector', () => {
    let c: IClientConnection
    before(async () => {
        c = await connect(
            {
                host: settings.host,
                user: settings.user,
                password: '',
            },
            settings
        )
    })
    after(() => c.close())
    it('should run query', async () => {
        const res = await c.execute(`select * from person`)
        expect(res.isQuery()).to.equal(true)
        const metadata = await res.metadata()
        expect(metadata.length).to.be.above(0)
        const rows = await res.query()
        expect(rows.data.length).to.be.above(0)
    })
    it('should update', async () => {
        const res = await c.execute(
            `update person set name='John' where personid in (5, 42)`
        )
        expect(res.isQuery()).to.equal(false)
        expect(await res.updated()).to.equal(2)
    })
})
