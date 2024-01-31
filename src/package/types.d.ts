declare type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;
declare type Dictionary = { [index: string]: any }

declare type FieldConfig<T> = Dictionary & {
    defaultValue?: T;
    maxLength?: number;
    optional?: boolean;
    autoAdd?: boolean;
} | null;

declare type Field<T> = {
    name: string;
    type: string;
    config: FieldConfig<T>;
};
