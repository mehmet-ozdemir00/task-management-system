import TaskUtility from "../util/TaskUtility";
import BaseClass from "../util/baseClass";
import DataStore from "../util/DataStore";
import Client from "../api/client";

class MainPage extends BaseClass {
    constructor() {
        super();
        this.bindClassMethods(['mount', 'addEventListeners', 'updateDailyTask', 'onCreateTask', 'handleSubmitTask', 'closeAddTaskModal'], this);
        this.dataStore = new DataStore();
        this.taskUtility = new TaskUtility(this.updateDailyTask);
    }

    /**
    *   Once the page has loaded, set up the event handlers and fetch the task list.
    */
    async mount() {
        this.client = new Client();
        await this.taskUtility.mount();
        this.addEventListeners();
        this.setGreetingMessage();
    }

    /**
     *  Add event listeners method
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
            if ( !notificationDropdown.contains(event.target) && !notificationIcon.contains(event.target)) {
                notificationDropdown.classList.remove("active");
            }
        });

        // Prevent dropdown from closing if clicked inside it
        notificationDropdown.addEventListener("click", (event) => {
            event.stopPropagation();
        });

        // Add listener for Add Task button
        const addTaskButton = document.getElementById("addTaskButton");
        if (addTaskButton) {
            addTaskButton.addEventListener("click", (event) => {
                this.onCreateTask(event);
            });
        }
    }

    /**
    *   Update the daily task summary with the number of tasks for today that are "In Progress."
    *   @param {Array} dailyTasks - The list of tasks for today.
    */
    updateDailyTask(dailyTasks) {
        const taskSummary = document.getElementById("daily-task-summary");
        if (taskSummary) {
            // Filter tasks for today that are "In Progress"
            const inProgressTasks = dailyTasks.filter((task) => task.status === "In Progress");

            if (inProgressTasks.length > 0) {
                taskSummary.innerHTML = `
                    <p class="text"><span class="today-icon">📌 Today</span></p>
                    <p class="text">Hello, Mehmet!</p>
                    <p class="text">You have <strong class="task-count">${inProgressTasks.length}</strong> task(s) in progress today..</p>
                    <p class="text">Stay focused and keep up the good work! 💪</p>
                `;
            } else {
                taskSummary.innerHTML = `
                    <p class="text"><span class="today-icon">📌 Today</span></p>
                    <p class="text">Hello, Mehmet!</p>
                    <p class="text">There are no task(s) in progress for today..</p>
                    <p class="text">You may also want to consider planning for your upcoming tasks.. 📅</p>
                `;
            }
        }
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
        const cancelButton = document.getElementById("confirmCancel");

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
            this.showMessage("Creating task, Please wait...");

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
    * Set dynamic greeting message based on the time of day.
    */
    setGreetingMessage() {
        const greetingMessage = document.getElementById('greetingMessage');
        const hours = new Date().getHours();

        // Display appropriate greeting message based on the time of day
        if (greetingMessage) {
            if (hours >= 6 && hours < 12) {
                greetingMessage.textContent = "Good Morning!";
            } else if (hours >= 12 && hours < 17) {
                greetingMessage.textContent = "Good Afternoon!";
            } else if (hours >= 17 && hours < 24) {
                greetingMessage.textContent = "Good Evening!";
            } else {
                greetingMessage.textContent = "Good Night!";
            }
        }
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
 *   Main method to run when the page contents have loaded.
*/
const main = async () => {
    const mainPage = new MainPage();
    mainPage.mount();
};

// Ensure the modal is closed when the page reloads or refreshes
window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("modalOverlay").style.display = "none";
    document.getElementById("addTaskModal").style.display = "none";
    document.getElementById("loadingSpinner").style.display = "none";
});

window.addEventListener('DOMContentLoaded', main);