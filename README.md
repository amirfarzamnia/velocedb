# VeloceDB

**A high-performance, secure, and robust local database**

[![npm version](https://badge.fury.io/js/velocedb.svg)](https://www.npmjs.com/package/velocedb)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/absyro/VeloceDB.svg)](https://github.com/absyro/VeloceDB/issues)
[![GitHub stars](https://img.shields.io/github/stars/absyro/VeloceDB.svg)](https://github.com/absyro/VeloceDB/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/absyro/VeloceDB.svg)](https://github.com/absyro/VeloceDB/forks)

VeloceDB is a lightweight, fast, and user-friendly local database designed for Node.js and TypeScript applications. It simplifies data management and persistence by storing data in a human-readable JSON format on your local file system.

## Features

- **Open Source**: VeloceDB is open source, which means you have the freedom to modify it according to your preferences.
- **Easy to Use**: VeloceDB offers a straightforward API for managing data.
- **Customization**: Easily configure database settings, such as encoding and JSON formatting, to fit your requirements.
- **Security**: VeloceDB prioritizes data security to safeguard your information during access and storage.
- **Lightweight**: VeloceDB is a lightweight and lightning-fast database. It has been optimized to deliver maximum speed and efficiency.

## Installation

You can install VeloceDB via NPM:

```bash
npm install velocedb
```

## Usage

```javascript
const Veloce = require('velocedb');
const database = new Veloce('database.json');

// Set your data
database.data = {
    string: 'String',
    boolean: true
};

// Modify your data
database.data.boolean = false;

// Save your data in the database.json file
database.save();

// Retrieve and check your data
console.log(database.data);
```

## Configuration

You can customize the database by providing an options object when creating it. Here are the available configuration options:

- **encoding**: The encoding option is used for reading or writing the database file (default: 'utf-8')
- **space**: The number of spaces for JSON formatting (default: 2)

### Example

```javascript
const Veloce = require('velocedb');
const database = new Veloce('database.json', {
    space: 4
});
```
