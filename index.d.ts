declare module 'velocedb' {
    export default class Veloce {
        /**
         * Constructor for the Veloce class.
         *
         * @param {string} filename - The name of the file associated with the database.
         * @param {object} config - Optional configuration object with encoding and space properties.
         */

        constructor(filename: string, config?: {
            encoding?: string;
            space?: number;
        });

        /**
         * Save method for the Veloce databases, used to save changes made to the database.
         */

        save(): void;
    }
}