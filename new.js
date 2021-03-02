class InfiniteScrollList {
    constructor(pageSize, observerRootMargin) {
        this.view = new ListView();
        this.dataProvider = new DataProvider();
        this.paginator = new Paginator(pageSize);
        this.observer = this.createObserver(observerRootMargin);
    }

    createObserver(rootMargin) {
        const options = {
            root: null,
            rootMargin: `${rootMargin}px`,
            threshold: 0
        };
        const observer = new IntersectionObserver(this.observerHandler, options);
        const sentinel = document.querySelector('.sentinel');

        observer.observe(sentinel);

        return observer;
    }

    observerHandler = sentinelElements => {
        sentinelElements.forEach(sentinel => {
            if (!sentinel.isIntersecting) {
                return;
            }

            const page = this.paginator.nextPage();

            if (page) {
                this.view.showNextPage(
                    this.dataProvider.getData(page.size)
                );
            }
        });
    }

    setItemsNumber(itemsNumber) {
        this.paginator.setTotal(itemsNumber);

        const page = this.paginator.nextPage();
        this.view.refresh(
            this.dataProvider.getData(page.size)
        );
    }
}

class DataProvider {
    getData(length) {
        return Array.from({ length: length }, () =>
            Math.floor(Math.random() * 10)
        );
    }
}

class ListView {
    refresh(data) {
        document.querySelector('.content-container').innerHTML = '';
        this.showNextPage(data);
    }

    showNextPage(data) {
        const items = data.map(item => `<span class="content-item">${item}</span>`);

        document.querySelector('.content-container').insertAdjacentHTML('beforeend',
            `<div class="content-wrapper">${items.join('')}</div>`
        );
    }
}

class Paginator {
    constructor(pageSize) {
        this.pageSize = pageSize;
        this.currentPage = 0;
        this.total = 0;
    }

    setTotal(total) {
        this.total = total;
        this.totalPages = Math.ceil(this.total / this.pageSize);
        this.currentPage = 0;
    }

    getCurrentPageSize() {
        if (this.currentPage < this.totalPages) {
            return this.pageSize;
        }

        return this.total - ((this.totalPages - 1) * this.pageSize);
    }

    nextPage() {
        if (!this.total || this.currentPage === this.totalPages) {
            return;
        }

        this.currentPage++;

        return {
            number: this.currentPage,
            size: this.getCurrentPageSize()
        };
    }
}

window.onload = () => {
    const PAGE_SIZE = 1000;
    const OBSERVER_ROOT_MARGIN = 1000;

    const infiniteScrollList = new InfiniteScrollList(PAGE_SIZE, OBSERVER_ROOT_MARGIN);


    // Input handler & validation
    let inputTimeoutId;
    const inputHandler = event => {
        const showValidationError = () => {
            document.getElementById('error-text').innerHTML = 'Invalid input value. It must be a non-negative integer.';
        };

        const clearValidationError = () => {
            document.getElementById('error-text').innerHTML = '';
        };

        const isValid = value => {
            const numberValue = Number(value);

            return !isNaN(numberValue)
                && value > 0
                && parseInt(value) === value;
        };

        if (inputTimeoutId) {
            clearInterval(inputTimeoutId);
        }

        inputTimeoutId = setTimeout(() => {
            clearInterval(inputTimeoutId);

            const value = Number(event.target.value);

            if (!isValid(value)) {
                showValidationError();
                return;
            }

            clearValidationError();

            infiniteScrollList.setItemsNumber(value);
        }, 500);
    };

    document.getElementById('input').addEventListener('keydown', inputHandler);
};
