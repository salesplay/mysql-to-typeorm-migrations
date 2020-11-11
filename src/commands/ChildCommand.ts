import yargs = require('yargs');
import { createConnection } from '../utils';
import { Table } from '../nodes/Table';

export class ChildCommand implements yargs.CommandModule {

    command = "child";
    describe = "Generates migrations for a specific child. ";

    builder(args: yargs.Argv) {
        return args.option("child-type", {
            default: "table",
            required: false,
            describe: "Child type. default is \"table\"",
        }).option("child-name", {
            describe: "Name of the child",
            required: true
        });
    }

    async handler(args: yargs.Arguments) {
        try {
            const connection = await createConnection(args);

            let child: Generate;
            const outputDir = args["output-directory"] as string;
            const childName = args["child-name"] as string;

            switch (args["child-type"] as string) {
                case "table":
                    child = new Table(connection, childName, outputDir);
                    break;
                default:
                    console.log("Error occured: This child type is not supported yet.");
                    process.exit(1);
            }

            await child.generate();
            process.exit(0);
        } catch (e) {
            console.log("Error occured: ");
            console.log(e);
            process.exit(1);
        }
    }
}
