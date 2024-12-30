import TaskUtility from "../util/TaskUtility";
import BaseClass from "../util/baseClass";
import DataStore from "../util/DataStore";
import Client from "../api/client";

class ProjectPage extends BaseClass {
    constructor() {
        super();
        this.bindClassMethods(['mount', 'updateNotifications', 'addEventListeners', 'onUpdateTask', 'saveUpdatedTask',
            'onDeleteTask', 'onGetAllTasks', 'onGetCompletedTasks', 'onGetIncompleteTasks', 'onGetCanceledTasks',
            'onGetOverdueTasks', 'closeModal', 'onCreateTask', 'handleSubmitTask', 'closeAddTaskModal'], this);
        this.dataStore = new DataStore();
        this.taskUtility = new TaskUtility(() => {}, this.onUpdateTask, this.onDeleteTask);
    }

    /**
    *  Once the page has loaded, set up the event handlers and fetch the task list.
    */
    async mount() {
        this.client = new Client();
        await this.taskUtility.mount();
        const tasks = await this.client.getAllTasks();
        this.dataStore.set("tasks", tasks);
        this.addEventListeners();
    }

    /**
    *   Add event listeners for buttons and actions.
    */
    addEventListeners() {
        const notificationIcon = document.getElementById("notification-icon");
        const notificationDropdown = document.getElementById("notification-dropdown");

        // Toggle dropdown visibility on click
        if (notificationIcon) {
            notificationIcon.addEventListener("click", (event) => {
                event.stopPropagation();
                notificationDropdown.classList.toggle("active");
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener("click", (event) => {
            if (!notificationDropdown.contains(event.target) && !notificationIcon.contains(event.target)) {
                notificationDropdown.classList.remove("active");
            }
        });

        // Prevent dropdown from closing if clicked inside it
        notificationDropdown.addEventListener("click", (event) => { event.stopPropagation(); });

        // Task filter buttons
        const addTaskButton = document.getElementById("addTaskButton");
        if (addTaskButton) addTaskButton.addEventListener("click", this.onCreateTask);

        const retrieveTasksButton = document.getElementById("retrieveTasksBtn");
        if (retrieveTasksButton) retrieveTasksButton.addEventListener("click", this.onGetAllTasks);

        const completedTasksButton = document.getElementById("completedTasksBtn");
        if (completedTasksButton) completedTasksButton.addEventListener("click", this.onGetCompletedTasks);

        const incompleteTasksButton = document.getElementById("incompleteTasksBtn");
        if (incompleteTasksButton) incompleteTasksButton.addEventListener("click", this.onGetIncompleteTasks);

        const cancelTasksButton = document.getElementById("cancelTasksBtn");
        if (cancelTasksButton) cancelTasksButton.addEventListener("click", this.onGetCanceledTasks);

        const overdueTasksButton = document.getElementById("overdueTasksBtn");
        if (overdueTasksButton) overdueTasksButton.addEventListener("click", this.onGetOverdueTasks);
    }

    /**
     * Handle the creating of a task.
     * @param {Event} event - The click event on the submit button.
     */
    async onCreateTask(event) {
        // Prevent the page from refreshing on form submit
        event.preventDefault();

        const modal = document.getElementById("addTaskModal");
        const overlay = document.getElementById("modalOverlay");
        modal.style.display = "flex";
        overlay.style.display = "flex";

        // Event listeners for Submit and Cancel buttons
        const submitButton = document.getElementById("confirmSubmit");
        const cancelButton = document.getElementById("cancelCancel");

        // Close modal when clicking outside
        overlay.addEventListener("click", () => this.closeAddTaskModal());

        // Close modal with Escape key
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                this.closeAddTaskModal();
            }
        });

        // Remove any previous listeners and add new ones
        submitButton.removeEventListener("click", this.handleSubmitTask);
        submitButton.addEventListener("click", async (event) => {
            event.preventDefault();
            await this.handleSubmitTask();
        });

        cancelButton.removeEventListener("click", this.closeAddTaskModal);
        cancelButton.addEventListener("click", (event) => {
            event.preventDefault();
            this.closeAddTaskModal();
        });
    }

    // Method to handle task submission
    async handleSubmitTask() {
        try {
            this.taskUtility.loadingSpinner(true);

            // Retrieve task details from input fields
            const taskName = document.getElementById("addTaskTitle").value;
            const taskDescription = document.getElementById("addTaskDescription").value;
            const assignedTo = document.getElementById("addTaskAssignedTo").value;
            const status = document.getElementById("addTaskStatus").value;
            const priority = document.getElementById("addTaskPriority").value;
            const taskDueDate = document.getElementById("addTaskDueDate").value;

            // Validate input
            if (!taskName.trim() || !taskDescription.trim() || !assignedTo.trim() || !status || !priority || !taskDueDate) {
                this.errorHandler("All fields must be completed with valid information.");
                return;
            }

            // Validate due date
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayString = today.toISOString().split("T")[0];
            if (taskDueDate < todayString) {
                this.errorHandler("Please enter a valid future due date.");
                this.showWarning("Due dates cannot be in the past.");
                return;
            }

            // Create the task object
            const newTask = {
                title: taskName,
                description: taskDescription,
                assignedTo: assignedTo,
                status: status,
                priority: priority,
                taskDueDate: taskDueDate,
            };

            // Close the modal after task creation
            this.closeAddTaskModal();
            this.showMessage("Creating task, please wait..");

            // Make an API call to create the task
            await this.client.createTask(newTask);

            // After task is created, hide the loading message
            this.showMessage("The task has been created.");

            // Refresh the task list after task is created
            await this.taskUtility.fetchTasks();
        } catch (error) {
            console.error("Error creating task:", error);
            this.showMessage("Something went wrong while creating the task.. Please try again later!");
        } finally {
            this.taskUtility.loadingSpinner(false);
        }
    }

    /**
     * Handle the update of a task.
     * @param {Event} event - The click event on the update button.
     */
    async onUpdateTask(event) {
        // Prevent the page from refreshing on form submit
        event.preventDefault();

        // Get taskId from the button's data attribute
        const taskId = event.target.getAttribute("data-task-id");
        const taskList = this.dataStore.get("tasks");
        const task = taskList.find((t) => t.taskId === taskId);

        if (task) {
            // Prefill the update form with the task details
            document.getElementById("taskTitle").value = task.title;
            document.getElementById("taskDescription").value = task.description;
            document.getElementById("taskAssignedTo").value = task.assignedTo;
            document.getElementById("taskStatus").value = task.status;
            document.getElementById("taskPriority").value = task.priority;
            document.getElementById("taskDueDate").value = task.taskDueDate;

            // Open modal
            const modal = document.getElementById("updateTaskModal");
            const overlay = document.getElementById("modalOverlay");
            modal.style.display = "flex";
            overlay.style.display = "flex";

            // Close modal when clicking outside
            overlay.addEventListener("click", () => this.closeModal(modal, overlay));

            // Close modal with Escape key
            document.addEventListener("keydown", (event) => {
                if (event.key === "Escape") {
                    this.closeModal(modal, overlay);
                }
            });

            // Confirm update button
            const confirmUpdate = document.getElementById("confirmUpdate");
            confirmUpdate.removeEventListener("click", this.saveUpdatedTask);
            confirmUpdate.addEventListener("click", async () => {
                this.closeModal(modal, overlay);
                await this.saveUpdatedTask(taskId);
            });

            // Cancel button
            const confirmCancel = document.getElementById("confirmCancel");
            confirmCancel.removeEventListener("click", this.closeModal);
            confirmCancel.addEventListener("click", () => this.closeModal(modal, overlay));
        }
    }

    /**
     * Save the updated task.
     * @param {string} taskId - The ID of the task to be updated.
    */
    async saveUpdatedTask(taskId) {
        const updatedTask = {
            taskId: taskId,
            title: document.getElementById("taskTitle").value.trim(),
            description: document.getElementById("taskDescription").value.trim(),
            assignedTo: document.getElementById("taskAssignedTo").value.trim(),
            status: document.getElementById("taskStatus").value.trim(),
            priority: document.getElementById("taskPriority").value.trim(),
            taskDueDate: document.getElementById("taskDueDate").value.trim(),
        };

        // Validate input
        if (!updatedTask.title || !updatedTask.description || !updatedTask.assignedTo || !updatedTask.status || !updatedTask.priority || !updatedTask.taskDueDate) {
            this.errorHandler("All fields must be completed with valid information.");
            return false;
        }

        // Validate due date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = today.toISOString().split("T")[0];

        if (updatedTask.taskDueDate < todayString) {
            this.errorHandler("Please enter a valid future due date.");
            this.showWarning("Due dates cannot be in the past.");
            return false;
        }

        try {
            this.taskUtility.loadingSpinner(true);
            this.showMessage("Updating task, please wait..");
            await this.client.updateTask(taskId, updatedTask); // Call API to update task
            await this.taskUtility.fetchTasks();  // Re-fetch tasks after update

            // Update notifications based on the current state of tasks
            const tasks = this.dataStore.get("tasks");
            await this.taskUtility.updateNotifications(tasks);

            this.showMessage("The task has been updated.");
            return true;
        } catch (error) {
            console.error("Something went wrong while updating the task. Please try again later..");
            this.showMessage("Something went wrong while updating the task.. Please try again later!");
        } finally {
            this.taskUtility.loadingSpinner(false);
        }
    }

    /**
     * Handle the deletion of a task.
     * @param {Event} event - The click event on the delete button.
    */
    async onDeleteTask(event) {
        // Prevent the page from refreshing on form submit
        event.preventDefault();

        // Get taskId from the button's data attribute
        const taskId = event.target.getAttribute("data-task-id");

        // Display confirmation modal
        const modal = document.getElementById("confirmationModal");
        const overlay = document.getElementById("modalOverlay");
        modal.style.display = "flex";
        overlay.style.display = "flex";

        // Close modal when clicking outside
        overlay.addEventListener("click", () => this.closeModal(modal, overlay));

        // Close modal with Escape key
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                this.closeModal(modal, overlay);
            }
        });

        // Confirm and cancel buttons in the modal
        const confirmBtn = document.getElementById("confirmDelete");
        const cancelBtn = document.getElementById("cancelDelete");

        // Confirm delete handler
        confirmBtn.addEventListener("click", async () => {
            this.closeModal(modal, overlay);
            try {
                this.taskUtility.loadingSpinner(true);
                this.showMessage("Deleting task, please wait..");
                await this.client.deleteTask(taskId); // Call API to delete task
                await this.taskUtility.fetchTasks(); // Re-fetch tasks after deletion

                this.showMessage("The task has been deleted.");
            } catch (error) {
                console.error("Error deleting task:", error);
                this.showMessage("Something went wrong while deleting the task.. Please try again later!");
            } finally {
                this.closeModal(modal, overlay);
                this.taskUtility.loadingSpinner(false);
            }
        });

        // Event listener for cancellation
        cancelBtn.addEventListener("click", () => {
            this.closeModal(modal, overlay);
        });
    }

    /**
    * Fetch all tasks from the Client and update the UI.
    */
    async onGetAllTasks(event) {
        // Prevent the page from refreshing on form submit
        event.preventDefault();

        try {
            this.taskUtility.loadingSpinner(true);
            const taskList = await this.client.getAllTasks();

            // Clear the current table rows
            const tableBody = document.querySelector(".table-container tbody");
            tableBody.innerHTML = "";

            // Render tasks in the table format
            await this.taskUtility.renderTasks(taskList);

            // Update notifications based on the fetched tasks using TaskUtility
            this.taskUtility.updateNotifications(taskList);

            this.showMessage("All tasks have been retrieved.");
        } catch (error) {
            console.error("Error fetching tasks:", error);
            this.showMessage("Something went wrong while retrieving the tasks.. Please try again later!");
        } finally {
            this.taskUtility.loadingSpinner(false);
        }
    }

    /**
     * Fetch and display canceled tasks.
     */
    async onGetCanceledTasks(event) {
        // Prevent the page from refreshing on form submit
        event.preventDefault();

        try {
            this.taskUtility.loadingSpinner(true);
            // Fetch all tasks
            const taskList = await this.client.getAllTasks();

            // Get today's date in local timezone
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayString = today.toISOString().split("T")[0];

            // Filter tasks to only include "Canceled" and NOT overdue
            const canceledTasks = taskList.filter(task => {
                const taskDueDate = new Date(task.taskDueDate);
                const taskDueDateString = taskDueDate.toISOString().split("T")[0];
                return task.status === "Canceled" && taskDueDateString >= todayString;
            });

            // Clear the current table rows
            const tableBody = document.querySelector(".table-container tbody");
            tableBody.innerHTML = "";

            if (canceledTasks.length === 0) {
                // Display message if no canceled tasks are available
                const noDataRow = document.createElement("tr");
                noDataRow.innerHTML = `
                <td colspan="8" style="text-align: center; font-style: italic; color: gray; font-size: 20px;">
                    No canceled tasks found.. ✅
                </td>
            `;
                tableBody.appendChild(noDataRow);
            } else {
                // Render only canceled tasks
                await this.taskUtility.renderTasks(canceledTasks);
            }

            // Update notifications based on the fetched tasks
            this.taskUtility.updateNotifications(taskList);

            this.showMessage("Canceled tasks have been retrieved.");
        } catch (error) {
            console.error("Error fetching canceled tasks:", error);
            this.showMessage("Something went wrong while retrieving canceled tasks!");
        } finally {
            this.taskUtility.loadingSpinner(false);
        }
    }

    /**
    * Fetch and display completed tasks.
    * @param {Event} event - The event triggered by the button click.
    */
    async onGetCompletedTasks(event) {
        // Prevent default form submission behavior
        event.preventDefault();

        try {
            this.taskUtility.loadingSpinner(true);
            // Fetch completed tasks
            const completedTasks = await this.client.getCompletedTasks();

            // Clear the current table rows
            const tableBody = document.querySelector(".table-container tbody");
            tableBody.innerHTML = "";

            if (completedTasks.length === 0) {
                // Display message if no completed tasks are available
                const noDataRow = document.createElement("tr");
                noDataRow.innerHTML = `
                <td colspan="8" style="text-align: center; font-style: italic; color: gray; font-size: 20px;">
                    No completed tasks found.. ❌
                </td>
            `;
                tableBody.appendChild(noDataRow);
            } else {
                // If there are completed tasks, render them
                await this.taskUtility.renderTasks(completedTasks);
            }

            // Update notifications based on the fetched tasks
            await this.taskUtility.updateNotifications(await this.client.getAllTasks());

            this.showMessage("Completed tasks have been retrieved.");
        } catch (error) {
            console.error("Error fetching completed tasks:", error);
            this.showMessage("Something went wrong while retrieving completed tasks!");
        } finally {
            this.taskUtility.loadingSpinner(false);
        }
    }

    /**
     * Fetch and display incomplete tasks.
    */
    async onGetIncompleteTasks(event) {
        // Prevent default form submission behavior
        event.preventDefault();

        try {
            this.taskUtility.loadingSpinner(true);
            // Fetch all incomplete tasks
            const incompleteTasks = await this.client.getIncompleteTasks();

            // Get today's date in local timezone
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayString = today.toISOString().split("T")[0];

            // Filter tasks to exclude overdue tasks
            const filteredTasks = incompleteTasks.filter(task => {
                const taskDueDate = new Date(task.taskDueDate);
                const taskDueDateString = taskDueDate.toISOString().split("T")[0];
                return taskDueDateString >= todayString &&
                (task.status === "In Progress" || task.status === "Pending");
            });

            // Clear the current table rows
            const tableBody = document.querySelector(".table-container tbody");
            tableBody.innerHTML = "";

            if (filteredTasks.length === 0) {
                // Display message if no incomplete tasks are available
                const noDataRow = document.createElement("tr");
                noDataRow.innerHTML = `
                <td colspan="8" style="text-align: center; font-style: italic; color: gray; font-size: 20px;">
                    No incomplete tasks found (in progress or pending).. ✍️
                </td>
            `;
                tableBody.appendChild(noDataRow);
            } else {
                // Render filtered tasks in the table format if available
                await this.taskUtility.renderTasks(filteredTasks);
            }

            // Update notifications based on the fetched tasks
            await this.taskUtility.updateNotifications(await this.client.getAllTasks());

            this.showMessage("Incomplete tasks have been retrieved.");
        } catch (error) {
            console.error("Error fetching incomplete tasks:", error);
            this.showMessage("Something went wrong while retrieving incomplete tasks!");
        } finally {
            this.taskUtility.loadingSpinner(false);
        }
    }

    /**
    * Fetch and display overdue tasks.
    */
    async onGetOverdueTasks(event) {
        // Prevent the page from refreshing on form submit
        event.preventDefault();

        try {
            this.taskUtility.loadingSpinner(true);
            // Fetch all tasks
            const taskList = await this.client.getAllTasks();

            // Get today's date in local timezone
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayString = today.toISOString().split("T")[0];

            // Filter tasks to only include those overdue (In Progress, Pending, or Canceled and overdue)
            const overdueTasks = taskList.filter(task => {
                const taskDueDate = new Date(task.taskDueDate);
                const taskDueDateString = taskDueDate.toISOString().split("T")[0];
                return taskDueDateString < todayString && (task.status === "In Progress" || task.status === "Pending" || task.status === "Canceled");
            });

            // Clear the current table rows
            const tableBody = document.querySelector(".table-container tbody");
            tableBody.innerHTML = "";

            if (overdueTasks.length === 0) {
                // Display message if no overdue tasks are available
                const noDataRow = document.createElement("tr");
                noDataRow.innerHTML = `
                <td colspan="8" style="text-align: center; font-style: italic; color: gray; font-size: 20px;">
                    No overdue tasks found.. 👍
                </td>
            `;
                tableBody.appendChild(noDataRow);
            } else {
                // Render only overdue tasks
                await this.taskUtility.renderTasks(overdueTasks);
            }

            // Update notifications based on the fetched tasks
            this.taskUtility.updateNotifications(taskList);

            this.showMessage("Overdue tasks have been retrieved.");
        } catch (error) {
            console.error("Error fetching overdue tasks:", error);
            this.showMessage("Something went wrong while retrieving overdue tasks!");
        } finally {
            this.taskUtility.loadingSpinner(false);
        }
    }

    /**
    *  Update notifications in the ProjectPage context
    *  @param {Array} taskList - The list of tasks to update notifications
    */
    updateNotifications(taskList) {
        // Call the updateNotifications method from TaskUtility
        this.taskUtility.updateNotifications(taskList);
    }

    // Method to close the Add Task modal
    closeAddTaskModal() {
        const modal = document.getElementById("addTaskModal");
        const overlay = document.getElementById("modalOverlay");
        modal.style.display = "none";
        overlay.style.display = "none";

        document.getElementById("addTaskTitle").value = "";
        document.getElementById("addTaskDescription").value = "";
        document.getElementById("addTaskAssignedTo").value = "";
        document.getElementById("addTaskStatus").value = "";
        document.getElementById("addTaskPriority").value = "";
        document.getElementById("addTaskDueDate").value = "";
    }

    /**
     * Close the modal.
     * @param {HTMLElement} modal - The modal element to close.
     * @param {HTMLElement} overlay - The overlay element to close.
     */
    closeModal(modal, overlay) {
        modal.style.display = "none";
        overlay.style.display = "none";
    }
}


/**
*  Main method to run when the page contents have loaded.
*/
const main = async () => {
    const projectPage = new ProjectPage();
    projectPage.mount();
};

// Ensure the modal is closed when the page reloads or refreshes
window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("modalOverlay").style.display = "none";
    document.getElementById("addTaskModal").style.display = "none";
    document.getElementById("updateTaskModal").style.display = "none";
    document.getElementById("confirmationModal").style.display = "none";
    document.getElementById("loadingSpinner").style.display = "none";
});


window.addEventListener('DOMContentLoaded', main);