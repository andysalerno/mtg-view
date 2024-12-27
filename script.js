
// Sample data - replace with your actual endpoint
const CARD_IMAGE_ENDPOINT = 'https://cards.scryfall.io/normal/front/';

async function fetchCards() {
    const response = await fetch('./card_data.jsonl');
    const text = await response.text();
    const lines = text.split('\n');
    const cards = lines.map(line => JSON.parse(line));

    return cards;

    // This would be replaced with your actual API endpoint
    // return [
    //     {
    //         card_uuid: "d421208c-2f93-54aa-b8e8-ad42fe26c505",
    //         card_name: "Kaito, Cunning Infiltrator",
    //         card_text: "Whenever a creature you control deals combat damage to a player, put a loyalty counter on Kaito.\n[+1]: Up to one target creature you control can't be blocked this turn. Draw a card, then discard a card.\n[−2]: Create a 2/1 blue Ninja creature token.\n[−9]: You get an emblem with \"Whenever a player casts a spell, you create a 2/1 blue Ninja creature token.\"",
    //         output: {
    //             effects: [
    //                 { event: "addCounter", who: "you", immediate: false },
    //                 { event: "draw", who: "you", immediate: false },
    //                 { event: "discard", who: "you", immediate: false },
    //                 { event: "createToken", who: "you", immediate: false }
    //             ]
    //         }
    //     }
    //     // More cards would be here
    // ];
}

function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';

    // https://cards.scryfall.io/normal/front/d/e/de1c8758-ce3d-49cf-8173-c0eb46f5e7bc.jpg
    const img = document.createElement('img');
    img.className = 'card-image';
    const scryfall_id = card.scryfall_id;
    img.dataset.src = `${CARD_IMAGE_ENDPOINT}${scryfall_id[0]}/${scryfall_id[1]}/${scryfall_id}.jpg`;
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 336"%3E%3Crect width="100%25" height="100%25" fill="%23eee"/%3E%3C/svg%3E';
    // img.alt = card.card_name;

    const nameDiv = document.createElement('div');
    nameDiv.className = 'card-name';
    nameDiv.textContent = card.card_name;

    const textDiv = document.createElement('div');
    textDiv.className = 'card-text';
    textDiv.textContent = card.card_text;

    const effectsDiv = document.createElement('div');
    effectsDiv.className = 'effects-list';
    const effects = card.effects.map(effect =>
        `${effect.event} (${effect.who})`
    ).join(', ');
    effectsDiv.textContent = `Effects: ${effects}`;

    cardDiv.appendChild(img);
    cardDiv.appendChild(nameDiv);
    cardDiv.appendChild(textDiv);
    cardDiv.appendChild(effectsDiv);

    return cardDiv;
}

function lazyLoad() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                // Stop observing the image after loading
                observer.unobserve(img);
            }
        });
    }, {
        // Start loading when image is 50px away from viewport
        rootMargin: '50px'
    });

    // Observe all card images
    document.querySelectorAll('.card-image').forEach(img => {
        imageObserver.observe(img);
    });
}

async function initializeGrid() {
    const cardGrid = document.getElementById('cardGrid');
    const cards = await fetchCards();

    cards.forEach(card => {
        const cardElement = createCardElement(card);
        cardGrid.appendChild(cardElement);
    });
}

// Initialize the grid when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    await initializeGrid();
    lazyLoad();
});