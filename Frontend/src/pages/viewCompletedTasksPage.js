import BaseClass from "../util/baseClass";
import DataStore from "../util/DataStore";
import Client from "../api/client";

class ViewCompletedTasksPage extends BaseClass {

    constructor() {
        super();
        this.bindClassMethods(['renderTask', 'onGetCompletedTasks'], this);
        this.dataStore = new DataStore();
    }

    /**
     * Once the page has loaded, set up the event handlers and fetch the concert list.
     */
    async mount() {
        this.client = new Client();
        document.getElementById('get-completed-tasks-form').addEventListener('submit', this.onGetCompletedTasks);
        this.dataStore.addChangeListener(this.renderTask);
    }


    // Render Methods --------------------------------------------------------------------------------------------------

    async renderTask() {
        let resultArea = document.getElementById("result-info");
        const resultCard = document.getElementById("result");
        const taskList = this.dataStore.get("taskList");

        resultCard.style.display = 'block';
        resultArea.innerHTML = "";

        if (taskList && taskList.length > 0) {
            taskList.forEach((task, index) => {
                resultArea.innerHTML += `
                <div style="font-size: 1.4em; font-style: italic;"><strong>ID:</strong> ${task.taskId}</div>
                <div style="font-size: 1.4em; font-style: italic;"><strong>Title:</strong> ${task.title}</div>
                <div style="font-size: 1.4em; font-style: italic;"><strong>Description:</strong> ${task.description}</div>
                <div style="font-size: 1.4em; font-style: italic;"><strong>AssignedTo:</strong> ${task.assignedTo}</div>
                <div style="font-size: 1.4em; font-style: italic;"><strong>Status:</strong> ${task.status}</div>
                <div style="font-size: 1.4em; font-style: italic;"><strong>Priority:</strong> ${task.priority}</div>
                <div style="font-size: 1.4em; font-style: italic;"><strong>Task Due Date:</strong> ${task.taskDueDate}</div>
            `;
                if (index < taskList.length - 1) {
                    resultArea.innerHTML += '<hr style="border-top: 2px solid #444; margin: 20px 0;">';
                }
            });
        } else {
            resultArea.innerHTML = `<span style="font-size: 1.5em; font-weight: bold; font-style: italic;">No Task Details Available!!!</span>`;
        }
    }


    // Event Handlers --------------------------------------------------------------------------------------------------

    // Fetch Completed Tasks
    async onGetCompletedTasks(event) {
        // Prevent the page from refreshing on form submit
        event.preventDefault();

        this.showMessage("Retrieving completed tasks! Please wait...");
        try {
            const completedTasks = await this.client.getCompletedTasks(this.errorHandler);
            if (completedTasks.length == 0) {
                throw new Error("No completed task available..");
            } else {
                this.dataStore.set("taskList", completedTasks);
            }
        } catch (error) {
            this.dataStore.set("taskList", null);
        }
    }
}


/**
 * Main method to run when the page contents have loaded.
 */
const main = async () => {
    const viewCompletedTasksPage = new ViewCompletedTasksPage();
    viewCompletedTasksPage.mount();
};

window.addEventListener('DOMContentLoaded', main);