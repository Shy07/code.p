
import request from 'superagent'
import cheerio from 'cheerio'
import _ from 'lodash'
import fs from 'fs'
import ProgressBar from 'progress'

import {langPA, langPw, langPH, langPR} from './langExt'
const $A = langPA
const $w = langPw
const $H = langPH
const $R = langPR

const MAX = 90000
const SAVE_POINT = 1000

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

let lastIndex = 0

$H(lists).keys().each((list) => {
  let filename = `./json/${list}.json`
  if (!fs.existsSync(filename)) return
  _.merge(lists[list], JSON.parse(fs.readFileSync(filename, {encoding: 'utf-8'})))
})
lastIndex = poetryList.length

function makePoetry (url, next, error) {
  const TITLE = 'h1[style="font-size:20px; line-height:22px; height:22px; margin-bottom:10px;"]'

  const makeContent = ($) => {
    let content = $.text().trim()
    $R(9312, 9371).each(i => {
      content = content.gsub(String.fromCodePoint(i), '\n')
    })
    return content.gsub(/\(/, '（')
                  .gsub(/\)/, '）')
                  .gsub(/（[^（）]*）/, '')
                  .gsub(/\?/, '？')
                  .gsub(/!/, '！')
                  .gsub(/,/, '，')
                  .gsub(/\./, '。')
                  .gsub(/:/, '：')
                  .gsub(/《/, '')
                  .gsub(/》/, '')
                  .gsub(/。。。。。。/, '……')
                  .gsub(/。。。。。/, '……')
                  .gsub(/。。。。/, '……')
                  .gsub(/。。。/, '……')
  }

  const makeCommits = ($) => {
    let href = $('a[style="font-weight:bold; font-size:16px;"]').attr('href')
    if (!href) return ''

    let pid = `fanyiquan${href.match(/\d+/)[0]}`
    let commits = $(`#${pid} p`).find('strong').last().parent()
    $w('strong a').each((ele) => $(ele, commits).remove())
    commits = (commits.html() || '').gsub(/<br>/, '\n')
                                    .gsub(/〔(\d+)〕/, '\n')
                                    .gsub(/\(/, '（')
                                    .gsub(/\)/, '）')
                                    .gsub(/（(\d+)）/, '\n')
                                    .gsub(/(\d+)、/, '\n')
                                    .gsub(/(\d+)\. /, '\n')
                                    .gsub(/(\d+)\./, '\n')
                                    .gsub(/。。。。。。/, '……')
                                    .gsub(/。。。。。/, '……')
                                    .gsub(/。。。。/, '……')
                                    .gsub(/。。。/, '……')
    $R(9312, 9371).each(i => {
      commits = commits.gsub(String.fromCodePoint(i), '\n')
    })

    return commits.split('\n').compact()
  }

  const success = (res) => {
    const $ = cheerio.load(res.text, { decodeEntities: false })
    let title = $(TITLE).text().trim()
    if (title === '') return
    title = title.split('/').first()
                            .gsub(/（[^（）]*）/, '')
                            .gsub(/〔[^〔〕]*〕/, '')
                            .gsub(/[，。·－]/, ' ')
                            .gsub(/[、《》]/, '')

    let sons = $('div[class="sons"]')[0]
    let [chaodai, author] = $A(
      $('p[class="source"] a', sons).map((i, ele) => $(ele).text().trim())
    )
    if (chaodai !== '五代') chaodai = chaodai.gsub('代', '')

    let content = makeContent($('div[class="contson"]', sons))
    let commits = makeCommits($)

    next({
      title,
      chaodai,
      author,
      content,
      commits
    })
  }

  return request.get(url).then(success, error)
}

function makeLists (index, data) {
  poetryList[index] = data
  titleList[`${index}. ${data.title}`] = index

  if (!chaodaiList[data.chaodai]) chaodaiList[data.chaodai] = []
  chaodaiList[data.chaodai].push(index)

  if (!authorList[data.author]) authorList[data.author] = []
  authorList[data.author].push(index)
}

function save (index) {
  $w('poetryList titleList chaodaiList authorList').each((list) =>
    fs.writeFileSync(`./json/${list}.json`, JSON.stringify(lists[list]), 'utf8')
  )
}

if (!fs.existsSync('./json')) fs.mkdirSync('./json')

;(async () => {
  let curr = 0
  let log = (result) => console.log(result)

  let bar = new ProgressBar('  fetching [:bar] :current/:total :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 50,
    total: MAX
  })
  bar.tick(lastIndex)
  let timer = setInterval(() => {
    bar.tick(curr)
    curr = 0
    if (bar.complete) clearInterval(timer)
  }, 1000)

  for (let i = lastIndex; i <= MAX; i++) {
    curr++
    await makePoetry(`http://so.gushiwen.org/view_${i}.aspx`, makeLists.bind('index', i), log)
    if (i % SAVE_POINT === 0) save(i)
    if (i === MAX) console.log('\n')
  }
})()
