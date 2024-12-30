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
            text: message,
            duration: 4500,
            gravity: "top",
            position: 'right',
            close: true,
            style: {
                background: "linear-gradient(135deg, #1D976C 0%, #93F9B9 100%)", // Success green gradient
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
            className: "toastify-custom-progress success-bar" // Unique class for success
        }).showToast();
    }

    errorHandler(error) {
        Toastify({
            text: error,
            duration: 4500,
            gravity: "top",
            position: 'right',
            close: true,
            style: {
                background: "linear-gradient(135deg, #D93D3D 0%, #FF9A9A 100%)", // Error red gradient
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
            className: "toastify-custom-progress error-bar" // Unique class for error
        }).showToast();
    }

    showWarning(message) {
        Toastify({
            text: message,
            duration: 4500,
            gravity: "top",
            position: 'right',
            close: true,
            style: {
                background: "linear-gradient(135deg, #FFB84D 0%, #FFEB99 100%)", // Warning yellow gradient
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
            className: "toastify-custom-progress warning-bar" // Unique class for warning
        }).showToast();
    }

    showInfo(message) {
        Toastify({
            text: message,
            duration: 4500,
            gravity: "top",
            position: 'right',
            close: true,
            style: {
                background: "linear-gradient(135deg, #00A9FF 0%, #75E1FF 100%)", // Info blue gradient
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
            className: "toastify-custom-progress info-bar" // Unique class for info
        }).showToast();
    }
}
