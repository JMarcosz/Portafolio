import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = path.join(__dirname, '..', 'credentials_token.json');

async function getAccessToken() {
  const tokenData = JSON.parse(await readFile(TOKEN_PATH, 'utf-8'));
  
  if (tokenData.expiry_date && Date.now() > tokenData.expiry_date - 60000) {
    console.log('Refreshing OAuth access token...');
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: tokenData.client_id,
        client_secret: tokenData.client_secret,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    const refreshed = await refreshRes.json();
    if (refreshed.access_token) {
      tokenData.access_token = refreshed.access_token;
      tokenData.expiry_date = Date.now() + (refreshed.expires_in || 3600) * 1000;
      await writeFile(TOKEN_PATH, JSON.stringify(tokenData, null, 2));
      console.log('Access token refreshed successfully.');
    } else {
      console.error('Failed to refresh token:', refreshed);
    }
  }
  return tokenData.access_token;
}

async function listSites(token) {
  const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function submitSitemap(token, siteUrl, sitemapUrl) {
  console.log(`Submitting sitemap ${sitemapUrl} to ${siteUrl}...`);
  const encodedSite = encodeURIComponent(siteUrl);
  const encodedFeed = encodeURIComponent(sitemapUrl);
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodedFeed}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (res.status === 204 || res.status === 200) {
    console.log(`✓ Sitemap ${sitemapUrl} submitted successfully for ${siteUrl}`);
    return true;
  } else {
    const err = await res.text();
    console.error(`✗ Error submitting sitemap to ${siteUrl}: [${res.status}] ${err}`);
    return false;
  }
}

async function inspectUrl(token, siteUrl, inspectionUrl) {
  console.log(`\nInspecting ${inspectionUrl} (site: ${siteUrl})...`);
  const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      siteUrl,
      inspectionUrl,
      languageCode: 'es',
    }),
  });
  const data = await res.json();
  return data;
}

async function main() {
  const token = await getAccessToken();
  
  console.log('\n--- 1. PROPIEDADES EN GOOGLE SEARCH CONSOLE ---');
  const sites = await listSites(token);
  if (sites.siteEntry) {
    for (const site of sites.siteEntry) {
      console.log(`- ${site.siteUrl} (${site.permissionLevel})`);
    }
  } else {
    console.log('No sites found or error:', sites);
  }

  console.log('\n--- 2. ENVIANDO SITEMAPS ---');
  const siteUrls = (sites.siteEntry || []).map((s) => s.siteUrl);

  for (const siteUrl of siteUrls) {
    if (siteUrl.includes('jeanmarte.com')) {
      if (siteUrl.includes('zentra')) {
        await submitSitemap(token, siteUrl, 'https://zentra.jeanmarte.com/sitemap.xml');
      } else if (siteUrl.includes('santoral')) {
        await submitSitemap(token, siteUrl, 'https://santorallogistics.jeanmarte.com/sitemap.xml');
      } else {
        await submitSitemap(token, siteUrl, 'https://www.jeanmarte.com/sitemap-index.xml');
        await submitSitemap(token, siteUrl, 'https://www.jeanmarte.com/sitemap.xml');
      }
    }
  }

  console.log('\n--- 3. INSPECCIÓN DE ESTADO DE INDEXACIÓN ---');
  const domainProp = siteUrls.find(s => s === 'sc-domain:jeanmarte.com') || 'https://www.jeanmarte.com/';
  const inspectTargets = [
    { site: domainProp, url: 'https://www.jeanmarte.com/' },
    { site: domainProp, url: 'https://zentra.jeanmarte.com/' },
    { site: domainProp, url: 'https://santorallogistics.jeanmarte.com/' },
  ];

  for (const target of inspectTargets) {
    try {
      const inspection = await inspectUrl(token, target.site, target.url);
      if (inspection.inspectionResult) {
        const res = inspection.inspectionResult.indexStatusResult;
        console.log(`URL: ${target.url}`);
        console.log(`  Verdict: ${res.verdict}`);
        console.log(`  Coverage State: ${res.coverageState}`);
        console.log(`  Robots.txt State: ${res.robotsTxtState}`);
        console.log(`  Indexing State: ${res.indexingState}`);
        console.log(`  Last Crawl: ${res.lastCrawlTime || 'Aún no rastreado por Googlebot'}`);
        console.log(`  User Canonical: ${res.userCanonical || 'No detectado aún'}`);
        console.log(`  Google Canonical: ${res.googleCanonical || 'No asignado aún'}`);
      } else {
        console.log(`URL: ${target.url} -> ${JSON.stringify(inspection)}`);
      }
    } catch (e) {
      console.error(`Error inspecting ${target.url}:`, e);
    }
  }
}

main().catch(console.error);
