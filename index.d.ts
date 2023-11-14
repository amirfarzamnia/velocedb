declare module 'velocedb' {
    interface VeloceConfig {
        encoding?: string;
        space?: number;
    }

    export default class Veloce {
        constructor(filename: string, config?: VeloceConfig);

        save(): void;
    }
}