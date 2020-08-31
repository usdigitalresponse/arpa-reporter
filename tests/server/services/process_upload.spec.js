const fs = require("fs");
const { processUpload } = requireSrc(__filename);
const expect = require("chai").expect;

const xlsxData = fs.readFileSync(
  `${__dirname}/../fixtures/010-20200801-test-v1.xlsx`
);

describe("services/process_upload", () => {
  it("processes without error", async () => {
    const uploadArgs = {
      filename: "010-20200801-test-v1.xlsx",
      configuration_id: 1,
      user_id: 1,
      data: xlsxData
    };
    return await processUpload(uploadArgs);
  });

  it("fails a bad filename", async () => {
    const uploadArgs = {
      filename: "010-20200801-test-v1.csv",
      configuration_id: 1,
      user_id: 1,
      data: xlsxData
    };
    const result = await processUpload(uploadArgs);
    expect(result.valog.log).to.have.length(1);
  });
});
