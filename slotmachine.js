var ld = require('lodash')
var fs = require('fs')
var moment = require('moment')

var balanceFile = __dirname + '/data/slots.json'
var jackpotFile = __dirname + '/data/jackpot.json'

var slotmachine = {
  megaMultiplier: 5,
  transactionCost: 5,
  playDelayInSeconds: 5,

  _getSymbols () {
    var s = ld.range(1, 9)
    s.push('$')

    return s
  },

  _getBalanceData () {
    try {
      var jsonString = fs.readFileSync(balanceFile)
      contents = JSON.parse(jsonString)
      return contents
    } catch (e) {
      throw e
      return []
    }
  },

  _isRow: function (data) {
    var result = true
    ld.each(data, (item, idx) => {
      if (!ld.isUndefined(data[idx + 1]) && item + 1 !== data[idx + 1]) {
        result = false

        return false
      }
    })

    return result
  },

  _findUser: function (data, user) {
    var user = ld.find(data, {user: user})
    return user || {}
  },

  init: function () {
    if (!fs.existsSync(balanceFile)) {
      fs.writeFileSync(balanceFile, {})
    }
    if (!fs.existsSync(jackpotFile)) {
      fs.writeFileSync(jackpotFile, 0)
    }
  },

  jackpot: function () {
    try {
      var jackpotString = fs.readFileSync(balanceFile)
      return parseInt(jackpotString)
    } catch (e) {
      return 0
    }
  },

  ranking: function () {
    var balancedData = this._getBalanceData()

    var sorted = ld.sortBy(balancedData, [
      function (o) { return -parseInt(o.balance) }
    ])

    return ld.map(sorted, o => o.user + ' (' + o.balance + ')')
  },

  play: function (who) {
    var jackpot = parseInt(fs.readFileSync(jackpotFile))
    var balanceData = this._getBalanceData()
    var userData = this._findUser(balanceData, who)
    console.log('userData', userData)

    var lastPlayed = parseInt(ld.get(userData, 'date', 0))
    if (lastPlayed !== 0) {
      var diff = moment().diff(moment(lastPlayed), 'seconds')
      if (diff <= this.playDelayInSeconds) {
        return {
          result: `Too soon, please wait ${this.playDelayInSeconds - diff} seconds`
        }
      }
    }

    var userBalance = parseInt(ld.get(userData, 'balance', 0))
    userBalance = userBalance - this.transactionCost

    var points = 0
    var result = 'nothing'

    var playResult = [
      ld.sample(this._getSymbols()),
      ld.sample(this._getSymbols()),
      ld.sample(this._getSymbols())
    ]

    if (ld.uniq(playResult).length == 2) {
      result = '2_kind'
      points = 25
    }

    var allNumeric = ld.every(playResult, ld.isNumber)
    if (allNumeric) {
      if (this._isRow(playResult) || this._isRow(ld.reverse(ld.clone(playResult)))) {
        result = 'nice_row'
        points = 50
      }
    }

    if (ld.uniq(playResult).length == 1) {
      if (ld.first(playResult) === '$') {
        result = 'mega_jackpot'
        points += jackpot * this.megaMultiplier
      } else {
        result = 'jackpot'
        points += jackpot
      }
      jackpot = 0
    }

    userBalance += points
    ld.set(userData, 'balance', userBalance)
    ld.set(userData, 'user', who)
    ld.set(userData, 'date', moment.now())

    var idx = ld.findIndex(who, balanceData)
    if (idx !== -1) {
      arr.push(userData)
    } else {
      balanceData.splice(idx, 1, userData);
    }

    console.log('balanceData', balanceData)
    console.log('balanceData string', JSON.stringify(balanceData))

    fs.writeFileSync(balanceFile, JSON.stringify(balanceData))

    jackpot += this.transactionCost
    fs.writeFileSync(jackpotFile, jackpot)

    return {
      symbols: playResult,
      result: result,
      points: points,
      balance: userBalance
    }
  }
}

module.exports = slotmachine
