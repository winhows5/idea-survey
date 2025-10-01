import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { AppData } from './types';

let cachedData: AppData[] | null = null;
let cachedUniqueApps: {app_id: string, app_name: string}[] | null = null;

export async function loadCSVData(): Promise<AppData[]> {
  if (cachedData) {
    return cachedData;
  }

  const csvPath = path.join(process.cwd(), 'schema', 'INPUT.csv');
  const results: AppData[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', () => {
        console.log('Total rows loaded:', results.length);
        cachedData = results;
        resolve(results);
      })
      .on('error', reject);
  });
}

export async function getUniqueApps(): Promise<{app_id: string, app_name: string}[]> {
  // Return cached unique apps if available
  if (cachedUniqueApps) {
    return cachedUniqueApps;
  }

  const data = await loadCSVData();
  const uniqueApps = new Map<string, string>();
  
  data.forEach(row => {
    if (!uniqueApps.has(row.app_id)) {
      uniqueApps.set(row.app_id, row.app_name);
    }
  });
  
  const result = Array.from(uniqueApps.entries()).map(([app_id, app_name]) => ({
    app_id,
    app_name
  }));

  // Cache the unique apps result
  cachedUniqueApps = result;
  
  return result;
}

export async function getIdeasBySource(appId: string, source: string): Promise<{text: string, originalNumber: number}[]> {
  const data = await loadCSVData();
  
  // Special case for VALIDATION source
  if (source === 'VALIDATION') {
    const validationRows = data.filter(row => 
      row.source === 'VALIDATION' && 
      row.app_id === 'NA' && 
      row.app_name === 'NA'
    );
    
    if (validationRows.length > 0) {
      const row = validationRows[0];
      const ideas = [
        { text: row.idea_1, originalNumber: 1 },
        { text: row.idea_2, originalNumber: 2 },
        { text: row.idea_3, originalNumber: 3 },
        { text: row.idea_4, originalNumber: 4 },
        { text: row.idea_5, originalNumber: 5 },
        { text: row.idea_6, originalNumber: 6 },
        { text: row.idea_7, originalNumber: 7 },
        { text: row.idea_8, originalNumber: 8 },
        { text: row.idea_9, originalNumber: 9 },
        { text: row.idea_10, originalNumber: 10 }
      ];
      return ideas.filter(idea => idea.text && idea.text.trim() !== '');
    }
    return [];
  }
  
  // For other sources, find matching app_id and source
  const matchingRows = data.filter(row => 
    row.app_id === appId && row.source === source
  );
  
  if (matchingRows.length > 0) {
    const row = matchingRows[0];
    const ideas = [
      { text: row.idea_1, originalNumber: 1 },
      { text: row.idea_2, originalNumber: 2 },
      { text: row.idea_3, originalNumber: 3 },
      { text: row.idea_4, originalNumber: 4 },
      { text: row.idea_5, originalNumber: 5 },
      { text: row.idea_6, originalNumber: 6 },
      { text: row.idea_7, originalNumber: 7 },
      { text: row.idea_8, originalNumber: 8 },
      { text: row.idea_9, originalNumber: 9 },
      { text: row.idea_10, originalNumber: 10 }
    ];
    return ideas.filter(idea => idea.text && idea.text.trim() !== '');
  }
  
  return [];
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}
