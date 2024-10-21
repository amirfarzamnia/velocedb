import path from 'node:path';
import fs from 'node:fs';

export default class Veloce {
    static createNestedProxies(target, handler) {
        return new Proxy(target, handler);
    }

    constructor(filename, config = {}) {
        this.filename = filename;

        this.config = {};

        this.config.space = 2;

        this.config.debug = false;

        this.config.autoSave = true;

        this.config.noProxy = false;

        this.config.autoSaveTimeoutMs = 750;

        this.config.savingRetryTimeout = 100;

        this.config.onUpdate = config.onUpdate;

        this.config.maximumAutoSaveTimeouts = 10;

        this.config.fileOptions = { encoding: 'utf-8' };

        this.config.handler = {
            get: (obj, prop, receiver) => {
                if (this.config.debug) console.log('Getting property:', prop);

                const result = Reflect.get(obj, prop, receiver);

                this.config.onUpdate?.('get', result);

                if (typeof result === 'object' && result !== null) return Veloce.createNestedProxies(result, this.config.handler);

                return result;
            },
            set: (obj, prop, value, receiver) => {
                if (this.config.debug) console.log('Property', prop, 'has been set:', value);

                const result = Reflect.set(obj, prop, value, receiver);

                this.config.onUpdate?.('set', result);

                if (this.config.autoSave) this.save();

                if (typeof result === 'object' && result !== null) return Veloce.createNestedProxies(result, this.config.handler);

                return result;
            },
            has: (obj, prop) => {
                if (this.config.debug) console.log('Checking existence of property:', prop);

                const result = Reflect.has(obj, prop);

                this.config.onUpdate?.('has', result);

                if (typeof result === 'object' && result !== null) return Veloce.createNestedProxies(result, this.config.handler);

                return result;
            },
            deleteProperty: (obj, prop) => {
                if (this.config.debug) console.log('Deleted', prop, 'property.');

                const result = Reflect.deleteProperty(obj, prop);

                this.config.onUpdate?.('deleteProperty', result);

                if (this.config.autoSave) this.save();

                if (typeof result === 'object' && result !== null) return Veloce.createNestedProxies(result, this.config.handler);

                return result;
            },
            ownKeys: (obj) => {
                if (this.config.debug) console.log('Getting own property keys.');

                const result = Reflect.ownKeys(obj);

                this.config.onUpdate?.('ownKeys', result);

                if (typeof result === 'object' && result !== null) return Veloce.createNestedProxies(result, this.config.handler);

                return result;
            },
            getOwnPropertyDescriptor: (obj, prop) => {
                if (this.config.debug) console.log('Getting descriptor for property:', prop);

                const result = Reflect.getOwnPropertyDescriptor(obj, prop);

                this.config.onUpdate?.('getOwnPropertyDescriptor', result);

                if (typeof result === 'object' && result !== null) return Veloce.createNestedProxies(result, this.config.handler);

                return result;
            },
            defineProperty: (obj, prop, descriptor) => {
                if (this.config.debug) console.log('Defining property:', prop);

                const result = Reflect.defineProperty(obj, prop, descriptor);

                this.config.onUpdate?.('defineProperty', result);

                if (this.config.autoSave) this.save();

                if (typeof result === 'object' && result !== null) return Veloce.createNestedProxies(result, this.config.handler);

                return result;
            },
            preventExtensions: (obj) => {
                if (this.config.debug) console.log('Preventing extensions on object.');

                const result = Reflect.preventExtensions(obj);

                this.config.onUpdate?.('preventExtensions', result);

                if (typeof result === 'object' && result !== null) return Veloce.createNestedProxies(result, this.config.handler);

                return result;
            },
            isExtensible: (obj) => {
                if (this.config.debug) console.log('Checking if object is extensible.');

                const result = Reflect.isExtensible(obj);

                this.config.onUpdate?.('isExtensible', result);

                if (typeof result === 'object' && result !== null) return Veloce.createNestedProxies(result, this.config.handler);

                return result;
            },
            getPrototypeOf: (obj) => {
                if (this.config.debug) console.log('Getting prototype of object.');

                const result = Reflect.getPrototypeOf(obj);

                this.config.onUpdate?.('getPrototypeOf', result);

                if (typeof result === 'object' && result !== null) return Veloce.createNestedProxies(result, this.config.handler);

                return result;
            },
            setPrototypeOf: (obj, proto) => {
                if (this.config.debug) console.log('Setting prototype of object.');

                const result = Reflect.setPrototypeOf(obj, proto);

                this.config.onUpdate?.('setPrototypeOf', result);

                if (this.config.autoSave) this.save();

                if (typeof result === 'object' && result !== null) return Veloce.createNestedProxies(result, this.config.handler);

                return result;
            },
            apply: (target, thisArg, argumentsList) => {
                if (this.config.debug) console.log('Applying function.');

                const result = Reflect.apply(target, thisArg, argumentsList);

                this.config.onUpdate?.('apply', result);

                if (this.config.autoSave) this.save();

                if (typeof result === 'object' && result !== null) return Veloce.createNestedProxies(result, this.config.handler);

                return result;
            },
            construct: (target, argumentsList, newTarget) => {
                if (this.config.debug) console.log('Constructing instance.');

                const result = Reflect.construct(target, argumentsList, newTarget);

                this.config.onUpdate?.('construct', result);

                if (this.config.autoSave) this.save();

                if (typeof result === 'object' && result !== null) return Veloce.createNestedProxies(result, this.config.handler);

                return result;
            }
        };

        this.config.target = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename)) : {};

        Object.assign(this.config, config);

        this.data = this.config.noProxy ? this.config.target : Veloce.createNestedProxies(this.config.target, this.config.handler);

        if (this.config.debug) console.log('The database has been constructed.');
    }

    save(force) {
        const save = () => {
            const dir = path.dirname(this.filename);

            if (!this.initialCheckIsDone) {
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

                if (this.config.debug) console.log('The initial check is done.');

                this.initialCheckIsDone = true;
            }

            this.saving = true;

            fs.writeFileSync(this.filename, JSON.stringify(this.data, null, this.config.space), this.config.fileOptions);

            if (this.config.debug) console.log('The data has been saved.');

            delete this.saving;

            delete this.saveTimeout;

            delete this.saveTimeoutsCount;
        };

        if (force) return save();

        if (this.saving) return setTimeout(save, this.config.savingRetryTimeout);

        if (!this.config.autoSave) return save();

        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);

            this.saveTimeoutsCount ||= 0;

            this.saveTimeoutsCount++;

            if (this.saveTimeoutsCount >= this.config.maximumAutoSaveTimeouts) return save();
        }

        this.saveTimeout = setTimeout(save, this.config.autoSaveTimeoutMs);
    }

    delete() {
        fs.unlinkSync(this.filename);

        if (this.config.debug) console.log('The database has been deleted.');
    }
}
