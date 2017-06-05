'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _progress = require('progress');

var _progress2 = _interopRequireDefault(_progress);

var _langExt = require('./langExt');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var $A = _langExt.langPA;
var $w = _langExt.langPw;
var $H = _langExt.langPH;
var $R = _langExt.langPR;

var MAX = 90000;
var SAVE_POINT = 1000;

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

var lastIndex = 0;

$H(lists).keys().each(function (list) {
  var filename = './json/' + list + '.json';
  if (!_fs2.default.existsSync(filename)) return;
  _lodash2.default.merge(lists[list], JSON.parse(_fs2.default.readFileSync(filename, { encoding: 'utf-8' })));
});
lastIndex = poetryList.length;

function makePoetry(url, next, error) {
  var TITLE = 'h1[style="font-size:20px; line-height:22px; height:22px; margin-bottom:10px;"]';

  var makeContent = function makeContent($) {
    var content = $.text().trim();
    $R(9312, 9371).each(function (i) {
      content = content.gsub(String.fromCodePoint(i), '\n');
    });
    return content.gsub(/\(/, '（').gsub(/\)/, '）').gsub(/（[^（）]*）/, '').gsub(/\?/, '？').gsub(/!/, '！').gsub(/,/, '，').gsub(/\./, '。').gsub(/:/, '：').gsub(/《/, '').gsub(/》/, '').gsub(/。。。。。。/, '……').gsub(/。。。。。/, '……').gsub(/。。。。/, '……').gsub(/。。。/, '……');
  };

  var makeCommits = function makeCommits($) {
    var href = $('a[style="font-weight:bold; font-size:16px;"]').attr('href');
    if (!href) return '';

    var pid = 'fanyiquan' + href.match(/\d+/)[0];
    var commits = $('#' + pid + ' p').find('strong').last().parent();
    $w('strong a').each(function (ele) {
      return $(ele, commits).remove();
    });
    commits = (commits.html() || '').gsub(/<br>/, '\n').gsub(/〔(\d+)〕/, '\n').gsub(/\(/, '（').gsub(/\)/, '）').gsub(/（(\d+)）/, '\n').gsub(/(\d+)、/, '\n').gsub(/(\d+)\. /, '\n').gsub(/(\d+)\./, '\n').gsub(/。。。。。。/, '……').gsub(/。。。。。/, '……').gsub(/。。。。/, '……').gsub(/。。。/, '……');
    $R(9312, 9371).each(function (i) {
      commits = commits.gsub(String.fromCodePoint(i), '\n');
    });

    return commits.split('\n').compact();
  };

  var success = function success(res) {
    var $ = _cheerio2.default.load(res.text, { decodeEntities: false });
    var title = $(TITLE).text().trim();
    if (title === '') return;
    title = title.split('/').first().gsub(/（[^（）]*）/, '').gsub(/〔[^〔〕]*〕/, '').gsub(/[，。·－]/, ' ').gsub(/[、《》]/, '');

    var sons = $('div[class="sons"]')[0];

    var _$A = $A($('p[class="source"] a', sons).map(function (i, ele) {
      return $(ele).text().trim();
    })),
        _$A2 = _slicedToArray(_$A, 2),
        chaodai = _$A2[0],
        author = _$A2[1];

    if (chaodai !== '五代') chaodai = chaodai.gsub('代', '');

    var content = makeContent($('div[class="contson"]', sons));
    var commits = makeCommits($);

    next({
      title: title,
      chaodai: chaodai,
      author: author,
      content: content,
      commits: commits
    });
  };

  return _superagent2.default.get(url).then(success, error);
}

function makeLists(index, data) {
  poetryList[index] = data;
  titleList[index + '. ' + data.title] = index;

  if (!chaodaiList[data.chaodai]) chaodaiList[data.chaodai] = [];
  chaodaiList[data.chaodai].push(index);

  if (!authorList[data.author]) authorList[data.author] = [];
  authorList[data.author].push(index);
}

function save(index) {
  $w('poetryList titleList chaodaiList authorList').each(function (list) {
    return _fs2.default.writeFileSync('./json/' + list + '.json', JSON.stringify(lists[list]), 'utf8');
  });
}

if (!_fs2.default.existsSync('./json')) _fs2.default.mkdirSync('./json');_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
  var curr, log, bar, timer, i;
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          curr = 0;

          log = function log(result) {
            return console.log(result);
          };

          bar = new _progress2.default('  fetching [:bar] :current/:total :percent :etas', {
            complete: '=',
            incomplete: ' ',
            width: 50,
            total: MAX
          });

          bar.tick(lastIndex);
          timer = setInterval(function () {
            bar.tick(curr);
            curr = 0;
            if (bar.complete) clearInterval(timer);
          }, 1000);
          i = lastIndex;

        case 6:
          if (!(i <= MAX)) {
            _context.next = 15;
            break;
          }

          curr++;
          _context.next = 10;
          return makePoetry('http://so.gushiwen.org/view_' + i + '.aspx', makeLists.bind('index', i), log);

        case 10:
          if (i % SAVE_POINT === 0) save(i);
          if (i === MAX) console.log('\n');

        case 12:
          i++;
          _context.next = 6;
          break;

        case 15:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, undefined);
}))();