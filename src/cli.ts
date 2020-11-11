#!/usr/bin/env node
import yargs = require("yargs");
import { AllCommand } from './commands/AllCommand';
import { ChildCommand } from './commands/ChildCommand';


yargs
    .usage("Usage: $0 <command> [options]")
    .command(new AllCommand())
    .command(new ChildCommand())
    .recommendCommands()
    .demandCommand(1)
    .strict()
    .option("username", {
        default: "root",
        required: false,
        describe: "Username to authenticate for database connection"
    })
    .option("password", {
        default: "",
        required: false,
        describe: "Password to authenticate for database connection"
    })
    .option("host", {
        default: "127.0.0.1",
        required: false,
        describe: "Host of the database connection"
    })
    .option("port", {
        default: 3306,
        required: false,
        describe: "Port of the database connection"
    })
    .option("database", {
        describe: "Database name"
    })
    .option("output-directory", {
        describe: "Your migrations directory."
    })
    .alias("v", "version")
    .help("h")
    .alias("h", "help")
    .argv;

require("yargonaut")
    .style("blue")
    .style("yellow", "required")
    .helpStyle("green")
    .errorsStyle("red");
