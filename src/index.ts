import path from "node:path";
import fs, { WriteFileOptions } from "node:fs";
import sjson from "secure-json-parse";
import stringify from "json-stringify-safe";
import { assign, isObject } from "radash";

/**
 * Veloce is a lightweight JSON database that uses proxies to simplify data manipulation.
 * It provides automatic saving, custom configurations, and flexible data handling.
 *
 * @template Data The type of data stored in the database
 */
export default class Veloce<Data = unknown> {
  /** The file path where the database will be stored */
  private filename: string;

  /** Configuration options for the database */
  private config: {
    /**
     * The number of spaces for indentation when saving the file as a local file.
     *
     * @default 2
     */
    space?: Parameters<typeof stringify>[2];

    /**
     * Should data be automatically saved to the database? This feature only works in proxy mode.
     *
     * @default true
     */
    autoSave?: boolean;

    /**
     * Should the database use no proxy mode? The no-proxy mode disables many features
     * and creates a straightforward process for the databases. This mode is more optimized,
     * but you need to save the data manually.
     *
     * @default false
     */
    noProxy?: boolean;

    /**
     * When automatically saving the database data, the database will wait for the given duration
     * in milliseconds before saving the data. If the database is modified again, it will wait
     * again until there are no more changes, then save the data.
     *
     * @default 750
     */
    autoSaveTimeoutMs?: number;

    /**
     * The timeout in milliseconds before retrying to save the data if any issues occur.
     *
     * @default 100
     */
    savingRetryTimeout?: number;

    /**
     * The `onUpdate` function is only used in proxy mode. Whenever a new update is received
     * for the data, this function will be triggered with the update method and result.
     *
     * @param method - The method that was called on the proxy (e.g., 'get', 'set')
     * @param result - The result of the operation
     * @default undefined
     */
    onUpdate?: (method: string, result: unknown) => void;

    /**
     * The database will create timeouts before saving the data (only in auto-save mode).
     * This number indicates maximum timeouts before forcing a save operation.
     *
     * @default 10
     */
    maximumAutoSaveTimeouts?: number;

    /**
     * The options that will be used for the `node:fs` module when saving the data to the database.
     *
     * @default
     * { encoding: "utf-8" }
     */
    fileOptions?: WriteFileOptions;

    /**
     * This object is used in proxy mode. In JavaScript, proxies require a handler to work.
     * This object is the handler used for data proxies. Modifying this object is not recommended.
     */
    handler: ProxyHandler<any>;

    /**
     * This is the data that will be put into the database during construction.
     * If the database file exists, the data will be loaded from that file;
     * otherwise, it will be initialized as specified (or empty object by default).
     */
    target?: Data;
  };

  /** The data stored in the database, accessible for read/write operations */
  public data: Data;

  /** Flag to track if the initial directory check has been performed */
  private initialCheckIsDone?: boolean;

  /** Flag to indicate if a save operation is in progress */
  private saving?: boolean;

  /** Reference to the auto-save timeout */
  private saveTimeout?: NodeJS.Timeout;

  /** Counter for tracking consecutive auto-save timeout operations */
  private saveTimeoutsCount?: number;

  /**
   * Creates nested proxies for objects within the database structure
   * to track changes at all levels of the object hierarchy.
   *
   * @param target - The object to wrap with a proxy
   * @param handler - The proxy handler to use
   * @returns The proxied object
   */
  static createNestedProxies<T extends object>(
    target: T,
    handler: ProxyHandler<T>
  ): T {
    return new Proxy(target, handler);
  }

  /**
   * Creates a new Veloce database instance.
   *
   * @param filename - The path to the database file
   * @param config - Configuration options for the database
   */
  constructor(filename: string, config: Partial<Veloce<Data>["config"]>) {
    this.filename = filename;

    this.config = {
      space: 2,
      autoSave: true,
      noProxy: false,
      autoSaveTimeoutMs: 750,
      savingRetryTimeout: 100,
      onUpdate: undefined,
      maximumAutoSaveTimeouts: 10,
      fileOptions: { encoding: "utf-8" },
      handler: {
        get: (obj: any, prop: string | symbol, receiver: any): any => {
          const result = Reflect.get(obj, prop, receiver);

          this.config.onUpdate?.("get", result);

          if (isObject(result)) {
            return Veloce.createNestedProxies(result, this.config.handler);
          }

          return result;
        },
        set: (
          obj: any,
          prop: string | symbol,
          value: any,
          receiver: any
        ): boolean => {
          const result = Reflect.set(obj, prop, value, receiver);

          this.config.onUpdate?.("set", result);

          if (this.config.autoSave) {
            this.save();
          }

          return result;
        },
        has: (obj: any, prop: string | symbol): boolean => {
          const result = Reflect.has(obj, prop);

          this.config.onUpdate?.("has", result);

          return result;
        },
        deleteProperty: (obj: any, prop: string | symbol): boolean => {
          const result = Reflect.deleteProperty(obj, prop);

          this.config.onUpdate?.("deleteProperty", result);

          if (this.config.autoSave) {
            this.save();
          }

          return result;
        },
        ownKeys: (obj: any): ArrayLike<string | symbol> => {
          const result = Reflect.ownKeys(obj);

          this.config.onUpdate?.("ownKeys", result);

          return result;
        },
        getOwnPropertyDescriptor: (
          obj: any,
          prop: string | symbol
        ): PropertyDescriptor | undefined => {
          const result = Reflect.getOwnPropertyDescriptor(obj, prop);

          this.config.onUpdate?.("getOwnPropertyDescriptor", result);

          return result;
        },
        defineProperty: (
          obj: any,
          prop: string | symbol,
          descriptor: PropertyDescriptor
        ): boolean => {
          const result = Reflect.defineProperty(obj, prop, descriptor);

          this.config.onUpdate?.("defineProperty", result);

          if (this.config.autoSave) {
            this.save();
          }

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
        setPrototypeOf: (obj: any, proto: object | null): boolean => {
          const result = Reflect.setPrototypeOf(obj, proto);

          this.config.onUpdate?.("setPrototypeOf", result);

          if (this.config.autoSave) {
            this.save();
          }

          return result;
        },
        apply: (target: any, thisArg: any, argumentsList: any[]): any => {
          const result = Reflect.apply(target, thisArg, argumentsList);

          this.config.onUpdate?.("apply", result);

          if (this.config.autoSave) {
            this.save();
          }

          if (isObject(result)) {
            return Veloce.createNestedProxies(result, this.config.handler);
          }

          return result;
        },
        construct: (
          target: any,
          argumentsList: any[],
          newTarget: any
        ): object => {
          const result = Reflect.construct(target, argumentsList, newTarget);

          this.config.onUpdate?.("construct", result);

          if (this.config.autoSave) {
            this.save();
          }

          if (isObject(result)) {
            return Veloce.createNestedProxies(result, this.config.handler);
          }

          return result as object;
        },
      },
      target: {} as unknown as Data,
    };

    this.config.target = fs.existsSync(filename)
      ? sjson(fs.readFileSync(filename, { encoding: "utf-8" }))
      : ({} as unknown as Data);

    assign(this.config, config);

    this.data = this.config.noProxy
      ? (this.config.target as Data)
      : (Veloce.createNestedProxies(
          this.config.target as object,
          this.config.handler
        ) as Data);
  }

  /**
   * Saves the current state of the database to the file.
   *
   * @param force - If true, bypasses all checks and immediately saves the data
   */
  save(force?: boolean): void {
    const save = (): void => {
      const dir = path.dirname(this.filename);

      if (!this.initialCheckIsDone) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        this.initialCheckIsDone = true;
      }

      this.saving = true;

      fs.writeFileSync(
        this.filename,
        stringify(this.data, null, this.config.space),
        this.config.fileOptions
      );

      delete this.saving;
      delete this.saveTimeout;
      delete this.saveTimeoutsCount;
    };

    if (force) {
      save();

      return;
    }

    if (this.saving) {
      setTimeout(save, this.config.savingRetryTimeout);

      return;
    }

    if (!this.config.autoSave) {
      save();

      return;
    }

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);

      this.saveTimeoutsCount = this.saveTimeoutsCount ?? 0;
      this.saveTimeoutsCount++;

      if (
        this.saveTimeoutsCount >= (this.config.maximumAutoSaveTimeouts ?? 0)
      ) {
        save();

        return;
      }
    }

    this.saveTimeout = setTimeout(save, this.config.autoSaveTimeoutMs);
  }

  /**
   * Deletes the database file from the filesystem.
   * This operation cannot be undone.
   */
  delete(): void {
    fs.unlinkSync(this.filename);
  }
}
