import { Connection, RowDataPacket } from 'mysql2/promise';
import { writeFileSync } from "fs";
import { join } from "path";
import camelCase = require("camelcase");
import { TableOptions } from 'typeorm/schema-builder/options/TableOptions';
import { TableColumnOptions } from "typeorm/schema-builder/options/TableColumnOptions";

export class Table implements Generate {
    private connection: Connection;
    private outputFolder: string;
    private tableName: string;

    constructor(connection: Connection, tableName: string, outputFolder: string) {
        this.connection = connection;
        this.outputFolder = outputFolder;
        this.tableName = tableName;
    }

    async generate(): Promise<any> {
        const time = (new Date()).getTime();
        let table: TableOptions = { name: this.tableName, columns: [], uniques: [] };
        let describeResults = await this.connection.query("DESCRIBE " + this.tableName) as RowDataPacket[][];

        const indexColumns: string[] = [];
        for (const row of describeResults[0]) {
            const type = row.Type.split("(")
            let column: TableColumnOptions = { name: row.Field, type: type[0] };
            if (type.length > 1) {
                const length = (type[1] as string).substr(0, type[1].length - 1);

                if (type[0] == "enum") {
                    column.enum = length.substr(1, length.length - 2).split("','");
                } else {
                    column.length = length;
                }
            }
            if (row.Key == "PRI") {
                indexColumns.push(column.name);
                column.isPrimary = true;
            }

            if (row.Key == "UNI") {
                indexColumns.push(column.name);
                column.isUnique = true;
            }

            if (row.Extra == "auto_increment") {
                column.isGenerated = true;
                column.generationStrategy = "increment";
            }

            if (row.Extra == "on update current_timestamp()") {
                column.onUpdate = "CURRENT_TIMESTAMP";
            }

            if (row.Default == "current_timestamp()") {
                column.default = "CURRENT_TIMESTAMP"
            } else if (row.Default == null) {
                column.default = "NULL"
            } else if (!isNaN(parseInt(row.Default))) {
                column.default = row.Default;
            } else {
                column.default = '"' + row.Default + '"';
            }

            if (row.NUll == "YES") {
                column.isNullable = true;
            }

            if (typeof table.columns != 'undefined') {
                table.columns.push(column);
            }
        }

        let indexesResult = await this.connection.query("SHOW INDEXES FROM " + this.tableName) as RowDataPacket[][];

        const indexes: ({ [x: string]: string[] }) = {};
        for (const row of indexesResult[0]) {
            if (typeof indexes[row.Key_name] == 'undefined') {
                indexes[row.Key_name] = [];
            }

            indexes[row.Key_name].push(row.Column_name);
        }

        for (const indexName of Object.keys(indexes)) {
            let columns = indexes[indexName];

            if (columns.length > 1 || !indexColumns.includes(columns[0])) {
                if (typeof table.uniques != 'undefined') {
                    table.uniques.push({
                        name: indexName,
                        columnNames: columns
                    });
                }
            }
        }

        const camelClassName = camelCase(this.tableName);
        const pascalClassName = camelClassName.charAt(0).toUpperCase() + camelClassName.slice(1);

        const className = "Create" + pascalClassName + time;
        let imports = ["MigrationInterface", "QueryRunner", "Table", "TableColumn"];

        if (table.uniques && table.uniques.length > 0) {
            imports.push("TableUnique");
        }

        const indent = "    ";

        let content = "import {" + imports.join(", ") + "} from \"typeorm\";\n\n"
            + "export class " + className + " implements MigrationInterface {\n\n"
            + indent + "public async up(queryRunner: QueryRunner): Promise<void> {\n"
            + indent.repeat(2) + "await queryRunner.createTable(new Table({\n"
            + indent.repeat(3) + "name: \"" + table.name + "\",\n"
            + indent.repeat(3) + "columns: [\n";

        if (typeof table.columns != 'undefined') {
            for (const column of table.columns) {
                content += indent.repeat(4) + "new TableColumn({\n"
                    + indent.repeat(5) + "name: \"" + column.name + "\",\n";

                content += indent.repeat(5) + "type: \"" + column.type + "\",\n"

                if (column.isUnique) {
                    content += indent.repeat(5) + "isUnique: true,\n"
                }

                if (column.isPrimary) {
                    content += indent.repeat(5) + "isPrimary: true,\n"
                }

                if (typeof column.length != 'undefined') {
                    content += indent.repeat(5) + "length: \"" + column.length + "\",\n"
                }

                if (typeof column.enum != 'undefined') {
                    content += indent.repeat(5) + "enum: " + JSON.stringify(column.enum) + ",\n";
                }

                if (column.isGenerated) {
                    content += indent.repeat(5) + "isGenerated: true,\n";
                }

                if (column.generationStrategy) {
                    content += indent.repeat(5) + "generationStrategy: \"" + column.generationStrategy + "\",\n";
                }

                if (column.isNullable) {
                    content += indent.repeat(5) + "isNullable: true,\n"
                }

                if (typeof column.default != 'undefined') {
                    content += indent.repeat(5) + "default: " + JSON.stringify(column.default) + ",\n"
                }

                if (typeof column.onUpdate != 'undefined') {
                    content += indent.repeat(5) + "onUpdate: " + JSON.stringify(column.onUpdate) + ",\n"
                }

                content += indent.repeat(4) + "}),\n";
            }
            content += indent.repeat(3) + "],\n";
        }

        if (typeof table.uniques !== 'undefined' && table.uniques.length > 0) {
            content += indent.repeat(3) + "uniques: [\n";
            for (const unique of table.uniques) {
                content += indent.repeat(4) + "new TableUnique({\n"
                    + indent.repeat(5) + "name: \"" + unique.name + "\",\n"
                    + indent.repeat(5) + "columnNames: " + JSON.stringify(unique.columnNames) + ",\n"
                    + indent.repeat(4) + "}),\n";
            }
            content += indent.repeat(3) + "],\n"
        }

        content += indent.repeat(2) + "}), false);\n"
            + indent + "}\n\n"
            + indent + "public async down(queryRunner: QueryRunner): Promise<void> {\n";

        if (typeof table.uniques !== 'undefined' && table.uniques.length > 0) {
            for (const unique of table.uniques) {
                content += indent.repeat(2) + "await queryRunner.dropIndex(\"" + table.name + "\", \"" + unique.name + "\");\n";
            }
        }
        content += indent.repeat(2) + "await queryRunner.dropTable(\"" + table.name + "\");\n"
            + indent + "}\n"
            + "}";

        const fileName = join(this.outputFolder, time + "-" + pascalClassName + ".ts");

        writeFileSync(fileName, content);
    };
}
