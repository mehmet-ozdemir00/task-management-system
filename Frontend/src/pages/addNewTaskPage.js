//import BaseClass from "../util/baseClass";
//import DataStore from "../util/DataStore";
//import Client from "../api/client";
//
//class AddNewTaskPage extends BaseClass {
//
//    constructor() {
//        super();
//        this.bindClassMethods(['renderTask', 'onCreateTask'], this);
//        this.dataStore = new DataStore();
//    }
//
//    /**
//     * Once the page has loaded, set up the event handlers and fetch the concert list.
//     */
//    async mount() {
//        this.client = new Client();
//        document.getElementById('add-task-form').addEventListener('submit', this.onCreateTask);
//        this.dataStore.addChangeListener(this.renderTask);
//    }
//
//
//    // Render Methods --------------------------------------------------------------------------------------------------
//
//    async renderTask() {
//        let resultArea = document.getElementById("result-info");
//        const resultCard = document.getElementById("result");
//        const taskRecord = this.dataStore.get("taskRecord");
//
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
//    async onCreateTask(event) {
//        // Prevent the page from refreshing on form submit
//        event.preventDefault();
//
//        const title = document.getElementById('task-title').value.trim();
//        const description = document.getElementById('description').value.trim();
//        const assignedTo = document.getElementById('assigned-to').value.trim();
//        const status = document.getElementById('status').value.trim();
//        const priority = document.getElementById('priority').value.trim();
//        const taskDueDate = document.getElementById('task-due-date').value;
//
//        if (!title || !description || !assignedTo || !status || !priority || !taskDueDate) {
//            this.errorHandler("All fields must be filled out.");
//            this.errorHandler("Error creating appointment! Try again...");
//            return;
//        }
//
//        const request = { title, description, assignedTo, status, priority, taskDueDate };
//
//        this.showMessage(`Submitting task.. Please wait!`);
//        try {
//            const createdTask = await this.client.createTask(request, this.errorHandler);
//            this.dataStore.set('taskRecord', createdTask);
//
//            if (createdTask) {
//                this.showMessage(`Task successfully created!`);
//            } else {
//                this.errorHandler("Error creating task! Try again...");
//            }
//        } catch (error) {
//            this.errorHandler("Error creating task! Try again...");
//        }
//    }
//}
//
//
///**
// * Main method to run when the page contents have loaded.
// */
//const main = async () => {
//    const addNewTaskPage = new AddNewTaskPage();
//    addNewTaskPage.mount();
//};
//
//window.addEventListener('DOMContentLoaded', main);