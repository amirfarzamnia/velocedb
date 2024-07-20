# Velocedb

**A high-performance, secure, and robust local database**

[![npm version](https://badge.fury.io/js/velocedb.svg)](https://www.npmjs.com/package/velocedb)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/amirfarzamnia/velocedb.svg)](https://github.com/amirfarzamnia/velocedb/issues)
[![GitHub stars](https://img.shields.io/github/stars/amirfarzamnia/velocedb.svg)](https://github.com/amirfarzamnia/velocedb/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/amirfarzamnia/velocedb.svg)](https://github.com/amirfarzamnia/velocedb/forks)

VeloceDB is a highly secure, fast, and efficient local database designed for Node.js applications. It supports all data types and offers a flexible and easy-to-use interface. VeloceDB operates with a single class that integrates all its features, making it both powerful and straightforward.

## Features

- **High Performance**: Fast data access and modifications.
- **Security**: Built with robust security measures.
- **Flexibility**: Supports all data types and complex data structures.
- **Ease of Use**: Simple API, no need for complex functions to interact with data.
- **Debugging**: Advanced debugging features for better data management.

## Installation

To install VeloceDB via npm, use the following command:

```bash
npm install velocedb
```

## Usage

Here’s a basic example of how to use VeloceDB:

```javascript
import Veloce from 'velocedb';

const database = new Veloce('database.json');

database.data.number = 8;
```

This example creates a `database.json` file and sets a `number` property to 8. The data is automatically saved to the file. You can also modify and manage your data as follows:

```javascript
import Veloce from 'velocedb';

const database = new Veloce('database.json');

database.data.number = 8;
database.data.string = 'Hello World!';
database.data.boolean = true;

delete database.data.boolean;
```

All changes are automatically saved, making data management seamless and effortless.

## Modes of Operation

### Proxy Mode

In Proxy Mode, VeloceDB provides advanced features such as auto-save, detailed debug logs, and update tracking. This mode is recommended for most use cases as it offers comprehensive functionality and optimization for complex tasks.

**Example:**

```javascript
import Veloce from 'velocedb';

const database = new Veloce('database.json');

database.data.string = 'Hello World!';
```

### No Proxy Mode

No Proxy Mode is optimized for performance and direct data manipulation. It bypasses the use of proxies for a more straightforward process. However, features like auto-updates and update handlers are not available in this mode. You need to manually save the database.

**Example:**

```javascript
import Veloce from 'velocedb';

const database = new Veloce('tests/i.json', { noProxy: true });

database.data = { string: 'Hello World!' };

database.save();
```

## Configuration

VeloceDB offers various configuration options. For a comprehensive list, refer to the TypeScript documentation available [here](./index.d.ts).

## Who Uses VeloceDB

VeloceDB is ideal for projects requiring an efficient, secure, and easy-to-use local database. It is especially suitable for Node.js projects needing optimized data storage and access. Originally developed for [Bot Studio](https://www.botstudioo.com), VeloceDB is well-suited for handling extensive data in a streamlined manner.

## License

VeloceDB is licensed under the [MIT License](https://opensource.org/licenses/MIT).

For more information and to contribute, visit the [GitHub repository](https://github.com/amirfarzamnia/velocedb).
