declare module 'velocedb' {
    interface veloceConfig {
        encoding?: string;
        space?: number;
    }

    export default class veloce {
        constructor(filename: string, config?: veloceConfig);
        save(): void;
    }
}
