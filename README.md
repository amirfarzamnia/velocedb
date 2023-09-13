# VeloceDB

**A High-Performance, Secure, and Robust Local Database**

[![npm version](https://badge.fury.io/js/velocedb.svg)](https://badge.fury.io/js/velocedb)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/amirfarzamnia/VeloceDB.svg)](https://github.com/amirfarzamnia/VeloceDB/issues)
[![GitHub stars](https://img.shields.io/github/stars/amirfarzamnia/VeloceDB.svg)](https://github.com/amirfarzamnia/VeloceDB/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/amirfarzamnia/VeloceDB.svg)](https://github.com/amirfarzamnia/VeloceDB/network)

VeloceDB is a lightweight and user-friendly local database designed for Node.js applications. It simplifies data management and persistence by storing data in a human-readable JSON format on your local file system.

## Features

- **Easy to Use**: VeloceDB offers a straightforward API for managing data.
- **JSON Storage**: Data is stored in JSON format, making it human-readable and easy to work with.
- **Custom Configuration**: Easily configure database settings such as encoding and JSON formatting to fit your requirements.
- **Security**: VeloceDB prioritizes data security to safeguard your information during access and storage.

## Installation

You can install VeloceDB via npm:

```bash
npm install velocedb
```

## Usage

```javascript
const veloce = require('velocedb');
const database = new veloce('database.json');

// Set data
database.data = {
    string: 'Hello World',
    boolean: true
};

// Modify data
database.data.boolean = false;

// Save data to the database file
database.save();

// Retrieve and check data
console.log(database.data);
```

## Configuration

You can customize the database by providing an options object when creating an instance. Here are the available configuration options:

- **encoding**: The encoding used for reading/writing the database file (default: 'utf-8').
- **space**: The number of spaces for JSON formatting (default: 2).

### Example

```javascript
const database = new veloce('database.json', {
    space: 4
});
```

## Who Uses This Database?

VeloceDB serves as the default database for [Absyro Company](https://absyro.com) and its services, including [Bot Studio](https://botstudioo.com).
