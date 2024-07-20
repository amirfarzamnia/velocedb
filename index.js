import path from 'node:path';
import fs from 'node:fs';

export default class Veloce {
    constructor(filename, config = {}) {
        this.filename = filename;

        this.config = {};

        this.config.encoding = 'utf-8';

        this.config.space = 2;

        this.config.debug = false;

        this.config.autosave = true;

        this.config.handler = {
            get: (obj, prop, receiver) => {
                if (this.config.debug) console.log('Getting property', prop);

                const result = Reflect.get(obj, prop, receiver);

                return result;
            },
            set: (obj, prop, value, receiver) => {
                if (this.config.debug) console.log('Property', prop, 'has been set to', value);

                const result = Reflect.set(obj, prop, value, receiver);

                if (this.config.autosave) this.save();

                return result;
            },
            has: (obj, prop) => {
                if (this.config.debug) console.log('Checking existence of property', prop);

                const result = Reflect.has(obj, prop);

                return result;
            },
            deleteProperty: (obj, prop) => {
                if (this.config.debug) console.log('Deleted', prop, 'property');

                const result = Reflect.deleteProperty(obj, prop);

                if (this.config.autosave) this.save();

                return result;
            },
            ownKeys: (obj) => {
                if (this.config.debug) console.log('Getting own property keys');

                const result = Reflect.ownKeys(obj);

                return result;
            },
            getOwnPropertyDescriptor: (obj, prop) => {
                if (this.config.debug) console.log('Getting descriptor for property', prop);

                const result = Reflect.getOwnPropertyDescriptor(obj, prop);

                return result;
            },
            defineProperty: (obj, prop, descriptor) => {
                if (this.config.debug) console.log('Defining property', prop);

                const result = Reflect.defineProperty(obj, prop, descriptor);

                if (this.config.autosave) this.save();

                return result;
            },
            preventExtensions: (obj) => {
                if (this.config.debug) console.log('Preventing extensions on object');

                const result = Reflect.preventExtensions(obj);

                return result;
            },
            isExtensible: (obj) => {
                if (this.config.debug) console.log('Checking if object is extensible');

                const result = Reflect.isExtensible(obj);

                return result;
            },
            getPrototypeOf: (obj) => {
                if (this.config.debug) console.log('Getting prototype of object');

                const result = Reflect.getPrototypeOf(obj);

                return result;
            },
            setPrototypeOf: (obj, proto) => {
                if (this.config.debug) console.log('Setting prototype of object');

                const result = Reflect.setPrototypeOf(obj, proto);

                if (this.config.autosave) this.save();

                return result;
            },
            apply: (target, thisArg, argumentsList) => {
                if (this.config.debug) console.log('Applying function');

                const result = Reflect.apply(target, thisArg, argumentsList);

                if (this.config.autosave) this.save();

                return result;
            },
            construct: (target, argumentsList, newTarget) => {
                if (this.config.debug) console.log('Constructing instance');

                const result = Reflect.construct(target, argumentsList, newTarget);

                if (this.config.autosave) this.save();

                return result;
            }
        };

        this.config.target = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, this.config.encoding)) : {};

        Object.assign(this.config, config);

        this.data = new Proxy(this.config.target, this.config.handler);
    }

    save() {
        if (this.saving) return;

        const dir = path.dirname(this.filename);

        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        this.saving = true;

        fs.writeFileSync(this.filename, JSON.stringify(this.data, null, this.config.space), { encoding: this.config.encoding });

        delete this.saving;
    }

    delete() {
        fs.unlinkSync(this.filename);
    }
}
