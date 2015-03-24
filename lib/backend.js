var AWS  = require('aws-sdk'),
    util = require('util'),
    fmt  = require('fmt'),
    _    = require('underscore')

var l, debug, dumpMessages
var noopLogger = {log: function(){}}

var Backend = module.exports = function(options, time, binder, logger) {
  options = _.defaults(options || {}, {
    client:     new AWS.CloudWatch(),
    dimensions: {},
    namespace:  'unknown',
    debug: false,
    dumpMessages: false,
    exclude: /statsd\./,
    include: null,
    keyTransformMap: {},
  })

  l = logger || noopLogger
  debug = options.debug
  dumpMessages = options.dumpMessages

  this.client = options.client
  this.namespace = options.namespace
  this.dimensions = list_dimensions(options.dimensions)
  this.exclude = options.exclude
  this.include = options.include
  var keyTransformMap = []
  _.each(options.keyTransformMap, function(value, key){
    keyTransformMap.push({pattern: new RegExp(key), replace: value});
  })
  this.keyTransformMap = keyTransformMap

  this.stats = {
    last_flush: time,
    last_exception: time,
  }

  if (binder) {
    binder(_.bind(this.flush, this), _.bind(this.status, this))
  }
}

_.extend(Backend.prototype, {
  flush: function(time, metrics) {
    var date = new Date(time * 1000)
    var data = _.union(
      this.collect_timers(date, metrics.timers, this.dimensions),
      this.collect_counters(date, metrics.counters, this.dimensions),
      this.collect_gauges(date, metrics.gauges, this.dimensions))

    if (data.length == 0)
      return

    // Split up the metrics into groups of a max size of 20 metrics
    // so cloudwatch is happy
    chunkedData = _.groupBy(data, function(element, index) {
      return Math.floor(index / 20);
    });

    var stats = this.stats;
    var namespace = this.namespace;
    var client = this.client;

    _.each(_.toArray(chunkedData), function(metrics) {
      var params = {
        Namespace: namespace,
        MetricData: metrics
      }

      client.putMetricData(params, function(err, data) {
        err ? report_error(err, stats) : report_success(params, stats)
      });
    });

  },

  status: function(callback) {
    for (var key in this.stats) {
      callback(null, 'cloudwatch', key, this.stats[key])
    }
  },

  collect_timers: function(date, timers, dimensions) {
    return this.collect_stats(date, timers, dimensions, 'Milliseconds')
  },

  collect_stats: function(date, samples, dimensions, unit) {
    var metrics = []
    _.each(this.filter_metrics(samples), function(value, key){
      var data = value.length
        ? value : [0]

      var values = {
        Minimum:     _.min(data),
        Maximum:     _.max(data),
        Sum:         _.reduce(data, function(memo, num) { return memo + num }, 0),
        SampleCount: data.length
      }

      metrics.push({ MetricName: key, StatisticValues: values, Unit: unit,
        Timestamp: date, Dimensions: dimensions
      })
    })

    return metrics
  },

  collect_counters: function(date, counters, dimensions) {
    return this.collect_stats(date, counters, dimensions, 'Count')
  },

  collect_gauges: function(date, gauges, dimensions) {
    return this.collect_stats(date, gauges, dimensions, 'None')
  },

  filter_metrics: function(metrics) {
    var result = {}
    var that = this
    _.each(metrics || {}, function(value, key) {
      if (that.exclude && that.exclude.test(key)) {
        return;
      }

      if (that.include && !that.include.test(key)) {
        return;
      }

      if (that.keyTransformMap) {
        _.each(that.keyTransformMap, function(transform){
          key = key.replace(transform.pattern, transform.replace || "");
        })
      }
      result[key] = result[key] || []
      value = _.isArray(value) ? value : [value]
      result[key] = result[key].concat(value)
    })
    return result
  }
})

function list_dimensions(dimensions) {
  var results = [], keys = _.keys(dimensions)
  _.each(keys, function(key) {
    var value = dimensions[key]
    if (value && value != '')
      results.push({ 'Name': key, 'Value': dimensions[key] })
  })

  return results
}

function report_success(metric_params, stats) {
  stats.last_flush = Math.round(new Date().getTime() / 1000)

  if (!dumpMessages) return
  var data = metric_params.MetricData
  var counters = _.where(data, { Unit: 'Count' }),
      timers = _.where(data, { Unit: 'Milliseconds' }),
      gauges = _.where(data, { Unit: 'None' })

  var s = 'cloudwatch recieved ' +
    counters.length + ' counters, ' +
    timers.length + ' timers, and ' +
    gauges.length + ' gauges'

   l.log(s)
}

function report_error(err, stats) {
  stats.last_exception = Math.round(new Date().getTime() / 1000)
  l.log('cloudwatch ' + err.code + ': ' + err.message)
  if (dumpMessages) fmt.dump(err)
}
