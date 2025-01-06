const { program } = require("../lib/cli");
const { awaiter } = require("./common");

describe("test", () => {
  test("A", async () => {
    let output = "./tmp/output.json";
    program.parse(
      [
        "compare",
        "-p",
        "-o",
        output,
        "mysql://root:dev@localhost:3306/A",
        "mysql://root:dev@localhost:3306/B",
      ],
      { from: "user" }
    );
    let data = await awaiter(output);
    console.log(data.result);
  });
});
