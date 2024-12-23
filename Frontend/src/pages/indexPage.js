import BaseClass from "../util/baseClass";
import DataStore from "../util/DataStore";
import Client from "../api/client";

class IndexPage extends BaseClass {
    constructor() {
        super();
        this.bindClassMethods(
            [
                "mount", "fetchTasks", "updateTaskCounts", "setupSearch", "performSearch", "renderTasks", "onDeleteTask", "onUpdateTask", "initializeChart",
                "saveUpdatedTask", "closeModal", "onCreateTask", "renderAnalytics", "onGetAllTasks", "updateDailyTaskContainer", "onGetCompletedTasks", "onGetIncompleteTasks",
                "renderCalendar", "nextMonth", "prevMonth", "goToToday", "hideTodayBtn", "toggleDarkMode", "changePage", "updatePaginationControls", "attachTaskRowEventListeners"
            ],
            this
        );

        this.dataStore = new DataStore();
        this.currentPage = 1;
        this.tasksPerPage = 10;
        this.toggleNotificationDropdown.bind(this);

        // Calendar variables
        this.daysContainer = document.querySelector(".days");
        this.nextBtn = document.querySelector(".next-btn");
        this.prevBtn = document.querySelector(".prev-btn");
        this.month = document.querySelector(".month");
        this.todayBtn = document.querySelector(".today-btn");

        const date = new Date();
        this.currentMonth = date.getMonth();
        this.currentYear = date.getFullYear();

        this.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        this.days =   ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    }

    /**
     * Once the page has loaded, set up the event handlers and fetch the task list.
     */
    async mount() {
        this.client = new Client();
        this.applyDarkModePreference();
        this.setupSearch();
        this.renderAnalytics();
        this.renderCalendar();
        await this.fetchTasks();
        this.initializeChart();
        this.addEventListeners();
    }

    /**
    * Fetch all tasks and update the task counts.
    */
    async fetchTasks() {
        const chart = document.getElementById("myChart");
        const spinner = document.getElementById("loadingSpinner");
        const noDataMessage = document.getElementById("no-data-message");

        noDataMessage.style.display = "none";

        try {
            // Show the spinner
            spinner.style.display = "block";

            // Simulate a delay
            await new Promise((resolve) => setTimeout(resolve, 2000));

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
            const incompleteTasks = taskList.filter((task) => task.status === "Incomplete").length;
            const inProgressTasks = taskList.filter((task) => task.status === "In Progress").length;
            const canceledTasks = taskList.filter((task) => task.status === "Canceled").length;
            const inReviewTasks = taskList.filter((task) => task.status === "In Review").length;
            const pendingTasks = taskList.filter((task) => task.status === "Pending").length;

            // Save analytics data in DataStore
            this.dataStore.set("analytics", {
                totalTasks,
                completedTasks,
                incompleteTasks,
                inProgressTasks,
                canceledTasks,
                inReviewTasks,
                pendingTasks
            });

            // Update UI components
            this.updateDailyTaskContainer(dailyTasks); // Update the daily task container
            this.generateNotifications(taskList); // Generate notifications for tasks
            this.updateTaskCounts(taskList); // Update task counts based on the fetched tasks
            this.renderTasks(taskList); // Call renderTasks to display tasks in the table
            this.renderAnalytics(); // Render analytics

            // Handle chart visibility based on task data
            if (totalTasks > 0) {
                chart.style.display = "block";
                noDataMessage.style.display = "none";
            } else {
                chart.style.display = "none";
                noDataMessage.style.display = "flex";
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
            this.showMessage("Something went wrong while fetching the tasks. Please try again later..");
        } finally {
            spinner.style.display = "none";
        }
    }

    /**
     * Update the daily task container with the number of tasks for today.
     * that are "In Progress."
     * @param {Array} dailyTasks - The list of tasks for today.
     */
    updateDailyTaskContainer(dailyTasks) {
        const container = document.getElementById("daily-task-container");
        if (container) {
            // Filter tasks for today that are "In Progress"
            const inProgressTasks = dailyTasks.filter((task) => task.status === "In Progress");

            if (inProgressTasks.length > 0) {
                container.innerHTML = `
                <p class="text">Hello! Mehmet</p>
                <p class="text">You've got <strong class="task-count">${inProgressTasks.length}</strong> task(s) today..</p>
            `;
            } else {
                container.innerHTML = `
                <p class="text">Hello! Mehmet</p>
                <p class="text">You have no task(s) today.. </p>
                <p class="text">Enjoy your day..🙂☕</p>
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
        let overdueCount = 0;

        taskList.forEach((task) => {
            const taskDueDate = new Date(task.taskDueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get the date string in the format YYYY-MM-DD
            const taskDueDateString = taskDueDate.toISOString().split("T")[0];
            const todayString = today.toISOString().split("T")[0];

            if (task.status === "Completed") {
                completedCount++;
            } else if (["In Progress", "In Review", "Pending"].includes(task.status)) {
                // If task is "In Progress" and is overdue, count it in overdue count and exclude from in-progress
                if (taskDueDateString < todayString) {
                    overdueCount++;
                } else {
                    inProgressCount++;
                }
            } else if (task.status === "Canceled") {
                canceledCount++;
            }
        });

        // Update the counts in the HTML
        document.querySelector(".val-box:nth-child(1) .task-count").textContent = completedCount;
        document.querySelector(".val-box:nth-child(2) .task-count").textContent = inProgressCount;
        document.querySelector(".val-box:nth-child(3) .task-count").textContent = canceledCount;
        document.querySelector(".val-box:nth-child(5) .task-count").textContent = overdueCount;

        // Calculate total tasks for progress bar logic
        const totalTasks = completedCount + inProgressCount + canceledCount + overdueCount;

        // Logic for progress bars
        const completedBar = document.querySelector(".progress-bar.completed");
        const inProgressBar = document.querySelector(".progress-bar.in-progress");
        const canceledBar = document.querySelector(".progress-bar.canceled");
        const overdueBar = document.querySelector(".progress-bar.overdue");

        // Set default gray background for 0% bars
        if (totalTasks === 0) {
            completedBar.style.width = "0%";
            completedBar.querySelector(".progress-text").textContent = "0%";
            completedBar.classList.add("default");

            inProgressBar.style.width = "0%";
            inProgressBar.querySelector(".progress-text").textContent = "0%";
            inProgressBar.classList.add("default");

            canceledBar.style.width = "0%";
            canceledBar.querySelector(".progress-text").textContent = "0%";
            canceledBar.classList.add("default");

            overdueBar.style.width = "0%";
            overdueBar.querySelector(".progress-text").textContent = "0%";
            overdueBar.classList.add("default");
        } else {
            let completedPercentage = (completedCount / totalTasks) * 100;
            let inProgressPercentage = (inProgressCount / totalTasks) * 100;
            let canceledPercentage = (canceledCount / totalTasks) * 100;
            let overduePercentage = (overdueCount / totalTasks) * 100;

            // Round percentages to one decimal place
            completedPercentage = parseFloat(completedPercentage.toFixed(1));
            inProgressPercentage = parseFloat(inProgressPercentage.toFixed(1));
            canceledPercentage = parseFloat(canceledPercentage.toFixed(1));
            overduePercentage = parseFloat(overduePercentage.toFixed(1));

            // Calculate the total of the rounded percentages
            const totalPercentage = completedPercentage + inProgressPercentage + canceledPercentage + overduePercentage;

            const adjustment = 100 - totalPercentage;

            if (adjustment !== 0) {
                // Adjust the last percentage based on the counts
                if (overdueCount > 0) {
                    overduePercentage += adjustment;
                } else if (canceledCount > 0) {
                    canceledPercentage += adjustment;
                } else if (inProgressCount > 0) {
                    inProgressPercentage += adjustment;
                } else {
                    completedPercentage += adjustment;
                }
            }

            completedPercentage = parseFloat(completedPercentage.toFixed(1));
            inProgressPercentage = parseFloat(inProgressPercentage.toFixed(1));
            canceledPercentage = parseFloat(canceledPercentage.toFixed(1));
            overduePercentage = parseFloat(overduePercentage.toFixed(1));

            completedBar.style.width = `${completedPercentage}%`;
            completedBar.querySelector(".progress-text").textContent = `${completedPercentage}%`;
            completedBar.classList.remove("default");

            inProgressBar.style.width = `${inProgressPercentage}%`;
            inProgressBar.querySelector(".progress-text").textContent = `${inProgressPercentage}%`;
            inProgressBar.classList.remove("default");

            canceledBar.style.width = `${canceledPercentage}%`;
            canceledBar.querySelector(".progress-text").textContent = `${canceledPercentage}%`;
            canceledBar.classList.remove("default");

            overdueBar.style.width = `${overduePercentage}%`;
            overdueBar.querySelector(".progress-text").textContent = `${overduePercentage}%`;
            overdueBar.classList.remove("default");
        }
    }

    /**
    * Initialize or update the task percentage chart dynamically.
    * @param {Array} analytics - The analytics of tasks fetched from the server.
    */
    initializeChart() {
        const analytics = this.dataStore.get("analytics");

        // Prepare the task data
        const taskData = [
            { label: 'Completed', value: analytics.completedTasks || 0, color: '#90ee90' },
            { label: 'In Progress', value: analytics.inProgressTasks || 0, color: '#ffd700' },
            { label: 'Canceled', value: analytics.canceledTasks || 0, color: '#FF6347' },
            { label: 'In Review', value: analytics.inReviewTasks || 0, color: '#6cace4' },
            { label: 'Pending', value: analytics.pendingTasks || 0, color: '#808080' }
        ];

        // Filter out tasks with a value of 0
        const filteredTasks = taskData.filter(task => task.value > 0);

        // Extract the labels, data, and colors for the chart
        const labels = filteredTasks.map(task => task.label);
        const data = filteredTasks.map(task => task.value);
        const backgroundColors = filteredTasks.map(task => task.color);

        const chartContainer = document.getElementById('chart-container');
        const canvas = document.getElementById('myChart');
        const noDataMessage = document.getElementById('no-data-message');
        const ctx = document.getElementById('myChart').getContext('2d');

        const chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (tooltipItem) {
                                const taskType = tooltipItem.label;
                                const taskCount = tooltipItem.raw;
                                const total = tooltipItem.dataset.data.reduce((acc, val) => acc + val, 0);
                                const percentage = ((taskCount / total) * 100).toFixed(1);
                                const totalPercentage = 100;
                                return `${taskType}: ${taskCount} tasks (${percentage}% of ${totalPercentage}%)`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Task Status Overview',
                        font: {
                            size: 20,
                            family: 'Arial, Helvetica, sans-serif',
                            weight: 'bold'
                        }
                    },
                    subtitle: {
                        display: true,
                        text: 'Visual representation of task status distribution',
                        font: {
                            size: 14,
                            family: 'Arial, Helvetica, sans-serif',
                            style: 'italic'
                        },
                        padding: {
                            top: 5,
                            bottom: 10
                        }
                    }
                },
                animation: {
                    duration: 1750,
                    easing: 'easeInOutQuint',
                }
            },
            plugins: [
                // Plugin to Display Percentages Inside Segments
                {
                    id: 'percentageLabels',
                    afterDatasetsDraw: function (chart) {
                        const { ctx, data, chartArea } = chart;
                        const total = data.datasets[0].data.reduce((acc, val) => acc + val, 0);

                        if (total === 0) return;

                        let percentages = data.datasets[0].data.map(value => ((value / total) * 100).toFixed(1));
                        const sumOfPercentages = percentages.reduce((acc, val) => acc + parseFloat(val), 0);

                        if (sumOfPercentages !== 100) {
                            const difference = 100 - sumOfPercentages;
                            percentages[percentages.length - 1] = (parseFloat(percentages[percentages.length - 1]) + difference).toFixed(1);
                        }

                        // Loop through the slices and draw the percentage in the center
                        data.datasets[0].data.forEach((value, index) => {
                            const isSingleSlice = data.datasets[0].data.length === 1;
                            const sliceMeta = chart.getDatasetMeta(0).data[index];
                            let x, y;

                            // If it's a single slice, center the text in the middle of the pie
                            if (isSingleSlice) {
                                x = chartArea.left + (chartArea.right - chartArea.left) / 2;
                                y = chartArea.top + (chartArea.bottom - chartArea.top) / 2;
                            } else {
                                // For multiple slices, use the tooltipPosition
                                ({ x, y } = sliceMeta.tooltipPosition());
                            }

                            ctx.save();
                            ctx.font = '14px sans-serif';
                            ctx.fillStyle = 'black';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(`${percentages[index]}%`, x, y);
                            ctx.restore();
                        });
                    }
                }
            ]
        });
    }

    /**
    * Render the calendar in the UI by dynamically generating the days of the current month,
    * including days from the previous and next months for proper alignment.
    * Highlights today's date and updates the month and year displayed in the header.
    * Adjusts the visibility of the "Today" button based on the current view.
    */
    renderCalendar() {
        const daysContainer = document.querySelector(".days");
        const month = document.querySelector(".month");
        const todayBtn = document.querySelector(".today-btn");

        // Get current date
        const today = new Date();

        // Function to render days
        const date = new Date(this.currentYear, this.currentMonth, 1);
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);

        const lastDayIndex = lastDay.getDay();
        const lastDayDate = lastDay.getDate();

        const prevLastDay = new Date(this.currentYear, this.currentMonth, 0);
        const prevLastDayDate = prevLastDay.getDate();

        const nextDays = 7 - lastDayIndex - 1;

        // Update current year and month in header
        this.month.innerHTML = `${this.months[this.currentMonth]} ${this.currentYear }`;

        // Update days html
        let days = "";

        // Prev days html
        for (let x = firstDay.getDay(); x > 0; x--) {
            days += `<div class="day prev">${prevLastDayDate - x + 1}</div>`;
        }

        // Current month days
        for (let i = 1; i <= lastDayDate; i++) {
            // Check if the date matches today's date
            if (
            i === today.getDate() &&
            this.currentMonth === today.getMonth() &&
            this.currentYear === today.getFullYear()
            ) {
                days += `<div class="day today">${i}</div>`;
            } else {
                days += `<div class="day">${i}</div>`;
            }
        }

        // Next month days
        for (let j = 1; j <= nextDays; j++) {
            days += `<div class="day next">${j}</div>`;
        }

        this.daysContainer.innerHTML = days;
        this.hideTodayBtn(this.todayBtn);
    }

    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.renderCalendar();
    }

    prevMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.renderCalendar();
    }

    goToToday() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
        this.renderCalendar();
    }

    hideTodayBtn(todayBtn) {
        if (
        this.currentMonth === new Date().getMonth() &&
        this.currentYear === new Date().getFullYear()
        ) {
            todayBtn.style.display = "none";
        } else {
            todayBtn.style.display = "flex";
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
        tableBody.innerHTML = "";

        // Sort tasks by taskDueDate
        taskList.sort((a, b) => new Date(a.taskDueDate) - new Date(b.taskDueDate));

        if (taskList.length === 0) {
            // Check if dark mode is active
            const isDarkMode = document.body.classList.contains("dark-mode");

            // If there are no tasks, display a message in the table
            const noDataRow = document.createElement("tr");
            noDataRow.innerHTML = `
            <td colspan="8" style="text-align: center; font-style: italic; color: ${isDarkMode ? 'black' : 'gray'}; font-size: 20px;">
                All caught up! No tasks for today.. 🎉
            </td>
        `;
            tableBody.appendChild(noDataRow);
        } else {
            const start = (this.currentPage - 1) * this.tasksPerPage;
            const end = start + this.tasksPerPage;
            const tasksToRender = taskList.slice(start, end);

            // Render tasks if there are any
            tasksToRender.forEach((task, index) => {
                let statusColor = "";
                let statusText = task.status;

                const taskDueDate = new Date(task.taskDueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const taskDueDateString = taskDueDate.toISOString().split("T")[0];
                const todayString = today.toISOString().split("T")[0];

                if ((task.status === "In Progress" || task.status === "Pending" || task.status === "In Review") && taskDueDateString < todayString) {
                    statusColor = "#B52A37";  // Red
                    statusText = `Task-Overdue`;
                }  else {
                    switch (task.status) {
                        case "Completed":
                            statusColor = "#4CAF50"; // Green
                            break;
                        case "In Progress":
                            statusColor = "#FFC107"; // Gold
                            break;
                        case "Canceled":
                            statusColor = "#FF6347"; // Orange
                            break;
                        case "In Review":
                            statusColor = "#0056b3"; // Blue
                            break;
                        case "Pending":
                            statusColor = "#808080"; // Default gray
                            break;
                        default:
                            statusColor = "#808080"; // Default gray
                    }
                }

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
            this.attachTaskRowEventListeners();
        }
        this.updatePaginationControls();
    }

    updatePaginationControls() {
        const prevButton = document.getElementById("prev-btn");
        const nextButton = document.getElementById("next-btn");
        const pageInfo = document.getElementById("page-info");

        // Calculate total pages and ensure it is at least 1
        const totalTasks = this.dataStore.get("tasks").length;
        const totalPages = Math.max(1, Math.ceil(totalTasks / this.tasksPerPage));

        prevButton.disabled = this.currentPage === 1;
        nextButton.disabled = this.currentPage === totalPages;

        pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
    }

    changePage(offset) {
        this.currentPage += offset;
        this.renderTasks(this.dataStore.get("tasks"));
    }

    attachTaskRowEventListeners() {
        // Add listeners for delete buttons
        const deleteButtons = document.querySelectorAll(".delete-btn");
        deleteButtons.forEach((button) => {
            button.addEventListener("click", this.onDeleteTask);
        });

        // Add listeners for update buttons
        const updateButtons = document.querySelectorAll(".update-btn");
        updateButtons.forEach((button) => {
            button.addEventListener("click", this.onUpdateTask);
        });
    }

    /**
     * Set up the search functionality.
     */
    setupSearch() {
        const searchIcon = document.getElementById("search-icon");
        const searchInput = document.getElementById("search-input");

        // Check if the search icon and input are found
        if (searchIcon && searchInput) {
            searchInput.addEventListener("input", () => {
                this.performSearch(searchInput.value);
            });
            searchIcon.addEventListener("click", () => {
                this.performSearch(searchInput.value);
            });
        }
    }

    /**
     * Perform a search based on the input query.
     * @param {string} query - The search query entered by the user.
     */
    performSearch(query) {
        const taskList = this.dataStore.get("tasks");
        const filteredTasks = taskList.filter(
            (task) =>
            task.title.toLowerCase().includes(query.toLowerCase()) ||
            task.description.toLowerCase().includes(query.toLowerCase()) ||
            task.assignedTo.toLowerCase().includes(query.toLowerCase()) ||
            task.status.toLowerCase().includes(query.toLowerCase())
        );

        this.updateTaskCounts(filteredTasks); // Update the task counts based on the filtered tasks
        this.renderTasks(filteredTasks); // Re-render the tasks after filtering
    }

    /**
     * Add event listeners method
     */
    addEventListeners() {

        // Add listener for the pages buttons
        const prevButton = document.getElementById("prev-btn");
        const nextButton = document.getElementById("next-btn");

        prevButton.addEventListener("click", () => this.changePage(-1));
        nextButton.addEventListener("click", () => this.changePage(1));

        // Add listener for the notification bell
        const notificationIcon = document.getElementById("notification-icon");
        const notificationDropdown = document.getElementById("notification-dropdown");

        if (notificationIcon) {notificationIcon.addEventListener("click", () => {
            this.toggleNotificationDropdown();
        });
        }

        // Add listener for Add Task button
        const addTaskButton = document.querySelector(".add-button");
        if (addTaskButton) {
            addTaskButton.addEventListener("click", this.onCreateTask);
        }

        // Add listeners for delete buttons
        const deleteButtons = document.querySelectorAll(".delete-btn");
        deleteButtons.forEach((button) => {
            button.addEventListener("click", this.onDeleteTask);
        });

        // Add listeners for update buttons
        const updateButtons = document.querySelectorAll(".update-btn");
        updateButtons.forEach((button) => {
            button.addEventListener("click", this.onUpdateTask);
        });

        // Add listener for Retrieve Tasks button
        const retrieveTasksButton = document.getElementById("retrieveTasksBtn");
        if (retrieveTasksButton) {
            retrieveTasksButton.addEventListener("click", this.onGetAllTasks);
        }

        // Add listener for Completed Tasks button
        const completedTasksButton = document.getElementById("completedTasksBtn");
        if (completedTasksButton) {
            completedTasksButton.addEventListener("click", this.onGetCompletedTasks);
        }

        // Add listener for Incomplete Tasks button
        const incompleteTasksButton = document.getElementById("incompleteTasksBtn");
        if (incompleteTasksButton) {
            incompleteTasksButton.addEventListener("click", this.onGetIncompleteTasks);
        }

        // Add listener for closing the modal for retrieving tasks
        const closeRetrieveModalButton = document.getElementById("closeRetrieveModal");
        if (closeRetrieveModalButton) {
            closeRetrieveModalButton.addEventListener("click", () => {
                const modal = document.getElementById("retrieveTasksModal");
                const overlay = document.getElementById("modalOverlay");
                this.closeModal(modal, overlay);
            });
        }

        // Add listener for Refresh button
        const refreshButton = document.getElementById("refresh-button");
        if (refreshButton) {
            refreshButton.addEventListener("click", () => {
                this.fetchTasks();
                this.showMessage("No task data available to display", "info");
            });
        }

        // Add listener for Dark Mode toggle button
        const darkModeToggle = document.getElementById("darkModeToggle");
        if (darkModeToggle) {
            darkModeToggle.addEventListener("click", this.toggleDarkMode);
        }

        // Add calendar navigation listeners
        const nextBtn = document.querySelector(".next-btn");
        const prevBtn = document.querySelector(".prev-btn");
        const todayBtn = document.querySelector(".today-btn");

        if (nextBtn) {
            nextBtn.addEventListener("click", this.nextMonth);
        }

        if (prevBtn) {
            prevBtn.addEventListener("click", this.prevMonth);
        }

        if (todayBtn) {
            todayBtn.addEventListener("click", this.goToToday);
        }
    }

    // Toggle notification dropdown visibility
    toggleNotificationDropdown() {
        const notificationDropdown = document.getElementById("notification-dropdown");
        notificationDropdown.classList.toggle("active");

        const notificationIcon = document.getElementById("notification-icon");
        document.addEventListener("click", (event) => {
            if (!notificationIcon.contains(event.target) && !notificationDropdown.contains(event.target)) {
                notificationDropdown.classList.remove("active");
            }
        });
    }

    /**
     * Apply the saved dark mode preference
     */
    applyDarkModePreference() {
        const isDarkMode = localStorage.getItem("darkMode") === "true";
        const body = document.body;

        if (isDarkMode) {
            body.classList.add("dark-mode");
        } else {
            body.classList.remove("dark-mode");
        }

        // Update button text
        const darkModeToggle = document.getElementById("darkModeToggle");
        if (darkModeToggle) {
            darkModeToggle.textContent = isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode";
        }
    }

    /**
     * Toggle Dark Mode
     */
    toggleDarkMode() {
        const body = document.body;
        const isDarkMode = body.classList.toggle("dark-mode");

        // Update button text
        const darkModeToggle = document.getElementById("darkModeToggle");
        darkModeToggle.textContent = isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode";

        // Show appropriate message
        if (isDarkMode) {
            this.showMessage("Dark Mode is on");
        } else {
            this.showMessage("Light Mode is on");
        }

        // Save dark mode preference in localStorage
        localStorage.setItem("darkMode", isDarkMode);
    }

    // Generate notifications based on task statuses
    generateNotifications(taskList) {
        const notificationList = document.getElementById("notification-list");
        const dashboardNotificationList = document.getElementById("notificationList");

        notificationList.innerHTML = "";
        dashboardNotificationList.innerHTML = "";

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = today.toISOString().split("T")[0];

        let notificationCount = 0;
        let dashboardHasDueSoonTasks = false;

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
                        this.addDashboardNotificationItem(`Task "${task.title}" is approaching its due date.`, dashboardNotificationList);
                        dashboardHasDueSoonTasks = true;
                    }
                } else {
                    // Overdue tasks
                    this.addDropdownNotificationItem(`Task "${task.title}" is overdue.`, notificationList);
                    notificationCount++;
                }
            }

            // Handle completed tasks
            if (task.status === "Completed") {
                this.addDropdownNotificationItem(`Task "${task.title}" has been completed.`, notificationList);
                notificationCount++;
            }

            // Handle canceled tasks
            if (task.status === "Canceled") {
                this.addDropdownNotificationItem(`Task "${task.title}" has been canceled.`, notificationList);
                notificationCount++;
            }
        });

        // If no due soon tasks, show "No available task due soon" in the dashboard
        if (!dashboardHasDueSoonTasks) {
            this.addDashboardNotificationItem("No available task due soon", dashboardNotificationList);
        }

        // If no notifications, display "There are currently no notifications" message in the dropdown
        if (notificationCount === 0) {
            const noNotificationsItem = document.createElement("li");
            noNotificationsItem.classList.add("notification-item");
            noNotificationsItem.textContent = "There are currently no notifications";
            notificationList.appendChild(noNotificationsItem);
        }

        // Update the notification count on the dropdown icon
        this.updateNotificationCount(notificationCount);
    }

    // Add a notification item to the dashboard
    addDashboardNotificationItem(message, dashboardNotificationList) {
        const dashboardItem = document.createElement("li");
        dashboardItem.classList.add("notification-item");
        dashboardItem.textContent = message;
        dashboardNotificationList.appendChild(dashboardItem);
    }

    // Add a notification item to the dropdown
    addDropdownNotificationItem(message, notificationList) {
        const dropdownItem = document.createElement("li");
        dropdownItem.classList.add("notification-item");
        dropdownItem.textContent = message;
        notificationList.appendChild(dropdownItem);
    }

    // Update notification count on the bell icon
    updateNotificationCount(count) {
        const notificationCount = document.getElementById("notification-count");
        notificationCount.textContent = count > 0 ? count : "";
        notificationCount.style.display = count > 0 ? "inline-block" : "none";
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

        // Check if event listeners are already added
        if (!submitButton.dataset.listenerAdded) {
            submitButton.addEventListener("click", async (event) => {
                event.preventDefault();
                await this.handleSubmitTask();
            });
            submitButton.dataset.listenerAdded = true;
        }

        if (!cancelButton.dataset.listenerAdded) {
            cancelButton.addEventListener("click", (event) => {
                event.preventDefault();
                this.closeAddTaskModal();
            });
            cancelButton.dataset.listenerAdded = true;
        }
    }

    // Method to handle task submission
    async handleSubmitTask() {
        try {
            this.loadingSpinner(true);

            // Retrieve task details from input fields
            const taskName = document.getElementById("addTaskTitle").value;
            const taskDescription = document.getElementById("addTaskDescription").value;
            const assignedTo = document.getElementById("addTaskAssignedTo").value;
            const status = document.getElementById("addTaskStatus").value;
            const priority = document.getElementById("addTaskPriority").value;
            const taskDueDate = document.getElementById("addTaskDueDate").value;

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
                taskDueDate: taskDueDate,
            };

            // Close the modal after task creation
            this.closeAddTaskModal();
            this.showMessage("Creating task, Please wait...");

            // Make an API call to create the task
            await this.client.createTask(newTask);

            // After task is created, hide the loading message
            this.showMessage("Task created successfully!");

            // Refresh tasks after task is created
            await this.fetchTasks();
        } catch (error) {
            console.error("Error creating task:", error);
            this.showMessage("Something went wrong while creating the task. Please try again later..");
        } finally {
            this.loadingSpinner(false);
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

        // Confirm and cancel buttons in the modal
        const confirmBtn = document.getElementById("confirmDelete");
        const cancelBtn = document.getElementById("cancelDelete");

        // Confirm delete handler
        confirmBtn.addEventListener("click", async () => {
            this.closeModal(modal, overlay);
            try {
                this.loadingSpinner(true);
                this.showMessage("Deleting task, Please wait...");
                await this.client.deleteTask(taskId); // Call API to delete task
                await this.fetchTasks(); // Re-fetch tasks after deletion
                this.showMessage("Task deleted successfully!");
            } catch (error) {
                this.showMessage("Something went wrong while deleting the task. Please try again later..");
                console.error("Error deleting task:", error);
            } finally {
                this.loadingSpinner(false);
                this.closeModal(modal, overlay);
            }
        });

        // Event listener for cancellation
        cancelBtn.addEventListener("click", () => {
            this.closeModal(modal, overlay);
        });
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

            // Show the modal and overlay for update confirmation
            const modal = document.getElementById("updateTaskModal");
            const overlay = document.getElementById("modalOverlay");
            modal.style.display = "flex";
            overlay.style.display = "flex";

            // Handle confirm update button
            const confirmUpdate = document.getElementById("confirmUpdate");

            // Remove existing listeners to prevent duplication
            confirmUpdate.removeEventListener("click", this.handleUpdateClick);
            confirmUpdate.addEventListener("click", async () => {
                // Close modal immediately upon clicking update
                this.closeModal(modal, overlay);
                await this.saveUpdatedTask(taskId);
            });

            // Handle cancel button to close the modal
            const cancelUpdate = document.getElementById("cancelUpdate");
            cancelUpdate.removeEventListener("click", this.closeModal); // Prevent duplication
            cancelUpdate.addEventListener("click", () =>
            this.closeModal(modal, overlay)
            );
        }
    }

    /**
     * Save the updated task.
     * @param {string} taskId - The ID of the task to be updated.
     */
    async saveUpdatedTask(taskId) {
        const updatedTask = {
            taskId: taskId,
            title: document.getElementById("taskTitle").value,
            description: document.getElementById("taskDescription").value,
            assignedTo: document.getElementById("taskAssignedTo").value,
            status: document.getElementById("taskStatus").value,
            priority: document.getElementById("taskPriority").value,
            taskDueDate: document.getElementById("taskDueDate").value,
        };

        try {
            this.loadingSpinner(true);
            this.showMessage("Updating task, Please wait...");
            await this.client.updateTask(taskId, updatedTask); // Call API to update task
            await this.fetchTasks(); // Re-fetch tasks after update
            const tasks = this.dataStore.get("tasks");

            this.generateNotifications(tasks);
            this.showMessage("Task updated successfully!");
            this.closeModal(
                document.getElementById("updateTaskModal"),
                document.getElementById("modalOverlay")
            );
        } catch (error) {
            console.error("Something went wrong while updating the task. Please try again later..");
        } finally {
            this.loadingSpinner(false);
        }
    }

    /**
     * Fetch all tasks from the Client and update the UI.
     */
    async onGetAllTasks(event) {
        // Prevent the page from refreshing on form submit
        event.preventDefault();

        try {
            const taskList = await this.client.getAllTasks();

            // Check if tasks are retrieved successfully
            const taskListDiv = document.getElementById("taskList");
            taskListDiv.innerHTML = "";

            if (taskList.length === 0) {
                // Display the message if no tasks are available
                const noTasksMessage = document.createElement("p");
                noTasksMessage.textContent = "There are currently no tasks...";
                // Styling for the message
                noTasksMessage.style.fontSize = "30px";
                noTasksMessage.style.marginTop = "50px";
                noTasksMessage.style.textAlign = "center";
                noTasksMessage.style.fontStyle = "italic";
                noTasksMessage.style.marginBottom = "50px";
                taskListDiv.appendChild(noTasksMessage);
            } else {
                // Populate the taskList div with tasks
                taskList.forEach((task) => {
                    const taskItem = document.createElement("div");
                    taskItem.classList.add("task-item");
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
            const retrieveTasksModal = document.getElementById("retrieveTasksModal");
            retrieveTasksModal.style.display = "flex";
        } catch (error) {
            this.showMessage("Something went wrong while retrieving the tasks. Please try again later..");
            console.error("Error fetching tasks:", error);
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
            const completedTasks = await this.client.getCompletedTasks(this.errorHandler);

            // Get the container where tasks will be displayed
            const taskListDiv = document.getElementById("taskList");
            taskListDiv.innerHTML = "";

            if (completedTasks.length === 0) {
                // Display a message if no completed tasks are available
                const noTasksMessage = document.createElement("p");
                noTasksMessage.textContent = "No completed tasks available.";
                noTasksMessage.style.fontSize = "30px";
                noTasksMessage.style.marginTop = "50px";
                noTasksMessage.style.textAlign = "center";
                noTasksMessage.style.fontStyle = "italic";
                noTasksMessage.style.marginBottom = "50px";
                taskListDiv.appendChild(noTasksMessage);
            } else {
                // Populate the container with completed tasks
                completedTasks.forEach((task) => {
                    const taskItem = document.createElement("div");
                    taskItem.classList.add("task-item");
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

                this.showMessage("Completed tasks successfully retrieved!");
            }

            // Show the modal with completed tasks
            const retrieveTasksModal = document.getElementById("retrieveTasksModal");
            retrieveTasksModal.style.display = "flex";
        } catch (error) {
            this.showMessage("Something went wrong while retrieving completed tasks.");
            console.error("Error fetching completed tasks:", error);
        }
    }

    /**
     * Fetch and display incomplete tasks.
     */
    async onGetIncompleteTasks(event) {
        // Prevent default form submission behavior
        event.preventDefault();

        try {
            const incompleteTasks = await this.client.getIncompleteTasks(this.errorHandler);

            const taskListDiv = document.getElementById("taskList");
            taskListDiv.innerHTML = "";

            if (incompleteTasks.length === 0) {
                const noTasksMessage = document.createElement("p");
                noTasksMessage.textContent = "No incomplete tasks available.";
                noTasksMessage.style.fontSize = "30px";
                noTasksMessage.style.marginTop = "50px";
                noTasksMessage.style.textAlign = "center";
                noTasksMessage.style.fontStyle = "italic";
                noTasksMessage.style.marginBottom = "50px";
                taskListDiv.appendChild(noTasksMessage);
            } else {
                incompleteTasks.forEach((task) => {
                    const taskItem = document.createElement("div");
                    taskItem.classList.add("task-item");
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

                this.showMessage("Incomplete tasks successfully retrieved!");
            }

            const retrieveTasksModal = document.getElementById("retrieveTasksModal");
            retrieveTasksModal.style.display = "flex";
        } catch (error) {
            this.showMessage("Something went wrong while retrieving incomplete tasks.");
            console.error("Error fetching incomplete tasks:", error);
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

    loadingSpinner(show) {
        const spinner = document.getElementById("loadingSpinner");
        if (show) {
            spinner.style.display = "block";
        } else {
            spinner.style.display = "none";
        }
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
window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("confirmationModal").style.display = "none";
    document.getElementById("modalOverlay").style.display = "none";
    document.getElementById("updateTaskModal").style.display = "none";
    document.getElementById("addTaskModal").style.display = "none";
    document.getElementById("retrieveTasksModal").style.display = "none";
    document.getElementById("loadingSpinner").style.display = "none";
});

window.addEventListener("DOMContentLoaded", main);