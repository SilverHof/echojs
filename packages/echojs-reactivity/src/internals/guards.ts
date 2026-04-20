const kSignalBrand: unique symbol = Symbol.for("echojs.reactivity.signal");
const kReadonlyBrand: unique symbol = Symbol.for("echojs.reactivity.readonlySignal");

export type BrandedSignal = {
  [kSignalBrand]: true;
  [kReadonlyBrand]?: true;
};

export const brandWritable = <T extends object>(obj: T): T & BrandedSignal => {
  Object.defineProperty(obj, kSignalBrand, { value: true });
  return obj as T & BrandedSignal;
};

export const brandReadonly = <T extends object>(obj: T): T & BrandedSignal => {
  Object.defineProperty(obj, kSignalBrand, { value: true });
  Object.defineProperty(obj, kReadonlyBrand, { value: true });
  return obj as T & BrandedSignal;
};

export const isBrandedSignal = (value: unknown): value is BrandedSignal => {
  return typeof value === "object" && value !== null && (value as any)[kSignalBrand] === true;
};

export const isBrandedReadonlySignal = (value: unknown): value is BrandedSignal => {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as any)[kSignalBrand] === true &&
    (value as any)[kReadonlyBrand] === true
  );
};

