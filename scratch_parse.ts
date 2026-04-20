import { read, utils } from 'xlsx';
import fs from 'fs';

const buf = fs.readFileSync('public/templates/MALTA - Course Flow - MOY Limited (1).xlsx');
const wb = read(buf, { type: 'buffer' });
const ws = wb.Sheets[wb.SheetNames[0]];
const data = utils.sheet_to_json(ws, { header: 1 });

console.log(JSON.stringify(data.slice(0, 40), null, 2));
