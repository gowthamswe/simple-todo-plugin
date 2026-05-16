document.addEventListener("DOMContentLoaded", function () {
  const taskList = document.getElementById("task-list");
  const taskInputContainer = document.getElementById("task-input-container");

  const newTaskInput = document.createElement("input");
  newTaskInput.id = "new-task";
  newTaskInput.placeholder = "Enter a new task";

  const addTaskButton = document.createElement("button");
  addTaskButton.id = "add-task-button";
  addTaskButton.innerHTML = "+";
  addTaskButton.title = "Add task";

  const hamburgerButton = document.createElement("button");
  hamburgerButton.id = "hamburger-menu";
  hamburgerButton.title = "Menu";
  hamburgerButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>`;

  taskInputContainer.appendChild(newTaskInput);
  taskInputContainer.appendChild(addTaskButton);
  taskInputContainer.appendChild(hamburgerButton);

  const menuPanel = document.createElement("div");
  menuPanel.id = "menu-panel";
  menuPanel.innerHTML = `
    <div class="menu-section">
      <span class="menu-section-label">Theme</span>
      <div class="menu-button-group" data-group="theme">
        <button class="menu-button" data-value="light">Light</button>
        <button class="menu-button" data-value="dark">Dark</button>
      </div>
    </div>
    <div class="menu-section">
      <span class="menu-section-label">Text size</span>
      <div class="menu-button-group" data-group="text-size">
        <button class="menu-button" data-value="small">Small</button>
        <button class="menu-button" data-value="medium">Medium</button>
        <button class="menu-button" data-value="large">Large</button>
      </div>
    </div>
  `;
  document.body.appendChild(menuPanel);

  function setActiveButton(group, value) {
    menuPanel.querySelectorAll(`.menu-button-group[data-group="${group}"] .menu-button`).forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.value === value);
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    setActiveButton("theme", theme);
  }

  function applyTextSize(size) {
    document.documentElement.setAttribute("data-text-size", size);
    setActiveButton("text-size", size);
  }

  applyTheme(document.documentElement.getAttribute("data-theme") || "dark");
  applyTextSize(document.documentElement.getAttribute("data-text-size") || "medium");

  hamburgerButton.addEventListener("click", function (event) {
    event.stopPropagation();
    menuPanel.classList.toggle("open");
  });

  // Close menu on outside click.
  document.addEventListener("click", function (event) {
    if (!menuPanel.contains(event.target) && event.target !== hamburgerButton && !hamburgerButton.contains(event.target)) {
      menuPanel.classList.remove("open");
    }
  });

  menuPanel.addEventListener("click", function (event) {
    const btn = event.target.closest(".menu-button");
    if (!btn) return;
    const group = btn.parentElement.dataset.group;
    const value = btn.dataset.value;
    if (group === "theme") {
      applyTheme(value);
      chrome.storage.local.set({ theme: value });
    } else if (group === "text-size") {
      applyTextSize(value);
      chrome.storage.local.set({ "text-size": value });
    }
  });

  let tasks = [];

  chrome.storage.local.get(["task-list", "theme", "text-size"], (result) => {
    tasks = result["task-list"] || [];
    requestAnimationFrame(() => {
      document.documentElement.classList.add("transitions-enabled");
      if (result.theme) applyTheme(result.theme);
      if (result["text-size"]) applyTextSize(result["text-size"]);
    });
    renderTasks();
    newTaskInput.focus();
  });

  function addTask() {
    const newTaskText = newTaskInput.value.trim();
    if (newTaskText) {
      tasks.push({ name: newTaskText, status: "pending" });
      newTaskInput.value = "";
      saveTasks();
    }
    newTaskInput.focus();
  }

  newTaskInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      addTask();
    }
  });

  addTaskButton.addEventListener("click", addTask);

  function saveTasks() {
    chrome.storage.local.set({ "task-list": tasks }, () => {
      renderTasks();
    });
  }

  function updateTaskText(index, newText) {
    tasks[index].name = newText;
    saveTasks();
  }

  function reorderTasks(sourceIndex, destinationIndex) {
    const [removed] = tasks.splice(sourceIndex, 1);
    tasks.splice(destinationIndex, 0, removed);
    saveTasks();
  }

  function renderTasks() {
    taskList.innerHTML = "";

    if (tasks.length === 0) {
      const empty = document.createElement("li");
      empty.classList.add("empty-state");
      empty.textContent = "No tasks yet";
      taskList.appendChild(empty);
      return;
    }

    tasks.forEach((task, index) => {
      let taskElement = document.createElement("li");
      taskElement.classList.add("task");
      taskElement.draggable = true;

      taskElement.addEventListener("dragstart", function (event) {
        event.dataTransfer.setData("text/plain", index);
        taskElement.classList.add("dragging");
      });

      taskElement.addEventListener("dragend", function () {
        taskElement.classList.remove("dragging");
      });

      taskElement.addEventListener("dragover", function (event) {
        event.preventDefault();
        taskElement.classList.add("drag-over");
      });

      taskElement.addEventListener("dragleave", function () {
        taskElement.classList.remove("drag-over");
      });

      taskElement.addEventListener("drop", function (event) {
        event.preventDefault();
        taskElement.classList.remove("drag-over");
        const droppedIndex = parseInt(event.dataTransfer.getData("text/plain"));
        if (droppedIndex !== index) {
          reorderTasks(droppedIndex, index);
        }
      });

      let checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.status === "completed";
      checkbox.style.marginRight = "5px";
      checkbox.addEventListener("change", function () {
        task.status = checkbox.checked ? "completed" : "pending";
        saveTasks();
      });

      let taskText = document.createElement("span");
      taskText.classList.add("task-text");
      taskText.textContent = task.name;
      taskText.addEventListener("click", function () {
        task.status = task.status === "completed" ? "pending" : "completed";
        saveTasks();
      });
      if (task.status === "completed") {
        taskText.classList.add("completed");
      }

      let editInput = document.createElement("input");
      editInput.classList.add("edit-text");
      editInput.type = "text";
      editInput.value = task.name;
      editInput.style.display = "none";

      let committed = false;
      function commit(save) {
        if (committed) return;
        committed = true;
        if (save) {
          updateTaskText(index, editInput.value);
        } else {
          renderTasks();
        }
      }

      editInput.addEventListener("blur", function () {
        commit(true);
      });
      editInput.addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
          commit(true);
        }
      });
      // Escape must fire on keydown — the browser closes the popup on Escape
      // keydown, so we have to preventDefault before it bubbles.
      editInput.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          commit(false);
        }
      });

      let editButton = document.createElement("span");
      editButton.classList.add("edit-button");
      editButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"><path d="M1.438 16.875l5.688 5.689-7.126 1.436 1.438-7.125zm22.562-11.186l-15.46 15.46-5.688-5.689 15.459-15.46 5.689 5.689zm-4.839-2.017l-.849-.849-12.614 12.599.85.849 12.613-12.599z"/></svg>
      `;
      editButton.addEventListener("click", function () {
        taskText.style.display = "none";
        editInput.style.display = "inline-block";
        editInput.focus();
        editInput.select();
      });

      let deleteButton = document.createElement("span");
      deleteButton.classList.add("delete-button");
      deleteButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
      `;
      deleteButton.addEventListener("click", function () {
        tasks.splice(index, 1);
        saveTasks();
      });

      taskElement.appendChild(checkbox);
      taskElement.appendChild(taskText);
      taskElement.appendChild(editInput);
      taskElement.appendChild(editButton);
      taskElement.appendChild(deleteButton);

      taskList.appendChild(taskElement);
    });
  }
});
