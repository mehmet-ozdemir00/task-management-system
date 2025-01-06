import TaskUtility from "../util/TaskUtility";
import BaseClass from "../util/baseClass";
import DataStore from "../util/DataStore";
import Client from "../api/client";

class ReportPage extends BaseClass {
    constructor() {
        super();
        this.bindClassMethods(['mount', 'updateNotifications', 'updateTaskCounts', 'updateTaskCountsBar', 'renderAnalytics', 'initializeChart', 'initializeLineChart'], this);
        this.dataStore = new DataStore();
        this.taskUtility = new TaskUtility(
            () => {}, // updateDailyTask
            () => {}, // onUpdateTask
            () => {}, // onDeleteTask
            this.updateTaskCounts
        );
    }

    /**
    *  Once the page has loaded, set up the event handlers and fetch the task list.
    */
    async mount() {
        this.client = new Client();
        await this.taskUtility.mount();
        this.initializeChart();
        this.initializeLineChart();
        this.addEventListeners();
    }

    /**
    *   Add event listeners for buttons and actions.
    */
    addEventListeners() {
        const notificationIcon = document.getElementById("notification-icon");
        const notificationDropdown = document.getElementById("notification-dropdown");

        // Handle edge case if dropdown or icon does not exist
        if (!notificationDropdown || !notificationIcon) {
            this.showWarning("Notification dropdown or icon could not be found.");
            return;
        }

        // Toggle dropdown visibility on click
        notificationIcon.addEventListener("click", (event) => {
            event.stopPropagation();
            notificationDropdown.classList.toggle("active");
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", (event) => {
            if (!notificationDropdown.contains(event.target) && !notificationIcon.contains(event.target)) {
                notificationDropdown.classList.remove("active");
            }
        });

        // Prevent dropdown from closing if clicked inside it
        notificationDropdown.addEventListener("click", (event) => {
            event.stopPropagation();
        });
    }

    /**
    *  Update notifications in the ProjectPage context
    *  @param {Array} taskList - The list of tasks to update notifications
    */
    updateNotifications(taskList) {
        // Call the updateNotifications method from TaskUtility
        this.taskUtility.updateNotifications(taskList);
    }

    /**
    *  Update the UI with analytics data.
    */
    renderAnalytics() {
        // Call renderAnalytics from TaskUtility
        this.taskUtility.renderAnalytics();
        this.initializeChart();
    }

    /**
     * Update the task counts in the HTML based on the task statuses.
     * @param {Array} taskList - The list of tasks fetched from the server.
    */
    updateTaskCounts(taskList) {
        // Edge case for empty task list
        if (!taskList || taskList.length === 0) {
            this.showInfo("No task data is available to display.");

            // Reset task counts to 0
            const emptyCounts = {
                completed: 0,
                inProgress: 0,
                canceled: 0,
                overdue: 0,
                pending: 0,
                onHold: 0
            };

            // Update HTML counts for empty state
            document.querySelector(".card:nth-child(1) .task-count").textContent = emptyCounts.completed;
            document.querySelector(".card:nth-child(2) .task-count").textContent = emptyCounts.inProgress;
            document.querySelector(".card:nth-child(3) .task-count").textContent = emptyCounts.canceled;
            document.querySelector(".card:nth-child(4) .task-count").textContent = emptyCounts.pending;
            document.querySelector(".card:nth-child(5) .task-count").textContent = emptyCounts.overdue;
            document.querySelector(".card:nth-child(6) .task-count").textContent = emptyCounts.onHold;

            // Reset progress bars and chart for empty state
            this.updateTaskCountsBar({ completed: 0, inProgress: 0, canceled: 0, pending: 0, overdue: 0, onHold: 0 });
            this.initializeChart(emptyCounts, { completed: "0.0", inProgress: "0.0", canceled: "0.0", pending: "0.0", overdue: "0.0", onHold: "0.0" });
            return;
        }

        // Initialize task counts
        let counts = {
            completed: 0,
            inProgress: 0,
            canceled: 0,
            overdue: 0,
            pending: 0,
            onHold: 0
        };

        // Today's date for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = today.toISOString().split("T")[0];

        // Iterate through tasks and update counts
        taskList.forEach((task) => {
            const taskDueDate = new Date(task.taskDueDate);
            const taskDueDateString = taskDueDate.toISOString().split("T")[0];
            const isOverdue = taskDueDateString < todayString;

            switch (task.status) {
                case "Completed":
                    counts.completed++;
                    break;
                case "In Progress":
                    isOverdue ? counts.overdue++ : counts.inProgress++;
                    break;
                case "Canceled":
                    counts.canceled++;
                    break;
                case "Pending":
                    isOverdue ? counts.overdue++ : counts.pending++;
                    break;
                case "On Hold":
                    counts.onHold++;
                    break;
            }
        });

        // Calculate total tasks
        const totalTasks = Object.values(counts).reduce((sum, count) => sum + count, 0);

        // Calculate percentages
        const percentages = this.calculatePercentages(totalTasks, counts);

        // Update HTML counts
        document.querySelector(".card:nth-child(1) .task-count").textContent = counts.completed;
        document.querySelector(".card:nth-child(2) .task-count").textContent = counts.inProgress;
        document.querySelector(".card:nth-child(3) .task-count").textContent = counts.canceled;
        document.querySelector(".card:nth-child(4) .task-count").textContent = counts.pending;
        document.querySelector(".card:nth-child(5) .task-count").textContent = counts.overdue;
        document.querySelector(".card:nth-child(6) .task-count").textContent = counts.onHold;

        // Update progress bars
        this.updateTaskCountsBar(percentages);

        // Update chart
        this.initializeChart(counts, percentages);

        document.getElementById("no-data-message").style.display = "none";
    }

    /**
     * Update the progress bars based on the task counts.
     * @param {number} completedCount - Count of completed tasks.
     * @param {number} inProgressCount - Count of in-progress tasks.
     * @param {number} canceledCount - Count of canceled tasks.
     * @param {number} overdueCount - Count of overdue tasks.
    */
    updateTaskCountsBar(percentages) {
        const updateBar = (selector, percentage, explanationSelector, explanationText) => {
            const bar = document.querySelector(selector);
            bar.style.width = `${percentage}%`;
            bar.querySelector(".progress-text").textContent = `${percentage}%`;
            bar.classList.toggle("default", percentage === "0.0");

            // Update explanation text dynamically
            document.querySelector(explanationSelector).textContent = explanationText;
        };

        // Update each bar and explanation text
        updateBar(
            ".indicator-bar.completed",
            percentages.completed,
            "#completed-explanation",
            `${percentages.completed}% of tasks are completed.`
        );

        updateBar(
            ".indicator-bar.in-progress",
            percentages.inProgress,
            "#in-progress-explanation",
            `${percentages.inProgress}% of tasks are in progress.`
        );

        updateBar(
            ".indicator-bar.canceled",
            percentages.canceled,
            "#canceled-explanation",
            `${percentages.canceled}% of tasks are canceled.`
        );

        updateBar(
            ".indicator-bar.pending",
            percentages.pending,
            "#pending-explanation",
            `${percentages.pending}% of tasks are pending.`
        );

        updateBar(
            ".indicator-bar.overdue",
            percentages.overdue,
            "#overdue-explanation",
            `${percentages.overdue}% of tasks are overdue.`
        );

        updateBar(
            ".indicator-bar.on-hold",
            percentages.onHold,
            "#on-hold-explanation",
            `${percentages.onHold}% of tasks are on hold.`
        );
    }

    /**
    * Calculate percentages for each task status based on the total tasks.
    * @param {number} totalTasks - Total number of tasks.
    * @param {object} counts - Object containing task counts for each status.
    * @returns {object} Percentages for each task status.
    */
    calculatePercentages(totalTasks, counts) {
        // Initialize percentages
        let percentages = {
            completed: ((counts.completed / totalTasks) * 100).toFixed(1),
            inProgress: ((counts.inProgress / totalTasks) * 100).toFixed(1),
            canceled: ((counts.canceled / totalTasks) * 100).toFixed(1),
            pending: ((counts.pending / totalTasks) * 100).toFixed(1),
            overdue: ((counts.overdue / totalTasks) * 100).toFixed(1),
            onHold: ((counts.onHold / totalTasks) * 100).toFixed(1)
        };

        // Adjust percentages to handle rounding errors
        let totalPercentage = Object.values(percentages).reduce((acc, val) => acc + parseFloat(val), 0);
        const adjustment = 100 - totalPercentage;

        if (adjustment !== 0) {
            if (counts.overdue > 0) percentages.overdue = (parseFloat(percentages.overdue) + adjustment).toFixed(1);
            else if (counts.pending > 0) percentages.pending = (parseFloat(percentages.pending) + adjustment).toFixed(1);
            else if (counts.completed > 0) percentages.completed = (parseFloat(percentages.completed) + adjustment).toFixed(1);
        }
        return percentages;
    }

    /**
     * Initialize or update the task percentage chart dynamically.
    */
    initializeChart() {
        const analytics = this.taskUtility.dataStore.get("analytics");
        const chart = document.getElementById("myChart");
        const noDataMessage = document.getElementById("no-data-message");

        // Check if there is no data or if the total tasks are zero
        if (!analytics || analytics.totalTasks === 0) {
            chart.style.display = "none";
            noDataMessage.style.display = "block";
        } else {
            chart.style.display = "block";
            noDataMessage.style.display = "none";

            // Prepare the task data
            const counts = {
                completed: 0,
                inProgress: 0,
                canceled: 0,
                pending: 0,
                overdue: 0,
                onHold: 0
            };

            // Today's date for comparison
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayString = today.toISOString().split("T")[0];

            // Iterate through tasks and update counts
            analytics.tasks.forEach((task) => {
                const taskDueDate = new Date(task.taskDueDate);
                const taskDueDateString = taskDueDate.toISOString().split("T")[0];
                const isOverdue = taskDueDateString < todayString;

                switch (task.status) {
                    case "Completed":
                        counts.completed++;
                        break;
                    case "In Progress":
                        isOverdue ? counts.overdue++ : counts.inProgress++;
                        break;
                    case "Canceled":
                        counts.canceled++;
                        break;
                    case "Pending":
                        isOverdue ? counts.overdue++ : counts.pending++;
                        break;
                    case "On Hold":
                        counts.onHold++;
                        break;
                }
            });

            // Calculate total tasks
            const totalTasks = Object.values(counts).reduce((sum, count) => sum + count, 0);

            // Calculate percentages for chart
            const percentages = this.calculatePercentages(totalTasks, counts);

            // Prepare task data for chart
            const taskData = [
                { label: 'Completed', value: counts.completed, color: '#04c204' },
                { label: 'In Progress', value: counts.inProgress, color: '#FFA500' },
                { label: 'Canceled', value: counts.canceled, color: '#FF6347' },
                { label: 'Pending', value: counts.pending, color: '#00BFFF' },
                { label: 'Overdue', value: counts.overdue, color: '#8B0000' },
                { label: 'On Hold', value: counts.onHold, color: '#7D7D7D' }
            ];

            // Filter out tasks with a value of 0
            const filteredTasks = taskData.filter(task => task.value > 0);

            // Extract the labels, data, and colors for the chart
            const labels = filteredTasks.map(task => task.label);
            const data = filteredTasks.map(task => task.value);
            const ctx = document.getElementById('myChart').getContext('2d');

            // Create gradients for each task type
            const gradients = filteredTasks.map(task => {
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, `${task.color}`);
                gradient.addColorStop(1, `${task.color}66`);
                return gradient;
            });

            // Destroy the previous chart instance if it exists
            if (this.chart) {
                this.chart.destroy();
            }

            // Create the new chart
            this.chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: gradients,
                        borderColor: gradients,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 1.5,
                    plugins: {
                        legend: {
                            display: false,
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function (tooltipItem) {
                                    const taskType = tooltipItem.label;
                                    const taskCount = tooltipItem.raw;
                                    const total = tooltipItem.dataset.data.reduce((acc, val) => acc + val, 0);
                                    const percentage = ((taskCount / total) * 100).toFixed(1);
                                    return `${taskType}: ${taskCount} tasks (${percentage}%)`;
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: () => {
                                const total = data.reduce((acc, val) => acc + val, 0);
                                return `Task Status Overview (Total: ${total} Tasks)`;
                            },
                            font: {
                                size: 20,
                                family: 'Arial, Helvetica, sans-serif',
                                weight: 'bold'
                            },
                            padding: {
                                top: 10,
                                bottom: 20
                            },
                        },
                        subtitle: {
                            display: true,
                            text: 'Visual representation of task status distribution',
                            font: {
                                size: 15,
                                family: 'Arial, Helvetica, sans-serif',
                                style: 'italic'
                            },
                            padding: {
                                bottom: 50
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Task Status',
                                font: { size: 16, weight: 'bold' }
                            },
                            ticks: {
                                font: { size: 12, weight: 'normal' }
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Total Tasks',
                                font: { size: 16, weight: 'bold' }
                            },
                            ticks: {
                                beginAtZero: true,
                                font: { size: 12, weight: 'normal' },
                                callback: function(value) {
                                    return Number.isInteger(value) ? value : '';
                                }
                            }
                        }
                    },
                    animation: {
                        duration: 1750,
                        easing: 'easeInOutQuint',
                    }
                },
                plugins: [
                    // Percentage Labels Plugin
                    {
                        id: 'percentageLabels',
                        afterDatasetsDraw: function (chart) {
                            const { ctx, data } = chart;
                            const total = data.datasets[0].data.reduce((acc, val) => acc + val, 0);

                            if (total === 0) return;

                            data.datasets[0].data.forEach((value, index) => {
                                const barMeta = chart.getDatasetMeta(0).data[index];
                                const x = barMeta.x;
                                const y = barMeta.y;
                                const barHeight = barMeta.height;
                                const percentage = ((value / total) * 100).toFixed(1);

                                ctx.save();
                                ctx.font = 'bold 14px sans-serif';
                                ctx.fillStyle = 'black';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'center';
                                ctx.fillText(`${percentage}%`, x, y + (barHeight / 2));
                                ctx.restore();
                            });
                        }
                    },
                    // Raw Data Labels Plugin
                    {
                        id: 'dataLabels',
                        afterDatasetsDraw: function (chart) {
                            const { ctx } = chart;

                            chart.data.datasets.forEach((dataset, i) => {
                                const meta = chart.getDatasetMeta(i);
                                meta.data.forEach((bar, index) => {
                                    const data = dataset.data[index];
                                    ctx.save();
                                    ctx.font = 'bold 14px Arial';
                                    ctx.fillStyle = 'black';
                                    ctx.textAlign = 'center';
                                    ctx.textBaseline = 'bottom';
                                    ctx.fillText(data, bar.x, bar.y - 5);
                                    ctx.restore();
                                });
                            });
                        }
                    }
                ]
            });
        }
    }

    /**
    * Renders a line chart for "In Progress" and "Pending" tasks by current date.
    */
    initializeLineChart() {
        const analytics = this.taskUtility.dataStore.get("analytics");
        const lineChartCanvas = document.getElementById("lineChart");
        const noDataMessage = document.getElementById("no-data-text");

        // Constants for task statuses
        const STATUS_IN_PROGRESS = "In Progress";
        const STATUS_PENDING = "Pending";

        // Handle no data scenario
        if (!analytics || analytics.totalTasks === 0) {
            lineChartCanvas.style.display = "none";
            noDataMessage.style.display = "block";
            return;
        } else {
            lineChartCanvas.style.display = "block";
            noDataMessage.style.display = "none";
        }

        // Today's date for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = today.toLocaleDateString('en-CA');

        // Initialize counts
        const taskCountsByDate = {
            [STATUS_IN_PROGRESS]: {},
            [STATUS_PENDING]: {}
        };

        // Group tasks by current date and calculate counts in a single loop
        analytics.tasks.forEach(task => {
            const taskDueDate = task.taskDueDate ? new Date(task.taskDueDate + 'T00:00') : null;
            if (!taskDueDate || isNaN(taskDueDate)) return; // Skip invalid dates

            taskDueDate.setHours(0, 0, 0, 0);
            const taskDueDateString = taskDueDate.toLocaleDateString('en-CA');

            if (taskDueDateString >= todayString) {
                if (task.status === STATUS_IN_PROGRESS) {
                    taskCountsByDate[STATUS_IN_PROGRESS][taskDueDateString] = (taskCountsByDate[STATUS_IN_PROGRESS][taskDueDateString] || 0) + 1;
                } else if (task.status === STATUS_PENDING) {
                    taskCountsByDate[STATUS_PENDING][taskDueDateString] = (taskCountsByDate[STATUS_PENDING][taskDueDateString] || 0) + 1;
                }
            }
        });

        // Combine all relevant dates and sort them
        const allDates = Object.keys({
            ...taskCountsByDate[STATUS_IN_PROGRESS],
            ...taskCountsByDate[STATUS_PENDING]
        }).sort();

        // Prepare data for the chart
        const inProgressData = allDates.map(date => taskCountsByDate[STATUS_IN_PROGRESS][date] || 0);
        const pendingData = allDates.map(date => taskCountsByDate[STATUS_PENDING][date] || 0);

        const totalTasksByDate = allDates.map(date =>
        (taskCountsByDate[STATUS_IN_PROGRESS][date] || 0) +
        (taskCountsByDate[STATUS_PENDING][date] || 0)
        );

        const ctx = lineChartCanvas.getContext('2d');

        // Destroy any existing chart instance
        if (this.lineChart) {
            this.lineChart.destroy();
        }

        // Gradient creation function
        const createGradient = (ctx, color) => {
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, `${color}66`);
            gradient.addColorStop(1, `${color}1A`);
            return gradient;
        };

        // Common dataset configuration
        const commonDatasetConfig = {
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: true,
        };

        // Create the line chart
        this.lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: allDates,
                datasets: [
                    {
                        label: STATUS_IN_PROGRESS,
                        data: inProgressData,
                        borderColor: '#FFA500',
                        backgroundColor: createGradient(ctx, '#FFA500'),
                        ...commonDatasetConfig,
                    },
                    {
                        label: STATUS_PENDING,
                        data: pendingData,
                        borderColor: '#00BFFF',
                        backgroundColor: createGradient(ctx, '#00BFFF'),
                        ...commonDatasetConfig,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Current Dates',
                            font: { size: 16, weight: 'bold' }
                        },
                        grid: {
                            color: "rgba(200, 200, 200, 0.3)",
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Task Count',
                            font: { size: 16, weight: 'bold' }
                        },
                        grid: {
                            color: "rgba(200, 200, 200, 0.3)",
                        },
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Number.isInteger(value) ? value : '';
                            }
                        },
                    },
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            boxWidth: 15,
                            font: {
                                size: 12,
                            },
                        },
                    },
                    title: {
                        display: true,
                        text: 'Remaining Tasks (In Progress & Pending) Over Time',
                        font: {
                            size: 19,
                            weight: 'bold',
                            family: 'Arial, Helvetica, sans-serif'
                        },
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function (tooltipItem) {
                                const dataset = tooltipItem.dataset;
                                const value = Number(tooltipItem.raw) || 0;
                                const total = totalTasksByDate[tooltipItem.dataIndex] || 1;
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${dataset.label}: ${value} Tasks (${percentage}%)`;
                            },
                        },
                    },
                },
            }
        });
    }
}


/**
*  Main method to run when the page contents have loaded.
*/
const main = async () => {
    const reportPage = new ReportPage();
    reportPage.mount();
};

window.addEventListener('DOMContentLoaded', main);