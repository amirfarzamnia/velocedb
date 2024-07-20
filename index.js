import path from 'node:path';
import fs from 'node:fs';

export default class Veloce {
    constructor(filename, config = {}) {
        this.filename = filename;

        this.config = {};

        this.config.space = 2;

        this.config.debug = false;

        this.config.autosave = true;

        this.config.noProxy = false;

        this.config.encoding = 'utf-8';

        this.config.onupdate = config.onupdate;

        this.config.handler = {
            get: (obj, prop, receiver) => {
                if (this.config.debug) console.log('Getting property', prop);

                const result = Reflect.get(obj, prop, receiver);

                this.config.onupdate?.('get', result);

                return result;
            },
            set: (obj, prop, value, receiver) => {
                if (this.config.debug) console.log('Property', prop, 'has been set to', value);

                const result = Reflect.set(obj, prop, value, receiver);

                this.config.onupdate?.('set', result);

                if (this.config.autosave) this.save();

                return result;
            },
            has: (obj, prop) => {
                if (this.config.debug) console.log('Checking existence of property', prop);

                const result = Reflect.has(obj, prop);

                this.config.onupdate?.('has', result);

                return result;
            },
            deleteProperty: (obj, prop) => {
                if (this.config.debug) console.log('Deleted', prop, 'property');

                const result = Reflect.deleteProperty(obj, prop);

                this.config.onupdate?.('deleteProperty', result);

                if (this.config.autosave) this.save();

                return result;
            },
            ownKeys: (obj) => {
                if (this.config.debug) console.log('Getting own property keys');

                const result = Reflect.ownKeys(obj);

                this.config.onupdate?.('ownKeys', result);

                return result;
            },
            getOwnPropertyDescriptor: (obj, prop) => {
                if (this.config.debug) console.log('Getting descriptor for property', prop);

                const result = Reflect.getOwnPropertyDescriptor(obj, prop);

                this.config.onupdate?.('getOwnPropertyDescriptor', result);

                return result;
            },
            defineProperty: (obj, prop, descriptor) => {
                if (this.config.debug) console.log('Defining property', prop);

                const result = Reflect.defineProperty(obj, prop, descriptor);

                this.config.onupdate?.('defineProperty', result);

                if (this.config.autosave) this.save();

                return result;
            },
            preventExtensions: (obj) => {
                if (this.config.debug) console.log('Preventing extensions on object');

                const result = Reflect.preventExtensions(obj);

                this.config.onupdate?.('preventExtensions', result);

                return result;
            },
            isExtensible: (obj) => {
                if (this.config.debug) console.log('Checking if object is extensible');

                const result = Reflect.isExtensible(obj);

                this.config.onupdate?.('isExtensible', result);

                return result;
            },
            getPrototypeOf: (obj) => {
                if (this.config.debug) console.log('Getting prototype of object');

                const result = Reflect.getPrototypeOf(obj);

                this.config.onupdate?.('getPrototypeOf', result);

                return result;
            },
            setPrototypeOf: (obj, proto) => {
                if (this.config.debug) console.log('Setting prototype of object');

                const result = Reflect.setPrototypeOf(obj, proto);

                this.config.onupdate?.('setPrototypeOf', result);

                if (this.config.autosave) this.save();

                return result;
            },
            apply: (target, thisArg, argumentsList) => {
                if (this.config.debug) console.log('Applying function');

                const result = Reflect.apply(target, thisArg, argumentsList);

                this.config.onupdate?.('apply', result);

                if (this.config.autosave) this.save();

                return result;
            },
            construct: (target, argumentsList, newTarget) => {
                if (this.config.debug) console.log('Constructing instance');

                const result = Reflect.construct(target, argumentsList, newTarget);

                this.config.onupdate?.('construct', result);

                if (this.config.autosave) this.save();

                return result;
            }
        };

        this.config.target = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, this.config.encoding)) : {};

        Object.assign(this.config, config);

        this.data = this.config.noProxy ? this.config.target : new Proxy(this.config.target, this.config.handler);

        if (this.debug) console.log('The database has been constructed');
    }

    save() {
        if (this.saving) return;

        const dir = path.dirname(this.filename);

        if (!this.initialCheckIsDone) {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            if (this.debug) console.log('The initial check is done');

            this.initialCheckIsDone = true;
        }

        this.saving = true;

        fs.writeFileSync(this.filename, JSON.stringify(this.data, null, this.config.space), { encoding: this.config.encoding });

        if (this.debug) console.log('The data has been saved');

        delete this.saving;
    }

    delete() {
        fs.unlinkSync(this.filename);

        if (this.debug) console.log('The database has been deleted');
    }
}
