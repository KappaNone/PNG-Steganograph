import { readFile, writeFile } from "fs";
import { argv, exit } from "node:process";
import * as path from "path";

const SHEBANG = "#!/usr/bin/env node\n";

function setShebang(filePath: string): void {
  const absPath = path.resolve(filePath);

  readFile(absPath, "utf8", (err, data) => {
    if (err) {
      console.error(`Error reading file: ${err}`);
      return;
    }

    if (!data.startsWith(SHEBANG)) {
      let newData = data;
      if (data.startsWith("#!")) {
        const firstLineEnd = data.indexOf("\n");
        newData = SHEBANG + data.slice(firstLineEnd + 1);
      } else {
        newData = SHEBANG + data;
      }

      writeFile(absPath, newData, "utf8", (err) => {
        if (err) {
          console.error(`Error writing file: ${err}`);
        } else {
          console.log(`Shebang added to file: ${absPath}`);
        }
      });
    } else {
      console.log(`Shebang already exists in file: ${absPath}`);
    }
  });
}

const args = argv.slice(2);
const filePath = args[0];

if (!filePath) {
  console.error("Please provide a file path as an argument");
  exit(1);
}

setShebang(filePath);
