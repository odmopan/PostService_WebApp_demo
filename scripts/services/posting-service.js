//такі коментраі документації описують типи даних
/** @typedef {Object} PostingDto 
 * @property {number} id Ідентифікатор запису.
 * @property {string} from Відправник.
 * @property {string} to Одержувач.
 * @property {string} content Вміст або опис відправлення.
 * @property {number} deliveryType Тип доставки (значення DeliveryType).
 * @property {number} weight Вага, кг.
 * @property {number} width Ширина, см.
 * @property {number} height Висота, см.
 * @property {number} depth Довжина, см.
 * @property {number|null} value Оголошена вартість.
 * @property {number} price Вартість відправлення.
 * @property {string} createdAt Час створення.
*/
/**
 * Модель нового відправлення (PostingPostDto на сервері).
 * @typedef {Object} PostingPostDto
 * @property {string} from Відправник.
 * @property {string} to Одержувач.
 * @property {string} content Вміст або опис відправлення.
 * @property {number} deliveryType Тип доставки (значення DeliveryType).
 * @property {number} weight Вага, кг.
 * @property {number} width Ширина, см.
 * @property {number} height Висота, см.
 * @property {number} depth Довжина, см.
 * @property {number|null} value Оголошена вартість.
 * @property {number} price Вартість відправлення.
 */

/** Значення переліку DeliveryType на сервері. */
const DeliveryType = Object.freeze({
    Department: 0,
    Courier: 1,
    ExpressCourier: 2
});

/** Назви типів доставки для відображення користувачу. */
const DeliveryTypeTitle = Object.freeze({
    0: 'До відділення',
    1: 'Кур’єрська доставка',
    2: 'Експрес-кур’єрська доставка'
});


/** Помилка валідації даних, яку повернув сервер (HTTP 400). */
class ServerValidationError extends Error {
    /**
     * @param {string[]} errors перелік повідомлень про помилки від сервера
     */
    constructor(errors) {
        super(errors.join('\n'));
        this.name = 'ServerValidationError';
        this.errors = errors;
    }
}

class PostingService {
    constructor(baseUrl = 'http://localhost:5211') {
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    /**
     * Отримує список відправлень із вебсервера.
     * @returns {Promise<PostingDto[]>}
     */
    async getList() {
        const response = await fetch(`${this.baseUrl}/postings`);

        if (!response.ok) {
            throw new Error(`Не вдалося отримати відправлення: HTTP ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Надсилає на вебсервер нове відправлення.
     * @param {PostingPostDto} posting
     * @returns {Promise<PostingDto>}
     */
    async create(posting) {
        const response = await fetch(`${this.baseUrl}/postings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(posting)
        });
        //додаємо власний обробник помилки 400 що приходить від сервера
        if (response.status === 400) {
            //читаємо вміст body з відповіді від сервера
            const errors =await this.#readValidationErrors(response)
            //створюємо свою помилку валідації даних
            throw new ServerValidationError(errors);
        }

        if (!response.ok) {
            throw new Error(`Не вдалося створити відправлення: HTTP ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Читає з відповіді 400 перелік помилок.
     * Сервер повертає ValidationProblem: { title, status, errors: { "Поле": ["повідомлення", ...] } }
     * @param {Response} response
     * @returns {Promise<string[]>}
     */
    async #readValidationErrors(response) {
        const messages = [];

        try {
            const problem = await response.json();

            for (const fieldMessages of Object.values(problem.errors ?? {})) {
                messages.push(...fieldMessages);
            }

            if (messages.length === 0 && problem.title) {
                messages.push(problem.title);
            }
        } catch (error) {
            console.error('Не вдалося прочитати відповідь сервера:', error);
        }

        if (messages.length === 0) {
            messages.push('Сервер відхилив дані (HTTP 400).');
        }

        return messages;
    }

    /**
     * Видаляє поштове відправлення
     * @param {number} postingId 
     */
    async delete(postingId){
        
        const response = await fetch(`${this.baseUrl}/postings/${postingId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Не вдалося видалити відправлення: HTTP ${response.status}`);
        }
    }
}
