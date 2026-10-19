class PostingPage {
    constructor(postingService = new PostingService()) {
        this.postingService = postingService;
        this.tableBody = document.getElementById('postings');
        this.tableHeader = document.getElementById('table-header');
        this.table = this.tableBody.closest('table');
        this.toast = new Toast();
    }

    async refresh() {
        this.table.setAttribute('aria-busy', 'true');

        try {
            const postings = await this.postingService.getList();
            this.#renderTable(postings);
            if (postings.length === 0) {
                this.toast.warning('Відправлень немає', 'Створіть перше відправлення.');
            }
        } catch (error) {
            this.toast.error('Не вдалося завантажити відправлення', 'Перевірте з’єднання із сервером.');
            console.error('Помилка завантаження відправлень:', error);
        } finally {
            this.table.setAttribute('aria-busy', 'false');
        }
    }

    #renderTable(postings) {
        const columns = this.tableHeader.querySelectorAll('th');
        this.tableBody.replaceChildren();

        for (const posting of postings) {
            const row = document.createElement('tr');

            for (const column of columns) {
                const fieldName = column.getAttribute('x-column');

                if (fieldName) {
                    const cell = this.#createCell(fieldName, posting);
                    row.appendChild(cell);
                }
            }
            //Після всіх клітинок з даними додаємо клітинку з кнопками
            this.#addActionButtonsToTableRow(posting, row);

            this.tableBody.appendChild(row);
        }
    }

    /**
     * Додає кнопки дії до рядка поштового відправлення
     * @param {PostingDto} posting 
     * @param {HTMLElement} row 
     */
    #addActionButtonsToTableRow(posting, row) {
        const cell = document.createElement('td');
        //це зразок  html коду що ми маємо сформувати <button class="button" type="button" id="delete-posting-{id}">Видалити</button>
        const deleteButton = document.createElement("button");
        deleteButton.classList.add("button");
        deleteButton.setAttribute("type", "button");
        deleteButton.id = `delete-posting-${posting.id}`;
        deleteButton.textContent = "Видалити";
        deleteButton.setAttribute("x-record-id", posting.id);//ми будем звертатись до цього атрибута щоб знати ідентифікатор рядка який потрібно видалити
        deleteButton.addEventListener("click", (e) => this.deletePosting(e));//додаємо обробник події click, event - містить обєкт події і target - посилання на саму кнопку
        //додаємо створену кнопку в клітинку
        cell.appendChild(deleteButton);
        // додаємо клітинку до рядка
        row.appendChild(cell);
    }
    async deletePosting(e) {
        const btn = e.target;
        const postingId = Number(btn.getAttribute('x-record-id'));
        if (confirm("Ви дійсно бажаєте видалити відправлення Id=" + postingId + "?")) {
            try {
                //відправляємо запит на видалення
                await this.postingService.delete(postingId);

                //обновляємо дані в таблиці після видалення рядка
                await this.refresh();
                this.toast.success("Відправлення видалено", "Id=" + postingId);
            }
            catch (ex) {
                console.error(ex);
                this.toast.error("Видалення невдалось", "Оновіть дані та спробуйте ще раз.");
            }
        }
    }

    /** Створює нову клітинку з даними
     * 
     */
    #createCell(fieldName, posting) {
        const cell = document.createElement('td');
        //posting.from <=> posting[from] 
        let value = posting[fieldName] ?? '';

        if (fieldName === 'deliveryType') {
            value = DeliveryTypeTitle[value] ?? value;
        }

        cell.textContent = value;
        return cell;
    }
}
