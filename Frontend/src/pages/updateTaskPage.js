//import BaseClass from "../util/baseClass";
//import DataStore from "../util/DataStore";
//import Client from "../api/client";
//
//class UpdateTaskPage extends BaseClass {
//
//    constructor() {
//        super();
//        this.bindClassMethods(['renderTask', 'onUpdateTask'], this);
//        this.dataStore = new DataStore();
//    }
//
//    /**
//     * Once the page has loaded, set up the event handlers and fetch the concert list.
//     */
//    async mount() {
//        this.client = new Client();
//        document.getElementById('update-task-form').addEventListener('submit', this.onUpdateTask);
//        this.dataStore.addChangeListener(this.renderTask);
//    }
//
//    // Render Methods --------------------------------------------------------------------------------------------------
//
//    async renderTask() {
//        let resultArea = document.getElementById("result-info");
//        const resultCard = document.getElementById("result");
//        resultArea.innerHTML = '';
//        const taskRecord = this.dataStore.get("taskRecord");
//
//        if (taskRecord) {
//            resultCard.style.display = 'block';
//            resultArea.innerHTML = `
//                <div style="font-size: 1.4em; font-style: italic;"><strong>ID:</strong> ${taskRecord.taskId}</div>
//                <div style="font-size: 1.4em; font-style: italic;"><strong>Title:</strong> ${taskRecord.title}</div>
//                <div style="font-size: 1.4em; font-style: italic;"><strong>Description:</strong> ${taskRecord.description}</div>
//                <div style="font-size: 1.4em; font-style: italic;"><strong>AssignedTo:</strong> ${taskRecord.assignedTo}</div>
//                <div style="font-size: 1.4em; font-style: italic;"><strong>Status:</strong> ${taskRecord.status}</div>
//                <div style="font-size: 1.4em; font-style: italic;"><strong>Priority:</strong> ${taskRecord.priority}</div>
//                <div style="font-size: 1.4em; font-style: italic;"><strong>Task Due Date:</strong> ${taskRecord.taskDueDate}</div>
//            `;
//        } else {
//            resultCard.style.display = 'none';
//            resultArea.innerHTML = `<span style="font-size: 1.5em; font-weight: bold; font-style: italic;"> No Task Details Available </span>`;
//        }
//    }
//
//
//    // Event Handlers --------------------------------------------------------------------------------------------------
//
//    async onUpdateTask(event) {
//        // Prevent the page from refreshing on form submit
//        event.preventDefault();
//
//        const taskId = document.getElementById('task-id').value.trim();
//        const title = document.getElementById('task-title').value.trim();
//        const description = document.getElementById('description').value.trim();
//        const assignedTo = document.getElementById('assigned-to').value.trim();
//        const status = document.getElementById('status').value.trim();
//        const priority = document.getElementById('priority').value.trim();
//        const taskDueDate = document.getElementById('task-due-date').value;
//
//        if (!taskId || !title || !description || !assignedTo || !status || !priority || !taskDueDate) {
//            this.errorHandler("All fields must be filled out and task ID must be valid.");
//            this.errorHandler("Error updating task! Try again...");
//            return;
//        }
//
//        const request = { title, description, assignedTo, status, priority, taskDueDate };
//
//        this.showMessage(`Updating task, Please wait..`);
//        try {
//            const updatedTask = await this.client.updateTask(taskId, request);
//            this.dataStore.set('taskRecord', updatedTask);
//
//            if (updatedTask) {
//                this.showMessage(`Task successfully updated!`);
//            } else {
//                this.errorHandler("Error updating task! Try again...");
//            }
//        } catch (error) {
//            this.errorHandler("Error updating task! Try again...");
//        }
//    }
//}
//
//
///**
// * Main method to run when the page contents have loaded.
// */
//const main = async () => {
//    const updateTaskPage = new UpdateTaskPage();
//    updateTaskPage.mount();
//};
//
//window.addEventListener('DOMContentLoaded', main);