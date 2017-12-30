import { Readable } from 'stream'
import { IConnectionInfo } from '../settings'

export interface IColumnMetadata {
    precision: number
    name: string
}

export interface IMoreBuffer {
    data: string[][]
    more?: () => Promise<IMoreBuffer>
}

export interface IStatement {
    isQuery: () => boolean
    metadata: () => Promise<IColumnMetadata[]>
    updated: () => Promise<number>
    query: () => Promise<IMoreBuffer>
}

export interface IClientConnection {
    settings: () => IConnectionInfo
    execute: (statement: string) => Promise<IStatement>
    isAutoCommit: () => boolean
    commit: () => Promise<void>
    rollback: () => Promise<void>
    close: () => void
    exportSchemaToFile: (options: any) => Readable
}
