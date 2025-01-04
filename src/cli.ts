import { Command } from "commander";
import { MySqlDiff } from "./mysql-diff";
import { Diff, ConnectionOptions } from "./diff";
import { basename } from "path";
import { URL } from "url";

type DiffOptions = Omit<ConnectionOptions, "client">;

const supported: Record<string, (options: DiffOptions) => Diff> = {
  "mysql:": (options) =>
    new MySqlDiff({
      client: "mysql",
      ...options,
    }),
};

function createConnection(url: URL): Diff {
  if (!supported[url.protocol]) {
    throw new Error(
      `${url.protocol} not supported. protocols ${Object.keys(supported)}`
    );
  }
  return supported[url.protocol]({
    database: basename(url.pathname),
    host: url.hostname,
    port: Number(url.port) || undefined,
    user: url.username,
    password: url.password,
  });
}

const program = new Command();

program
  .command("compare <dbURL1> <dbURL2>")
  .description(
    `DB URL format: <protocol>://<user>[:password]@<address>[:port]/<dbname>

    example:
    schema mysql://user@localhost:3308/db1 mysql://user@localhost:3308/db2
    schema mysql://user:secret@localhost:3308/db1 mysql://user:secret@localhost:3308/db2
    `
  )
  .summary("Check the difference between database schemas.")
  .action(async (...args) => {
    const [dbUrl1, dbUrl2] = args;
    const url1 = URL.parse(dbUrl1);
    const url2 = URL.parse(dbUrl2);
    if (!url1) throw new Error(`invalid url: ${dbUrl1}`);
    if (!url2) throw new Error(`invalid url: ${dbUrl2}`);
    if (url1.protocol !== url2.protocol) {
      throw new Error(
        `protocol mismatch: ${url1.protocol} != ${url2.protocol}`
      );
    }
    const A = createConnection(url1);
    const B = createConnection(url2);
    await Promise.all([A.load(), B.load()]);
    console.log(A.compare(B));
  });

program.parse(process.argv);
