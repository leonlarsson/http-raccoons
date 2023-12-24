import statuses from "./statuses";

export const LandingPage = () => {
  return (
    <html>
      <head>
        <title>TrasHTTPandas - Raccoon HTTP Responses</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="title" content="TrasHTTPandas - Raccoon HTTP Responses" />
        <meta name="description" content="An API that returns HTTP raccoons." />
        <meta name="theme-color" content="#bf2042" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://httpraccoons.com/" />
        <meta
          property="og:title"
          content="TrasHTTPandas - Raccoon HTTP Responses"
        />
        <meta
          property="og:description"
          content="An API that returns HTTP raccoons."
        />
        <meta
          property="og:image"
          content="https://cdn.httpraccoons.com/404.png"
        />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://httpraccoons.com/" />
        <meta
          property="twitter:title"
          content="TrasHTTPandas - Raccoon HTTP Responses"
        />
        <meta
          property="twitter:description"
          content="An API that returns HTTP raccoons."
        />
        <meta
          property="twitter:image"
          content="https://cdn.httpraccoons.com/404.png"
        />

        <link rel="stylesheet" href="/style.css" />
        <link rel="shortcut icon" type="image/x-icon" href="/favicon.png" />
      </head>

      <body>
        <h1>TrasHTTPandas - Trash Panda HTTP Responses</h1>
        <h3>
          Made by <a href="https://twitter.com/mozzyfx">Mozzy</a>. Built using{" "}
          <a href="https://workers.cloudflare.com/">Cloudflare Workers</a>.{" "}
          <a href="https://github.com/leonlarsson/http-raccoons-worker">
            GitHub Repo
          </a>
          . I do not own any of the raccoon images. Full credits go to the
          respective owners.
        </h3>

        <hr />

        <div class="instructions">
          <p>
            To return <code>image/png</code>, use{" "}
            <code>
              https://httpraccoons.com/
              <span class="status-code">[status_code]</span>
            </code>{" "}
            (CDN:{" "}
            <code>
              https://cdn.httpraccoons.com/
              <span class="status-code">[status_code]</span>.png
            </code>
            )
          </p>

          <p>
            To return <code>text/plain</code>, use{" "}
            <code>
              https://httpraccoons.com/
              <span class="file-extension">text</span>/
              <span class="status-code">[status_code]</span>
            </code>
          </p>

          <p>
            To return <code>application/json</code>, use{" "}
            <code>
              https://httpraccoons.com/
              <span class="file-extension">json</span>/
              <span class="status-code">[status_code]</span>
            </code>
          </p>

          <p>
            Any{" "}
            <code>
              <span class="status-code">[status_code]</span>
            </code>{" "}
            can be replaced by{" "}
            <code>
              <span class="status-code">random</span>
            </code>{" "}
            to return a random status code like{" "}
            <a id="combinedLink" href="/random">
              <code>
                https://httpraccoons.com/
                <span class="status-code">random</span>
              </code>
            </a>
          </p>

          <p>
            To return the requested HTTP code (200-599) instead of 200 OK, add{" "}
            <code>
              <span class="query-real">?real=1</span>
            </code>{" "}
            or{" "}
            <code>
              <span class="query-real">?simulate=1</span>
            </code>{" "}
            like{" "}
            <a id="combinedLink" href="/500?real=1">
              <code>
                https://httpraccoons.com/<span class="status-code">500</span>
                <span class="query-real">?real=1</span>
              </code>
            </a>
          </p>

          <p>
            To set the response time manually, add{" "}
            <code>
              <span class="query-wait">?wait=x</span>
            </code>{" "}
            or{" "}
            <code>
              <span class="query-wait">?sleep=x</span>
            </code>{" "}
            where <code class="query-wait">x</code> is an integer of
            milliseconds (max 110000) like{" "}
            <a id="combinedLink" href="/500?wait=5000">
              <code>
                https://httpraccoons.com/<span class="status-code">500</span>
                <span class="query-wait">?wait=5000</span>
              </code>
            </a>
          </p>

          <p>
            Combined, it might look like{" "}
            <a id="combinedLink" href="/json/420?simulate=true&sleep=6000">
              <code>
                https://httpraccoons.com/
                <span class="file-extension">json</span>/
                <span class="status-code">420</span>
                <span class="query-real">?simulate=true</span>
                <span class="query-wait">&amp;sleep=6000</span>
              </code>
            </a>
          </p>
        </div>

        <hr />

        <code style={{ fontSize: 15 }}>
          <a id="combinedLink" href="/all">
            <span style={{ color: "#68cdfe" }}>JSON</span>.
            <span style={{ color: "#d0dc8b" }}>stringify(</span>
            <span style={{ color: "#32b4ff" }}>statuses</span>
            <span style={{ color: "#d0dc8b" }}>)</span>
          </a>
        </code>

        <details
          style={{
            margin: "20px 20px",
            width: "fit-content",
          }}
        >
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>List</summary>
          <StatusList />
        </details>

        <StatusImageGallery />
      </body>
    </html>
  );
};

const StatusList = () => {
  return (
    <ul>
      {Object.values(statuses).map(status => (
        <li>
          {status.code} {status.message} - (
          <a href={`/${status.code}`}>image</a>) (
          <a href={`/text/${status.code}`}>text</a>) (
          <a href={`/json/${status.code}`}>json</a>) (
          <a href={`https://cdn.httpraccoons.com/${status.code}.png`}>CDN</a>)
        </li>
      ))}
    </ul>
  );
};

const StatusImageGallery = () => {
  return (
    <div id="imageGallery">
      {Object.values(statuses).map(status => (
        <div
          id="imageGalleryElement"
          title={`${status.code} ${status.message}`}
        >
          <a href={`/${status.code}`}>
            <img
              src={`https://imagedelivery.net/KkBcKKaZGWg3MEyP4svOUw/${status.cfImagesId}/thumbnail`}
              width={224}
              height={180}
            />
          </a>

          <span>
            <a href={`/text/${status.code}`}>text</a> |{" "}
            <a href={`/json/${status.code}`}>json</a> |{" "}
            <a href={`https://cdn.httpraccoons.com/${status.code}.png`}>CDN</a>
          </span>
        </div>
      ))}
    </div>
  );
};
