const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const clearButton = document.getElementById("clear-button");
const resultsSection = document.getElementById("recommendations");
const resultsGrid = document.getElementById("results-grid");
const resultStatus = document.getElementById("result-status");
const contactForm = document.getElementById("contact-form");
const formMessage = document.getElementById("form-message");

let recommendations = null;

async function loadRecommendations() {
	if (recommendations) return recommendations;

	const response = await fetch("travel_recommendation_api.json");
	if (!response.ok) throw new Error("Impossible de charger les recommandations.");
	recommendations = await response.json();
	return recommendations;
}

function normalize(value) {
	return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getMatches(data, keyword) {
	const aliases = {
		plage: ["plage", "plages", "beach", "beaches"],
		temple: ["temple", "temples"],
		pays: ["pays", "country", "countries"]
	};
	const category = Object.keys(aliases).find((name) => aliases[name].includes(keyword));

	if (category === "plage") return data.beaches || [];
	if (category === "temple") return data.temples || [];
	if (category === "pays") return data.countries?.flatMap((country) => country.cities || []) || [];

	return [...(data.beaches || []), ...(data.temples || []), ...(data.countries || []).flatMap((country) => country.cities || [])]
		.filter((item) => normalize(`${item.name} ${item.description}`).includes(keyword));
}

function renderResults(items, keyword) {
	resultsGrid.replaceChildren();
	resultStatus.textContent = items.length ? `${items.length} recommandation${items.length > 1 ? "s" : ""} pour « ${keyword} »` : `Aucun résultat pour « ${keyword} »`;

	items.forEach((item) => {
		const card = document.createElement("article");
		card.className = "result-card";
		card.innerHTML = `<img src="${item.imageUrl}" alt="${item.name}" loading="lazy"><div class="result-card-content"><h3>${item.name}</h3><p>${item.description}</p></div>`;
		resultsGrid.append(card);
	});

	resultsSection.classList.add("visible");
	resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

searchForm.addEventListener("submit", async (event) => {
	event.preventDefault();
	const keyword = normalize(searchInput.value);
	if (!keyword) return;

	resultStatus.textContent = "Chargement des recommandations...";
	resultsSection.classList.add("visible");
	try {
		const data = await loadRecommendations();
		renderResults(getMatches(data, keyword), keyword);
	} catch (error) {
		resultStatus.textContent = error.message;
		resultsGrid.replaceChildren();
	}
});

clearButton.addEventListener("click", () => {
	searchInput.value = "";
	resultsGrid.replaceChildren();
	resultStatus.textContent = "";
	resultsSection.classList.remove("visible");
	searchInput.focus();
});

document.querySelectorAll(".main-nav a").forEach((link) => {
	link.addEventListener("click", () => {
		document.querySelectorAll(".info-section").forEach((section) => section.classList.remove("visible"));
		const target = document.querySelector(link.getAttribute("href"));
		if (target?.classList.contains("info-section")) target.classList.add("visible");
	});
});

contactForm.addEventListener("submit", (event) => {
	event.preventDefault();
	formMessage.textContent = "Merci, votre message a bien été envoyé.";
	contactForm.reset();
});
