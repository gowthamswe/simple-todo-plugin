document.addEventListener("DOMContentLoaded", function () {
  const taskList = document.getElementById("task-list");

  const taskInputContainer = document.getElementById("task-input-container");

  const newTaskInput = document.createElement("input");
  newTaskInput.id = "new-task";
  newTaskInput.placeholder = "Enter a new task";

  addTaskButton = document.createElement("button");
  addTaskButton.id = "add-task-button";
  addTaskButton.innerHTML = "Add";

  taskInputContainer.appendChild(newTaskInput);
  taskInputContainer.appendChild(addTaskButton);

  let tasks = JSON.parse(localStorage.getItem("task-list")) || [];

  newTaskInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      let newTaskText = newTaskInput.value.trim();
      if (newTaskText) {
        tasks.push({ name: newTaskText, status: "pending" });
        saveTasks();
        newTaskInput.value = "";
      }
    }
  });

  // Event listener for the add button click
  addTaskButton.addEventListener("click", function () {
    const newTaskText = newTaskInput.value.trim();
    if (newTaskText) {
      tasks.push({ name: newTaskText, status: "pending" });
      saveTasks();
      newTaskInput.value = "";
    }
  });

  function saveTasks() {
    localStorage.setItem("task-list", JSON.stringify(tasks));
    // chrome.storage.local.set("task-list", JSON.stringify(tasks));
    renderTasks();
  }

  function updateTaskText(index, newText) {
    tasks[index].name = newText;
    saveTasks();
    renderTasks();
  }

  function renderTasks() {
    taskList.innerHTML = "";
    tasks.forEach((task, index) => {
      let taskElement = document.createElement("li");
      taskElement.classList.add("task");
      taskElement.draggable = true;

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
      editInput.addEventListener("blur", function () {
        updateTaskText(index, editInput.value);
      });
      editInput.addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
          updateTaskText(index, editInput.value);
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
      });

      let deleteButton = document.createElement("span");
      deleteButton.classList.add("delete-button");
      deleteButton.innerHTML = `
      <svg xmlns="XXXXXXXXXXXXXXXXXXXXXXXXXX" width="20" height="20" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
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

  renderTasks();
});
