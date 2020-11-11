import { Connection, createConnection as sqlCreateConnection } from 'mysql2/promise';
import yargs = require('yargs');

export async function createConnection(args: yargs.Arguments): Promise<Connection> {
    return await sqlCreateConnection({
        user: args.username as string,
        password: args.password as string,
        host: args.host as string,
        port: parseInt(args.port as string),
        database: args.database as string
    });
}
