// Mocks a REST API call to fetch a large dataset in pages.
// In a real application, this would be an actual `fetch` call to a server.
// @param {number} page - The page number to fetch.
// @param {number} pageSize - The number of items per page.
// @param {string} [searchTerm] - The term to filter data by.
// @returns {Promise<object[]>} A promise that resolves with an array of data items.
function mockApiFetch(page, pageSize, searchTerm = '') {
    return new Promise((resolve) => {
        // Simulate network latency
        setTimeout(() => {
            const data = []
            const startId = (page - 1) * pageSize

            for (let i = 0; i < pageSize; i++) {
                const id = startId + i
                // Let's cap our mock data at 10,000 items to avoid infinite loops
                if (id >= 10000) {
                    break
                }
                data.push({
                    id: id,
                    title: `Item #${id}`,
                    // Simulate some complex data processing
                    processedValue: Math.random()
                        .toString(36)
                        .substring(2)
                        .toUpperCase(),
                    timestamp: new Date(
                        Date.now() - Math.floor(Math.random() * 1000000000)
                    ).toISOString(),
                })
            }

            // Simulate server-side filtering
            if (searchTerm) {
                // Make the filter more robust by comparing just the numeric parts if possible
                const searchTermLower = searchTerm.toLowerCase()
                const filteredData = data.filter(
                    (item) =>
                        item.title.toLowerCase().includes(searchTermLower) ||
                        item.title
                            .replace(/[^0-9]/g, '')
                            .includes(searchTerm.replace(/[^0-9]/g, ''))
                )
                resolve(filteredData)
            } else {
                resolve(data)
            }
        }, 500) // 500ms delay
    })
}

self.onmessage = async (e) => {
    if (e.data.type === 'load') {
        let { page, pageSize, searchTerm } = e.data
        try {
            let targetPage = page

            // If it's a new search, check if we can jump to a specific page.
            if (searchTerm && page === 1) {
                // This is a "smart" jump. If the search term is just a number,
                // calculate the page it would be on and go there directly.
                // We only do this for the first page load of a search query,
                // and only if the search term looks like a direct ID query.
                const searchNumberString = searchTerm.replace(/[^0-9]/g, '')
                if (searchNumberString) {
                    // A number was found, so we can jump to that page.
                    const searchNumber = parseInt(searchNumberString, 10)
                    targetPage = Math.floor(searchNumber / pageSize) + 1
                }
            }

            // Fetch from the determined target page.
            const data = await mockApiFetch(targetPage, pageSize, searchTerm)
            self.postMessage({ type: 'data', data: data })
        } catch (error) {
            self.postMessage({ type: 'error', error: error.message })
        }
    }
}
