import pg from 'pg';

import clientConfig from './helpers/clientConfig.js';
import { updateRow } from './helpers/crud.js';

export type FieldConfig = {
    defaultValue?: any;
    maxLength?: number;
    optional?: boolean;
    autoAdd?: boolean;
} | null;

function modelPropertiesToString(
    this: any,
    modelProperties: string[],
    removeId: boolean = false
) {
    if (removeId)
        modelProperties = modelProperties.filter(
            (property: string) => property !== 'id'
        );

    return `(${modelProperties.map((property: string) => {
        const propertyContent: any = (this as any)[property];
        if (typeof propertyContent === 'string') return `'${propertyContent}'`;

        return String(propertyContent);
    })})`;
}

export default class Model {
    id: number = -1;

    init(obj: any) {
        return this._setFieldsFromObj(obj);
    }

    _setFieldsFromObj(obj: any) {
        Object.assign(this, obj);

        return this;
    }

    private async _getFields() {
        const client = new pg.Client(clientConfig);

        await client.connect();

        const modelName = this.constructor.name;
        const modelProperties = Object.getOwnPropertyNames(this);

        const fields = (
            await client.query(
                `SELECT * FROM ${pg.escapeIdentifier(modelName.toLowerCase())}`
            )
        ).fields;

        await client.end();

        return modelProperties.filter((property) =>
            fields.find(
                (field: pg.FieldDef) =>
                    field.name.toLowerCase() === property.toLowerCase()
            )
        );
    }

    async save() {
        const modelName = this.constructor.name;

        const client = new pg.Client(clientConfig);
        await client.connect();

        const fields = await this._getFields();
        const allRows = (
            await client.query(
                `SELECT * FROM ${pg.escapeIdentifier(modelName.toLowerCase())}`
            )
        ).rows.sort((r1, r2) => r1.id - r2.id);

        const curRows = (
            await client.query(
                `SELECT * FROM ${pg.escapeIdentifier(
                    modelName.toLowerCase()
                )} WHERE id = ${this.id}`
            )
        ).rows;

        // If there exists a row with this ID, update it
        if (curRows.length) {
            await client.query(
                updateRow.bind(this)(modelName, fields, `id = ${this.id}`)
            );
        } else {
            // If this is the first item being added into the table
            // TODO: Assuming this is a number ID
            if (allRows.length === 0) this.id = 0;
            else this.id = allRows[allRows.length! - 1].id + 1;

            await client.query(
                `INSERT INTO ${pg.escapeIdentifier(
                    modelName.toLowerCase()
                )} (${fields}) VALUES ${modelPropertiesToString.bind(this)(
                    fields
                )}`
            );
        }

        await client.end();
    }

    static async filter(filterObject: any = null) {
        const modelName = this.name;

        const client = new pg.Client(clientConfig);
        await client.connect();

        let models: any;

        if(typeof filterObject === 'function') {
            const callback = filterObject;

            const allRows = (await client.query(
                `SELECT * FROM ${pg.escapeIdentifier(modelName.toLowerCase())}`
            )).rows;
            
            const filtered = allRows.filter(callback);
            models = filtered.map((row: any) =>
                new this()._setFieldsFromObj(row)
            );
        }
        else {
            const fields = (
                await client.query(
                    `SELECT * FROM ${pg.escapeIdentifier(modelName.toLowerCase())}`
                )
            ).fields.map((f) => f.name);

            for (const k in filterObject) {
                if (!fields.includes(k))
                    throw Error(
                        'Error. Only fields in the model can be filtered on.'
                    );
            }

            const query = `SELECT * FROM ${pg.escapeIdentifier(
                modelName.toLowerCase()
            )} WHERE ${Object.keys(filterObject).map((property) => {
                const filter = filterObject[property];
                if (typeof filter === 'string') return `${property} = '${filter}'`;

                return `${property} = ${filter}`;
            })}`;

            const res = await client.query(query);

            models = res.rows.map((row: any) =>
                new this()._setFieldsFromObj(row)
            );
        }

        await client.end();
        
        return models;
    }

    async delete() {
        const modelName = this.constructor.name;

        const client = new pg.Client(clientConfig);
        await client.connect();

        await client.query(
            `DELETE FROM ${pg.escapeIdentifier(
                modelName.toLowerCase()
            )} WHERE id = ${this.id}`
        );

        await client.end();
    }

    async update(obj: any) {
        const modelName = this.constructor.name;
        const fields = await this._getFields();
        for(let k in obj) {
            if(!fields.includes(k)) throw Error('Error. Only fields in the model can be updated.');
        }

        const client = new pg.Client(clientConfig);
        await client.connect();

        this._setFieldsFromObj(obj);

        await client.query(
            updateRow.bind(this)(modelName, fields, `id = ${this.id}`)
        );

        await client.end();
    }
}

export function IntegerField(config: FieldConfig = null) {
    if (config?.optional) return null;

    return config?.defaultValue ? config.defaultValue : -1;
}

export function StringField(config: FieldConfig = null) {
    return config?.defaultValue ? config.defaultValue : '';
}

export const modelFields = ['StringField', 'IntegerField'];
