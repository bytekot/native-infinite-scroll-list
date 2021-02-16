class DataProvider {
    constructor(instanceSeed) {
        this.instanceSeed = instanceSeed;
    }

    makeRandom(initialSeed) {
        let seed = initialSeed;
        return () => {
            seed = Math.sin(seed) * 10000;
            return Math.floor((seed - Math.floor(seed)) * 10);
        };
    }

    getData(page, length) {
        const random = this.makeRandom(this.instanceSeed + page);
        return Array.from({ length: length }, () => random());
    }
}

class ListView {
    constructor(listChunkSize) {
        this.itemWrappers = document.querySelectorAll('.content-wrapper'); // save spans query
        this.listChunkSize = listChunkSize;
        this.translateY = 0;
        this.data = {
            current: null,
            previous: null
        };
        this.createListItems();
    }

    createListItems() {
        this.itemWrappers.forEach((wrapper, index) => {
            wrapper.insertAdjacentHTML(index === 0 ? 'beforeend' : 'afterbegin',
                Array.from({ length: this.listChunkSize }, () => '<span class="content-item hidden"></span>').join('')
            );
        });
    }

    refresh(data) {
        this.translateY = 0;
        this.data = {
            current: null,
            previous: null
        };

        this.updateChunk(this.itemWrappers[0], data);
        this.itemWrappers[1].querySelectorAll('span').forEach((span, index) => {
            span.classList.add('hidden');
        });

        this.data.previous = this.data.current;
        this.data.current = data;

    }

    updateChunk(wrapper, data) {
        wrapper.querySelectorAll('span').forEach((span, index) => {
            if (data[index] === undefined) {
                span.classList.add('hidden');
                return;
            }

            span.innerHTML = data[index];

            if (span.classList.contains('hidden')) {
                span.classList.remove('hidden');
            }
        });
    }

    displayNext(data) {
        if (this.data.previous) {
            this.translateY = this.translateY + this.itemWrappers[0].offsetHeight;
        }

        this.itemWrappers.forEach((wrapper, index) => {
            this.updateChunk(wrapper, index === 0 ? this.data.current : data);

            wrapper.style.transform = `translateY(${this.translateY}px)`;
        });

        this.data.previous = this.data.current;
        this.data.current = data;
    }

    displayPrevious(data) {
        this.translateY = this.translateY !== 0
            ? this.translateY - this.itemWrappers[0].offsetHeight
            : this.translateY;

        this.itemWrappers.forEach((wrapper, index) => {
            this.updateChunk(wrapper, index === 0 ? data : this.data.previous);

            wrapper.style.transform = `translateY(${this.translateY}px)`;
        });

        this.data.current = this.data.previous;
        this.data.previous = data;
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
        this.movingForward = false;
        this.movingBack = false;
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

        if (this.movingBack) {
            if (this.totalPages === 2) {
                return;
            }
            this.currentPage++;
            this.movingBack = false;
        }

        this.currentPage++;
        this.movingForward = true;

        return {
            number: this.currentPage,
            size: this.getCurrentPageSize()
        };
    }

    previousPage() {
        if (!this.total || this.currentPage === 1) {
            return;
        }

        if (this.movingForward) {
            this.currentPage = this.currentPage !== 2
                ? this.currentPage - 1
                : this.currentPage;
            this.movingForward = false;
        }

        this.currentPage--;
        this.movingBack = true;

        return {
            number: this.currentPage,
            size: this.getCurrentPageSize()
        };
    }
}

class InfiniteScrollList {
    constructor(pageSize) {
        this.view = new ListView(pageSize);
        this.dataProvider = new DataProvider(Math.random());
        this.paginator = new Paginator(pageSize);
        this.observer = this.createObserver();

        document.querySelectorAll('.observer').forEach(sentinel => this.observer.observe(sentinel));
    }

    createObserver() {
        const options = {
            root: null,
            rootMargin: '500px',
            threshold: 0
        };

        return new IntersectionObserver(this.observerHandler, options);
    }

    observerHandler = sentinelElements => {
        sentinelElements.forEach(sentinel => {
            if (!sentinel.isIntersecting) {
                return;
            }

            const scrollDirection = sentinel.target.getAttribute('data-scroll-direction');
            let page;

            switch (scrollDirection) {
                case 'bottom':
                    page = this.paginator.nextPage();
                    if (page) {
                        this.view.displayNext(
                            this.dataProvider.getData(page.number, page.size)
                        );
                    }
                    break;

                case 'top':
                    page = this.paginator.previousPage();
                    if (page) {
                        this.view.displayPrevious(
                            this.dataProvider.getData(page.number, page.size)
                        );
                    }
                    break;
            }
        });
    }

    setItemsNumber(itemsNumber) {
        this.dataProvider.instanceSeed = Math.random();
        this.paginator.setTotal(itemsNumber);

        const page = this.paginator.nextPage();
        this.view.refresh(
            this.dataProvider.getData(page.number, page.size)
        );
    }
}

window.onload = () => {
    const infiniteScrollList = new InfiniteScrollList(1000);

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
                && value >= 0
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

    document.getElementById('input').addEventListener('keypress', inputHandler);
};
