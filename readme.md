# Velocedb

**A high-performance, secure, and robust local database**

[![npm version](https://badge.fury.io/js/velocedb.svg)](https://www.npmjs.com/package/velocedb)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/amirfarzamnia/velocedb.svg)](https://github.com/amirfarzamnia/velocedb/issues)
[![GitHub stars](https://img.shields.io/github/stars/amirfarzamnia/velocedb.svg)](https://github.com/amirfarzamnia/velocedb/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/amirfarzamnia/velocedb.svg)](https://github.com/amirfarzamnia/velocedb/forks)

Velocedb is a lightweight, fast, and user-friendly local database designed for Node.js and TypeScript applications. It simplifies data management and persistence by storing data in a human-readable JSON format on your local file system.

## Features

- **Open Source**: Velocedb is open source, which means you have the freedom to modify it according to your preferences.
- **Easy to Use**: Velocedb offers a straightforward API for managing data.
- **Customization**: Easily configure database settings, such as encoding and JSON formatting, to fit your requirements.
- **Security**: Velocedb prioritizes data security to safeguard your information during access and storage.
- **Lightweight**: Velocedb is a lightweight and lightning-fast database. It has been optimized to deliver maximum speed and efficiency.

## Installation

You can install Velocedb via NPM:

```bash
npm install velocedb
```

## Usage

```javascript
import Veloce from 'velocedb';

// Creating a new database located in the databases folder and called database.json.
const database = new Veloce('databases/database.json');

// Set your data.
database.data = {
  string: 'string',
  boolean: true
};

// Modify your data.
database.data.boolean = false;

// Save your data in the database.json file.
database.save();

// Delete your database.json file.
database.delete();

// Retrieve and check your data.
console.log(database.data);
```

## Configuration

You can customize the database by providing an options object when creating it. Here are the available configuration options:

- **encoding**: The encoding option is used for reading or writing the database file (default: 'utf-8').
- **space**: The number of spaces for JSON formatting (default: 2).

### Example

```javascript
import Veloce from 'velocedb';

// Creating a database with custom configuration.
const database = new Veloce('database.json', {
  space: 4
});
```
