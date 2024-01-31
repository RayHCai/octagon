import pg from 'pg';

import clientConfig from '../helpers/clientConfig.js';

export async function createModel(name: string, fields: Field<any>[]) {
    if (fields.filter((field) => field.name === 'id').length === 0)
        fields.push({
            name: 'id',
            type: 'IntegerField',
            config: null,
        });

    const client = new pg.Client(clientConfig);

    await client.connect();

    const query = {
        name: 'create-model',
        text: `CREATE TABLE ${pg.escapeIdentifier(
            name.toLowerCase()
        )} (${String(
            fields.map((field) => {
                let statement = `${field.name}`;

                if (field.name === 'id') statement += ` SERIAL PRIMARY KEY`;
                else if (field.type === 'StringField') {
                    const maxLength: number =
                        !field.config || !field.config!.maxLength
                            ? 50
                            : field.config!.maxLength!;

                    statement += ` VARCHAR(${maxLength})`;
                }
 else if (field.type === 'IntegerField')
                    statement += ` INTEGER`;

                if (field.config) {
                    const defaultValue = field.config.defaultValue;

                    if (defaultValue)
                        statement += ` DEFAULT ${
                            typeof defaultValue === 'string'
                                ? '\'' + defaultValue + '\''
                                : defaultValue
                        }`;

                    const optional = field.config.optional;
                    if (!optional) statement += ' NOT NULL';
                }

                return statement;
            })
        )})`,
    };

    await client.query(query);

    await client.end();
}
