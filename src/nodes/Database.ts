import { Connection, RowDataPacket } from 'mysql2/promise';
import { Table } from './Table';
import { Generate } from '../Generate';

export class Database implements Generate {
    private connection: Connection;
    private outputFolder: string;

    constructor(connection: Connection, outputFolder: string) {
        this.connection = connection;
        this.outputFolder = outputFolder;
    }

    async generate(): Promise<any> {
        let results = await this.connection.query("SHOW TABLES;") as RowDataPacket[][];


        for (const row of results[0]) {
            const tableName = Object.values(row)[0];

            const table = new Table(
                this.connection,
                tableName,
                this.outputFolder
            );
            await table.generate();
        }
    };
}
