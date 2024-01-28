import fs from 'fs';
import path from 'path';

import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

import { createModel, Field } from './modelCreation.js';
import { modelFields } from '../model.js';

const fileContent = String(
    fs.readFileSync(path.join('./src', '../lib/test/index.js'))
);

const parsed = acorn.parse(fileContent, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    locations: true,
    ranges: true,
});

let modelName = '';
const fields: Field[] = [];

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

            const fieldName = node.key.name;
            const args = node.value.arguments;

            fields.push({
                fieldType,
                fieldName,
                args,
            });
        });
    }
});

createModel(modelName, fields);
