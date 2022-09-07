const _ = require("lodash");
const AdmZip = require("adm-zip");
const fs = require("fs/promises");
const inquirer = require("inquirer");
const path = require("path");

const knex = require("../src/server/db/connection");
const { uploadFSName } = require("../src/server/services/persist-upload");
const { periodTemplatePath } = require("../src/server/services/get-template");

const TABLES = [
  "users",
  "agencies",
  "reporting_periods",
  "uploads", // has FK to reporting_periods
  "arpa_subrecipients", // has FK to uploads
  "application_settings", // has FK to reporting_periods
  "projects", // has FK to reporting_periods
  "period_summaries", // has FK to reporting_periods, projects
];

async function getDatabaseContents() {
  console.log("Fetching all DB rows...");
  const start = Date.now();

  const data = await Promise.all(
    TABLES.map((tableName) => knex(tableName).select("*"))
  );
  const ret = _.fromPairs(_.zip(TABLES, data));

  const end = Date.now();
  console.log("Fetching DB rows took", end - start, "ms");

  return ret;
}

function getAllFilePaths(dbContents) {
  const { uploads, reporting_periods } = dbContents;

  return [
    ...uploads.map((upload) => uploadFSName(upload)),
    ...reporting_periods
      .filter((rp) => rp.template_filename)
      .map((rp) => periodTemplatePath(rp)),
  ];
}

function addFilesToZip(dbContents, zipFile) {
  const filePaths = getAllFilePaths(dbContents);
  console.log('Adding', filePaths.length, 'uploaded files to zip output...');
  const start = Date.now();

  // Sanity check: all filenames should be unique since they will all be together
  // in the zip
  const fnames = filePaths.map((filePath) => path.basename(filePath));
  const dupeFilenames = _.chain(fnames)
    .groupBy(_.identity)
    .pickBy((v) => v.length > 1)
    .keys()
    .value();
  if (dupeFilenames.length > 0) {
    console.error("Duplicate filenames:", dupeFilenames);
    throw new Error("duplicate filenames cannot be added to zip!");
  }

  for (const filePath of filePaths) {
    zipFile.addLocalFile(filePath, path.join('files', path.basename(filePath)));
  }

  // Sanity check: look for files in upload directory not captured by the above
  // TODO

  const end = Date.now();
  console.log('Took', end-start, 'ms to add uploads to zip');
}

function writeZip(zipFile, outputFilename) {
  console.log('Writing zip file...');
  const start = Date.now();

  zipFile.writeZip(outputFilename);

  const end = Date.now();
  console.log('Took', end-start, 'ms to write zip file');
}

async function main() {
  const dateStr = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .substring(0, 14);
  const defaultOutputFilename = `/tmp/arpa-reporter-dump-${dateStr}.zip`;
  const { outputFilename } = await inquirer.prompt([
    {
      type: "input",
      name: "outputFilename",
      message: "Output filename:",
      default: defaultOutputFilename,
    },
  ]);
  const zipFile = new AdmZip();

  // Get db contents
  const dbContents = await getDatabaseContents();
  zipFile.addFile("sql.json", Buffer.from(JSON.stringify(dbContents), "utf8"));

  // Copy files to zip
  addFilesToZip(dbContents, zipFile);

  // Generate the zip file
  writeZip(zipFile, outputFilename);
  const { size: outputSize } = await fs.stat(outputFilename);
  console.log("Wrote", outputSize, "bytes to", outputFilename);
  console.log("File is unencrypted, be sure to delete after transferring.");
}

if (require.main === module) {
  main().then(() => process.exit());
}
