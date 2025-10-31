// scripts/strip-dots.js
const fs = require("fs");
const path = require("path");
const ok = new Set([".js",".jsx",".ts",".tsx",".kt",".java",".xml",".gradle",".json",".md"]);
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.lstatSync(p);
    if (st.isDirectory()) { if (!["node_modules",".git",".expo",".gradle"].includes(f)) walk(p); }
    else {
      const ext = path.extname(p);
      if (ok.has(ext)) {
        let txt = fs.readFileSync(p, "utf8");
        const before = txt; 
        txt = txt.replace(/^[ \t]*\.\.\.[ \t]*\r?\n/gm, "");
        if (txt !== before) { fs.writeFileSync(p, txt, "utf8"); console.log("fixed:", p); }
      }
    }
  }
}
walk(process.cwd());
console.log("done.");
