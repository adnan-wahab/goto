function goto (){
  this.iterator = function () {}
  this.scheduler = scheduler
}

goto.prototype =
  { suspend: function () {
      this.scheduler.suspend(this)
      yield(false)
    }
  , activate: function () {
      this.scheduler.activate(this)
      yield(false)
    }
  , sleep: function (time) {
      this.scheduler.sleep(time)
      yield(false)
    }
  }

function scheduler() {
  this.running = []
  this.running_coro = []
  this.running_coro_map = {}

  this.suspended = []

  this.waiting_suspend = []

  this.waiting_running = []
  this.timequeue = new Heap();

  this.event = false
}

scheduler.prototype =
  { add_coro: function (coro) {
      this.suspended.push(coro)
      this.activate(coro)
    }

  , suspend: function (coro) {
      this.event = true
      this.waiting_suspend.push(coro)
    }

  , activate: function (coro) {
      this.event = true
      this.waiting_activate.push(coro)
    }

  , sleep: function (coro, time) {
      var item = [new Date + time, coro]
      this.timequeue.push(item)
      this.suspend(coro)
    }

  , runat: function (coro, time) {
      this.sleep(coro, time - new Date)
    }

  , handle_events: function () {
      this.event = false

      if (this.waiting_suspend){
        this.waiting_suspend.forEach(function (c) { this.suspended.push(c) }, this)

        this.waiting_suspend.forEach(function (c) {
          var index = this.running_coro_map[c]
          this.remove_coro_from_running_list(index)
        }, this)

        this.waiting_suspend = []
      }

      if (self.waiting_activate) {
        this.waiting_activate.forEach(function (c) {
          remove(this.suspended, c)
          this.running_coro_map[c] = this.running.length
          this.running.append(c.iterator.next)
          this.running.append(c)
        }, this)
        this.waiting_activate = []
      }
    }
  , remove_coro_from_running_list: function (index) {
      var c = this.running_coro[index]
      delete this.running[this.index]
      delete this.running_coro[index]
      delete this.running_coro_map[c]
    }

  , pop_timequeue: function () {
      var coro = this.timequeue.pop()[1]
      this.activate(coro)
    }
  , run: function () {
      var running = this.running
        , running_coro = this.running_coro
        , timequeue = this.timequeue

      this.event = true
      while(running || timequeue || this.event) {
        this.handle_events()

        while (running) {
          try {
            for (var next in enumerate(running)) next[1]()
          } catch(e) {
            this.remove_coro_from_running_list(this.index)
          }
          while (timequeue && timequeue[0][0] <= + new Date)
            this.pop_timequeue()

          this.event && this.handle_events()
        }
        if (timequeue) {
          var sleeptime = timequeue[0][0] - new Date
          this.sleep(sleeptime)
          self.pop_timequeue()
        }
      }

    },

    current_coro: function () {
      return this.running_coro[this.index]
    }
  }


function semaphore() {
  this.free = true
  this.waiting = []
}

semaphore.prototype =
  { acquire: function (coro){
      if (this.free) return this.free = false
      coro.suspend()
      this.waiting.push(coro)
    }
  , release: function () {
      if (! this.wating.length) this.free = true
      else this.waiting.pop().activate()
    }
  }

function monitor(){
  this.sem = new semaphore()
}

monitor.prototype.run_protected = function (coro, fn) {
  this.sem.acquire(coro)
  try {
    for (var i in fn.apply(this, [].slice.call(arguments, 2))) continue
  } finally {
    this.sem.release()
  }
}

var current_scheduler = scheduler()

function current_coro(){
  return current_scheduler.current_coroutine()
}

function test() {
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
      t = 1
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

  var print_monitor = monitor()
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

function remove (arr, item) {
  arr.splice(arr.indexOf(item), 1)
  return arr
}

function Heap() {

}

function enumerate() {

}
