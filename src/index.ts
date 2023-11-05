import { createHash } from "crypto";
import fs from "fs/promises";
import path from "path";
import stringify from "fast-json-stable-stringify";

const STORE = path.join(__dirname, "store");

type Key = string;
type Value = unknown;

export async function storeValue(value: Value): Promise<Key> {
  const { raw, type } = serialize(value);
  const key: Key = `${hash(raw)}-${type}`;
  const file = path.join(STORE, key);
  try {
    await fs.writeFile(file, raw, { flag: "wx" });
  } catch (err: any) {
    if (err.code === "EEXIST") {
      // ok
    } else {
      throw err;
    }
  }
  return key;
}

export async function fetchValue<T extends Value>(key: Key): Promise<T> {
  const content = await fs.readFile(path.join(STORE, key));
  const raw = new Uint8Array(content.buffer);
  const match = key.match(/-(.*)$/);
  if (!match) {
    throw new Error(`Key is missing type`);
  }
  const type = match[1];
  return deserialize<T>(raw, type);
}

/* Serialization */

function serialize(value: Value): { raw: Uint8Array; type: string } {
  return value instanceof Uint8Array
    ? { raw: value, type: "binary" }
    : { raw: stringToUint8Array(stringify(value)), type: "json" };
}

function stringToUint8Array(str: string): Uint8Array {
  const buffer = Buffer.from(str);
  return new Uint8Array(buffer);
}

function deserialize<T extends Value>(value: Uint8Array, type: string): T {
  if (type === "binary") {
    return value as T;
  }
  if (type === "json") {
    const str = Buffer.from(value).toString("utf-8");
    return JSON.parse(str);
  }
  throw new Error("Unsupported type.");
}

function hash(value: Uint8Array): string {
  const hash = createHash("sha256");
  hash.update(value);
  return hash.digest("hex");
}

/* Computations */

async function compute<In extends Value, Out extends Value>(
  input: In,
  fn: (x: In) => Promise<Out>,
): Promise<Out> {
  const inputKey = await storeValue(input);
  const key = `out:${inputKey}`;
  return fetchValue<Out>(key).catch(async (err: any) => {
    if (err.code !== "ENOENT") throw err;
    const result = await fn(input);
    const outputKey = await storeValue(result);
    await fs.symlink(outputKey, path.join(STORE, key));
    return result;
  });
}

export function computation<
  C extends Value,
  In extends Value,
  Out extends Value,
>(config: C, fn: (inputs: In, config: C) => Promise<Out>) {
  return async (inputs: In) => {
    const configKey = await storeValue(config);
    const combinedInput = {
      configKey,
      inputs,
    };
    return compute(combinedInput, (x) => {
      return fn(x.inputs, config);
    });
  };
}
