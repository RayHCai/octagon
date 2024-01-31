import pg from 'pg';

import Model from '../model.js';

export function updateRow(
    this: Model,
    name: string,
    fields: string[],
    where: string
) {
    return `
    UPDATE ${pg.escapeIdentifier(name.toLowerCase())}
    SET ${fields
        .filter((field) => field !== 'id')
        .map((field) => {
            const propertyContent: any = (this as any)[field];

            if (typeof propertyContent === 'string')
                return `${field} = '${propertyContent}'`;

            return `${field} = ${propertyContent}`;
        })}
    WHERE ${where}
    `;
}
