import BaseClass from "../util/baseClass";
import DataStore from "../util/DataStore";
import Client from "../api/client";

class IndexPage extends BaseClass {

    constructor() {
        super();
        this.bindClassMethods(
            ['mount', 'fetchTasks', 'updateTaskCounts', 'setupSearch',
            'performSearch', 'renderTasks', 'onDeleteTask', 'onUpdateTask', 'saveUpdatedTask',
            'closeModal', 'onCreateTask', 'renderAnalytics', 'onGetAllTasks', 'updateDailyTaskContainer'], this);
        this.toggleNotificationDropdown = this.toggleNotificationDropdown.bind(this);
        this.dataStore = new DataStore();
    }

    /**
     * Once the page has loaded, set up the event handlers and fetch the task list.
     */
    async mount() {
        this.client = new Client();
        await this.fetchTasks();
        this.setupSearch();
        this.renderAnalytics();
        this.addEventListeners();
    }

    /**
     * Fetch all tasks and update the task counts.
     */
    async fetchTasks() {
        try {
            const taskList = await this.client.getAllTasks(); // Fetch all tasks
            this.dataStore.set('tasks', taskList); // Store tasks in DataStore

            const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
            const dailyTasks = taskList.filter(task => task.taskDueDate === today); // Filter tasks for today

            // Calculate analytics
            const totalTasks = taskList.length;
            const completedTasks = taskList.filter(task => task.status === 'Completed').length;
            const incompleteTasks = taskList.filter(task => task.status === 'Incomplete').length;
            const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;

            // Save analytics data in DataStore
            this.dataStore.set('analytics', {
                totalTasks,
                completedTasks,
                incompleteTasks,
                completionRate
            });

            this.updateDailyTaskContainer(dailyTasks);  // Update the daily task container
            this.generateNotifications(taskList); // Generate notifications for tasks
            this.updateTaskCounts(taskList); // Update task counts based on the fetched tasks
            this.renderTasks(taskList); // Call renderTasks to display tasks in the table
            this.renderAnalytics(); // Render analytics
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    }

    /**
     * Update the daily task container with the number of tasks for today.
     * that are "In Progress."
     * @param {Array} dailyTasks - The list of tasks for today.
     */
    updateDailyTaskContainer(dailyTasks) {
        const container = document.getElementById('daily-task-container');
        if (container) {
            // Filter tasks for today that are "In Progress"
            const inProgressTasks = dailyTasks.filter(task => task.status === 'In Progress');

            if (inProgressTasks.length > 0) {
                container.innerHTML = `
                <p>Hello!</p>
                <p>You've got <strong class="task-count">${inProgressTasks.length}</strong> task(s) today..</p>
            `;
            } else {
                container.innerHTML = `
                <p>Hello!</p>
                <p>You have no tasks today.. Enjoy your day :)</p>
            `;
            }
        }
    }

    /**
     * Update the task counts in the HTML based on the task statuses.
     * @param {Array} taskList - The list of tasks fetched from the server.
     */
    updateTaskCounts(taskList) {
        let completedCount = 0;
        let inProgressCount = 0;
        let canceledCount = 0;

        taskList.forEach((task) => {
            if (task.status === "Completed") {
                completedCount++;
            } else if (["In Progress", "In Review", "Pending"].includes(task.status)) {
                inProgressCount++;
            } else if (task.status === "Canceled") {
                canceledCount++;
            }
        });

        document.querySelector('.val-box:nth-child(1) .task-count').textContent = completedCount;
        document.querySelector('.val-box:nth-child(2) .task-count').textContent = inProgressCount;
        document.querySelector('.val-box:nth-child(3) .task-count').textContent = canceledCount;
    }

    /**
     * Render analytics in the UI.
     */
    renderAnalytics() {
        const analytics = this.dataStore.get('analytics');
        if (analytics) {
            const totalTasksElement = document.querySelector('.total-tasks');
            const completionRateElement = document.querySelector('.completion-rate');

            if (totalTasksElement) {
                totalTasksElement.textContent = analytics.totalTasks;
            }

            if (completionRateElement) {
                completionRateElement.textContent = `${analytics.completionRate}%`;
            }
        }
    }

    /**
     * Render tasks in the table format.
     * @param {Array} taskList - The list of tasks fetched from the server.
     */
    renderTasks(taskList) {
        const tableBody = document.querySelector(".table-container tbody");
        tableBody.innerHTML = ''; // Clear existing rows

        if (taskList.length === 0) {
            // If there are no tasks, display a message in the table
            const noDataRow = document.createElement('tr');
            noDataRow.innerHTML = `
                <td colspan="7" style="text-align: center; font-style: italic; color: gray; font-size: 15px;">
                    ...No Tasks Data Available...
                </td>
            `;
            tableBody.appendChild(noDataRow);
        } else {
            // Render tasks if there are any
            taskList.forEach((task) => {
                // Determine the color for the status
                let statusColor = '';

                switch (task.status) {
                    case 'Completed':
                        statusColor = '#4CAF50'; // Green
                        break;
                    case 'In Progress':
                        statusColor = '#FFA500' // Yellow
                        break;
                    case 'Canceled':
                        statusColor = '#dc3545'; // Red
                        break;
                    case 'In Review':
                        statusColor = '#0056b3'; // Blue
                        break;
                    case 'Pending':
                        statusColor = '#808080'; // Default gray
                        break;
                    default:
                        statusColor = '#808080'; // Default gray
                }

                const row = document.createElement('tr');
                row.innerHTML = `
                <td><h3 class="task-info">${task.title}</h3></td>
                <td><h3 class="task-info">${task.description}</h3></td>
                <td><h3 class="task-info">${task.assignedTo}</h3></td>
                <td style="text-align: center;">
                    <span class="status-text" style="background-color: ${statusColor}; color: white; padding: 3px 8px; border-radius: 3px;">
                        ${task.status}
                    </span>
                </td>
                <td><h3 class="task-info">${task.priority}</h3></td>
                <td><h3 class="task-info">${task.taskDueDate}</h3></td>
                <td>
                    <button type="button" class="update-btn" data-task-id="${task.taskId}">
                    <i class="fa fa-pencil-alt"></i> Update
                </button>
                <button type="button" class="delete-btn" data-task-id="${task.taskId}">
                    <i class="fa fa-trash"></i> Delete
                </button>
                </td>
                `;
                tableBody.appendChild(row);
            });
        }
    }

    /**
     * Set up the search functionality.
     */
    setupSearch() {
        const searchIcon = document.getElementById('search-icon');
        const searchInput = document.getElementById('search-input');

        // Check if the search icon and input are found
        if (searchIcon && searchInput) {
            searchInput.addEventListener('input', () => {
                this.performSearch(searchInput.value);
            });
            searchIcon.addEventListener('click', () => {
                this.performSearch(searchInput.value);
            });
        }
    }

    /**
     * Perform a search based on the input query.
     * @param {string} query - The search query entered by the user.
     */
    performSearch(query) {
        const taskList = this.dataStore.get('tasks'); // Get the list of tasks from the data store
        const filteredTasks = taskList.filter(task =>
        task.title.toLowerCase().includes(query.toLowerCase()) ||
        task.description.toLowerCase().includes(query.toLowerCase()) ||
        task.assignedTo.toLowerCase().includes(query.toLowerCase()) ||
        task.status.toLowerCase().includes(query.toLowerCase())
        );

        this.updateTaskCounts(filteredTasks);  // Update the task counts based on the filtered tasks
        this.renderTasks(filteredTasks);  // Re-render the tasks after filtering
    }

    /**
     * Add event listeners method
     */
    addEventListeners() {
        // Add listener for the notification bell
        const notificationIcon = document.getElementById('notification-icon');
        const notificationDropdown = document.getElementById('notification-dropdown');
        notificationIcon.addEventListener('click', () => {
            this.toggleNotificationDropdown();
        });

        // Add listener for Add Task button
        const addTaskButton = document.querySelector('.add-button');
        addTaskButton.addEventListener('click', this.onCreateTask);

        // Add listeners for delete buttons
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', this.onDeleteTask);
        });

        // Add listeners for update buttons
        const updateButtons = document.querySelectorAll('.update-btn');
        updateButtons.forEach(button => {
            button.addEventListener('click', this.onUpdateTask);
        });

        // Add listener for Retrieve Tasks button
        const retrieveTasksButton = document.getElementById('retrieveTasksBtn');
        retrieveTasksButton.addEventListener('click', this.onGetAllTasks);

        const closeRetrieveModalButton = document.getElementById('closeRetrieveModal');
        closeRetrieveModalButton.addEventListener('click', () => {
            const modal = document.getElementById('retrieveTasksModal');
            const overlay = document.getElementById('modalOverlay');
            this.closeModal(modal, overlay);
        });
    }

    // Toggle notification dropdown visibility
    toggleNotificationDropdown() {
        const notificationDropdown = document.getElementById('notification-dropdown');
        notificationDropdown.classList.toggle('active');

        const notificationIcon = document.getElementById('notification-icon');
        document.addEventListener('click', (event) => {
            if (!notificationIcon.contains(event.target) && !notificationDropdown.contains(event.target)) {
                notificationDropdown.classList.remove('active');
            }
        });
    }

    // Generate notifications based on task statuses
    generateNotifications(taskList) {
        const notificationList = document.getElementById('notification-list'); // For dropdown
        const dashboardNotificationList = document.getElementById('notificationList'); // For dashboard

        notificationList.innerHTML = ''; // Clear existing notifications in dropdown
        dashboardNotificationList.innerHTML = ''; // Clear existing notifications in dashboard

        const now = new Date();
        let notificationCount = 0;
        let dashboardHasDueSoonTasks = false;

        // Loop through tasks to generate notifications
        taskList.forEach(task => {
            const dueDate = new Date(task.taskDueDate);
            const timeLeft = dueDate - now;
            const deadlineSoon = timeLeft <= 2 * 24 * 60 * 60 * 1000; // 2 days threshold

            // Handle 'In Progress' tasks that are due soon
            if (task.status === 'In Progress' && deadlineSoon) {
                // Add to dashboard notifications only
                this.addDashboardNotificationItem(`Task "${task.title}" is approaching its due date.`, dashboardNotificationList);
                dashboardHasDueSoonTasks = true; // Mark that there's a due soon task

                this.addDropdownNotificationItem(`Task "${task.title}" is approaching its due date.`, notificationList);
                notificationCount++;
            }

            // Handle completed tasks
            if (task.status === 'Completed') {
                // Only add to dropdown notifications
                this.addDropdownNotificationItem(`Task "${task.title}" has been completed.`, notificationList);

                this.addDropdownNotificationItem(`Task "${task.title}" is approaching its due date.`, notificationList);
                notificationCount++;
            }
        });

        // If no due soon tasks, show "No available task due soon" in the dashboard
        if (!dashboardHasDueSoonTasks) {
            this.addDashboardNotificationItem("No available task due soon", dashboardNotificationList);
        }

        // If no notifications, display "There are currently no notifications" message in the dropdown
        if (notificationCount === 0) {
            const noNotificationsItem = document.createElement('li');
            noNotificationsItem.classList.add('notification-item');
            noNotificationsItem.textContent = "There are currently no notifications";
            notificationList.appendChild(noNotificationsItem);
        }

        // Update the notification count on the dropdown icon
        this.updateNotificationCount(notificationCount);
    }

    // Add a notification item to the dashboard
    addDashboardNotificationItem(message, dashboardNotificationList) {
        const dashboardItem = document.createElement('li');
        dashboardItem.classList.add('notification-item');
        dashboardItem.textContent = message;
        dashboardNotificationList.appendChild(dashboardItem);
    }

    // Add a notification item to the dropdown
    addDropdownNotificationItem(message, notificationList) {
        const dropdownItem = document.createElement('li');
        dropdownItem.classList.add('notification-item');
        dropdownItem.textContent = message;
        notificationList.appendChild(dropdownItem);
    }

    // Update notification count on the bell icon
    updateNotificationCount(count) {
        const notificationCount = document.getElementById('notification-count');
        notificationCount.textContent = count > 0 ? count : ''; // Only show if count is > 0
        notificationCount.style.display = count > 0 ? 'inline-block' : 'none'; // Toggle visibility
    }


    /**
     * Handle the creating of a task.
     * @param {Event} event - The click event on the submit button.
     */
    async onCreateTask(event) {
        // Prevent the page from refreshing on form submit
        if (event) event.preventDefault();

        const modal = document.getElementById('addTaskModal');
        const overlay = document.getElementById('modalOverlay');
        modal.style.display = 'flex';
        overlay.style.display = 'flex';

        // Event listeners for Submit and Cancel buttons
        const submitButton = document.getElementById('confirmSubmit');
        const cancelButton = document.getElementById('cancelCancel');

        // Check if event listeners are already added
        if (!submitButton.dataset.listenerAdded) {
            submitButton.addEventListener('click', async (event) => {
                event.preventDefault();
                await this.handleSubmitTask(); // Call handleSubmitTask when submit is clicked
            });
            submitButton.dataset.listenerAdded = true;
        }

        if (!cancelButton.dataset.listenerAdded) {
            cancelButton.addEventListener('click', (event) => {
                event.preventDefault();
                this.closeAddTaskModal(); // Close modal when cancel is clicked
            });
            cancelButton.dataset.listenerAdded = true;
        }
    }

    // Method to handle task submission
    async handleSubmitTask() {
        try {
            // Retrieve task details from input fields
            const taskName = document.getElementById('addTaskTitle').value;
            const taskDescription = document.getElementById('addTaskDescription').value;
            const assignedTo = document.getElementById('addTaskAssignedTo').value;
            const status = document.getElementById('addTaskStatus').value;
            const priority = document.getElementById('addTaskPriority').value;
            const taskDueDate = document.getElementById('addTaskDueDate').value;

            // Validate input
            if (!taskName || !taskDescription || !assignedTo || !status || !priority || !taskDueDate) {
                this.errorHandler("All fields must be filled out.");
                return;
            }

            // Create the task object
            const newTask = {
                title: taskName,
                description: taskDescription,
                assignedTo: assignedTo,
                status: status,
                priority: priority,
                taskDueDate: taskDueDate
            };

            // Close the modal after task creation
            this.closeAddTaskModal();
            this.showMessage('Creating task, Please wait...');

            // Make an API call to create the task
            await this.client.createTask(newTask);

            // After task is created, hide the loading message
            this.showMessage("Task successfully created!");

            // Refresh tasks after task is created
            await this.fetchTasks();

        } catch (error) {
            console.error("Error creating task:", error);
            this.showMessage("There was an error creating the task.");
        }
    }

    /**
     * Handle the deletion of a task.
     * @param {Event} event - The click event on the delete button.
     */
    async onDeleteTask(event) {
        // Get taskId from the button's data attribute
        const taskId = event.target.getAttribute('data-task-id');

        // Show the modal and overlay
        const modal = document.getElementById('confirmationModal');
        const overlay = document.getElementById('modalOverlay');
        modal.style.display = 'flex';
        overlay.style.display = 'flex';

        // Get the confirmation and cancel buttons
        const confirmBtn = document.getElementById('confirmDelete');
        const cancelBtn = document.getElementById('cancelDelete');

        // Event listener for confirmation
        confirmBtn.addEventListener('click', async () => {

            this.closeModal(modal, overlay);
            try {
                // Show message that deletion is in progress
                this.showMessage('Deleting task, Please wait...');
                await this.client.deleteTask(taskId); // Call API to delete task
                await this.fetchTasks(); // Re-fetch tasks after deletion
                this.showMessage('Task successfully deleted!');
            } catch (error) {
                this.showMessage('Error deleting task. Please try again.');
                console.error("Error deleting task:", error);
            }
            this.closeModal(modal, overlay);
        });

        // Event listener for cancellation
        cancelBtn.addEventListener('click', () => {
            // Close the modal without doing anything
            this.closeModal(modal, overlay);
        });
    }

    /**
     * Handle the update of a task.
     * @param {Event} event - The click event on the update button.
     */
    async onUpdateTask(event) {
        // Get taskId from the button's data attribute
        const taskId = event.target.getAttribute('data-task-id');
        const taskList = this.dataStore.get('tasks');
        const task = taskList.find(t => t.taskId === taskId);

        if (task) {
            // Prefill the update form with the task details
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description;
            document.getElementById('taskAssignedTo').value = task.assignedTo;
            document.getElementById('taskStatus').value = task.status;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskDueDate').value = task.taskDueDate;

            // Show the modal and overlay for update confirmation
            const modal = document.getElementById('updateTaskModal');
            const overlay = document.getElementById('modalOverlay');
            modal.style.display = 'flex';
            overlay.style.display = 'flex';

            // Event listener for confirm update button
            let confirmUpdate = document.getElementById('confirmUpdate');

            // Remove any existing event listeners to prevent duplication
            confirmUpdate.replaceWith(confirmUpdate.cloneNode(true));
            confirmUpdate = document.getElementById('confirmUpdate');

            confirmUpdate.addEventListener('click', async () => {
                // Close modal immediately upon clicking update
                this.closeModal(modal, overlay);
                await this.saveUpdatedTask(taskId); // Save the updated task after closing the modal
            });

            // Add event listener for the cancel button to close the modal
            const cancelUpdate = document.getElementById('cancelUpdate');
            cancelUpdate.addEventListener('click', () => this.closeModal(modal, overlay));
        }
    }

    /**
     * Save the updated task.
     * @param {string} taskId - The ID of the task to be updated.
     */
    async saveUpdatedTask(taskId) {
        const updatedTask = {
            taskId: taskId,
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            assignedTo: document.getElementById('taskAssignedTo').value,
            status: document.getElementById('taskStatus').value,
            priority: document.getElementById('taskPriority').value,
            taskDueDate: document.getElementById('taskDueDate').value,
        };

        try {
            this.showMessage('Updating task, Please wait...');
            await this.client.updateTask(taskId, updatedTask); // Call API to update task
            await this.fetchTasks(); // Re-fetch tasks after update
            const tasks = this.dataStore.get('tasks'); // Get the updated task list

            this.generateNotifications(tasks); // Generate notifications
            this.showMessage(`Task successfully updated!`);
            this.closeModal(document.getElementById('updateTaskModal'), document.getElementById('modalOverlay'));
        } catch (error) {
            console.error("Error updating task:", error);
        }
    }

    /**
    * Fetch all tasks from the Client and update the UI.
    */
    async onGetAllTasks(event) {
        if (event) event.preventDefault();

        try {
            const taskList = await this.client.getAllTasks();

            // Check if tasks are retrieved successfully
            const taskListDiv = document.getElementById('taskList');
            taskListDiv.innerHTML = ''; // Clear any existing task data

            if (taskList.length === 0) {
                // Display the message if no tasks are available
                const noTasksMessage = document.createElement('p');
                noTasksMessage.textContent = "There are currently no tasks...";
                // Styling for the message
                noTasksMessage.style.fontSize = '30px';
                noTasksMessage.style.marginTop = '50px';
                noTasksMessage.style.textAlign = 'center';
                noTasksMessage.style.fontStyle = 'italic';
                noTasksMessage.style.marginBottom = '50px';
                taskListDiv.appendChild(noTasksMessage);
            } else {
                // Populate the taskList div with tasks
                taskList.forEach(task => {
                    const taskItem = document.createElement('div');
                    taskItem.classList.add('task-item');
                    taskItem.innerHTML = `
                     <p><strong>Title:</strong> ${task.title}</p>
                     <p><strong>Description:</strong> ${task.description}</p>
                     <p><strong>Assigned To:</strong> ${task.assignedTo}</p>
                     <p><strong>Status:</strong> ${task.status}</p>
                     <p><strong>Priority:</strong> ${task.priority}</p>
                     <p><strong>Due Date:</strong> ${task.taskDueDate}</p>
                     <hr>
                `;
                    taskListDiv.appendChild(taskItem);
                });

                this.showMessage("Tasks successfully retrieved!");
            }

            // Show the modal with populated tasks
            const retrieveTasksModal = document.getElementById('retrieveTasksModal');
            retrieveTasksModal.style.display = 'flex';
        } catch (error) {
            this.showMessage("There was an error retrieving tasks.");
            console.error("Error fetching tasks:", error);
        }
    }

    // Method to close the Add Task modal
    closeAddTaskModal() {
        const modal = document.getElementById('addTaskModal');
        const overlay = document.getElementById('modalOverlay');
        modal.style.display = 'none';
        overlay.style.display = 'none';

        document.getElementById('addTaskTitle').value = '';
        document.getElementById('addTaskDescription').value = '';
        document.getElementById('addTaskAssignedTo').value = '';
        document.getElementById('addTaskStatus').value = '';
        document.getElementById('addTaskPriority').value = '';
        document.getElementById('addTaskDueDate').value = '';
    }

    /**
     * Close the modal.
     * @param {HTMLElement} modal - The modal element to close.
     * @param {HTMLElement} overlay - The overlay element to close.
     */
    closeModal(modal, overlay) {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }
}


/**
 * Main method to run when the page contents have loaded.
 */
const main = async () => {
    const indexPage = new IndexPage();
    await indexPage.mount();
};

// Ensure the modal is closed when the page reloads or refreshes
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('confirmationModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('updateTaskModal').style.display = 'none';
    document.getElementById('addTaskModal').style.display = 'none';
    document.getElementById('retrieveTasksModal').style.display = 'none';
});

window.addEventListener('DOMContentLoaded', main);