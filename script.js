const apiKey = "e2cdaae4-9939-4f56-bbfe-935b38c37691"; // API nyckel from Guardian
let savedArticles = []; // Initiates empty array for localStorage
let isSavedNewsVisible = false;

// Link to endpoints: https://open-platform.theguardian.com/documentation/

const searchInput = document.getElementById("searchInput");
const selectCategory = document.getElementById("selectCategory");
const searchButton = document.getElementById("searchButton");
const newsContainer = document.getElementById("newsContainer");
const errorMessage = document.getElementById("errorMessage");
const savedNewsContainer = document.getElementById("savedNewsContainer");
const toggleSavedButton = document.getElementById("toggleSavedButton");

async function fetchNews(query = "", category = "", page = 1) {

    let url = `https://content.guardianapis.com/search?q=${query}&from-date=2014-01-01&page=${page}&page-size=6&order-by=newest&api-key=${apiKey}`;

    if (category) {
        url += `&section=${category}`; // Adds category to the URL if we have one chosen
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const data = await response.json();
        displayNews(data.response.results);
        createPages(data.response.pages, page, query, category);

} catch (error) {
    console.error("An error occurred:", error.message);
    errorMessage.textContent = "Failed to fetch news. Please try again later.";
}
}

searchButton.addEventListener("click", () => {
    errorMessage.textContent = "";
    const query = searchInput.value.trim();
    const category = selectCategory.value;
    fetchNews(query, category);
});

function displayNews(articles) {

    newsContainer.innerHTML = "";

    if (articles.length === 0) {
        newsContainer.innerHTML = "<p>Couldn't find any news</p>";
        return;
    }

    // Creates cards for every article we fetch with the API
    articles.forEach(article => {
        const articleCard = document.createElement("div");
        articleCard.classList.add("articleCard");

        articleCard.innerHTML = `
            <h2>${article.webTitle}</h2>
            <p>Category: ${article.sectionName}</p>
            <p>Published: ${article.webPublicationDate}</p>
            <a href="${article.webUrl}">Read article</a>
        `;


        const saveButton = document.createElement("button");
        saveButton.classList.add("saveButton");
        saveButton.textContent = "Save and read later";
        saveButton.addEventListener("click", () => saveArticle(article));

        articleCard.appendChild(saveButton);
        newsContainer.appendChild(articleCard);
    });
}

function renderSavedArticles() {

    savedNewsContainer.innerHTML = "";

    if (savedArticles.length === 0) {
        savedNewsContainer.innerHTML = "<p>You don't have any news saved.</p>";
        return;
    }

    // Creates cards for every article stored in localStorage
    savedArticles.forEach(article => {
        const articleCard = document.createElement("div");
        articleCard.classList.add("articleCard");

        articleCard.innerHTML = `
            <h2>${article.webTitle}</h2>
            <p>Category: ${article.sectionName}</p>
            <p>Published: ${article.webPublicationDate}</p>
            <a href="${article.webUrl}">Read article</a>
        `;

        const removeButton = document.createElement("button");
        removeButton.classList.add("removeButton");
        removeButton.textContent = "Done reading? Remove this article";
        removeButton.addEventListener("click", () => removeArticle(article));

        articleCard.appendChild(removeButton);
        savedNewsContainer.appendChild(articleCard);
    });
}

function createPages(totalPages, currentPage, query, category) {

    let pageContainer = document.getElementById("pageContainer");

    if (!pageContainer) { // Makes sure we render a new container 
        pageContainer = document.createElement("div");
        pageContainer.setAttribute("id", "pageContainer");
        newsContainer.parentNode.appendChild(pageContainer);
    } else {
        pageContainer.innerHTML = "";
    }

    totalPages = 100;

    // Vi vill visa 3 knappar
    const startPage = Math.max(1, currentPage - 1); 
    const endPage = Math.min(totalPages, startPage + 2); 

    if (startPage > 1) {

        // Creates button that directs to first page
        const firstPageButton = document.createElement("button");
        firstPageButton.textContent = "1";
        firstPageButton.addEventListener("click", () => fetchNews(query, category, 1));
        pageContainer.appendChild(firstPageButton);

        // Adds dots if we select a page bigger than 4
        if (startPage > 2) {
            const dots = document.createElement("span");
            dots.textContent = "...";
            pageContainer.appendChild(dots);
        }
    }

    // Creates buttons between our start and end page
    for (let i = startPage; i <= endPage; i++) {

        const pageButton = document.createElement("button");
        pageButton.classList.add("pageButton");
        pageButton.textContent = i;
        pageButton.addEventListener("click", () => fetchNews(query, category, i));
        pageContainer.appendChild(pageButton);
    }

    // Creates button that directs to last available page, but only if we select different page than the last
    if (endPage < totalPages) {

        // Creates dots when apprpiate
        if (endPage < totalPages - 1) {
            const dots = document.createElement("span");
            dots.textContent = "...";
            pageContainer.appendChild(dots);
        }

        const lastPageButton = document.createElement("button");
        lastPageButton.textContent = totalPages;
        lastPageButton.addEventListener("click", () => fetchNews(query, category, totalPages));
        pageContainer.appendChild(lastPageButton);
    }
}

function saveArticle(article) {
    errorMessage.textContent = "";

    if (!savedArticles.some(saved => saved.webUrl === article.webUrl)) {
        savedArticles.push(article);
        renderSavedArticles();
        saveToLocalStorage();
    } else {
        errorMessage.textContent = "You can't save the same article twice.";
    }

}

function removeArticle(article) {
    errorMessage.textContent = "";

    savedArticles = savedArticles.filter(saved => saved.webUrl !== article.webUrl);

    renderSavedArticles();
    saveToLocalStorage();
}

toggleSavedButton.addEventListener("click", () => {
    errorMessage.textContent = "";

    isSavedNewsVisible = !isSavedNewsVisible; 
    if (isSavedNewsVisible) {
        savedNewsContainer.style.display = "grid"; 
        savedNewsContainer.classList.add("active");
        toggleSavedButton.textContent = "Hide Saved Articles"; 

    } else {
        savedNewsContainer.style.display = "none"; 
        toggleSavedButton.textContent = "Show saved articles"; 
    }   
});

function saveToLocalStorage () {
    localStorage.setItem("savedArticles", JSON.stringify(savedArticles));
}

// Initial page load
fetchNews();