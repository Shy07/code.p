
import express from 'express'
import fs from 'fs'
import _ from 'lodash'

import { langPH } from './langExt'
const $H = langPH

import _config from '../config.json'

const app = express()

let poetryList = []
let titleList = {}
let chaodaiList = {}
let authorList = {}

let lists = {
  poetryList,
  titleList,
  chaodaiList,
  authorList
}

$H(lists).keys().each((list) => {
  let filename = `./json/${list}.json`
  if (!fs.existsSync(filename)) return
  _.merge(lists[list], JSON.parse(fs.readFileSync(filename, {encoding: 'utf-8'})))
})

app.all('*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET')
  res.header('Access-Control-Allow-Headers', 'x-access-token')

  if (req.method === 'OPTIONS') res.sendStatus(200)
  else next()
})

let get = (router, func) =>
  app.get(router, (req, res) => res.send(func(req, res)))

get('/', (req, res) => '<h1>hello</h1>')

get('/poetry/:id', (req, res) => {
  res.header('Content-Type', 'application/json')
  let poetry
  if (req.params.id === 'random') {
    poetry = poetryList[(Math.random() * poetryList.length).round()]
  } else {
    poetry = poetryList[req.params.id]
  }
  if (poetry === null) return ''
  poetry.content = poetry.content.gsub(/[，！？：；:;。.、|＿_-—]/, ' ')
                                  .gsub(/[\\/、<>《》¤""''‘’“”{}【】{}●]|[a-zA-Z0-9\s]+/, '')
                                  .split('\n')
                                  .join(' ')
  return JSON.stringify(poetry, 'utf-8')
})

get('/authors', (req, res) => {
  let html = '<ul>'
  $H(authorList).keys().each((a, i) => {
    html += `<li><a href="/author/${i}">${a}</a></li>`
  })
  html += '</ul>'
  return html
})

get('/author/:id', (req, res) => {
  let name = $H(authorList).keys()[req.params.id]
  let html = '<ul>'
  authorList[name].each((i) => {
    html += `<li><a href="/poetry/${i}">${poetryList[i].title}</a></li>`
  })
  html += '</ul>'
  return html
})

const server = app.listen(_config.server.port, _config.server.host, () => {
  const host = server.address().address
  const port = server.address().port
  console.log(`Server running at http://${host}:${port}/`)
})
