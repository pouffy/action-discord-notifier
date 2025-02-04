const axios = require('axios')

const core = require('@actions/core')
import * as fs from 'fs'
const github = require('@actions/github')

const webhook = core.getInput('webhook')

if (!/https:\/\/discord(app|)\.com\/api\/webhooks\/\d+?\/.+/i.exec(webhook)) {
  core.setFailed('The given discord webhook url is invalid. Please ensure you give a **full** url that start with "https://discordapp.com/api/webhooks"')
}

const shortSha = (i) => i.substr(0, 6)

const escapeMd = (str) => str.replace(/([\[\]\\`\(\)])/g, '\\$1')

const { payload: githubPayload } = github.context

const commits = githubPayload.commits.map(i => ` - [\`[${shortSha(i.id)}]\`](${i.url}) ${escapeMd(i.message)} - by ${i.author.name}`)

if (!commits.length) {
  return
}

const beforeSha = githubPayload.before
const afterSha = githubPayload.after
const compareUrl = `${githubPayload.repository.url}/compare/${beforeSha}...${afterSha}`

const payload = {
  content: '',
  embeds: [
    {
      title: core.getInput('message-title') || 'Commits received',
      description: `[\`\[${shortSha(beforeSha)}...${shortSha(afterSha)}\]\`](${compareUrl})\n${commits.join('\n')}`
    }
  ]
}

axios
  .post(webhook, payload)
  .then((res) => {
    //core.setOutput('result', 'Webhook sent')
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `result=Webhook sent\n`)
  })
  .catch((err) => {
    throw new Error(`Post to webhook failed, ${err}`)
  })
