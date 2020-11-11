import yargs = require('yargs');
import { createConnection } from '../utils';
import { Database } from '../nodes/Database';

export class AllCommand implements yargs.CommandModule {

    command = "all";
    describe = "Generates migrations for all tables. ";

    async handler(args: yargs.Arguments) {
        const connection = await createConnection(args);

        const migration = new Database(connection, args["output-directory"] as string);
        await migration.generate();

        process.exit(0);
    }
}
