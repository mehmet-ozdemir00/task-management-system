import TaskUtility from "../util/TaskUtility";
import BaseClass from "../util/baseClass";
import DataStore from "../util/DataStore";
import Client from "../api/client";

class LogoutPage extends BaseClass {
    constructor() {
        super();
        this.bindClassMethods(['mount' ], this);
        this.dataStore = new DataStore();
    }

    async mount() {
        this.client = new Client();
    }
}

/**
*  Main method to run when the page contents have loaded.
*/
const main = async () => {
    const logoutPage = new LogoutPage();
    logoutPage.mount();
};

window.addEventListener('DOMContentLoaded', main);