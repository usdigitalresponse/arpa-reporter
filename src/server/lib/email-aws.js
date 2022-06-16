/*
--------------------------------------------------------------------------------
-                                 lib/email-aws.js
--------------------------------------------------------------------------------

*/
/* eslint camelcase: 0 */

const AWS = require('aws-sdk')

const environment = require('../environment')

const transport = createTransport()

function send (message) {
  const params = {
    Destination: {
      ToAddresses: [message.toAddress]
    },
    Source: environment.NOTIFICATIONS_EMAIL,
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: message.subject
      },
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: message.body
        }
      }
    }
  }
  return transport.sendEmail(params).promise()
}

function createTransport () {
  if (!environment.AWS_SECRET_ACCESS_KEY) {
    return {
      sendEmail: () => {
        return {
          promise: () => {
            throw new Error('Missing AWS info!')
          }
        }
      }
    }
  }
  return new AWS.SES({ region: environment.SES_REGION })
}

module.exports = { send }

/*                                  *  *  *                                   */
