/** Configuration options for the Veloce database. */
interface VeloceConfig {
    /** The number of spaces for indentation when saving the file as a local file. Default is 2. */
    space?: number;
    /** Should the database run in debug mode? In debug mode, it will create logs of all processes and changes. Default is false. */
    debug?: boolean;
    /** Should data be automatically saved to the database? This feature only works in proxy mode. Default is true. */
    autosave?: boolean;
    /** Should the database use no proxy mode? The no-proxy mode disables many features and creates a straightforward process for the databases. This mode is more optimized, but you need to save the data manually. Default is false. */
    noProxy?: boolean;
    /** The `onupdate` function is only used in proxy mode. Whenever a new update is received for the data, this function will be triggered with the update method and result. By default, this function is undefined. */
    onupdate?: (method: string, result: any) => void;
    /** The options that will be used for the `node:fs` module when saving the data to the database. */
    fileOptions?: object | { encoding: 'utf-8' };
    /** This object is used in proxy mode. In JavaScript, proxies require a handler to work. This object is the handler used for data proxies. Modifying this object is not suggested. */
    handler?: object;
    /** This is the data that will be put into the database during the database construction process. If the database exists, the data will be the database's data; otherwise, the data will be an empty object. */
    target?: any;
}

/**
 * The `velocedb` package allows you to create local JSON databases.
 * To get started, import the necessary modules:
 *
 * ```js
 * import Veloce from 'velocedb';
 * ```
 *
 * For a detailed understanding of its functionality, refer to the package's GitHub page:
 *
 * @see [GitHub](https://github.com/amirfarzamnia/velocedb)
 */

declare module 'velocedb' {
    /**
     * Veloce database constructor class. Use this method to create new database instances.
     *
     * @param filename - The name of the file where the database will be stored.
     * @param config - Optional configuration parameters for the database.
     */

    export default class Veloce {
        constructor(filename: string, config?: VeloceConfig);

        /** The database data. In proxy mode, changes to the data will result in some additional processes. In no-proxy mode, the data is just normal JavaScript data. */
        data: any;

        /** Saves the current state of the database to the specified file. */
        save(): void;

        /** Deletes the database file. */
        delete(): void;
    }
}
