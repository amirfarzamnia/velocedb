/** Configuration options for the Veloce database. */
interface VeloceConfig {
    /** The encoding format for the database. Default is utf-8. */
    encoding?: string;
    /** The number of spaces for indentation when saving the file as a local file. Default is 2. */
    space?: number;
}

/**
 * The `Velocedb` package allows you to create local JSON databases.
 * To get started, import the necessary modules:
 *
 * ```js
 * const Veloce = require('velocedb');
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

        /** Saves the current state of the database to the specified file. */
        save(): void;

        /** Deletes the database file. */
        delete(): void;
    }
}