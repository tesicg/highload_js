const dataContainer = document.getElementById('data-container')
const loader = document.getElementById('loader')
const statusDisplay = document.getElementById('status')
const searchInput = document.getElementById('search-input')

const state = {
    page: 1,
    pageSize: 50,
    isLoading: false,
    totalItems: 0,
    searchTerm: '',
}

// Web Worker Initialization
const worker = new Worker('../src/worker.js', { type: 'module' })

worker.onmessage = (e) => {
    const { type, data, error } = e.data

    if (type === 'data') {
        renderItems(data)
        state.totalItems += data.length
        updateStatus()
        state.isLoading = false
        hideLoader()
    } else if (type === 'error') {
        console.error('Error from worker:', error)
        state.isLoading = false
        hideLoader()
    }
}

worker.onerror = (e) => {
    console.error('An error occurred in the worker:', e)
    state.isLoading = false
    hideLoader()
}

// Requests a new page of data from the web worker.
function loadMoreItems() {
    if (state.isLoading) return

    state.isLoading = true
    showLoader()

    // Pass the current search term to the worker
    worker.postMessage({
        type: 'load',
        page: state.page,
        pageSize: state.pageSize,
        searchTerm: state.searchTerm,
    })

    state.page++
}

// Resets the data container and state for a new search.
function resetForNewSearch() {
    // Clear the list
    dataContainer.innerHTML = ''

    // Reset state
    state.page = 1
    state.totalItems = 0
    state.isLoading = false // Allow a new load to start immediately
    updateStatus()
}

// Renders an array of items to the DOM efficiently.
// @param {object[]} items - The items to render.
function renderItems(items) {
    const fragment = document.createDocumentFragment()
    items.forEach((item) => {
        const li = document.createElement('li')
        li.innerHTML = `<strong>${item.title}</strong><br><small>ID: ${item.id} | Processed: ${item.processedValue} | Date: ${item.timestamp}</small>`
        fragment.appendChild(li)
    })
    dataContainer.appendChild(fragment)
}

function showLoader() {
    loader.style.display = 'block'
}

function hideLoader() {
    loader.style.display = 'none'
}

function updateStatus() {
    statusDisplay.textContent = `Items: ${state.totalItems}`
}

// Debounces a function to prevent it from being called too frequently.
// @param {Function} func The function to debounce.
// @param {number} delay The debounce delay in milliseconds.
// @returns {Function} The debounced function.
function debounce(func, delay) {
    let timeout
    return function (...args) {
        const context = this
        clearTimeout(timeout)
        timeout = setTimeout(() => func.apply(context, args), delay)
    }
}

// Throttles a function to limit how often it can be called.
// @param {Function} func - The function to throttle.
// @param {number} limit - The throttle limit in milliseconds.
// @returns {Function} The throttled function.
function throttle(func, limit) {
    let inThrottle
    return function () {
        const args = arguments
        const context = this
        if (!inThrottle) {
            func.apply(context, args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
        }
    }
}

// Handles the scroll event to implement infinite scrolling.
function handleScroll() {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement
    // Load more items when the user is 200px from the bottom
    if (scrollTop + clientHeight >= scrollHeight - 200) {
        loadMoreItems()
    }
}

// Handles the search input event.
function handleSearch(event) {
    const newSearchTerm = event.target.value
    if (newSearchTerm === state.searchTerm) {
        return
    }
    state.searchTerm = newSearchTerm
    resetForNewSearch()
    loadMoreItems()
}

// Initial Setup

// Attach the throttled scroll event listener
window.addEventListener('scroll', throttle(handleScroll, 100))

// Attach the debounced search input listener
searchInput.addEventListener('input', debounce(handleSearch, 300))

// Load the first page of items
loadMoreItems()
