#!/usr/bin/env node

import Ibis from 'ibis-gis';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reg = /(?:_)(\d+\w?)(?:.zip)/;
const shapes = ['forecast', 'windField', 'bestTrack'];
const dataFolder = '/data';
const pathToData = (shape, stormName, advNum) =>
  path.join(
    __dirname,
    dataFolder,
    stormName,
    `${shape}_${advNum || 'latest'}.json`
  );

async function init() {
  const ibis = new Ibis();

  for (const shape of shapes) {
    const data = await ibis.getAll[shape]();

    data.forEach(async d => {
      try {
        let currentFile;
        const date = d.date;
        const stormname = d.name.toLowerCase();
        const json = await d.fetchGIS();
        const advNum = d.fileName.match(reg) || [null, null];

        const filePath = pathToData(shape, stormname, advNum[1]);

        const exists = await fs.pathExists(filePath);

        if (exists) {
          currentFile = await fs.readJSON(filePath);
        }

        if (!exists) {
          await fs.outputJSON(filePath, json, { spaces: 0 });
          // creates forecast_lastest in addition to advisory file
          if (shape == 'forecast') await fs.outputJSON(pathToData(shape, stormname), json, { spaces: 0 });
          await notifySlack(shape, d)
        } else if (currentFile[0].pubDate !== date) {
          await fs.outputJSON(filePath, json, { spaces: 0 });
          await notifySlack(shape, d)
        } else {
          console.log(`File "${shape}" for ${stormname.toUpperCase()} already exists and has no new data`);
          return;
        }
      } catch (e) {
        console.error('Error in shape loop: ', e);
      }
    });
  }

  await fetchWindSpeed().catch(console.error);

  async function fetchWindSpeed() {
    const windSpeed = await ibis.get.windSpeed();

    const json = await windSpeed.fetchGIS();

    await fs.outputJSON(
      path.join(__dirname, '/data/wind-speed', 'windSpeed_latest.json'),
      json,
      { spaces: 0 }
    );
  }
}

init().catch(console.error);

async function notifySlack(shape, data) {
  await axios.post(
    process.env.SLACK_HOOK,
    {
      text: 'New data found',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              ':cyclone: New advisory found. Writing current data to file...'
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Type:* ${shape}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Name:* ${data.name}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Date:* ${data.date}`
          }
        }
      ]
    }
  );
}