#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs-extra');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (K HTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'
    );

    await page.setViewport({
      width: 800,
      height: 450,
      deviceScaleFactor: 1.5,
    });

    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    const map = await page.$('.hurricane__map');

    const {name, adv} = await page.$eval('.hurricane__map', e => ({name: e.dataset.name, adv: e.dataset.advnum}))

    const imagePath = path.join(__dirname, 'images', `${name}-${adv}.png`);
    const latestPath = path.join(__dirname, 'images', `${name}_latest.png`);

    const exists = await fs.pathExists(imagePath);

    if (exists == false) {
      console.log("New advisory image made!");
      await map.screenshot({
        path: imagePath
      });
      await map.screenshot({
        path: latestPath
      })
    }

    await browser.close();
  } catch (e) {
    console.error(e);
  }
})();
