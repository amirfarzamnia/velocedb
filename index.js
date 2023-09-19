const fs = require('fs');

module.exports = class veloce {
    constructor(filename, config = {}) {
        this.data = {};
        this.filename = filename;
        this.config = {
            encoding: 'utf-8',
            space: 2,
            ...config
        };

        this.data = JSON.parse(fs.readFileSync(this.filename, this.config.encoding));
    }

    save() {
        fs.writeFileSync(this.filename, JSON.stringify(this.data, null, this.config.space), this.config.encoding);
    }
};
