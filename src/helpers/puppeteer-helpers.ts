import puppeteer from 'puppeteer-extra';
import { performance } from 'perf_hooks';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const stealthPlugin = require('puppeteer-extra-plugin-stealth');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const adblockPlugin = require('puppeteer-extra-plugin-adblocker');

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36';

async function autoScroll(page, maxHeight = 10000) {
  return await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let attempts = 0;
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        attempts += 1;
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (
          totalHeight >= scrollHeight ||
          totalHeight >= maxHeight ||
          attempts > maxHeight / distance
        ) {
          clearInterval(timer);
          resolve({ attempts, totalHeight });
        }
      }, 100);
    });
  });
}

export async function getBrowser(headless: boolean) {
  try {
    puppeteer.use(stealthPlugin());
    // puppeteer.use(adblockPlugin({ blockTrackers: true }));

    const browser = await puppeteer.launch({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless,
      devtools: false,
      ignoreHTTPSErrors: true,
      slowMo: 0,
      // executablePath: '/usr/bin/chromium-browser',
    });
    process.on('unhandledRejection', (reason, p) => {
      // console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
      // browser.close();
    });
    return browser;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function setPage(browser) {
  try {
    // const userAgent = new UserAgent();
    // const UA = userAgent.toString() || USER_AGENT;

    const page = await browser.newPage();
    await page.setBypassCSP(true);
    await page.setViewport({
      width: 1920 + Math.floor(Math.random() * 100),
      height: 3000 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: false,
      isMobile: false,
    });
    await page.setUserAgent(USER_AGENT);
    await page.setJavaScriptEnabled(true);
    await page.setDefaultNavigationTimeout(0);

    await page.setRequestInterception(true);
    //TODO: test
    page.on('request', (req) => {
      if (
        req.resourceType() == 'stylesheet' ||
        req.resourceType() == 'font' ||
        req.resourceType() == 'image'
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    return page;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function getCategories(url: string): Promise<
  Array<{
    parentCategory: string | null;
    url: string;
    title: string;
  }>
> {
  try {
    const browser = await getBrowser(true);
    const page = await setPage(browser);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 0 });

    await page.click('[data-widget="catalogMenu"] button._1-6r');

    const parentUrls = await page.evaluate(() =>
      [...document.querySelectorAll('[data-widget="catalogMenu"] .c6c a')].map(
        (node: HTMLLinkElement) => {
          const { innerHTML, href } = node;
          const spanNode = document.createElement('div');
          spanNode.innerHTML = innerHTML;

          const title = spanNode.querySelector('.c7c3').innerHTML;
          return {
            title,
            node,
            href: href,
          };
        },
      ),
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const parentNodes: HTMLLinkElement[] = await page.$$(
      '[data-widget="catalogMenu"] .c6c a',
    );

    const categories = [];

    for (const node of parentNodes) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await node.hover();
      const _categories = await page.evaluate(() => {
        return [...document.querySelectorAll('.c6n7.c6n6')].reduce(
          (result, childNode) => {
            const parentNode: HTMLLinkElement = document.querySelector(
              '.c6x5 .a0k9.c7c0.c7c8',
            );
            const parentCategory = {
              parentCategory: null,
              title: parentNode.querySelector('.c7c3').innerHTML,
              url: parentNode.href,
            };

            const childNodes: HTMLLinkElement[] = document.querySelectorAll(
              '.c6x5 .c6x7 .a0k9.c7c0.c7c9',
            ) as any;
            const childCategories = [...childNodes].map((childNode) => {
              return {
                parentCategory: parentCategory.url,
                title: childNode.querySelector('.c7c3').innerHTML,
                url: childNode.href,
              };
            });

            result.push(parentCategory, ...childCategories);
            return result;
          },
          [],
        );
      });

      categories.push(
        ..._categories.map((cat) => {
          if (!cat.parentCategory) cat.parentCategory = node.href;
          return cat;
        }),
      );
    }

    await page.close();
    await browser.close();

    return [
      ...categories,
      ...parentUrls.map(({ href, title }) => ({
        parentCategory: null,
        url: href,
        title,
      })),
    ];
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function getProductUrls(url: string, headless = true) {
  try {
    const t0 = performance.now();
    const browser = await getBrowser(headless);
    const page = await setPage(browser);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 0 });

    const urls = await page.evaluate(() => {
      const links = [...document.querySelectorAll('.a0c6 a.b3u9')].map(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ({ href }) => href,
      );

      return links;
    });

    if (headless) {
      await page.close();
      await browser.close();
    }

    const t1 = performance.now();
    return urls;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function getProduct(url: string, headless = true) {
  const t0 = performance.now();
  const browser = await getBrowser(headless);
  const page = await setPage(browser);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 0 });

  await autoScroll(page);

  let price = '';
  try {
    await page.waitForSelector('.c2h5');
    price = getPrice(
      stripHTMLTags(await page.$eval('.c2h5', ({ innerHTML }) => innerHTML)),
    );
  } catch (err) {
    console.log(`Price for product ${url} wasn't found`);
  }

  let previousPrice = '';
  try {
    await page.waitForSelector('.c2h8');
    previousPrice = getPrice(
      stripHTMLTags(await page.$eval('.c2h8', ({ innerHTML }) => innerHTML)),
    );
  } catch (err) {
    console.log(`Previous Price for product ${url} wasn't found`);
  }

  let title = '';
  try {
    await page.waitForSelector('.b3a8');
    title = stripHTMLTags(
      await page.$eval('.b3a8', ({ innerHTML }) => innerHTML),
    );
  } catch (err) {
    console.log(`Title for product ${url} wasn't found`);
  }

  let code = '';
  try {
    await page.waitForSelector('.b2d7.b2d9');
    code = getCode(
      stripHTMLTags(
        await page.$eval('.b2d7.b2d9', ({ innerHTML }) => innerHTML),
      ),
    );
  } catch (err) {
    console.log(`Code for product ${url} wasn't found`);
  }

  let description = '';
  try {
    await page.waitForSelector('.b0v2');
    description = stripHTMLTags(
      await page.$eval('.b0v2', ({ innerHTML }) => innerHTML),
    );
  } catch (err) {
    console.log(`Description for product ${url} wasn't found`);
  }

  let images = '';
  try {
    await page.waitForSelector('.e0v4.e0v5 img._3Ugp');
    images = await page.$$eval('.e0v4.e0v5 img._3Ugp', (nodes) =>
      nodes.map(({ srcset }) => srcset),
    );
  } catch (err) {
    console.log(`Images for product ${url} wasn't found`);
  }

  let inStock = true;
  try {
    await page.waitForSelector('.d9w7 .b0r4');
    inStock = false;
  } catch (err) {
    console.log(`Product ${url} found in stock`);
  }

  const data = {
    price,
    previousPrice,
    title,
    code,
    images,
    description,
    inStock,
  };

  const sectionNodes = await page.$$('[data-widget="webCharacteristics"] .da3');
  const sections = [];
  try {
    for (const sectionNode of [...sectionNodes]) {
      const sectionTitle = await sectionNode.$$eval('.da5', (nodes) =>
        nodes.map(({ innerHTML }) => innerHTML),
      );
      const propertyNodes = await sectionNode.$$('.db8');
      const properties = [];
      for (const propertyNode of [...propertyNodes]) {
        const propertyTitle = await propertyNode.$$eval('.db4', (nodes) =>
          nodes.map(({ innerHTML }) => innerHTML),
        );
        const propertyValue = await propertyNode.$$eval('.db5', (nodes) =>
          nodes.map(({ innerHTML }) => innerHTML),
        );
        properties.push({
          title: stripHTMLTags(propertyTitle[0]) || null,
          value: stripHTMLTags(propertyValue[0]),
        });
      }
      sections.push({
        title: stripHTMLTags(sectionTitle[0]) || null,
        values: properties,
      });
    }
  } catch (err) {
    console.log(err);
    throw err;
  }

  if (headless) {
    await page.close();
    await browser.close();
  }

  const t1 = performance.now();
  return { ...data, properties: sections, url };
}

export function getCode(code: string): string {
  if (typeof code !== 'string') {
    return null;
  }
  return code.match(/:\s*(\d+)/)[1];
}

export function getInnerHTML(node): string {
  if (!node.innerHTML) {
    return null;
  }
  return node.innerHTML;
}

export function getSrcset(node): string {
  if (!node.srcset) {
    return null;
  }
  return node.srcset;
}

export function stripHTMLTags(html: string): string {
  if (typeof html !== 'string') {
    return null;
  }
  return html.replace(/<\/?[^>]+(>|$)/g, ' ').replace(/\s+/g, ' ');
}
export function getPrice(price: string): string {
  if (typeof price !== 'string') {
    return null;
  }
  return price.replace(/\D+/g, '');
}
