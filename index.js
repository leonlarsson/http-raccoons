import { Router } from 'itty-router';
const router = Router();
import statuses from "./lib/statuses.js";

addEventListener('fetch', event => {
  event.respondWith(router.handle(event.request));
});

// Root domain
router.get('/', () => {
  return new Response("To get an image, please use https://domain.com/code");
});

// Create a response for each valid HTTP code in statuses.js
for (const status in statuses) {
  router.get(`/${statuses[status].code}`, async () => {

    // Get the Base64 data from KV
    const data = await CODES.get(`HTTP_${statuses[status].code}`);

    // If no KV found, return
    if (!data) return new Response(`Could not find KV for HTTP ${statuses[status].code}`);

    // Build blob from Base64 and respond
    const img = getImageBlobFromBase64(data);
    return new Response(img, {
      headers: { 'content-type': 'image/png' },
      status: 200
    });
  });
}

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

function getImageBlobFromBase64(data) {
  const b64String = data.split(',')[1];
  const byteString = atob(b64String);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const intArray = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i);
  }
  return new Blob([intArray], { type: 'image/png' });
}
