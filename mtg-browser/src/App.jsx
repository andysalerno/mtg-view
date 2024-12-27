import React, { useState, useEffect, useRef, memo } from 'react';
import { Search } from 'lucide-react';

const CARD_IMAGE_ENDPOINT = 'https://cards.scryfall.io/normal/front/';

// LazyImage component with intersection observer
const LazyImage = memo(({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading when image is 50px from viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={imgRef}
      className={`${className} ${!isLoaded ? 'bg-gray-200 animate-pulse' : ''}`}
    >
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-contain transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            e.target.src = '/card_img/placeholder.jpg';
            e.target.onerror = null;
            setIsLoaded(true);
          }}
          loading="lazy"
        />
      )}
    </div>
  );
});

const MTGCardsGrid = () => {
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [eventFilter, setEventFilter] = useState('');
  const [whoFilter, setWhoFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch('/card_data.jsonl');
        if (!response.ok) {
          throw new Error('Failed to fetch cards data');
        }
        const text = await response.text();
        const parsedCards = text.split('\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line));
        setCards(parsedCards);
        setFilteredCards(parsedCards);
      } catch (error) {
        console.error('Error loading cards:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCards();
  }, []);

  useEffect(() => {
    let filtered = cards;

    if (eventFilter || whoFilter) {
      filtered = cards.filter(card => {
        return card.effects?.some(effect => {
          const matchesEvent = !eventFilter || effect.event === eventFilter;
          const matchesWho = !whoFilter || effect.who === whoFilter;
          return matchesEvent && matchesWho;
        });
      });
    }

    setFilteredCards(filtered);
  }, [cards, eventFilter, whoFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-bold mb-2">Error Loading Cards</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      {/* Filter Controls */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow sticky top-0 z-10">
        <h1 className="text-2xl font-bold mb-4">MTG Cards Browser</h1>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            >
              <option value="">All Events</option>
              <option value="discard">Discard</option>
              <option value="draw">Draw</option>
              <option value="mill">Mill</option>
              <option value="createToken">Create Token</option>
            </select>
          </div>

          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={whoFilter}
              onChange={(e) => setWhoFilter(e.target.value)}
            >
              <option value="">All Targets</option>
              <option value="opponent">Opponent</option>
              <option value="player">Player</option>
              <option value="you">You</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredCards.map((card) => (
          <div key={card.mtgjson_uuid} className="bg-white rounded-lg shadow overflow-hidden">
            <LazyImage
              src={`${CARD_IMAGE_ENDPOINT}${card.scryfall_id[0]}/${card.scryfall_id[1]}/${card.scryfall_id}.jpg`}
              alt={card.card_name}
              className="w-full aspect-[7/5]"
            />
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2">{card.card_name}</h3>
              <p className="text-sm text-gray-600 mb-3">{card.card_text}</p>

              {/* Effects List */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700">Effects:</h4>
                {card.effects?.map((effect, index) => (
                  <div
                    key={index}
                    className="text-sm bg-gray-50 p-2 rounded"
                  >
                    <span className="font-medium">{effect.event}</span>
                    {effect.who && (
                      <span className="text-gray-600"> → {effect.who}</span>
                    )}
                    {effect.immediate === false && (
                      <span className="text-gray-500 text-xs"> (delayed)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results Message */}
      {filteredCards.length === 0 && (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No cards found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
};

export default MTGCardsGrid;