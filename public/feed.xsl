<?xml version="1.0" encoding="UTF-8"?>
<!--
  Makes /feed.xml readable when someone opens it in a browser: it explains what the feed is
  and how to follow it, then lists the latest pieces. Feed reader apps ignore this file.
-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes" doctype-system="about:legacy-compat" />
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>Follow <xsl:value-of select="/rss/channel/title" /> · RSS feed</title>
        <style>
          :root { --bg:#fbf6ef; --ink:#2b2d4a; --body:#44455f; --muted:#5a5872; --line:#e6ddd5; --card:#fffdf8; --hl:#eae1f5; --accent:#6c55a3; color-scheme: light dark; }
          @media (prefers-color-scheme: dark) { :root { --bg:#2c2845; --ink:#f6f1fb; --body:#e0daec; --muted:#bdb5d4; --line:#4a4466; --card:#383354; --hl:#4b4170; --accent:#d4c6f2; } }
          * { box-sizing: border-box; }
          body { margin: 0; background: var(--bg); color: var(--body); font: 17px/1.65 system-ui, -apple-system, "Segoe UI", sans-serif; }
          main { max-width: 720px; margin: 0 auto; padding: 48px 20px 64px; }
          h1, h2, .mono { font-family: "Courier Prime", "Courier New", monospace; color: var(--ink); font-weight: 400; }
          h1 { font-size: clamp(28px, 6vw, 40px); line-height: 1.15; margin: 6px 0 14px; }
          h2 { font-size: 22px; margin: 44px 0 8px; }
          .eyebrow { font-family: "Courier New", monospace; font-size: 13px; color: var(--muted); margin: 0; }
          a { color: var(--ink); text-underline-offset: 4px; }
          a:hover { color: var(--accent); }
          .box { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 20px 22px; margin: 22px 0; }
          .box ol { margin: 8px 0 0; padding-left: 22px; }
          .box li { margin: 6px 0; }
          code { font-family: "Courier New", monospace; background: var(--hl); color: var(--ink); padding: 2px 8px; border-radius: 4px; word-break: break-all; }
          .item { border-top: 1px solid var(--line); padding: 18px 0; }
          .item h3 { margin: 0 0 4px; font: 20px/1.3 "Courier Prime", "Courier New", monospace; }
          .meta { font: 13px "Courier New", monospace; color: var(--muted); margin: 0 0 6px; }
          .item p { margin: 0; }
          .back { display: inline-block; margin-top: 28px; }
        </style>
      </head>
      <body>
        <main>
          <p class="eyebrow">rss feed</p>
          <h1>Follow <xsl:value-of select="/rss/channel/title" /></h1>
          <p>This page is a <strong>feed</strong>: a list of the newest poems and stories that updates by itself. Add it to a feed reader app and every new piece appears there the moment it is published, with no account or email needed.</p>

          <div class="box">
            <strong class="mono">How to follow</strong>
            <ol>
              <li>Copy this page's address: <code><xsl:value-of select="/rss/channel/link" />/feed.xml</code></li>
              <li>Open a free feed reader, such as <a href="https://feedly.com" rel="noopener">Feedly</a> or <a href="https://www.inoreader.com" rel="noopener">Inoreader</a> (both work on phones and the web).</li>
              <li>Tap <em>Follow</em> or <em>Add feed</em> and paste the address. That's it.</li>
            </ol>
          </div>

          <p>Prefer email? <a href="https://substack.com/@vandanabasnet" rel="noopener">Subscribe on Substack</a> instead.</p>

          <h2>Latest pages</h2>
          <xsl:choose>
            <xsl:when test="/rss/channel/item">
              <xsl:for-each select="/rss/channel/item">
                <div class="item">
                  <h3><a href="{link}"><xsl:value-of select="title" /></a></h3>
                  <p class="meta"><xsl:value-of select="category" /> · <xsl:value-of select="substring(pubDate, 6, 11)" /></p>
                  <p><xsl:value-of select="description" /></p>
                </div>
              </xsl:for-each>
            </xsl:when>
            <xsl:otherwise>
              <p class="item">New pages will appear here soon.</p>
            </xsl:otherwise>
          </xsl:choose>

          <a class="back" href="{/rss/channel/link}">← Back to <xsl:value-of select="/rss/channel/title" /></a>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
