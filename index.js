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

        try {
            this.data = JSON.parse(fs.readFileSync(this.filename, this.config.encoding));
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }
    }

    save() {
        try {
            fs.writeFileSync(this.filename, JSON.stringify(this.data, null, this.config.space), this.config.encoding);
        } catch (error) {
            throw error;
        }
    }
};