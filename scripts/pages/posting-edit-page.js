/// <reference path="../services/posting-service.js" />
class PostingEditPage {
    constructor(postingService = new PostingService()) {
        this.postingService = postingService;
        this.form = document.getElementById('posting-form');
        this.submitButton = document.getElementById('submit-button');
        //простий компонент що показує статусне повідомлення, що ховається з часом
        this.toast = new Toast();

        this.from = document.getElementById("from");
        this.to = document.getElementById("to");
        this.deliveryType = document.getElementById("delivery-type");
        this.weight = document.getElementById("weight");
    }

    init() {
        const page = this;

        this.submitButton.addEventListener('click', () => {
            this.#onSubmitClick();
        });

        this.form.addEventListener('input', (event) => {
            page.#onFieldInput(event);
        });
        this.form.addEventListener('invalid', (event) => {
            page.#onFieldInvalid(event);
        }, true);
    }

    /**
     * Формує текст повідомлення про помилку валідації даних
     */
    #getErrorMessage(field) {
        const label = this.form.querySelector(`label[for="${field.id}"]`);
        const name = label.textContent.trim();

        if (field.validity.valueMissing) {
            return field.tagName === 'SELECT'
                ? `Оберіть значення поля «${name}»`
                : `Поле «${name}» є обов’язковим`;
        }

        if (field.validity.badInput) {
            return `Поле «${name}» має містити число`;
        }

        if (field.validity.rangeUnderflow) {
            return `Значення поля «${name}» не може бути від’ємним`;
        }

        if (field.validity.stepMismatch) {
            return `Поле «${name}» має містити ціле число`;
        }
        if (field.validity.tooShort) {
            return `Поле «${name}» надто коротке`;
        }

        if (field.validity.tooLong) {
            return `Поле «${name}» надто довге`;
        }

        return field.validationMessage;
    }
    /**
     * коли користувач вводить дані то викликається ця подія і знімає статус помилки з поля вводу 
     */
    #onFieldInput(event) {

        const target = event.target;
        this.#clearValidationError(target)
    }

    /**
     * викликається коли поле вводу містить помилку, код формує повідомлення та відображає його
    */
    #onFieldInvalid(event) {

        const target = event.target;
        const errorMessage = this.#getErrorMessage(target);
        this.#showValidationError(target, errorMessage);
    }

    /**
     * Очищає та ховає повідомлення про помилку
     */
    #clearValidationError(target) {
        if (!target) throw new Error("'target' обов'язково має бути заданим");
        const errorEl = document.getElementById(target.id + '-error');
        errorEl.textContent = "";
        errorEl.setAttribute("hidden", "");
        target.setCustomValidity("");
    }
    /**
     * Показує повідомлення про помилку
     */
    #showValidationError(inputEl, errorMessage) {
        inputEl.classList.add("validated");
        const errorEl = document.getElementById(inputEl.id + '-error');
        errorEl.textContent = errorMessage;
        errorEl.removeAttribute("hidden");
        inputEl.setCustomValidity(errorMessage);
    }

    /**
     * Власне правило на перевірку максимальної ваги
     */
    #weightValidationRule() {
        this.#clearValidationError(this.weight);
        if (!this.weight.checkValidity()) return false;
        if (this.deliveryType.value === "Department") {
            if ((this.weight.value - 0) > 20) {
                this.#showValidationError(this.weight, "Максимальна вага вантажу не більше 20кг.");
                return false;
            }
        }
        this.#clearValidationError(this.weight);
        return true;

    }

    #validateForm() {
        let isValid = this.form.checkValidity();
        isValid = this.#weightValidationRule() && isValid;
        return isValid;
    }

    /**
     * Збирає введені у форму дані в модель PostingPostDto.
     * @returns {PostingPostDto}
     */
    #readForm() {
        const data = new FormData(this.form);

        return {
            from: data.get('From'),
            to: data.get('To'),
            content: data.get('Content'),
            deliveryType: DeliveryType[data.get('DeliveryType')],
            weight: Number(data.get('Weight')),
            width: Number(data.get('Width')),
            height: Number(data.get('Height')),
            depth: Number(data.get('Depth')),
            //оголошена вартість необов'язкова: порожнє поле передаємо як null, а не як 0
            value: data.get('Value') === '' ? null : Number(data.get('Value'))
        };
    }

    /**
     * Відправляє дані на сервер
     */
    async #onSubmitClick() {
        if (!this.#validateForm()) {
            this.toast.warning('Форма містить помилки', 'Виправте виділені поля та спробуйте ще раз.');
            this.form.querySelector(':invalid')?.focus();
            return;
        }

        const posting = this.#readForm();

        this.submitButton.disabled = true;
        this.toast.hide();

        try {
            await this.postingService.create(posting);
            window.location.href = 'posting-list.html';
        } catch (error) {
            const errorTitle = 'Не вдалося створити відправлення';
            let errorMessage = 'Помилка створення відправлення:';
            if (error instanceof TypeError) {
                errorMessage = "З'єднання з сервером відсутнє, спробуйте пізніше.";
            }
            if (error instanceof ServerValidationError) {
                errorMessage = error.message;
            }
            this.toast.error(errorTitle, errorMessage);
            console.error('Помилка створення відправлення:', error);
            this.submitButton.disabled = false;
        }
    }
}
