import path from "node:path";
import fs, { WriteFileOptions } from "node:fs";
import sjson from "secure-json-parse";
import stringify from "json-stringify-safe";
import { assign, isObject } from "radash";

/**
 * Veloce is a lightweight JSON database that uses proxies to simplify data manipulation.
 * It provides automatic saving (both synchronous and asynchronous), custom configurations,
 * and flexible data handling.
 *
 * @template TData The type of data stored in the database
 */
export default class Veloce<TData = unknown> {
  /** The file path where the database will be stored */
  private readonly filePath: string;

  /** Configuration options for the database */
  private readonly config: {
    /**
     * The number of spaces for indentation when saving the file.
     * @default 2
     */
    indentation?: Parameters<typeof stringify>[2];

    /**
     * Whether data should be automatically saved to the database.
     * This feature only works in proxy mode.
     * @default true
     */
    autoSave?: boolean;

    /**
     * Whether the database should use no-proxy mode.
     * The no-proxy mode disables many features for a more streamlined process.
     * This mode is more optimized, but requires manual data saving.
     * @default false
     */
    noProxy?: boolean;

    /**
     * When auto-saving is enabled, the database will wait for this duration (in milliseconds)
     * before saving the data. If modified again during this period, the timer resets.
     * @default 750
     */
    autoSaveDelayMs?: number;

    /**
     * The timeout in milliseconds before retrying to save the data if any issues occur.
     * @default 100
     */
    saveRetryTimeoutMs?: number;

    /**
     * Callback function triggered on data updates (only in proxy mode).
     * Receives the update method name and operation result.
     * @param method - The method that was called on the proxy (e.g., 'get', 'set')
     * @param result - The result of the operation
     * @default undefined
     */
    onUpdate?: (method: string, result: unknown) => void;

    /**
     * Maximum number of consecutive auto-save timeouts before forcing a save operation.
     * @default 10
     */
    maxAutoSaveTimeouts?: number;

    /**
     * File system options used when saving data to the database file.
     * @default { encoding: "utf-8" }
     */
    fileOptions?: WriteFileOptions;

    /**
     * Whether to use synchronous file operations by default.
     * If false, asynchronous operations will be used.
     * @default false
     */
    sync?: boolean;

    /**
     * Whether to throw errors when file operations fail.
     * If false, errors will be silently caught.
     * @default true
     */
    throwErrors?: boolean;
  };

  /** The data stored in the database, accessible for read/write operations */
  public data: TData;

  /** Flag to track if the initial directory check has been performed */
  private isInitialCheckComplete = false;

  /** Flag to indicate if a save operation is in progress */
  private isSaving = false;

  /** Reference to the auto-save timeout */
  private saveTimeout?: NodeJS.Timeout;

  /** Counter for tracking consecutive auto-save timeout operations */
  private saveTimeoutCount = 0;

  /**
   * Creates nested proxies for objects within the database structure
   * to track changes at all levels of the object hierarchy.
   *
   * @param target - The target object to proxy
   * @param handler - The proxy handler containing trap methods
   * @returns A proxied version of the target object
   */
  private static createNestedProxies<T extends object>(
    target: T,
    handler: ProxyHandler<T>,
  ): T {
    return new Proxy(target, handler);
  }

  /**
   * Creates a new Veloce database instance.
   *
   * @param filePath - The path to the database file
   * @param config - Configuration options for the database
   */
  constructor(filePath: string, config: Partial<Veloce<TData>["config"]> = {}) {
    this.filePath = filePath;

    // Default configuration
    this.config = {
      indentation: 2,
      autoSave: true,
      noProxy: false,
      autoSaveDelayMs: 750,
      saveRetryTimeoutMs: 100,
      onUpdate: undefined,
      maxAutoSaveTimeouts: 10,
      fileOptions: { encoding: "utf-8" },
      sync: false,
      throwErrors: true,
    };

    // Merge user configuration with defaults
    assign(this.config, config);

    // Initialize data
    this.data = this.initializeData();
  }

  /**
   * Initializes the database data, either from an existing file or with default values.
   *
   * @returns The initialized data
   */
  private initializeData(): TData {
    try {
      const fileExists = fs.existsSync(this.filePath);

      const initialData = fileExists
        ? sjson.parse(fs.readFileSync(this.filePath, { encoding: "utf-8" }))
        : ({} as TData);

      return this.config.noProxy
        ? initialData
        : (Veloce.createNestedProxies(
            initialData as object,
            this.createProxyHandler(),
          ) as TData);
    } catch (error) {
      if (this.config.throwErrors) {
        throw error;
      }

      return {} as TData;
    }
  }

  /**
   * Creates the proxy handler for reactive data operations.
   *
   * @returns A proxy handler object with trap methods
   */
  private createProxyHandler(): ProxyHandler<any> {
    return {
      get: (target: any, property: string | symbol, receiver: any): any => {
        const result = Reflect.get(target, property, receiver);

        this.config.onUpdate?.("get", result);

        return isObject(result)
          ? Veloce.createNestedProxies(result, this.createProxyHandler())
          : result;
      },

      set: (
        target: any,
        property: string | symbol,
        value: any,
        receiver: any,
      ): boolean => {
        const result = Reflect.set(target, property, value, receiver);

        this.config.onUpdate?.("set", result);

        if (this.config.autoSave) {
          if (this.config.sync) {
            this.save();
          } else {
            void this.saveAsync();
          }
        }

        return result;
      },

      deleteProperty: (target: any, property: string | symbol): boolean => {
        const result = Reflect.deleteProperty(target, property);

        this.config.onUpdate?.("deleteProperty", result);

        if (this.config.autoSave) {
          if (this.config.sync) {
            this.save();
          } else {
            void this.saveAsync();
          }
        }

        return result;
      },

      defineProperty: (
        target: any,
        property: string | symbol,
        descriptor: PropertyDescriptor,
      ): boolean => {
        const result = Reflect.defineProperty(target, property, descriptor);

        this.config.onUpdate?.("defineProperty", result);

        if (this.config.autoSave) {
          if (this.config.sync) {
            this.save();
          } else {
            void this.saveAsync();
          }
        }

        return result;
      },

      setPrototypeOf: (target: any, prototype: object | null): boolean => {
        const result = Reflect.setPrototypeOf(target, prototype);

        this.config.onUpdate?.("setPrototypeOf", result);

        if (this.config.autoSave) {
          if (this.config.sync) {
            this.save();
          } else {
            void this.saveAsync();
          }
        }

        return result;
      },

      apply: (target: any, thisArg: any, argumentsList: any[]): any => {
        const result = Reflect.apply(target, thisArg, argumentsList);

        this.config.onUpdate?.("apply", result);

        if (this.config.autoSave) {
          if (this.config.sync) {
            this.save();
          } else {
            void this.saveAsync();
          }
        }

        return result;
      },

      construct: (
        target: any,
        argumentsList: any[],
        newTarget: any,
      ): object => {
        const result = Reflect.construct(target, argumentsList, newTarget);

        this.config.onUpdate?.("construct", result);

        if (this.config.autoSave) {
          if (this.config.sync) {
            this.save();
          } else {
            void this.saveAsync();
          }
        }

        return isObject(result)
          ? Veloce.createNestedProxies(result, this.createProxyHandler())
          : (result as object);
      },

      // Simple proxy traps that don't trigger saves
      has: (obj: any, prop: string | symbol): boolean => {
        const result = Reflect.has(obj, prop);

        this.config.onUpdate?.("has", result);

        return result;
      },

      ownKeys: (obj: any): ArrayLike<string | symbol> => {
        const result = Reflect.ownKeys(obj);

        this.config.onUpdate?.("ownKeys", result);

        return result;
      },

      getOwnPropertyDescriptor: (
        obj: any,
        prop: string | symbol,
      ): PropertyDescriptor | undefined => {
        const result = Reflect.getOwnPropertyDescriptor(obj, prop);

        this.config.onUpdate?.("getOwnPropertyDescriptor", result);

        return result;
      },

      preventExtensions: (obj: any): boolean => {
        const result = Reflect.preventExtensions(obj);

        this.config.onUpdate?.("preventExtensions", result);

        return result;
      },

      isExtensible: (obj: any): boolean => {
        const result = Reflect.isExtensible(obj);

        this.config.onUpdate?.("isExtensible", result);

        return result;
      },

      getPrototypeOf: (obj: any): object | null => {
        const result = Reflect.getPrototypeOf(obj);

        this.config.onUpdate?.("getPrototypeOf", result);

        return result;
      },
    };
  }

  /**
   * Saves the current state of the database to the file synchronously.
   * @param force - If true, bypasses all checks and immediately saves the data
   */
  save(force = false): void {
    const performSave = (): void => {
      try {
        const dir = path.dirname(this.filePath);

        if (!this.isInitialCheckComplete) {
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          this.isInitialCheckComplete = true;
        }

        this.isSaving = true;

        fs.writeFileSync(
          this.filePath,
          stringify(this.data, null, this.config.indentation),
          this.config.fileOptions,
        );
      } catch (error) {
        if (this.config.throwErrors) {
          throw error;
        }
      } finally {
        this.cleanupSaveState();
      }
    };

    this.handleSaveOperation(performSave, force);
  }

  /**
   * Saves the current state of the database to the file asynchronously.
   * @param force - If true, bypasses all checks and immediately saves the data
   */
  async saveAsync(force = false): Promise<void> {
    const performSave = async (): Promise<void> => {
      try {
        const dir = path.dirname(this.filePath);

        if (!this.isInitialCheckComplete) {
          try {
            await fs.promises.access(dir);
          } catch {
            await fs.promises.mkdir(dir, { recursive: true });
          }

          this.isInitialCheckComplete = true;
        }

        this.isSaving = true;

        await fs.promises.writeFile(
          this.filePath,
          stringify(this.data, null, this.config.indentation),
          this.config.fileOptions,
        );
      } catch (error) {
        if (this.config.throwErrors) {
          throw error;
        }
      } finally {
        this.cleanupSaveState();
      }
    };

    this.handleSaveOperation(performSave, force);
  }

  /**
   * Handles the save operation with proper timing and retry logic.
   */
  private handleSaveOperation(
    saveFn: () => void | Promise<void>,
    force: boolean,
  ): void {
    if (force) {
      void saveFn();

      return;
    }

    if (this.isSaving) {
      setTimeout(
        () => this.handleSaveOperation(saveFn, force),
        this.config.saveRetryTimeoutMs,
      );

      return;
    }

    if (!this.config.autoSave) {
      void saveFn();

      return;
    }

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);

      this.saveTimeoutCount++;

      if (this.saveTimeoutCount >= (this.config.maxAutoSaveTimeouts ?? 0)) {
        void saveFn();

        return;
      }
    }

    this.saveTimeout = setTimeout(
      () => void saveFn(),
      this.config.autoSaveDelayMs,
    );
  }

  /**
   * Cleans up the save state after a save operation.
   */
  private cleanupSaveState(): void {
    this.isSaving = false;

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = undefined;

    this.saveTimeoutCount = 0;
  }

  /**
   * Deletes the database file from the filesystem synchronously.
   * This operation cannot be undone.
   */
  delete(): void {
    try {
      fs.unlinkSync(this.filePath);
    } catch (error) {
      if (this.config.throwErrors) {
        throw error;
      }
    }
  }

  /**
   * Deletes the database file from the filesystem asynchronously.
   * This operation cannot be undone.
   */
  async deleteAsync(): Promise<void> {
    try {
      await fs.promises.unlink(this.filePath);
    } catch (error) {
      if (this.config.throwErrors) {
        throw error;
      }
    }
  }

  /**
   * Reloads the data from the file synchronously.
   */
  reload(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const newData = sjson.parse(
          fs.readFileSync(this.filePath, { encoding: "utf-8" }),
        );

        this.data = this.config.noProxy
          ? newData
          : (Veloce.createNestedProxies(
              newData as object,
              this.createProxyHandler(),
            ) as TData);
      }
    } catch (error) {
      if (this.config.throwErrors) {
        throw error;
      }
    }
  }

  /**
   * Reloads the data from the file asynchronously.
   */
  async reloadAsync(): Promise<void> {
    try {
      await fs.promises.access(this.filePath);

      const content = await fs.promises.readFile(this.filePath, {
        encoding: "utf-8",
      });

      const newData = sjson.parse(content);

      this.data = this.config.noProxy
        ? newData
        : (Veloce.createNestedProxies(
            newData as object,
            this.createProxyHandler(),
          ) as TData);
    } catch (error) {
      if (this.config.throwErrors) {
        throw error;
      }
    }
  }
}
