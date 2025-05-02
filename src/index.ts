import path from 'node:path';
import fs from 'node:fs';

/** Configuration options for the Veloce database. */
export interface VeloceConfig {
    /** The number of spaces for indentation when saving the file as a local file. Default is 2. */
    space?: number | null;

    /** Should the database run in debug mode? In debug mode, it will create logs of all processes and changes. Default is false. */
    debug?: boolean;

    /** Should data be automatically saved to the database? This feature only works in proxy mode. Default is true. */
    autoSave?: boolean;

    /** Should the database use no proxy mode? The no-proxy mode disables many features and creates a straightforward process for the databases. This mode is more optimized, but you need to save the data manually. Default is false. */
    noProxy?: boolean;

    /** When automatically saving the database data, the database will wait for the given duration in milliseconds before saving the data. If the database is modified again, it will wait again until there are no more changes, then save the data. The default value is set to 750 milliseconds (750). */
    autoSaveTimeoutMs?: number;

    /** The timeout in milliseconds before retrying to save the data if any issues occur. Default is 100 milliseconds (100). */
    savingRetryTimeout?: number;

    /** The `onUpdate` function is only used in proxy mode. Whenever a new update is received for the data, this function will be triggered with the update method and result. By default, this function is undefined. */
    onUpdate?: (method: string, result: any) => void;

    /** The database will create timeouts before saving the data (only in auto-save mode). This number indicates maximum timeouts before saving database data. Default is 10. */
    maximumAutoSaveTimeouts?: number;

    /** The options that will be used for the `node:fs` module when saving the data to the database. */
    fileOptions?: object | { encoding: string };

    /** This object is used in proxy mode. In JavaScript, proxies require a handler to work. This object is the handler used for data proxies. Modifying this object is not suggested. */
    handler?: ProxyHandler<any>;

    /** This is the data that will be put into the database during the database construction process. If the database exists, the data will be the database's data; otherwise, the data will be an empty object. */
    target?: any;
}

export default class Veloce {
    private filename: string;
    private config: Required<VeloceConfig>;
    data: any;
    private initialCheckIsDone?: boolean;
    private saving?: boolean;
    private saveTimeout?: NodeJS.Timeout;
    private saveTimeoutsCount?: number;

    static createNestedProxies(target: any, handler: ProxyHandler<any>): any {
        return new Proxy(target, handler);
    }

    constructor(filename: string, config: Partial<VeloceConfig> = {}) {
        this.filename = filename;

        // Initialize with default configuration
        this.config = {
            space: 2,
            debug: false,
            autoSave: true,
            noProxy: false,
            autoSaveTimeoutMs: 750,
            savingRetryTimeout: 100,
            onUpdate: undefined,
            maximumAutoSaveTimeouts: 10,
            fileOptions: { encoding: 'utf-8' },
            handler: {
                get: (obj: any, prop: string | symbol, receiver: any): any => {
                    if (this.config.debug) console.log('Getting property:', prop);

                    const result = Reflect.get(obj, prop, receiver);

                    this.config.onUpdate?.('get', result);

                    if (typeof result === 'object' && result !== null) return Veloce.createNestedProxies(result, this.config.handler);

                    return result;
                },
                set: (obj: any, prop: string | symbol, value: any, receiver: any): boolean => {
                    if (this.config.debug) console.log('Property', prop, 'has been set:', value);

                    const result = Reflect.set(obj, prop, value, receiver);

                    this.config.onUpdate?.('set', result);

                    if (this.config.autoSave) this.save();

                    return result;
                },
                has: (obj: any, prop: string | symbol): boolean => {
                    if (this.config.debug) console.log('Checking existence of property:', prop);

                    const result = Reflect.has(obj, prop);

                    this.config.onUpdate?.('has', result);

                    return result;
                },
                deleteProperty: (obj: any, prop: string | symbol): boolean => {
                    if (this.config.debug) console.log('Deleted', prop, 'property.');

                    const result = Reflect.deleteProperty(obj, prop);

                    this.config.onUpdate?.('deleteProperty', result);

                    if (this.config.autoSave) this.save();

                    return result;
                },
                ownKeys: (obj: any): ArrayLike<string | symbol> => {
                    if (this.config.debug) console.log('Getting own property keys.');

                    const result = Reflect.ownKeys(obj);

                    this.config.onUpdate?.('ownKeys', result);

                    return result;
                },
                getOwnPropertyDescriptor: (obj: any, prop: string | symbol): PropertyDescriptor | undefined => {
                    if (this.config.debug) console.log('Getting descriptor for property:', prop);

                    const result = Reflect.getOwnPropertyDescriptor(obj, prop);

                    this.config.onUpdate?.('getOwnPropertyDescriptor', result);

                    return result;
                },
                defineProperty: (obj: any, prop: string | symbol, descriptor: PropertyDescriptor): boolean => {
                    if (this.config.debug) console.log('Defining property:', prop);

                    const result = Reflect.defineProperty(obj, prop, descriptor);

                    this.config.onUpdate?.('defineProperty', result);

                    if (this.config.autoSave) this.save();

                    return result;
                },
                preventExtensions: (obj: any): boolean => {
                    if (this.config.debug) console.log('Preventing extensions on object.');

                    const result = Reflect.preventExtensions(obj);

                    this.config.onUpdate?.('preventExtensions', result);

                    return result;
                },
                isExtensible: (obj: any): boolean => {
                    if (this.config.debug) console.log('Checking if object is extensible.');

                    const result = Reflect.isExtensible(obj);

                    this.config.onUpdate?.('isExtensible', result);

                    return result;
                },
                getPrototypeOf: (obj: any): object | null => {
                    if (this.config.debug) console.log('Getting prototype of object.');

                    const result = Reflect.getPrototypeOf(obj);

                    this.config.onUpdate?.('getPrototypeOf', result);

                    return result;
                },
                setPrototypeOf: (obj: any, proto: object | null): boolean => {
                    if (this.config.debug) console.log('Setting prototype of object.');

                    const result = Reflect.setPrototypeOf(obj, proto);

                    this.config.onUpdate?.('setPrototypeOf', result);

                    if (this.config.autoSave) this.save();

                    return result;
                },
                apply: (target: any, thisArg: any, argumentsList: any[]): any => {
                    if (this.config.debug) console.log('Applying function.');

                    const result = Reflect.apply(target, thisArg, argumentsList);

                    this.config.onUpdate?.('apply', result);

                    if (this.config.autoSave) this.save();

                    if (typeof result === 'object' && result !== null) return Veloce.createNestedProxies(result, this.config.handler);

                    return result;
                },
                construct: (target: any, argumentsList: any[], newTarget: Function): object => {
                    if (this.config.debug) console.log('Constructing instance.');

                    const result = Reflect.construct(target, argumentsList, newTarget);

                    this.config.onUpdate?.('construct', result);

                    if (this.config.autoSave) this.save();

                    if (typeof result === 'object' && result !== null) return Veloce.createNestedProxies(result, this.config.handler);

                    return result;
                }
            },
            target: {}
        };

        // Override default configuration with provided config
        this.config.target = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, { encoding: 'utf-8' })) : {};
        Object.assign(this.config, config);

        this.data = this.config.noProxy ? this.config.target : Veloce.createNestedProxies(this.config.target, this.config.handler);

        if (this.config.debug) console.log('The database has been constructed.');
    }

    save(force?: boolean): void {
        const save = (): void => {
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

            this.saveTimeoutsCount = this.saveTimeoutsCount || 0;
            this.saveTimeoutsCount++;

            if (this.saveTimeoutsCount >= this.config.maximumAutoSaveTimeouts) return save();
        }

        this.saveTimeout = setTimeout(save, this.config.autoSaveTimeoutMs);
    }

    delete(): void {
        fs.unlinkSync(this.filename);

        if (this.config.debug) console.log('The database has been deleted.');
    }
}
