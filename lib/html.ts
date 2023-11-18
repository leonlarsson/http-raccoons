import statuses from "./statuses.js";

// Create the root HTML. This populates the <ul> with each entry in statuses.js
const htmlList = Object.values(statuses)
  .map(
    status =>
      `<li><strong>${status.code} ${status.message}</strong> - (<a href="/${status.code}">png</a>) (<a href="/jpeg/${status.code}">jpeg</a>) (<a href="/webp/${status.code}">webp</a>) (<a href="/text/${status.code}">text</a>) (<a href="/json/${status.code}">json</a>) (<a href="https://cdn.httpraccoons.com/${status.code}.png">CDN</a>)</li>`
  )
  .join("\n");

export default `<!DOCTYPE html>
<head>
  <title>TrasHTTPandas - Trash Panda HTTP Responses</title>
  <meta name="title" content="TrasHTTPandas">
  <meta name="description" content="Small API for HTTP Trash Pandas.">
  <meta name="theme-color" content="#bf2042">

  <meta property="og:type" content="website">
  <meta property="og:url" content="https://httpraccoons.com/">
  <meta property="og:title" content="TrasHTTPandas">
  <meta property="og:description" content="Small API for HTTP Trash Pandas.">
  <meta property="og:image" content="https://i.imgur.com/99g7BJA.png">

  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://httpraccoons.com/">
  <meta property="twitter:title" content="TrasHTTPandas">
  <meta property="twitter:description" content="Small API for HTTP Trash Pandas.">
  <meta property="twitter:image" content="https://i.imgur.com/99g7BJA.png">

  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <style>
      body {
		    font-family: "Arial";
      }

      hr {
        height: 7px;
        background-color: #bf2042;
      }
      
      li {
        margin: 10px 0;
      }
      
      code {
        background-color: #282c34;
        color: #fff;
        padding: 2px 5px;
        border-radius: 5px;
      }

      .instructions {
        font-size: 20px;
      }

      #combinedLink {
        text-decoration: none;
        color: inherit;
      }

      .status-code {
        color: #ff5b5b;
      }

      .file-extension {
        color: lightblue;
      }

      .query-real {
        color: yellow;
      }

      .query-wait {
        color: #49b3ff;
      }
    </style>
    <h1>TrasHTTPandas - Trash Panda HTTP Responses</h1>
    <h3>Made by <a href="https://twitter.com/mozzyfx">Mozzy</a>. Built using <a href="https://workers.cloudflare.com/">Cloudflare Workers</a>. <a href="https://github.com/leonlarsson/http-raccoons-worker">GitHub Repo</a>.</h3>
    <h3>I do not own any of the raccoon images. Full credits go to the respective owners.</h3>
    <hr>
    <p class="instructions">
      To return <code>image/png</code>, use <code>https://httpraccoons.com/<span class="file-extension">png</span>/<span class="status-code">[status_code]</span></code> or just <code>https://httpraccoons.com/<span class="status-code">[status_code]</span></code> (CDN: <code>https://cdn.httpraccoons.com/<span class="status-code">[status_code]</span>.png</code>)
      <br><br>
      To return <code>image/jpeg</code>, use <code>https://httpraccoons.com/<span class="file-extension">jpeg</span>/<span class="status-code">[status_code]</span></code>
      <br><br>
      To return <code>image/webp</code>, use <code>https://httpraccoons.com/<span class="file-extension">webp</span>/<span class="status-code">[status_code]</span></code>
      <br><br>
      To return <code>text/plain</code>, use <code>https://httpraccoons.com/<span class="file-extension">text</span>/<span class="status-code">[status_code]</span></code>
      <br><br>
      To return <code>application/json</code>, use <code>https://httpraccoons.com/<span class="file-extension">json</span>/<span class="status-code">[status_code]</span></code>
      <br><br>
      Any <code><span class="status-code">[status_code]</span></code> can be replaced by <code><span class="status-code">random</span></code> to return a random status code like <a id="combinedLink" href="/random"><code>https://httpraccoons.com/<span class="status-code">random</span></code></a>
      <br><br>
      To return the requested HTTP code (200-599) instead of 200 OK, add <code><span class="query-real">?real=1</span></code> or <code><span class="query-real">?simulate=1</span></code> like <a id="combinedLink" href="/500?real=1"><code>https://httpraccoons.com/<span class="status-code">500</span><span class="query-real">?real=1</span></code></a>
      <br><br>
      To set the response time manually, add <code><span class="query-wait">?wait=x</span></code> or <code><span class="query-wait">?sleep=x</span></code> where <code class="query-wait">x</code> is an integer of milliseconds (max 110000) like <a id="combinedLink" href="/500?wait=5000"><code>https://httpraccoons.com/<span class="status-code">500</span><span class="query-wait">?wait=5000</code></code></a>
      <br><br>
      Combined, it might look like <a id="combinedLink" href="/json/420?simulate=true&sleep=6000"><code>https://httpraccoons.com/<span class="file-extension">json</span>/<span class="status-code">420</span><span class="query-real">?simulate=true</span><span class="query-wait">&sleep=6000</span></code></a>
    </p>
    <hr>
    <code style="font-size: 15px;"><a id="combinedLink" href="/all"><span style="color:#68cdfe">JSON</span>.<span style="color:#d0dc8b">stringify(</span><span style="color:#32b4ff">statuses</span><span style="color:#d0dc8b">)</span></a></code>
    <ul>
      ${htmlList}
    </ul>
  </body>
</html>`;
