#!/usr/bin/env node

import Ibis from 'ibis-gis';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORMNAME = 'ida';
const PRELIM_TRACK_URL =
  'https://www.nhc.noaa.gov/gis/best_track/al092021_best_track.zip';

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
  try {
    const bestTrack = await ibis.fetch(PRELIM_TRACK_URL);

    const filePath = pathToData('bestTrack', STORMNAME);

    await fs.outputJSON(filePath, bestTrack, { spaces: 0 });
  } catch (error) {
    console.error(error);
  }
}

init().catch(console.error);
