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
        //console.log(page, length);
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
    }

    render(data, flag) { // flag
        if (!this.itemsCreated) {
            this.createListItems(data);
            return;
        }

        /*const position = [];

        if (scrollDirection === 'bottom') {
            position.push(contentData.length - 2, contentData.length - 1);
            this.translateY = this.translateY + this.itemWrappers[0].offsetHeight;
        } else {
            position.push(currentPosition - 2, currentPosition - 1);
            this.translateY = this.translateY - this.itemWrappers[1].offsetHeight;
        }*/
        if (!flag) {
            this.translateY = this.translateY + this.itemWrappers[0].offsetHeight;
        } else {
            this.translateY = this.translateY - this.itemWrappers[0].offsetHeight;
        }

        this.itemWrappers.forEach(wrapper => {
            wrapper.querySelectorAll('span').forEach(
                (span, index) => span.innerHTML = data[index]
            );
            wrapper.style.transform = `translateY(${this.translateY}px)`;
        });
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

    refresh() {
        this.itemWrappers.forEach(wrapper =>
            wrapper.querySelectorAll('span').forEach(item => item.innerHTML = '')
        );
        //this.render();
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
            rootMargin: '500px',
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
        this.currentPage = -1; // -1
        this.dataGenerator = new DataGenerator(Math.random());
        this.nextPage(); // refresh
    }

    getPageSize = () => {
        const itemsLeft = this.total - this.itemsLoaded;
        return itemsLeft > this.pageSize ? this.pageSize : itemsLeft
    }

    nextPage = () => {
        if (!this.total || this.itemsLoaded === this.total) {
            return;
        }

        const pageSize = this.getPageSize();

        this.currentPage++;
        console.log(this.dataGenerator.getData(this.currentPage, pageSize));
        this.view.render(
            this.dataGenerator.getData(this.currentPage, pageSize)
        );
        this.itemsLoaded = this.itemsLoaded + pageSize;
    }

    previousPage = () => {
        if (!this.total || this.currentPage === 0) {
            return;
        }

        this.currentPage--;
        //if (this.currentPage === 0) {return;}
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
