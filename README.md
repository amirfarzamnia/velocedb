# Velocedb

**⚠️ Development & Testing Only ⚠️**

VeloceDB is a high-performance, secure, and robust local database designed specifically for development and testing environments. It is **not recommended for production use**, especially in mid-to-large scale applications, as it prioritizes development convenience over production-grade performance and scalability.

[![npm version](https://badge.fury.io/js/velocedb.svg)](https://www.npmjs.com/package/velocedb)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/amirfarzamnia/velocedb.svg)](https://github.com/amirfarzamnia/velocedb/issues)
[![GitHub stars](https://img.shields.io/github/stars/amirfarzamnia/velocedb.svg)](https://github.com/amirfarzamnia/velocedb/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/amirfarzamnia/velocedb.svg)](https://github.com/amirfarzamnia/velocedb/forks)

## Features

- **Development-Focused**: Optimized for rapid development and testing workflows
- **High Performance**: Fast data access and modifications
- **Security**: Built with robust security measures
- **Flexibility**: Supports all data types and complex data structures
- **Ease of Use**: Simple API, no need for complex functions to interact with data
- **Debugging**: Advanced debugging features for better data management
- **Hot Reloading**: Automatic file watching and data reloading
- **Dual Mode**: Choose between Proxy and No-Proxy modes for different use cases

## Installation

```bash
# Using npm
npm install velocedb

# Using yarn
yarn add velocedb

# Using pnpm
pnpm add velocedb
```

## Quick Start

```typescript
import { Veloce } from "velocedb";

// Initialize database with base data
const db = new Veloce("database.json", {
  users: [],
  settings: {},
});

// Basic operations
db.data.users = [
  { id: 1, name: "John" },
  { id: 2, name: "Jane" },
];

// Data is automatically saved
console.log(db.data.users[0].name); // "John"
```

## Usage Examples

### Basic CRUD Operations

```typescript
import { Veloce } from "velocedb";

// Initialize with base data structure
const db = new Veloce("database.json", {
  users: [],
  settings: {},
});

// Create
db.data.users = [{ id: 1, name: "John" }];

// Read
const user = db.data.users[0];

// Update
db.data.users[0].name = "Johnny";

// Delete
delete db.data.users[0];
```

### Working with Complex Data

```typescript
import { Veloce } from "velocedb";

// Initialize with base data structure
const db = new Veloce("database.json", {
  config: {},
  tasks: [],
  mixed: {},
});

// Nested objects
db.data.config = {
  settings: {
    theme: "dark",
    notifications: true,
  },
};

// Arrays
db.data.tasks = [
  { id: 1, title: "Task 1", completed: false },
  { id: 2, title: "Task 2", completed: true },
];

// Mixed data types
db.data.mixed = {
  string: "text",
  number: 42,
  boolean: true,
  array: [1, 2, 3],
  object: { key: "value" },
};
```

## Modes of Operation

### Proxy Mode (Default)

Proxy Mode provides advanced features like auto-save and update tracking. It's ideal for development and testing.

```typescript
import { Veloce } from "velocedb";

const db = new Veloce("database.json", { value: "" });

// Auto-save enabled by default
db.data.value = "Hello World!";
```

### No Proxy Mode

No Proxy Mode is optimized for performance and direct data manipulation. It requires manual saving.

```typescript
import { Veloce } from "velocedb";

const db = new Veloce("database.json", { value: "" }, { noProxy: true });

db.data = { value: "Hello World!" };
db.save(); // Manual save required
```

## Configuration Options

```typescript
interface VeloceConfig {
  // File indentation (default: 2)
  indentation?: number;

  // Auto-save enabled (default: true)
  autoSave?: boolean;

  // No-proxy mode (default: false)
  noProxy?: boolean;

  // Auto-save delay in milliseconds (default: 750)
  autoSaveDelayMs?: number;

  // Save retry timeout in milliseconds (default: 100)
  saveRetryTimeoutMs?: number;

  // Update callback function
  onUpdate?: (method: string, result: unknown) => void;

  // Maximum auto-save timeouts (default: 10)
  maxAutoSaveTimeouts?: number;

  // File system options (default: { encoding: "utf-8" })
  fileOptions?: fs.WriteFileOptions;

  // Use synchronous operations (default: false)
  useSync?: boolean;
}
```

## Advanced Usage

### Hot Reloading

You canmplement functionalities like reload on file change::

```typescript
import { Veloce } from "velocedb";

const db = new Veloce("database.json", {});

// Manual reload
db.reload();

// Async reload
await db.reloadAsync();
```

### Manual File Operations

```typescript
import { Veloce } from "velocedb";

const db = new Veloce("database.json", {});

// Save manually
db.save();

// Async save
await db.saveAsync();

// Delete database file
db.delete();

// Async delete
await db.deleteAsync();
```

### Event Handling

```typescript
import { Veloce } from "velocedb";

const db = new Veloce(
  "database.json",
  {},
  {
    onUpdate: (method, result) => {
      console.log(`Operation: ${method}`);
      console.log(`Result: ${result}`);
    },
  }
);
```

## Best Practices

1. **Development Only**: Use VeloceDB exclusively for development and testing environments.

2. **Data Structure Planning**:

   ```typescript
   // Define clear data structures
   interface User {
     id: number;
     name: string;
     email: string;
   }

   interface Database {
     users: User[];
     settings: {
       theme: string;
       notifications: boolean;
     };
   }

   const db = new Veloce<Database>("database.json");
   ```

3. **Performance Optimization**:

   - Use No-Proxy mode for large datasets
   - Increase `autoSaveDelayMs` for frequent updates
   - Batch updates when possible

4. **Error Handling**:

   ```typescript
   try {
     db.data.value = "test";
   } catch (error) {
     console.error("Database operation failed:", error);
   }
   ```

## Common Pitfalls

1. **Production Use**: Avoid using VeloceDB in production environments.

2. **Large Datasets**: Performance may degrade with very large datasets.

3. **Concurrent Access**: Not designed for concurrent access from multiple processes.

4. **Memory Usage**: Keep an eye on memory usage with large datasets.

## Troubleshooting

1. **Data Not Saving**:

   - Check file permissions
   - Verify `autoSave` is enabled
   - Ensure proper error handling

2. **Performance Issues**:

   - Switch to No-Proxy mode
   - Increase `autoSaveDelayMs`
   - Reduce data complexity

3. **File Corruption**:
   - Regular backups
   - Use `reload()` to refresh data
   - Check file integrity

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

VeloceDB is licensed under the [MIT License](https://opensource.org/licenses/MIT).

## Support

For support, please:

1. Check the [documentation](https://github.com/amirfarzamnia/velocedb)
2. Search existing issues
3. Create a new issue if needed
