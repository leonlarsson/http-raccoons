import { Router } from 'itty-router';
import statuses from "./lib/statuses.js";
const router = Router();

// Create the root HTML. This populates the <ul> with each entry in statuses.js
const htmlList = [];
for (const status in statuses) {
  htmlList.push(`<li><strong>${statuses[status].code} ${statuses[status].message}</strong> - (<a href="/${statuses[status].code}">image</a>) (<a href="/text/${statuses[status].code}">text</a>) (<a href="/json/${statuses[status].code}">json</a>)</li>`);
}
const rootHTML = `<!DOCTYPE html>
<head>
  <title>TrasHTTPandas - Trash Panda HTTP Responses</title>
  <meta name="title" content="TrasHTTPandas">
  <meta name="description" content="Small API for HTTP Trash Pandas.">
  <meta name="theme-color" content="#bf2042">

  <meta property="og:type" content="website">
  <meta property="og:url" content="https://api.onlyraccoons.com/">
  <meta property="og:title" content="TrasHTTPandas">
  <meta property="og:description" content="Small API for HTTP Trash Pandas.">
  <meta property="og:image" content="https://i.imgur.com/99g7BJA.png">

  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://api.onlyraccoons.com/">
  <meta property="twitter:title" content="TrasHTTPandas">
  <meta property="twitter:description" content="Small API for HTTP Trash Pandas.">
  <meta property="twitter:image" content="https://i.imgur.com/99g7BJA.png">
</head>
<body>
    <style>
      body {
		    font-family: "Arial";
      }

      .code-bg {
        background-color: #282c34;
        color: #fff;
        padding: 2px 5px;
        border-radius: 5px;
      }

      .instructions {
        font-size: 20px;
      }

      hr {
        height: 7px;
        background-color: #bf2042;
      }

      li {
        margin: 10px 0;
      }
    </style>
    <h1>TrasHTTPandas - Trash Panda HTTP Responses</h1>
    <h3>Made by <a href="http://twitter.com/mozzyfx">Mozzy</a> (who sometimes dislikes frontend).</h3>
    <h3>I do not own any of the raccoon images. Full credits go to the respective owners.</h3>
    <hr>
    <p class="instructions">
      To return <code class="code-bg">image/png</code>, click one of the supported codes below, or use <code class="code-bg">https://api.onlyraccoons.com/[status_code](.png)</code>
      <br><br>
      To return <code class="code-bg">text/plain</code>, use <code class="code-bg">https://api.onlyraccoons.com/text/[status_code]</code> or <code class="code-bg">https://api.onlyraccoons.com/[status_code].txt</code>
      <br><br>
      To return <code class="code-bg">application/json</code>, use <code class="code-bg">https://api.onlyraccoons.com/json/[status_code]</code> or <code class="code-bg">https://api.onlyraccoons.com/[status_code].json</code>
    </p>
    <hr>
    <ul>
      ${htmlList.join("\n")}
    </ul>
  </body>
</html>`

// Handle response for root domain
router.get('/', () => {
  return new Response(rootHTML, { headers: { 'Content-Type': 'text/html' }, status: 200 });
});

// Create a response for each valid HTTP code in statuses.js
for (const statusCode in statuses) {

  const status = statuses[statusCode];

  // Handle "/[status_code]", "/[status_code].png", "/image/[status_code]", "/image[status_code].png"
  router.get(`/${status.code}`, HTTPHandlerImage);
  router.get(`/${status.code}.png`, HTTPHandlerImage);
  router.get(`/image/${status.code}`, HTTPHandlerImage);
  router.get(`/image/${status.code}.png`, HTTPHandlerImage);

  // Handle "/[status_code].txt", "/text/[status_code]", "/text/[status_code].txt"
  router.get(`/${status.code}.txt`, HTTPHandlerText);
  router.get(`/text/${status.code}`, HTTPHandlerText);
  router.get(`/text/${status.code}.txt`, HTTPHandlerText);

  // Handle "/[status_code].json", "/json/[status_code]", "/json/[status_code].json"
  router.get(`/${status.code}.json`, HTTPHandlerJSON);
  router.get(`/json/${status.code}`, HTTPHandlerJSON);
  router.get(`/json/${status.code}.json`, HTTPHandlerJSON);

  // Handler for image display
  async function HTTPHandlerImage() {
    // Get the Base64 data from KV
    const data = await CODES.get(`HTTP_${status.code}`);

    // If no KV found, return
    if (!data) return new Response(`Could not find results for HTTP ${status.code} (${status.message}). This is not expected and will only show if Cloudflare fails or if I forgot an image.`, {
      headers: { "Content-Type": "text/plain" },
      status: 404
    });

    // Build blob from Base64 and respond
    const img = getImageBlobFromBase64(data);
    return new Response(img, {
      headers: { "Content-Type": "image/png" },
      status: 200
    });
  }

  // Handler for text display
  function HTTPHandlerText() {
    return new Response(`${status.code} ${status.message}`, {
      headers: { "Content-Type": "text/plain" },
      status: 200
    });
  }

  // Handler for JSON display
  function HTTPHandlerJSON() {
    return new Response(JSON.stringify(status), {
      headers: { "Content-Type": "application/json" },
      status: 200
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

addEventListener("fetch", event => {
  event.respondWith(router.handle(event.request));
});