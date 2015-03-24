var _ = require('underscore')

var Fake = module.exports = {
  CloudWatch: function() {
    this.Namespace = ''
    this.MetricData = []
    this.Calls = []
  },
}

_.extend(Fake.CloudWatch.prototype, {
  putMetricData: function(params, complete) {
    this.Calls = this.Calls.concat(params);
    _.extend(this, params)
    complete(null, {})
  }
})
