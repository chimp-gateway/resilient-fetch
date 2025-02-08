import type { ResilientFetchOptions } from "../interfaces/resilient-fetch.interface";

export interface RouteConfig {
  path: string;
  strip_prefix?: boolean;
}

export interface BackendConfig {
  name: string;
  url: string;
  routes: RouteConfig[];
  policies?: ResilientFetchOptions;
}

export interface ProxyConfig {
  port: number;
  backends: BackendConfig[];
}
