var now = new Date(2011, 1, 1)

module.exports = {
  now: now,
  timestamp: now.getTime() / 1000,
  counters: {
    'api.request_count': 100,
    'statsd.bad_lines_seen': 0,
    'statsd.packets_received': 50,
  },
  timers: {
    'api.request_time': [0, 1, 2, 3, 4]
  },
  gauges: {
    'api.number_sessions': 50,
    'statsd.timestamp_lag': 0
  },
  keyTransformMap: {
    'number_sessions': 'num_sessions'
  },
  lotsOfGauges: {
    'api.number_sessions1': 50,
    'api.number_sessions2': 50,
    'api.number_sessions3': 50,
    'api.number_sessions4': 50,
    'api.number_sessions5': 50,
    'api.number_sessions6': 50,
    'api.number_sessions7': 50,
    'api.number_sessions8': 50,
    'api.number_sessions9': 50,
    'api.number_sessions10': 50,
    'api.number_sessions11': 50,
    'api.number_sessions12': 50,
    'api.number_sessions13': 50,
    'api.number_sessions14': 50,
    'api.number_sessions15': 50,
    'api.number_sessions16': 50,
    'api.number_sessions17': 50,
    'api.number_sessions18': 50,
    'api.number_sessions19': 50,
  }
}
