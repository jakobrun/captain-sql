import { IConnectionInfo } from '../settings'
import { connect as jt400Connect } from './jt400Connector'
import { connect as pgConnect } from './pgConnector'
import { IClientConnection } from './types'

export const connect = async (
    options,
    settings: IConnectionInfo
): Promise<IClientConnection> => {
    if (settings.type === 'postgres') {
        return pgConnect(options, settings)
    } else {
        return jt400Connect(options, settings)
    }
}
