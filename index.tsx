import { Context, Hono } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import statuses from "./lib/statuses";
import { LandingPage } from "./lib/html";
//@ts-ignore pesky typescript
import styles from "./assets/style.css";
//@ts-ignore pesky typescript
import favicon from "./assets/favicon.png";

const app = new Hono<{ Bindings: Bindings }>();
const availableStatuses = Object.keys(statuses);

type Bindings = {
  CODES_KV: KVNamespace;
};

type Status = {
  code: number;
  message: string;
};

// Seconds each kind of response may be reused
const CACHE_IMAGE = 604_800;
const CACHE_DATA = 3_600;
const CACHE_ASSET = 86_400;
const KV_CACHE_TTL = 604_800;

const assetHeaders = { "Cache-Control": `public, max-age=${CACHE_ASSET}` };
const dataHeaders = { "Cache-Control": `public, max-age=${CACHE_DATA}` };

// random picks a new status every time and ?wait/?sleep exist to delay the
// response, so neither may be served from a cache
const cacheHeader = (
  isRandom: boolean,
  query: Record<string, string>,
  maxAge: number
) =>
  isRandom || useSleepFunction(query)
    ? "no-store"
    : `public, max-age=${maxAge}`;

const formatsFor = (code: number) => ({
  main: `https://httpraccoons.com/${code}`,
  image: `https://httpraccoons.com/image/${code}`,
  text: `https://httpraccoons.com/text/${code}`,
  json: `https://httpraccoons.com/json/${code}`,
  cdn: `https://cdn.httpraccoons.com/${code}.png`,
});

// Null when the input is not a status we serve
const resolveStatus = (statusInput: string) => {
  if (statusInput === "random")
    return { status: getRandomStatus(), isRandom: true };
  if (!availableStatuses.includes(statusInput)) return null;
  return { status: statuses[statusInput] as Status, isRandom: false };
};

const invalidStatusText = (statusInput: string) =>
  `Status '${statusInput}' is not valid. Status must be one of ${availableStatuses.join(
    ", "
  )}, random`;

const responseStatus = (code: number, query: Record<string, string>) =>
  useRealHTTPResponseCode(query) ? determineRealHTTPResponseCode(code) : 200;

// Serve static assets
app.get("/style.css", c => c.text(styles, 200, assetHeaders));
app.get("/favicon.png", c => c.text(favicon, 200, assetHeaders));

// Return root HTML
app.get("/", c => c.html(<LandingPage />, 200, dataHeaders));

// Return an array of all the statuses
app.get("/all", c => {
  const output = availableStatuses.map(key => {
    const { code, message } = statuses[key] as Status;
    return { code, message, formats: formatsFor(code) };
  });
  return c.json(output, 200, dataHeaders);
});

// Return png
app.get("/:statusImage", async c => {
  const statusInput = c.req.param("statusImage");
  const query = c.req.query();

  const resolved = resolveStatus(statusInput);
  if (!resolved) return c.text(invalidStatusText(statusInput), 404);

  // Wait for x milliseconds before responding if a query is specified
  if (useSleepFunction(query)) await sleep(determineWaitTime(query));

  return respondWithImage(c, resolved.status, query, resolved.isRandom);
});

// Return image, text, or json
app.get("/:type/:status", async c => {
  const { type, status: statusInput } = c.req.param();
  const query = c.req.query();

  if (!["png", "image", "text", "json"].includes(type))
    return c.text(
      `Type '${type}' is not valid. Type must be one of: image, text, json.`,
      400
    );

  const resolved = resolveStatus(statusInput);
  if (!resolved) return c.text(invalidStatusText(statusInput), 404);

  const { status, isRandom } = resolved;

  // Wait for x milliseconds before responding if a query is specified
  if (useSleepFunction(query)) await sleep(determineWaitTime(query));

  const headers = { "Cache-Control": cacheHeader(isRandom, query, CACHE_DATA) };

  switch (type) {
    case "png":
    case "image":
      return respondWithImage(c, status, query, isRandom);
    case "text":
      return c.text(
        `${status.code} ${status.message}`,
        responseStatus(status.code, query),
        headers
      );
    case "json":
      return c.json(
        {
          code: status.code,
          message: status.message,
          formats: formatsFor(status.code),
        },
        responseStatus(status.code, query),
        headers
      );
  }
});

// 404
app.get("*", async c => {
  const imageDataBase64 = await c.env.CODES_KV.get("HTTP_404", {
    cacheTtl: KV_CACHE_TTL,
  });
  if (!imageDataBase64) return c.text("404 Not Found", 404);

  return new Response(getImageBlobFromBase64(imageDataBase64), {
    headers: { "Content-Type": "image/png", ...dataHeaders },
    status: 404,
  });
});

const respondWithImage = async (
  c: Context,
  status: Status,
  query: Record<string, string>,
  isRandom: boolean
) => {
  // Get the Base64 data from KV, and cache for 1 week
  const imageDataBase64 = await (c.env.CODES_KV as KVNamespace).get(
    `HTTP_${status.code}`,
    { cacheTtl: KV_CACHE_TTL }
  );
  // If no KV found, return
  if (!imageDataBase64)
    return c.text(
      `Could not find KV results for HTTP ${status.code} (${status.message}). This is not expected and will only show if Cloudflare fails or if I forgot an image.`,
      404
    );

  return new Response(getImageBlobFromBase64(imageDataBase64), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": cacheHeader(isRandom, query, CACHE_IMAGE),
    },
    status: responseStatus(status.code, query),
  });
};

// Turn base64 data into image blob
const getImageBlobFromBase64 = (imageDataBase64: string) => {
  const b64String = imageDataBase64.split(",")[1];
  const byteString = atob(b64String);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const intArray = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i);
  }
  return new Blob([intArray], { type: "image/png" });
};

// Whether or not to attempt to return the requested HTTP code. Returns true if ?real or ?simulate are true
const useRealHTTPResponseCode = (query: Record<string, string>) =>
  ["1", "true", "yes"].includes(query.simulate ?? query.real);

// Whether or not to use the sleep function. Returns true if ?wait or ?sleep are integers
const useSleepFunction = (query: Record<string, string>) =>
  Number.isInteger(Number.parseInt(query.wait ?? query.sleep));

// Queries ?real=1 OR ?simulate=1: If the code is not a valid HTTP code, return with 404. This is to prevent /999 to return a CF error due to 999 not being a valid HTTP code
const determineRealHTTPResponseCode = (code: number): StatusCode =>
  code >= 200 && code <= 599 ? (code as StatusCode) : 404;

// If wait query is more than 110 seconds (110,000 ms), set time to 110,000 ms
const determineWaitTime = (query: Record<string, string>) =>
  Number.parseInt(query.wait ?? query.sleep) > 110_000
    ? 110_000
    : Number.parseInt(query.wait || query.sleep);

// Basic sleep util
const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

// Get random status
const getRandomStatus = (): Status => {
  const keys = Object.keys(statuses).filter(status => status !== "999");
  return statuses[keys[Math.floor(Math.random() * keys.length)]];
};

export default app;
