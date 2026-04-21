/**
 * Future extension point for first-party plugins (cache, cookies, pagination, etc.).
 *
 * Keep plugins opt-in and adapter-aware to preserve capability boundaries.
 */
export interface HttpPlugin {
  readonly name: string;
  install(client: import("../client.js").HttpClient): import("../client.js").HttpClient;
}
