import { Context, Hono } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import statuses from "./lib/statuses";
import rootHTML from "./lib/html";

const app = new Hono<{ Bindings: Bindings }>();
const availableStatuses = Object.keys(statuses);

type Bindings = {
  CODES_KV: KVNamespace;
};

type Status = {
  code: number;
  message: string;
};

type ReturnType = "png" | "jpeg" | "webp" | "text" | "json";

// Return root HTML
app.get("/", c => c.html(rootHTML));

// Return an array of all the statuses
app.get("/all", c => {
  const output = availableStatuses.map(status => {
    const statusObject: Status = statuses[status];
    return {
      ...statusObject,
      formats: {
        main: `https://httpraccoons.com/${statusObject.code}`,
        png: `https://httpraccoons.com/png/${statusObject.code}`,
        jpeg: `https://httpraccoons.com/jpeg/${statusObject.code}`,
        webp: `https://httpraccoons.com/webp/${statusObject.code}`,
        text: `https://httpraccoons.com/text/${statusObject.code}`,
        json: `https://httpraccoons.com/json/${statusObject.code}`,
        cdn: `https://cdn.httpraccoons.com/${statusObject.code}.png`
      }
    };
  });
  return c.json(output);
});

// Return random
app.get("/random", async c => {
  const query = c.req.query();

  var keys = Object.keys(statuses);
  const status = statuses[keys[ keys.length * Math.random() << 0]];

  // Wait for x milliseconds before responding if a query is specified
  if (useSleepFunction(query)) await sleep(determineWaitTime(query));

  return respondWithImage(c, status, query, "png");
});

// Return png
app.get("/:statusImage", async c => {
  const statusInput = c.req.param("statusImage");
  const query = c.req.query();

  if (!availableStatuses.includes(statusInput)) return c.text(`Status must be one of ${availableStatuses.join(", ")}`, 404);
  const status = statuses[statusInput];

  // Wait for x milliseconds before responding if a query is specified
  if (useSleepFunction(query)) await sleep(determineWaitTime(query));

  return respondWithImage(c, status, query, "png");
});

// Return png, jpeg, webp, text, or json
app.get("/:type/:status", async c => {
  const { type, status: statusInput } = c.req.param();
  const query = c.req.query();

  if (!["png", "jpeg", "webp", "text", "json"].includes(type)) return c.text("Type must be one of: png, jpeg, webp, text, json.", 400);
  if (!availableStatuses.includes(statusInput)) return c.text(`Status must be one of ${availableStatuses.join(", ")}`, 404);
  const status = statuses[statusInput];

  // Wait for x milliseconds before responding if a query is specified
  if (useSleepFunction(query)) await sleep(determineWaitTime(query));

  switch (type) {
    case "png":
    case "jpeg":
    case "webp":
      return respondWithImage(c, status, query, type);
    case "text":
      return c.text(`${status.code} ${status.message}`, useRealHTTPResponseCode(query) ? determineRealHTTPResponseCode(status.code) : 200);
    case "json":
      return c.json(
        {
          ...status,
          formats: {
            main: `https://httpraccoons.com/${status.code}`,
            png: `https://httpraccoons.com/png/${status.code}`,
            jpeg: `https://httpraccoons.com/jpeg/${status.code}`,
            webp: `https://httpraccoons.com/webp/${status.code}`,
            text: `https://httpraccoons.com/text/${status.code}`,
            json: `https://httpraccoons.com/json/${status.code}`,
            cdn: `https://cdn.httpraccoons.com/${status.code}.png`
          }
        },
        useRealHTTPResponseCode(query) ? determineRealHTTPResponseCode(status.code) : 200
      );
  }
});

// Redirect to root on unknown route
app.get("*", c => c.text("Weird route? Trailing slash? Please go to httpraccoons.com", 404));

const respondWithImage = async (c: Context, status: Status, query: Record<string, string>, type: ReturnType) => {
  // Get the Base64 data from KV, and cache for 1 week
  const imageDataBase64 = await (c.env.CODES_KV as KVNamespace).get(`HTTP_${status.code}`, { cacheTtl: 604_800 });
  // If no KV found, return
  if (!imageDataBase64) return c.text(`Could not find KV results for HTTP ${status.code} (${status.message}). This is not expected and will only show if Cloudflare fails or if I forgot an image.`, 404);

  const img = getImageBlobFromBase64(imageDataBase64, type);

  return new Response(img, {
    headers: { "Content-Type": `image/${type}` },
    status: useRealHTTPResponseCode(query) ? determineRealHTTPResponseCode(status.code) : 200
  });
};

// Turn base64 data into image blob
const getImageBlobFromBase64 = (imageDataBase64: string, type: ReturnType) => {
  const b64String = imageDataBase64.split(",")[1];
  const byteString = atob(b64String);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const intArray = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i);
  }
  return new Blob([intArray], { type: `image/${type}` });
};

// Whether or not to attempt to return the requested HTTP code. Returns true if ?real or ?simulate are true
const useRealHTTPResponseCode = (query: Record<string, string>) => query.simulate === "1" || query.simulate === "true" || query.simulate === "yes" || query.real === "1" || query.real === "true" || query.real === "yes";

// Whether or not to use the sleep function. Returns true if ?wait or ?sleep are integers
const useSleepFunction = (query: Record<string, string>) => Number.isInteger(Number.parseInt(query.wait)) || Number.isInteger(Number.parseInt(query.sleep));

// Queries ?real=1 OR ?simulate=1: If the code is not a valid HTTP code, return with 404. This is to prevent /999 to return a CF error due to 999 not being a valid HTTP code
const determineRealHTTPResponseCode = (code: number): StatusCode => (code >= 200 && code <= 599 ? (code as StatusCode) : 404);

// If wait query is more than 110 seconds (110,000 ms), set time to 110,000 ms
const determineWaitTime = (query: Record<string, string>) => (Number.parseInt(query.wait) > 110_000 || Number.parseInt(query.sleep) > 110_000 ? 110_000 : Number.parseInt(query.wait || query.sleep));

// Basic sleep util
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export default app;
