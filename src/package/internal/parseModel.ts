import fs from 'fs';
import path from 'path';

import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import pg from 'pg';

import clientConfig from '../helpers/clientConfig.js';

import { createModel } from './modelCreation.js';
import { modelFields, FieldTypes } from '../model.js';

function argsToConfig<T>(args: acorn.Node[]) {
    const config: FieldConfig<T> = {};

    args.forEach(
        (arg) =>
            (config[(arg as any).key.name as string] = (arg as any).value.value)
    );

    return config;
}

async function modelExists(modelName: string) {
    const client = new pg.Client(clientConfig);

    await client.connect();

    const query = {
        name: 'model-exists',
        text: `SELECT * FROM pg_attribute WHERE table_name = '${pg.escapeIdentifier(modelName.toLowerCase())}'`,
    };

    const result = await client.query(query);

    console.log(result);

    await client.end();
    // return result.rowCount > 0;
}

export default function parseModel(base: string, loc: string) {
    const fileContent = String(fs.readFileSync(path.join(base, loc)));

    const parsed = acorn.parse(fileContent, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        locations: true,
        ranges: true,
    });

    let modelName;
    const fields: Field<any>[] = [];

    walk.full(parsed, (node) => {
        if (
            node.type === 'ClassDeclaration' &&
            (node as any).superClass &&
            (node as any).superClass.name === 'Model'
        )
            modelName = (node as any).id.name;

        if (node.type === 'ClassBody') {
            if ((node as any).body.length === 0) return;

            const model: any = node;

            model.body.map((node: any) => {
                if (node.type !== 'PropertyDefinition') return;

                const fieldType = node.value.callee.name;
                if (!modelFields.includes(fieldType)) return;

                const tempType = FieldTypes[fieldType];
                type FieldType = typeof tempType;

                const fieldName: string = node.key.name;

                const args =
                    node.value.arguments.length === 0
                        ? []
                        : node.value.arguments[0].properties;

                const config =
                    args.length === 0 ? null : argsToConfig<FieldType>(args);

                const field: Field<FieldType> = {
                    name: fieldName,
                    type: fieldType,
                    config: config,
                };

                fields.push(field);
            });
        }
    });

    if (!modelName) return;
    modelExists(modelName);

    createModel(modelName, fields);
}

parseModel('./src', '../lib/test/index.js');
