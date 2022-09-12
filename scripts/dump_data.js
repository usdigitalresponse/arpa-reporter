const _ = require("lodash");
const AdmZip = require("adm-zip");
const fs = require("fs/promises");
const inquirer = require("inquirer");
const path = require("path");
const { list: listFiles } = require("recursive-readdir-async");

const knex = require("../src/server/db/connection");
const { uploadFSName } = require("../src/server/services/persist-upload");
const { periodTemplatePath } = require("../src/server/services/get-template");
const { UPLOAD_DIR } = require("../src/server/environment");

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
  const start = performance.now();

  const data = await Promise.all(
    TABLES.map((tableName) => knex(tableName).select("*"))
  );
  const ret = _.fromPairs(_.zip(TABLES, data));

  const end = performance.now();
  console.log("Fetching DB rows took", Math.round(end - start), "ms");
  console.log("Row counts:", _.mapValues(ret, (v) => v.length));

  return ret;
}

function getAllFilesToCopy(dbContents) {
  const { uploads, reporting_periods } = dbContents;

  return [
    ...uploads.map((upload) => uploadFSName(upload)),
    ...reporting_periods
      .filter((rp) => rp.template_filename)
      .map((rp) => periodTemplatePath(rp)),
  ];
}

async function getAllFilesInUploadDir() {
  const files = await listFiles(UPLOAD_DIR, {
    recursive: true,
    ignoreFolders: true,
  });

  return files.map((f) => f.fullname);
}

function fileExists(fpath) {
  return fs.access(fpath).then(
    () => true,
    () => false
  );
}

async function addFilesToZip(dbContents, zipFile) {
  const pathsToCopy = getAllFilesToCopy(dbContents);
  console.log("Adding", pathsToCopy.length, "uploaded files to zip output...");
  const start = performance.now();

  // Sanity check: all filenames should be unique since they will all be together
  // in the zip
  const dupeFilenames = _.chain(pathsToCopy)
    .map(filePath => path.basename(filePath))
    .groupBy(_.identity)
    .pickBy((v) => v.length > 1)
    .keys()
    .value();
  if (dupeFilenames.length > 0) {
    console.error(
      "ERROR: duplicate filenames, will be overwritten in zip:",
      dupeFilenames
    );
  }

  // Sanity check: all files to be copied into the zip (based on db rows) actually
  // exist on disk
  const pathsExist = await Promise.all(pathsToCopy.map(fileExists));
  const filesMissingFromDisk = _.chain(pathsToCopy)
    .zip(pathsExist)
    .filter(([, exists]) => !exists)
    .map(([path]) => path)
    .value();
  if (filesMissingFromDisk.length) {
    console.warn('WARN: some expected files missing from disk', filesMissingFromDisk);
  }

  for (const filePath of pathsToCopy) {
    const basename = path.basename(filePath);
    zipFile.addLocalFile(filePath, 'files', basename);
  }

  // Sanity check: look for files in upload directory not captured by the above
  const allUploadPaths = await getAllFilesInUploadDir();
  const missedFiles = _.difference(allUploadPaths, pathsToCopy);
  if (missedFiles.length) {
    console.warn("WARN: some files in upload dir not captured:", missedFiles);
  }

  const end = performance.now();
  console.log("Took", Math.round(end - start), "ms to add uploads to zip");

  return { pathsToCopy, dupeFilenames, missedFiles, filesMissingFromDisk };
}

function writeZip(zipFile, outputFilename) {
  console.log("Writing zip file...");
  const start = performance.now();

  zipFile.writeZip(outputFilename);

  const end = performance.now();
  console.log("Took", Math.round(end - start), "ms to write zip file");
}

function getAllTenantIds(dbContents) {
  return _.chain(dbContents)
    .values()
    .flatten()
    .map("tenant_id")
    .uniq()
    .filter((x) => x !== undefined)
    .sort()
    .value();
}

async function main() {
  const {POSTGRES_URL} = process.env;
  if (!POSTGRES_URL) {
    console.log('must specify POSTGRES_URL');
    return;
  }
  console.log('Using database', POSTGRES_URL);

  const runDate = new Date();
  const dateStr = runDate
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
  zipFile.addFile(
    "sql.json",
    Buffer.from(JSON.stringify(dbContents, undefined, 2), "utf8")
  );

  // Copy files to zip
  const addFilesDebugInfo = await addFilesToZip(dbContents, zipFile);

  // Collect some debug information
  const debug = {
    runDate,
    outputPath: outputFilename,
    numRows: _.mapValues(dbContents, (v) => v.length),
    tenantIds: getAllTenantIds(dbContents),
    ...addFilesDebugInfo,
  };
  zipFile.addFile(
    "debug.json",
    Buffer.from(JSON.stringify(debug, undefined, 2), "utf8")
  );

  // Generate the zip file
  writeZip(zipFile, outputFilename);
  const { size: outputSize } = await fs.stat(outputFilename);
  console.log("Wrote", outputSize, "bytes to", outputFilename);
  console.log("File is unencrypted, be sure to delete after transferring.");
}

if (require.main === module) {
  main().then(() => process.exit());
}
