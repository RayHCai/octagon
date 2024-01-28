import pg from 'pg';

import clientConfig from '../helpers/clientConfig.js';
import { type FieldConfig, modelFields } from '../model.js';

export type Field = {
    fieldName: string;
    fieldType?: ArrayElement<typeof modelFields>;
    args?: FieldConfig;
};

export async function createModel(name: string, fields: Field[]) {
    if (fields.filter((field) => field.fieldName === 'id').length === 0)
        fields.push({
            fieldName: 'id',
        });

    const client = new pg.Client(clientConfig);

    await client.connect();

    const query = {
        name: 'create-model',
        text: `CREATE TABLE ${pg.escapeIdentifier(
            name.toLowerCase()
        )} (${String(
            fields.map((field) => {
                let args =
                    field.args &&
                    (field.args as any[])
                        .map((node) => node.properties)
                        .flat()
                        .map((node) => {
                            return {
                                name: node.key.name,
                                value: node.value.value,
                            };
                        });

                if (!args) args = [];

                let optional =
                    args.filter((a) => a.name === 'optional').length !== 0;

                let defaultValue: any = args.filter(
                    (a) => a.name === 'defaultValue'
                );

                if (defaultValue.length !== 0) defaultValue = defaultValue[0];
                else defaultValue = null;

                let statement = `${field.fieldName}`;

                if (field.fieldName === 'id')
                    statement += ` SERIAL PRIMARY KEY`;

                if (field.fieldType === 'StringField') {
                    let maxLength: any = args.filter(
                        (a) => a.name === 'maxLength'
                    );

                    if (maxLength.length === 0) maxLength = 50;
                    else maxLength = maxLength[0].value;

                    statement += ` VARCHAR(${maxLength})`;
                }

                if (field.fieldType === 'IntegerField') statement += ` INTEGER`;

                if (defaultValue)
                    statement += ` DEFAULT ${
                        typeof defaultValue.value === 'string'
                            ? "'" + defaultValue.value + "'"
                            : defaultValue.value
                    }`;

                if (!optional) statement += ` NOT NULL`;

                return statement;
            })
        )})`,
    };

    await client.query(query);

    await client.end();
}
