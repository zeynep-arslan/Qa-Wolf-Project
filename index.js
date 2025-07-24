const { chromium } = require("playwright");

async function checkArticlesSorted() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://news.ycombinator.com/newest");

  let articles = [];
  let timestamps = [];

  while (articles.length < 100) {
    
    const pageArticles = await page.$$eval("tr.athing", (rows) =>
      rows.map((row) => {
        const id = row.getAttribute("id");
        const title = row.querySelector("a.storylink")?.innerText || "";
        return { id, title };
      })
    );

    const pageTimestamps = await page.$$eval("tr.athing + tr .age", (nodes) =>
      nodes.map((node) => node.innerText)
    );

    
    for (let i = 0; i < pageArticles.length; i++) {
      const a = pageArticles[i];
      if (!articles.find((x) => x.id === a.id) && articles.length < 100) {
        articles.push(a);
        timestamps.push(pageTimestamps[i]);
      }
    }

    if (articles.length >= 100) break;

    
    const moreLink = await page.$("a.morelink");
    if (!moreLink) break;

    await Promise.all([page.waitForNavigation(), moreLink.click()]);
  }

  const minutes = timestamps.map((time) => {
    if (time.includes("minute")) return parseInt(time);
    if (time.includes("hour")) return parseInt(time) * 60;
    if (time.includes("day")) return parseInt(time) * 1440;
    return 99999;
  });

  
  const isSorted = minutes.every((val, i, arr) => i === 0 || arr[i - 1] <= val);

  if (articles.length === 100 && isSorted) {
    console.log("✅ PASS: 100 article is newest → oldest.");
  } else {
    console.log("❌ FAIL: Articles are not sorted.");
    console.log("Articles length:", articles.length);
    console.log("Time:", minutes.slice(0, 10).join(", "));
  }

  await browser.close();
}

checkArticlesSorted();

