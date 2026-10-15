import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

// Reuse the original logo's alpha mask: every edge, letter and gap stays intact.
// Only the flat color layers under that mask change.
const source = await readFile(
  new URL("../public/brand/linba-logo.webp", import.meta.url),
);
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const maskPixels = Buffer.from(data);
for (let i = 0; i < maskPixels.length; i += 4) maskPixels.fill(255, i, i + 3);
const alphaMask = await sharp(maskPixels, { raw: info }).png().toBuffer();
const boundary = [];
for (let y = 0; y < info.height; y++) {
  const runs = [];
  let start = -1;
  for (let x = 0; x < 190; x++) {
    const visible = data[(y * info.width + x) * 4 + 3] > 16;
    if (visible && start < 0) start = x;
    if (!visible && start >= 0) {
      if (x - start > 1) runs.push([start, x - 1]);
      start = -1;
    }
  }
  // Follow the transparent channel between the two original symbol planes.
  const x =
    runs.length > 1 ? (runs[0][1] + runs[1][0]) / 2 : y < 100 ? 70 : 130;
  boundary.push(`${x},${y}`);
}
const mask = `<defs><mask id="logo-alpha" mask-type="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="700" height="214"><image href="data:image/png;base64,${alphaMask.toString("base64")}" width="700" height="214"/></mask></defs>`;
const shapes = `<g mask="url(#logo-alpha)"><path fill="#23232F" d="M0 0H700V214H0Z"/><path fill="#B28AE1" d="M0 0H190V214H0Z"/><polygon fill="#E90072" points="190,0 190,214 ${boundary.reverse().join(" ")}"/><path fill="#E90072" d="M260 0H320V80H260Z"/></g>`;
const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="214" viewBox="0 0 700 214">${mask}${shapes}</svg>\n`;
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="-32 -12 238 238">${mask}${shapes}</svg>\n`;
await writeFile(
  new URL("../public/brand/linba-logo-color.svg", import.meta.url),
  logo,
);
await writeFile(new URL("../app/icon.svg", import.meta.url), icon);
await writeFile(
  new URL("../public/brand/linba-logo-dark.svg", import.meta.url),
  logo.replace('fill="#23232F"', 'fill="#F4F3F6"'),
);

// Verify that the recoloring has not changed the source silhouette.
const rendered = await sharp(Buffer.from(logo)).ensureAlpha().raw().toBuffer();
let maxAlphaDifference = 0;
for (let i = 3; i < data.length; i += 4)
  maxAlphaDifference = Math.max(
    maxAlphaDifference,
    Math.abs(data[i] - rendered[i]),
  );
if (maxAlphaDifference > 1)
  throw new Error(`Logo alpha changed: ${maxAlphaDifference}`);
console.log(
  `Brand assets built; original alpha preserved (max difference ${maxAlphaDifference}/255).`,
);
