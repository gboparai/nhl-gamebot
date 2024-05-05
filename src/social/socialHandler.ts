import fs from 'fs';

export function logObjectToFile(obj: any, type: string, path: string) {
    fs.writeFileSync(path, type + '\n\n' + JSON.stringify(obj, null, 2) + '\n\n');
}


