(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Global namespace
  // ---------------------------------------------------------------------------
  var Dashboard = {};
  window.Dashboard = Dashboard;

  Dashboard.STORAGE_KEYS = {
    TASKS: "tld.tasks",
    LINKS: "tld.links"
  };

  // ---------------------------------------------------------------------------
  // Pure logic: greeting
  // ---------------------------------------------------------------------------
  Dashboard.greeting = {
    getGreeting: function (hour) {
      if (hour >= 5 && hour <= 11) {
        return "Good Morning";
      }
      if (hour >= 12 && hour <= 16) {
        return "Good Afternoon";
      }
      if (hour >= 17 && hour <= 20) {
        return "Good Evening";
      }
      return "Good Night";
    }
  };

  // ---------------------------------------------------------------------------
  // Pure logic: time formatting
  // ---------------------------------------------------------------------------
  Dashboard.time = {
    formatTime: function (date) {
      function pad(n) {
        return n < 10 ? "0" + n : "" + n;
      }
      return (
        pad(date.getHours()) +
        ":" +
        pad(date.getMinutes()) +
        ":" +
        pad(date.getSeconds())
      );
    },
    formatDate: function (date) {
      return (
        date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear()
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Pure logic: timer MM:SS formatting
  // ---------------------------------------------------------------------------
  Dashboard.timerFormat = {
    format: function (seconds) {
      function pad(n) {
        return n < 10 ? "0" + n : "" + n;
      }
      var minutes = Math.floor(seconds / 60);
      var secs = seconds % 60;
      return pad(minutes) + ":" + pad(secs);
    },
    parse: function (display) {
      var parts = display.split(":");
      var minutes = parseInt(parts[0], 10);
      var secs = parseInt(parts[1], 10);
      return minutes * 60 + secs;
    }
  };

  // ---------------------------------------------------------------------------
  // Pure logic: timer state machine
  // ---------------------------------------------------------------------------
  Dashboard.timer = {
    transition: function (state, action) {
      var status = state.status;
      var remaining = state.remaining;

      if (action === "reset") {
        return { status: "idle", remaining: 1500 };
      }

      if (action === "start") {
        if (status === "running") {
          return { status: status, remaining: remaining };
        }
        if ((status === "idle" || status === "paused") && remaining > 0) {
          return { status: "running", remaining: remaining };
        }
        return { status: status, remaining: remaining };
      }

      if (action === "stop") {
        if (status === "running") {
          return { status: "paused", remaining: remaining };
        }
        return { status: status, remaining: remaining };
      }

      if (action === "tick") {
        if (status === "running") {
          if (remaining > 1) {
            return { status: "running", remaining: remaining - 1 };
          }
          if (remaining === 1) {
            return { status: "completed", remaining: 0 };
          }
        }
        return { status: status, remaining: remaining };
      }

      return { status: status, remaining: remaining };
    }
  };

  // ---------------------------------------------------------------------------
  // Pure logic: task text validation
  // ---------------------------------------------------------------------------
  Dashboard.taskValidate = function (text) {
    var trimmed = (text || "").trim();
    if (trimmed.length === 0) {
      return { valid: false, error: "empty", trimmed: "" };
    }
    if (trimmed.length > 200) {
      return { valid: false, error: "too_long", trimmed: trimmed };
    }
    return { valid: true, error: null, trimmed: trimmed };
  };

  // ---------------------------------------------------------------------------
  // Pure logic: quick link validation
  // ---------------------------------------------------------------------------
  Dashboard.linkValidate = function (name, url, count) {
    var trimmedName = (name || "").trim();
    var trimmedUrl = (url || "").trim();
    
    if (trimmedName.length === 0) return { valid: false, error: "empty_name" };
    if (trimmedUrl.length === 0) return { valid: false, error: "empty_url" };
    if (!/^https?:\/\//i.test(trimmedUrl)) return { valid: false, error: "bad_scheme" };
    if (count >= 10) return { valid: false, error: "limit" };

    return { valid: true, error: null, name: trimmedName, url: trimmedUrl };
  };

  // ---------------------------------------------------------------------------
  // Pure logic: serialization (JSON encode/decode)
  // ---------------------------------------------------------------------------
  Dashboard.serialize = {
    tasks: function (list) {
      return JSON.stringify(list);
    },
    parseTasks: function (json) {
      if (!json) return [];
      try {
        return JSON.parse(json);
      } catch (e) {
        return [];
      }
    },
    links: function (list) {
      return JSON.stringify(list);
    },
    parseLinks: function (json) {
      if (!json) return [];
      try {
        return JSON.parse(json);
      } catch (e) {
        return [];
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Service: Storage (localStorage wrapper)
  // ---------------------------------------------------------------------------
  Dashboard.Storage = {
    get: function (key) {
      var val = window.localStorage.getItem(key);
      return val ? val : null;
    },
    set: function (key, value) {
      try {
        window.localStorage.setItem(key, value);
        return true;
      } catch (e) {
        return false;
      }
    },
    remove: function (key) {
      window.localStorage.removeItem(key);
    }
  };

  // ---------------------------------------------------------------------------
  // Controller: GreetingWidget
  // ---------------------------------------------------------------------------
  var greetingIntervalId = null;

  Dashboard.GreetingWidget = {
    init: function (rootEl) {
      var greetingTextEl = rootEl.querySelector(".greeting-text");
      var timeEl = rootEl.querySelector(".time");
      var dateEl = rootEl.querySelector(".date");

      function render() {
        var now = new Date();
        greetingTextEl.textContent = Dashboard.greeting.getGreeting(now.getHours());
        timeEl.textContent = Dashboard.time.formatTime(now);
        dateEl.textContent = Dashboard.time.formatDate(now);
      }

      render();
      greetingIntervalId = window.setInterval(render, 1000);
    },
    stop: function () {
      if (greetingIntervalId !== null) {
        window.clearInterval(greetingIntervalId);
        greetingIntervalId = null;
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Controller: FocusTimer
  // ---------------------------------------------------------------------------
  var timerState = { status: "idle", remaining: 1500 };
  var timerIntervalId = null;
  var timerDisplayEl = null;

  function renderTimer() {
    if (!timerDisplayEl) return;
    timerDisplayEl.textContent = Dashboard.timerFormat.format(timerState.remaining);
    
    if (timerState.status === "completed") {
      timerDisplayEl.classList.add("is-completed");
    } else {
      timerDisplayEl.classList.remove("is-completed");
    }
  }

  function dispatchTimer(action) {
    timerState = Dashboard.timer.transition(timerState, action);
    renderTimer();

    if (timerState.status === "running" && !timerIntervalId) {
      timerIntervalId = window.setInterval(function () {
        dispatchTimer("tick");
      }, 1000);
    } else if (timerState.status !== "running" && timerIntervalId !== null) {
      window.clearInterval(timerIntervalId);
      timerIntervalId = null;
    }
  }

  Dashboard.FocusTimer = {
    init: function (rootEl) {
      timerDisplayEl = rootEl.querySelector(".timer-display");
      var buttons = rootEl.querySelectorAll("button");
      
      buttons[0].addEventListener("click", Dashboard.FocusTimer.start); // Start
      buttons[1].addEventListener("click", Dashboard.FocusTimer.stop);  // Stop
      buttons[2].addEventListener("click", Dashboard.FocusTimer.reset); // Reset
      
      renderTimer();
    },
    start: function () {
      dispatchTimer("start");
    },
    stop: function () {
      dispatchTimer("stop");
    },
    reset: function () {
      dispatchTimer("reset");
    }
  };

  // ---------------------------------------------------------------------------
  // Controller: TodoList
  // ---------------------------------------------------------------------------
  var tasks = [];
  var taskListEl = null;
  var todoErrorEl = null;

  function renderTasks() {
    Dashboard.Storage.set(Dashboard.STORAGE_KEYS.TASKS, Dashboard.serialize.tasks(tasks));
    taskListEl.innerHTML = "";
    
    tasks.forEach(function (task) {
      var li = document.createElement("li");
      li.className = "task-item" + (task.done ? " done" : "");

      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "task-checkbox";
      cb.checked = task.done;
      cb.addEventListener("change", function () {
        Dashboard.TodoList.toggleDone(task.id);
      });

      var span = document.createElement("span");
      span.className = "task-text";
      span.textContent = task.text;

      var actions = document.createElement("div");
      actions.className = "task-actions";

      var btnDel = document.createElement("button");
      btnDel.type = "button";
      btnDel.className = "btn-danger";
      btnDel.textContent = "Delete";
      btnDel.addEventListener("click", function () {
        Dashboard.TodoList.deleteTask(task.id);
      });

      actions.appendChild(btnDel);
      li.appendChild(cb);
      li.appendChild(span);
      li.appendChild(actions);
      taskListEl.appendChild(li);
    });
  }

  Dashboard.TodoList = {
    init: function (rootEl) {
      taskListEl = rootEl.querySelector(".task-list");
      todoErrorEl = rootEl.querySelector(".error-message");
      var form = rootEl.querySelector(".todo-input-form");
      var input = rootEl.querySelector(".todo-input");

      var rawData = Dashboard.Storage.get(Dashboard.STORAGE_KEYS.TASKS);
      tasks = Dashboard.serialize.parseTasks(rawData);
      renderTasks();

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var res = Dashboard.TodoList.addTask(input.value);
        if (res.ok) {
          input.value = "";
          todoErrorEl.textContent = "";
        } else {
          todoErrorEl.textContent = res.error === "empty" ? "Task cannot be empty." : "Task cannot exceed 200 characters.";
        }
      });
    },
    addTask: function (text) {
      var validation = Dashboard.taskValidate(text);
      if (!validation.valid) {
        return { ok: false, error: validation.error };
      }
      tasks.push({
        id: Date.now().toString(),
        text: validation.trimmed,
        done: false
      });
      renderTasks();
      return { ok: true };
    },
    editTask: function (id, text) {
      // Basic implementation for edit (if needed in future)
      return { ok: true };
    },
    toggleDone: function (id) {
      var task = tasks.find(function (t) { return t.id === id; });
      if (task) {
        task.done = !task.done;
        renderTasks();
      }
    },
    deleteTask: function (id) {
      tasks = tasks.filter(function (t) { return t.id !== id; });
      renderTasks();
    }
  };

  // ---------------------------------------------------------------------------
  // Controller: QuickLinks
  // ---------------------------------------------------------------------------
  var links = [];
  var linkListEl = null;
  var linkErrorEl = null;

  function renderLinks() {
    Dashboard.Storage.set(Dashboard.STORAGE_KEYS.LINKS, Dashboard.serialize.links(links));
    linkListEl.innerHTML = "";
    
    links.forEach(function (link) {
      var div = document.createElement("div");
      div.className = "link-item";

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "link-btn";
      btn.textContent = link.name;
      btn.addEventListener("click", function () {
        Dashboard.QuickLinks.openLink(link.id);
      });

      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "link-delete-btn";
      delBtn.textContent = "×";
      delBtn.setAttribute("aria-label", "Delete link");
      delBtn.addEventListener("click", function () {
        Dashboard.QuickLinks.deleteLink(link.id);
      });

      div.appendChild(btn);
      div.appendChild(delBtn);
      linkListEl.appendChild(div);
    });
  }

  Dashboard.QuickLinks = {
    init: function (rootEl) {
      linkListEl = rootEl.querySelector(".link-buttons");
      // Memilih elemen error spesifik pada Quick Links
      linkErrorEl = rootEl.querySelector(".error-message"); 
      var form = rootEl.querySelector(".link-input-form");
      var nameInput = rootEl.querySelector(".link-name-input");
      var urlInput = rootEl.querySelector(".link-url-input");

      var rawData = Dashboard.Storage.get(Dashboard.STORAGE_KEYS.LINKS);
      links = Dashboard.serialize.parseLinks(rawData);
      renderLinks();

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var res = Dashboard.QuickLinks.addLink(nameInput.value, urlInput.value);
        if (res.ok) {
          nameInput.value = "";
          urlInput.value = "";
          linkErrorEl.textContent = "";
        } else {
          var errorMsg = "Invalid input.";
          if (res.error === "empty_name") errorMsg = "Please provide a link name.";
          if (res.error === "empty_url") errorMsg = "Please provide a URL.";
          if (res.error === "bad_scheme") errorMsg = "URL must start with http:// or https://.";
          if (res.error === "limit") errorMsg = "Link limit reached.";
          linkErrorEl.textContent = errorMsg;
        }
      });
    },
    addLink: function (name, url) {
      var validation = Dashboard.linkValidate(name, url, links.length);
      if (!validation.valid) {
        return { ok: false, error: validation.error };
      }
      links.push({
        id: Date.now().toString(),
        name: validation.name,
        url: validation.url
      });
      renderLinks();
      return { ok: true };
    },
    deleteLink: function (id) {
      links = links.filter(function (l) { return l.id !== id; });
      renderLinks();
    },
    openLink: function (id) {
      var link = links.find(function (l) { return l.id === id; });
      if (link) {
        window.open(link.url, "_blank", "noopener");
      }
    }
  };

  // ---------------------------------------------------------------------------
  // DOMContentLoaded wiring
  // ---------------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    Dashboard.GreetingWidget.init(document.getElementById("greeting"));
    Dashboard.FocusTimer.init(document.getElementById("focus-timer"));
    Dashboard.TodoList.init(document.getElementById("todo-list"));
    Dashboard.QuickLinks.init(document.getElementById("quick-links"));
  });
})();