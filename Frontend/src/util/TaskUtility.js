import BaseClass from "./baseClass";
import DataStore from "./DataStore";
import Client from "../api/client";

export default class TaskUtility extends BaseClass {
    constructor(updateDailyTask = () => {}, onUpdateTask = () => {}, onDeleteTask = () => {}, updateTaskCounts = () => {}) {
        super();
        this.bindClassMethods(['mount', 'fetchTasks', 'updateNotifications', 'setupSearch', 'performSearch'], this);
        this.dataStore = new DataStore();
        this.onUpdateTask = onUpdateTask;
        this.onDeleteTask = onDeleteTask;
        this.updateDailyTask = updateDailyTask;
        this.updateTaskCounts = updateTaskCounts;
        this.searchTimeout = null;
    }

    /**
    *   Once the page has loaded, set up the event handlers and fetch the task list.
    */
    async mount() {
        this.client = new Client();
        await this.fetchTasks();
        this.setupSearch();
    }

    /**
    *   Fetch all tasks and update the task counts.
    */
    async fetchTasks() {
        const spinner = document.getElementById("loadingSpinner");
        try {
            this.loadingSpinner(true);
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate a delay

            const taskList = await this.client.getAllTasks(); // Fetch all tasks
            this.dataStore.set("tasks", taskList);

            // Get today's date in local timezone
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayString = today.toISOString().split("T")[0];

            // Filter daily tasks based on the correctly formatted date
            const dailyTasks = taskList.filter((task) => task.taskDueDate === todayString);

            // Calculate analytics
            const totalTasks = taskList.length;
            const completedTasks = taskList.filter((task) => task.status === "Completed").length;
            const inProgressTasks = taskList.filter((task) => task.status === "In Progress").length;
            const canceledTasks = taskList.filter((task) => task.status === "Canceled").length;
            const pendingTasks = taskList.filter((task) => task.status === "Pending").length;
            // Calculate overdue tasks
            const overdueTasks = taskList.filter((task) => {
                const taskDueDate = new Date(task.taskDueDate);
                const taskDueDateString = taskDueDate.toISOString().split("T")[0];
                return taskDueDateString < todayString && task.status !== "Completed";
            }).length;

            // Save analytics data in DataStore
            this.dataStore.set("analytics", {
                totalTasks,
                completedTasks,
                inProgressTasks,
                canceledTasks,
                pendingTasks,
                overdueTasks,
                tasks: taskList
            });

            // Update UI components
            this.updateNotifications(taskList); // Update notifications after fetching tasks
            this.updateDailyTask(dailyTasks); // Update the daily task based on in-progress status
            this.updateTaskCounts(taskList); // Update task counts based on the fetched tasks
            this.renderTasks(taskList); // Call renderTasks to display tasks in the table
            this.renderAnalytics(); // Render analytics
        } catch (error) {
            console.error("Error fetching tasks:", error);
            this.showMessage("Something went wrong while fetching the tasks. Please try again later..");
        } finally {
            this.loadingSpinner(false);
        }
    }

    /**
    * Render analytics in the UI.
    */
    renderAnalytics() {
        const analytics = this.dataStore.get("analytics");
        if (analytics) {
            const totalTasksElement = document.querySelector(".total-tasks");

            if (totalTasksElement) {
                totalTasksElement.textContent = analytics.totalTasks;
            }
        }
    }

    /**
     * Render tasks in the table format.
     * @param {Array} taskList - The list of tasks fetched from the server.
    */
    renderTasks(taskList) {
        const tableBody = document.querySelector(".table-container tbody");
        if (!tableBody) {
            return;
        }
        tableBody.innerHTML = "";

        // Sort tasks by taskDueDate
        taskList.sort((a, b) => new Date(a.taskDueDate) - new Date(b.taskDueDate));

        if (taskList.length === 0) {
            const noDataRow = document.createElement("tr");
            noDataRow.innerHTML = `
                <td colspan="8">
                    All caught up! No tasks for today.. 🎉
                </td>
            `;
            tableBody.appendChild(noDataRow);
        } else {
            taskList.forEach((task, index) => {
                const taskDueDate = new Date(task.taskDueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const taskDueDateString = taskDueDate.toISOString().split("T")[0];
                const todayString = today.toISOString().split("T")[0];

                // Get status color and text
                const { statusColor, statusText } = this.getStatusColorAndText(task.status, taskDueDateString < todayString);

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><h3 class="task-info text-black">${index + 1}</h3></td>
                    <td><h3 class="task-info text-black">${task.title}</h3></td>
                    <td><h3 class="task-info text-black">${task.description}</h3></td>
                    <td><h3 class="task-info text-black">${task.assignedTo}</h3></td>
                    <td style="text-align: center;">
                        <span class="status-text" style="background-color: ${statusColor}; color: white; padding: 3px 8px; border-radius: 3px;">${statusText}</span>
                     </td>
                    <td><h3 class="task-info text-black">${task.priority}</h3></td>
                    <td><h3 class="task-info text-black">${task.taskDueDate}</h3></td>
                    <td>
                        <button type="button" class="update-btn" data-task-id="${task.taskId}"><i class="fa fa-pencil-alt"></i> Update</button>
                        <button type="button" class="delete-btn" data-task-id="${task.taskId}"><i class="fa fa-trash"></i> Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            document.querySelectorAll(".update-btn").forEach((btn) => {
                btn.addEventListener("click", (event) => this.onUpdateTask(event));
            });
            document.querySelectorAll(".delete-btn").forEach((btn) => {
                btn.addEventListener("click", (event) => this.onDeleteTask(event));
            });
        }
    }

    /**
    * Get the status color and text based on the task status and whether it is overdue.
    * @param {string} status - The status of the task.
    * @param {boolean} isOverdue - Whether the task is overdue.
    * @returns {Object} - An object containing the status color and text.
    */
    getStatusColorAndText(status, isOverdue) {
        let statusColor = "";
        let statusText = status;

        // Check if the task is overdue and NOT completed
        if (isOverdue && status !== "Completed") { // <-- Add this check
            // Assign red color and update status text for overdue tasks
            if (status === "In Progress" || status === "Pending") {
                statusColor = "#B52A37"; // Red for overdue In Progress or Pending tasks
                statusText = "Task Overdue"; // Update status text
            } else {
                statusColor = "#B52A37"; // Red for any other overdue tasks
                statusText = "Task Overdue"; // Update status text
            }
        } else {
            // Assign colors based on the status if not overdue
            switch (status) {
                case "Completed":
                    statusColor = "#4CAF50"; // Green
                    break;
                case "In Progress":
                    statusColor = "#FFC107"; // Gold
                    break;
                case "Canceled":
                    statusColor = "#d74a66"; // Orange
                    break;
                case "Pending":
                    statusColor = "#0056b3"; // Blue
                    break;
                default:
                    statusColor = "#808080"; // Default gray
            }
        }
        return { statusColor, statusText };
    }

    /**
     *  Update notifications based on task statuses
    */
    updateNotifications(taskList) {
        const notificationList = document.getElementById("notification-list");
        const messageList = document.getElementById("messageList"); // Keep this for MainPage

        // Check if the notification list exists
        if (!notificationList) {
            return;
        }

        notificationList.innerHTML = "";

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = today.toISOString().split("T")[0];

        let notificationCount = 0;

        // Loop through tasks to generate notifications
        taskList.forEach((task) => {
            const taskDueDateString = task.taskDueDate;
            const isOverdue = taskDueDateString < todayString;

            // Handle 'In Progress' tasks
            if (task.status === "In Progress") {
                if (!isOverdue) {
                    const dueDate = new Date(taskDueDateString);
                    const timeLeft = dueDate - today;

                    if (timeLeft <= 2 * 24 * 60 * 60 * 1000) {
                        // Due soon tasks
                        this.addDropdownNotificationItem(`Task "${task.title}" is approaching its due date.`, notificationList);
                        notificationCount++;
                        if (messageList) {
                            this.addMessageToDashboard(`Task "${task.title}" is approaching its due date.`, messageList);
                        }
                    }
                } else {
                    // Overdue tasks
                    this.addDropdownNotificationItem(`Task "${task.title}" is overdue.`, notificationList);
                    notificationCount++;
                    if (messageList) {
                        this.addMessageToDashboard(`Task "${task.title}" is overdue.`, messageList);
                    }
                }
            }

            // Handle completed tasks
            if (task.status === "Completed") {
                this.addDropdownNotificationItem(`Task "${task.title}" has been completed.`, notificationList);
                notificationCount++;
                if (messageList) {
                    this.addMessageToDashboard(`Task "${task.title}" has been completed.`, messageList);
                }
            }

            // Handle canceled tasks
            if (task.status === "Canceled") {
                this.addDropdownNotificationItem(`Task "${task.title}" has been canceled.`, notificationList);
                notificationCount++;
                if (messageList) {
                    this.addMessageToDashboard(`Task "${task.title}" has been canceled.`, messageList);
                }
            }
        });

        // If no notifications, display a message in the dropdown
        if (notificationCount === 0) {
            const noNotificationsItem = document.createElement("li");
            noNotificationsItem.classList.add("notification-item");
            noNotificationsItem.textContent = "No notifications available at this time.";
            notificationList.appendChild(noNotificationsItem);
        }

        // Check if there are no messages in the message list
        if (messageList && messageList.children.length === 0) {
            const noMessagesItem = document.createElement("li");
            noMessagesItem.classList.add("message-item");
            noMessagesItem.textContent = "No messages available at this time.";
            messageList.appendChild(noMessagesItem);
        }

        // Update the notification count on the dropdown icon
        this.updateNotificationCount(notificationCount);
    }

    /**
    *   Adds a notification item to the dropdown list.
    */
    addDropdownNotificationItem(message, notificationList) {
        const dropdownItem = document.createElement("li");
        dropdownItem.classList.add("notification-item");
        dropdownItem.textContent = message;
        notificationList.appendChild(dropdownItem);
    }

    /**
    *   Adds a message to the dashboard message list.
    */
    addMessageToDashboard(message, messageList) {
        const messageItem = document.createElement("li");
        messageItem.classList.add("message-item");
        messageItem.textContent = message;
        messageList.appendChild(messageItem);
    }

    /**
    *   Updates the notification count displayed in the UI.
    */
    updateNotificationCount(count) {
        const notificationCount = document.getElementById("notification-count");
        notificationCount.textContent = count > 0 ? count : "";
        notificationCount.style.display = count > 0 ? "inline-block" : "none";
    }

    /**
    *   Sets up the search input and adds an event listener to perform a search as the user types.
    */
    setupSearch() {
        const searchInput = document.getElementById("search-input");
        const clearIcon = document.querySelector(".clear"); // Select the clear icon

        if (searchInput) {
            searchInput.addEventListener("input", (event) => {
                this.performSearch(event.target.value);

                // Show or hide the clear icon based on input
                if (event.target.value.length > 0) {
                    clearIcon.style.display = "block"; // Show the clear icon
                } else {
                    clearIcon.style.display = "none"; // Hide the clear icon
                }
            });
        }

        // Clear the search input when the clear icon is clicked
        if (clearIcon) {
            clearIcon.addEventListener("click", () => {
                searchInput.value = ""; // Clear the input field
                clearIcon.style.display = "none"; // Hide the clear icon
                this.performSearch(""); // Perform search with empty query
            });
        }
    }

    /**
    *   Performs a search on tasks based on the query and updates the displayed task list.
    */
    performSearch(query) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            const taskList = this.dataStore.get("tasks");

            // Get today's date for comparison
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayString = today.toISOString().split("T")[0];

            // Filter tasks based on the query
            const filteredTasks = taskList.filter(task => {
                const taskDueDate = new Date(task.taskDueDate);
                const taskDueDateString = taskDueDate.toISOString().split("T")[0];
                const isOverdue = taskDueDateString < todayString; // Check if task is overdue

                // **Override status dynamically based on overdue condition**
                let effectiveStatus = task.status; // Use the original status from the database
                if (isOverdue && task.status !== "Completed") {
                    effectiveStatus = "Overdue"; // Dynamically treat overdue tasks as 'Overdue'
                }

                // Match search query against task properties
                const matchesQuery =
                task.title.toLowerCase().includes(query.toLowerCase()) ||
                task.description.toLowerCase().includes(query.toLowerCase()) ||
                task.assignedTo.toLowerCase().includes(query.toLowerCase()) ||
                effectiveStatus.toLowerCase().includes(query.toLowerCase()); // Use dynamic status here

                // Handle specific status filters based on query
                if (query.toLowerCase() === "overdue") {
                    // Only return tasks dynamically marked as 'Overdue'
                    return effectiveStatus === "Overdue";
                } else if (query.toLowerCase() === "canceled") {
                    // Only return canceled tasks that are NOT overdue
                    return task.status === "Canceled" && !isOverdue;
                } else if (query.toLowerCase() === "completed") {
                    // Return tasks marked as Completed
                    return task.status === "Completed";
                } else if (query.toLowerCase() === "in progress") {
                    // Return tasks marked as In Progress and not overdue
                    return task.status === "In Progress" && !isOverdue;
                } else if (query.toLowerCase() === "pending") {
                    // Return tasks marked as Pending and not overdue
                    return task.status === "Pending" && !isOverdue;
                }

                // General search for other queries
                return matchesQuery;
            });

            // Update task counts and render filtered tasks
            this.updateTaskCounts(filteredTasks);
            this.renderTasks(filteredTasks);
        }, 300);
    }

    /**
    *   Performs loading spinner visibility
    */
    loadingSpinner(show) {
        const spinner = document.getElementById("loadingSpinner");
        if (show) {
            spinner.style.display = "block";
        } else {
            spinner.style.display = "none";
        }
    }
}