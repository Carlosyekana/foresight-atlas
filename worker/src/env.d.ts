// `wrangler types` only knows bindings and vars. Secrets are set at deploy time
// with `wrangler secret put`, so their names are declared here.
interface Env {
  GEMINI_API_KEY: string;
}
