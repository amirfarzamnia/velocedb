import path from "node:path";
import fs from "node:fs";
import sjson from "secure-json-parse";
import stringify from "json-stringify-safe";

/**
 * Veloce is a lightweight JSON database that uses proxies to simplify data manipulation.
 * It provides automatic saving (both synchronous and asynchronous), custom configurations,
 * and flexible data handling.
 *
 * @template TData The type of data stored in the database
 */
export class Veloce<TData = unknown> {
  /** The file path where the database will be stored
   *
   * @private
   */
  private readonly _filePath: string;

  /** Configuration options for the database
   *
   * @public
   */
  public readonly configuration: {
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
    onUpdate?: (
      method:
        | "get"
        | "set"
        | "deleteProperty"
        | "defineProperty"
        | "setPrototypeOf"
        | "apply"
        | "construct"
        | "has"
        | "ownKeys"
        | "getOwnPropertyDescriptor"
        | "preventExtensions"
        | "isExtensible"
        | "getPrototypeOf",
      result: unknown
    ) => void;

    /**
     * Maximum number of consecutive auto-save timeouts before forcing a save operation.
     * @default 10
     */
    maxAutoSaveTimeouts?: number;

    /**
     * File system options used when saving data to the database file.
     * @default { encoding: "utf-8" }
     */
    fileOptions?: fs.WriteFileOptions;

    /**
     * Whether to use synchronous file operations by default.
     * If false, asynchronous operations will be used.
     * @default false
     */
    useSync?: boolean;
  };

  /** Cache for storing proxied objects
   *
   * @private
   */
  private _proxyCache = new WeakMap<object, object>();

  /** Proxy handler for reactive data operations
   *
   * @private
   */
  private _proxyHandler: ProxyHandler<any>;

  /** The data stored in the database, accessible for read/write operations
   *
   * @public
   */
  public data: TData;

  /** Flag to track if the initial directory check has been performed
   *
   * @private
   */
  private _isInitialCheckComplete = false;

  /** Flag to indicate if a save operation is in progress
   *
   * @private
   */
  private _isSaving = false;

  /** Reference to the auto-save timeout
   *
   * @private
   */
  private _saveTimeout?: NodeJS.Timeout;

  /** Counter for tracking consecutive auto-save timeout operations
   *
   * @private
   */
  private _saveTimeoutCount = 0;

  /** Queue for handling save operations
   *
   * @private
   */
  private _saveQueue: Promise<void> = Promise.resolve();

  /** Flag to indicate if the database is closed
   *
   * @private
   */
  private _isClosed = false;

  /**
   * Creates nested proxies for objects within the database structure
   * to track changes at all levels of the object hierarchy.
   *
   * @private
   * @template T The type of the target object
   * @param target - The target object to proxy
   * @param handler - The proxy handler containing trap methods
   * @param proxyCache - The cache for storing proxied objects
   * @returns A proxied version of the target object
   */
  private static _createNestedProxies<T extends object>(
    target: T,
    handler: ProxyHandler<T>,
    proxyCache: WeakMap<object, object>
  ): T {
    if (proxyCache.has(target)) {
      return proxyCache.get(target) as T;
    }

    const proxy = new Proxy(target, handler);

    proxyCache.set(target, proxy);

    return proxy;
  }

  /**
   * Triggers an automatic save operation based on configuration settings.
   * If auto-save is enabled, it will use either synchronous or asynchronous
   * save methods depending on the configuration.
   *
   * @private
   */
  private _triggerAutoSave(): void {
    if (this.configuration.autoSave) {
      if (this.configuration.useSync) {
        this.save();
      } else {
        void this.saveAsync();
      }
    }
  }

  /**
   * Creates a new Veloce database instance.
   *
   * @public
   * @param filePath - The path to the database file
   * @param baseData - The base data to use as fallback when no data exists
   * @param configuration - Configuration options for the database
   */
  public constructor(
    filePath: string,
    baseData: TData,
    configuration: Veloce<TData>["configuration"] = {}
  ) {
    this._filePath = filePath;

    this.configuration = {
      indentation: 2,
      autoSave: true,
      noProxy: false,
      autoSaveDelayMs: 750,
      saveRetryTimeoutMs: 100,
      onUpdate: undefined,
      maxAutoSaveTimeouts: 10,
      fileOptions: { encoding: "utf-8" },
      useSync: false,
      ...configuration,
    };

    this._proxyHandler = this._createProxyHandler();

    this.data = this._initializeData(baseData);
  }

  /**
   * Initializes the database data, either from an existing file or with the provided base data.
   *
   * @private
   * @param baseData - The base data to use as fallback when no data exists
   * @returns The initialized data
   */
  private _initializeData(baseData: TData): TData {
    const fileExists = fs.existsSync(this._filePath);

    const initialData = fileExists
      ? sjson.parse(
          fs.readFileSync(this._filePath, this.configuration.fileOptions)
        )
      : baseData;

    return this.configuration.noProxy
      ? initialData
      : Veloce._createNestedProxies(
          initialData,
          this._proxyHandler,
          this._proxyCache
        );
  }

  /**
   * Creates the proxy handler for reactive data operations.
   *
   * @private
   * @returns A proxy handler object with trap methods
   */
  private _createProxyHandler(): ProxyHandler<any> {
    return {
      get: (target: any, property: string | symbol, receiver: any): any => {
        const result = Reflect.get(target, property, receiver);

        this.configuration.onUpdate?.("get", result);

        return result instanceof Object
          ? Veloce._createNestedProxies(
              result,
              this._proxyHandler,
              this._proxyCache
            )
          : result;
      },
      set: (
        target: any,
        property: string | symbol,
        value: any,
        receiver: any
      ): boolean => {
        const result = Reflect.set(target, property, value, receiver);

        this.configuration.onUpdate?.("set", result);

        this._triggerAutoSave();

        return result;
      },
      deleteProperty: (target: any, property: string | symbol): boolean => {
        const result = Reflect.deleteProperty(target, property);

        this.configuration.onUpdate?.("deleteProperty", result);

        this._triggerAutoSave();

        return result;
      },
      defineProperty: (
        target: any,
        property: string | symbol,
        descriptor: PropertyDescriptor
      ): boolean => {
        const result = Reflect.defineProperty(target, property, descriptor);

        this.configuration.onUpdate?.("defineProperty", result);

        this._triggerAutoSave();

        return result;
      },
      setPrototypeOf: (target: any, prototype: object | null): boolean => {
        const result = Reflect.setPrototypeOf(target, prototype);

        this.configuration.onUpdate?.("setPrototypeOf", result);

        this._triggerAutoSave();

        return result;
      },
      apply: (target: any, thisArg: any, argumentsList: any[]): any => {
        const result = Reflect.apply(target, thisArg, argumentsList);

        this.configuration.onUpdate?.("apply", result);

        this._triggerAutoSave();

        return result;
      },
      construct: (target: any, argumentsList: any[], newTarget: any): any => {
        const result = Reflect.construct(target, argumentsList, newTarget);

        this.configuration.onUpdate?.("construct", result);

        this._triggerAutoSave();

        return result instanceof Object
          ? Veloce._createNestedProxies(
              result,
              this._proxyHandler,
              this._proxyCache
            )
          : result;
      },
      has: (obj: any, prop: string | symbol): boolean => {
        const result = Reflect.has(obj, prop);

        this.configuration.onUpdate?.("has", result);

        return result;
      },
      ownKeys: (obj: any): ArrayLike<string | symbol> => {
        const result = Reflect.ownKeys(obj);

        this.configuration.onUpdate?.("ownKeys", result);

        return result;
      },
      getOwnPropertyDescriptor: (
        obj: any,
        prop: string | symbol
      ): PropertyDescriptor | undefined => {
        const result = Reflect.getOwnPropertyDescriptor(obj, prop);

        this.configuration.onUpdate?.("getOwnPropertyDescriptor", result);

        return result;
      },
      preventExtensions: (obj: any): boolean => {
        const result = Reflect.preventExtensions(obj);

        this.configuration.onUpdate?.("preventExtensions", result);

        return result;
      },
      isExtensible: (obj: any): boolean => {
        const result = Reflect.isExtensible(obj);

        this.configuration.onUpdate?.("isExtensible", result);

        return result;
      },
      getPrototypeOf: (obj: any): object | null => {
        const result = Reflect.getPrototypeOf(obj);

        this.configuration.onUpdate?.("getPrototypeOf", result);

        return result;
      },
    };
  }

  /**
   * Saves the current state of the database to the file synchronously.
   * @param force - If true, bypasses all checks and immediately saves the data
   *
   * @public
   */
  public save(force = false): void {
    const performSave = (): void => {
      const dir = path.dirname(this._filePath);

      if (!this._isInitialCheckComplete) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        this._isInitialCheckComplete = true;
      }

      this._isSaving = true;

      fs.writeFileSync(
        this._filePath,
        stringify(this.data, null, this.configuration.indentation),
        this.configuration.fileOptions
      );

      this._cleanupSaveState();
    };

    this._handleSaveOperation(performSave, force);
  }

  /**
   * Saves the current state of the database to the file asynchronously.
   * @param force - If true, bypasses all checks and immediately saves the data
   *
   * @public
   */
  public async saveAsync(force = false): Promise<void> {
    const performSave = async (): Promise<void> => {
      const dir = path.dirname(this._filePath);

      if (!this._isInitialCheckComplete) {
        try {
          await fs.promises.access(dir);
        } catch {
          await fs.promises.mkdir(dir, { recursive: true });
        }

        this._isInitialCheckComplete = true;
      }

      this._isSaving = true;

      await fs.promises.writeFile(
        this._filePath,
        stringify(this.data, null, this.configuration.indentation),
        this.configuration.fileOptions
      );

      this._cleanupSaveState();
    };

    this._handleSaveOperation(performSave, force);
  }

  /**
   * Handles the save operation with proper timing and retry logic.
   *
   * @private
   */
  private _handleSaveOperation(
    saveFunction: () => void | Promise<void>,
    force: boolean
  ): void {
    if (this._isClosed) {
      return;
    }

    if (force) {
      this._saveQueue = this._saveQueue.then(async () => {
        await saveFunction();
      });

      return;
    }

    if (this._isSaving) {
      setTimeout(
        () => this._handleSaveOperation(saveFunction, force),
        this.configuration.saveRetryTimeoutMs
      );

      return;
    }

    if (!this.configuration.autoSave) {
      this._saveQueue = this._saveQueue.then(async () => {
        await saveFunction();
      });

      return;
    }

    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);

      this._saveTimeoutCount++;

      if (
        this._saveTimeoutCount >= (this.configuration.maxAutoSaveTimeouts ?? 0)
      ) {
        this._saveQueue = this._saveQueue.then(async () => {
          await saveFunction();
        });

        return;
      }
    }

    this._saveTimeout = setTimeout(() => {
      this._saveQueue = this._saveQueue.then(async () => {
        await saveFunction();
      });
    }, this.configuration.autoSaveDelayMs);
  }

  /**
   * Cleans up the save state after a save operation.
   *
   * @private
   */
  private _cleanupSaveState(): void {
    this._isSaving = false;

    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
    }

    this._saveTimeout = undefined;

    this._saveTimeoutCount = 0;
  }

  /**
   * Deletes the database file from the filesystem synchronously.
   * This operation cannot be undone.
   *
   * @public
   */
  public delete(): void {
    fs.unlinkSync(this._filePath);
  }

  /**
   * Deletes the database file from the filesystem asynchronously.
   * This operation cannot be undone.
   *
   * @public
   */
  public async deleteAsync(): Promise<void> {
    await fs.promises.unlink(this._filePath);
  }

  /**
   * Reloads the data from the file synchronously.
   *
   * @public
   */
  public reload(): void {
    if (fs.existsSync(this._filePath)) {
      const newData = sjson.parse(
        fs.readFileSync(this._filePath, { encoding: "utf-8" })
      );

      this.data = this.configuration.noProxy
        ? newData
        : Veloce._createNestedProxies(
            newData,
            this._proxyHandler,
            this._proxyCache
          );
    }
  }

  /**
   * Reloads the data from the file asynchronously.
   *
   * @public
   */
  public async reloadAsync(): Promise<void> {
    await fs.promises.access(this._filePath);

    const content = await fs.promises.readFile(this._filePath, {
      encoding: "utf-8",
    });

    const newData = sjson.parse(content);

    this.data = this.configuration.noProxy
      ? newData
      : Veloce._createNestedProxies(
          newData,
          this._proxyHandler,
          this._proxyCache
        );
  }

  /**
   * Closes the database instance, cancelling any pending saves and cleaning up resources.
   * After closing, no further operations will be performed.
   *
   * @public
   */
  public async close(): Promise<void> {
    if (this._isClosed) {
      return;
    }

    this._isClosed = true;

    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);

      this._saveTimeout = undefined;
    }

    await this._saveQueue;

    this._proxyCache = new WeakMap<object, object>();
  }
}
