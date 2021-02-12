const CONTENT_CHUNK_SIZE = 1000;

const contentData = [];

let loadedContentCount = 0;
let currentPosition = 0;
let totalTranslateY = 0;

let contentAmount;
let inputTimeoutId;

const observer = (() => {
    const options = {
        root: null,
        rootMargin: '500px',
        threshold: 0
    }
    const callback = entries => {
        entries.forEach(observer => {
            if (!observer.isIntersecting) {
                return;
            }

            const position = observer.target.getAttribute('data-id');

            if (position === 'bottom') {
                renderNextChunk();
                return;
            }

            if (position === 'top') {
                renderPreviousChunk();
            }
        });
    };

    return new IntersectionObserver(callback, options);
})();


const inputHandler = event => {
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

        contentAmount = value;

        clearValidationError();
        renderNextChunk();
    }, 500);
};

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


const getRandomInt = () => Math.floor(Math.random() * 10);

const getContentData = (contentAmount = CONTENT_CHUNK_SIZE) => (
    Array.from({ length: contentAmount }, () => getRandomInt())
);


const renderPreviousChunk = () => {
    if (!contentAmount || currentPosition - 2 === 0) {
        return;
    }

    currentPosition = currentPosition - 1;

    if (!createContent()) {
        updateContent('top');
    }
};

const renderNextChunk = () => {
    if (!contentAmount || loadedContentCount === contentAmount) {
        return;
    }

    const contentAmountRemaining = contentAmount - loadedContentCount;
    const chunkSize = contentAmountRemaining > CONTENT_CHUNK_SIZE
        ? CONTENT_CHUNK_SIZE
        : contentAmountRemaining;
    const contentDataChunk = getContentData(chunkSize);

    loadedContentCount = loadedContentCount + contentDataChunk.length;
    currentPosition = currentPosition + 1;
    contentData.push(contentDataChunk);

    if (!createContent()) {
        updateContent('bottom');
    }
};

createContent = () => {
    const wrappers = document.querySelectorAll('.content-wrap');
    let wasCreated = false;

    for (let index = 0; index < wrappers.length; index++) {
        if (wrappers[index].querySelectorAll('span').length === 0) {
            wrappers[index].insertAdjacentHTML(index === 0 ? 'beforeend' : 'afterbegin',
                contentData[contentData.length - 1].map(
                    item => `<span class="content-item">${item}</span>`
                ).join('')
            );
            wasCreated = true;

            break;
        }

    }

    return wasCreated;
};

updateContent = (scrollDirection) => {
    const wrappers = document.querySelectorAll('.content-wrap');
    const position = [];

    if (scrollDirection === 'bottom') {
        position.push(contentData.length - 2, contentData.length - 1);
        totalTranslateY = totalTranslateY + wrappers[0].offsetHeight;
    } else {
        position.push(currentPosition - 2, currentPosition - 1);
        totalTranslateY = totalTranslateY - wrappers[1].offsetHeight;
    }

    wrappers.forEach((wrapper, wrapperIndex) => {
        const dataChunk = contentData[position[wrapperIndex]];
        
        wrapper.querySelectorAll('span').forEach(
            (span, spanIndex) => span.innerHTML = dataChunk[spanIndex]
        );
        wrapper.style.transform = `translateY(${totalTranslateY}px)`;
    });
};


window.onload = () => {
    document.getElementById('input').addEventListener('keypress', inputHandler);

    document.querySelectorAll('.observer').forEach(observerElement => observer.observe(observerElement));
};
