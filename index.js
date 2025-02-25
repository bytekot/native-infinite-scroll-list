class InfiniteScrollList {
    constructor(pageSize, observerRootMargin) {
        this.view = new ListView(pageSize);
        this.dataProvider = new DataProvider(Math.random());
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

        document.querySelectorAll('.observer').forEach(
            sentinel => observer.observe(sentinel)
        );

        return observer;
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
                        this.view.showNextPage(
                            this.dataProvider.getData(page.number, page.size)
                        );
                    }
                    break;

                case 'top':
                    page = this.paginator.previousPage();
                    if (page) {
                        this.view.showPreviousPage(
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
        this.listChunkSize = listChunkSize;
        this.translateY = 0;
        this.data = {
            current: null,
            previous: null
        };
        this.createItems();
    }

    createItems() {
        this.itemWrappers  = [];

        document.querySelectorAll('.content-wrapper').forEach((wrapper, index) => {
            this.itemWrappers.push(wrapper);

            wrapper.insertAdjacentHTML(index === 0 ? 'beforeend' : 'afterbegin',
                Array.from({ length: this.listChunkSize }, () => '<span class="content-item hidden"></span>').join('')
            );
        });
    }

    getItems() {
        if (!this.items) {
            this.items = [];
            this.itemWrappers.forEach(wrapper => {
                this.items.push(wrapper.querySelectorAll('span'));
            });
        }

        return this.items;
    }

    refresh(data) {
        this.updateChunk(0, data);
        this.getItems()[1].forEach(span  => span.classList.add('hidden'));

        this.translateY = 0;
        this.data.current = data;
        this.data.previous = null;

    }

    updateChunk(chunkIndex, data) {
        this.getItems()[chunkIndex].forEach((span, index) => {
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

    showNextPage(data) {
        if (this.data.previous) {
            this.translateY = this.translateY + this.itemWrappers[0].offsetHeight;
        }

        this.itemWrappers.forEach((wrapper, index) => {
            this.updateChunk(index, index === 0 ? this.data.current : data);

            wrapper.style.transform = `translateY(${this.translateY}px)`;
        });

        this.data.previous = this.data.current;
        this.data.current = data;
    }

    showPreviousPage(data) {
        if (this.translateY === 0) {
            return;
        }
        this.translateY = this.translateY - this.itemWrappers[0].offsetHeight;

        this.itemWrappers.forEach((wrapper, index) => {
            this.updateChunk(index, index === 0 ? data : this.data.previous);

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
