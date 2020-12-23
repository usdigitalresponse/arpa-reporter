const {
  documentsWithProjectCode
} = requireSrc(__filename);
const { processUpload } = requireSrc(`${__dirname}/../services/process-upload`);

const { makeUploadArgs } = require("../services/helpers");
const {
  setCurrentReportingPeriod
} = requireSrc(`${__dirname}/../db/settings`);

const dirRoot = `${__dirname}/../fixtures/`;

const expect = require("chai").expect;


describe("documents.spec.js - baseline success", () => {
  const dir = `${dirRoot}file-success/`;
  it("Uploads a file in reporting period 1", async () => {
    const uploadArgs = makeUploadArgs(
      `${dir}OMB-1020-09302020-simple-v1.xlsx`
    );

    await setCurrentReportingPeriod(1);
    const result = await processUpload(uploadArgs);
    expect(
      result.valog.getLog(),
      JSON.stringify(result.valog.getLog(), null, 2)
    ).to.be.empty;
    return result;
  });

  it("Fails to upload a file in reporting period 2", async () => {

    const uploadArgs = makeUploadArgs(
      `${dir}GOV-075-09302020-simple-v1.xlsx`
    );

    await setCurrentReportingPeriod(2);
    const result = await processUpload(uploadArgs);
    expect(
      result.valog.getLog()[0].message
      // JSON.stringify(result.valog.getLog()[0].message, null, 2)
    ).to.equal(
      "The reporting period end date in the filename is \"09302020\" "
      + "but should be \"12312020\" or \"123120\""
    );
    return result;
  });

  it("Uploads a file in reporting period 2", async () => {

    const uploadArgs = makeUploadArgs(
      `${dir}EOHHS-075-12312020-simple-v1.xlsx`
    );

    await setCurrentReportingPeriod(2);
    const result = await processUpload(uploadArgs);
    expect(
      result.valog.getLog(),
      JSON.stringify(result.valog.getLog(), null, 2)
    ).to.be.empty;
    return result;
  });

  it("Returns documents from the current reporting period", async () => {

    await setCurrentReportingPeriod(1);
    const result = await documentsWithProjectCode();
    // console.dir(result.length);
    expect( result.length ).to.equal(35);
  });

  it("Returns no documents from another reporting period", async () => {
    // console.dir(await currentReportingPeriodSettings()); // 2
    await setCurrentReportingPeriod(3);
    const result = await documentsWithProjectCode();
    // console.dir(result.length);
    expect( result.length ).to.equal(0);
  });

  it("Specified period overrides current reporting period", async () => {
    // console.dir(await currentReportingPeriod()); // 2
    await setCurrentReportingPeriod(2);
    const result = await documentsWithProjectCode(1);
    // console.dir(result);
    expect( result.length ).to.equal(35);
  });
});
