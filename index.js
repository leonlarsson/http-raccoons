import { Router } from "itty-router";
import statuses from "./lib/statuses.js";
import rootHTML from "./lib/html.js";
const router = Router();

// Handle response for root domain
router.get('/', () => {
  return new Response(rootHTML, { headers: { 'Content-Type': 'text/html' }, status: 200 });
});

// Create a response for each valid HTTP code in statuses.js
for (const statusCode in statuses) {

  const status = statuses[statusCode];

  // Handle "/[status_code]", "/[status_code].png", "/image/[status_code]", "/image[status_code].png"
  router.get(`/${status.code}`, req => HTTPHandlerImage(req));
  router.get(`/${status.code}.png`, req => HTTPHandlerImage(req));
  router.get(`/image/${status.code}`, req => HTTPHandlerImage(req));
  router.get(`/image/${status.code}.png`, req => HTTPHandlerImage(req));

  // Handle "/[status_code].txt", "/text/[status_code]", "/text/[status_code].txt"
  router.get(`/${status.code}.txt`, req => HTTPHandlerText(req));
  router.get(`/text/${status.code}`, req => HTTPHandlerText(req));
  router.get(`/text/${status.code}.txt`, req => HTTPHandlerText(req));

  // Handle "/[status_code].json", "/json/[status_code]", "/json/[status_code].json"
  router.get(`/${status.code}.json`, req => HTTPHandlerJSON(req));
  router.get(`/json/${status.code}`, req => HTTPHandlerJSON(req));
  router.get(`/json/${status.code}.json`, req => HTTPHandlerJSON(req));

  // Handler for image display
  async function HTTPHandlerImage(req) {

    // Get the queries
    const { query } = req;

    // Get the Base64 data from KV
    const data = await CODES.get(`HTTP_${status.code}`);

    // If no KV found, return
    if (!data) return new Response(`Could not find results for HTTP ${status.code} (${status.message}). This is not expected and will only show if Cloudflare fails or if I forgot an image.`, {
      headers: { "Content-Type": "text/plain" },
      status: 404
    });

    // Wait for x milliseconds before responding if a query is specified
    if (useSleepFunction(query)) await scheduler.wait(determineWaitTime(query));

    // Build blob from Base64 and respond
    const img = getImageBlobFromBase64(data);
    return new Response(img, {
      headers: { "Content-Type": "image/png" },
      status: useRealHTTPResponseCode(query) ? determineRealCodeResponse(status.code) : 200
    });
  }

  // Handler for text display
  async function HTTPHandlerText(req) {

    // Get the queries
    const { query } = req;

    // Wait for x milliseconds before responding if a query is specified
    if (useSleepFunction(query)) await scheduler.wait(determineWaitTime(query));

    return new Response(`${status.code} ${status.message}`, {
      headers: { "Content-Type": "text/plain" },
      status: useRealHTTPResponseCode(query) ? determineRealCodeResponse(status.code) : 200
    });
  }

  // Handler for JSON display
  async function HTTPHandlerJSON(req) {

    // Get the queries
    const { query } = req;

    // Wait for x milliseconds before responding if a query is specified
    if (useSleepFunction(query)) await scheduler.wait(determineWaitTime(query));

    return new Response(JSON.stringify(status), {
      headers: { "Content-Type": "application/json" },
      status: useRealHTTPResponseCode(query) ? determineRealCodeResponse(status.code) : 200
    });
  }
}


// Return a custom 999 (technically 404) image, but with a response of 200 (to work with embeds etc.)
router.all("*", async () => {
  const data = await CODES.get("HTTP_999");
  const img = getImageBlobFromBase64(data);
  return new Response(img, {
    headers: { "Content-Type": "image/png" },
    status: 200
  });
});


// Turn base64 data into PNG blob
function getImageBlobFromBase64(data) {
  const b64String = data.split(',')[1];
  const byteString = atob(b64String);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const intArray = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i);
  }
  return new Blob([intArray], { type: "image/png" });
}

// Whether or not to attempt to return the requested HTTP code. Returns true if ?real or ?simulate are true
function useRealHTTPResponseCode(query) {
  return query.simulate === "1" || query.simulate === "true" || query.simulate === "yes" || query.real === "1" || query.real === "true" || query.real === "yes" ? true : false;
}

// Whether or not to use the sleep function. Returns true if ?wait or ?sleep are integers
function useSleepFunction(query) {
  return Number.isInteger(Number.parseInt(query.wait)) || Number.isInteger(Number.parseInt(query.sleep)) ? true : false;
}

// Queries ?real=1 OR ?simulate=1: If the code is not a valid HTTP code, return with 404. This is to prevent /999 to return a CF error due to 999 not being a valid HTTP code
function determineRealCodeResponse(code) {
  if (code >= 200 && code <= 599) {
    return code;
  } else {
    return 404;
  }
}

// If wait query is more than 110 seconds (110,000 ms), set time to 110,000 ms
function determineWaitTime(query) {
  if (Number.parseInt(query.wait) > 110000 || Number.parseInt(query.sleep) > 110000) {
    return 110000;
  } else {
    return Number.parseInt(query.wait || query.sleep);
  }
}

addEventListener("fetch", event => {
  event.respondWith(router.handle(event.request));
});