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
            await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate a delay

            const taskList = await this.client.getAllTasks(); // Fetch all tasks
            this.dataStore.set("tasks", taskList);

            // Get today's date in local timezone
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayString = today.toISOString().split("T")[0];

            // Filter daily tasks based on the correctly formatted date
            const dailyTasks = taskList.filter((task) => task.taskDueDate === todayString);

            // Process analytics
            this.processAnalytics(taskList);

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
    * Process and store analytics data.
    * @param {Array} taskList - The list of tasks.
    */
    processAnalytics(taskList) {
        const today = new Date().toISOString().split("T")[0];

        const analytics = {
            tasks: taskList,
            totalTasks: taskList.length,
            completedTasks: taskList.filter((task) => task.status === "Completed").length,
            inProgressTasks: taskList.filter((task) => task.status === "In Progress").length,
            canceledTasks: taskList.filter((task) => task.status === "Canceled").length,
            pendingTasks: taskList.filter((task) => task.status === "Pending").length,
            onHoldTasks: taskList.filter((task) => task.status === "On Hold").length,
            overdueTasks: taskList.filter((task) => {
                const taskDueDate = new Date(task.taskDueDate).toISOString().split("T")[0];
                return taskDueDate < today && task.status !== "Completed";
            }).length,
        };

        // Save analytics data in DataStore
        this.dataStore.set("analytics", analytics);
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
                <td colspan="10" style="text-align: center; font-style: italic; color: gray; font-size: 20px;">
                   You're all caught up! No tasks scheduled for today. 🎉
                </td>
            `;
            tableBody.appendChild(noDataRow);
        } else {
            taskList.forEach((task, index) => {
                // Format createdAt and taskDueDate
                const formattedCreatedAt = this.formatDate(new Date(task.createdAt));
                const taskDueDate = new Date(task.taskDueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const taskDueDateString = taskDueDate.toISOString().split("T")[0];
                const todayString = today.toISOString().split("T")[0];

                const { statusColor, statusText } = this.getStatusColorAndText(task.status, taskDueDateString < todayString);

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><input type="checkbox" class="task-checkbox" data-task-id="${task.taskId}" /></td> <!-- Checkbox -->
                    <td><h3 class="task-info text-black">${index + 1}</h3></td>
                    <td><h3 class="task-info text-black">${task.title}</h3></td>
                    <td><h3 class="task-info text-black">${task.description}</h3></td>
                    <td><h3 class="task-info text-black">${task.assignedTo}</h3></td>
                    <td style="text-align: center;">
                        <span class="status-text" style="background-color: ${statusColor}; color: white; padding: 3px 8px; border-radius: 3px;">${statusText}</span>
                     </td>
                    <td><h3 class="task-info text-black">${task.priority}</h3></td>
                    <td><h3 class="task-info text-black">${formattedCreatedAt}</h3></td>
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

    // Format date to MM-DD-YYYY HH:mm AM/PM
    formatDate(date) {
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };

        return date.toLocaleString('en-US', options).replace(',', '');
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

        // Check if the task is overdue and NOT completed or canceled
        if (isOverdue && status !== "Completed" && status !== "Canceled") {
            if (status === "In Progress" || status === "Pending" || status === "On Hold") {
                statusColor = "#B52A37"; // Overdue color
                statusText = "Task Overdue";
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
                case "On Hold":
                    statusColor = "#808080"; // Gray
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
        const messageList = document.getElementById("messageList");

        // Check if the notification list exists
        if (!notificationList) {
            return;
        }

        notificationList.innerHTML = "";

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = today.toISOString().split("T")[0];

        let notificationCount = 0;

        // Sort tasks by taskDueDate
        taskList.sort((a, b) => new Date(a.taskDueDate) - new Date(b.taskDueDate));

        // Loop through tasks to generate notifications
        taskList.forEach((task) => {
            const taskDueDateString = task.taskDueDate;
            const taskDueDate = new Date(taskDueDateString);
            const isOverdue = taskDueDate < today;

            // Handle 'In Progress' tasks
            if (task.status === "In Progress") {
                if (taskDueDateString === todayString) {
                    // Task due today
                    this.addDropdownNotificationItem(`Task "${task.title}"s due date is today.`, notificationList, true);
                    notificationCount++;
                    if (messageList) {
                        this.addMessageToDashboard(`Task "${task.title}"s due date is today.`, messageList, true);
                    }
                } else if (!isOverdue) {
                    const timeLeft = taskDueDate - today;

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
            // Check if the "No messages" item already exists
            const existingNoMessagesItem = Array.from(messageList.children).some(item => item.textContent === "No messages available at this time.");

            if (!existingNoMessagesItem) {
                const noMessagesItem = document.createElement("li");
                noMessagesItem.classList.add("message-item");
                noMessagesItem.textContent = "No messages available at this time.";

                // Apply custom styles for "No messages" item
                noMessagesItem.style.color = "#666";
                noMessagesItem.style.fontWeight = "400";
                noMessagesItem.style.fontSize = "1.15rem";

                messageList.appendChild(noMessagesItem);
            }
        }

        // Update the notification count on the dropdown icon
        this.updateNotificationCount(notificationCount);
    }

    /**
    *   Adds a notification item to the dropdown list.
    */
    addDropdownNotificationItem(message, notificationList, isDueToday = false) {
        const dropdownItem = document.createElement("li");
        dropdownItem.classList.add("notification-item");
        dropdownItem.textContent = message;

        // If the task is due today, apply red color
        if (isDueToday) {
            dropdownItem.style.color = "red";
        }
        notificationList.appendChild(dropdownItem);
    }

    /**
    *   Adds a message to the dashboard message list.
    */
    addMessageToDashboard(message, messageList, isDueToday = false) {
        // Check if the message already exists in the message list
        const existingMessage = Array.from(messageList.children).some(item => item.textContent === message);

        if (!existingMessage) {
            // Remove "No messages" item if it exists
            const noMessagesItem = Array.from(messageList.children).find(item => item.textContent === "No messages available at this time.");
            if (noMessagesItem) {
                messageList.removeChild(noMessagesItem);
            }

            // Create and add the new message
            const messageItem = document.createElement("li");
            messageItem.classList.add("message-item");
            messageItem.textContent = message;

            if (isDueToday) {
                messageItem.style.color = "red";
                messageItem.style.fontWeight = "bold";
            }

            // Add arrow for normal messages but not for "No messages"
            if (message !== "No messages available at this time.") {
                messageItem.classList.add("with-arrow");
            }

            messageList.appendChild(messageItem);
        }
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
        const clearIcon = document.querySelector(".clear");

        if (searchInput) {
            searchInput.addEventListener("input", (event) => {
                this.performSearch(event.target.value);

                if (event.target.value.length > 0) {
                    clearIcon.style.display = "block";
                } else {
                    clearIcon.style.display = "none";
                }
            });
        }

        // Clear the search input when the clear icon is clicked
        if (clearIcon) {
            clearIcon.addEventListener("click", () => {
                searchInput.value = "";
                clearIcon.style.display = "none";
                this.performSearch("");
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
                const isOverdue = taskDueDateString < todayString;

                let effectiveStatus = task.status;
                if (isOverdue && task.status !== "Completed") {
                    effectiveStatus = "Overdue";
                }

                // Match search query against task properties
                const matchesQuery =
                task.title.toLowerCase().includes(query.toLowerCase()) ||
                task.description.toLowerCase().includes(query.toLowerCase()) ||
                task.assignedTo.toLowerCase().includes(query.toLowerCase()) ||
                effectiveStatus.toLowerCase().includes(query.toLowerCase());

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

                return matchesQuery;
            });

            // Update task counts and render filtered tasks
            this.updateTaskCounts(filteredTasks);
            this.renderTasks(filteredTasks);

            // Show warning if no tasks found
            if (filteredTasks.length === 0) {
                this.showWarning("No tasks found matching your search.");
            }
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