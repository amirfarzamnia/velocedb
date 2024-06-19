import path from 'node:path';
import fs from 'node:fs';

export default class Veloce {
    constructor(filename, config = {}) {
        this.filename = filename;
        this.config = Object.assign({ encoding: 'utf-8', space: 2 }, config);
        this.data = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, this.config.encoding)) : {};
    }

    save() {
        const dir = path.dirname(this.filename);

        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(this.filename, JSON.stringify(this.data, null, this.config.space), { encoding: this.config.encoding });
    }

    delete() {
        fs.unlinkSync(this.filename);
    }
}
