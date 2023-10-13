const fs = require('fs');

module.exports = class Veloce {
    constructor(filename, config = {}) {
        this.filename = filename;
        this.config = Object.assign({ encoding: 'utf-8', space: 2 }, config);
        this.data = JSON.parse(fs.readFileSync(filename, this.config.encoding));
    }

    save() {
        fs.writeFileSync(this.filename, JSON.stringify(this.data, null, this.config.space), { encoding: this.config.encoding });
    }
};