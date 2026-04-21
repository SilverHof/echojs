import { executeRequest } from "./core/execute.js";
import { fetchAdapter } from "./adapters/fetch-adapter.js";
import type { HttpAdapter } from "./types/adapter.js";
import type { HttpMethod, RequestOptions } from "./types/public.js";
import type { HttpResponse } from "./types/response.js";
import { mergeRequestOptions } from "./options/merge.js";
import { normalizeRequestOptions } from "./options/normalize.js";
import type { HttpHooks } from "./types/hooks.js";

export type HttpRequestPromise<T = unknown> = Promise<HttpResponse<T>> & {
  json<R = unknown>(): Promise<R>;
  text(): Promise<string>;
  bytes(): Promise<Uint8Array>;
  arrayBuffer(): Promise<ArrayBuffer>;
  unwrapJson<R = unknown>(): Promise<R>;
};

function augmentRequestPromise<T>(promise: Promise<HttpResponse<T>>): HttpRequestPromise<T> {
  const api = {
    json: <R = unknown>() => promise.then((r) => r.json<R>()),
    text: () => promise.then((r) => r.text()),
    bytes: () => promise.then((r) => r.bytes()),
    arrayBuffer: () => promise.then((r) => r.arrayBuffer()),
    unwrapJson: <R = unknown>() => promise.then((r) => r.unwrapJson<R>()),
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
    tracing: opts.tracing ? Object.freeze({ ...opts.tracing }) : undefined,
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

  /** Alias for `extend()` emphasizing immutable composition. */
  withDefaults(options: RequestOptions): HttpClient;
  withHeader(name: string, value: string): HttpClient;
  withHeaders(headers: NonNullable<RequestOptions["headers"]>): HttpClient;
  withBaseUrl(baseUrl: NonNullable<RequestOptions["baseUrl"]>): HttpClient;
  withContext(context: NonNullable<RequestOptions["context"]>): HttpClient;
  withAuth(value: string, opts?: { scheme?: string; headerName?: string }): HttpClient;

  /** Hook facade (still uses hooks model under the hood). */
  onRequest(fn: NonNullable<HttpHooks["beforeRequest"]>[number]): HttpClient;
  onResponse(fn: NonNullable<HttpHooks["afterResponse"]>[number]): HttpClient;
  onError(fn: NonNullable<HttpHooks["beforeError"]>[number]): HttpClient;
  onRetry(fn: NonNullable<HttpHooks["beforeRetry"]>[number]): HttpClient;
  onRedirect(fn: NonNullable<HttpHooks["beforeRedirect"]>[number]): HttpClient;
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

  withDefaults(options: RequestOptions): HttpClient {
    return this.extend(options);
  }

  withHeader(name: string, value: string): HttpClient {
    return this.extend({ headers: { [name]: value } });
  }

  withHeaders(headers: NonNullable<RequestOptions["headers"]>): HttpClient {
    return this.extend({ headers });
  }

  withBaseUrl(baseUrl: NonNullable<RequestOptions["baseUrl"]>): HttpClient {
    return this.extend({ baseUrl });
  }

  withContext(context: NonNullable<RequestOptions["context"]>): HttpClient {
    return this.extend({ context });
  }

  withAuth(value: string, opts: { scheme?: string; headerName?: string } = {}): HttpClient {
    const headerName = (opts.headerName ?? "authorization").toLowerCase();
    const scheme = opts.scheme;
    const v = scheme ? `${scheme} ${value}` : value;
    return this.extend({ headers: { [headerName]: v } });
  }

  onRequest(fn: NonNullable<HttpHooks["beforeRequest"]>[number]): HttpClient {
    return this.extend({ hooks: { beforeRequest: [fn] } });
  }

  onResponse(fn: NonNullable<HttpHooks["afterResponse"]>[number]): HttpClient {
    return this.extend({ hooks: { afterResponse: [fn] } });
  }

  onError(fn: NonNullable<HttpHooks["beforeError"]>[number]): HttpClient {
    return this.extend({ hooks: { beforeError: [fn] } });
  }

  onRetry(fn: NonNullable<HttpHooks["beforeRetry"]>[number]): HttpClient {
    return this.extend({ hooks: { beforeRetry: [fn] } });
  }

  onRedirect(fn: NonNullable<HttpHooks["beforeRedirect"]>[number]): HttpClient {
    return this.extend({ hooks: { beforeRedirect: [fn] } });
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
