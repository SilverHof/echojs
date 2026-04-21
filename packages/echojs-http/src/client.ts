import { executeRequest } from "./core/execute.js";
import { fetchAdapter } from "./adapters/fetch-adapter.js";
import type { HttpAdapter } from "./types/adapter.js";
import type { HttpMethod, RequestOptions } from "./types/public.js";
import type { HttpResponse } from "./types/response.js";
import { mergeRequestOptions } from "./options/merge.js";
import { normalizeRequestOptions } from "./options/normalize.js";

export type HttpRequestPromise<T = unknown> = Promise<HttpResponse<T>> & {
  json<R = unknown>(): Promise<R>;
  text(): Promise<string>;
  bytes(): Promise<Uint8Array>;
  arrayBuffer(): Promise<ArrayBuffer>;
};

function augmentRequestPromise<T>(promise: Promise<HttpResponse<T>>): HttpRequestPromise<T> {
  const api = {
    json: <R = unknown>() => promise.then((r) => r.json<R>()),
    text: () => promise.then((r) => r.text()),
    bytes: () => promise.then((r) => r.bytes()),
    arrayBuffer: () => promise.then((r) => r.arrayBuffer()),
  };
  return Object.assign(promise, api) as HttpRequestPromise<T>;
}

function snapshotRequestOptions(opts: Readonly<RequestOptions>): Readonly<RequestOptions> {
  const hooks = opts.hooks;
  return Object.freeze({
    ...opts,
    headers: opts.headers,
    timeout: opts.timeout ? Object.freeze({ ...opts.timeout }) : undefined,
    retry: opts.retry ? Object.freeze({ ...opts.retry }) : undefined,
    redirect: opts.redirect ? Object.freeze({ ...opts.redirect }) : undefined,
    context: opts.context ? Object.freeze({ ...opts.context }) : undefined,
    hooks: hooks
      ? Object.freeze({
          init: Object.freeze([...(hooks.init ?? [])]),
          beforeRequest: Object.freeze([...(hooks.beforeRequest ?? [])]),
          beforeRedirect: Object.freeze([...(hooks.beforeRedirect ?? [])]),
          beforeRetry: Object.freeze([...(hooks.beforeRetry ?? [])]),
          afterResponse: Object.freeze([...(hooks.afterResponse ?? [])]),
          beforeError: Object.freeze([...(hooks.beforeError ?? [])]),
        })
      : undefined,
  }) as Readonly<RequestOptions>;
}

export interface HttpClient {
  readonly defaults: Readonly<RequestOptions>;

  request(options: RequestOptions): HttpRequestPromise<unknown>;
  get(url: string | URL, options?: RequestOptions): HttpRequestPromise<unknown>;
  head(url: string | URL, options?: RequestOptions): HttpRequestPromise<unknown>;
  options(url: string | URL, options?: RequestOptions): HttpRequestPromise<unknown>;
  post(url: string | URL, options?: RequestOptions): HttpRequestPromise<unknown>;
  put(url: string | URL, options?: RequestOptions): HttpRequestPromise<unknown>;
  patch(url: string | URL, options?: RequestOptions): HttpRequestPromise<unknown>;
  delete(url: string | URL, options?: RequestOptions): HttpRequestPromise<unknown>;

  extend(options: RequestOptions): HttpClient;

  /** Low-level request without throwing on non-2xx (still returns a typed {@link HttpResponse}). */
  raw(options: RequestOptions): HttpRequestPromise<unknown>;

  /** Streaming response body (`responseType: "stream"`). Requires adapter support. */
  stream(options: RequestOptions): HttpRequestPromise<unknown>;

  /** Optional ergonomic builder; not required for normal usage. */
  builder(): HttpClientBuilder;
}

export interface HttpClientBuilder {
  with(options: RequestOptions): HttpClientBuilder;
  request(): HttpRequestPromise<unknown>;
  get(url: string | URL): HttpRequestPromise<unknown>;
  post(url: string | URL): HttpRequestPromise<unknown>;
}

class HttpClientBuilderImpl implements HttpClientBuilder {
  private readonly client: HttpClient;
  private opts: RequestOptions = {};

  constructor(client: HttpClient, seed?: RequestOptions) {
    this.client = client;
    this.opts = seed ? { ...seed } : {};
  }

  with(options: RequestOptions): HttpClientBuilder {
    const next = mergeRequestOptions(this.opts, options);
    return new HttpClientBuilderImpl(this.client, next);
  }

  request(): HttpRequestPromise<unknown> {
    return this.client.request(this.opts);
  }

  get(url: string | URL): HttpRequestPromise<unknown> {
    return this.client.get(url, this.opts);
  }

  post(url: string | URL): HttpRequestPromise<unknown> {
    return this.client.post(url, this.opts);
  }
}

export class HttpClientImpl implements HttpClient {
  private readonly _defaults: RequestOptions;
  private readonly _defaultAdapter: HttpAdapter;

  constructor(defaults: Readonly<RequestOptions>, defaultAdapter: HttpAdapter = fetchAdapter) {
    this._defaults = mergeRequestOptions({}, defaults);
    this._defaultAdapter = defaultAdapter;
  }

  get defaults(): Readonly<RequestOptions> {
    return snapshotRequestOptions(this._defaults);
  }

  extend(options: RequestOptions): HttpClient {
    return new HttpClientImpl(mergeRequestOptions(this._defaults, options), this._defaultAdapter);
  }

  request(options: RequestOptions): HttpRequestPromise<unknown> {
    const plain = mergeRequestOptions(this._defaults, options);
    const normalized = normalizeRequestOptions(plain);
    const p = executeRequest({
      plain,
      normalized,
      defaultAdapter: this._defaultAdapter,
    });
    return augmentRequestPromise(p);
  }

  raw(options: RequestOptions): HttpRequestPromise<unknown> {
    return this.request({ ...options, throwHttpErrors: false });
  }

  stream(options: RequestOptions): HttpRequestPromise<unknown> {
    return this.request({ ...options, responseType: "stream" });
  }

  builder(): HttpClientBuilder {
    return new HttpClientBuilderImpl(this);
  }

  get(url: string | URL, options: RequestOptions = {}): HttpRequestPromise<unknown> {
    return this.request(mergeRequestOptions(options, { method: "GET", url }));
  }

  head(url: string | URL, options: RequestOptions = {}): HttpRequestPromise<unknown> {
    return this.request(mergeRequestOptions(options, { method: "HEAD", url }));
  }

  options(url: string | URL, options: RequestOptions = {}): HttpRequestPromise<unknown> {
    return this.request(mergeRequestOptions(options, { method: "OPTIONS", url }));
  }

  post(url: string | URL, options: RequestOptions = {}): HttpRequestPromise<unknown> {
    return this.request(mergeRequestOptions(options, { method: "POST", url }));
  }

  put(url: string | URL, options: RequestOptions = {}): HttpRequestPromise<unknown> {
    return this.request(mergeRequestOptions(options, { method: "PUT", url }));
  }

  patch(url: string | URL, options: RequestOptions = {}): HttpRequestPromise<unknown> {
    return this.request(mergeRequestOptions(options, { method: "PATCH", url }));
  }

  delete(url: string | URL, options: RequestOptions = {}): HttpRequestPromise<unknown> {
    return this.request(mergeRequestOptions(options, { method: "DELETE", url }));
  }
}
