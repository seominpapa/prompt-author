import { mkdir, writeFile } from "node:fs/promises";

const { default: worker } = await import("../dist/server/index.js");
const response = await worker.fetch(
  new Request("http://localhost/", { headers: { accept: "text/html" } }),
  { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
  { waitUntil() {}, passThroughOnException() {} },
);

if (!response.ok) throw new Error(`Could not prerender the home page: ${response.status}`);

await mkdir("dist/client", { recursive: true });
await writeFile("dist/client/index.html", await response.text());
