const API_KEY = "394cb0512ad744f5ba55fafbff36e38b";  
const url = "https://newsapi.org/v2/everything?language=en&sortBy=publishedAt&q=";

// === AI Summarization API ===
const summaryAPI = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";
const googleAPIKey = "AIzaSyBV1sUFbLuU1Lgfozf7h_xOJoA4pdEcKmQ";

// === WordPress Credentials ===
const wordpressURL = "https://yourwordpresssite.com/wp-json/wp/v2/posts";  
const wordpressUsername = "your_username";
const wordpressPassword = "your_password";  
const authHeader = "Basic " + btoa(`${wordpressUsername}:${wordpressPassword}`);

// === State-City Mapping ===
const citiesByState = {
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Noida", "Ghaziabad"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane"],
    "Delhi": ["New Delhi"],
    "Karnataka": ["Bangalore", "Mysore", "Mangalore", "Hubli", "Belgaum"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
    "Rajasthan": ["Jaipur", "Udaipur", "Jodhpur", "Kota", "Bikaner"],
    "Punjab": ["Chandigarh", "Amritsar", "Ludhiana", "Jalandhar", "Patiala"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
    "Haryana": ["Gurgaon", "Faridabad", "Panipat", "Rohtak"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba"],
    "Assam": ["Guwahati", "Dibrugarh", "Jorhat", "Silchar"]
};

// === Navigation Categories ===
const categories = ["IPL", "Sports", "Technology", "Politics", "Business"];

// === Selectors ===
const stateSelect = document.getElementById("state-select");
const citySelect = document.getElementById("city-select");
const searchButton = document.getElementById("search-button");
const searchText = document.getElementById("search-text");
const navLinks = document.querySelector(".nav-links ul");
const cardsContainer = document.getElementById("cards-container");
const newsCardTemplate = document.getElementById("template-news-card");

// === Initialize Navigation Bar ===
document.addEventListener("DOMContentLoaded", () => {
    navLinks.innerHTML = ""; // Clear previous categories

    categories.forEach(category => {
        const li = document.createElement("li");
        li.classList.add("hover-link", "nav-item");
        li.textContent = category;
        li.onclick = () => fetchCategoryNews(category);
        navLinks.appendChild(li);
    });

    fetchNews("India");  // Default news on load
});

// === Search Functionality ===
searchButton.addEventListener("click", () => {
    const query = searchText.value.trim();
    if (query) fetchNews(query);
});

// === Populate Cities Based on State Selection ===
stateSelect.addEventListener("change", () => {
    citySelect.innerHTML = '<option value="">Select City</option>';
    const selectedState = stateSelect.value;
    
    if (citiesByState[selectedState]) {
        citiesByState[selectedState].forEach(city => {
            const option = document.createElement("option");
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    }
});

// === Fetch News with Improved Accuracy ===
async function fetchNews(query) {
    try {
        const res = await fetch(`${url}"${query}"&apiKey=${API_KEY}`);
        if (!res.ok) throw new Error("Failed to fetch news");
        const data = await res.json();
        console.log("Fetched Articles:", data.articles);
        bindData(data.articles);
    } catch (error) {
        console.error("Error fetching news:", error);
    }
}

// === Fetch More Precise Category-Based News ===
async function fetchCategoryNews(category) {
    const location = citySelect.value || stateSelect.value || "India"; // Use selected location or default to India
    const query = `"${category}" AND ("${location}")`;

    try {
        const res = await fetch(`${url}${query}&apiKey=${API_KEY}`);
        if (!res.ok) throw new Error("Failed to fetch news");
        const data = await res.json();
        bindData(data.articles.filter(article => article.title.toLowerCase().includes(category.toLowerCase())));
    } catch (error) {
        console.error("Error fetching category news:", error);
    }
}

// === Fetch More Precise Location-Based News ===
citySelect.addEventListener("change", () => {
    const selectedCity = citySelect.value;
    const selectedState = stateSelect.value;
    
    if (selectedCity) {
        fetchNews(`"${selectedCity}" OR "${selectedState}"`);
    }
});

// === Bind Data to UI ===
function bindData(articles) {
    cardsContainer.innerHTML = ""; // Clear previous content

    articles.forEach(article => {
        if (!article.urlToImage) return;
        const cardClone = newsCardTemplate.content.cloneNode(true);
        fillDataInCard(cardClone, article);
        cardsContainer.appendChild(cardClone);
    });
}

// === Fill News Card Data ===
function fillDataInCard(cardClone, article) {
    const newsImg = cardClone.querySelector("#news-img");
    const newsTitle = cardClone.querySelector("#news-title");
    const newsSource = cardClone.querySelector("#news-source");
    const newsDesc = cardClone.querySelector("#news-desc");

    newsImg.src = article.urlToImage;
    newsTitle.innerHTML = article.title;
    newsDesc.innerHTML = `<strong>Description:</strong> ${article.description || "No description available."}`;

    const summaryBtn = document.createElement("button");
    summaryBtn.innerText = "Summarize";
    summaryBtn.classList.add("summary-btn");
    summaryBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        summarizeArticle(article.description || article.content, summaryBtn, article);
    });
    newsDesc.appendChild(summaryBtn);

    const date = new Date(article.publishedAt).toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
    });

    newsSource.innerHTML = `${article.source.name} · ${date}`;

    cardClone.firstElementChild.addEventListener("click", () => {
        window.open(article.url, "_blank");
    });
}

// === Summarize News Using AI ===
async function summarizeArticle(text, button, article) {
    button.innerText = "Summarizing...";
    button.style.backgroundColor = "#f39c12";

    try {
        const response = await fetch(`${summaryAPI}?key=${googleAPIKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ 
                    role: "user", 
                    parts: [{ text: `Summarize this article into 150-200 words, optimized for SEO: ${text}` }]
                }]
            }),
        });

        if (!response.ok) throw new Error("Failed to fetch summary");

        const data = await response.json();
        let summary = data.candidates?.[0]?.content?.parts?.[0]?.text || "No summary available.";
        showPopup(summary, button);
        await publishToWordPress(article, summary);
    } catch (error) {
        console.error("Error in summarization API:", error);
        button.innerText = "Summary Failed";
        button.style.backgroundColor = "#e74c3c";
    }
}

// === Show Summary in a Popup ===
function showPopup(summary, button) {
    const popup = document.createElement("div");
    popup.innerHTML = `<div class="popup-overlay"><div class="popup-content"><h3>News Summary</h3>${summary}<button onclick="closePopup()" class="popup-close">Close</button></div></div>`;
    document.body.appendChild(popup);
    button.innerText = "Summarize";
}

// === Close Popup ===
function closePopup() {
    document.querySelector(".popup-overlay").remove();
}
