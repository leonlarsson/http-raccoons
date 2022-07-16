import { Hono } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import statuses from "./lib/statuses";
import rootHTML from "./lib/html";

const app = new Hono({ strict: false });
const availableStatuses = Object.keys(statuses);

type Status = {
    code: number;
    message: string;
};

// Return root HTML
app.get("/", c => c.html(rootHTML));

// Return image
app.get("/:statusImage", async c => {
    const statusInput = c.req.param("statusImage");
    const query = c.req.query();
    if (!availableStatuses.includes(statusInput)) return c.text(`Status must be one of ${availableStatuses.join(", ")}`, 404);
    const status = statuses[statusInput];
    // Wait for x milliseconds before responding if a query is specified
    if (useSleepFunction(query)) await sleep(determineWaitTime(query));
    return respondWithImage(c, status, query);
});

// Return image, text, or json
app.get("/:type/:status", async c => {
    const { type, status: statusInput } = c.req.param();
    const query = c.req.query();
    if (!["image", "text", "json"].includes(type)) return c.text("Type must be one of: image, text, json.", 400);
    if (!availableStatuses.includes(statusInput)) return c.text(`Status must be one of ${availableStatuses.join(", ")}`, 404);
    const status = statuses[statusInput];
    // Wait for x milliseconds before responding if a query is specified
    if (useSleepFunction(query)) await sleep(determineWaitTime(query));
    switch (type) {
        case "image":
            return respondWithImage(c, status, query);
        case "text":
            return c.text(`${status.code} ${status.message}`, useRealHTTPResponseCode(query) ? determineRealHTTPResponseCode(status.code) : 200);
        case "json":
            return c.json(status, useRealHTTPResponseCode(query) ? determineRealHTTPResponseCode(status.code) : 200);
    }
});

// Redirect to root on unknown route
app.get("*", c => c.redirect("/", 301));

const respondWithImage = async (c: any, status: Status, query: Record<string, string>) => {
    // Get the Base64 data from KV
    const imageDataBase64 = await c.env.CODES.get(`HTTP_${status.code}`);
    // If no KV found, return
    if (!imageDataBase64) return c.text(`Could not find results for HTTP ${status.code} (${status.message}). This is not expected and will only show if Cloudflare fails or if I forgot an image.`, 404);

    const img = getImageBlobFromBase64(imageDataBase64);

    return new Response(img, {
        headers: { "Content-Type": "image/png" },
        status: useRealHTTPResponseCode(query) ? determineRealHTTPResponseCode(status.code) : 200
    });
}

// Turn base64 data into PNG blob
const getImageBlobFromBase64 = (imageDataBase64: string) => {
    const b64String = imageDataBase64.split(',')[1];
    const byteString = atob(b64String);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const intArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
        intArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([intArray], { type: "image/png" });
}

// Whether or not to attempt to return the requested HTTP code. Returns true if ?real or ?simulate are true
const useRealHTTPResponseCode = (query: Record<string, string>) => query.simulate === "1" || query.simulate === "true" || query.simulate === "yes" || query.real === "1" || query.real === "true" || query.real === "yes";

// Whether or not to use the sleep function. Returns true if ?wait or ?sleep are integers
const useSleepFunction = (query: Record<string, string>) => Number.isInteger(Number.parseInt(query.wait)) || Number.isInteger(Number.parseInt(query.sleep));

// Queries ?real=1 OR ?simulate=1: If the code is not a valid HTTP code, return with 404. This is to prevent /999 to return a CF error due to 999 not being a valid HTTP code
const determineRealHTTPResponseCode = (code: number): StatusCode => code >= 200 && code <= 599 ? code as StatusCode : 404;

// If wait query is more than 110 seconds (110,000 ms), set time to 110,000 ms
const determineWaitTime = (query: Record<string, string>) => Number.parseInt(query.wait) > 110_000 || Number.parseInt(query.sleep) > 110_000 ? 110_000 : Number.parseInt(query.wait || query.sleep);

// Basic sleep util
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export default app;