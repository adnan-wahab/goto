var vows = require('vows')
  , goto = require('./goto')


vows.describe('goto').addBatch({
  oneBigTest: {
    topic: goto.scheduler(),
    itworks: function (current_scheduler) {
      function current_coro(){
        return current_scheduler.current_coroutine()
      }
      var running = true
      function ack(m, n) {
        if (! running) return
        if (m == 0) yield (n +1); return
        if (m > 0 && n == 0) {
          for (i in ack(m-1, 1)) yield(false)
          yield(i)
        }

        if (m > 0 && n > 0) {
          for (i in ack(m, n-1)) yield(false)
          var t = 1
          for (i in ack(m-1, t)) yield(false)
          yield(i)
        }
      }

      function a(a1, a2){
        function p(a1, a2){
          console.log('hey brah hey brah hey brah'), yield(false)
          console.log(a1), yield(false)
          console.log(a2), yield(false)
          console.log('='), yield(false)
          console.log(i), yield(false)
        }
        for (var i in ack(a1, a2)) yield(false)
        print_monitor.run_protected(current_coro(), p, a1, a2)
      }

      function watchdog() {
        current_coro().sleep(600)
        running = false
        yield(false)
      }

      var print_monitor = goto.monitor()
      var count = 0, i, j
      for (i = -1; ++i < 100;)
        for (j = -1; ++j < 100;) {
          count += 1
          var cr1 = goto(current_scheduler, a, i, j)
          current_scheduler.addcoro(cr1)
        }

      for (i = -1; ++i < 100; )
        for (j = -1; ++j < 100; ) {
          count +=1
          var cr1 = goto(current_scheduler, a, i, j)
          current_scheduler.addcoro(cr1)
        }
      current_scheduler.add_coro(goto(current_scheduler, watchdog))
      console.log('starting the run of ' + count + 'coroutines')
      current_scheduler.run()
    }
  }
}).export(module)
