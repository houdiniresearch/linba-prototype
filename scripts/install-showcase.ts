import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { get } from "../lib/db";
import { ensureShowcaseWorkspace } from "../lib/showcase-install";
import type { User } from "../lib/types";
async function main() {
  const ownerId = process.argv[2];
  const user = ownerId ? await get<User>("user", ownerId) : undefined;
  if (!user || user.role !== "teacher")
    throw new Error(
      "Pass the intended teacher account ID. No account is selected automatically.",
    );
  const presentations = await ensureShowcaseWorkspace(user);
  const output = path.join(process.cwd(), "output/showcase");
  await mkdir(output, { recursive: true });
  await writeFile(
    path.join(output, "installed.json"),
    JSON.stringify({ ownerId, presentations }, null, 2),
  );
  console.log(JSON.stringify({ presentations }));
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
