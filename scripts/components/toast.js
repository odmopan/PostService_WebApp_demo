/**
 * Спливаюче повідомлення у верхній частині сторінки.
 * Має три стани: success, warning, error.
 */
class Toast {
    static SUCCESS = 'success';
    static WARNING = 'warning';
    static ERROR = 'error';

    constructor(element = document.getElementById('toast')) {
        this.element = element;
        this.timerId = null;
    }

    /**
     * Показує повідомлення
     * @param {string} title заголовок повідомлення
     * @param {string} body детальний текст (необов'язковий)
     * @param {string} type success | warning | error
     * @param {number} duration час показу в мс, 0 - не ховати автоматично
     */
    show(title, body = '', type = Toast.SUCCESS, duration = 5000) {
        //знищуємо попередній таймер що ховає повідомлення
        clearTimeout(this.timerId);
        //очищуємо вміст блоку з повідомленням
        this.element.replaceChildren();

        const titleEl = document.createElement('strong');
        titleEl.className = 'toast-title';
        titleEl.textContent = title;
        this.element.appendChild(titleEl);

        if (body) {
            const bodyEl = document.createElement('p');
            bodyEl.className = 'toast-body';
            bodyEl.textContent = body;
            this.element.appendChild(bodyEl);
        }

        this.element.className = 'toast toast-' + type;
        this.element.removeAttribute('hidden');
        // помилки одразу озвучуються екранним диктором, решта - ввічливо
        this.element.setAttribute('role', type === Toast.ERROR ? 'alert' : 'status');
        
        //ховаємо повідомлення через деякий час
        if (duration > 0) {
            //запамятаємо вказівник на таймер щоб можна було його зупинити якщо повідомлення буде показано ще раз
            this.timerId = setTimeout(() => {

                this.hide();
            }, duration);
        }
    }

    success(title, body, duration) {
        this.show(title, body, Toast.SUCCESS, duration);
    }

    warning(title, body, duration) {
        this.show(title, body, Toast.WARNING, duration);
    }

    error(title, body, duration) {
        this.show(title, body, Toast.ERROR, duration);
    }

    hide() {
        clearTimeout(this.timerId);
        this.element.setAttribute('hidden', '');
        this.element.replaceChildren();
    }
}
