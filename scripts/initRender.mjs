#!/usr/bin/env node

import 'dotenv/config'
import chalk from 'chalk'
import api from 'api'
import inquirer from 'inquirer'

const sdk = api('@render-api/v1.0#t0hgnkl09w8siw')

const error = (msg) => { console.log(chalk.red(msg)); process.exit(1) }
const log = (msg) => { console.log(chalk.green(msg)) }

const run = async () => {
  const apiKey = process.env.RENDER_API_KEY
  if (!apiKey) { error('no render API key available; please configure `RENDER_API_KEY` in environment or .env file') }

  const render = sdk.auth(apiKey)

  log('Listing available Render web services...')
  const owners = {}
  await render['get-owners']()
    .then(res => res.forEach((obj) => {
      owners[obj.owner.id] = obj.owner
    }))
    .catch(err => error(err))

  const services = {}
  await render['get-services']({ limit: '20' })
    .then(res => res.forEach((obj) => {
      services[obj.service.id] = obj.service
    }))
    .catch(err => error(err))

  Object.values(services).forEach(service => {
    service.description = `${service.name} owned by ${owners[service.ownerId].name}`
  })

  const { toConfig, toModel } = await inquirer.prompt([
    {
      type: 'list',
      name: 'toConfig',
      message: 'Which service would you like to configure?',
      choices: Object.values(services).map(service => Object({
        name: service.description,
        value: service
      }))
    },
    {
      type: 'list',
      name: 'toModel',
      message: 'Which service would you like to copy variables from?',
      choices: (answers) => Object.values(services)
        .filter((service) => service.id !== answers.toConfig.id)
        .map(service => Object({
          name: service.description,
          value: service
        }))
    }
  ])

  log(`you picked service ${toConfig.slug} to configure; it will be configured based on ${toModel.slug}`)

  toConfig.envVars = {}
  await render['get-env-vars-for-service']({ serviceId: toConfig.id })
    .then(res => res.forEach(({ envVar }) => {
      toConfig.envVars[envVar.key] = envVar.value
    }))

  toModel.envVars = {}
  await render['get-env-vars-for-service']({ serviceId: toModel.id })
    .then(res => res.forEach(({ envVar }) => {
      toModel.envVars[envVar.key] = envVar.value
    }))

  const questions = []
  const copiedVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'NOTIFICATIONS_EMAIL', 'SES_REGION']

  copiedVars.forEach(toCopy => {
    questions.push({
      type: 'list',
      name: toCopy,
      default: toConfig.envVars[toCopy],
      choices: [
        { name: `Existing (${toConfig.envVars[toCopy]})`, value: toConfig.envVars[toCopy] },
        { name: `Copied (${toModel.envVars[toCopy]})`, value: toModel.envVars[toCopy] }
      ]
    })
  })

  questions.push({
    type: 'input',
    name: 'INITIAL_APP_TITLE',
    default: toConfig.envVars.INITIAL_APP_TITLE
  })

  questions.push({
    type: 'list',
    name: 'POSTGRES_SOURCE_URL',
    default: toConfig.envVars.POSTGRES_SOURCE_URL,
    choices: [
      { name: `Existing (${toConfig.envVars.POSTGRES_SOURCE_URL})`, value: toConfig.envVars.POSTGRES_SOURCE_URL },
      { name: `Copied (${toModel.envVars.POSTGRES_URL})`, value: toModel.envVars.POSTGRES_URL }
    ]
  })

  questions.push({
    type: 'input',
    name: 'COOKIE_SECRET',
    default: toConfig.envVars.COOKIE_SECRET || Math.random().toString(16).substr(2, 10)
  })

  questions.push({
    type: 'input',
    name: 'POSTGRES_URL',
    default: toConfig.envVars.POSTGRES_URL
  })

  await inquirer.prompt(questions, {
    SITE_URL: toConfig.serviceDetails.url,
    UPLOAD_DIRECTORY: '/var/data/uploads',
    TREASURY_DIRECTORY: '/var/data/uploads/treasury',
    REPORTING_TEMPLATE: 'empty-template.xlsx',
    VALIDATION_TEMPLATE: 'validation-template.xlsx',
    TREASURY_TEMPLATE: 'treasury-template.xlsx'
  })
    .then(answers => {
      render['update-env-vars-for-service'](
        Object.entries(answers).map(([key, value]) => Object({ key, value })),
        { serviceId: toConfig.id }
      )
        .catch(err => console.log(err))
    })

  log(`Successfully updated environment for service ${toConfig.slug}`)
}

run()
