import Toastify from "toastify-js";

export default class BaseClass {
    /**
     * Binds all of the methods to "this" object. These methods will now have the state of the instance object.
     * @param methods The name of each method to bind.
     * @param classInstance The instance of the class to bind the methods to.
     */
    bindClassMethods(methods, classInstance) {
        methods.forEach(method => {
            classInstance[method] = classInstance[method].bind(classInstance);
        });
    }

    formatCurrency(amount) {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        });
        return formatter.format(amount);
    }

    showMessage(message) {
        Toastify({
            text: `<div style="display: flex; align-items: center;">
                   <i class="fas fa-check-circle" style="color: #217526; font-size: 30px;"></i>
                   <span style="margin-left: 10px;">
                       <strong> Success</strong><br>${message}
                   </span>
               </div>`,
            escapeMarkup: false,
            duration: 4000,
            gravity: "top",
            position: 'right',
            close: false,
            style: {
                background: "linear-gradient(135deg, #71D88A 0%, #FFFFFF 100%)",
                color: "#000000",
                borderRadius: "5px",
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3), 0px 2px 4px rgba(0, 0, 0, 0.5)",
                padding: "14px 20px",
                fontSize: "15px",
                transition: "all 0.5s ease-in-out",
                fontWeight: "550"
            },
            offset: {
                x: 20,
                y: 20
            },
            stopOnFocus: true,
            className: "toastify-custom-progress success-bar"
        }).showToast();
    }

    errorHandler(error) {
        Toastify({
            text: `<div style="display: flex; align-items: center;">
                   <i class="fas fa-times-circle" style="color: #b42209; font-size: 30px;"></i>
                   <span style="margin-left: 10px;">
                       <strong> Error</strong><br>${error}
                   </span>
               </div>`,
            escapeMarkup: false,
            duration: 4000,
            gravity: "top",
            position: 'right',
            close: false,
            style: {
                background: "linear-gradient(135deg, #FF8C8C 0%, #FFFFFF 100%)",
                color: "#000000",
                borderRadius: "5px",
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3), 0px 2px 4px rgba(0, 0, 0, 0.5)",
                padding: "14px 20px",
                fontSize: "15px",
                transition: "all 0.5s ease-in-out",
                fontWeight: "550"
            },
            offset: {
                x: 20,
                y: 20
            },
            stopOnFocus: true,
            className: "toastify-custom-progress error-bar"
        }).showToast();
    }

    showWarning(message) {
        Toastify({
            text: `<div style="display: flex; align-items: center;">
                   <i class="fas fa-exclamation-triangle" style="color: #d58001; font-size: 30px;"></i>
                   <span style="margin-left: 10px;">
                       <strong> Warning</strong><br>${message}
                   </span>
               </div>`,
            escapeMarkup: false,
            duration: 4000,
            gravity: "top",
            position: 'right',
            close: false,
            style: {
                background: "linear-gradient(135deg, #FFE066 0%, #FFFFFF 100%)",
                color: "#000000",
                borderRadius: "5px",
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3), 0px 2px 4px rgba(0, 0, 0, 0.5)",
                padding: "14px 20px",
                fontSize: "15px",
                transition: "all 0.5s ease-in-out",
                fontWeight: "550"
            },
            offset: {
                x: 20,
                y: 20
            },
            stopOnFocus: true,
            className: "toastify-custom-progress warning-bar"
        }).showToast();
    }

    showInfo(message) {
        Toastify({
            text: `<div style="display: flex; align-items: center;">
                   <i class="fas fa-info-circle" style="color: #0179c9; font-size: 30px;"></i>
                   <span style="margin-left: 10px;">
                       <strong> Info</strong><br>${message}
                   </span>
               </div>`,
            escapeMarkup: false,
            duration: 4000,
            gravity: "top",
            position: 'right',
            close: false,
            style: {
                background: "linear-gradient(135deg, #4D9FFF 0%, #FFFFFF 100%)",
                color: "#000000",
                borderRadius: "5px",
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3), 0px 2px 4px rgba(0, 0, 0, 0.5)",
                padding: "14px 20px",
                fontSize: "15px",
                transition: "all 0.5s ease-in-out",
                fontWeight: "550"
            },
            offset: {
                x: 20,
                y: 20
            },
            stopOnFocus: true,
            className: "toastify-custom-progress info-bar"
        }).showToast();
    }
}
