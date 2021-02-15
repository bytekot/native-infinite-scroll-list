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
    constructor() {
        this.itemWrappers = document.querySelectorAll('.content-wrap');
        this.sentinels = document.querySelectorAll('.observer');
        this.itemsCreated = false;
        this.translateY = 0;
        this.data = {
            current: null,
            previous: null
        };
    }

    render(data, flag) { // flag
        if (!this.itemsCreated) {
            this.data.previous = this.data.current;
            this.data.current = data;
            this.createListItems(data);
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
            wrapper.querySelectorAll('span').forEach((span, index) => {
                span.innerHTML = content[index];

                if (content[index] === undefined) {
                    span.classList.add('hidden');
                } else if (span.classList.contains('hidden')) {
                    span.classList.remove('hidden');
                }
            });

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

    createListItems(itemsData) {
        for (let index = 0; index < this.itemWrappers.length; index++) {
            if (this.itemWrappers[index].querySelectorAll('span').length === 0) {
                this.itemWrappers[index].insertAdjacentHTML(index === 0 ? 'beforeend' : 'afterbegin',
                    itemsData.map(
                        item => `<span class="content-item">${item}</span>`
                    ).join('')
                );

                if (index === 1) {
                    this.itemsCreated = true;
                }

                break;
            }
        }
    }
}

class InfiniteScroll {
    constructor(pageSize) {
        this.pageSize = pageSize;
        this.currentPage = 0;
        this.itemsLoaded = 0;
        this.total = 0;
        this.view = new ListView();
        this.observer = this.createObserver();

        this.view.sentinels.forEach(sentinel => this.observer.observe(sentinel));
    }

    createObserver = () => {
        const options = {
            root: null,
            rootMargin: '300px',
            threshold: 0
        };
        const callback = entries => {
            entries.forEach(sentinel => {
                if (!sentinel.isIntersecting) {
                    return;
                }

                const position = sentinel.target.getAttribute('data-id');

                if (position === 'bottom') {
                    this.nextPage();
                    return;
                }

                if (position === 'top') {
                    this.previousPage();
                }
            });
        };

        return new IntersectionObserver(callback, options);
        
    }

    setTotal = (total) => {
        this.total = total;
        this.itemsLoaded = 0;
        this.currentPage = 0;
        this.dataGenerator = new DataGenerator(Math.random());
        this.nextPage();
    }

    getPageSize = () => {
        if (this.itemsLoaded / this.pageSize > this.currentPage) {
            return this.pageSize;
        }
        const itemsLeft = this.total - this.itemsLoaded;

        return itemsLeft > this.pageSize ? this.pageSize : itemsLeft;
    }

    nextPage = () => {
        if (!this.total || (this.currentPage * this.pageSize >= this.total)) {
            return;
        }

        if (this.currentPage === 0 && (this.itemsLoaded / this.pageSize) > 2) {
            this.currentPage = 2;
        }

        const pageSize = this.getPageSize();

        this.view.render(
            this.dataGenerator.getData(this.currentPage, pageSize)
        );

        this.currentPage++;
        this.itemsLoaded = this.itemsLoaded + pageSize;

        this.next = true;
    }

    previousPage = () => {
        if (!this.total || this.currentPage === 0) {
            return;
        }

        if (this.next) {
            this.next = false;
            this.currentPage--;
            this.currentPage--;
        }

        this.currentPage--;
        this.view.render(
            this.dataGenerator.getData(this.currentPage, 1000), // pageSize calculation
            true
        );
    }
}


window.onload = () => {
    const infiniteScroll = new InfiniteScroll(1000);

    let inputTimeoutId;
    const inputHandler = event => {
        if (inputTimeoutId) {
            clearInterval(inputTimeoutId);
        }

        inputTimeoutId = setTimeout(() => {
            clearInterval(inputTimeoutId);
            infiniteScroll.setTotal(Number(event.target.value));
        }, 500);
    };

    document.getElementById('input').addEventListener('keypress', inputHandler);
};
