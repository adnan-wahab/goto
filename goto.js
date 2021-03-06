var Heap = require('./heap')

module.exports = goto
goto.scheduler = scheduler
goto.monitor = monitor

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

        while (running.length) {
          try {
            for (var next in running) running[next][1]()
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
    return i
  } finally {
    this.sem.release()
  }
}

function remove (arr, item) {
   return arr
}