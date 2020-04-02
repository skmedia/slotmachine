var express = require('express');
var router = express.Router();
var sm = require('../slotmachine')
var ld = require('lodash')

router.get('/play', function(req, res, next) {
  var who = req.query.user
  if (who === '' || ld.isUndefined(who)) {
    res.status(500).json('user is req').end()
    return
  }
  res.json({
    result: sm.play(who)
  })
});

router.get('/ranking', function(req, res, next) {
  res.json({
    result: sm.ranking()
  })
});

router.get('/jackpot', function(req, res, next) {
  res.json({
    result: sm.jackpot()
  })
});

module.exports = router;
