import { watchFile } from 'node:fs';
import { exec } from 'node:child_process';

watchFile("index.ts", () => {
  console.log("  <================================================>" + "\n");

  exec('tsc', (err, stdout, stderr) => {
    if (stdout) { console.error(stdout); return; }
    exec('node index.js ./example.png', (err, stdout, stderr) => {
      if (stderr) console.error(stderr);
      console.log(stdout);
    })
  })
})