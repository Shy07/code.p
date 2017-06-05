'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _langExt = require('./langExt');

var _config2 = require('../config.json');

var _config3 = _interopRequireDefault(_config2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Font = require('fonteditor-core').Font;

var $H = _langExt.langPH;

var app = (0, _express2.default)();
var buffer = _fs2.default.readFileSync('./font/SentyTang.ttf');

var poetryList = [];
var titleList = {};
var chaodaiList = {};
var authorList = {};

var lists = {
  poetryList: poetryList,
  titleList: titleList,
  chaodaiList: chaodaiList,
  authorList: authorList
};

$H(lists).keys().each(function (list) {
  var filename = './json/' + list + '.json';
  if (!_fs2.default.existsSync(filename)) return;
  _lodash2.default.merge(lists[list], JSON.parse(_fs2.default.readFileSync(filename, { encoding: 'utf-8' })));
});

var getFont = function getFont(charSet) {
  var codeSet = charSet.toArray().uniq().inject([], function (m, v) {
    m.push(v.codePointAt(0));
    return m;
  });
  var font = Font.create(buffer, {
    type: 'ttf', // support ttf,woff,eot,otf,svg
    subset: codeSet, // only read `a`, `b` glyf
    hinting: true, // save font hinting
    compound2simple: true, // transform ttf compound glyf to simple
    inflate: null, // inflate function for woff
    combinePath: false });
  return font.toBase64({ type: 'ttf' });
};

app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', _config3.default.server.orgin);
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'x-access-token');

  if (req.method === 'OPTIONS') res.sendStatus(200);else next();
});

var get = function get(router, func) {
  return app.get(router, function (req, res) {
    return res.send(func(req, res));
  });
};

get('/', function (req, res) {
  return '<h1>hello</h1>';
});

get('/poetry/:id', function (req, res) {
  res.header('Content-Type', 'application/json');
  var poetry = void 0;
  if (req.params.id === 'random') {
    poetry = poetryList[(Math.random() * poetryList.length).round()];
  } else {
    poetry = poetryList[req.params.id];
  }
  if (poetry === null) return '';
  poetry.content = poetry.content.gsub(/[，！？：；:;。·.|＿_-—]/, ' ').gsub(/[\\/、<>《》¤""''‘’“”{}【】{}●]|[a-zA-Z0-9\s]+/, '').strip();
  poetry.title = poetry.title.gsub(/[，！？：；:;。.|＿_-—]/, ' ').gsub(/[\\/、<>《》¤""''‘’“”{}【】{}●]|[a-zA-Z0-9\s]+/, '').gsub(/〔[^〔〕]*〕/, '').split('\n').join(' ');
  if (poetry.commits.length > 0) {
    poetry.commits = poetry.commits.select(function (c) {
      return c !== '';
    });
  }
  //
  poetry.font = getFont('' + poetry.content + poetry.title + poetry.author + '\u8CE6');

  return JSON.stringify(poetry, 'utf-8');
});

get('/authors', function (req, res) {
  var html = '<ul>';
  $H(authorList).keys().each(function (a, i) {
    html += '<li><a href="/author/' + i + '">' + a + '</a></li>';
  });
  html += '</ul>';
  return html;
});

get('/articles', function (req, res) {
  res.header('Content-Type', 'application/json');
  return JSON.stringify(titleList, 'utef-8');
});

get('/author/:id', function (req, res) {
  var name = $H(authorList).keys()[req.params.id];
  var html = '<ul>';
  authorList[name].each(function (i) {
    html += '<li><a href="/poetry/' + i + '">' + poetryList[i].title + '</a></li>';
  });
  html += '</ul>';
  return html;
});

var server = app.listen(_config3.default.server.port, _config3.default.server.host, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Server running at http://' + host + ':' + port + '/');
});