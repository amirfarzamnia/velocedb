declare module 'velocedb' {
    export default class Veloce {
        constructor(filename: string, config?: {
            encoding?: string;
            space?: number;
        });

        save(): void;

        delete(): void;
    }
}