const { ValidationItem } = require("../../lib/validation-log");
const { dropdownValues } = require("../get-template");
const _ = require("lodash");

function dateIsOnOrBefore(key) {
  return (val, content) => {
    return new Date(val).getTime() <= new Date(content[key]).getTime();
  };
}

function isNotBlank(val) {
  return /\w/.test(val);
}

function isNumber(val) {
  return _.isNumber(val);
}

function isPositiveNumber(val) {
  return _.isNumber(val) && val > 0;
}

function isSum(columns) {
  return (val, content) => {
    const sum = _.reduce(
      columns,
      (acc, c) => {
        if (!c) {
          return acc;
        }
        const f = parseFloat(content[c]);
        if (_.isUndefined(f) || _.isNaN(f)) {
          return acc;
        }
        acc += f;
        return acc;
      },
      0.0
    );
    return val == sum;
  };
}

function isValidDate(val) {
  return !_.isNaN(new Date(val).getTime());
}

function isValidSubrecipient(val, content, { subrecipientsHash }) {
  return _.has(subrecipientsHash, val);
}

function isValidState(val, content) {
  return (
    content["primary place of performance country name"] !== "usa" ||
    dropdownIncludes("state code")(val)
  );
}

function isValidZip(val, content) {
  return (
    content["primary place of performance country name"] !== "usa" ||
    /^\d{5}(-\d{4})?$/.test(val)
  );
}

function matchesFilePart(key) {
  return function(val, content, { fileParts }) {
    const fileValue = fileParts[key].replace(/^0*/, "");
    const documentValue = (val || "").toString().replace(/^0*/, "");
    return documentValue === fileValue;
  };
}

function dropdownIncludes(key) {
  return val => _.get(dropdownValues, key, []).includes(val.toLowerCase());
}

function validateFields(requiredFields, content, tab, row, context = {}) {
  const valog = [];
  requiredFields.forEach(([key, validator, message]) => {
    const val = content[key] || "";
    if (!validator(val, content, context)) {
      valog.push(
        new ValidationItem({
          message:
            (message || `Empty or invalid entry for ${key}:`) + ` "${val}"`,
          tab,
          row
        })
      );
    }
  });
  return valog;
}

function validateDocuments(documents, tab, requiredFields, validateContext) {
  let valog = [];
  _.each(documents, ({ content }, row) => {
    valog = valog.concat(
      validateFields(requiredFields, content, tab, row + 2, validateContext)
    );
  });
  return valog;
}

module.exports = {
  dateIsOnOrBefore,
  dropdownIncludes,
  isNotBlank,
  isNumber,
  isPositiveNumber,
  isSum,
  isValidDate,
  isValidState,
  isValidSubrecipient,
  isValidZip,
  matchesFilePart,
  validateDocuments,
  validateFields
};
