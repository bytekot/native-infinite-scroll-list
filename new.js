class DataGenerator {
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
        this.itemWrappers = document.querySelectorAll('.content-wrap');
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

    refresh() {
        this.translateY = 0;
        this.data = {
            current: null,
            previous: null
        };
    }

    firstUpdate(data) {
        this.updateChunk(this.itemWrappers[!this.data.current ? 0 : 1], data);

        if (!this.data.current) {
            this.itemWrappers[1].querySelectorAll('span').forEach((span, index) => {
                span.classList.add('hidden');
            });
        }

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

    render(data, flag) {
        if (!this.data.current || !this.data.previous) {
            this.firstUpdate(data);
            return;
        }

        if (!flag) {
            this.translateY = this.translateY + this.itemWrappers[0].offsetHeight;
        } else {
            this.translateY = this.translateY !== 0 // improve ?
                ? this.translateY - this.itemWrappers[0].offsetHeight
                : this.translateY;
        }

        this.itemWrappers.forEach((wrapper, wrapperIndex) => {
            let content;
            if (!flag) {
                content = wrapperIndex === 0 ? this.data.current : data;
            } else {
                content = wrapperIndex === 0 ? data : this.data.previous;
            }
            this.updateChunk(wrapper, content);

            wrapper.style.transform = `translateY(${this.translateY}px)`;
        });

        if (!flag) {
            this.data.previous = this.data.current;
            this.data.current = data;
        } else {
            this.data.current = this.data.previous;
            this.data.previous = data;
        }
    }
}

class Paginator {
    constructor(pageSize) {
        this.pageSize = pageSize;
        this.currentPage = 0;
        this.total = 0;
        
    }

    setTotal = (total) => {
        this.total = total;
        this.totalPages = Math.ceil(this.total / this.pageSize);
        this.currentPage = 0;
        this.nextFlag = false;
        this.previousFlag = false;
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

        if (this.previousFlag) {
            if (this.totalPages === 2) {
                return;
            }
            this.currentPage++;
            this.previousFlag = false;
        }

        this.currentPage++;
        this.nextFlag = true;

        return {
            number: this.currentPage,
            size: this.getCurrentPageSize()
        };
    }

    previousPage() {
        if (!this.total || this.currentPage === 1) {
            return;
        }

        if (this.nextFlag) {
            this.currentPage = this.currentPage !== 2
                ? this.currentPage - 1
                : this.currentPage;
            this.nextFlag = false;
        }

        this.currentPage--;
        this.previousFlag = true;

        return {
            number: this.currentPage,
            size: this.getCurrentPageSize()
        };
    }
}

class InfiniteScrollList {
    constructor(pageSize) {
        this.view = new ListView(pageSize);
        this.dataProvider = new DataGenerator(Math.random());
        this.paginator = new Paginator(pageSize);
        this.observer = this.createObserver();

        document.querySelectorAll('.observer').forEach(sentinel => this.observer.observe(sentinel));
    }

    createObserver() {
        const options = {
            root: null,
            rootMargin: '300px',
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
                        this.view.render(
                            this.dataProvider.getData(page.number, page.size)
                        );
                    }
                    break;

                case 'top':
                    page = this.paginator.previousPage();
                    if (page) {
                        this.view.render(
                            this.dataProvider.getData(page.number, page.size),
                            true
                        );
                    }
                    break;
            }
        });
    }

    setItemsNumber(itemsNumber) {
        this.view.refresh();
        this.dataProvider = new DataGenerator(Math.random());
        this.paginator.setTotal(itemsNumber);

        const page = this.paginator.nextPage();
        if (page) {
            this.view.render(
                this.dataProvider.getData(page.number, page.size)
            );
        }
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
