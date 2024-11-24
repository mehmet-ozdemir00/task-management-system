import BaseClass from "../util/baseClass";
import axios from 'axios'

export default class Client extends BaseClass {
    constructor(props = {}){
        super();
        const methodsToBind = ['clientLoaded', 'createTask', 'updateTask', 'deleteTask', 'getAllTasks', 'getIncompleteTasks', 'getCompletedTasks'];
        this.bindClassMethods(methodsToBind, this);
        this.props = props;
        this.clientLoaded(axios);
    }

    /**
     * Run any functions that are supposed to be called once the client has loaded successfully.
     * @param client The client that has been successfully loaded.
     */
    clientLoaded(client) {
        this.client = client;
        if (this.props.hasOwnProperty("onReady")){
            this.props.onReady();
        }
    }

    async createTask(request, errorCallback) {
        try {
            const response = await this.client.post(`/tasks`, {
                title: request.title,
                description: request.description,
                assignedTo: request.assignedTo,
                status: request.status,
                priority: request.priority,
                taskDueDate: request.taskDueDate
            });
            return response.data;
        } catch (error) {
            this.handleError("createTask", error, errorCallback);
        }
    }

    async getTask(id, errorCallback) {
        try {
            const response = await this.client.get(`/tasks/${id}`);
            return response.data;
        } catch (error) {
            this.handleError("getTask", error, errorCallback);
        }
    }

    async getAllTasks(errorCallback) {
        try {
            const response = await this.client.get(`/tasks/all`);
            return response.data;
        } catch (error) {
            this.handleError("getAllTasks", error, errorCallback);
        }
    }

    async getIncompleteTasks(errorCallback) {
        try {
            const response = await this.client.get(`/tasks/incomplete`);
            return response.data;
        } catch (error) {
            this.handleError("getIncompleteTasks", error, errorCallback);
        }
    }

    async getCompletedTasks(errorCallback) {
        try {
            const response = await this.client.get(`/tasks/completed`);
            return response.data;
        } catch (error) {
            this.handleError("getCompletedTasks", error, errorCallback);
        }
    }

    async updateTask(id, request, errorCallback) {
        try {
            const response = await this.client.put(`/tasks/${id}`, {
                title: request.title,
                description: request.description,
                assignedTo: request.assignedTo,
                status: request.status,
                priority: request.priority,
                taskDueDate: request.taskDueDate
            });
            return response.data;
        } catch (error) {
            this.handleError("updateTask", error, errorCallback);
        }
    }

    async deleteTask(id, errorCallback) {
        try {
            const response = await this.client.delete(`/tasks/${id}`);
            return response.data;
        } catch (error) {
            this.handleError("deleteTask", error, errorCallback);
        }
    }

    /**
     * Helper method to log the error and run any error functions.
     * @param error The error received from the server.
     * @param errorCallback (Optional) A function to execute if the call fails.
     */

    handleError(method, error, errorCallback) {
        console.error(method + " failed - " + error);
        if (error.response.data.message !== undefined) {
            console.error(error.response.data.message);
        }
        if (errorCallback) {
            errorCallback(method + " failed - " + error);
        }
    }
}