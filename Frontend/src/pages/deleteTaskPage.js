//import BaseClass from "../util/baseClass";
//import DataStore from "../util/DataStore";
//import Client from "../api/client";
//
//class DeleteTaskPage extends BaseClass {
//
//    constructor() {
//        super();
//        this.bindClassMethods(['renderResult', 'onDeleteTask'], this);
//        this.dataStore = new DataStore();
//    }
//
//    /**
//     * Once the page has loaded, set up the event handlers and fetch the concert list.
//     */
//    async mount() {
//        this.client = new Client();
//        document.getElementById('delete-task-form').addEventListener('submit', this.onDeleteTask);
//        this.dataStore.addChangeListener(this.renderResult);
//    }
//
//
//    // Render Methods --------------------------------------------------------------------------------------------------
//
//    async renderResult() {
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
//    async onDeleteTask(event) {
//        // Prevent the page from refreshing on form submit
//        event.preventDefault();
//
//        const taskId = document.getElementById('task-id').value.trim();
//
//        if (!taskId) {
//            this.errorHandler("Invalid input. Please provide a valid task ID.");
//            this.errorHandler("Error deleting task! Try again...");
//            return;
//        }
//
//        this.showMessage(`Deleting task, Please wait...`);
//        try {
//            const deletedTask = await this.client.deleteTask(taskId);
//            this.dataStore.set('taskRecord', deletedTask);
//
//            if (deletedTask) {
//                this.showMessage(`Task successfully deleted!`);
//            } else {
//                this.errorHandler("Error deleting task! Try again...");
//            }
//        } catch (error) {
//            if (error.response && error.response.status == 400) {
//                this.errorHandler("Invalid input. Please provide a valid appointment ID.");
//            } else {
//                this.errorHandler("Error deleting appointment! Try again...");
//            }
//        }
//    }
//}
//
//
///**
// * Main method to run when the page contents have loaded.
// */
//const main = async () => {
//    const deleteTaskPage = new DeleteTaskPage();
//    deleteTaskPage.mount();
//};
//
//window.addEventListener('DOMContentLoaded', main);